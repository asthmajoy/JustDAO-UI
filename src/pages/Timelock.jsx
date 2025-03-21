// src/pages/Timelock.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { 
  ClockIcon, 
  PlayIcon, 
  CheckIcon, 
  XIcon,
  AlertTriangleIcon,
  PlusIcon
} from 'lucide-react';

import { WalletContext } from '../context/WalletContext';
import { ContractsContext } from '../context/ContractsContext';
import { RoleContext } from '../context/RoleContext';
import { NotificationContext } from '../context/NotificationContext';

import NetworkStatus from '../components/common/NetworkStatus';
import WalletConnect from '../components/common/WalletConnect';
import TimelockTransactionList from '../components/timelock/TimelockTransactionList';
import QueueTransaction from '../components/timelock/QueueTransaction';
import DashboardCard from '../components/common/DashboardCard';

const Timelock = () => {
  const { account, isCorrectNetwork } = useContext(WalletContext);
  const { timelockContract } = useContext(ContractsContext);
  const { isProposer, isExecutor, isAdmin, isGuardian } = useContext(RoleContext);
  
  const [timelockParams, setTimelockParams] = useState({
    minDelay: null,
    gracePeriod: null,
    lowThreatDelay: null,
    mediumThreatDelay: null,
    highThreatDelay: null,
    criticalThreatDelay: null
  });
  
  const [loading, setLoading] = useState(true);
  const [showQueueForm, setShowQueueForm] = useState(false);

  // Fetch timelock parameters
  useEffect(() => {
    const fetchTimelockParams = async () => {
      if (!timelockContract) return;
      
      try {
        setLoading(true);
        
        // Fetch basic timelock parameters
        const minDelay = await timelockContract.minDelay();
        const gracePeriod = await timelockContract.gracePeriod();
        
        // Fetch threat level delays
        const lowThreatDelay = await timelockContract.lowThreatDelay();
        const mediumThreatDelay = await timelockContract.mediumThreatDelay();
        const highThreatDelay = await timelockContract.highThreatDelay();
        const criticalThreatDelay = await timelockContract.criticalThreatDelay();
        
        setTimelockParams({
          minDelay,
          gracePeriod,
          lowThreatDelay,
          mediumThreatDelay,
          highThreatDelay,
          criticalThreatDelay
        });
      } catch (error) {
        console.error("Error fetching timelock parameters:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimelockParams();
  }, [timelockContract]);

  // Format time in seconds to human readable format
  const formatTimeSeconds = (seconds) => {
    if (!seconds) return "loading...";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  // If wallet is not connected, show connect prompt
  if (!account) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Timelock Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WalletConnect />
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">About Timelock</h2>
            <p className="text-gray-600 mb-4">
              The timelock manages the execution delay for governance actions, providing security by ensuring time for review before implementation.
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Queue transactions with different security levels</li>
              <li>Execute transactions after the timelock period</li>
              <li>Cancel pending transactions if needed</li>
              <li>View transaction history and status</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Timelock Management</h1>
        
        {(isProposer || isAdmin) && (
          <button
            onClick={() => setShowQueueForm(!showQueueForm)}
            disabled={!isCorrectNetwork}
            className={`mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !isCorrectNetwork
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {showQueueForm ? (
              <>
                <XIcon size={16} className="mr-2" />
                Hide Form
              </>
            ) : (
              <>
                <PlusIcon size={16} className="mr-2" />
                Queue Transaction
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Network Status */}
      <div className="mb-6">
        <NetworkStatus />
      </div>
      
      {/* Queue Transaction Form */}
      {showQueueForm && (isProposer || isAdmin) && (
        <div className="mb-6">
          <QueueTransaction 
            onComplete={() => setShowQueueForm(false)} 
            timelockParams={timelockParams}
          />
        </div>
      )}
      
      {/* Timelock Parameters */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Timelock Parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="Minimum Delay"
            value={formatTimeSeconds(timelockParams.minDelay)}
            icon={<ClockIcon size={20} />}
            loading={loading}
          />
          <DashboardCard
            title="Grace Period"
            value={formatTimeSeconds(timelockParams.gracePeriod)}
            icon={<ClockIcon size={20} />}
            loading={loading}
          />
          <DashboardCard
            title="Low Threat Delay"
            value={formatTimeSeconds(timelockParams.lowThreatDelay)}
            icon={<ClockIcon size={20} />}
            loading={loading}
          />
          <DashboardCard
            title="Medium Threat Delay"
            value={formatTimeSeconds(timelockParams.mediumThreatDelay)}
            icon={<ClockIcon size={20} />}
            loading={loading}
          />
          <DashboardCard
            title="High Threat Delay"
            value={formatTimeSeconds(timelockParams.highThreatDelay)}
            icon={<ClockIcon size={20} />}
            loading={loading}
          />
          <DashboardCard
            title="Critical Threat Delay"
            value={formatTimeSeconds(timelockParams.criticalThreatDelay)}
            icon={<ClockIcon size={20} />}
            loading={loading}
          />
        </div>
      </div>
      
      {/* Transactions List */}
      <div className="mb-6">
        <TimelockTransactionList />
      </div>
    </div>
  );
};

export default Timelock;