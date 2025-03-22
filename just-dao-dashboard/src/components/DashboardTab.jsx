import React from 'react';
import { Clock, TrendingUp, Users, FileText } from 'lucide-react';
import Loader from './Loader';
import { formatCountdown } from '../utils/formatters';
import { PROPOSAL_STATES } from '../utils/constants';

const DashboardTab = ({ user, stats, loading, proposals }) => {
  // Render vote percentage bar with a fixed approach for empty votes
  const renderVoteBar = (proposal) => {
    // If the user has voted, force the bar to show their vote
    if (proposal.hasVoted) {
      // Determine which segment to show based on user's vote
      let barContent;
      
      if (proposal.votedYes) {
        barContent = (
          <div className="flex h-full">
            <div className="bg-green-500 h-full w-full"></div>
          </div>
        );
      } else if (proposal.votedNo) {
        barContent = (
          <div className="flex h-full">
            <div className="bg-red-500 h-full w-full"></div>
          </div>
        );
      } else {
        barContent = (
          <div className="flex h-full">
            <div className="bg-gray-400 h-full w-full"></div>
          </div>
        );
      }
      
      return (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          {barContent}
        </div>
      );
    }
    
    // If no votes yet or for non-voted proposals, show the standard gray bar
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-full bg-gray-300"></div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-gray-500">Overview of JustDAO and your participation</p>
      </div>
      
      {/* User stats */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium mb-4">Your Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="text-sm text-indigo-600 mb-1">Total Balance</div>
            <div className="text-2xl font-bold">{user.balance} JUST</div>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="text-sm text-indigo-600 mb-1">Voting Power</div>
            <div className="text-2xl font-bold">{user.votingPower}</div>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="text-sm text-indigo-600 mb-1">Delegation Status</div>
            <div className="text-2xl font-bold">{user.delegatedTo ? 'Delegated' : 'Self'}</div>
            {user.delegatedTo && <div className="text-xs mt-1 text-indigo-500">To: {user.delegatedTo}</div>}
          </div>
        </div>
      </div>
      
      {/* DAO Stats */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium mb-4">DAO Stats</h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader size="medium" text="Loading statistics..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Token Holders</div>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-xl font-bold">{stats.totalHolders}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Circulating Supply</div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-xl font-bold">{stats.circulatingSupply}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Active Proposals</div>
                <FileText className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-xl font-bold">{stats.activeProposals} of {stats.totalProposals}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Participation Rate</div>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-xl font-bold">{stats.formattedParticipationRate}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Delegation Rate</div>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-xl font-bold">{stats.formattedDelegationRate}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Proposal Success Rate</div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-xl font-bold">{stats.formattedSuccessRate}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Active Proposals */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-4">Active Proposals</h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader size="medium" text="Loading proposals..." />
          </div>
        ) : proposals && proposals.length > 0 ? (
          <div className="space-y-4">
            {proposals.map((proposal, idx) => {
              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{proposal.title}</h4>
                      <p className="text-xs text-gray-500">Proposal #{proposal.id}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatCountdown(proposal.deadline)}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    {/* Vote percentages - simplified for consistent display */}
                    <div className="flex justify-between text-sm mb-1">
                      <span>Yes: {proposal.hasVoted && proposal.votedYes ? '100' : '0'}%</span>
                      <span>No: {proposal.hasVoted && proposal.votedNo ? '100' : '0'}%</span>
                      <span>Abstain: {proposal.hasVoted && !proposal.votedYes && !proposal.votedNo ? '100' : '0'}%</span>
                    </div>
                    
                    {/* Custom vote bar renderer */}
                    {renderVoteBar(proposal)}
                    
                    {/* Vote counts display - show simplified counts based on user vote */}
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{proposal.hasVoted && proposal.votedYes ? '1' : '0'} votes</span>
                      <span>{proposal.hasVoted && proposal.votedNo ? '1' : '0'} votes</span>
                      <span>{proposal.hasVoted && !proposal.votedYes && !proposal.votedNo ? '1' : '0'} votes</span>
                    </div>
                  </div>
                  
                  {proposal.hasVoted && (
                    <div className="text-sm text-gray-700 mb-2">
                      You voted: <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {proposal.votedYes ? 'Yes' : proposal.votedNo ? 'No' : 'Abstain'}
                      </span>
                    </div>
                  )}
                  
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No active proposals at the moment
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTab;