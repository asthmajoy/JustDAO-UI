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

  // Helper function to check vote details
  const getVoteDetails = useCallback(async (proposalId, voter) => {
    try {
      // Check if the user has voting power allocated to this proposal
      const votingPower = await contracts.governance.proposalVoterInfo(proposalId, voter);
      
      if (votingPower.isZero()) {
        return { hasVoted: false, voteType: null, votingPower: "0" };
      }
      
      // Try to determine how they voted using events or direct query if available
      let voteType = null;
      
      try {
        // Try querying VoteCast events for this proposal and voter
        const filter = contracts.governance.filters.VoteCast(proposalId, voter);
        const events = await contracts.governance.queryFilter(filter);
        
        if (events.length > 0) {
          // Use the most recent vote event
          const latestEvent = events[events.length - 1];
          voteType = latestEvent.args.support;
        }
      } catch (err) {
        console.warn("Couldn't determine vote type from events:", err);
      }
      
      return {
        hasVoted: true,
        voteType: voteType !== null ? Number(voteType) : null,
        votingPower: ethers.utils.formatEther(votingPower)
      };
    } catch (err) {
      console.error("Error getting vote details:", err);
      return { hasVoted: false, voteType: null, votingPower: "0" };
    }
  }, [contracts]);

  // Helper function to extract title and description
  const extractTitleAndDescription = useCallback((rawDescription) => {
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
  }, []);

  // Helper function to get human-readable proposal state label
  const getProposalStateLabel = useCallback((state) => {
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
  }, []);

  // Helper function to get human-readable proposal type label
  const getProposalTypeLabel = useCallback((type) => {
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
  }, []);

  // Helper function to load detailed proposal data
  const loadProposalDetails = useCallback(async (proposalId) => {
    try {
      // First check if the proposal exists by getting its state
      const proposalState = await contracts.governance.getProposalState(proposalId);
      
      // Get full proposal details
      const proposalDetails = await contracts.governance._proposals(proposalId);
      
      // Extract title and description
      const { title, description } = extractTitleAndDescription(proposalDetails.description);
      
      // Format the proposal data
      const formattedProposal = {
        id: proposalId,
        title: title || `Proposal #${proposalId}`, // Provide a default title if missing
        description: description || "No description provided", // Default description
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
        votedYes: false,
        votedNo: false,
        votedAbstain: false,
        snapshotId: proposalDetails.snapshotId.toNumber(),
        // Additional data based on proposal type
        target: proposalDetails.target,
        callData: proposalDetails.callData,
        recipient: proposalDetails.recipient,
        amount: proposalDetails.amount,
        token: proposalDetails.token,
        // For governance change proposals
        newThreshold: proposalDetails.newThreshold,
        newQuorum: proposalDetails.newQuorum,
        newVotingDuration: proposalDetails.newVotingDuration ? proposalDetails.newVotingDuration.toNumber() : 0,
        newTimelockDelay: proposalDetails.newTimelockDelay ? proposalDetails.newTimelockDelay.toNumber() : 0,
      };
      
      // Check if the user has voted on this proposal
      if (account) {
        try {
          const voteDetails = await getVoteDetails(proposalId, account);
          formattedProposal.hasVoted = voteDetails.hasVoted;
          formattedProposal.votedYes = voteDetails.voteType === 1;  // FOR
          formattedProposal.votedNo = voteDetails.voteType === 0;   // AGAINST
          formattedProposal.votedAbstain = voteDetails.voteType === 2; // ABSTAIN
        } catch (err) {
          console.warn(`Error checking vote status for proposal ${proposalId}:`, err);
        }
      }
      
      return formattedProposal;
    } catch (err) {
      console.warn(`Error loading proposal ${proposalId}:`, err);
      return null;
    }
  }, [contracts, account, extractTitleAndDescription, getProposalStateLabel, getProposalTypeLabel, getVoteDetails]);

  const fetchProposals = useCallback(async () => {
    if (!isConnected || !contractsReady || !contracts.governance) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching proposals from governance contract...");
      
      // Find the upper limit of proposal IDs more efficiently
      let maxId = -1;
      try {
        // Try a binary search approach to find the highest valid proposal ID
        let low = 0;
        let high = 100; // Start with a reasonable upper bound
        
        // First, find an upper bound that's definitely too high
        let foundTooHigh = false;
        while (!foundTooHigh) {
          try {
            await contracts.governance.getProposalState(high);
            // If this succeeds, our high is still valid, double it
            low = high;
            high = high * 2;
            if (high > 10000) {
              // Set a reasonable maximum to prevent infinite loops
              foundTooHigh = true;
            }
          } catch (err) {
            // Found a proposal ID that doesn't exist
            foundTooHigh = true;
          }
        }
        
        // Now do binary search between known low and high
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          
          try {
            await contracts.governance.getProposalState(mid);
            // If we can get the state, this ID exists
            low = mid + 1;
          } catch (err) {
            // If we can't get the state, this ID doesn't exist
            high = mid - 1;
          }
        }
        
        maxId = high; // The highest valid proposal ID
        console.log("Highest valid proposal ID:", maxId);
      } catch (err) {
        console.error("Error finding max proposal ID:", err);
        maxId = -1; // Reset if something went wrong
      }
      
      // If we didn't find any proposals, try a linear search for a small range
      if (maxId === -1) {
        for (let i = 0; i < 20; i++) {
          try {
            await contracts.governance.getProposalState(i);
            maxId = i;
          } catch (err) {
            // Skip if proposal doesn't exist
          }
        }
      }
      
      if (maxId === -1) {
        console.log("No proposals found");
        setProposals([]);
        setLoading(false);
        return;
      }
      
      // Fetch all proposals up to maxId with detailed information
      const proposalData = [];
      const uniqueProposers = new Set();
      
      // Load proposals in batches to avoid overloading the provider
      const batchSize = 5;
      for (let batch = 0; batch <= Math.ceil(maxId / batchSize); batch++) {
        const batchPromises = [];
        const startIdx = batch * batchSize;
        const endIdx = Math.min(startIdx + batchSize, maxId + 1);
        
        for (let i = startIdx; i < endIdx; i++) {
          batchPromises.push(loadProposalDetails(i));
        }
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            proposalData.push(result.value);
            if (result.value.proposer !== ethers.constants.AddressZero) {
              uniqueProposers.add(result.value.proposer);
            }
          }
        });
        
        // Short delay between batches to avoid rate limiting
        if (batch < Math.ceil(maxId / batchSize)) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log("Found", proposalData.length, "proposals");
      setProposals(proposalData.sort((a, b) => b.id - a.id)); // Sort by most recent first
      
      // Update token holders count
      setTokenHolders(uniqueProposers.size);
      
    } catch (err) {
      console.error("Error fetching proposals:", err);
      setError("Failed to fetch proposals: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [contracts, isConnected, contractsReady, loadProposalDetails]);

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
      amount: amount.toString(),
      recipient,
      token,
      newThreshold: newThreshold.toString(),
      newQuorum: newQuorum.toString(),
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
      
      // Check user's balance vs proposal threshold
      const userBalance = await contracts.token.balanceOf(account);
      const govParams = await contracts.governance.govParams();
      const proposalThreshold = govParams.proposalCreationThreshold;
      
      if (userBalance.lt(proposalThreshold)) {
        throw new Error(`Insufficient balance to create proposal. You need at least ${ethers.utils.formatEther(proposalThreshold)} JUST tokens.`);
      }
      
      // Try to estimate gas with a safety margin
      let gasEstimate;
      try {
        console.log("Estimating gas for proposal creation...");
        gasEstimate = await contracts.governance.estimateGas.createProposal(
          description,
          type,
          target || ethers.constants.AddressZero,
          callData || "0x",
          amount,
          recipient || ethers.constants.AddressZero,
          token || ethers.constants.AddressZero,
          newThreshold,
          newQuorum,
          newVotingDuration,
          newTimelockDelay
        );
        
        // Add a 50% safety margin to account for blockchain conditions
        gasEstimate = gasEstimate.mul(150).div(100);
        console.log("Estimated gas with safety margin:", gasEstimate.toString());
      } catch (gasError) {
        console.warn("Gas estimation failed:", gasError);
        // If gas estimation fails, use a high default value for Sepolia
        gasEstimate = ethers.BigNumber.from(3000000); // 3 million gas should be sufficient for most proposals
        console.log("Using default gas limit:", gasEstimate.toString());
      }
      
      // Set a maximum gas limit to prevent excessive costs
      const maxGasLimit = ethers.BigNumber.from(5000000); // 5 million gas
      const finalGasLimit = gasEstimate.gt(maxGasLimit) ? maxGasLimit : gasEstimate;
      
      console.log("Final gas limit for transaction:", finalGasLimit.toString());
      
      // Create the proposal with the estimated gas limit
      const tx = await contracts.governance.createProposal(
        description,
        type,
        target || ethers.constants.AddressZero,
        callData || "0x",
        amount,
        recipient || ethers.constants.AddressZero,
        token || ethers.constants.AddressZero,
        newThreshold,
        newQuorum,
        newVotingDuration,
        newTimelockDelay,
        {
          gasLimit: finalGasLimit
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
      
      // Provide better error messages for common issues
      let errorMessage = "Failed to create proposal";
      
      if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = "Gas estimation failed. Your proposal may be too complex or there may be an issue with the contract.";
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = "You don't have enough ETH to pay for this transaction. Please add funds to your wallet.";
      } else if (err.message.includes("gas required exceeds allowance")) {
        errorMessage = "Transaction requires too much gas. Try simplifying your proposal or increasing your gas limit.";
      } else if (err.message.includes("user rejected transaction")) {
        errorMessage = "Transaction rejected by user.";
      } else {
        errorMessage = `Failed to create proposal: ${err.message}`;
      }
      
      setError(errorMessage);
      setCreateProposalStatus({
        isSubmitting: false,
        error: errorMessage,
        success: false
      });
      throw new Error(errorMessage);
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
        gasLimit: 300000 // Higher gas limit for safety
      });
      
      await tx.wait();
      console.log(`Proposal ${proposalId} cancelled successfully`);
      
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
      
      // Verify proposal state before queueing
      const state = await contracts.governance.getProposalState(proposalId);
      if (state !== PROPOSAL_STATES.SUCCEEDED) {
        throw new Error("Only succeeded proposals can be queued");
      }
      
      const tx = await contracts.governance.queueProposal(proposalId, {
        gasLimit: 500000 // Higher gas limit for queueing due to complexity
      });
      
      await tx.wait();
      console.log(`Proposal ${proposalId} queued successfully`);
      
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
      
      // Verify proposal state before executing
      const state = await contracts.governance.getProposalState(proposalId);
      if (state !== PROPOSAL_STATES.QUEUED) {
        throw new Error("Only queued proposals can be executed");
      }
      
      const tx = await contracts.governance.executeProposal(proposalId, {
        gasLimit: 1000000 // Higher gas limit for execution due to complexity
      });
      
      await tx.wait();
      console.log(`Proposal ${proposalId} executed successfully`);
      
      // Refresh proposals list
      await fetchProposals();
      
      return true;
    } catch (err) {
      console.error("Error executing proposal:", err);
      
      // Provide better error messages
      let errorMessage = "Failed to execute proposal";
      
      if (err.message.includes("NotInTimelock")) {
        errorMessage = "The transaction is no longer in the timelock queue. It may have been executed or cancelled.";
      } else if (err.message.includes("NotQueued")) {
        errorMessage = "The proposal is not properly queued for execution.";
      } else {
        errorMessage = `Failed to execute proposal: ${err.message}`;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
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
      
      // Verify the proposal state is appropriate for a refund
      const state = await contracts.governance.getProposalState(proposalId);
      if (![PROPOSAL_STATES.DEFEATED, PROPOSAL_STATES.CANCELED, PROPOSAL_STATES.EXPIRED].includes(state)) {
        throw new Error("Refunds are only available for defeated, canceled, or expired proposals");
      }
      
      const tx = await contracts.governance.claimPartialStakeRefund(proposalId, {
        gasLimit: 300000 // Higher gas limit for safety
      });
      
      await tx.wait();
      console.log(`Successfully claimed refund for proposal ${proposalId}`);
      
      // Refresh proposals list
      await fetchProposals();
      
      return true;
    } catch (err) {
      console.error("Error claiming refund:", err);
      
      let errorMessage = "Failed to claim refund";
      
      if (err.message.includes("Already")) {
        errorMessage = "This proposal's stake has already been refunded.";
      } else if (err.message.includes("NotProposer")) {
        errorMessage = "Only the proposer can claim a refund.";
      } else {
        errorMessage = `Failed to claim refund: ${err.message}`;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load proposals when the component mounts or dependencies change
  useEffect(() => {
    if (isConnected && contractsReady) {
      fetchProposals();
    } else {
      setProposals([]);
      setLoading(false);
    }
  }, [fetchProposals, isConnected, contractsReady, refreshCounter, account]);

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