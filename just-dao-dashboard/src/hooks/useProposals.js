// useProposals.js - Enhanced hook for proposal creation and management

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { PROPOSAL_STATES, PROPOSAL_TYPES } from '../utils/constants';

export function useProposals() {
  const { contracts, account, isConnected, contractsReady, refreshCounter } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenHolders, setTokenHolders] = useState([]);
  const [createProposalStatus, setCreateProposalStatus] = useState({
    isSubmitting: false,
    error: null,
    success: false
  });

  const fetchProposals = useCallback(async () => {
    if (!isConnected || !contractsReady || !contracts.governance) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching proposals...");
      
      // Find the upper limit of proposal IDs
      let maxId = 0;
      let foundEnd = false;
      
      // Try to find the most recent proposal ID
      // Start from a reasonable number and go backward to find the first valid proposal
      for (let i = 100; i >= 0 && !foundEnd; i--) {
        try {
          await contracts.governance.getProposalState(i);
          maxId = i;
          foundEnd = true;
          console.log("Found max proposal ID:", maxId);
        } catch (err) {
          // Keep searching
        }
      }
      
      // Check all possible proposal IDs from 0 to maxId
      const proposalData = [];
      const uniqueProposers = new Set();
      
      for (let i = 0; i <= maxId; i++) {
        try {
          console.log("Checking proposal ID:", i);
          const proposalState = await contracts.governance.getProposalState(i);
          
          // Limit requests to avoid rate limiting
          if (i % 5 === 0 && i > 0) {
            await new Promise(r => setTimeout(r, 300));
          }
          
          const proposalDetails = await contracts.governance._proposals(i);
          
          // Add proposer to unique proposers set
          if (proposalDetails.proposer !== ethers.constants.AddressZero) {
            uniqueProposers.add(proposalDetails.proposer);
          }
          
          // Extract title and description
          const { title, description } = extractTitleAndDescription(proposalDetails.description);
          
          // Format the proposal data
          const formattedProposal = {
            id: i,
            title,
            description,
            proposer: proposalDetails.proposer,
            deadline: new Date(proposalDetails.deadline.toNumber() * 1000),
            createdAt: new Date(proposalDetails.createdAt.toNumber() * 1000),
            state: proposalState,
            stateLabel: getProposalStateLabel(proposalState),
            type: proposalDetails.pType,
            typeLabel: getProposalTypeLabel(proposalDetails.pType),
            yesVotes: ethers.utils.formatEther(proposalDetails.yesVotes),
            noVotes: ethers.utils.formatEther(proposalDetails.noVotes),
            abstainVotes: ethers.utils.formatEther(proposalDetails.abstainVotes),
            timelockTxHash: proposalDetails.timelockTxHash,
            hasVoted: false,
            // Additional data based on proposal type
            target: proposalDetails.target,
            callData: proposalDetails.callData,
            recipient: proposalDetails.recipient,
            amount: ethers.utils.formatEther(proposalDetails.amount),
            token: proposalDetails.token
          };
          
          console.log(`Proposal ${i} data:`, formattedProposal);
          
          // Check if the user has voted on this proposal
          if (account) {
            try {
              const votingPower = await contracts.governance.proposalVoterInfo(i, account);
              formattedProposal.hasVoted = !votingPower.isZero();
            } catch (err) {
              console.error(`Error checking if user has voted on proposal ${i}:`, err);
            }
          }
          
          proposalData.push(formattedProposal);
        } catch (err) {
          console.log(`Error fetching proposal ${i}:`, err.message);
          // Skip if proposal doesn't exist or there was an error fetching it
          continue;
        }
      }
      
      console.log("Found", proposalData.length, "proposals");
      setProposals(proposalData);
      
      // Update token holders count
      const tokenHolderAddresses = Array.from(uniqueProposers);
      setTokenHolders(tokenHolderAddresses.length);
      console.log("Found", tokenHolderAddresses.length, "token holders from proposals");
      
    } catch (err) {
      console.error("Error fetching proposals:", err);
      setError("Failed to fetch proposals: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [contracts, account, isConnected, contractsReady]);

  useEffect(() => {
    if (isConnected && contractsReady) {
      fetchProposals();
    }
  }, [fetchProposals, isConnected, contractsReady, refreshCounter]);

  const createProposal = async (
    description, 
    type, 
    target, 
    callData, 
    amount, 
    recipient, 
    token, 
    newThreshold, 
    newQuorum, 
    newVotingDuration, 
    newTimelockDelay
  ) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    console.log("Creating proposal with params:", {
      description,
      type,
      target,
      callData,
      amount,
      recipient,
      token,
      newThreshold,
      newQuorum,
      newVotingDuration,
      newTimelockDelay
    });
    
    try {
      setLoading(true);
      setError(null);
      setCreateProposalStatus({
        isSubmitting: true,
        error: null,
        success: false
      });
      
      // Validate required fields based on proposal type
      if (type === PROPOSAL_TYPES.GENERAL) {
        if (!target) throw new Error("Target address is required for General proposals");
        if (!callData) throw new Error("Call data is required for General proposals");
      } else if (type === PROPOSAL_TYPES.WITHDRAWAL || 
                type === PROPOSAL_TYPES.TOKEN_TRANSFER ||
                type === PROPOSAL_TYPES.TOKEN_MINT ||
                type === PROPOSAL_TYPES.TOKEN_BURN) {
        if (!recipient) throw new Error("Recipient address is required");
        if (!amount) throw new Error("Amount is required");
      } else if (type === PROPOSAL_TYPES.EXTERNAL_ERC20_TRANSFER) {
        if (!recipient) throw new Error("Recipient address is required");
        if (!amount) throw new Error("Amount is required");
        if (!token) throw new Error("Token address is required");
      }
      
      // Convert string values to appropriate format
      const amountBN = amount ? ethers.utils.parseEther(amount.toString()) : ethers.BigNumber.from(0);
      const newThresholdBN = newThreshold ? ethers.utils.parseEther(newThreshold.toString()) : ethers.BigNumber.from(0);
      const newQuorumBN = newQuorum ? ethers.utils.parseEther(newQuorum.toString()) : ethers.BigNumber.from(0);
      const newVotingDurationNum = newVotingDuration ? parseInt(newVotingDuration) : 0;
      const newTimelockDelayNum = newTimelockDelay ? parseInt(newTimelockDelay) : 0;
      
      console.log("Creating proposal with values:", {
        description,
        type,
        target: target || ethers.constants.AddressZero,
        callData: callData || "0x",
        amountBN: amountBN.toString(),
        recipient: recipient || ethers.constants.AddressZero,
        token: token || ethers.constants.AddressZero,
        newThresholdBN: newThresholdBN.toString(),
        newQuorumBN: newQuorumBN.toString(),
        newVotingDurationNum,
        newTimelockDelayNum
      });
      
      // Check user's balance first
      const userBalance = await contracts.token.balanceOf(account);
      const proposalThreshold = await contracts.governance.govParams();
      
      if (userBalance.lt(proposalThreshold.proposalCreationThreshold)) {
        throw new Error(`Insufficient balance to create proposal. You need at least ${ethers.utils.formatEther(proposalThreshold.proposalCreationThreshold)} JUST tokens.`);
      }
      
      // Create the proposal with an appropriate gas limit
      const tx = await contracts.governance.createProposal(
        description,
        type,
        target || ethers.constants.AddressZero,
        callData || "0x",
        amountBN,
        recipient || ethers.constants.AddressZero,
        token || ethers.constants.AddressZero,
        newThresholdBN,
        newQuorumBN,
        newVotingDurationNum,
        newTimelockDelayNum,
        {
          gasLimit: 1000000 // Provide enough gas
        }
      );
      
      console.log("Proposal creation transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Proposal creation confirmed:", receipt);
      
      setCreateProposalStatus({
        isSubmitting: false,
        error: null,
        success: true
      });
      
      // Refresh proposals list
      await fetchProposals();
      
      return true;
    } catch (err) {
      console.error("Error creating proposal:", err);
      setError("Failed to create proposal: " + err.message);
      setCreateProposalStatus({
        isSubmitting: false,
        error: err.message,
        success: false
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelProposal = async (proposalId) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      setLoading(true);
      setError(null);
      
      // Get the proposal first to check if the user is the proposer
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
      
      // Check if the user is the proposer or has GUARDIAN role
      if (proposal.proposer.toLowerCase() !== account.toLowerCase()) {
        // Try to check if the user has GUARDIAN role
        const guardianRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("GUARDIAN_ROLE"));
        const hasGuardianRole = await contracts.governance.hasRole(guardianRole, account);
        
        if (!hasGuardianRole) {
          throw new Error("Only the proposer or a guardian can cancel this proposal");
        }
      }
      
      const tx = await contracts.governance.cancelProposal(proposalId, {
        gasLimit: 200000 // Provide enough gas
      });
      await tx.wait();
      
      // Refresh proposals list
      await fetchProposals();
      
      return true;
    } catch (err) {
      console.error("Error canceling proposal:", err);
      setError("Failed to cancel proposal: " + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const queueProposal = async (proposalId) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await contracts.governance.queueProposal(proposalId, {
        gasLimit: 500000 // Provide enough gas for queuing
      });
      await tx.wait();
      
      // Refresh proposals list
      await fetchProposals();
      
      return true;
    } catch (err) {
      console.error("Error queuing proposal:", err);
      setError("Failed to queue proposal: " + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposalId) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await contracts.governance.executeProposal(proposalId, {
        gasLimit: 1000000 // Provide enough gas for execution
      });
      await tx.wait();
      
      // Refresh proposals list
      await fetchProposals();
      
      return true;
    } catch (err) {
      console.error("Error executing proposal:", err);
      setError("Failed to execute proposal: " + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const claimRefund = async (proposalId) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.governance) throw new Error("Governance contract not initialized");
    
    try {
      setLoading(true);
      setError(null);
      
      // Verify the user is the proposer
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
      
      if (proposal.proposer.toLowerCase() !== account.toLowerCase()) {
        throw new Error("Only the proposer can claim a refund");
      }
      
      const tx = await contracts.governance.claimPartialStakeRefund(proposalId, {
        gasLimit: 200000 // Provide enough gas
      });
      await tx.wait();
      
      // Refresh proposals list
      await fetchProposals();
      
      return true;
    } catch (err) {
      console.error("Error claiming refund:", err);
      setError("Failed to claim refund: " + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract title and description
  function extractTitleAndDescription(rawDescription) {
    if (!rawDescription) return { title: "Untitled Proposal", description: "" };
    
    // Split by newline to get title and description
    const parts = rawDescription.split('\n');
    let title = parts[0].trim();
    
    // If title is too long, use the first part of it
    if (title.length > 80) {
      title = title.substring(0, 77) + "...";
    }
    
    // Get the full description
    const description = rawDescription.trim();
    
    return { title, description };
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
    tokenHolders,
    createProposalStatus,
    fetchProposals,
    createProposal,
    cancelProposal,
    queueProposal,
    executeProposal,
    claimRefund
  };
}