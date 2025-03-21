// src/components/governance/ProposalDetails.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { RoleContext } from '../../context/RoleContext';
import { NotificationContext } from '../../context/NotificationContext';
import { LoadingState, TransactionPending } from '../common/LoadingSpinner';
import { ProposalStateBadge } from '../common/StatusBadge';
import CastVote from './CastVote';
import { 
  PROPOSAL_TYPES, 
  PROPOSAL_STATES,
  NETWORKS,
  EXPECTED_NETWORK_ID
} from '../../config/constants';
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  VoteIcon, 
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  BanIcon,
  AlertTriangleIcon,
  InfoIcon,
  FileTextIcon,
  LinkIcon
} from 'lucide-react';

const ProposalDetails = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { account } = useContext(WalletContext);
  const { governanceContract, getContract, timelockContract } = useContext(ContractsContext);
  const { isAdmin, isGuardian } = useContext(RoleContext);
  const { addPendingTransaction, notifySuccess, notifyError, notifyWarning, getExplorerLink } = useContext(NotificationContext);
  
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [govParams, setGovParams] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [pending, setPending] = useState(false);
  const [timelockInfo, setTimelockInfo] = useState(null);

  // Fetch proposal data
  useEffect(() => {
    const fetchProposalData = async () => {
      if (!governanceContract || !proposalId) return;
      
      try {
        setLoading(true);
        
        // Get proposal state
        const state = await governanceContract.getProposalState(proposalId);
        
        // Get proposal data
        const data = await governanceContract._proposals(proposalId);
        
        // Get governance parameters
        const params = await governanceContract.govParams();
        
        // Check if the current user has voted on this proposal
        let userVoteDetails = null;
        if (account) {
          const votingPower = await governanceContract.proposalVoterInfo(proposalId, account);
          if (!votingPower.isZero()) {
            // Note: this is a simplified approach as we don't have direct access to the vote type
            // In a production environment, you would track vote types in a mapping or event
            userVoteDetails = {
              votingPower: ethers.formatEther(votingPower),
              hasVoted: true
            };
          }
        }
        
        // Get timelock info if proposal is queued
        let timelockDetails = null;
        if (data.timelockTxHash !== ethers.ZeroHash && timelockContract) {
          try {
            const [target, value, txData, eta, executed] = await timelockContract.getTransaction(data.timelockTxHash);
            
            timelockDetails = {
              txHash: data.timelockTxHash,
              target,
              value: ethers.formatEther(value),
              data: txData,
              eta: new Date(Number(eta) * 1000),
              executed,
              expired: !executed && (Date.now() > Number(eta) * 1000 + 14 * 24 * 60 * 60 * 1000) // 14 days grace period
            };
          } catch (error) {
            console.error("Error fetching timelock info:", error);
          }
        }
        
        // Format proposal data
        const formattedProposal = {
          id: Number(proposalId),
          state: Number(state),
          type: Number(data.pType),
          typeName: PROPOSAL_TYPES[Number(data.pType)],
          stateName: PROPOSAL_STATES[Number(state)],
          description: data.description,
          proposer: data.proposer,
          recipient: data.recipient,
          amount: data.amount ? ethers.formatEther(data.amount) : null,
          token: data.token,
          yesVotes: ethers.formatEther(data.yesVotes),
          noVotes: ethers.formatEther(data.noVotes),
          abstainVotes: ethers.formatEther(data.abstainVotes),
          totalVotes: ethers.formatEther(
            data.yesVotes + data.noVotes + data.abstainVotes
          ),
          createdAt: new Date(Number(data.createdAt) * 1000),
          deadline: new Date(Number(data.deadline) * 1000),
          snapshotId: Number(data.snapshotId),
          stakedAmount: ethers.formatEther(data.stakedAmount),
          timelockTxHash: data.timelockTxHash,
          target: data.target,
          callData: data.callData,
          
          // Governance change specific fields
          newThreshold: data.newThreshold ? ethers.formatEther(data.newThreshold) : null,
          newQuorum: data.newQuorum ? ethers.formatEther(data.newQuorum) : null,
          newVotingDuration: data.newVotingDuration ? Number(data.newVotingDuration) : null,
          newTimelockDelay: data.newTimelockDelay ? Number(data.newTimelockDelay) : null,
          
          // Helper properties
          isActive: Number(state) === 0,
          hasEnded: Number(state) !== 0,
          isExecutable: Number(state) === 3 || Number(state) === 4, // Succeeded or Queued
          isCancellable: Number(state) === 0 || Number(state) === 3, // Active or Succeeded
          isQueued: Number(state) === 4,
          isExecuted: Number(state) === 5
        };
        
        setProposal(formattedProposal);
        setGovParams({
          votingDuration: Number(params.votingDuration),
          quorum: ethers.formatEther(params.quorum),
          timelockDelay: Number(params.timelockDelay),
          proposalCreationThreshold: ethers.formatEther(params.proposalCreationThreshold)
        });
        setUserVote(userVoteDetails);
        setTimelockInfo(timelockDetails);
      } catch (error) {
        console.error("Error fetching proposal details:", error);
        notifyError("Failed to fetch proposal details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposalData();
  }, [governanceContract, timelockContract, proposalId, account, notifyError]);

  // Queue a proposal
  const handleQueueProposal = async () => {
    if (!proposal || !proposal.isExecutable || proposal.isQueued) return;
    
    try {
      setPending(true);
      const governanceContractWithSigner = getContract('governance', true);
      
      // Queue the proposal
      const tx = await governanceContractWithSigner.queueProposal(proposal.id);
      
      // Track the transaction
      await addPendingTransaction(tx, `Queue proposal #${proposal.id}`);
      
      // Show success message
      notifySuccess("Successfully queued the proposal");
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error queueing proposal:", error);
      notifyError(`Failed to queue proposal: ${error.message}`);
    } finally {
      setPending(false);
    }
  };

  // Execute a proposal
  const handleExecuteProposal = async () => {
    if (!proposal || !proposal.isQueued) return;
    
    try {
      setPending(true);
      const governanceContractWithSigner = getContract('governance', true);
      
      // Execute the proposal
      const tx = await governanceContractWithSigner.executeProposal(proposal.id);
      
      // Track the transaction
      await addPendingTransaction(tx, `Execute proposal #${proposal.id}`);
      
      // Show success message
      notifySuccess("Successfully executed the proposal");
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error executing proposal:", error);
      notifyError(`Failed to execute proposal: ${error.message}`);
    } finally {
      setPending(false);
    }
  };

  // Cancel a proposal
  const handleCancelProposal = async () => {
    if (!proposal || !proposal.isCancellable) return;
    
    if (!isAdmin && !isGuardian && account !== proposal.proposer) {
      notifyWarning("Only the proposer, admin, or guardian can cancel this proposal");
      return;
    }
    
    try {
      setPending(true);
      const governanceContractWithSigner = getContract('governance', true);
      
      // Cancel the proposal
      const tx = await governanceContractWithSigner.cancelProposal(proposal.id);
      
      // Track the transaction
      await addPendingTransaction(tx, `Cancel proposal #${proposal.id}`);
      
      // Show success message
      notifySuccess("Successfully canceled the proposal");
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error canceling proposal:", error);
      notifyError(`Failed to cancel proposal: ${error.message}`);
    } finally {
      setPending(false);
    }
  };

  // Claim refund for defeated or cancelled proposal
  const handleClaimRefund = async () => {
    if (!proposal || ![1, 2, 6].includes(proposal.state)) return; // Only for Canceled, Defeated, or Expired
    
    if (account !== proposal.proposer) {
      notifyWarning("Only the proposer can claim a refund");
      return;
    }
    
    try {
      setPending(true);
      const governanceContractWithSigner = getContract('governance', true);
      
      // Claim refund
      const tx = await governanceContractWithSigner.claimPartialStakeRefund(proposal.id);
      
      // Track the transaction
      await addPendingTransaction(tx, `Claim refund for proposal #${proposal.id}`);
      
      // Show success message
      notifySuccess("Successfully claimed refund");
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Error claiming refund:", error);
      notifyError(`Failed to claim refund: ${error.message}`);
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading proposal details..." />;
  }

  if (pending) {
    return <TransactionPending text="Transaction pending..." />;
  }

  if (!proposal) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 text-center">
        <AlertTriangleIcon size={40} className="mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Proposal Not Found</h3>
        <p className="text-gray-500 mb-4">
          The requested proposal does not exist or has been removed.
        </p>
        <Link
          to="/governance"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Back to Proposals
        </Link>
      </div>
    );
  }

  // Calculate progress percentages for votes
  const totalVotesValue = parseFloat(proposal.totalVotes);
  const yesPercentage = totalVotesValue > 0 
    ? (parseFloat(proposal.yesVotes) / totalVotesValue) * 100 
    : 0;
  const noPercentage = totalVotesValue > 0 
    ? (parseFloat(proposal.noVotes) / totalVotesValue) * 100 
    : 0;
  const abstainPercentage = totalVotesValue > 0 
    ? (parseFloat(proposal.abstainVotes) / totalVotesValue) * 100 
    : 0;
  
  // Format deadline/time information
  const formatTimeLeft = () => {
    if (!proposal.isActive) return null;
    
    const now = new Date();
    const deadline = proposal.deadline;
    const diffMs = deadline - now;
    
    if (diffMs <= 0) return "Voting ended";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
    }
    
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} left`;
  };
  
  // Determine timelock status message
  const getTimelockStatus = () => {
    if (!timelockInfo) return null;
    
    if (timelockInfo.executed) {
      return "This proposal has been executed via the timelock";
    }
    
    if (timelockInfo.expired) {
      return "The timelock transaction has expired and needs to be requeued";
    }
    
    const now = new Date();
    const etaTime = timelockInfo.eta;
    
    if (now < etaTime) {
      const diffMs = etaTime - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      return `Transaction can be executed in ${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }
    
    return "Transaction can be executed now";
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/governance"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Back to Proposals
        </Link>
        
        <ProposalStateBadge state={proposal.state} />
      </div>
      
      {/* Main proposal details */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {/* Proposal header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-gray-500 text-sm">Proposal #{proposal.id}</span>
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded">
                {proposal.typeName}
              </span>
            </div>
            
            <div className="text-sm text-gray-500 flex items-center">
              <ClockIcon size={14} className="mr-1" />
              Created {proposal.createdAt.toLocaleDateString()}
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-4">{proposal.description}</h2>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="text-gray-500 flex items-center">
              <UserIcon size={14} className="mr-1" />
              <span className="font-medium mr-1">Proposer:</span>
              <span className="font-mono">{proposal.proposer}</span>
            </div>
            
            {proposal.deadline && (
              <div className="text-gray-500 flex items-center">
                <ClockIcon size={14} className="mr-1" />
                <span className="font-medium mr-1">Deadline:</span>
                <span>
                  {proposal.deadline.toLocaleString()} 
                  {proposal.isActive && <span className="ml-1 text-indigo-600">({formatTimeLeft()})</span>}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Voting results */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Voting Results</h3>
          
          <div className="space-y-3 mb-6">
            {/* Yes votes */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-green-700">Yes</span>
                <span className="text-sm text-gray-700">
                  {parseFloat(proposal.yesVotes).toLocaleString()} 
                  <span className="ml-1 text-gray-500">({yesPercentage.toFixed(2)}%)</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${yesPercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* No votes */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-red-700">No</span>
                <span className="text-sm text-gray-700">
                  {parseFloat(proposal.noVotes).toLocaleString()} 
                  <span className="ml-1 text-gray-500">({noPercentage.toFixed(2)}%)</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${noPercentage}%` }}
                ></div>
              </div>
            </div>
            
            {/* Abstain votes */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Abstain</span>
                <span className="text-sm text-gray-700">
                  {parseFloat(proposal.abstainVotes).toLocaleString()} 
                  <span className="ml-1 text-gray-500">({abstainPercentage.toFixed(2)}%)</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full" 
                  style={{ width: `${abstainPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">Total Votes:</span> {parseFloat(proposal.totalVotes).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Quorum Required:</span> {parseFloat(govParams?.quorum || 0).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Snapshot ID:</span> {proposal.snapshotId}
              </div>
            </div>
          </div>
        </div>
        
        {/* Proposal Type-Specific Details */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Proposal Details</h3>
          
          {proposal.type === 0 && ( // General
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Target Address:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">{proposal.target}</div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Call Data:</span>
                <div className="mt-1 font-mono text-xs bg-gray-50 p-2 rounded-md overflow-auto max-h-32">
                  {proposal.callData || "No call data"}
                </div>
              </div>
            </div>
          )}
          
          {proposal.type === 1 && ( // Withdrawal
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Withdrawal Amount:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                  {parseFloat(proposal.amount).toLocaleString()} ETH
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Recipient:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">{proposal.recipient}</div>
              </div>
            </div>
          )}
          
          {proposal.type === 2 && ( // TokenTransfer
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Transfer Amount:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                  {parseFloat(proposal.amount).toLocaleString()} JUST
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Recipient:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">{proposal.recipient}</div>
              </div>
            </div>
          )}
          
          {proposal.type === 3 && ( // GovernanceChange
            <div className="space-y-4">
              {proposal.newThreshold && (
                <div>
                  <span className="text-sm font-medium text-gray-700">New Proposal Threshold:</span>
                  <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                    {parseFloat(proposal.newThreshold).toLocaleString()} JUST
                  </div>
                </div>
              )}
              
              {proposal.newQuorum && (
                <div>
                  <span className="text-sm font-medium text-gray-700">New Quorum:</span>
                  <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                    {parseFloat(proposal.newQuorum).toLocaleString()} JUST
                  </div>
                </div>
              )}
              
              {proposal.newVotingDuration && (
                <div>
                  <span className="text-sm font-medium text-gray-700">New Voting Duration:</span>
                  <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                    {Math.floor(proposal.newVotingDuration / 86400)} days ({proposal.newVotingDuration} seconds)
                  </div>
                </div>
              )}
              
              {proposal.newTimelockDelay && (
                <div>
                  <span className="text-sm font-medium text-gray-700">New Timelock Delay:</span>
                  <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                    {Math.floor(proposal.newTimelockDelay / 86400)} days ({proposal.newTimelockDelay} seconds)
                  </div>
                </div>
              )}
            </div>
          )}
          
          {proposal.type === 4 && ( // ExternalERC20Transfer
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Token Address:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">{proposal.token}</div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Transfer Amount:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                  {parseFloat(proposal.amount).toLocaleString()}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Recipient:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">{proposal.recipient}</div>
              </div>
            </div>
          )}
          
          {proposal.type === 5 && ( // TokenMint
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Mint Amount:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                  {parseFloat(proposal.amount).toLocaleString()} JUST
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Recipient:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">{proposal.recipient}</div>
              </div>
            </div>
          )}
          
          {proposal.type === 6 && ( // TokenBurn
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Burn Amount:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                  {parseFloat(proposal.amount).toLocaleString()} JUST
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">From Address:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">{proposal.recipient}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Timelock Information */}
        {timelockInfo && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timelock Information</h3>
            
            <div className="bg-blue-50 p-4 rounded-md mb-4 flex items-start">
              <InfoIcon size={20} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                {getTimelockStatus()}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Transaction Hash:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                  {timelockInfo.txHash}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Target:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                  {timelockInfo.target}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Value:</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                  {timelockInfo.value} ETH
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Execution Time (ETA):</span>
                <div className="mt-1 font-mono text-sm bg-gray-50 p-2 rounded">
                  {timelockInfo.eta.toLocaleString()}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className="mt-1">
                  {timelockInfo.executed ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon size={12} className="mr-1" /> Executed
                    </span>
                  ) : timelockInfo.expired ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangleIcon size={12} className="mr-1" /> Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <ClockIcon size={12} className="mr-1" /> Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Active Vote Section */}
        {proposal.isActive && account && !userVote?.hasVoted && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cast Your Vote</h3>
            <CastVote proposalId={proposal.id} onVoteSuccess={() => window.location.reload()} />
          </div>
        )}
        
        {/* User has already voted */}
        {proposal.isActive && account && userVote?.hasVoted && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start bg-green-50 p-4 rounded-md">
              <CheckCircleIcon size={20} className="text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-green-800">You have already voted on this proposal</h3>
                <p className="mt-1 text-sm text-green-700">
                  Your voting power: {parseFloat(userVote.votingPower).toLocaleString()} JUST
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            {/* Queue Button */}
            {proposal.state === 3 && !proposal.isQueued && (
              <button
                onClick={handleQueueProposal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlayIcon size={16} className="mr-2" />
                Queue Proposal
              </button>
            )}
            
            {/* Execute Button */}
            {proposal.isQueued && timelockInfo && !timelockInfo.executed && new Date() >= timelockInfo.eta && !timelockInfo.expired && (
              <button
                onClick={handleExecuteProposal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircleIcon size={16} className="mr-2" />
                Execute Proposal
              </button>
            )}
            
            {/* Cancel Button */}
            {proposal.isCancellable && (account === proposal.proposer || isAdmin || isGuardian) && (
              <button
                onClick={handleCancelProposal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <BanIcon size={16} className="mr-2" />
                Cancel Proposal
              </button>
            )}
            
            {/* Claim Refund Button - For defeated, canceled, or expired proposals */}
            {[1, 2, 6].includes(proposal.state) && account === proposal.proposer && (
              <button
                onClick={handleClaimRefund}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <InfoIcon size={16} className="mr-2" />
                Claim Partial Refund
              </button>
            )}
            
            {/* View on Explorer Button - For executed proposals with timelock info */}
            {proposal.isExecuted && timelockInfo && (
              <a
                href={getExplorerLink('tx', timelockInfo.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LinkIcon size={16} className="mr-2" />
                View on Explorer
              </a>
            )}
          </div>
          
          {/* Proposal creation information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-500">
              <InfoIcon size={16} className="mr-2" />
              <span>
                This proposal was created with a stake of {parseFloat(proposal.stakedAmount).toLocaleString()} JUST tokens.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;