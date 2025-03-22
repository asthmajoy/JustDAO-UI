import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, LineChart, AreaChart } from 'lucide-react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import Loader from '../components/Loader';
import { formatBigNumber, formatPercentage } from '../utils/formatters';

// Register Chart.js components
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

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
  const [charts, setCharts] = useState({});

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

  // Create charts when data or selected metric changes
  useEffect(() => {
    if (loading) return;
    
    // Clear old charts
    Object.values(charts).forEach(chart => chart.destroy?.());
    
    // Create new charts based on selected metric
    const newCharts = {};
    
    switch (selectedMetric) {
      case 'proposal':
        if (analyticsData.proposals) {
          // Proposal Success Rate Chart
          const proposalTypeCtx = document.getElementById('proposalTypeChart');
          if (proposalTypeCtx) {
            newCharts.proposalType = new Chart(proposalTypeCtx, {
              type: 'bar',
              data: {
                labels: ['General', 'Withdrawal', 'Token Transfer', 'Governance', 'ERC20 Transfer', 'Token Mint', 'Token Burn'],
                datasets: [{
                  label: 'Success Rate (%)',
                  data: [
                    analyticsData.proposals.generalSuccessRate / 100,
                    analyticsData.proposals.withdrawalSuccessRate / 100,
                    analyticsData.proposals.tokenTransferSuccessRate / 100,
                    analyticsData.proposals.governanceChangeSuccessRate / 100,
                    analyticsData.proposals.externalERC20SuccessRate / 100,
                    analyticsData.proposals.tokenMintSuccessRate / 100,
                    analyticsData.proposals.tokenBurnSuccessRate / 100
                  ],
                  backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(201, 203, 207, 0.6)'
                  ],
                  borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(54, 162, 235)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 99, 132)',
                    'rgb(255, 206, 86)',
                    'rgb(201, 203, 207)'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Success Rate: ${(context.raw * 100).toFixed(1)}%`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                      callback: function(value) {
                        return (value * 100) + '%';
                      }
                    }
                  }
                }
              }
            });
          }
        }
        break;
        
      case 'voter':
        if (analyticsData.voters) {
          // Voter Distribution Chart
          const voterDistributionCtx = document.getElementById('voterDistributionChart');
          if (voterDistributionCtx) {
            newCharts.voterDistribution = new Chart(voterDistributionCtx, {
              type: 'pie',
              data: {
                labels: ['Yes Leaning', 'No Leaning', 'Balanced'],
                datasets: [{
                  data: [
                    analyticsData.voters.yesLeaning,
                    analyticsData.voters.noLeaning,
                    analyticsData.voters.balanced
                  ],
                  backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)'
                  ],
                  borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }
            });
          }
        }
        break;
        
      case 'token':
        if (analyticsData.tokens) {
          // Token Distribution Chart
          const tokenDistributionCtx = document.getElementById('tokenDistributionChart');
          if (tokenDistributionCtx) {
            newCharts.tokenDistribution = new Chart(tokenDistributionCtx, {
              type: 'pie',
              data: {
                labels: ['Small Holders (<1%)', 'Medium Holders (1-5%)', 'Large Holders (>5%)', 'Treasury'],
                datasets: [{
                  data: [
                    analyticsData.tokens.smallHolderBalance,
                    analyticsData.tokens.mediumHolderBalance,
                    analyticsData.tokens.largeHolderBalance,
                    analyticsData.tokens.treasuryBalance
                  ],
                  backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                  ],
                  borderColor: [
                    'rgb(54, 162, 235)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)',
                    'rgb(75, 192, 192)'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        const formattedValue = formatBigNumber(value.toString());
                        return `${context.label}: ${formattedValue} (${percentage}%)`;
                      }
                    }
                  }
                }
              }
            });
          }
        }
        break;
        
      case 'health':
        if (analyticsData.health) {
          // Health Score Components Chart
          const healthScoreCtx = document.getElementById('healthScoreChart');
          if (healthScoreCtx) {
            newCharts.healthScore = new Chart(healthScoreCtx, {
              type: 'radar',
              data: {
                labels: ['Participation', 'Delegation', 'Activity', 'Execution', 'Threat Diversity'],
                datasets: [{
                  label: 'Score (/20)',
                  data: [
                    analyticsData.health[1][0],
                    analyticsData.health[1][1],
                    analyticsData.health[1][2],
                    analyticsData.health[1][3],
                    analyticsData.health[1][4]
                  ],
                  fill: true,
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  borderColor: 'rgb(75, 192, 192)',
                  pointBackgroundColor: 'rgb(75, 192, 192)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgb(75, 192, 192)'
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    angleLines: {
                      display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 20
                  }
                }
              }
            });
          }
        }
        break;
        
      case 'timelock':
        if (analyticsData.timelock) {
          // Threat Level Distribution Chart
          const threatLevelCtx = document.getElementById('threatLevelChart');
          if (threatLevelCtx) {
            newCharts.threatLevel = new Chart(threatLevelCtx, {
              type: 'pie',
              data: {
                labels: ['Low Threat', 'Medium Threat', 'High Threat', 'Critical Threat'],
                datasets: [{
                  data: [
                    analyticsData.timelock.lowThreatCount,
                    analyticsData.timelock.mediumThreatCount,
                    analyticsData.timelock.highThreatCount,
                    analyticsData.timelock.criticalThreatCount
                  ],
                  backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                  ],
                  borderColor: [
                    'rgb(75, 192, 192)',
                    'rgb(255, 206, 86)',
                    'rgb(255, 159, 64)',
                    'rgb(255, 99, 132)'
                  ],
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${context.label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }
            });
          }
        }
        break;
        
      default:
        break;
    }
    
    setCharts(newCharts);
    
    // Cleanup charts on unmount
    return () => {
      Object.values(newCharts).forEach(chart => chart.destroy?.());
    };
  }, [analyticsData, selectedMetric, loading]);

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
            { id: 'proposal', label: 'Proposal Analytics', icon: <BarChart className="w-4 h-4 mr-1" /> },
            { id: 'voter', label: 'Voter Behavior', icon: <PieChart className="w-4 h-4 mr-1" /> },
            { id: 'token', label: 'Token Distribution', icon: <AreaChart className="w-4 h-4 mr-1" /> },
            { id: 'timelock', label: 'Timelock Analytics', icon: <LineChart className="w-4 h-4 mr-1" /> },
            { id: 'health', label: 'Governance Health', icon: <BarChart className="w-4 h-4 mr-1" /> }
          ].map(metric => (
            <button
              key={metric.id}
              className={`px-3 py-1 rounded-full text-sm flex items-center ${selectedMetric === metric.id ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setSelectedMetric(metric.id)}
            >
              {metric.icon}
              {metric.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Analytics content */}
      <div className="bg-white p-6 rounded-lg shadow">
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
                <div className="mb-6 h-64">
                  <canvas id="proposalTypeChart"></canvas>
                </div>
                
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
                          className={`${item.rate > 0.7 ? 'bg-green-500' : item.rate > 0.5 ? 'bg-yellow-500' : 'bg-red-500'} h-2 rounded-full`} 
                          style={{ width: `${item.rate * 100}%` }}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="h-64">
                    <canvas id="voterDistributionChart"></canvas>
                  </div>
                  
                  <div className="space-y-3">
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
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Voter Participation Insights</h4>
                  <p className="text-sm text-blue-700">
                    {analyticsData.voters.activeVoters / analyticsData.voters.totalVoters > 0.5 ? 
                      "High participation rate showing strong community engagement. Continue encouraging voter participation through incentives and clear communication." : 
                      "Voter participation could be improved. Consider implementing voting incentives, simplifying proposal language, or adding educational resources."}
                  </p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="h-64">
                    <canvas id="tokenDistributionChart"></canvas>
                  </div>
                  
                  <div className="space-y-3">
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
                </div>
                
                <h4 className="font-medium mb-2">Gini Coefficient: {(analyticsData.tokens.giniCoefficient / 10000).toFixed(2)}</h4>
                <p className="text-sm text-gray-500 mb-4">Represents the inequality of token distribution (0 = perfect equality, 1 = perfect inequality)</p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Distribution Assessment</h4>
                  <p className="text-sm text-blue-700">
                    {analyticsData.tokens.giniCoefficient > 5000 ? 
                      "Token distribution shows significant concentration among large holders. Consider initiatives to broaden distribution and encourage small holder participation." : 
                      "Token distribution is reasonably balanced, promoting diverse governance participation. Continue monitoring to maintain decentralization."}
                  </p>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <h4 className="font-medium mb-2">Health Score Breakdown</h4>
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
                  
                  <div className="h-64">
                    <canvas id="healthScoreChart"></canvas>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Health Assessment</h4>
                  <p className="text-sm text-blue-700">
                    {analyticsData.health[0] > 75 ? 
                      "DAO governance is healthy and well-functioning. Continue monitoring and implementing best practices to maintain this level." : 
                      analyticsData.health[0] > 50 ? 
                      "DAO governance is functioning adequately but has room for improvement, particularly in " + 
                      (Math.min(...analyticsData.health[1]) === analyticsData.health[1][0] ? "voter participation" : 
                       Math.min(...analyticsData.health[1]) === analyticsData.health[1][1] ? "delegation practices" : 
                       Math.min(...analyticsData.health[1]) === analyticsData.health[1][2] ? "governance activity" : 
                       Math.min(...analyticsData.health[1]) === analyticsData.health[1][3] ? "proposal execution" : 
                       "threat diversity") + "." : 
                      "DAO governance requires significant improvement. Focus on areas with low scores and consider consulting governance experts."}
                  </p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="h-64">
                    <canvas id="threatLevelChart"></canvas>
                  </div>
                  
                  <div className="space-y-3">
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
                </div>
                
                <h4 className="font-medium mb-2">Average Execution Delays</h4>
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
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Security Insight</h4>
                  <p className="text-sm text-blue-700">
                    {analyticsData.timelock.highThreatCount + analyticsData.timelock.criticalThreatCount > 
                     analyticsData.timelock.totalTransactions * 0.2 ? 
                     "A significant portion of transactions have high or critical threat ratings. Consider reviewing governance security measures and implementing additional controls for sensitive operations." : 
                     "Threat distribution is at a healthy level with most transactions falling in the low or medium categories, indicating good security practices are in place."}
                  </p>
                </div>
              </>
            )}
            
            {!analyticsData[selectedMetric] && !loading && (
              <div className="text-center py-8 text-gray-500">
                <p>No analytics data available for {selectedMetric} analytics</p>
                <p className="text-sm mt-2">This may be due to insufficient historical data or a configuration issue</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
  
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
export default AnalyticsTab;