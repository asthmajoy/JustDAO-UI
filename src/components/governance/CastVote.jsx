// src/components/governance/CastVote.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { NotificationContext } from '../../context/NotificationContext';
import { LoadingState, TransactionPending } from '../common/LoadingSpinner';
import { ArrowLeftIcon, ThumbsUpIcon, ThumbsDownIcon, BanIcon } from 'lucide-react';
import { VOTE_TYPES } from '../../config/constants';

const CastVote = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { account } = useContext(WalletContext);
  const { governanceContract, getContract } = useContext(ContractsContext);
  const { addPendingTransaction, notifySuccess, notifyError, notifyWarning } = useContext(NotificationContext);
  
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [votingPower, setVotingPower] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Fetch proposal data
  useEffect(() => {
    const fetchProposalData = async () => {
      if (!governanceContract || !proposalId || !account) {
        navigate('/governance');
        return;
      }
      
      try {
        setLoading(true);
        
        // Get proposal state
        const state = await governanceContract.getProposalState(proposalId);
        setIsActive(Number(state) === 0); // 0 = Active
        
        // Check if already voted
        const votePower = await governanceContract.proposalVoterInfo(proposalId, account);
        setHasVoted(!votePower.isZero());
        
        // Get proposal data
        const data = await governanceContract._proposals(proposalId);
        
        // Format proposal data
        const formattedProposal = {
          id: Number(proposalId),
          description: data.description,
          deadline: new Date(Number(data.deadline) * 1000),
          createdAt: new Date(Number(data.createdAt) * 1000),
          proposer: data.proposer,
          snapshotId: Number(data.snapshotId)
        };
        
        setProposal(formattedProposal);
        
        // Get user's voting power for this proposal
        try {
          const tokenContract = getContract('token');
          if (tokenContract) {
            const power = await tokenContract.getEffectiveVotingPower(account, formattedProposal.snapshotId);
            setVotingPower(ethers.formatEther(power));
          }
        } catch (error) {
          console.error("Error fetching voting power:", error);
        }
      } catch (error) {
        console.error("Error fetching proposal:", error);
        notifyError("Failed to fetch proposal details");
        navigate('/governance');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposalData();
  }, [account, governanceContract, proposalId, navigate, notifyError, getContract]);

  // Handle selecting a vote
  const handleSelectVote = (voteType) => {
    setSelectedVote(voteType);
  };

  // Handle submitting the vote
  const handleVote = async () => {
    if (!account || !proposalId || selectedVote === null || hasVoted || !isActive) return;
    
    try {
      setPending(true);
      const governanceContractWithSigner = getContract('governance', true);
      
      // Cast the vote
      const tx = await governanceContractWithSigner.castVote(proposalId, selectedVote);
      
      // Track the transaction and wait for confirmation
      await addPendingTransaction(tx, `Vote on proposal #${proposalId}`);
      
      // Show success message
      notifySuccess("Your vote has been cast successfully!");
      
      // Navigate back to the proposal
      navigate(`/governance/proposal/${proposalId}`);
    } catch (error) {
      console.error("Error casting vote:", error);
      
      // Show specific error messages for common failures
      if (error.message.includes("voting power")) {
        notifyError("You don't have any voting power for this proposal.");
      } else if (error.message.includes("already voted")) {
        notifyError("You have already voted on this proposal.");
      } else if (error.message.includes("voting ended")) {
        notifyError("Voting period has ended for this proposal.");
      } else {
        notifyError(`Failed to cast vote: ${error.message}`);
      }
      
      setPending(false);
    }
  };

  // Redirect if already voted or proposal is not active
  useEffect(() => {
    if (!loading && (hasVoted || !isActive)) {
      notifyWarning(hasVoted ? 
        "You have already voted on this proposal." : 
        "This proposal is not active for voting."
      );
      navigate(`/governance/proposal/${proposalId}`);
    }
  }, [loading, hasVoted, isActive, navigate, proposalId, notifyWarning]);

  // Redirect if no voting power
  useEffect(() => {
    if (!loading && votingPower !== null && parseFloat(votingPower) === 0) {
      notifyWarning("You don't have any voting power for this proposal.");
      navigate(`/governance/proposal/${proposalId}`);
    }
  }, [loading, votingPower, navigate, proposalId, notifyWarning]);

  if (loading) {
    return <LoadingState text="Loading proposal details..." />;
  }

  if (pending) {
    return <TransactionPending text="Casting your vote..." />;
  }

  if (!proposal) {
    return (
      <div className="text-center">
        <p className="text-red-500">Failed to load proposal details.</p>
        <Link 
          to="/governance"
          className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-500"
        >
          <ArrowLeftIcon size={16} className="mr-2" />
          Back to Governance
        </Link>
      </div>
    );
  }

  // Format deadline for display
  const deadlineDisplay = proposal.deadline ? new Date(proposal.deadline).toLocaleString() : 'Unknown';
  
  // Calculate time left
  const now = new Date();
  const deadline = new Date(proposal.deadline);
  const timeLeft = deadline - now;
  
  const formatTimeLeft = () => {
    if (timeLeft <= 0) return "Voting has ended";
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    let result = "";
    if (days > 0) result += `${days}d `;
    if (hours > 0 || days > 0) result += `${hours}h `;
    result += `${minutes}m remaining`;
    
    return result;
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Header with navigation */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            to={`/governance/proposal/${proposalId}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
          >
            <ArrowLeftIcon size={16} className="mr-1" />
            Back to Proposal
          </Link>
          
          <div className="text-sm text-indigo-600">
            {formatTimeLeft()}
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cast Your Vote</h2>
      </div>
      
      {/* Proposal Info */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-md font-medium text-gray-900 mb-2">Proposal #{proposal.id}</h3>
        <p className="text-gray-800">{proposal.description}</p>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Deadline:</span> {deadlineDisplay}
          </div>
          <div>
            <span className="font-medium">Your Voting Power:</span> {parseFloat(votingPower).toFixed(4)} JUST
          </div>
        </div>
      </div>
      
      {/* Vote Options */}
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Your Vote</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Vote For */}
          <button
            className={`p-4 flex flex-col items-center justify-center border rounded-lg transition-all ${
              selectedVote === VOTE_TYPES.FOR
                ? 'border-green-500 bg-green-50 shadow-md'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleSelectVote(VOTE_TYPES.FOR)}
          >
            <ThumbsUpIcon 
              size={32} 
              className={selectedVote === VOTE_TYPES.FOR ? 'text-green-500' : 'text-gray-400'} 
            />
            <span className={`mt-2 font-medium ${
              selectedVote === VOTE_TYPES.FOR ? 'text-green-600' : 'text-gray-700'
            }`}>
              Vote For
            </span>
          </button>
          
          {/* Vote Against */}
          <button
            className={`p-4 flex flex-col items-center justify-center border rounded-lg transition-all ${
              selectedVote === VOTE_TYPES.AGAINST
                ? 'border-red-500 bg-red-50 shadow-md'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleSelectVote(VOTE_TYPES.AGAINST)}
          >
            <ThumbsDownIcon 
              size={32} 
              className={selectedVote === VOTE_TYPES.AGAINST ? 'text-red-500' : 'text-gray-400'} 
            />
            <span className={`mt-2 font-medium ${
              selectedVote === VOTE_TYPES.AGAINST ? 'text-red-600' : 'text-gray-700'
            }`}>
              Vote Against
            </span>
          </button>
          
          {/* Abstain */}
          <button
            className={`p-4 flex flex-col items-center justify-center border rounded-lg transition-all ${
              selectedVote === VOTE_TYPES.ABSTAIN
                ? 'border-gray-500 bg-gray-100 shadow-md'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleSelectVote(VOTE_TYPES.ABSTAIN)}
          >
            <BanIcon 
              size={32} 
              className={selectedVote === VOTE_TYPES.ABSTAIN ? 'text-gray-500' : 'text-gray-400'} 
            />
            <span className={`mt-2 font-medium ${
              selectedVote === VOTE_TYPES.ABSTAIN ? 'text-gray-600' : 'text-gray-700'
            }`}>
              Abstain
            </span>
          </button>
        </div>
        
        {/* Submit Button */}
        <button
          onClick={handleVote}
          disabled={selectedVote === null || pending}
          className="w-full md:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Submit Vote
        </button>
      </div>
      
      {/* Help Text */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">About Voting</h3>
        <p className="text-sm text-gray-600">
          Your vote will be recorded on-chain and cannot be changed once submitted. 
          Your voting power for this proposal was determined at the time of snapshot 
          (#{proposal.snapshotId}) and includes both your own tokens and any tokens 
          delegated to you at that time.
        </p>
      </div>
    </div>
  );
};

export default CastVote;