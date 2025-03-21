// src/components/analytics/ProposalMetrics.jsx
import React from 'react';
import { 
  FileTextIcon, 
  CheckIcon, 
  XIcon, 
  ClockIcon, 
  AlertTriangleIcon,
  BarChartIcon
} from 'lucide-react';

import DashboardCard from '../common/DashboardCard';
import { LoadingState } from '../common/LoadingSpinner';

const ProposalMetrics = ({ stats, loading }) => {
  // Format basis points to percentage
  const formatBasisPoints = (basisPoints) => {
    if (basisPoints === null || basisPoints === undefined) return "0%";
    return `${(basisPoints / 100).toFixed(1)}%`;
  };

  // Format seconds to a readable time
  const formatSeconds = (seconds) => {
    if (!seconds) return "0";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hr${hours !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
  };

  if (loading) {
    return <LoadingState text="Loading proposal metrics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Proposal Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Proposals"
          value={stats.totalProposals}
          icon={<FileTextIcon size={20} />}
        />
        
        <DashboardCard
          title="Active Proposals"
          value={stats.activeProposals}
          description={`${((stats.activeProposals / stats.totalProposals) * 100).toFixed(1)}% of total`}
          icon={<ClockIcon size={20} />}
        />
        
        <DashboardCard
          title="Executed Proposals"
          value={stats.executedProposals}
          description={`${((stats.executedProposals / stats.totalProposals) * 100).toFixed(1)}% success rate`}
          icon={<CheckIcon size={20} />}
        />
        
        <DashboardCard
          title="Defeated/Canceled"
          value={stats.defeatedProposals + stats.canceledProposals}
          description={`${(((stats.defeatedProposals + stats.canceledProposals) / stats.totalProposals) * 100).toFixed(1)}% failure rate`}
          icon={<XIcon size={20} />}
        />
      </div>
      
      {/* Proposal Type Distribution */}
      <DashboardCard
        title="Proposal Type Distribution"
        icon={<BarChartIcon size={24} />}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Proposal Counts by Type</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">General</span>
                    <span className="text-sm font-medium text-gray-700">
                      {stats.generalProposals} ({((stats.generalProposals / stats.totalProposals) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${(stats.generalProposals / stats.totalProposals) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Withdrawal</span>
                    <span className="text-sm font-medium text-gray-700">
                      {stats.withdrawalProposals} ({((stats.withdrawalProposals / stats.totalProposals) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(stats.withdrawalProposals / stats.totalProposals) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Token Transfer</span>
                    <span className="text-sm font-medium text-gray-700">
                      {stats.tokenTransferProposals} ({((stats.tokenTransferProposals / stats.totalProposals) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(stats.tokenTransferProposals / stats.totalProposals) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Governance Change</span>
                    <span className="text-sm font-medium text-gray-700">
                      {stats.governanceChangeProposals} ({((stats.governanceChangeProposals / stats.totalProposals) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${(stats.governanceChangeProposals / stats.totalProposals) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Success Rates by Type</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">General</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatBasisPoints(stats.generalSuccessRate)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${stats.generalSuccessRate / 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Withdrawal</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatBasisPoints(stats.withdrawalSuccessRate)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${stats.withdrawalSuccessRate / 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Token Transfer</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatBasisPoints(stats.tokenTransferSuccessRate)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.tokenTransferSuccessRate / 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Governance Change</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatBasisPoints(stats.governanceChangeSuccessRate)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${stats.governanceChangeSuccessRate / 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total distribution visualization */}
          <div className="mt-8">
            <h3 className="text-base font-medium text-gray-900 mb-3">Proposal Outcome Distribution</h3>
            <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div 
                  className="bg-green-500 h-full"
                  style={{ width: `${(stats.executedProposals / stats.totalProposals) * 100}%` }}
                  title="Executed"
                ></div>
                <div 
                  className="bg-blue-500 h-full"
                  style={{ width: `${(stats.succeededProposals / stats.totalProposals) * 100}%` }}
                  title="Succeeded"
                ></div>
                <div 
                  className="bg-yellow-500 h-full"
                  style={{ width: `${(stats.queuedProposals / stats.totalProposals) * 100}%` }}
                  title="Queued"
                ></div>
                <div 
                  className="bg-red-500 h-full"
                  style={{ width: `${(stats.defeatedProposals / stats.totalProposals) * 100}%` }}
                  title="Defeated"
                ></div>
                <div 
                  className="bg-gray-500 h-full"
                  style={{ width: `${(stats.canceledProposals / stats.totalProposals) * 100}%` }}
                  title="Canceled"
                ></div>
                <div 
                  className="bg-purple-500 h-full"
                  style={{ width: `${(stats.activeProposals / stats.totalProposals) * 100}%` }}
                  title="Active"
                ></div>
                <div 
                  className="bg-orange-500 h-full"
                  style={{ width: `${(stats.expiredProposals / stats.totalProposals) * 100}%` }}
                  title="Expired"
                ></div>
              </div>
            </div>
            <div className="flex flex-wrap mt-2 text-xs text-gray-600 justify-between">
              <div className="flex items-center mr-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span>Executed</span>
              </div>
              <div className="flex items-center mr-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                <span>Succeeded</span>
              </div>
              <div className="flex items-center mr-2 mb-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                <span>Queued</span>
              </div>
              <div className="flex items-center mr-2 mb-1">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span>Defeated</span>
              </div>
              <div className="flex items-center mr-2 mb-1">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-1"></div>
                <span>Canceled</span>
              </div>
              <div className="flex items-center mr-2 mb-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
                <span>Expired</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>
      
      {/* Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Average Proposal Lifetime"
          value={formatSeconds(stats.avgProposalLifetime)}
          description="From creation to conclusion"
          icon={<ClockIcon size={20} />}
        />
        
        <DashboardCard
          title="Average Time to Execution"
          value={formatSeconds(stats.avgTimeToExecution)}
          description="From creation to execution"
          icon={<ClockIcon size={20} />}
        />
        
        <DashboardCard
          title="Average Voting Turnout"
          value={formatBasisPoints(stats.avgVotingTurnout)}
          description="Of total token supply"
          icon={<BarChartIcon size={20} />}
        />
      </div>
      
      {/* Proposals by State */}
      <DashboardCard
        title="Proposals by State"
        icon={<FileTextIcon size={24} />}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <div className="bg-purple-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-purple-800 mb-1">Active</div>
              <div className="text-2xl font-bold text-purple-900">{stats.activeProposals}</div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-gray-800 mb-1">Canceled</div>
              <div className="text-2xl font-bold text-gray-900">{stats.canceledProposals}</div>
            </div>
            
            <div className="bg-red-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-red-800 mb-1">Defeated</div>
              <div className="text-2xl font-bold text-red-900">{stats.defeatedProposals}</div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-blue-800 mb-1">Succeeded</div>
              <div className="text-2xl font-bold text-blue-900">{stats.succeededProposals}</div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-yellow-800 mb-1">Queued</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.queuedProposals}</div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-green-800 mb-1">Executed</div>
              <div className="text-2xl font-bold text-green-900">{stats.executedProposals}</div>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-md text-center">
              <div className="text-sm font-medium text-orange-800 mb-1">Expired</div>
              <div className="text-2xl font-bold text-orange-900">{stats.expiredProposals}</div>
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
};

// Check icon component
const CheckIcon = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default ProposalMetrics;