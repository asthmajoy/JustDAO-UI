import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { PROPOSAL_STATES, PROPOSAL_TYPES } from '../utils/constants';

export function useProposals() {
  const { contracts, account } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProposals = useCallback(async () => {
    if (!contracts.governance) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // This is a simplified implementation. In a real app, you'd use events or a subgraph
      // to get all proposal IDs, or use an API to fetch proposals.
      const mockProposals = [];
      
      // In a real implementation, we'd use events to get all proposal IDs
      // For now, we'll check the last 20 proposal IDs as a simplified approach
      for (let i = 0; i < 20; i++) {
        try {
          const proposalState = await contracts.governance.getProposalState(i);
          const proposalData = await contracts.governance._proposals(i);
          
          // Format the proposal data
          const formattedProposal = {
            id: i,
            title: extractTitleFromDescription(proposalData.description),
            description: proposalData.description,
            proposer: proposalData.proposer,
            deadline: new Date(proposalData.deadline.toNumber() * 1000),
            createdAt: new Date(proposalData.createdAt.toNumber() * 1000),
            state: proposalState,
            stateLabel: getProposalStateLabel(proposalState),
            type: proposalData.pType,
            typeLabel: getProposalTypeLabel(proposalData.pType),
            yesVotes: ethers.utils.formatEther(proposalData.yesVotes),
            noVotes: ethers.utils.formatEther(proposalData.noVotes),
            abstainVotes: ethers.utils.formatEther(proposalData.abstainVotes),
            timelockTxHash: proposalData.timelockTxHash,
            hasVoted: false
          };
          
          // Check if the user has voted on this proposal
          if (account) {
            const votingPower = await contracts.governance.proposalVoterInfo(i, account);
            formattedProposal.hasVoted = !votingPower.isZero();
          }
          
          mockProposals.push(formattedProposal);
        } catch (err) {
          // Skip if proposal doesn't exist
          continue;
        }
      }
      
      setProposals(mockProposals);
    } catch (err) {
      console.error("Error fetching proposals:", err);
      setError("Failed to fetch proposals");
    } finally {
      setLoading(false);
    }
  }, [contracts.governance, account]);

  useEffect(() => {
    if (contracts.governance) {
      fetchProposals();
    }
  }, [contracts.governance, fetchProposals]);

  const createProposal = async (proposalData) => {
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      const tx = await contracts.governance.createProposal(
        proposalData.description,
        proposalData.type,
        proposalData.target || ethers.constants.AddressZero,
        proposalData.callData || "0x",
        proposalData.amount ? ethers.utils.parseEther(proposalData.amount.toString()) : 0,
        proposalData.recipient || ethers.constants.AddressZero,
        proposalData.token || ethers.constants.AddressZero,
        proposalData.newThreshold ? ethers.utils.parseEther(proposalData.newThreshold.toString()) : 0,
        proposalData.newQuorum ? ethers.utils.parseEther(proposalData.newQuorum.toString()) : 0,
        proposalData.newVotingDuration || 0,
        proposalData.newTimelockDelay || 0
      );
      
      const receipt = await tx.wait();
      
      // Refresh proposals list
      await fetchProposals();
      
      return receipt;
    } catch (err) {
      console.error("Error creating proposal:", err);
      throw err;
    }
  };

  const cancelProposal = async (proposalId) => {
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      const tx = await contracts.governance.cancelProposal(proposalId);
      const receipt = await tx.wait();
      
      // Refresh proposals list
      await fetchProposals();
      
      return receipt;
    } catch (err) {
      console.error("Error canceling proposal:", err);
      throw err;
    }
  };

  const queueProposal = async (proposalId) => {
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      const tx = await contracts.governance.queueProposal(proposalId);
      const receipt = await tx.wait();
      
      // Refresh proposals list
      await fetchProposals();
      
      return receipt;
    } catch (err) {
      console.error("Error queuing proposal:", err);
      throw err;
    }
  };

  const executeProposal = async (proposalId) => {
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      const tx = await contracts.governance.executeProposal(proposalId);
      const receipt = await tx.wait();
      
      // Refresh proposals list
      await fetchProposals();
      
      return receipt;
    } catch (err) {
      console.error("Error executing proposal:", err);
      throw err;
    }
  };

  const claimRefund = async (proposalId) => {
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      const tx = await contracts.governance.claimPartialStakeRefund(proposalId);
      const receipt = await tx.wait();
      
      // Refresh proposals list
      await fetchProposals();
      
      return receipt;
    } catch (err) {
      console.error("Error claiming refund:", err);
      throw err;
    }
  };

  // Helper function to extract a title from the proposal description
  function extractTitleFromDescription(description) {
    if (!description) return "Untitled Proposal";
    
    // Assuming the first line or first sentence is the title
    const firstLine = description.split('\n')[0];
    if (firstLine.length <= 80) return firstLine;
    
    const firstSentence = description.split('.')[0];
    if (firstSentence.length <= 80) return firstSentence + ".";
    
    return firstSentence.substring(0, 77) + "...";
  }

  // Helper function to get human-readable proposal state label
  function getProposalStateLabel(state) {
    const stateLabels = {
      [PROPOSAL_STATES.ACTIVE]: "Active",
      [PROPOSAL_STATES.CANCELED]: "Canceled",
      [PROPOSAL_STATES.DEFEATED]: "Defeated",
      [PROPOSAL_STATES.SUCCEEDED]: "Succeeded",
      [PROPOSAL_STATES.QUEUED]: "Queued",
      [PROPOSAL_STATES.EXECUTED]: "Executed",
      [PROPOSAL_STATES.EXPIRED]: "Expired"
    };
    
    return stateLabels[state] || "Unknown";
  }

  // Helper function to get human-readable proposal type label
  function getProposalTypeLabel(type) {
    const typeLabels = {
      [PROPOSAL_TYPES.GENERAL]: "General",
      [PROPOSAL_TYPES.WITHDRAWAL]: "Withdrawal",
      [PROPOSAL_TYPES.TOKEN_TRANSFER]: "Token Transfer",
      [PROPOSAL_TYPES.GOVERNANCE_CHANGE]: "Governance Change",
      [PROPOSAL_TYPES.EXTERNAL_ERC20_TRANSFER]: "External ERC20 Transfer",
      [PROPOSAL_TYPES.TOKEN_MINT]: "Token Mint",
      [PROPOSAL_TYPES.TOKEN_BURN]: "Token Burn"
    };
    
    return typeLabels[type] || "Unknown";
  }

  return {
    proposals,
    loading,
    error,
    fetchProposals,
    createProposal,
    cancelProposal,
    queueProposal,
    executeProposal,
    claimRefund
  };
}