import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { VOTE_TYPES } from '../utils/constants';

// Export as both named and default export to support both import styles
export function useVoting() {
  const { contracts, account, isConnected, contractsReady, refreshCounter } = useWeb3();
  const [voting, setVoting] = useState({
    loading: false,
    error: null,
    success: false,
    lastVotedProposalId: null
  });

  // Get snapshot ID for a proposal using events
  const getProposalSnapshotId = useCallback(async (proposalId) => {
    if (!contracts.governance) return 0;
    
    try {
      // Try to find the creation event for this proposal
      const filter = contracts.governance.filters.ProposalEvent(proposalId, 0); // Type 0 is creation event
      const events = await contracts.governance.queryFilter(filter);
      
      if (events.length > 0) {
        const creationEvent = events[0];
        
        // Try to decode the data which contains type and snapshotId
        try {
          const data = creationEvent.args.data;
          const decoded = ethers.utils.defaultAbiCoder.decode(['uint8', 'uint256'], data);
          return decoded[1].toNumber(); // The snapshotId is the second parameter
        } catch (decodeErr) {
          console.warn("Couldn't decode event data for snapshot ID:", decodeErr);
        }
      }
      
      // If we can't get it from events, try to get the current snapshot as fallback
      return await contracts.token.getCurrentSnapshotId();
    } catch (err) {
      console.warn("Error getting proposal snapshot ID:", err);
      // Return the current snapshot as fallback
      try {
        return await contracts.token.getCurrentSnapshotId();
      } catch (fallbackErr) {
        console.error("Error getting current snapshot ID:", fallbackErr);
        return 0;
      }
    }
  }, [contracts]);

  // ENHANCED FUNCTION: Get proposal vote totals from contract events
  const getProposalVoteTotals = useCallback(async (proposalId) => {
    try {
      if (!contracts.governance || !contracts.governance.provider) {
        console.error("Governance contract or provider not available");
        return { yesVotes: 0, noVotes: 0, abstainVotes: 0, totalVotes: 0, totalVoters: 0 };
      }
      
      console.log(`Fetching vote data for proposal #${proposalId} directly from contract...`);
      
      // Try to access the proposal vote data directly through contract calls
      // First, we need to check if the proposal exists by calling getProposalState
      let proposalState;
      try {
        proposalState = await contracts.governance.getProposalState(proposalId);
        console.log(`Proposal #${proposalId} exists with state:`, proposalState);
      } catch (error) {
        console.error(`Error getting proposal state for proposal #${proposalId}:`, error);
        return { yesVotes: 0, noVotes: 0, abstainVotes: 0, totalVotes: 0, totalVoters: 0 };
      }
      
      // Since we don't have direct access to the proposal struct's vote counts,
      // we'll use a combination of methods:
      
      // 1. Try to get vote data from events (as we did before)
      const eventSignature = "VoteCast(uint256,address,uint8,uint256)";
      const eventTopic = ethers.utils.id(eventSignature);
      
      const filter = {
        address: contracts.governance.address,
        topics: [
          eventTopic,
          ethers.utils.hexZeroPad(ethers.utils.hexlify(proposalId), 32)
        ],
        fromBlock: 0,
        toBlock: 'latest'
      };
      
      const logs = await contracts.governance.provider.getLogs(filter);
      console.log(`Found ${logs.length} VoteCast events for proposal #${proposalId}`);
      
      // Process the logs to count votes
      let yesVotes = 0, noVotes = 0, abstainVotes = 0;
      const voters = new Set();
      
      for (const log of logs) {
        try {
          const parsedLog = new ethers.utils.Interface([
            "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 votingPower)"
          ]).parseLog(log);
          
          const voter = parsedLog.args.voter.toLowerCase();
          const support = Number(parsedLog.args.support);
          let votingPower;
          
          // Handle different types of BigNumber formats
          if (parsedLog.args.votingPower._isBigNumber) {
            votingPower = parsedLog.args.votingPower.toNumber();
          } else if (typeof parsedLog.args.votingPower === 'object') {
            votingPower = Number(parsedLog.args.votingPower.toString());
          } else {
            votingPower = Number(parsedLog.args.votingPower);
          }
          
          voters.add(voter);
          
          if (support === 0) noVotes += votingPower;
          else if (support === 1) yesVotes += votingPower;
          else if (support === 2) abstainVotes += votingPower;
        } catch (error) {
          console.warn("Error parsing vote log:", error);
        }
      }
      
      // 2. Also try to get account-specific vote data for connected account
      if (account) {
        try {
          const voterInfo = await contracts.governance.proposalVoterInfo(proposalId, account);
          
          // If there's a non-zero value, the user has voted
          if (!voterInfo.isZero()) {
            // Determine the vote type by checking events
            const userFilter = contracts.governance.filters.VoteCast(proposalId, account);
            const userEvents = await contracts.governance.queryFilter(userFilter);
            
            if (userEvents.length > 0) {
              const latestEvent = userEvents[userEvents.length - 1];
              const support = Number(latestEvent.args.support);
              
              // Make sure this user's vote is included even if it wasn't in the general logs
              if (!voters.has(account.toLowerCase())) {
                voters.add(account.toLowerCase());
                
                // Add voting power to the appropriate category if not already counted
                let votingPower;
                if (voterInfo._isBigNumber) {
                  votingPower = voterInfo.toNumber();
                } else {
                  votingPower = Number(voterInfo.toString());
                }
                
                if (support === 0) noVotes += votingPower;
                else if (support === 1) yesVotes += votingPower; 
                else if (support === 2) abstainVotes += votingPower;
              }
            }
          }
        } catch (error) {
          console.warn("Error checking user-specific vote info:", error);
        }
      }
      
      const totalVotes = yesVotes + noVotes + abstainVotes;
      const totalVoters = voters.size;
      
      console.log(`Vote tally for proposal #${proposalId}:`, {
        yesVotes, noVotes, abstainVotes, totalVotes, totalVoters
      });
      
      // Handle percentages to avoid NaN if totalVotes is 0
      let yesPercentage = 0;
      let noPercentage = 0;
      let abstainPercentage = 0;
      
      if (totalVotes > 0) {
        yesPercentage = (yesVotes / totalVotes) * 100;
        noPercentage = (noVotes / totalVotes) * 100;
        abstainPercentage = (abstainVotes / totalVotes) * 100;
      }
      
      return {
        yesVotes,
        noVotes,
        abstainVotes,
        totalVotes,
        totalVoters,
        yesPercentage,
        noPercentage,
        abstainPercentage
      };
    } catch (error) {
      console.error("Error getting vote totals:", error);
      return {
        yesVotes: 0,
        noVotes: 0,
        abstainVotes: 0,
        totalVotes: 0,
        totalVoters: 0,
        yesPercentage: 0,
        noPercentage: 0,
        abstainPercentage: 0
      };
    }
  }, [contracts, account]);

  // Enhanced vote casting with better error handling and immediate vote data update
  const castVote = async (proposalId, voteType) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected to blockchain");
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      setVoting({ 
        loading: true, 
        error: null, 
        success: false,
        lastVotedProposalId: null
      });
      
      console.log(`Attempting to cast vote on proposal ${proposalId} with vote type ${voteType}`);
      
      // Validate vote type
      if (![VOTE_TYPES.AGAINST, VOTE_TYPES.FOR, VOTE_TYPES.ABSTAIN].includes(Number(voteType))) {
        throw new Error("Invalid vote type. Must be 0 (Against), 1 (For), or 2 (Abstain)");
      }
      
      // Check if the proposal is active
      const proposalState = await contracts.governance.getProposalState(proposalId);
      if (proposalState !== 0) { // 0 = Active
        throw new Error("Proposal is not active. Cannot vote on inactive proposals.");
      }
      
      // Check if the user has already voted
      const hasAlreadyVoted = await hasVoted(proposalId);
      if (hasAlreadyVoted) {
        throw new Error("You have already voted on this proposal");
      }
      
      // Get the snapshot ID using our new approach
      const snapshotId = await getProposalSnapshotId(proposalId);
      
      // Check if the user has any voting power
      const votingPower = await contracts.token.getEffectiveVotingPower(account, snapshotId);
      
      if (votingPower.isZero()) {
        throw new Error("You don't have any voting power for this proposal. You may need to delegate to yourself or acquire tokens before the snapshot.");
      }
      
      console.log(`Casting vote with ${ethers.utils.formatEther(votingPower)} voting power`);
      
      // Cast the vote with proper gas limit to prevent issues
      const tx = await contracts.governance.castVote(proposalId, voteType, {
        gasLimit: 300000 // Set a reasonable gas limit
      });
      
      const receipt = await tx.wait();
      console.log("Vote transaction confirmed:", receipt.transactionHash);
      
      // Try to update vote data immediately after successful vote
      try {
        // Force a small delay to allow the blockchain to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Manually check for the new vote event
        const voteFilter = contracts.governance.filters.VoteCast(proposalId, account);
        const voteEvents = await contracts.governance.queryFilter(voteFilter, receipt.blockNumber, receipt.blockNumber);
        
        if (voteEvents.length > 0) {
          console.log("Vote event confirmed on chain:", voteEvents[0]);
        } else {
          console.warn("Vote transaction successful but event not found. This is unusual.");
        }
      } catch (updateErr) {
        console.warn("Error checking for vote event after transaction:", updateErr);
      }
      
      setVoting({ 
        loading: false, 
        error: null, 
        success: true,
        lastVotedProposalId: proposalId
      });
      
      return {
        success: true,
        votingPower: ethers.utils.formatEther(votingPower),
        voteType,
        transactionHash: receipt.transactionHash
      };
    } catch (err) {
      console.error("Error casting vote:", err);
      const errorMessage = err.reason || err.message || "Unknown error";
      
      setVoting({ 
        loading: false, 
        error: errorMessage, 
        success: false,
        lastVotedProposalId: null
      });
      
      throw err;
    }
  };
  
  // Check if user has voted on a specific proposal
  const hasVoted = useCallback(async (proposalId) => {
    if (!isConnected || !contractsReady || !account) return false;
    if (!contracts.governance) return false;
    
    try {
      // Check if user has voted on this proposal
      const voterInfo = await contracts.governance.proposalVoterInfo(proposalId, account);
      return !voterInfo.isZero();
    } catch (err) {
      console.error(`Error checking if user has voted on proposal ${proposalId}:`, err);
      return false;
    }
  }, [contracts, account, isConnected, contractsReady]);
  
  // Get the voting power of the user for a specific snapshot
  const getVotingPower = useCallback(async (snapshotId) => {
    if (!isConnected || !contractsReady || !account) return "0";
    if (!contracts.token) return "0";
    
    try {
      console.log(`Getting voting power for snapshot ${snapshotId}`);
      
      // If no snapshot ID is provided, get the current one
      let actualSnapshotId = snapshotId;
      
      if (!actualSnapshotId) {
        actualSnapshotId = await contracts.token.getCurrentSnapshotId();
      }
      
      const votingPower = await contracts.token.getEffectiveVotingPower(account, actualSnapshotId);
      const formattedPower = ethers.utils.formatEther(votingPower);
      
      console.log(`Voting power at snapshot ${actualSnapshotId}: ${formattedPower}`);
      return formattedPower;
    } catch (err) {
      console.error("Error getting voting power:", err);
      return "0";
    }
  }, [contracts, account, isConnected, contractsReady]);
  
  // Get detailed information about how a user voted on a proposal
  const getVoteDetails = useCallback(async (proposalId) => {
    if (!isConnected || !contractsReady || !account) {
      return { hasVoted: false, votingPower: "0", voteType: null };
    }
    
    try {
      // First check if the user has voted
      const voterInfo = await contracts.governance.proposalVoterInfo(proposalId, account);
      
      if (voterInfo.isZero()) {
        return { hasVoted: false, votingPower: "0", voteType: null };
      }
      
      // Try to determine how they voted by checking events
      const votingPower = ethers.utils.formatEther(voterInfo);
      let voteType = null;
      
      try {
        // Check for VoteCast events for this proposal and user
        const filter = contracts.governance.filters.VoteCast(proposalId, account);
        const events = await contracts.governance.queryFilter(filter);
        
        if (events.length > 0) {
          // Use the most recent vote (in case of any issues)
          const latestEvent = events[events.length - 1];
          voteType = latestEvent.args.support;
        }
      } catch (err) {
        console.warn("Couldn't determine vote type from events:", err);
      }
      
      return {
        hasVoted: true,
        votingPower: votingPower,
        voteType: voteType
      };
    } catch (err) {
      console.error("Error getting vote details:", err);
      return { hasVoted: false, votingPower: "0", voteType: null };
    }
  }, [contracts, account, isConnected, contractsReady]);

  // Clear voting state when dependencies change
  useEffect(() => {
    setVoting({
      loading: false,
      error: null,
      success: false,
      lastVotedProposalId: null
    });
  }, [account, isConnected, contractsReady, refreshCounter]);

  return {
    castVote,
    hasVoted,
    getVotingPower,
    getVoteDetails,
    getProposalVoteTotals, // Added the new function to the return object
    voting
  };
}

// Also export as default for components using default import
export default useVoting;