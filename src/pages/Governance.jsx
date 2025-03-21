// src/pages/Governance.jsx
import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, Routes, Route } from 'react-router-dom';
import { 
  PlusIcon, 
  VoteIcon, 
  FileTextIcon,
  ArrowRightIcon,
  BarChart3Icon,
  AlertTriangleIcon
} from 'lucide-react';
import { ethers } from 'ethers';
import { WalletContext } from '../context/WalletContext';
import { ContractsContext } from '../context/ContractsContext';
import { RoleContext } from '../context/RoleContext';
import { NotificationContext } from '../context/NotificationContext';
import NetworkStatus from '../components/common/NetworkStatus';
import DashboardCard, { StatCard } from '../components/common/DashboardCard';
import WalletConnect from '../components/common/WalletConnect';
import ProposalList from '../components/governance/ProposalList';
import ProposalDetails from '../components/governance/ProposalDetails';
import CreateProposal from '../components/governance/CreateProposal';
import CastVote from '../components/governance/CastVote';
import { LoadingState } from '../components/common/LoadingSpinner';

const GovernanceDashboard = () => {
  const { account, isCorrectNetwork } = useContext(WalletContext);
  const { governanceContract, tokenContract } = useContext(ContractsContext);
  const { isProposer, isAdmin, isGuardian } = useContext(RoleContext);
  const { notifyWarning } = useContext(NotificationContext);
  
  const navigate = useNavigate();
  
  const [govParams, setGovParams] = useState(null);
  const [canCreateProposal, setCanCreateProposal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProposals: 0,
    totalProposals: 0,
    executedProposals: 0,
    votingPower: '0'
  });
  
  // Fetch governance parameters and statistics
  useEffect(() => {
    const fetchGovData = async () => {
      if (!governanceContract || !account) return;
      
      try {
        setLoading(true);
        
        // Get governance parameters
        const params = await governanceContract.govParams();
        
        // Check if user can create a proposal
        const userBalance = await tokenContract.balanceOf(account);
        const canCreate = userBalance.gte(params.proposalCreationThreshold);
        
        setGovParams({
          proposalCreationThreshold: ethers.formatEther(params.proposalCreationThreshold),
          proposalStake: ethers.formatEther(params.proposalStake),
          quorum: ethers.formatEther(params.quorum),
          votingDuration: Number(params.votingDuration)
        });
        
        setCanCreateProposal(canCreate);
        
        // Get proposal stats (this is a simplified approach - you might need to adapt based on your contract)
        let activeCount = 0;
        let executedCount = 0;
        let totalCount = 0;
        
        // Try to find the highest proposal ID by searching backward
        let latestId = 0;
        for (let i = 100; i >= 0; i--) {
          try {
            const state = await governanceContract.getProposalState(i);
            latestId = i;
            totalCount = latestId + 1; // +1 because IDs start at 0
            
            if (Number(state) === 0) { // Active
              activeCount++;
            } else if (Number(state) === 5) { // Executed
              executedCount++;
            }
            
            // Found a valid proposal, break the search
            break;
          } catch (error) {
            // Proposal doesn't exist, continue searching
          }
        }
        
        // If we found a valid proposal ID, check all proposals from 0 to that ID
        if (latestId > 0) {
          for (let i = 0; i <= latestId; i++) {
            try {
              const state = await governanceContract.getProposalState(i);
              
              if (Number(state) === 0) { // Active
                activeCount++;
              } else if (Number(state) === 5) { // Executed
                executedCount++;
              }
            } catch (error) {
              // Skip invalid proposals
              console.log(`Error checking proposal ${i}:`, error);
            }
          }
        }
        
        // Get user's current voting power
        const votingPower = await tokenContract.getCurrentVotes(account);
        
        setStats({
          activeProposals: activeCount,
          totalProposals: totalCount,
          executedProposals: executedCount,
          votingPower: ethers.formatEther(votingPower)
        });
      } catch (error) {
        console.error("Error fetching governance data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGovData();
  }, [governanceContract, tokenContract, account]);
  
  // Handle proposal creation button click
  const handleCreateProposal = () => {
    if (!account) {
      notifyWarning("Please connect your wallet to create a proposal");
      return;
    }
    
    if (!isCorrectNetwork) {
      notifyWarning("Please connect to the correct network to create a proposal");
      return;
    }
    
    if (!canCreateProposal && !isAdmin && !isProposer) {
      notifyWarning(`You need at least ${govParams?.proposalCreationThreshold} JUST tokens to create a proposal`);
      return;
    }
    
    navigate('/governance/create');
  };
  
  // If wallet is not connected, show connect prompt
  if (!account) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Governance</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletConnect />
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">About Governance</h2>
            <p className="text-gray-600 mb-4">
              Connect your wallet to participate in governance proposals, vote on key decisions, and help shape the future of the DAO.
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Review active proposals and historical decisions</li>
              <li>Vote on proposals using your JUST tokens</li>
              <li>Create new proposals if you meet the token threshold</li>
              <li>Monitor proposal execution through the timelock</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return <LoadingState text="Loading governance data..." />;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Governance Dashboard</h1>
      
      {/* Network Status */}
      <div className="mb-6">
        <NetworkStatus />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Proposals"
          value={stats.activeProposals.toString()}
          icon={<VoteIcon size={20} />}
        />
        
        <StatCard
          title="Total Proposals"
          value={stats.totalProposals.toString()}
          icon={<FileTextIcon size={20} />}
        />
        
        <StatCard
          title="Executed Proposals"
          value={stats.executedProposals.toString()}
          icon={<ArrowRightIcon size={20} />}
        />
        
        <StatCard
          title="Your Voting Power"
          value={`${parseFloat(stats.votingPower).toFixed(2)} JUST`}
          icon={<BarChart3Icon size={20} />}
        />
      </div>
      
      {/* Governance Parameters */}
      <div className="mb-6">
        <DashboardCard
          title="Governance Parameters"
          icon={<FileTextIcon size={20} />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">Proposal Threshold</div>
              <div className="font-medium">{govParams?.proposalCreationThreshold} JUST</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">Proposal Stake</div>
              <div className="font-medium">{govParams?.proposalStake} JUST</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">Quorum</div>
              <div className="font-medium">{govParams?.quorum} JUST</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-500">Voting Duration</div>
              <div className="font-medium">{Math.floor(govParams?.votingDuration / 86400)} days</div>
            </div>
          </div>
          
          {!canCreateProposal && !isAdmin && !isProposer && (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md flex items-start">
              <AlertTriangleIcon size={18} className="mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                You need at least {govParams?.proposalCreationThreshold} JUST tokens to create a proposal. 
                Your current balance is insufficient.
              </p>
            </div>
          )}
        </DashboardCard>
      </div>
      
      {/* Create Proposal Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Proposals</h2>
        
        <button
          onClick={handleCreateProposal}
          disabled={!canCreateProposal && !isAdmin && !isProposer}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${(!canCreateProposal && !isAdmin && !isProposer) 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
        >
          <PlusIcon size={16} className="mr-2" />
          Create Proposal
        </button>
      </div>
      
      {/* Proposal List */}
      <ProposalList />
    </div>
  );
};

const Governance = () => {
  return (
    <Routes>
      <Route path="/" element={<GovernanceDashboard />} />
      <Route path="/create" element={<CreateProposal />} />
      <Route path="/proposals/:proposalId" element={<ProposalDetails />} />
      <Route path="/proposal/:proposalId" element={<ProposalDetails />} />
      <Route path="/proposal/:proposalId/vote" element={<CastVote />} />
    </Routes>
  );
};

export default Governance;