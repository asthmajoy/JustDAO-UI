// src/components/governance/CreateProposal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { NotificationContext } from '../../context/NotificationContext';
import { LoadingState, TransactionPending } from '../common/LoadingSpinner';
import { ArrowLeftIcon, FileTextIcon, CoinsIcon, SettingsIcon, ExternalLinkIcon, PlusCircleIcon, MinusCircleIcon } from 'lucide-react';
import { PROPOSAL_TYPES } from '../../config/constants';

const CreateProposal = () => {
  const navigate = useNavigate();
  const { account } = useContext(WalletContext);
  const { governanceContract, getContract, tokenContract } = useContext(ContractsContext);
  const { addPendingTransaction, notifySuccess, notifyError, notifyInfo } = useContext(NotificationContext);
  
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [threshold, setThreshold] = useState(null);
  const [balance, setBalance] = useState(null);
  const [stake, setStake] = useState(null);
  
  // Form state
  const [proposalType, setProposalType] = useState('0'); // Default to General
  const [description, setDescription] = useState('');
  
  // General Proposal fields
  const [target, setTarget] = useState('');
  const [callData, setCallData] = useState('');
  
  // Transfer and Mint/Burn fields
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [externalToken, setExternalToken] = useState('');
  
  // Governance Change fields
  const [newThreshold, setNewThreshold] = useState('');
  const [newQuorum, setNewQuorum] = useState('');
  const [newVotingDuration, setNewVotingDuration] = useState('');
  const [newTimelockDelay, setNewTimelockDelay] = useState('');
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  const [hasRequiredBalance, setHasRequiredBalance] = useState(false);

  // Fetch threshold and balance
  useEffect(() => {
    const fetchData = async () => {
      if (!governanceContract || !tokenContract || !account) return;
      
      try {
        setLoading(true);
        
        // Get governance parameters
        const params = await governanceContract.govParams();
        const proposalThreshold = params.proposalCreationThreshold;
        const proposalStake = params.proposalStake;
        
        // Get user's token balance
        const userBalance = await tokenContract.balanceOf(account);
        
        setThreshold(proposalThreshold);
        setStake(proposalStake);
        setBalance(userBalance);
        setHasRequiredBalance(userBalance.gte(proposalThreshold));
      } catch (error) {
        console.error("Error fetching thresholds and balances:", error);
        notifyError("Error fetching governance parameters");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [governanceContract, tokenContract, account, notifyError]);

  // Validate form based on proposal type
  const validateForm = () => {
    const errors = {};

    // Common validation
    if (!description.trim()) {
      errors.description = "Description is required";
    }

    // Validate based on proposal type
    switch (proposalType) {
      case '0': // General
        if (!target || !ethers.isAddress(target)) {
          errors.target = "Valid target address is required";
        }
        if (!callData || callData.length < 10) {
          errors.callData = "Valid calldata is required";
        }
        break;
      case '1': // Withdrawal
      case '2': // TokenTransfer
        if (!recipient || !ethers.isAddress(recipient)) {
          errors.recipient = "Valid recipient address is required";
        }
        if (!amount || parseFloat(amount) <= 0) {
          errors.amount = "Valid amount is required";
        }
        break;
      case '3': // GovernanceChange
        const hasValue = newThreshold || newQuorum || newVotingDuration || newTimelockDelay;
        if (!hasValue) {
          errors.governanceChange = "At least one governance parameter must be set";
        }
        if (newVotingDuration && (parseInt(newVotingDuration) < 600 || parseInt(newVotingDuration) > 31536000)) {
          errors.newVotingDuration = "Voting duration must be between 10 minutes and 1 year (in seconds)";
        }
        break;
      case '4': // ExternalERC20Transfer
        if (!recipient || !ethers.isAddress(recipient)) {
          errors.recipient = "Valid recipient address is required";
        }
        if (!amount || parseFloat(amount) <= 0) {
          errors.amount = "Valid amount is required";
        }
        if (!externalToken || !ethers.isAddress(externalToken)) {
          errors.externalToken = "Valid token address is required";
        }
        break;
      case '5': // TokenMint
      case '6': // TokenBurn
        if (!recipient || !ethers.isAddress(recipient)) {
          errors.recipient = "Valid recipient address is required";
        }
        if (!amount || parseFloat(amount) <= 0) {
          errors.amount = "Valid amount is required";
        }
        break;
      default:
        errors.proposalType = "Valid proposal type is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit proposal
  const handleSubmitProposal = async () => {
    if (!account) {
      notifyError("Please connect your wallet");
      return;
    }

    if (!hasRequiredBalance) {
      notifyError(`You need at least ${ethers.formatEther(threshold)} tokens to create a proposal`);
      return;
    }

    if (!validateForm()) {
      notifyError("Please fix the form errors before submitting");
      return;
    }

    try {
      setPending(true);
      
      // Get contract with signer
      const govContractWithSigner = getContract('governance', true);
      
      // Prepare parameters based on proposal type
      const proposalParams = {
        description: description,
        proposalType: parseInt(proposalType),
        target: ethers.ZeroAddress,
        callData: '0x',
        amount: '0',
        recipient: ethers.ZeroAddress,
        externalToken: ethers.ZeroAddress,
        newThreshold: '0',
        newQuorum: '0',
        newVotingDuration: '0',
        newTimelockDelay: '0'
      };

      // Set specific parameters based on proposal type
      switch (proposalType) {
        case '0': // General
          proposalParams.target = target;
          proposalParams.callData = callData;
          break;
        case '1': // Withdrawal
        case '2': // TokenTransfer
          proposalParams.recipient = recipient;
          proposalParams.amount = ethers.parseEther(amount);
          break;
        case '3': // GovernanceChange
          if (newThreshold) proposalParams.newThreshold = ethers.parseEther(newThreshold);
          if (newQuorum) proposalParams.newQuorum = ethers.parseEther(newQuorum);
          if (newVotingDuration) proposalParams.newVotingDuration = newVotingDuration;
          if (newTimelockDelay) proposalParams.newTimelockDelay = newTimelockDelay;
          break;
        case '4': // ExternalERC20Transfer
          proposalParams.recipient = recipient;
          proposalParams.amount = ethers.parseEther(amount);
          proposalParams.externalToken = externalToken;
          break;
        case '5': // TokenMint
        case '6': // TokenBurn
          proposalParams.recipient = recipient;
          proposalParams.amount = ethers.parseEther(amount);
          break;
      }

      // Create the proposal
      const tx = await govContractWithSigner.createProposal(
        proposalParams.description,
        proposalParams.proposalType,
        proposalParams.target,
        proposalParams.callData,
        proposalParams.amount,
        proposalParams.recipient,
        proposalParams.externalToken,
        proposalParams.newThreshold,
        proposalParams.newQuorum,
        proposalParams.newVotingDuration,
        proposalParams.newTimelockDelay
      );

      await addPendingTransaction(tx, `Create proposal: ${description}`);
      
      // Once confirmed, notify success and navigate to governance page
      notifySuccess("Proposal created successfully");
      navigate('/governance');
    } catch (error) {
      console.error("Error creating proposal:", error);
      
      if (error.message.includes("insufficient")) {
        notifyError("Insufficient token balance for proposal creation");
      } else {
        notifyError(`Failed to create proposal: ${error.message}`);
      }
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading governance parameters..." />;
  }

  if (pending) {
    return <TransactionPending text="Creating proposal..." />;
  }

  const renderFormFields = () => {
    switch (proposalType) {
      case '0': // General
        return (
          <div className="space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Address</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.target ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x..."
              />
              {formErrors.target && <p className="mt-1 text-sm text-red-600">{formErrors.target}</p>}
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Data (Hex)</label>
              <textarea
                value={callData}
                onChange={(e) => setCallData(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.callData ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x..."
                rows={4}
              />
              {formErrors.callData && <p className="mt-1 text-sm text-red-600">{formErrors.callData}</p>}
            </div>
          </div>
        );
      case '1': // Withdrawal
        return (
          <div className="space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.recipient ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x..."
              />
              {formErrors.recipient && <p className="mt-1 text-sm text-red-600">{formErrors.recipient}</p>}
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ETH)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {formErrors.amount && <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>}
            </div>
          </div>
        );
      case '2': // TokenTransfer
        return (
          <div className="space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.recipient ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x..."
              />
              {formErrors.recipient && <p className="mt-1 text-sm text-red-600">{formErrors.recipient}</p>}
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (JUST)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {formErrors.amount && <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>}
            </div>
          </div>
        );
      case '3': // GovernanceChange
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
              <p className="text-sm text-amber-800">
                You only need to fill the values you want to change. Leave other fields empty to keep their current values.
              </p>
            </div>
            
            {formErrors.governanceChange && (
              <p className="text-sm text-red-600 mb-2">{formErrors.governanceChange}</p>
            )}
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Proposal Threshold (JUST)</label>
              <input
                type="text"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Leave empty to keep current"
              />
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Quorum (JUST)</label>
              <input
                type="text"
                value={newQuorum}
                onChange={(e) => setNewQuorum(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Leave empty to keep current"
              />
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Voting Duration (seconds)</label>
              <input
                type="text"
                value={newVotingDuration}
                onChange={(e) => setNewVotingDuration(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.newVotingDuration ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Leave empty to keep current"
              />
              {formErrors.newVotingDuration && (
                <p className="mt-1 text-sm text-red-600">{formErrors.newVotingDuration}</p>
              )}
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Timelock Delay (seconds)</label>
              <input
                type="text"
                value={newTimelockDelay}
                onChange={(e) => setNewTimelockDelay(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Leave empty to keep current"
              />
            </div>
          </div>
        );
      case '4': // ExternalERC20Transfer
        return (
          <div className="space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Token Address</label>
              <input
                type="text"
                value={externalToken}
                onChange={(e) => setExternalToken(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.externalToken ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x..."
              />
              {formErrors.externalToken && <p className="mt-1 text-sm text-red-600">{formErrors.externalToken}</p>}
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.recipient ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x..."
              />
              {formErrors.recipient && <p className="mt-1 text-sm text-red-600">{formErrors.recipient}</p>}
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {formErrors.amount && <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>}
            </div>
          </div>
        );
      case '5': // TokenMint
        return (
          <div className="space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.recipient ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x..."
              />
              {formErrors.recipient && <p className="mt-1 text-sm text-red-600">{formErrors.recipient}</p>}
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Mint (JUST)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {formErrors.amount && <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>}
            </div>
          </div>
        );
      case '6': // TokenBurn
        return (
          <div className="space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.recipient ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x..."
              />
              {formErrors.recipient && <p className="mt-1 text-sm text-red-600">{formErrors.recipient}</p>}
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Burn (JUST)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.0"
              />
              {formErrors.amount && <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/governance')}
          className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Back to Proposals
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Proposal</h1>
      </div>
      
      {!hasRequiredBalance && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> You need at least {threshold ? ethers.formatEther(threshold) : '?'} JUST tokens to create a proposal. 
            Your current balance is {balance ? ethers.formatEther(balance) : '0'} JUST.
          </p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="mb-6 space-y-4">
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Type</label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                {PROPOSAL_TYPES.map((type, index) => (
                  <option key={index} value={index}>
                    {type}
                  </option>
                ))}
              </select>
              {formErrors.proposalType && <p className="mt-1 text-sm text-red-600">{formErrors.proposalType}</p>}
            </div>
            
            <div className="field">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Provide a clear description of the proposal"
                rows={3}
              />
              {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Proposal Parameters</h3>
            {renderFormFields()}
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleSubmitProposal}
              disabled={!account || pending || !hasRequiredBalance}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                !account || pending || !hasRequiredBalance
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {pending ? (
                <>
                  <span className="animate-spin mr-2">&#8226;</span>
                  Creating Proposal...
                </>
              ) : (
                <>Create Proposal</>
              )}
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>
              Note: Creating a proposal requires staking {stake ? ethers.formatEther(stake) : '?'} JUST tokens. 
              These tokens will be refunded if the proposal succeeds and is executed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProposal;