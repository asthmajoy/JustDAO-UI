// src/components/dashboard/DAOStats.jsx
import React from 'react';
import { ethers } from 'ethers';
import { 
  CoinsIcon, 
  VoteIcon, 
  UsersIcon, 
  BarChartIcon,
  PercentIcon,
  LandmarkIcon
} from 'lucide-react';

import DashboardCard, { StatCard } from '../common/DashboardCard';

const DAOStats = ({ tokenInfo, governanceInfo, loading }) => {
  // Format token amounts for display
  const formatTokenAmount = (amount) => {
    if (!amount) return "0";
    return parseFloat(ethers.formatEther(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };
  
  // Calculate delegation percentage
  const calculateDelegationPercentage = () => {
    if (!tokenInfo.delegatedTokens || !tokenInfo.totalSupply) return 0;
    const delegatedPercentage = tokenInfo.delegatedTokens.mul(100).div(tokenInfo.totalSupply);
    return delegatedPercentage.toString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Supply Card */}
      <StatCard
        title="Total Token Supply"
        value={tokenInfo.totalSupply ? formatTokenAmount(tokenInfo.totalSupply) + " JUST" : "Loading..."}
        loading={loading}
        icon={<CoinsIcon size={24} />}
      />
      
      {/* Treasury Balance Card */}
      <StatCard
        title="Treasury Balance"
        value={tokenInfo.treasuryBalance ? formatTokenAmount(tokenInfo.treasuryBalance) + " JUST" : "Loading..."}
        loading={loading}
        icon={<LandmarkIcon size={24} />}
      />
      
      {/* Active Proposals Card */}
      <StatCard
        title="Active Proposals"
        value={governanceInfo.activeProposals !== null ? governanceInfo.activeProposals.toString() : "Loading..."}
        loading={loading}
        icon={<VoteIcon size={24} />}
      />
      
      {/* Total Proposals Card */}
      <StatCard
        title="Total Proposals"
        value={governanceInfo.totalProposals !== null ? governanceInfo.totalProposals.toString() : "Loading..."}
        loading={loading}
        icon={<BarChartIcon size={24} />}
      />
    </div>
  );
};

export default DAOStats;