import React, { useState, useEffect } from 'react';
import { Bell, Settings, Users, BarChart2, FileText, ArrowRight } from 'lucide-react';

const JustDAODashboard = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mock user state (would come from wallet connection)
  const [user, setUser] = useState({
    address: '0x1234...5678',
    roles: ['user'], // Possible values: user, admin, analytics
    balance: 1000,
    votingPower: 2500,
    delegate: '0x1234...5678', // Self-delegated initially
    lockedTokens: 0
  });

  // Connect wallet functionality (simplified)
  const connectWallet = () => {
    // This would integrate with MetaMask or other wallet providers
    console.log('Connecting wallet...');
  };

  // Role-based access control
  const hasRole = (role) => user.roles.includes(role);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600">JustDAO</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">
              <div>{user.address}</div>
              <div className="flex gap-2">
                <span>{user.balance} JUST</span>
                <span>|</span>
                <span>{user.votingPower} Voting Power</span>
              </div>
            </div>
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
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
            
            {/* Admin tab - only visible to admin role */}
            {hasRole('admin') && (
              <div 
                className={`py-4 px-6 cursor-pointer border-b-2 ${activeTab === 'admin' ? 'border-indigo-500 text-indigo-600' : 'border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                onClick={() => setActiveTab('admin')}
              >
                Admin
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'proposals' && <ProposalsTab />}
        {activeTab === 'vote' && <VoteTab />}
        {activeTab === 'delegation' && <DelegationTab user={user} />}
        {activeTab === 'analytics' && hasRole('analytics') && <AnalyticsTab />}
        {activeTab === 'admin' && hasRole('admin') && <AdminTab />}
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
const DashboardTab = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      
      {/* Governance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">DAO Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Supply</p>
              <p className="text-2xl font-bold">1,000,000</p>
            </div>
            <div>
              <p className="text-gray-500">Circulating</p>
              <p className="text-2xl font-bold">750,000</p>
            </div>
            <div>
              <p className="text-gray-500">Active Proposals</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <div>
              <p className="text-gray-500">Total Proposals</p>
              <p className="text-2xl font-bold">42</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your Account</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-500">Balance</p>
              <p className="text-2xl font-bold">1,000 JUST</p>
            </div>
            <div>
              <p className="text-gray-500">Voting Power</p>
              <p className="text-2xl font-bold">2,500 JUST</p>
            </div>
            <div className="mt-4">
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
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
                <p className="text-sm font-medium">72%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-gray-500 text-sm">Delegation Rate</p>
                <p className="text-sm font-medium">65%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-gray-500 text-sm">Proposal Success Rate</p>
                <p className="text-sm font-medium">80%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity & Active Proposals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { type: 'Voted', desc: 'You voted "Yes" on DAOChanges', time: '2 hours ago' },
              { type: 'Proposal Passed', desc: 'Treasury Funding Round 3', time: '1 day ago' },
              { type: 'Delegated', desc: 'Alice delegated 500 JUST to you', time: '3 days ago' },
              { type: 'Voted', desc: 'You voted "No" on Parameter Change', time: '5 days ago' }
            ].map((activity, idx) => (
              <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{activity.type}</p>
                  <p className="text-sm text-gray-500">{activity.desc}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Active Proposals</h3>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { id: 'PROP-123', title: 'Increase Quorum Requirement', deadline: '12 hours left', votes: { yes: 60, no: 20, abstain: 20 } },
              { id: 'PROP-122', title: 'Mint Tokens for Treasury', deadline: '1 day left', votes: { yes: 45, no: 40, abstain: 15 } },
              { id: 'PROP-121', title: 'Fund Developer Grants', deadline: '3 days left', votes: { yes: 75, no: 15, abstain: 10 } }
            ].map((proposal, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{proposal.title}</p>
                    <p className="text-xs text-gray-500">{proposal.id}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{proposal.deadline}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Yes: {proposal.votes.yes}%</span>
                  <span>No: {proposal.votes.no}%</span>
                  <span>Abstain: {proposal.votes.abstain}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    <div className="bg-green-500 h-full" style={{ width: `${proposal.votes.yes}%` }}></div>
                    <div className="bg-red-500 h-full" style={{ width: `${proposal.votes.no}%` }}></div>
                    <div className="bg-gray-400 h-full" style={{ width: `${proposal.votes.abstain}%` }}></div>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs">Vote Yes</button>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">Vote No</button>
                  <button className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs">Abstain</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Proposals Tab Component
const ProposalsTab = () => {
  const [proposalType, setProposalType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
          {['all', 'active', 'pending', 'passed', 'executed', 'defeated', 'canceled'].map(type => (
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
        {[
          { id: 'PROP-123', title: 'Increase Quorum Requirement', type: 'GovernanceChange', status: 'active', created: '2 days ago', proposer: '0xabc...123' },
          { id: 'PROP-122', title: 'Mint Tokens for Treasury', type: 'TokenMint', status: 'active', created: '3 days ago', proposer: '0xdef...456' },
          { id: 'PROP-121', title: 'Fund Developer Grants', type: 'TokenTransfer', status: 'active', created: '5 days ago', proposer: '0xghi...789' },
          { id: 'PROP-120', title: 'Update Governance Parameters', type: 'GovernanceChange', status: 'passed', created: '1 week ago', proposer: '0xjkl...012' },
          { id: 'PROP-119', title: 'External ERC20 Token Transfer', type: 'ExternalERC20Transfer', status: 'executed', created: '2 weeks ago', proposer: '0xmno...345' },
          { id: 'PROP-118', title: 'Withdraw ETH from Treasury', type: 'Withdrawal', status: 'defeated', created: '3 weeks ago', proposer: '0xpqr...678' },
        ].filter(p => proposalType === 'all' || p.status === proposalType).map((proposal, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{proposal.title}</h3>
                <p className="text-sm text-gray-500">{proposal.id}</p>
              </div>
              <div className="flex items-center">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(proposal.status)}`}>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-500">
              <div>
                <p className="font-medium">Type</p>
                <p>{proposal.type}</p>
              </div>
              <div>
                <p className="font-medium">Created</p>
                <p>{proposal.created}</p>
              </div>
              <div>
                <p className="font-medium">Proposer</p>
                <p>{proposal.proposer}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="text-indigo-600 border border-indigo-600 px-3 py-1 rounded-md text-sm hover:bg-indigo-50">View Details</button>
              
              {proposal.status === 'active' && (
                <>
                  <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm">Vote</button>
                </>
              )}
              
              {proposal.status === 'passed' && (
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm">Queue</button>
              )}
              
              {proposal.status === 'pending' && (
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm">Execute</button>
              )}
              
              {(proposal.status === 'active' || proposal.status === 'pending') && (
                <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm">Cancel</button>
              )}
              
              {(proposal.status === 'defeated' || proposal.status === 'canceled') && (
                <button className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm">Claim Refund</button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Create Proposal Modal (simplified) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Proposal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title</label>
                <input type="text" className="w-full rounded-md border border-gray-300 p-2" placeholder="Enter proposal title" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Type</label>
                <select className="w-full rounded-md border border-gray-300 p-2">
                  <option value="general">General</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="tokenTransfer">Token Transfer</option>
                  <option value="governanceChange">Governance Change</option>
                  <option value="externalERC20Transfer">External ERC20 Transfer</option>
                  <option value="tokenMint">Token Mint</option>
                  <option value="tokenBurn">Token Burn</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full rounded-md border border-gray-300 p-2" rows="4" placeholder="Describe your proposal"></textarea>
              </div>
              
              {/* Additional fields would appear based on selected proposal type */}
              
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Create Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Vote Tab Component
const VoteTab = () => {
  const [voteFilter, setVoteFilter] = useState('active');
  
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
        {[
          { 
            id: 'PROP-123', 
            title: 'Increase Quorum Requirement', 
            desc: 'Proposal to increase the quorum requirement from 10% to 15% to ensure broader participation.',
            deadline: '12 hours left',
            votes: { yes: 60, no: 20, abstain: 20 },
            voted: false
          },
          { 
            id: 'PROP-122', 
            title: 'Mint Tokens for Treasury', 
            desc: 'Mint 100,000 JUST tokens to fund community grants and development initiatives.',
            deadline: '1 day left',
            votes: { yes: 45, no: 40, abstain: 15 },
            voted: false
          },
          { 
            id: 'PROP-121', 
            title: 'Fund Developer Grants', 
            desc: 'Transfer 50,000 JUST tokens to the Developer Grant multisig to fund Q2 development efforts.',
            deadline: '3 days left',
            votes: { yes: 75, no: 15, abstain: 10 },
            voted: true,
            yourVote: 'yes'
          }
        ].filter(p => {
          if (voteFilter === 'active') return !p.voted;
          if (voteFilter === 'voted') return p.voted;
          return true;
        }).map((proposal, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-medium">{proposal.title}</h3>
                <p className="text-xs text-gray-500">{proposal.id}</p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{proposal.deadline}</span>
            </div>
            
            <p className="text-gray-700 mb-4">{proposal.desc}</p>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Yes: {proposal.votes.yes}%</span>
                <span>No: {proposal.votes.no}%</span>
                <span>Abstain: {proposal.votes.abstain}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div className="bg-green-500 h-full" style={{ width: `${proposal.votes.yes}%` }}></div>
                  <div className="bg-red-500 h-full" style={{ width: `${proposal.votes.no}%` }}></div>
                  <div className="bg-gray-400 h-full" style={{ width: `${proposal.votes.abstain}%` }}></div>
                </div>
              </div>
            </div>
            
            {proposal.voted ? (
              <div className="flex items-center text-sm text-gray-700">
                <span className="mr-2">You voted:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  proposal.yourVote === 'yes' ? 'bg-green-100 text-green-800' : 
                  proposal.yourVote === 'no' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {proposal.yourVote.toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md">Vote Yes</button>
                <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md">Vote No</button>
                <button className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md">Abstain</button>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                View Full Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Delegation Tab Component
const DelegationTab = ({ user }) => {
  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegationStats, setDelegationStats] = useState({
    topDelegates: [
      { address: '0xabc...123', power: 250000, percentage: '25%' },
      { address: '0xdef...456', power: 150000, percentage: '15%' },
      { address: '0xghi...789', power: 100000, percentage: '10%' }
    ],
    delegatedToYou: 1500,
    totalDelegating: 450000,
    totalSupply: 1000000
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Delegation</h2>
        <p className="text-gray-500">Manage your voting power delegation</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Your delegation status */}
        <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Delegation Status</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Current Delegate</p>
              <p className="font-medium">
                {user.delegate === user.address ? 'Self (not delegated)' : user.delegate}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Locked Tokens</p>
              <p className="font-medium">{user.lockedTokens} JUST</p>
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
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                  Delegate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Delegating locks your tokens but allows you to maintain ownership while transferring voting power.
              </p>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              {user.delegate !== user.address && (
                <button className="w-full bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded-md">
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
            <p className="text-3xl font-bold text-indigo-600">{delegationStats.delegatedToYou}</p>
            <p className="text-sm text-gray-500">JUST tokens</p>
          </div>
          
          <p className="text-sm text-gray-700 mb-4">
            You have {delegationStats.delegatedToYou} JUST tokens delegated to your address from other token holders.
          </p>
          
          <button className="w-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-2 rounded-md">
            View Delegators
          </button>
        </div>
      </div>
      
      {/* DAO Delegation Overview */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">DAO Delegation Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Total Delegating</p>
            <p className="text-2xl font-bold">{delegationStats.totalDelegating} JUST</p>
            <p className="text-xs text-gray-500">
              {((delegationStats.totalDelegating / delegationStats.totalSupply) * 100).toFixed(1)}% of total supply
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Top Delegate Concentration</p>
            <p className="text-2xl font-bold">
              {((delegationStats.topDelegates[0].power / delegationStats.totalSupply) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              Controlled by {delegationStats.topDelegates[0].address}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Delegates</p>
            <p className="text-2xl font-bold">128</p>
            <p className="text-xs text-gray-500">
              Accounts with delegated voting power
            </p>
          </div>
        </div>
        
        <h4 className="font-medium mb-2">Top Delegates</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delegate</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Voting Power</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Supply</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {delegationStats.topDelegates.map((delegate, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 whitespace-nowrap">{delegate.address}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">{delegate.power.toLocaleString()} JUST</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">{delegate.percentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Your Delegation History */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Delegation History</h3>
        
        <div className="space-y-4">
          {[
            { type: 'Delegated To', address: '0xdef...456', amount: '1000 JUST', date: '2023-01-15' },
            { type: 'Reset Delegation', address: 'Self', amount: '1000 JUST', date: '2023-01-01' },
            { type: 'Delegated To', address: '0xabc...123', amount: '1000 JUST', date: '2022-12-20' }
          ].map((event, idx) => (
            <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="font-medium">{event.type}</p>
                <p className="text-sm text-gray-500">{event.address}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{event.amount}</p>
                <p className="text-xs text-gray-500">{event.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Analytics Tab Component (Role-restricted)
const AnalyticsTab = () => {
  const [selectedMetric, setSelectedMetric] = useState('proposal');
  
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
        {selectedMetric === 'proposal' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Proposal Analytics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Proposals</p>
                <p className="text-2xl font-bold">42</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Active Proposals</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold">78%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Avg. Participation</p>
                <p className="text-2xl font-bold">65%</p>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Success Rate by Proposal Type</h4>
            <div className="space-y-3 mb-6">
              {[
                { type: 'General', rate: 85, count: 12 },
                { type: 'TokenTransfer', rate: 75, count: 8 },
                { type: 'Withdrawal', rate: 60, count: 5 },
                { type: 'GovernanceChange', rate: 90, count: 10 },
                { type: 'TokenMint', rate: 65, count: 4 },
                { type: 'TokenBurn', rate: 50, count: 2 },
                { type: 'ExternalERC20Transfer', rate: 70, count: 1 }
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-xs text-gray-500 ml-2">({item.count})</span>
                    </div>
                    <span className="text-sm">{item.rate}%</span>
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
            
            <div className="flex justify-end">
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Export Analytics
              </button>
            </div>
          </>
        )}
        
        {selectedMetric === 'voter' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Voter Behavior Analytics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Voters</p>
                <p className="text-2xl font-bold">250</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Active Voters</p>
                <p className="text-2xl font-bold">120</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Super Active</p>
                <p className="text-2xl font-bold">45</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Delegation Rate</p>
                <p className="text-2xl font-bold">65%</p>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Voter Distribution</h4>
            <div className="space-y-3 mb-6">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Yes Leaning (>66%)</span>
                  <span className="text-sm">65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">No Leaning (>66%)</span>
                  <span className="text-sm">15%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Balanced Voters</span>
                  <span className="text-sm">20%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Top Voters</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Proposals Voted</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Voting Power</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Yes %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { address: '0xabc...123', voted: 40, power: 250000, yesRate: 75 },
                    { address: '0xdef...456', voted: 38, power: 150000, yesRate: 60 },
                    { address: '0xghi...789', voted: 35, power: 100000, yesRate: 85 }
                  ].map((voter, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 whitespace-nowrap">{voter.address}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">{voter.voted}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">{voter.power.toLocaleString()}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">{voter.yesRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {selectedMetric === 'token' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Token Distribution Analytics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Supply</p>
                <p className="text-2xl font-bold">1,000,000</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Circulating</p>
                <p className="text-2xl font-bold">750,000</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Treasury</p>
                <p className="text-2xl font-bold">250,000</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Delegated</p>
                <p className="text-2xl font-bold">450,000</p>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Holder Distribution</h4>
            <div className="space-y-3 mb-6">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Small Holders (&lt;1%)</span>
                  <span className="text-sm">350,000 JUST (35%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Medium Holders (1-5%)</span>
                  <span className="text-sm">250,000 JUST (25%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Large Holders (&gt;5%)</span>
                  <span className="text-sm">150,000 JUST (15%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Treasury</span>
                  <span className="text-sm">250,000 JUST (25%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Gini Coefficient: 0.42</h4>
            <p className="text-sm text-gray-500 mb-4">Represents the inequality of token distribution (0 = perfect equality, 1 = perfect inequality)</p>
            
            <div className="flex justify-end">
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Download Distribution Report
              </button>
            </div>
          </>
        )}
        
        {selectedMetric === 'timelock' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timelock Analytics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold">35</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Executed</p>
                <p className="text-2xl font-bold">28</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Canceled</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Threat Level Distribution</h4>
            <div className="space-y-3 mb-6">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Low Threat</span>
                  <span className="text-sm">15 (43%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '43%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Medium Threat</span>
                  <span className="text-sm">10 (29%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '29%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">High Threat</span>
                  <span className="text-sm">8 (23%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Critical Threat</span>
                  <span className="text-sm">2 (6%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '6%' }}></div>
                </div>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Avg. Execution Delays</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Low Threat</p>
                <p className="text-xl font-bold">1 day</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Medium Threat</p>
                <p className="text-xl font-bold">3 days</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">High Threat</p>
                <p className="text-xl font-bold">7 days</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Critical Threat</p>
                <p className="text-xl font-bold">14 days</p>
              </div>
            </div>
          </>
        )}
        
        {selectedMetric === 'health' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Governance Health Score</h3>
            
            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 rounded-full border-8 border-indigo-500 flex items-center justify-center">
                <span className="text-4xl font-bold text-indigo-600">82</span>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Health Score Breakdown</h4>
            <div className="space-y-3 mb-6">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Participation Score</span>
                  <span className="text-sm">18/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Delegation Score</span>
                  <span className="text-sm">15/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Activity Score</span>
                  <span className="text-sm">16/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Execution Score</span>
                  <span className="text-sm">17/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">Threat Diversity Score</span>
                  <span className="text-sm">16/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Health History</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { date: '2023-03-15', score: 82, change: '+2' },
                    { date: '2023-02-15', score: 80, change: '-1' },
                    { date: '2023-01-15', score: 81, change: '+5' },
                    { date: '2022-12-15', score: 76, change: '+3' }
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 whitespace-nowrap">{item.date}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">{item.score}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-right ${item.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                        {item.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Admin Tab Component (Role-restricted)
const AdminTab = () => {
  const [selectedSection, setSelectedSection] = useState('governance');
  
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
        {selectedSection === 'governance' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Governance Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voting Duration (in seconds)</label>
                <div className="flex space-x-2">
                  <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="604800" />
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                    Update
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Current: 7 days (604800 seconds)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quorum Requirement (in tokens)</label>
                <div className="flex space-x-2">
                  <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="100000" />
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                    Update
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Current: 100,000 JUST (10% of total supply)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timelock Delay (in seconds)</label>
                <div className="flex space-x-2">
                  <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="86400" />
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                    Update
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Current: 1 day (86400 seconds)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Creation Threshold (in tokens)</label>
                <div className="flex space-x-2">
                  <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="10000" />
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                    Update
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Current: 10,000 JUST (1% of total supply)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Stake (in tokens)</label>
                <div className="flex space-x-2">
                  <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="1000" />
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                    Update
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Current: 1,000 JUST (10% of threshold)</p>
              </div>
              
              <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Defeated Refund %</label>
                  <div className="flex space-x-2">
                    <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="50" min="0" max="100" />
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                      Set
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Canceled Refund %</label>
                  <div className="flex space-x-2">
                    <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="100" min="0" max="100" />
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                      Set
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expired Refund %</label>
                  <div className="flex space-x-2">
                    <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="25" min="0" max="100" />
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                      Set
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {selectedSection === 'roles' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role Management</h3>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Grant Role</h4>
              </div>
              <div className="flex space-x-2">
                <select className="flex-1 rounded-md border border-gray-300 p-2">
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="guardian">Guardian</option>
                  <option value="proposer">Proposer</option>
                  <option value="executor">Executor</option>
                  <option value="minter">Minter</option>
                  <option value="analytics">Analytics</option>
                </select>
                <input type="text" className="flex-1 rounded-md border border-gray-300 p-2" placeholder="Address" />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                  Grant
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Revoke Role</h4>
              </div>
              <div className="flex space-x-2">
                <select className="flex-1 rounded-md border border-gray-300 p-2">
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="guardian">Guardian</option>
                  <option value="proposer">Proposer</option>
                  <option value="executor">Executor</option>
                  <option value="minter">Minter</option>
                  <option value="analytics">Analytics</option>
                </select>
                <input type="text" className="flex-1 rounded-md border border-gray-300 p-2" placeholder="Address" />
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                  Revoke
                </button>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Current Role Assignments</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { role: 'Admin', address: '0xabc...123' },
                    { role: 'Guardian', address: '0xabc...123' },
                    { role: 'Guardian', address: '0xdef...456' },
                    { role: 'Proposer', address: '0xabc...123' },
                    { role: 'Proposer', address: '0xghi...789' },
                    { role: 'Analytics', address: '0xdef...456' }
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 whitespace-nowrap">{item.role}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.address}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <button className="text-red-600 hover:text-red-800 text-sm">Revoke</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {selectedSection === 'security' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Update Function Selector Permission</h4>
              </div>
              <div className="flex space-x-2 mb-4">
                <input type="text" className="flex-1 rounded-md border border-gray-300 p-2" placeholder="Function Selector (e.g., 0xa9059cbb)" />
                <select className="rounded-md border border-gray-300 p-2">
                  <option value="true">Allow</option>
                  <option value="false">Disallow</option>
                </select>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                  Update
                </button>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Update Target Address Permission</h4>
              </div>
              <div className="flex space-x-2">
                <input type="text" className="flex-1 rounded-md border border-gray-300 p-2" placeholder="Target Address" />
                <select className="rounded-md border border-gray-300 p-2">
                  <option value="true">Allow</option>
                  <option value="false">Disallow</option>
                </select>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                  Update
                </button>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Allowed Function Selectors</h4>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selector</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Function Name</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { selector: '0xa9059cbb', name: 'transfer(address,uint256)' },
                    { selector: '0x095ea7b3', name: 'approve(address,uint256)' },
                    { selector: '0x23b872dd', name: 'transferFrom(address,address,uint256)' }
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 whitespace-nowrap">{item.selector}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <h4 className="font-medium mb-2">Allowed Target Addresses</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { address: '0xabc...123', desc: 'Main Treasury' },
                    { address: '0xdef...456', desc: 'Development Grants Multisig' },
                    { address: '0xghi...789', desc: 'USDC Token Contract' }
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 whitespace-nowrap">{item.address}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{item.desc}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {selectedSection === 'timelock' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timelock Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-medium mb-2">Timelock Delays</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Delay (seconds)</label>
                    <div className="flex space-x-2">
                      <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="86400" />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 1 day (86400 seconds)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Delay (seconds)</label>
                    <div className="flex space-x-2">
                      <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="2592000" />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 30 days (2592000 seconds)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (seconds)</label>
                    <div className="flex space-x-2">
                      <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="1209600" />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 14 days (1209600 seconds)</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Threat Level Delays</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Threat (seconds)</label>
                    <div className="flex space-x-2">
                      <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="86400" />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 1 day (86400 seconds)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medium Threat (seconds)</label>
                    <div className="flex space-x-2">
                      <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="259200" />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 3 days (259200 seconds)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">High Threat (seconds)</label>
                    <div className="flex space-x-2">
                      <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="604800" />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 7 days (604800 seconds)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Critical Threat (seconds)</label>
                    <div className="flex space-x-2">
                      <input type="number" className="flex-1 rounded-md border border-gray-300 p-2" defaultValue="1209600" />
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                        Update
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 14 days (1209600 seconds)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Set Threat Level for Function</h4>
            <div className="flex space-x-2 mb-6">
              <input type="text" className="flex-1 rounded-md border border-gray-300 p-2" placeholder="Function Selector (e.g., 0xa9059cbb)" />
              <select className="rounded-md border border-gray-300 p-2">
                <option value="0">Low</option>
                <option value="1">Medium</option>
                <option value="2">High</option>
                <option value="3">Critical</option>
              </select>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                Set Level
              </button>
            </div>
            
            <h4 className="font-medium mb-2">Set Threat Level for Address</h4>
            <div className="flex space-x-2">
              <input type="text" className="flex-1 rounded-md border border-gray-300 p-2" placeholder="Target Address" />
              <select className="rounded-md border border-gray-300 p-2">
                <option value="0">Low</option>
                <option value="1">Medium</option>
                <option value="2">High</option>
                <option value="3">Critical</option>
              </select>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                Set Level
              </button>
            </div>
          </>
        )}
        
        {selectedSection === 'emergency' && (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Controls</h3>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Warning</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      These controls are for emergency use only. They can significantly impact DAO operations and should be used with caution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-4">Pause/Unpause Contracts</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Token Contract</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md">
                      Pause Token Contract
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Governance Contract</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md">
                      Pause Governance Contract
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Timelock Contract</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md">
                      Pause Timelock Contract
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-4">Rescue Functions</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rescue ETH</label>
                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-md">
                      Rescue ETH from Contract
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rescue ERC20 Tokens</label>
                    <div className="flex space-x-2 mb-2">
                      <input type="text" className="flex-1 rounded-md border border-gray-300 p-2" placeholder="Token Address" />
                      <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md">
                        Rescue
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Execute Expired Transaction</label>
                    <div className="flex space-x-2">
                      <input type="text" className="flex-1 rounded-md border border-gray-300 p-2" placeholder="Transaction Hash" />
                      <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md">
                        Execute
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 md:col-span-2">
                <h4 className="font-medium mb-4">Cancel Pending Transactions</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tx Hash</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {[
                        { hash: '0x1234...5678', target: '0xabc...123', eta: 'Mar 25, 2023 14:30' },
                        { hash: '0x8765...4321', target: '0xdef...456', eta: 'Mar 26, 2023 09:15' }
                      ].map((tx, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 whitespace-nowrap">{tx.hash}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{tx.target}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{tx.eta}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-right">
                            <button className="text-red-600 hover:text-red-800 text-sm">Cancel</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
    case 'passed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'executed':
      return 'bg-indigo-100 text-indigo-800';
    case 'defeated':
      return 'bg-red-100 text-red-800';
    case 'canceled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default JustDAODashboard;