// src/components/analytics/TokenDistribution.jsx
import React from 'react';
import { ethers } from 'ethers';
import {
  PieChartIcon,
  BarChartIcon,
  CircleDollarSignIcon,
  UsersIcon,
  PercentIcon,
  BriefcaseIcon
} from 'lucide-react';

import DashboardCard from '../common/DashboardCard';
import { LoadingState } from '../common/LoadingSpinner';

const TokenDistribution = ({ stats, loading }) => {
  // Format token amounts for display
  const formatTokenAmount = (amount) => {
    if (!amount) return "0";
    return parseFloat(ethers.formatEther(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Format percentage
  const formatPercentage = (amount, total) => {
    if (!amount || !total) return "0%";
    return `${((Number(amount) / Number(total)) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return <LoadingState text="Loading token distribution metrics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Supply Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Total Supply"
          value={`${formatTokenAmount(stats.totalSupply)} JUST`}
          icon={<CircleDollarSignIcon size={20} />}
        />
        
        <DashboardCard
          title="Circulating Supply"
          value={`${formatTokenAmount(stats.circulatingSupply)} JUST`}
          description={`${formatPercentage(stats.circulatingSupply, stats.totalSupply)} of total supply`}
          icon={<CircleDollarSignIcon size={20} />}
        />
        
        <DashboardCard
          title="Treasury Balance"
          value={`${formatTokenAmount(stats.treasuryBalance)} JUST`}
          description={`${formatPercentage(stats.treasuryBalance, stats.totalSupply)} of total supply`}
          icon={<BriefcaseIcon size={20} />}
        />
      </div>
      
      {/* Token Activity */}
      <DashboardCard
        title="Token Activity"
        icon={<BarChartIcon size={24} />}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-700 mb-1">
                Active Tokens
              </div>
              <div className="text-2xl font-bold text-green-900 mb-1">
                {formatTokenAmount(stats.activeTokens)} JUST
              </div>
              <div className="text-xs text-green-600 mb-2">
                Tokens used in voting in last 30 days
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(Number(stats.activeTokens) / Number(stats.totalSupply)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-indigo-700 mb-1">
                Delegated Tokens
              </div>
              <div className="text-2xl font-bold text-indigo-900 mb-1">
                {formatTokenAmount(stats.delegatedTokens)} JUST
              </div>
              <div className="text-xs text-indigo-600 mb-2">
                Tokens delegated to other accounts
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full" 
                  style={{ width: `${(Number(stats.delegatedTokens) / Number(stats.totalSupply)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Token Activity Rate
            </div>
            <div className="text-lg text-gray-900 mb-1">
              {formatPercentage(stats.activeTokens, stats.circulatingSupply)} of circulating supply is active
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Based on voting and delegation activity
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(Number(stats.activeTokens) / Number(stats.circulatingSupply)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </DashboardCard>
      
      {/* Holder Distribution */}
      <DashboardCard
        title="Token Holder Distribution"
        icon={<PieChartIcon size={24} />}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Small Holders (&lt;1%)
              </div>
              <div className="flex items-baseline">
                <div className="text-xl font-bold text-gray-900">
                  {stats.smallHolderCount}
                </div>
                <div className="ml-2 text-sm text-gray-500">
                  accounts
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Hold: {formatTokenAmount(stats.smallHolderBalance)} JUST
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercentage(stats.smallHolderBalance, stats.totalSupply)} of total supply
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(Number(stats.smallHolderBalance) / Number(stats.totalSupply)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Medium Holders (1-5%)
              </div>
              <div className="flex items-baseline">
                <div className="text-xl font-bold text-gray-900">
                  {stats.mediumHolderCount}
                </div>
                <div className="ml-2 text-sm text-gray-500">
                  accounts
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Hold: {formatTokenAmount(stats.mediumHolderBalance)} JUST
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercentage(stats.mediumHolderBalance, stats.totalSupply)} of total supply
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full" 
                  style={{ width: `${(Number(stats.mediumHolderBalance) / Number(stats.totalSupply)) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Large Holders (&gt;5%)
              </div>
              <div className="flex items-baseline">
                <div className="text-xl font-bold text-gray-900">
                  {stats.largeHolderCount}
                </div>
                <div className="ml-2 text-sm text-gray-500">
                  accounts
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Hold: {formatTokenAmount(stats.largeHolderBalance)} JUST
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatPercentage(stats.largeHolderBalance, stats.totalSupply)} of total supply
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: `${(Number(stats.largeHolderBalance) / Number(stats.totalSupply)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Distribution Summary */}
          <div className="mt-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">Supply Distribution</h3>
            <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div 
                  className="bg-blue-500 h-full"
                  style={{ width: `${(Number(stats.smallHolderBalance) / Number(stats.totalSupply)) * 100}%` }}
                  title="Small Holders"
                ></div>
                <div 
                  className="bg-indigo-500 h-full"
                  style={{ width: `${(Number(stats.mediumHolderBalance) / Number(stats.totalSupply)) * 100}%` }}
                  title="Medium Holders"
                ></div>
                <div 
                  className="bg-purple-500 h-full"
                  style={{ width: `${(Number(stats.largeHolderBalance) / Number(stats.totalSupply)) * 100}%` }}
                  title="Large Holders"
                ></div>
                <div 
                  className="bg-gray-400 h-full"
                  style={{ width: `${(Number(stats.treasuryBalance) / Number(stats.totalSupply)) * 100}%` }}
                  title="Treasury"
                ></div>
              </div>
            </div>
            <div className="flex mt-2 text-xs text-gray-600 justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                <span>Small Holders</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></div>
                <span>Medium Holders</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                <span>Large Holders</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div>
                <span>Treasury</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>
      
      {/* Distribution Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Tokens per Active Voter"
          value={`${parseFloat(ethers.formatEther(stats.tokensPerActiveVoter)).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
          })} JUST`}
          icon={<UsersIcon size={20} />}
        />
        
        <DashboardCard
          title="Top 10 Concentration"
          value={`${formatPercentage(stats.topTenHolderBalance, stats.totalSupply)}`}
          description="Supply held by top 10 addresses"
          icon={<PercentIcon size={20} />}
        />
        
        <DashboardCard
          title="Gini Coefficient"
          value={`${(stats.giniCoefficient / 10000).toFixed(2)}`}
          description="Measure of inequality (0-1)"
          icon={<BarChartIcon size={20} />}
        />
      </div>
    </div>
  );
};

export default TokenDistribution;