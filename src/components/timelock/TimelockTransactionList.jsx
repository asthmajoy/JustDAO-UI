// src/components/timelock/TimelockTransactionList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { 
  ClockIcon, 
  PlayIcon, 
  CheckIcon, 
  XIcon, 
  AlertTriangleIcon,
  ArrowUpRightIcon
} from 'lucide-react';

import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { RoleContext } from '../../context/RoleContext';
import { NotificationContext } from '../../context/NotificationContext';

import DashboardCard from '../common/DashboardCard';
import { LoadingState, TransactionPending } from '../common/LoadingSpinner';

// Transaction status badge component
const StatusBadge = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon size={12} className="mr-1" />
          Pending
        </span>
      );
    case 'ready':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <PlayIcon size={12} className="mr-1" />
          Ready
        </span>
      );
    case 'executed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckIcon size={12} className="mr-1" />
          Executed
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangleIcon size={12} className="mr-1" />
          Expired
        </span>
      );
    default:
      return null;
  }
};

// Threat level badge component
const ThreatLevelBadge = ({ level }) => {
  const levels = {
    0: { bg: 'bg-green-100', text: 'text-green-800', label: 'Low' },
    1: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
    2: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
    3: { bg: 'bg-red-100', text: 'text-red-800', label: 'Critical' }
  };
  
  const style = levels[level] || levels[0];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

const TimelockTransactionList = () => {
  const { account } = useContext(WalletContext);
  const { timelockContract, daoHelperContract, getContract } = useContext(ContractsContext);
  const { isExecutor, isAdmin, isGuardian } = useContext(RoleContext);
  const { addPendingTransaction, notifySuccess, notifyError, notifyWarning, getExplorerLink } = useContext(NotificationContext);
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [currentTxHash, setCurrentTxHash] = useState(null);
  
  // Function to fetch timelock transactions
  // This is a simplified approach since there's no direct way to get all transactions
  // In a production environment, you would use events or a subgraph
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!timelockContract) return;
      
      try {
        setLoading(true);
        
        // We'll simulate fetching transactions by creating test data based on contract info
        // In a real implementation, you'd use events or a subgraph to get actual transactions
        const currentTime = Math.floor(Date.now() / 1000);
        const gracePeriod = await timelockContract.gracePeriod();
        
        // Create some sample transactions based on the DAO helper contract
        const sampleTxHashes = [
          ethers.keccak256(ethers.toUtf8Bytes("tx1")),
          ethers.keccak256(ethers.toUtf8Bytes("tx2")),
          ethers.keccak256(ethers.toUtf8Bytes("tx3")),
          ethers.keccak256(ethers.toUtf8Bytes("tx4"))
        ];
        
        const txPromises = sampleTxHashes.map(async (txHash, index) => {
          try {
            // Try to get transaction details from the contract (will fail for our simulation)
            const [target, value, data, eta, executed] = await timelockContract.getTransaction(txHash);
            
            // Process real transaction data
            return {
              txHash,
              target,
              value: ethers.formatEther(value),
              data,
              eta: Number(eta),
              executed,
              expired: !executed && currentTime > Number(eta) + Number(gracePeriod),
              status: executed 
                ? 'executed' 
                : (currentTime > Number(eta) + Number(gracePeriod) 
                  ? 'expired' 
                  : (currentTime > Number(eta) ? 'ready' : 'pending')),
              threatLevel: index % 4, // Simulate different threat levels
              timeRemaining: Math.max(0, Number(eta) - currentTime)
            };
          } catch (error) {
            // For simulation purposes, create sample data
            // In a real app, we'd skip transactions that don't exist
            const simulationData = {
              txHash,
              target: daoHelperContract?.address || ethers.ZeroAddress,
              value: "0",
              data: "0x",
              eta: currentTime + (index + 1) * 3600, // Varied ETAs
              executed: index === 2, // One is executed
              expired: index === 3, // One is expired
              status: index === 2 
                ? 'executed' 
                : (index === 3 
                  ? 'expired' 
                  : (index === 1 ? 'ready' : 'pending')),
              threatLevel: index % 4, // Different threat levels
              timeRemaining: index === 2 || index === 3 ? 0 : (index + 1) * 3600
            };
            return simulationData;
          }
        });
        
        const txResults = await Promise.all(txPromises);
        setTransactions(txResults);
      } catch (error) {
        console.error("Error fetching timelock transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [timelockContract, daoHelperContract]);

  // Execute a transaction
  const handleExecute = async (txHash) => {
    if (!timelockContract || !isExecutor) return;
    
    try {
      setExecuting(true);
      setCurrentTxHash(txHash);
      
      const timelockWithSigner = getContract('timelock', true);
      const tx = await timelockWithSigner.executeTransaction(txHash);
      
      await addPendingTransaction(tx, "Execute timelock transaction");
      
      notifySuccess("Transaction executed successfully");
      
      // Update the local state to reflect the execution
      setTransactions(prevTxs => 
        prevTxs.map(tx => 
          tx.txHash === txHash 
            ? { ...tx, executed: true, status: 'executed' } 
            : tx
        )
      );
    } catch (error) {
      console.error("Error executing transaction:", error);
      notifyError(`Execution failed: ${error.message}`);
    } finally {
      setExecuting(false);
      setCurrentTxHash(null);
    }
  };

  // Cancel a transaction
  const handleCancel = async (txHash) => {
    if (!timelockContract || (!isAdmin && !isGuardian)) return;
    
    try {
      setCanceling(true);
      setCurrentTxHash(txHash);
      
      const timelockWithSigner = getContract('timelock', true);
      const tx = await timelockWithSigner.cancelTransaction(txHash);
      
      await addPendingTransaction(tx, "Cancel timelock transaction");
      
      notifySuccess("Transaction canceled successfully");
      
      // Remove the canceled transaction from the list
      setTransactions(prevTxs => prevTxs.filter(tx => tx.txHash !== txHash));
    } catch (error) {
      console.error("Error canceling transaction:", error);
      notifyError(`Cancellation failed: ${error.message}`);
    } finally {
      setCanceling(false);
      setCurrentTxHash(null);
    }
  };

  // Format the remaining time for display
  const formatRemainingTime = (seconds) => {
    if (seconds <= 0) return "Ready to execute";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  // Format a timestamp for display
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Truncate a hex string for display
  const truncateHex = (hex, start = 6, end = 4) => {
    if (!hex || hex.length <= start + end) return hex;
    return `${hex.substring(0, start)}...${hex.substring(hex.length - end)}`;
  };

  return (
    <DashboardCard
      title="Timelock Transactions"
      icon={<ClockIcon size={24} />}
      loading={loading}
    >
      {loading ? (
        <LoadingState text="Loading transactions..." />
      ) : executing || canceling ? (
        <TransactionPending text={`${executing ? 'Executing' : 'Canceling'} transaction...`} />
      ) : transactions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threat Level
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.txHash} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 font-mono">
                      {truncateHex(tx.target)}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      ID: {truncateHex(tx.txHash)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {tx.status === 'pending' ? formatRemainingTime(tx.timeRemaining) : formatTimestamp(tx.eta)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tx.status === 'pending' ? `ETA: ${formatTimestamp(tx.eta)}` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ThreatLevelBadge level={tx.threatLevel} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {tx.status === 'ready' && isExecutor && (
                        <button
                          onClick={() => handleExecute(tx.txHash)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Execute
                        </button>
                      )}
                      {(tx.status === 'pending' || tx.status === 'ready') && (isAdmin || isGuardian) && (
                        <button
                          onClick={() => handleCancel(tx.txHash)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                      {tx.status === 'executed' && (
                        <a
                          href={getExplorerLink('tx', tx.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          View
                          <ArrowUpRightIcon size={14} className="ml-1" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
};

export default TimelockTransactionList;