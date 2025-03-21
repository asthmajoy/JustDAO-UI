// src/pages/Dashboard.jsx
import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { 
  CoinsIcon, 
  VoteIcon, 
  ClockIcon, 
  BarChartIcon, 
  UsersIcon,
  ChevronRightIcon,
  PlusIcon
} from 'lucide-react';

import { WalletContext } from '../context/WalletContext';
import { ContractsContext } from '../context/ContractsContext';
import { RoleContext } from '../context/RoleContext';

import DashboardCard, { StatCard } from '../components/common/DashboardCard';
import WalletConnect from '../components/common/WalletConnect';
import NetworkStatus from '../components/common/NetworkStatus';
import DAOStats from '../components/dashboard/DAOStats';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import QuickActions from '../components/dashboard/QuickActions';

const Dashboard = () => {
  const { account, isCorrectNetwork } = useContext(WalletContext);
  const { tokenContract, governanceContract, daoHelperContract } = useContext(ContractsContext);
  const { isAdmin, isProposer, hasAnyRole } = useContext(RoleContext);
  
  const [tokenInfo, setTokenInfo] = useState({
    totalSupply: null,
    treasuryBalance: null,
    delegatedTokens: null
  });
  
  const [governanceInfo, setGovernanceInfo] = useState({
    activeProposals: null,
    totalProposals: null,
    participationRate: null
  });
  
  const [loading, setLoading] = useState(true);

  // Fetch basic DAO statistics
  useEffect(() => {
    const fetchData = async () => {
      if (!tokenContract || !governanceContract) return;
      
      try {
        setLoading(true);
        
        // Fetch token information
        const totalSupply = await tokenContract.totalSupply();
        let treasuryBalance = ethers.parseEther("0");
        
        try {
          treasuryBalance = await tokenContract.balanceOf(governanceContract.address);
        } catch (error) {
          console.error("Error fetching treasury balance:", error);
        }
        
        // Fetch active proposals count (simplified approach)
        let activeProposalsCount = 0;
        let totalProposals = 0;
        
        // Try to find latest proposal ID
        try {
          for (let i = 0; i < 100; i++) {
            try {
              const state = await governanceContract.getProposalState(i);
              totalProposals = i + 1;
              
              if (state === 0) { // Active state
                activeProposalsCount++;
              }
            } catch (error) {
              break; // Proposal doesn't exist, exit loop
            }
          }
        } catch (error) {
          console.error("Error counting proposals:", error);
        }
        
        // Update state with fetched data
        setTokenInfo({
          totalSupply: totalSupply,
          treasuryBalance: treasuryBalance,
          delegatedTokens: ethers.parseEther("0") // Will be updated in future implementation
        });
        
        setGovernanceInfo({
          activeProposals: activeProposalsCount,
          totalProposals: totalProposals,
          participationRate: 0 // Will be updated in future implementation
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tokenContract, governanceContract]);

  // If wallet is not connected, show connect prompt
  if (!account) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Just DAO Governance Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletConnect />
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Welcome to Just DAO</h2>
            <p className="text-gray-600 mb-4">
              Connect your wallet to access governance features, view token balances, and participate in DAO activities.
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Create and vote on proposals</li>
              <li>Manage token delegations</li>
              <li>View treasury analytics</li>
              <li>Participate in governance decisions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">DAO Dashboard</h1>
      
      {/* Network Status */}
      <div className="mb-6">
        <NetworkStatus />
      </div>
      
      {/* DAO Stats Overview */}
      <DAOStats 
        tokenInfo={tokenInfo} 
        governanceInfo={governanceInfo} 
        loading={loading}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivityList />
        </div>
        
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;