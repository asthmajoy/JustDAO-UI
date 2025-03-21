// src/components/dashboard/RecentActivityList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import { 
  ClockIcon, 
  VoteIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  AlertTriangleIcon
} from 'lucide-react';

import { ContractsContext } from '../../context/ContractsContext';
import { WalletContext } from '../../context/WalletContext';
import { NotificationContext } from '../../context/NotificationContext';

import DashboardCard from '../common/DashboardCard';
import { LoadingState } from '../common/LoadingSpinner';
import { ProposalStateBadge } from '../common/StatusBadge';

const RecentActivityList = () => {
  const { governanceContract } = useContext(ContractsContext);
  const { account } = useContext(WalletContext);
  const { getExplorerLink } = useContext(NotificationContext);
  
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!governanceContract) return;
      
      try {
        setLoading(true);
        
        const recentActivities = [];
        let maxProposalId = 0;
        
        // First find the latest proposal ID by trying increasingly higher IDs
        for (let i = 100; i >= 0; i--) {
          try {
            await governanceContract.getProposalState(i);
            maxProposalId = i;
            break;
          } catch (error) {
            // This proposal ID doesn't exist, continue searching
            continue;
          }
        }
        
        // Fetch the most recent 5 proposals
        const startId = Math.max(0, maxProposalId - 4);
        for (let i = maxProposalId; i >= startId; i--) {
          try {
            const state = await governanceContract.getProposalState(i);
            const proposalData = await governanceContract._proposals(i);
            
            // Format the relevant data for display
            const activity = {
              id: i,
              type: "proposal",
              state: Number(state),
              description: proposalData.description,
              proposer: proposalData.proposer,
              timestamp: Number(proposalData.createdAt) * 1000, // Convert to milliseconds
              isUserInvolved: proposalData.proposer === account
            };
            
            recentActivities.push(activity);
          } catch (error) {
            console.error(`Error fetching proposal ${i}:`, error);
            continue;
          }
        }
        
        // Sort activities by timestamp (most recent first)
        recentActivities.sort((a, b) => b.timestamp - a.timestamp);
        
        setActivities(recentActivities);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        setError("Failed to load recent activity. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentActivity();
  }, [governanceContract, account]);

  // Format a timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get time elapsed since a timestamp
  const getTimeElapsed = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to appropriate time unit
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  return (
    <DashboardCard
      title="Recent Activity"
      icon={<ClockIcon size={24} />}
      loading={loading}
      error={error}
    >
      {loading ? (
        <LoadingState text="Loading recent activity..." />
      ) : activities.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No recent activity found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <div 
              key={`${activity.type}-${activity.id}`} 
              className={`py-3 ${activity.isUserInvolved ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <VoteIcon size={16} className="text-indigo-500" />
                  </div>
                  <div>
                    <Link 
                      to={`/governance/proposal/${activity.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {activity.description.length > 50 
                        ? `${activity.description.substring(0, 50)}...` 
                        : activity.description}
                    </Link>
                    <div className="mt-1 flex items-center space-x-2">
                      <ProposalStateBadge state={activity.state} />
                      <span className="text-xs text-gray-500">Proposal #{activity.id}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">Proposer:</span> {activity.proposer.slice(0, 6)}...{activity.proposer.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {getTimeElapsed(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4">
        <Link 
          to="/governance" 
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
        >
          View all activity
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </DashboardCard>
  );
};

export default RecentActivityList;