import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { VOTE_TYPES } from '../utils/constants';

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

  // Cast a vote on a proposal
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
      
      setVoting({ 
        loading: false, 
        error: null, 
        success: true,
        lastVotedProposalId: proposalId
      });
      
      return {
        success: true,
        votingPower: ethers.utils.formatEther(votingPower),
        voteType
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
    voting
  };
}