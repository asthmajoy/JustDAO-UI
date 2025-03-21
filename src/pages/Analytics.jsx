// src/pages/Analytics.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { 
  BarChartIcon, 
  PieChartIcon, 
  TrendingUpIcon,
  UsersIcon,
  VoteIcon,
  ShieldIcon,
  ClockIcon
} from 'lucide-react';

import { WalletContext } from '../context/WalletContext';
import { ContractsContext } from '../context/ContractsContext';
import { RoleContext } from '../context/RoleContext';
import { NotificationContext } from '../context/NotificationContext';

import NetworkStatus from '../components/common/NetworkStatus';
import WalletConnect from '../components/common/WalletConnect';
import DashboardCard from '../components/common/DashboardCard';
import { LoadingState } from '../components/common/LoadingSpinner';
import GovernanceMetrics from '../components/analytics/GovernanceMetrics';
import TokenDistribution from '../components/analytics/TokenDistribution';
import ProposalMetrics from '../components/analytics/ProposalMetrics';

const Analytics = () => {
  const { account, isCorrectNetwork } = useContext(WalletContext);
  const { analyticsHelperContract, tokenContract, governanceContract } = useContext(ContractsContext);
  const { isAdmin, isAnalytics } = useContext(RoleContext);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [healthScore, setHealthScore] = useState(null);
  const [proposalStats, setProposalStats] = useState(null);
  const [voterStats, setVoterStats] = useState(null);
  const [distributionStats, setDistributionStats] = useState(null);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!analyticsHelperContract || !tokenContract || !governanceContract) return;
      
      try {
        setLoading(true);
        
        // In a real implementation, we would fetch actual data from the contracts
        // For demonstration purposes, we'll use simulated data
        
        // Simulated health score
        setHealthScore({
          score: 78,
          breakdown: [16, 15, 20, 14, 13], // Participation, Delegation, Activity, Execution, Threat Diversity
          maxScore: 100
        });
        
        // Simulated proposal stats
        setProposalStats({
          totalProposals: 43,
          activeProposals: 5,
          canceledProposals: 3,
          defeatedProposals: 10,
          succeededProposals: 8,
          queuedProposals: 2,
          executedProposals: 15,
          expiredProposals: 0,
          
          // By type counts
          generalProposals: 12,
          withdrawalProposals: 7,
          tokenTransferProposals: 10,
          governanceChangeProposals: 5,
          externalERC20Proposals: 6,
          tokenMintProposals: 2,
          tokenBurnProposals: 1,
          
          // Success rates (basis points)
          generalSuccessRate: 7500,
          withdrawalSuccessRate: 5700,
          tokenTransferSuccessRate: 8000,
          governanceChangeSuccessRate: 6000,
          externalERC20SuccessRate: 5000,
          tokenMintSuccessRate: 5000,
          tokenBurnSuccessRate: 0,
          
          // Time metrics
          avgProposalLifetime: 432000, // 5 days in seconds
          avgTimeToExecution: 864000, // 10 days in seconds
          avgVotingTurnout: 6500 // 65% in basis points
        });
        
        // Simulated voter stats
        setVoterStats({
          totalVoters: 250,
          activeVoters: 85, // Voted in last 10 proposals
          superActiveVoters: 32, // Voted in 80%+ of proposals
          consistentVoters: 65, // Vote same way 80%+ of the time
          yesLeaning: 45, // Vote yes more than 66% of the time
          noLeaning: 18, // Vote no more than 66% of the time
          balanced: 22, // Vote approximately evenly
          delegatorCount: 180, // Number of accounts delegating
          delegateCount: 70, // Number of accounts receiving delegation
          avgDelegationChainLength: 1.8
        });
        
        // Simulated token distribution stats
        setDistributionStats({
          totalSupply: ethers.parseEther('1000000'), // 1 million tokens
          circulatingSupply: ethers.parseEther('750000'), // 750k tokens
          treasuryBalance: ethers.parseEther('250000'), // 250k tokens
          activeTokens: ethers.parseEther('600000'), // 600k tokens
          delegatedTokens: ethers.parseEther('450000'), // 450k tokens
          smallHolderCount: 220, // < 1% of supply
          mediumHolderCount: 25, // 1-5% of supply
          largeHolderCount: 5, // > 5% of supply
          smallHolderBalance: ethers.parseEther('150000'), // 150k tokens
          mediumHolderBalance: ethers.parseEther('350000'), // 350k tokens
          largeHolderBalance: ethers.parseEther('250000'), // 250k tokens
          tokensPerActiveVoter: ethers.parseEther('7058.82'), // Average per active voter
          giniCoefficient: 5200, // 0.52 in basis points
          topTenHolderBalance: ethers.parseEther('400000') // 400k tokens
        });
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [analyticsHelperContract, tokenContract, governanceContract]);

  // If wallet is not connected, show connect prompt
  if (!account) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletConnect />
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">About Analytics</h2>
            <p className="text-gray-600 mb-4">
              The Analytics Dashboard provides detailed metrics and insights about the DAO's governance, token distribution, and overall health.
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>View proposal statistics and success rates</li>
              <li>Analyze token distribution and delegation patterns</li>
              <li>Track governance participation and voter behavior</li>
              <li>Monitor overall DAO health metrics</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
      
      {/* Network Status */}
      <div className="mb-6">
        <NetworkStatus />
      </div>
      
      {/* Governance Health Score */}
      <div className="mb-6">
        <DashboardCard
          title="DAO Governance Health"
          icon={<ShieldIcon size={24} />}
          loading={loading}
        >
          <div className="p-6">
            {loading ? (
              <LoadingState text="Calculating health score..." />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{healthScore.score}/100</h3>
                    <p className="text-sm text-gray-500 mt-1">Overall Governance Health Score</p>
                  </div>
                  
                  <div className="w-24 h-24 relative">
                    {/* Circular progress indicator */}
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle 
                        className="text-gray-200" 
                        strokeWidth="8" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="40" 
                        cx="50" 
                        cy="50" 
                      />
                      <circle 
                        className="text-indigo-600" 
                        strokeWidth="8" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="40" 
                        cx="50" 
                        cy="50" 
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore.score / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                      <text 
                        x="50" 
                        y="50" 
                        className="text-2xl font-bold" 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        fill="#4f46e5"
                      >
                        {healthScore.score}
                      </text>
                    </svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                  <div className="bg-indigo-50 p-3 rounded-md">
                    <div className="text-sm font-medium text-indigo-800">Participation</div>
                    <div className="text-xl font-bold text-indigo-900">{healthScore.breakdown[0]}/20</div>
                    <div className="w-full bg-indigo-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-indigo-600 h-1.5 rounded-full" 
                        style={{ width: `${(healthScore.breakdown[0] / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-md">
                    <div className="text-sm font-medium text-blue-800">Delegation</div>
                    <div className="text-xl font-bold text-blue-900">{healthScore.breakdown[1]}/20</div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${(healthScore.breakdown[1] / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-sm font-medium text-green-800">Activity</div>
                    <div className="text-xl font-bold text-green-900">{healthScore.breakdown[2]}/20</div>
                    <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full" 
                        style={{ width: `${(healthScore.breakdown[2] / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-md">
                    <div className="text-sm font-medium text-purple-800">Execution</div>
                    <div className="text-xl font-bold text-purple-900">{healthScore.breakdown[3]}/20</div>
                    <div className="w-full bg-purple-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full" 
                        style={{ width: `${(healthScore.breakdown[3] / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-md">
                    <div className="text-sm font-medium text-orange-800">Diversity</div>
                    <div className="text-xl font-bold text-orange-900">{healthScore.breakdown[4]}/20</div>
                    <div className="w-full bg-orange-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-orange-600 h-1.5 rounded-full" 
                        style={{ width: `${(healthScore.breakdown[4] / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DashboardCard>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            
            <button
              className={`${
                activeTab === 'proposals'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('proposals')}
            >
              Proposal Metrics
            </button>
            
            <button
              className={`${
                activeTab === 'voters'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('voters')}
            >
              Voter Behavior
            </button>
            
            <button
              className={`${
                activeTab === 'distribution'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('distribution')}
            >
              Token Distribution
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Proposal Success Rate"
            value={proposalStats ? `${(proposalStats.executedProposals / proposalStats.totalProposals * 100).toFixed(1)}%` : "Loading..."}
            description={`${proposalStats ? proposalStats.executedProposals : '?'} of ${proposalStats ? proposalStats.totalProposals : '?'} proposals executed`}
            icon={<CheckIcon size={20} />}
            loading={loading}
          />
          
          <DashboardCard
            title="Active Voters"
            value={voterStats ? `${voterStats.activeVoters}` : "Loading..."}
            description={`${voterStats ? (voterStats.activeVoters / voterStats.totalVoters * 100).toFixed(1) : '?'}% of total voters`}
            icon={<UsersIcon size={20} />}
            loading={loading}
          />
          
          <DashboardCard
            title="Delegated Voting Power"
            value={distributionStats ? `${ethers.formatEther(distributionStats.delegatedTokens).split('.')[0]}` : "Loading..."}
            description={`${distributionStats ? (Number(distributionStats.delegatedTokens) * 100 / Number(distributionStats.totalSupply)).toFixed(1) : '?'}% of total supply`}
            icon={<UsersIcon size={20} />}
            loading={loading}
          />
          
          <DashboardCard
            title="Average Turnout"
            value={proposalStats ? `${(proposalStats.avgVotingTurnout / 100).toFixed(1)}%` : "Loading..."}
            description="Average voting participation"
            icon={<VoteIcon size={20} />}
            loading={loading}
          />
          
          <DashboardCard
            title="Avg. Time to Execution"
            value={proposalStats ? `${Math.floor(proposalStats.avgTimeToExecution / 86400)} days` : "Loading..."}
            description="From proposal to execution"
            icon={<ClockIcon size={20} />}
            loading={loading}
          />
          
          <DashboardCard
            title="Top 10 Concentration"
            value={distributionStats ? `${(Number(distributionStats.topTenHolderBalance) * 100 / Number(distributionStats.totalSupply)).toFixed(1)}%` : "Loading..."}
            description="Supply held by top 10 addresses"
            icon={<PieChartIcon size={20} />}
            loading={loading}
          />
        </div>
      )}
      
      {activeTab === 'proposals' && proposalStats && (
        <ProposalMetrics stats={proposalStats} loading={loading} />
      )}
      
      {activeTab === 'voters' && voterStats && (
        <GovernanceMetrics stats={voterStats} loading={loading} />
      )}
      
      {activeTab === 'distribution' && distributionStats && (
        <TokenDistribution stats={distributionStats} loading={loading} />
      )}
    </div>
  );
};

export default Analytics;