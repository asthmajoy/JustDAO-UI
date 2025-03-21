// src/pages/DAOHelper.jsx
import React, { useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  HelpCircleIcon, 
  UsersIcon, 
  ShieldIcon,
  LayersIcon,
  BriefcaseIcon
} from 'lucide-react';

import { WalletContext } from '../context/WalletContext';
import { ContractsContext } from '../context/ContractsContext';
import { RoleContext } from '../context/RoleContext';
import { NotificationContext } from '../context/NotificationContext';

import NetworkStatus from '../components/common/NetworkStatus';
import WalletConnect from '../components/common/WalletConnect';
import DashboardCard from '../components/common/DashboardCard';
import RoleManagement from '../components/daohelper/RoleManagement';
import TreasuryManagement from '../components/daohelper/TreasuryManagement';
import { LoadingState } from '../common/LoadingSpinner';

const DAOHelper = () => {
  const { account, isCorrectNetwork } = useContext(WalletContext);
  const { daoHelperContract, tokenContract } = useContext(ContractsContext);
  const { isAdmin, hasRequiredRole } = useContext(RoleContext);
  
  const [delegationStats, setDelegationStats] = useState({
    totalDelegations: null,
    avgChainDepth: null,
    maxChainDepth: null
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('delegation');

  // Fetch DAO helper stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!daoHelperContract || !tokenContract) return;
      
      try {
        setLoading(true);
        
        // For the demo, we'll simulate some stats
        // In a real implementation, these would come from contract calls
        
        // Simulated delegation stats
        setDelegationStats({
          totalDelegations: 423,
          avgChainDepth: 1.8,
          maxChainDepth: 5,
          potentialIssues: 2
        });
      } catch (error) {
        console.error("Error fetching DAO helper stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [daoHelperContract, tokenContract]);

  // If wallet is not connected, show connect prompt
  if (!account) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">DAO Helper</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletConnect />
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">About DAO Helper</h2>
            <p className="text-gray-600 mb-4">
              The DAO Helper provides utilities and analysis tools to help you interact with the DAO more effectively.
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Analyze delegation chains and voting power</li>
              <li>Manage role assignments (for admins)</li>
              <li>View treasury assets and transactions</li>
              <li>Check delegation safety before delegating</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">DAO Helper</h1>
      
      {/* Network Status */}
      <div className="mb-6">
        <NetworkStatus />
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              className={`${
                activeTab === 'delegation'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('delegation')}
            >
              Delegation Analysis
            </button>
            
            <button
              className={`${
                activeTab === 'treasury'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('treasury')}
            >
              Treasury Management
            </button>
            
            {hasRequiredRole(['admin']) && (
              <button
                className={`${
                  activeTab === 'roles'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                onClick={() => setActiveTab('roles')}
              >
                Role Management
              </button>
            )}
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'delegation' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delegation Analysis</h2>
          
          {/* Delegation Stats */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              title="Total Delegations"
              value={delegationStats.totalDelegations !== null ? delegationStats.totalDelegations.toString() : "Loading..."}
              icon={<UsersIcon size={20} />}
              loading={loading}
            />
            
            <DashboardCard
              title="Average Chain Depth"
              value={delegationStats.avgChainDepth !== null ? delegationStats.avgChainDepth.toString() : "Loading..."}
              icon={<LayersIcon size={20} />}
              loading={loading}
            />
            
            <DashboardCard
              title="Maximum Chain Depth"
              value={delegationStats.maxChainDepth !== null ? delegationStats.maxChainDepth.toString() : "Loading..."}
              icon={<LayersIcon size={20} />}
              loading={loading}
            />
            
            <DashboardCard
              title="Potential Issues"
              value={delegationStats.potentialIssues !== null ? delegationStats.potentialIssues.toString() : "Loading..."}
              icon={<ShieldIcon size={20} />}
              loading={loading}
            />
          </div>
          
          {/* Delegation Safety Checker */}
          <div className="mb-6">
            <DashboardCard
              title="Delegation Safety Checker"
              icon={<ShieldIcon size={24} />}
            >
              <div className="p-4">
                <p className="text-gray-600 mb-4">
                  Check if your delegation would be safe before delegating your tokens. This tool helps prevent delegation cycles and maintain chain depth limits.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="delegator" className="block text-sm font-medium text-gray-700 mb-1">
                      Delegator Address (Your Address)
                    </label>
                    <input
                      id="delegator"
                      type="text"
                      defaultValue={account}
                      disabled
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="delegatee" className="block text-sm font-medium text-gray-700 mb-1">
                      Delegatee Address (Who to delegate to)
                    </label>
                    <input
                      id="delegatee"
                      type="text"
                      placeholder="0x..."
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Check Delegation Safety
                  </button>
                </div>
              </div>
            </DashboardCard>
          </div>
          
          {/* Delegation Tree Viewer */}
          <div className="mb-6">
            <DashboardCard
              title="Delegation Tree Viewer"
              icon={<UsersIcon size={24} />}
            >
              <div className="p-4">
                <p className="text-gray-600 mb-4">
                  View the delegation tree to understand how voting power is distributed across the DAO.
                </p>
                
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
                  <p className="text-gray-500">Delegation tree visualization will be available soon</p>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      )}
      
      {activeTab === 'treasury' && (
        <TreasuryManagement />
      )}
      
      {activeTab === 'roles' && isAdmin && (
        <RoleManagement />
      )}
    </div>
  );
};

export default DAOHelper;