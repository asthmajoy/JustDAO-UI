// useVoting.js - Fixed implementation for voting functionality

import { useState, useCallback } from 'react';
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

  // Cast a vote on a proposal
  const castVote = async (proposalId, voteType) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      setVoting({ 
        loading: true, 
        error: null, 
        success: false,
        lastVotedProposalId: null
      });
      
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
      const existingVote = await contracts.governance.proposalVoterInfo(proposalId, account);
      if (!existingVote.isZero()) {
        throw new Error("You have already voted on this proposal");
      }
      
      // Check if the user has any voting power
      const proposalDetails = await contracts.governance._proposals(proposalId);
      const snapshotId = proposalDetails.snapshotId;
      const votingPower = await contracts.token.getEffectiveVotingPower(account, snapshotId);
      
      if (votingPower.isZero()) {
        throw new Error("You don't have any voting power for this proposal");
      }
      
      console.log(`Casting vote on proposal ${proposalId} with vote type ${voteType}`);
      
      // Cast the vote
      const tx = await contracts.governance.castVote(proposalId, voteType, {
        gasLimit: 200000 // Set a reasonable gas limit
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
      setVoting({ 
        loading: false, 
        error: err.message, 
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
      const votingPower = await contracts.governance.proposalVoterInfo(proposalId, account);
      return !votingPower.isZero();
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
      // If no snapshot ID is provided, get the current one
      let actualSnapshotId = snapshotId;
      
      if (!actualSnapshotId) {
        actualSnapshotId = await contracts.token.getCurrentSnapshotId();
      }
      
      const votingPower = await contracts.token.getEffectiveVotingPower(account, actualSnapshotId);
      return ethers.utils.formatEther(votingPower);
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
      const votingPower = await contracts.governance.proposalVoterInfo(proposalId, account);
      
      if (votingPower.isZero()) {
        return { hasVoted: false, votingPower: "0", voteType: null };
      }
      
      // Try to determine how they voted
      // This is tricky since the contract doesn't store the vote type directly
      // We need to check vote cast events
      let voteType = null;
      
      try {
        // Check for VoteCast events for this proposal and user
        const filter = contracts.governance.filters.VoteCast(proposalId, account);
        const events = await contracts.governance.queryFilter(filter);
        
        if (events.length > 0) {
          // Use the most recent vote (in case of any bugs/issues)
          const latestEvent = events[events.length - 1];
          voteType = latestEvent.args.support;
        }
      } catch (err) {
        console.warn("Couldn't determine vote type from events:", err);
      }
      
      return {
        hasVoted: true,
        votingPower: ethers.utils.formatEther(votingPower),
        voteType
      };
    } catch (err) {
      console.error("Error getting vote details:", err);
      return { hasVoted: false, votingPower: "0", voteType: null };
    }
  }, [contracts, account, isConnected, contractsReady]);

  return {
    castVote,
    hasVoted,
    getVotingPower,
    getVoteDetails,
    voting
  };
}