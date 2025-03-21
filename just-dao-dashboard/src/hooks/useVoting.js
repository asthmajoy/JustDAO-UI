import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { VOTE_TYPES } from '../utils/constants';

export function useVoting() {
  const { contracts } = useWeb3();
  const [voting, setVoting] = useState({
    loading: false,
    error: null,
    success: false
  });

  const castVote = async (proposalId, voteType) => {
    if (!contracts.governance) {
      throw new Error("Governance contract not initialized");
    }
    
    try {
      setVoting({ loading: true, error: null, success: false });
      
      // Validate vote type
      if (![VOTE_TYPES.AGAINST, VOTE_TYPES.FOR, VOTE_TYPES.ABSTAIN].includes(voteType)) {
        throw new Error("Invalid vote type");
      }
      
      const tx = await contracts.governance.castVote(proposalId, voteType);
      const receipt = await tx.wait();
      
      setVoting({ loading: false, error: null, success: true });
      return receipt;
    } catch (err) {
      console.error("Error casting vote:", err);
      setVoting({ loading: false, error: err.message, success: false });
      throw err;
    }
  };
  
  const hasVoted = async (proposalId, account) => {
    if (!contracts.governance || !account) {
      return false;
    }
    
    try {
      // Check if user has voted on this proposal
      const votingPower = await contracts.governance.proposalVoterInfo(proposalId, account);
      return !votingPower.isZero();
    } catch (err) {
      console.error("Error checking if user has voted:", err);
      return false;
    }
  };
  
  const getVotingPower = async (account, snapshotId) => {
    if (!contracts.token || !account) {
      return 0;
    }
    
    try {
      const votingPower = await contracts.token.getEffectiveVotingPower(account, snapshotId);
      return votingPower;
    } catch (err) {
      console.error("Error getting voting power:", err);
      return 0;
    }
  };

  return {
    castVote,
    hasVoted,
    getVotingPower,
    voting
  };
}