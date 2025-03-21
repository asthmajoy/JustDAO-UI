// src/components/analytics/GovernanceMetrics.jsx
import React from 'react';
import { 
  UsersIcon, 
  VoteIcon, 
  LayersIcon, 
  CheckIcon, 
  XIcon, 
  BanIcon
} from 'lucide-react';

import DashboardCard from '../common/DashboardCard';
import { LoadingState } from '../common/LoadingSpinner';

const GovernanceMetrics = ({ stats, loading }) => {
  // Format percentage
  const formatPercentage = (value, total) => {
    if (!value || !total) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return <LoadingState text="Loading governance metrics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Active Voter Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Voters"
          value={stats.totalVoters}
          icon={<UsersIcon size={20} />}
        />
        
        <DashboardCard
          title="Active Voters"
          value={stats.activeVoters}
          description={`${formatPercentage(stats.activeVoters, stats.totalVoters)} of total voters`}
          icon={<VoteIcon size={20} />}
        />
        
        <DashboardCard
          title="Super Active Voters"
          value={stats.superActiveVoters}
          description={`${formatPercentage(stats.superActiveVoters, stats.totalVoters)} of total voters`}
          icon={<VoteIcon size={20} />}
        />
      </div>
      
      {/* Voting Behavior */}
      <DashboardCard
        title="Voter Behavior"
        icon={<VoteIcon size={24} />}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <div className="text-lg font-medium text-green-600 flex items-center">
                <CheckIcon size={16} className="mr-2" />
                Yes-Leaning Voters
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-1">
                {stats.yesLeaning}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatPercentage(stats.yesLeaning, stats.totalVoters)} of voters
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(stats.yesLeaning / stats.totalVoters) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="text-lg font-medium text-red-600 flex items-center">
                <XIcon size={16} className="mr-2" />
                No-Leaning Voters
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-1">
                {stats.noLeaning}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatPercentage(stats.noLeaning, stats.totalVoters)} of voters
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${(stats.noLeaning / stats.totalVoters) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="text-lg font-medium text-gray-600 flex items-center">
                <BanIcon size={16} className="mr-2" />
                Balanced Voters
              </div>
              <div className="text-3xl font-bold text-gray-800 mt-1">
                {stats.balanced}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatPercentage(stats.balanced, stats.totalVoters)} of voters
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full" 
                  style={{ width: `${(stats.balanced / stats.totalVoters) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="text-lg font-medium text-gray-800 mb-4">
              Consistency Metrics
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Consistent Voters
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.consistentVoters}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Voters who vote the same way 80%+ of the time
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${(stats.consistentVoters / stats.totalVoters) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Voting Consistency Ratio
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {((stats.consistentVoters / stats.totalVoters) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Percentage of voters with consistent voting patterns
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full" 
                    style={{ width: `${(stats.consistentVoters / stats.totalVoters) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>
      
      {/* Delegation Stats */}
      <DashboardCard
        title="Delegation Statistics"
        icon={<LayersIcon size={24} />}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-700 mb-1">
                Delegators
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">
                {stats.delegatorCount}
              </div>
              <div className="text-xs text-blue-600 mb-2">
                Accounts delegating to others
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(stats.delegatorCount / stats.totalVoters) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-indigo-700 mb-1">
                Delegates
              </div>
              <div className="text-2xl font-bold text-indigo-900 mb-1">
                {stats.delegateCount}
              </div>
              <div className="text-xs text-indigo-600 mb-2">
                Accounts receiving delegation
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${(stats.delegateCount / stats.totalVoters) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-700 mb-1">
                Avg Chain Depth
              </div>
              <div className="text-2xl font-bold text-purple-900 mb-1">
                {stats.avgDelegationChainLength}
              </div>
              <div className="text-xs text-purple-600 mb-2">
                Average delegation chain length
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${(stats.avgDelegationChainLength / 8) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Delegation Participation Rate
            </div>
            <div className="text-lg font-bold text-gray-900 mb-2">
              {((stats.delegatorCount / stats.totalVoters) * 100).toFixed(1)}% of voters have delegated
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-indigo-500 h-3 rounded-full" 
                style={{ width: `${(stats.delegatorCount / stats.totalVoters) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
};

export default GovernanceMetrics;