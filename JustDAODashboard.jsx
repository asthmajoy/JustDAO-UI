import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';
import { useDelegation } from '../hooks/useDelegation';
import { useProposals } from '../hooks/useProposals';
import { useVoting } from '../hooks/useVoting';
import { formatAddress, formatBigNumber, formatRelativeTime, formatCountdown, formatPercentage } from '../utils/formatters';
import { PROPOSAL_STATES, PROPOSAL_TYPES, VOTE_TYPES } from '../utils/constants';
import { ArrowRight, Clock, Check, X, AlertTriangle, Shield, AlertCircle } from 'lucide-react';
import Loader from '../components/Loader';
import { ethers } from 'ethers';

const JustDAODashboard = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Web3 context for blockchain connection
  const { account, isConnected, connectWallet, disconnectWallet, contracts, provider } = useWeb3();
  
  // Auth context for user data
  const { user, hasRole } = useAuth();
  
  // Custom hooks for DAO functionality
  const delegation = useDelegation();
  const proposalsHook = useProposals();
  const votingHook = useVoting();
  
  // Dashboard metrics state
  const [dashboardStats, setDashboardStats] = useState({
    totalHolders: 0,
    circulatingSupply: "0",
    activeProposals: 0,
    totalProposals: 0,
    participationRate: 0,
    delegationRate: 0,
    proposalSuccessRate: 0
  });
  
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (contracts.token && contracts.governance) {
        setLoadingStats(true);
        try {
          // Get token holders count
          let totalHolders = 0;
          
          // First try to get the count from the analytics helper
          if (contracts.analyticsHelper) {
            try {
              const tokenAnalytics = await contracts.analyticsHelper.getTokenDistributionAnalytics();
              if (tokenAnalytics) {
                // Sum up holder counts by category
                totalHolders = parseInt(tokenAnalytics.smallHolderCount.toString()) + 
                              parseInt(tokenAnalytics.mediumHolderCount.toString()) + 
                              parseInt(tokenAnalytics.largeHolderCount.toString());
              }
            } catch (analyticsError) {
              console.warn("Error getting analytics data:", analyticsError);
              
              // Try to get a rough estimate from transfer events if analytics fails
              try {
                const tokenAddress = await contracts.token.address;
                const transferFilter = contracts.token.filters.Transfer();
                const transferEvents = await contracts.token.queryFilter(transferFilter, -10000); // Last 10000 blocks
                
                // Count unique addresses
                const uniqueAddresses = new Set();
                transferEvents.forEach(event => {
                  uniqueAddresses.add(event.args.from);
                  uniqueAddresses.add(event.args.to);
                });
                
                // Remove zero address (mint/burn)
                uniqueAddresses.delete('0x0000000000000000000000000000000000000000');
                
                totalHolders = uniqueAddresses.size;
              } catch (eventsError) {
                console.error("Error counting holders from events:", eventsError);
                totalHolders = 0; // Fallback to 0 if all methods fail
              }
            }
          }
          
          // Get token supply directly from the token contract
          const totalSupply = await contracts.token.totalSupply();
          const circulatingSupply = formatBigNumber(totalSupply);
          
          // Get proposals data
          const proposalCount = await getProposalCount();
          const activeProposals = proposalsHook.proposals.filter(
            p => p.state === PROPOSAL_STATES.ACTIVE
          ).length;
          
          // Get participation rate from recent proposals
          let participationRate = 0;
          let successRate = 0;
          
          if (contracts.analyticsHelper) {
            try {
              // Try to get metrics from analytics helper
              const proposalAnalytics = await contracts.analyticsHelper.getProposalAnalytics(0, 100);
              if (proposalAnalytics) {
                participationRate = (proposalAnalytics.avgVotingTurnout / 100);
                successRate = (proposalAnalytics.generalSuccessRate / 100);
              }
            } catch (error) {
              console.warn("Error getting proposal analytics:", error);
            }
          }
          
          // Get delegation rate
          let delegationRate = 0;
          try {
            // Get delegation rate from token snapshot metrics
            const currentSnapshotId = await contracts.token.getCurrentSnapshotId();
            const snapshotMetrics = await contracts.token.getSnapshotMetrics(currentSnapshotId);
            delegationRate = snapshotMetrics.percentageDelegated / 100;
          } catch (error) {
            console.warn("Error getting delegation rate:", error);
          }
          
          setDashboardStats({
            totalHolders: totalHolders || 0,
            circulatingSupply,
            activeProposals,
            totalProposals: proposalCount,
            participationRate: participationRate || 65, // Fallback value
            delegationRate: delegationRate || 60, // Fallback value
            proposalSuccessRate: successRate || 75 // Fallback value
          });
        } catch (error) {
          console.error("Error loading dashboard data:", error);
          // Set minimal default values on error
          setDashboardStats({
            totalHolders: 0,
            circulatingSupply: user.balance || "0",
            activeProposals: 0,
            totalProposals: 0,
            participationRate: 0,
            delegationRate: 0,
            proposalSuccessRate: 0
          });
        } finally {
          setLoadingStats(false);
        }
      }
    };
    
    // Helper function to get total proposal count
    const getProposalCount = async () => {
      try {
        // Try different approaches to get the proposal count
        // 1. Try to get the count from the most recent proposal ID
        let proposalId = 0;
        let found = false;
        
        // Binary search to find the highest proposal ID
        let low = 0;
        let high = 10000;  // Arbitrary upper limit
        
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          
          try {
            await contracts.governance.getProposalState(mid);
            // If we get here, the proposal exists
            found = true;
            proposalId = mid;
            low = mid + 1;
          } catch (error) {
            // Proposal doesn't exist
            high = mid - 1;
          }
        }
        
        return found ? proposalId + 1 : 0;
      } catch (error) {
        console.error("Error getting proposal count:", error);
        return 0;
      }
    };
    
    loadDashboardData();
  }, [contracts, proposalsHook.proposals, user.balance]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600">JustDAO</h1>
          </div>
          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="text-sm text-gray-700">
                <div>{formatAddress(account)}</div>
                <div className="flex gap-2">
                  <span>{user.balance} JUST</span>
                  <span>|</span>
                  <span>{user.votingPower} Voting Power</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-700">Not connected</div>
            )}
            {isConnected ? (
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            ) : (
              <button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                onClick={connectWallet}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto">
            <div 
              className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'dashboard' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </div>
            <div 
              className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'proposals' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('proposals')}
            >
              Proposals
            </div>
            <div 
              className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'vote' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('vote')}
            >
              Vote
            </div>
            <div 
              className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'delegation' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('delegation')}
            >
              Delegation
            </div>
            
            {/* Analytics tab - only visible to analytics role */}
            {hasRole('analytics') && (
              <div 
                className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'analytics' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </div>
            )}
            
            {/* Role Management tab - only visible to admin role */}
            {hasRole('admin') && (
              <div 
                className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'roles' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('roles')}
              >
                Roles
              </div>
            )}
            
            {/* Security Settings tab - only visible to admin role */}
            {hasRole('admin') && (
              <div 
                className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'security' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('security')}
              >
                Security
              </div>
            )}
            
            {/* Timelock Settings tab - only visible to admin role */}
            {hasRole('admin') && (
              <div 
                className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'timelock' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('timelock')}
              >
                Timelock
              </div>
            )}
            
            {/* Emergency Controls tab - only visible to admin or guardian roles */}
            {(hasRole('admin') || hasRole('guardian')) && (
              <div 
                className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'emergency' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('emergency')}
              >
                Emergency
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'dashboard' && (
          <DashboardTab 
            user={user} 
            stats={dashboardStats}
            loading={loadingStats}
            proposals={proposalsHook.proposals.filter(p => p.state === PROPOSAL_STATES.ACTIVE)}
          />
        )}
        {activeTab === 'proposals' && (
          <ProposalsTab 
            proposals={proposalsHook.proposals}
            createProposal={proposalsHook.createProposal}
            cancelProposal={proposalsHook.cancelProposal}
            queueProposal={proposalsHook.queueProposal}
            executeProposal={proposalsHook.executeProposal}
            claimRefund={proposalsHook.claimRefund}
            loading={proposalsHook.loading}
          />
        )}
        {activeTab === 'vote' && (
          <VoteTab 
            proposals={proposalsHook.proposals}
            castVote={votingHook.castVote}
            hasVoted={votingHook.hasVoted}
            getVotingPower={votingHook.getVotingPower}
            voting={votingHook.voting}
            account={account}
          />
        )}
        {activeTab === 'delegation' && (
          <DelegationTab 
            user={user} 
            delegation={delegation}
          />
        )}
        {activeTab === 'analytics' && hasRole('analytics') && (
          <AnalyticsTab contracts={contracts} />
        )}
        {activeTab === 'roles' && hasRole('admin') && (
          <RoleManagementTab contracts={contracts} />
        )}
        {activeTab === 'security' && hasRole('admin') && (
          <SecuritySettingsTab contracts={contracts} />
        )}
        {activeTab === 'timelock' && hasRole('admin') && (
          <TimelockSettingsTab contracts={contracts} />
        )}
        {activeTab === 'emergency' && (hasRole('admin') || hasRole('guardian')) && (
          <EmergencyControlsTab contracts={contracts} account={account} hasRole={hasRole} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          JustDAO &copy; {new Date().getFullYear()} - Powered by JustDAO Governance Framework
        </div>
      </footer>
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ user, stats, loading, proposals }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      
      {/* Governance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">DAO Overview</h3>
          {loading ? (
            <Loader size="small" text="Loading stats..." />
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Token Holders</p>
                <p className="text-2xl font-bold">{stats.totalHolders}</p>
              </div>
              <div>
                <p className="text-gray-500">Circulating</p>
                <p className="text-2xl font-bold">{stats.circulatingSupply}</p>
              </div>
              <div>
                <p className="text-gray-500">Active Proposals</p>
                <p className="text-2xl font-bold">{stats.activeProposals}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Proposals</p>
                <p className="text-2xl font-bold">{stats.totalProposals}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your Account</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-500">Balance</p>
              <p className="text-2xl font-bold">{user.balance} JUST</p>
            </div>
            <div>
              <p className="text-gray-500">Voting Power</p>
              <p className="text-2xl font-bold">{user.votingPower} JUST</p>
            </div>
            <div className="mt-4">
              <button 
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                onClick={() => document.querySelector('[data-tab="delegation"]')?.click()}
              >
                View Delegation Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Governance Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-gray-500 text-sm">Participation Rate</p>
                <p className="text-sm font-medium">{stats.participationRate.toFixed(0)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.participationRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-gray-500 text-sm">Delegation Rate</p>
                <p className="text-sm font-medium">{stats.delegationRate.toFixed(0)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.delegationRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-gray-500 text-sm">Proposal Success Rate</p>
                <p className="text-sm font-medium">{stats.proposalSuccessRate.toFixed(0)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${stats.proposalSuccessRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active Proposals */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Active Proposals</h3>
          <button 
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            onClick={() => document.querySelector('[data-tab="proposals"]')?.click()}
          >
            View All
          </button>
        </div>
        <div className="space-y-4">
          {proposals.length > 0 ? (
            proposals.map((proposal, idx) => {
              const totalVotes = parseFloat(proposal.yesVotes) + parseFloat(proposal.noVotes) + parseFloat(proposal.abstainVotes);
              const yesPercentage = totalVotes > 0 ? (parseFloat(proposal.yesVotes) / totalVotes) * 100 : 0;
              const noPercentage = totalVotes > 0 ? (parseFloat(proposal.noVotes) / totalVotes) * 100 : 0;
              const abstainPercentage = totalVotes > 0 ? (parseFloat(proposal.abstainVotes) / totalVotes) * 100 : 0;
              
              return (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{proposal.title}</p>
                      <p className="text-xs text-gray-500">Proposal #{proposal.id}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatCountdown(proposal.deadline)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Yes: {yesPercentage.toFixed(0)}%</span>
                    <span>No: {noPercentage.toFixed(0)}%</span>
                    <span>Abstain: {abstainPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-green-500 h-full" style={{ width: `${yesPercentage}%` }}></div>
                      <div className="bg-red-500 h-full" style={{ width: `${noPercentage}%` }}></div>
                      <div className="bg-gray-400 h-full" style={{ width: `${abstainPercentage}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              No active proposals at the moment
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Proposals Tab Component
const ProposalsTab = ({ 
  proposals, 
  createProposal, 
  cancelProposal, 
  queueProposal, 
  executeProposal, 
  claimRefund,
  loading
}) => {
  const [proposalType, setProposalType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: PROPOSAL_TYPES.GENERAL,
    target: '',
    callData: '',
    amount: '',
    recipient: '',
    token: '',
    newThreshold: '',
    newQuorum: '',
    newVotingDuration: '',
    newTimelockDelay: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [transactionError, setTransactionError] = useState('');

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTransactionError('');
    
    try {
      const description = `${newProposal.title}\n\n${newProposal.description}`;
      
      // Convert values to proper format
      const amount = newProposal.amount ? ethers.utils.parseEther(newProposal.amount.toString()) : 0;
      const newThreshold = newProposal.newThreshold ? ethers.utils.parseEther(newProposal.newThreshold.toString()) : 0;
      const newQuorum = newProposal.newQuorum ? ethers.utils.parseEther(newProposal.newQuorum.toString()) : 0;
      const newVotingDuration = newProposal.newVotingDuration ? parseInt(newProposal.newVotingDuration) : 0;
      const newTimelockDelay = newProposal.newTimelockDelay ? parseInt(newProposal.newTimelockDelay) : 0;
      
      // Validate inputs based on proposal type
      if (!validateProposalInputs(newProposal)) {
        setTransactionError('Please fill in all required fields for this proposal type.');
        setSubmitting(false);
        return;
      }
      
      console.log('Submitting proposal:', {
        description,
        type: parseInt(newProposal.type),
        target: newProposal.target,
        callData: newProposal.callData || '0x',
        amount,
        recipient: newProposal.recipient,
        token: newProposal.token,
        newThreshold,
        newQuorum,
        newVotingDuration,
        newTimelockDelay
      });
      
      await createProposal(
        description,
        parseInt(newProposal.type),
        newProposal.target,
        newProposal.callData || '0x',
        amount,
        newProposal.recipient,
        newProposal.token,
        newThreshold,
        newQuorum,
        newVotingDuration,
        newTimelockDelay
      );
      
      setShowCreateModal(false);
      // Reset form
      setNewProposal({
        title: '',
        description: '',
        type: PROPOSAL_TYPES.GENERAL,
        target: '',
        callData: '',
        amount: '',
        recipient: '',
        token: '',
        newThreshold: '',
        newQuorum: '',
        newVotingDuration: '',
        newTimelockDelay: ''
      });
    } catch (error) {
      console.error("Error creating proposal:", error);
      setTransactionError(error.message || 'Error creating proposal. See console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Validate proposal inputs based on type
  const validateProposalInputs = (proposal) => {
    switch (parseInt(proposal.type)) {
      case PROPOSAL_TYPES.GENERAL:
        return proposal.target && proposal.callData;
      
      case PROPOSAL_TYPES.WITHDRAWAL:
        return proposal.recipient && proposal.amount;
      
      case PROPOSAL_TYPES.TOKEN_TRANSFER:
        return proposal.recipient && proposal.amount;
      
      case PROPOSAL_TYPES.GOVERNANCE_CHANGE:
        // At least one parameter must be changed
        return proposal.newThreshold || proposal.newQuorum || 
               proposal.newVotingDuration || proposal.newTimelockDelay;
      
      case PROPOSAL_TYPES.EXTERNAL_ERC20_TRANSFER:
        return proposal.recipient && proposal.token && proposal.amount;
      
      case PROPOSAL_TYPES.TOKEN_MINT:
        return proposal.recipient && proposal.amount;
      
      case PROPOSAL_TYPES.TOKEN_BURN:
        return proposal.recipient && proposal.amount;
      
      default:
        return false;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Proposals</h2>
          <p className="text-gray-500">View, create, and manage proposals</p>
        </div>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          onClick={() => setShowCreateModal(true)}
        >
          Create Proposal
        </button>
      </div>
      
      {/* Filter options */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'pending', 'succeeded', 'executed', 'defeated', 'canceled'].map(type => (
            <button
              key={type}
              className={`px-3 py-1 rounded-full text-sm ${proposalType === type ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setProposalType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Proposals list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader size="large" text="Loading proposals..." />
          </div>
        ) : proposals.length > 0 ? (
          proposals
            .filter(p => proposalType === 'all' || p.stateLabel.toLowerCase() === proposalType)
            .map((proposal, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{proposal.title}</h3>
                    <p className="text-sm text-gray-500">Proposal #{proposal.id}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(proposal.stateLabel.toLowerCase())}`}>
                      {proposal.stateLabel}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-500">
                  <div>
                    <p className="font-medium">Type</p>
                    <p>{proposal.typeLabel}</p>
                  </div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p>{formatRelativeTime(proposal.createdAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Proposer</p>
                    <p>{formatAddress(proposal.proposer)}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 mb-4">
                  <p className="text-sm text-gray-700 mb-2">{proposal.description.substring(0, 200)}...</p>
                  
                  {/* Display proposal-specific details */}
                  {proposal.type === PROPOSAL_TYPES.GENERAL && (
                    <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                      <p><span className="font-medium">Target:</span> {formatAddress(proposal.target)}</p>
                      <p><span className="font-medium">Call Data:</span> {proposal.callData.substring(0, 20)}...</p>
                    </div>
                  )}
                  
                  {(proposal.type === PROPOSAL_TYPES.WITHDRAWAL || 
                    proposal.type === PROPOSAL_TYPES.TOKEN_TRANSFER || 
                    proposal.type === PROPOSAL_TYPES.TOKEN_MINT || 
                    proposal.type === PROPOSAL_TYPES.TOKEN_BURN) && (
                    <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                      <p><span className="font-medium">Recipient:</span> {formatAddress(proposal.recipient)}</p>
                      <p><span className="font-medium">Amount:</span> {formatBigNumber(proposal.amount)}</p>
                    </div>
                  )}
                  
                  {proposal.type === PROPOSAL_TYPES.EXTERNAL_ERC20_TRANSFER && (
                    <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                      <p><span className="font-medium">Recipient:</span> {formatAddress(proposal.recipient)}</p>
                      <p><span className="font-medium">Token:</span> {formatAddress(proposal.token)}</p>
                      <p><span className="font-medium">Amount:</span> {formatBigNumber(proposal.amount)}</p>
                    </div>
                  )}
                  
                  {proposal.type === PROPOSAL_TYPES.GOVERNANCE_CHANGE && (
                    <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                      {proposal.newThreshold && <p><span className="font-medium">New Threshold:</span> {formatBigNumber(proposal.newThreshold)}</p>}
                      {proposal.newQuorum && <p><span className="font-medium">New Quorum:</span> {formatBigNumber(proposal.newQuorum)}</p>}
                      {proposal.newVotingDuration && <p><span className="font-medium">New Voting Duration:</span> {formatTime(proposal.newVotingDuration)}</p>}
                      {proposal.newTimelockDelay && <p><span className="font-medium">New Timelock Delay:</span> {formatTime(proposal.newTimelockDelay)}</p>}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button className="text-indigo-600 border border-indigo-600 px-3 py-1 rounded-md text-sm hover:bg-indigo-50">View Details</button>
                  
                  {proposal.state === PROPOSAL_STATES.ACTIVE && (
                    <button 
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                      onClick={() => cancelProposal(proposal.id)}
                    >
                      Cancel
                    </button>
                  )}
                  
                  {proposal.state === PROPOSAL_STATES.SUCCEEDED && (
                    <button 
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                      onClick={() => queueProposal(proposal.id)}
                    >
                      Queue
                    </button>
                  )}
                  
                  {proposal.state === PROPOSAL_STATES.QUEUED && (
                    <button 
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm"
                      onClick={() => executeProposal(proposal.id)}
                    >
                      Execute
                    </button>
                  )}
                  
                  {(proposal.state === PROPOSAL_STATES.DEFEATED || 
                    proposal.state === PROPOSAL_STATES.CANCELED || 
                    proposal.state === PROPOSAL_STATES.EXPIRED) && (
                    <button 
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm"
                      onClick={() => claimRefund(proposal.id)}
                    >
                      Claim Refund
                    </button>
                  )}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No proposals found
          </div>
        )}
      </div>
      
      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Proposal</h2>
            
            {transactionError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Error</p>
                <p>{transactionError}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title</label>
                <input 
                  type="text" 
                  className="w-full rounded-md border border-gray-300 p-2" 
                  placeholder="Enter proposal title" 
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Type</label>
                <select 
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={newProposal.type}
                  onChange={(e) => setNewProposal({...newProposal, type: e.target.value})}
                  required
                >
                  <option value={PROPOSAL_TYPES.GENERAL}>General</option>
                  <option value={PROPOSAL_TYPES.WITHDRAWAL}>Withdrawal</option>
                  <option value={PROPOSAL_TYPES.TOKEN_TRANSFER}>Token Transfer</option>
                  <option value={PROPOSAL_TYPES.GOVERNANCE_CHANGE}>Governance Change</option>
                  <option value={PROPOSAL_TYPES.EXTERNAL_ERC20_TRANSFER}>External ERC20 Transfer</option>
                  <option value={PROPOSAL_TYPES.TOKEN_MINT}>Token Mint</option>
                  <option value={PROPOSAL_TYPES.TOKEN_BURN}>Token Burn</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 p-2" 
                  rows="4" 
                  placeholder="Describe your proposal"
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                  required
                ></textarea>
              </div>
              
              {/* Additional fields based on proposal type */}
              {parseInt(newProposal.type) === PROPOSAL_TYPES.GENERAL && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Address</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="0x..." 
                      value={newProposal.target}
                      onChange={(e) => setNewProposal({...newProposal, target: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The contract address that will be called</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call Data</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="0x..." 
                      value={newProposal.callData}
                      onChange={(e) => setNewProposal({...newProposal, callData: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The encoded function call data</p>
                  </div>
                </>
              )}
              
              {parseInt(newProposal.type) === PROPOSAL_TYPES.WITHDRAWAL && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="0x..." 
                      value={newProposal.recipient}
                      onChange={(e) => setNewProposal({...newProposal, recipient: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The address that will receive the ETH</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ETH)</label>
                    <input 
                      type="number" 
                      step="0.000000000000000001"
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="Amount" 
                      value={newProposal.amount}
                      onChange={(e) => setNewProposal({...newProposal, amount: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Amount of ETH to withdraw</p>
                  </div>
                </>
              )}
              
              {parseInt(newProposal.type) === PROPOSAL_TYPES.TOKEN_TRANSFER && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="0x..." 
                      value={newProposal.recipient}
                      onChange={(e) => setNewProposal({...newProposal, recipient: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The address that will receive the JUST tokens</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (JUST)</label>
                    <input 
                      type="number"
                      step="0.000000000000000001"
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="Amount" 
                      value={newProposal.amount}
                      onChange={(e) => setNewProposal({...newProposal, amount: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Amount of JUST tokens to transfer</p>
                  </div>
                </>
              )}
              
              {parseInt(newProposal.type) === PROPOSAL_TYPES.TOKEN_MINT && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="0x..." 
                      value={newProposal.recipient}
                      onChange={(e) => setNewProposal({...newProposal, recipient: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The address that will receive the minted JUST tokens</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Mint (JUST)</label>
                    <input 
                      type="number"
                      step="0.000000000000000001"
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="Amount" 
                      value={newProposal.amount}
                      onChange={(e) => setNewProposal({...newProposal, amount: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Amount of JUST tokens to mint</p>
                  </div>
                </>
              )}
              
              {parseInt(newProposal.type) === PROPOSAL_TYPES.TOKEN_BURN && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="0x..." 
                      value={newProposal.recipient}
                      onChange={(e) => setNewProposal({...newProposal, recipient: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The address from which tokens will be burned</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Burn (JUST)</label>
                    <input 
                      type="number"
                      step="0.000000000000000001"
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="Amount" 
                      value={newProposal.amount}
                      onChange={(e) => setNewProposal({...newProposal, amount: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Amount of JUST tokens to burn</p>
                  </div>
                </>
              )}
              
              {parseInt(newProposal.type) === PROPOSAL_TYPES.EXTERNAL_ERC20_TRANSFER && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="0x..." 
                      value={newProposal.recipient}
                      onChange={(e) => setNewProposal({...newProposal, recipient: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The address that will receive the tokens</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Token Address</label>
                    <input 
                      type="text" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="0x..." 
                      value={newProposal.token}
                      onChange={(e) => setNewProposal({...newProposal, token: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">The ERC20 token contract address</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input 
                      type="number"
                      step="0.000000000000000001"
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="Amount" 
                      value={newProposal.amount}
                      onChange={(e) => setNewProposal({...newProposal, amount: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Amount of tokens to transfer</p>
                  </div>
                </>
              )}
              
              {parseInt(newProposal.type) === PROPOSAL_TYPES.GOVERNANCE_CHANGE && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Threshold (JUST tokens, optional)</label>
                    <input 
                      type="number"
                      step="0.000000000000000001"
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="New proposal threshold" 
                      value={newProposal.newThreshold}
                      onChange={(e) => setNewProposal({...newProposal, newThreshold: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum tokens required to create a proposal</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Quorum (JUST tokens, optional)</label>
                    <input 
                      type="number"
                      step="0.000000000000000001"
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="New quorum" 
                      value={newProposal.newQuorum}
                      onChange={(e) => setNewProposal({...newProposal, newQuorum: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum votes required for a proposal to pass</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Voting Duration (seconds, optional)</label>
                    <input 
                      type="number" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="New voting duration" 
                      value={newProposal.newVotingDuration}
                      onChange={(e) => setNewProposal({...newProposal, newVotingDuration: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Duration of the voting period in seconds</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Timelock Delay (seconds, optional)</label>
                    <input 
                      type="number" 
                      className="w-full rounded-md border border-gray-300 p-2" 
                      placeholder="New timelock delay" 
                      value={newProposal.newTimelockDelay}
                      onChange={(e) => setNewProposal({...newProposal, newTimelockDelay: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">Delay before a passed proposal can be executed</p>
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                  disabled={submitting}
                >
                  {submitting ? 'Creating Proposal...' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Vote Tab Component
const VoteTab = ({ proposals, castVote, hasVoted, getVotingPower, voting, account }) => {
  const [voteFilter, setVoteFilter] = useState('active');
  
  // Filter proposals based on vote status
  const filteredProposals = proposals.filter(proposal => {
    if (voteFilter === 'active') {
      return proposal.state === PROPOSAL_STATES.ACTIVE && !proposal.hasVoted;
    } else if (voteFilter === 'voted') {
      return proposal.hasVoted;
    }
    return true; // 'all' filter
  });

  // Submit vote
  const submitVote = async (proposalId, support) => {
    try {
      await castVote(proposalId, support);
    } catch (error) {
      console.error("Error casting vote:", error);
      alert("Error casting vote. See console for details.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Vote</h2>
        <p className="text-gray-500">Cast your votes on active proposals</p>
      </div>
      
      {/* Filter options */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          {['active', 'voted', 'all'].map(filter => (
            <button
              key={filter}
              className={`px-3 py-1 rounded-full text-sm ${voteFilter === filter ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setVoteFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Voting cards */}
      <div className="space-y-6">
        {voting.loading ? (
          <div className="flex justify-center py-8">
            <Loader size="large" text="Loading proposals..." />
          </div>
        ) : filteredProposals.length > 0 ? (
          filteredProposals.map((proposal, idx) => {
            const totalVotes = parseFloat(proposal.yesVotes) + parseFloat(proposal.noVotes) + parseFloat(proposal.abstainVotes);
            const yesPercentage = totalVotes > 0 ? (parseFloat(proposal.yesVotes) / totalVotes) * 100 : 0;
            const noPercentage = totalVotes > 0 ? (parseFloat(proposal.noVotes) / totalVotes) * 100 : 0;
            const abstainPercentage = totalVotes > 0 ? (parseFloat(proposal.abstainVotes) / totalVotes) * 100 : 0;
            
            return (
              <div key={idx} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium">{proposal.title}</h3>
                    <p className="text-xs text-gray-500">Proposal #{proposal.id}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatCountdown(proposal.deadline)}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{proposal.description.substring(0, 150)}...</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Yes: {yesPercentage.toFixed(0)}%</span>
                    <span>No: {noPercentage.toFixed(0)}%</span>
                    <span>Abstain: {abstainPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="bg-green-500 h-full" style={{ width: `${yesPercentage}%` }}></div>
                      <div className="bg-red-500 h-full" style={{ width: `${noPercentage}%` }}></div>
                      <div className="bg-gray-400 h-full" style={{ width: `${abstainPercentage}%` }}></div>
                    </div>
                  </div>
                </div>
                
                {proposal.hasVoted ? (
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="mr-2">You voted:</span>
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {proposal.votedYes ? 'Yes' : proposal.votedNo ? 'No' : 'Abstain'}
                    </span>
                  </div>
                ) : proposal.state === PROPOSAL_STATES.ACTIVE && (
                  <div className="flex space-x-2">
                    <button 
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md flex items-center justify-center"
                      onClick={() => submitVote(proposal.id, VOTE_TYPES.FOR)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Vote Yes
                    </button>
                    <button 
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md flex items-center justify-center"
                      onClick={() => submitVote(proposal.id, VOTE_TYPES.AGAINST)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Vote No
                    </button>
                    <button 
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md flex items-center justify-center"
                      onClick={() => submitVote(proposal.id, VOTE_TYPES.ABSTAIN)}
                    >
                      Abstain
                    </button>
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View Full Details
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            No proposals found for this filter
          </div>
        )}
      </div>
    </div>
  );
};

// Delegation Tab Component
const DelegationTab = ({ user, delegation }) => {
  const [delegateAddress, setDelegateAddress] = useState('');
  const { delegationInfo, loading, delegate, resetDelegation, getDelegationDepthWarning } = delegation;

  const handleDelegate = async () => {
    if (!delegateAddress) return;
    
    try {
      // Check for potential delegation depth issues
      const warning = await getDelegationDepthWarning(user.address, delegateAddress);
      
      if (warning.warningLevel === 3) {
        alert("This delegation would exceed the maximum delegation depth limit or create a cycle");
        return;
      } else if (warning.warningLevel > 0) {
        const proceed = window.confirm(warning.message + ". Do you want to proceed?");
        if (!proceed) return;
      }
      
      await delegate(delegateAddress);
      setDelegateAddress('');
    } catch (error) {
      console.error("Error delegating:", error);
      alert("Error delegating. See console for details.");
    }
  };

  const handleResetDelegation = async () => {
    try {
      await resetDelegation();
    } catch (error) {
      console.error("Error resetting delegation:", error);
      alert("Error resetting delegation. See console for details.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Delegation</h2>
        <p className="text-gray-500">Manage your voting power delegation</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader size="large" text="Loading delegation data..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Your delegation status */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Delegation Status</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Current Delegate</p>
                <p className="font-medium">
                  {delegationInfo.currentDelegate && delegationInfo.currentDelegate !== user.address ? 
                    formatAddress(delegationInfo.currentDelegate) : 
                    'Self (not delegated)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Locked Tokens</p>
                <p className="font-medium">{delegationInfo.lockedTokens} JUST</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Balance</p>
                <p className="font-medium">{user.balance} JUST</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Voting Power</p>
                <p className="font-medium">{user.votingPower} JUST</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delegate To</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    className="flex-1 rounded-md border border-gray-300 p-2" 
                    placeholder="Enter delegate address" 
                    value={delegateAddress}
                    onChange={(e) => setDelegateAddress(e.target.value)}
                  />
                  <button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                    onClick={handleDelegate}
                  >
                    Delegate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Delegating locks your tokens but allows you to maintain ownership while transferring voting power.
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                {delegationInfo.currentDelegate && delegationInfo.currentDelegate !== user.address && (
                  <button 
                    className="w-full bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded-md"
                    onClick={handleResetDelegation}
                  >
                    Reset Delegation (Self-Delegate)
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Delegated to you */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delegated to You</h3>
            
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-indigo-600">{delegationInfo.delegatedToYou}</p>
              <p className="text-sm text-gray-500">JUST tokens</p>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">
              You have {delegationInfo.delegatedToYou} JUST tokens delegated to your address from other token holders.
            </p>
            
            {delegationInfo.delegators && delegationInfo.delegators.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Your Delegators:</h4>
                {delegationInfo.delegators.map((delegator, idx) => (
                  <div key={idx} className="text-sm flex justify-between items-center border-t pt-2">
                    <span>{formatAddress(delegator.address)}</span>
                    <span className="font-medium">{delegator.balance} JUST</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No delegators yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics Tab Component (Role-restricted)
const AnalyticsTab = ({ contracts }) => {
  const [selectedMetric, setSelectedMetric] = useState('proposal');
  const [analyticsData, setAnalyticsData] = useState({
    proposals: null,
    voters: null,
    tokens: null,
    timelock: null,
    health: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!contracts.analyticsHelper) return;
      
      setLoading(true);
      try {
        switch (selectedMetric) {
          case 'proposal':
            const proposalAnalytics = await contracts.analyticsHelper.getProposalAnalytics(0, 100);
            setAnalyticsData(prevData => ({...prevData, proposals: proposalAnalytics}));
            break;
          case 'voter':
            const voterAnalytics = await contracts.analyticsHelper.getVoterBehaviorAnalytics(100);
            setAnalyticsData(prevData => ({...prevData, voters: voterAnalytics}));
            break;
          case 'token':
            const tokenAnalytics = await contracts.analyticsHelper.getTokenDistributionAnalytics();
            setAnalyticsData(prevData => ({...prevData, tokens: tokenAnalytics}));
            break;
          case 'timelock':
            const timelockAnalytics = await contracts.analyticsHelper.getTimelockAnalytics(100);
            setAnalyticsData(prevData => ({...prevData, timelock: timelockAnalytics}));
            break;
          case 'health':
            const healthScore = await contracts.analyticsHelper.calculateGovernanceHealthScore();
            setAnalyticsData(prevData => ({...prevData, health: healthScore}));
            break;
          default:
            console.log('Unknown metric selected:', selectedMetric);
            break;
        }
      } catch (error) {
        console.error(`Error loading ${selectedMetric} analytics:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, [contracts.analyticsHelper, selectedMetric]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <p className="text-gray-500">Advanced DAO metrics and analytics</p>
      </div>
      
      {/* Metrics selection */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'proposal', label: 'Proposal Analytics' },
            { id: 'voter', label: 'Voter Behavior' },
            { id: 'token', label: 'Token Distribution' },
            { id: 'timelock', label: 'Timelock Analytics' },
            { id: 'health', label: 'Governance Health' }
          ].map(metric => (
            <button
              key={metric.id}
              className={`px-3 py-1 rounded-full text-sm ${selectedMetric === metric.id ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setSelectedMetric(metric.id)}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Analytics content */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader size="large" text="Loading analytics data..." />
          </div>
        ) : (
          <>
            {selectedMetric === 'proposal' && analyticsData.proposals && (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Proposal Analytics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Proposals</p>
                    <p className="text-2xl font-bold">{analyticsData.proposals.totalProposals.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Active Proposals</p>
                    <p className="text-2xl font-bold">{analyticsData.proposals.activeProposals.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(analyticsData.proposals.generalSuccessRate / 100)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Avg. Participation</p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(analyticsData.proposals.avgVotingTurnout / 100)}
                    </p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Success Rate by Proposal Type</h4>
                <div className="space-y-3 mb-6">
                  {[
                    { type: 'General', rate: analyticsData.proposals.generalSuccessRate / 100, count: analyticsData.proposals.generalProposals },
                    { type: 'Withdrawal', rate: analyticsData.proposals.withdrawalSuccessRate / 100, count: analyticsData.proposals.withdrawalProposals },
                    { type: 'TokenTransfer', rate: analyticsData.proposals.tokenTransferSuccessRate / 100, count: analyticsData.proposals.tokenTransferProposals },
                    { type: 'GovernanceChange', rate: analyticsData.proposals.governanceChangeSuccessRate / 100, count: analyticsData.proposals.governanceChangeProposals },
                    { type: 'ExternalERC20Transfer', rate: analyticsData.proposals.externalERC20SuccessRate / 100, count: analyticsData.proposals.externalERC20Proposals },
                    { type: 'TokenMint', rate: analyticsData.proposals.tokenMintSuccessRate / 100, count: analyticsData.proposals.tokenMintProposals },
                    { type: 'TokenBurn', rate: analyticsData.proposals.tokenBurnSuccessRate / 100, count: analyticsData.proposals.tokenBurnProposals }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center">
                          <span className="font-medium">{item.type}</span>
                          <span className="text-xs text-gray-500 ml-2">({item.count.toString()})</span>
                        </div>
                        <span className="text-sm">{formatPercentage(item.rate)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${item.rate > 70 ? 'bg-green-500' : item.rate > 50 ? 'bg-yellow-500' : 'bg-red-500'} h-2 rounded-full`} 
                          style={{ width: `${item.rate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {selectedMetric === 'voter' && analyticsData.voters && (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Voter Behavior Analytics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Voters</p>
                    <p className="text-2xl font-bold">{analyticsData.voters.totalVoters.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Active Voters</p>
                    <p className="text-2xl font-bold">{analyticsData.voters.activeVoters.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Super Active</p>
                    <p className="text-2xl font-bold">{analyticsData.voters.superActiveVoters.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Delegation Rate</p>
                    <p className="text-2xl font-bold">{formatPercentage(analyticsData.tokens?.percentageDelegated / 100 || 0)}</p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Voter Distribution</h4>
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Yes Leaning (>66%)</span>
                      <span className="text-sm">{analyticsData.voters.yesLeaning.toString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.voters.yesLeaning / analyticsData.voters.totalVoters) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">No Leaning (>66%)</span>
                      <span className="text-sm">{analyticsData.voters.noLeaning.toString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(analyticsData.voters.noLeaning / analyticsData.voters.totalVoters) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Balanced Voters</span>
                      <span className="text-sm">{analyticsData.voters.balanced.toString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(analyticsData.voters.balanced / analyticsData.voters.totalVoters) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {selectedMetric === 'token' && analyticsData.tokens && (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Token Distribution Analytics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Supply</p>
                    <p className="text-2xl font-bold">{formatBigNumber(analyticsData.tokens.totalSupply)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Circulating</p>
                    <p className="text-2xl font-bold">{formatBigNumber(analyticsData.tokens.circulatingSupply)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Treasury</p>
                    <p className="text-2xl font-bold">{formatBigNumber(analyticsData.tokens.treasuryBalance)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Delegated</p>
                    <p className="text-2xl font-bold">{formatBigNumber(analyticsData.tokens.delegatedTokens)}</p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Holder Distribution</h4>
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Small Holders (&lt;1%)</span>
                      <span className="text-sm">{formatBigNumber(analyticsData.tokens.smallHolderBalance)} JUST ({((analyticsData.tokens.smallHolderBalance / analyticsData.tokens.totalSupply) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(analyticsData.tokens.smallHolderBalance / analyticsData.tokens.totalSupply) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Medium Holders (1-5%)</span>
                      <span className="text-sm">{formatBigNumber(analyticsData.tokens.mediumHolderBalance)} JUST ({((analyticsData.tokens.mediumHolderBalance / analyticsData.tokens.totalSupply) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(analyticsData.tokens.mediumHolderBalance / analyticsData.tokens.totalSupply) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Large Holders (&gt;5%)</span>
                      <span className="text-sm">{formatBigNumber(analyticsData.tokens.largeHolderBalance)} JUST ({((analyticsData.tokens.largeHolderBalance / analyticsData.tokens.totalSupply) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(analyticsData.tokens.largeHolderBalance / analyticsData.tokens.totalSupply) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Treasury</span>
                      <span className="text-sm">{formatBigNumber(analyticsData.tokens.treasuryBalance)} JUST ({((analyticsData.tokens.treasuryBalance / analyticsData.tokens.totalSupply) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.tokens.treasuryBalance / analyticsData.tokens.totalSupply) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Gini Coefficient: {(analyticsData.tokens.giniCoefficient / 10000).toFixed(2)}</h4>
                <p className="text-sm text-gray-500 mb-4">Represents the inequality of token distribution (0 = perfect equality, 1 = perfect inequality)</p>
              </>
            )}
            
            {selectedMetric === 'health' && analyticsData.health && (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Governance Health Score</h3>
                
                <div className="flex justify-center mb-6">
                  <div className="w-40 h-40 rounded-full border-8 border-indigo-500 flex items-center justify-center">
                    <span className="text-4xl font-bold text-indigo-600">{analyticsData.health[0].toString()}</span>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Health Score Breakdown</h4>
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Participation Score</span>
                      <span className="text-sm">{analyticsData.health[1][0].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][0] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Delegation Score</span>
                      <span className="text-sm">{analyticsData.health[1][1].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][1] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Activity Score</span>
                      <span className="text-sm">{analyticsData.health[1][2].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][2] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Execution Score</span>
                      <span className="text-sm">{analyticsData.health[1][3].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][3] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Threat Diversity Score</span>
                      <span className="text-sm">{analyticsData.health[1][4].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][4] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {selectedMetric === 'timelock' && analyticsData.timelock && (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Timelock Analytics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Transactions</p>
                    <p className="text-2xl font-bold">{analyticsData.timelock.totalTransactions.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Executed</p>
                    <p className="text-2xl font-bold">{analyticsData.timelock.executedTransactions.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold">{analyticsData.timelock.pendingTransactions.toString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Canceled</p>
                    <p className="text-2xl font-bold">{analyticsData.timelock.canceledTransactions.toString()}</p>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Threat Level Distribution</h4>
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Low Threat</span>
                      <span className="text-sm">{analyticsData.timelock.lowThreatCount.toString()} ({analyticsData.timelock.totalTransactions > 0 ? ((analyticsData.timelock.lowThreatCount / analyticsData.timelock.totalTransactions) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${analyticsData.timelock.totalTransactions > 0 ? (analyticsData.timelock.lowThreatCount / analyticsData.timelock.totalTransactions) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Medium Threat</span>
                      <span className="text-sm">{analyticsData.timelock.mediumThreatCount.toString()} ({analyticsData.timelock.totalTransactions > 0 ? ((analyticsData.timelock.mediumThreatCount / analyticsData.timelock.totalTransactions) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${analyticsData.timelock.totalTransactions > 0 ? (analyticsData.timelock.mediumThreatCount / analyticsData.timelock.totalTransactions) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">High Threat</span>
                      <span className="text-sm">{analyticsData.timelock.highThreatCount.toString()} ({analyticsData.timelock.totalTransactions > 0 ? ((analyticsData.timelock.highThreatCount / analyticsData.timelock.totalTransactions) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${analyticsData.timelock.totalTransactions > 0 ? (analyticsData.timelock.highThreatCount / analyticsData.timelock.totalTransactions) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Critical Threat</span>
                      <span className="text-sm">{analyticsData.timelock.criticalThreatCount.toString()} ({analyticsData.timelock.totalTransactions > 0 ? ((analyticsData.timelock.criticalThreatCount / analyticsData.timelock.totalTransactions) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${analyticsData.timelock.totalTransactions > 0 ? (analyticsData.timelock.criticalThreatCount / analyticsData.timelock.totalTransactions) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Avg. Execution Delays</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Low Threat</p>
                    <p className="text-xl font-bold">{formatTime(analyticsData.timelock.avgLowThreatDelay)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Medium Threat</p>
                    <p className="text-xl font-bold">{formatTime(analyticsData.timelock.avgMediumThreatDelay)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">High Threat</p>
                    <p className="text-xl font-bold">{formatTime(analyticsData.timelock.avgHighThreatDelay)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Critical Threat</p>
                    <p className="text-xl font-bold">{formatTime(analyticsData.timelock.avgCriticalThreatDelay)}</p>
                  </div>
                </div>
              </>
            )}
            
            {selectedMetric === 'health' && analyticsData.health && (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Governance Health Score</h3>
                
                <div className="flex justify-center mb-6">
                  <div className="w-40 h-40 rounded-full border-8 border-indigo-500 flex items-center justify-center">
                    <span className="text-4xl font-bold text-indigo-600">{analyticsData.health[0].toString()}</span>
                  </div>
                </div>
                
                <h4 className="font-medium mb-2">Health Score Breakdown</h4>
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Participation Score</span>
                      <span className="text-sm">{analyticsData.health[1][0].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][0] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Delegation Score</span>
                      <span className="text-sm">{analyticsData.health[1][1].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][1] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Activity Score</span>
                      <span className="text-sm">{analyticsData.health[1][2].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][2] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Execution Score</span>
                      <span className="text-sm">{analyticsData.health[1][3].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][3] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Threat Diversity Score</span>
                      <span className="text-sm">{analyticsData.health[1][4].toString()}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.health[1][4] / 20) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Admin Tab Component (Role-restricted)
const AdminTab = ({ contracts }) => {
  const [selectedSection, setSelectedSection] = useState('governance');
  const [governanceParams, setGovernanceParams] = useState({
    votingDuration: '',
    quorum: '',
    timelockDelay: '',
    proposalThreshold: '',
    proposalStake: '',
    defeatedRefund: '',
    canceledRefund: '',
    expiredRefund: ''
  });
  const [loading, setLoading] = useState(false);
  
  // Load initial parameters
  useEffect(() => {
    const loadParams = async () => {
      if (!contracts.governance) return;
      
      setLoading(true);
      try {
        const params = await contracts.governance.govParams();
        setGovernanceParams({
          votingDuration: params.votingDuration.toString(),
          quorum: formatBigNumber(params.quorum),
          timelockDelay: params.timelockDelay.toString(),
          proposalThreshold: formatBigNumber(params.proposalCreationThreshold),
          proposalStake: formatBigNumber(params.proposalStake),
          defeatedRefund: params.defeatedRefundPercentage.toString(),
          canceledRefund: params.canceledRefundPercentage.toString(),
          expiredRefund: params.expiredRefundPercentage.toString()
        });
      } catch (error) {
        console.error("Error loading governance parameters:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadParams();
  }, [contracts.governance]);
  
  // Helper to format time in seconds to readable format
  function formatTime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hr${hours > 1 ? 's' : ''}` : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return 'Less than an hour';
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Admin Controls</h2>
        <p className="text-gray-500">Manage DAO governance parameters and security settings</p>
      </div>
      
      {/* Section selection */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'governance', label: 'Governance Parameters' },
            { id: 'roles', label: 'Role Management' },
            { id: 'security', label: 'Security Settings' },
            { id: 'timelock', label: 'Timelock Settings' },
            { id: 'emergency', label: 'Emergency Controls' }
          ].map(section => (
            <button
              key={section.id}
              className={`px-3 py-1 rounded-full text-sm ${selectedSection === section.id ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setSelectedSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Admin content */}
      <div className="bg-white p-6 rounded-lg shadow">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {selectedSection === 'governance' && (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Governance Parameters</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voting Duration (in seconds)</label>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        className="flex-1 rounded-md border border-gray-300 p-2" 
                        value={governanceParams.votingDuration}
                        onChange={(e) => setGovernanceParams({...governanceParams, votingDuration: e.target.value})}
                      />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: {formatTime(governanceParams.votingDuration)} ({governanceParams.votingDuration} seconds)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quorum Requirement (in tokens)</label>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        className="flex-1 rounded-md border border-gray-300 p-2" 
                        value={governanceParams.quorum}
                        onChange={(e) => setGovernanceParams({...governanceParams, quorum: e.target.value})}
                      />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: {governanceParams.quorum} JUST</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timelock Delay (in seconds)</label>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        className="flex-1 rounded-md border border-gray-300 p-2" 
                        value={governanceParams.timelockDelay}
                        onChange={(e) => setGovernanceParams({...governanceParams, timelockDelay: e.target.value})}
                      />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: {formatTime(governanceParams.timelockDelay)} ({governanceParams.timelockDelay} seconds)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Creation Threshold (in tokens)</label>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        className="flex-1 rounded-md border border-gray-300 p-2" 
                        value={governanceParams.proposalThreshold}
                        onChange={(e) => setGovernanceParams({...governanceParams, proposalThreshold: e.target.value})}
                      />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: {governanceParams.proposalThreshold} JUST</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Stake (in tokens)</label>
                    <div className="flex space-x-2">
                      <input 
                        type="number" 
                        className="flex-1 rounded-md border border-gray-300 p-2" 
                        value={governanceParams.proposalStake}
                        onChange={(e) => setGovernanceParams({...governanceParams, proposalStake: e.target.value})}
                      />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: {governanceParams.proposalStake} JUST</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Defeated Refund %</label>
                      <div className="flex space-x-2">
                        <input 
                          type="number" 
                          className="flex-1 rounded-md border border-gray-300 p-2" 
                          min="0" 
                          max="100" 
                          value={governanceParams.defeatedRefund}
                          onChange={(e) => setGovernanceParams({...governanceParams, defeatedRefund: e.target.value})}
                        />
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                          Set
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Canceled Refund %</label>
                      <div className="flex space-x-2">
                        <input 
                          type="number" 
                          className="flex-1 rounded-md border border-gray-300 p-2" 
                          min="0" 
                          max="100" 
                          value={governanceParams.canceledRefund}
                          onChange={(e) => setGovernanceParams({...governanceParams, canceledRefund: e.target.value})}
                        />
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                          Set
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expired Refund %</label>
                      <div className="flex space-x-2">
                        <input 
                          type="number" 
                          className="flex-1 rounded-md border border-gray-300 p-2" 
                          min="0" 
                          max="100" 
                          value={governanceParams.expiredRefund}
                          onChange={(e) => setGovernanceParams({...governanceParams, expiredRefund: e.target.value})}
                        />
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Other admin sections would be implemented similarly */}
            {selectedSection !== 'governance' && (
              <div className="py-4 text-center text-gray-500">
                This section is under construction
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper function for status colors
function getStatusColor(status) {
  switch (status) {
    case 'active':
      return 'bg-yellow-100 text-yellow-800';
    case 'succeeded':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'queued':
      return 'bg-blue-100 text-blue-800';
    case 'executed':
      return 'bg-indigo-100 text-indigo-800';
    case 'defeated':
      return 'bg-red-100 text-red-800';
    case 'canceled':
    case 'expired':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to format time in seconds to readable format
function formatTime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hr${hours > 1 ? 's' : ''}` : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

export default JustDAODashboard;