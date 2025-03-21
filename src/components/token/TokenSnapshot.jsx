// src/components/token/TokenSnapshot.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { RoleContext } from '../../context/RoleContext';
import { NotificationContext } from '../../context/NotificationContext';
import { LoadingState, TransactionPending } from '../common/LoadingSpinner';
import DashboardCard from '../common/DashboardCard';
import { CameraIcon, ClockIcon, UsersIcon, TrendingUpIcon, PercentIcon } from 'lucide-react';

const TokenSnapshot = () => {
  const { account } = useContext(WalletContext);
  const { tokenContract, getContract } = useContext(ContractsContext);
  const { isGovernance } = useContext(RoleContext);
  const { addPendingTransaction, notifySuccess, notifyError } = useContext(NotificationContext);
  
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [currentSnapshotId, setCurrentSnapshotId] = useState(null);
  const [recentSnapshots, setRecentSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [snapshotDetails, setSnapshotDetails] = useState(null);
  const [votingPower, setVotingPower] = useState(null);

  // Fetch current snapshot ID and recent snapshots
  useEffect(() => {
    const fetchSnapshotData = async () => {
      if (!tokenContract) return;
      
      try {
        setLoading(true);
        
        // Get current snapshot ID
        const snapshotId = await tokenContract.getCurrentSnapshotId();
        setCurrentSnapshotId(Number(snapshotId));
        
        // Fetch details for the 5 most recent snapshots
        const recent = [];
        const maxSnapshots = 5;
        for (let i = Number(snapshotId); i > Math.max(0, Number(snapshotId) - maxSnapshots); i--) {
          try {
            const timestamp = await tokenContract.getSnapshotTimestamp(i);
            if (timestamp > 0) {
              recent.push({
                id: i,
                timestamp: Number(timestamp) * 1000, // Convert to milliseconds
                date: new Date(Number(timestamp) * 1000).toLocaleString()
              });
            }
          } catch (error) {
            console.log(`No data for snapshot ${i}`);
          }
        }
        
        setRecentSnapshots(recent);
        
        // If we have snapshots, select the most recent one
        if (recent.length > 0) {
          setSelectedSnapshot(recent[0].id);
        }
      } catch (error) {
        console.error("Error fetching snapshot data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSnapshotData();
  }, [tokenContract]);

  // Fetch details for selected snapshot
  useEffect(() => {
    const fetchSnapshotDetails = async () => {
      if (!tokenContract || !selectedSnapshot) return;
      
      try {
        const [
          totalSupply,
          activeHolders,
          activeDelegates,
          totalDelegatedTokens,
          percentageDelegated,
          topDelegate,
          topDelegateTokens
        ] = await tokenContract.getSnapshotMetrics(selectedSnapshot);
        
        setSnapshotDetails({
          totalSupply: ethers.formatEther(totalSupply),
          activeHolders: Number(activeHolders),
          activeDelegates: Number(activeDelegates),
          totalDelegatedTokens: ethers.formatEther(totalDelegatedTokens),
          percentageDelegated: Number(percentageDelegated) / 100, // Convert basis points to percentage
          topDelegate,
          topDelegateTokens: ethers.formatEther(topDelegateTokens)
        });
        
        // If user is connected, get their voting power at this snapshot
        if (account) {
          const power = await tokenContract.getEffectiveVotingPower(account, selectedSnapshot);
          setVotingPower(ethers.formatEther(power));
        }
      } catch (error) {
        console.error("Error fetching snapshot details:", error);
        setSnapshotDetails(null);
      }
    };
    
    fetchSnapshotDetails();
  }, [tokenContract, selectedSnapshot, account]);

  // Create a new snapshot
  const handleCreateSnapshot = async () => {
    if (!tokenContract || !isGovernance) return;
    
    try {
      setPending(true);
      const tokenContractWithSigner = getContract('token', true);
      
      // Create the snapshot
      const tx = await tokenContractWithSigner.createSnapshot();
      
      // Track the transaction
      await addPendingTransaction(tx, "Create token snapshot");
      
      // Show success message
      notifySuccess("Successfully created a new token snapshot");
      
      // Refresh data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error creating snapshot:", error);
      notifyError(`Failed to create snapshot: ${error.message}`);
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading token snapshots..." />;
  }

  if (pending) {
    return <TransactionPending text="Creating snapshot..." />;
  }

  return (
    <div className="space-y-6">
      {/* Snapshot Controls */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Token Snapshots</h2>
            <p className="text-sm text-gray-500 mt-1">
              Current Snapshot ID: {currentSnapshotId}
            </p>
          </div>
          
          {isGovernance && (
            <button
              onClick={handleCreateSnapshot}
              disabled={pending}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CameraIcon size={16} className="mr-2" />
              Create New Snapshot
            </button>
          )}
        </div>
        
        {/* Snapshot Selector */}
        {recentSnapshots.length > 0 && (
          <div className="mt-6">
            <label htmlFor="snapshotSelector" className="block text-sm font-medium text-gray-700">
              Select Snapshot
            </label>
            <select
              id="snapshotSelector"
              value={selectedSnapshot || ""}
              onChange={(e) => setSelectedSnapshot(Number(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {recentSnapshots.map((snapshot) => (
                <option key={snapshot.id} value={snapshot.id}>
                  Snapshot #{snapshot.id} - {snapshot.date}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Snapshot Details */}
      {selectedSnapshot && snapshotDetails && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Supply */}
          <DashboardCard
            title="Total Supply"
            icon={<TrendingUpIcon size={20} />}
            value={`${parseFloat(snapshotDetails.totalSupply).toLocaleString()} JUST`}
          />
          
          {/* Active Holders */}
          <DashboardCard
            title="Active Holders"
            icon={<UsersIcon size={20} />}
            value={snapshotDetails.activeHolders.toLocaleString()}
          />
          
          {/* Delegation Stats */}
          <DashboardCard
            title="Token Delegation"
            icon={<PercentIcon size={20} />}
            value={`${snapshotDetails.percentageDelegated.toFixed(2)}%`}
            description={`${parseFloat(snapshotDetails.totalDelegatedTokens).toLocaleString()} JUST tokens delegated`}
          />
          
          {/* Top Delegate */}
          <DashboardCard
            title="Top Delegate"
            icon={<UsersIcon size={20} />}
            value={snapshotDetails.topDelegate ? 
              `${snapshotDetails.topDelegate.slice(0, 6)}...${snapshotDetails.topDelegate.slice(-4)}` : 
              "None"
            }
            description={snapshotDetails.topDelegate ? 
              `Controls ${parseFloat(snapshotDetails.topDelegateTokens).toLocaleString()} JUST tokens` : 
              ""
            }
          />
          
          {/* Active Delegates */}
          <DashboardCard
            title="Active Delegates"
            icon={<UsersIcon size={20} />}
            value={snapshotDetails.activeDelegates.toLocaleString()}
          />
          
          {/* Snapshot Date */}
          <DashboardCard
            title="Snapshot Time"
            icon={<ClockIcon size={20} />}
            value={recentSnapshots.find(s => s.id === selectedSnapshot)?.date || "Unknown"}
          />
        </div>
      )}
      
      {/* Your Voting Power */}
      {account && votingPower !== null && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Voting Power</h2>
          <div className="p-4 bg-indigo-50 rounded-md">
            <p className="text-sm text-gray-700">
              At snapshot #{selectedSnapshot}, your effective voting power was:
            </p>
            <p className="text-2xl font-bold text-indigo-700 mt-2">
              {parseFloat(votingPower).toLocaleString()} JUST
            </p>
            <p className="text-sm text-gray-500 mt-1">
              This includes your tokens and any tokens delegated to you at the time of the snapshot.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSnapshot;