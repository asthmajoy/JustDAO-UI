// useDAOStats.js - Improved implementation for accurate DAO statistics

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export function useDAOStats() {
  const { contracts, contractsReady, refreshCounter, isConnected, account } = useWeb3();
  const [dashboardStats, setDashboardStats] = useState({
    totalHolders: 0,
    circulatingSupply: "0",
    activeProposals: 0,
    totalProposals: 0,
    participationRate: 0,
    delegationRate: 0,
    proposalSuccessRate: 0,
    isLoading: true,
    errorMessage: null
  });

  const loadDashboardData = useCallback(async () => {
    if (!isConnected || !contractsReady || !contracts.token || !contracts.governance) {
      return;
    }

    try {
      setDashboardStats(prev => ({ ...prev, isLoading: true, errorMessage: null }));
      console.log("Loading dashboard data...");

      // Get values in parallel for better performance
      const [tokenHolders, supplyData, proposalStats, governanceMetrics] = await Promise.all([
        fetchTokenHolders(),
        fetchSupplyData(),
        fetchProposalStats(),
        fetchGovernanceMetrics()
      ]);

      setDashboardStats({
        totalHolders: tokenHolders,
        ...supplyData,
        ...proposalStats,
        ...governanceMetrics,
        isLoading: false,
        errorMessage: null
      });
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setDashboardStats(prev => ({
        ...prev,
        isLoading: false,
        errorMessage: "Failed to load dashboard data: " + error.message
      }));
    }
  }, [contracts, contractsReady, isConnected]);

  // Fetch token holder count using analytics helper or transfer events
  const fetchTokenHolders = async () => {
    if (contracts.analyticsHelper) {
      try {
        const tokenAnalytics = await contracts.analyticsHelper.getTokenDistributionAnalytics();
        
        if (tokenAnalytics) {
          const smallHolders = tokenAnalytics.smallHolderCount.toNumber();
          const mediumHolders = tokenAnalytics.mediumHolderCount.toNumber();
          const largeHolders = tokenAnalytics.largeHolderCount.toNumber();
          
          const total = smallHolders + mediumHolders + largeHolders;
          if (total > 0) {
            return total;
          }
        }
      } catch (error) {
        console.warn("Error getting token holder analytics:", error);
      }
    }

    // Fallback: Get unique addresses from Transfer events
    try {
      const filter = contracts.token.filters.Transfer();
      // Get the events from the last 10000 blocks (or adjust as needed)
      const blockNumber = await contracts.token.provider.getBlockNumber();
      const fromBlock = Math.max(blockNumber - 10000, 0);
      
      const events = await contracts.token.queryFilter(filter, fromBlock);
      const uniqueAddresses = new Set();
      
      events.forEach(event => {
        if (event.args) {
          if (event.args.from !== ethers.constants.AddressZero) {
            uniqueAddresses.add(event.args.from.toLowerCase());
          }
          if (event.args.to !== ethers.constants.AddressZero) {
            uniqueAddresses.add(event.args.to.toLowerCase());
          }
        }
      });
      
      return uniqueAddresses.size;
    } catch (error) {
      console.warn("Error fetching Transfer events:", error);
      
      // Last resort: Try to get a rough estimate from all delegates
      try {
        // Get all delegate addresses from any event
        const events = await contracts.token.queryFilter('*');
        const uniqueAddresses = new Set();
        
        events.forEach(event => {
          if (event.args) {
            Object.values(event.args).forEach(arg => {
              if (typeof arg === 'string' && ethers.utils.isAddress(arg) && 
                  arg !== ethers.constants.AddressZero) {
                uniqueAddresses.add(arg.toLowerCase());
              }
            });
          }
        });
        
        return Math.max(uniqueAddresses.size, 1);
      } catch (error) {
        console.warn("Error getting estimate from events:", error);
        return 1; // Return at least 1 if we can't determine
      }
    }
  };

  // Fetch supply data including total and circulating supply
  const fetchSupplyData = async () => {
    try {
      // Get total supply
      const totalSupply = await contracts.token.totalSupply();
      
      // Try to get treasury balance
      let treasuryBalance = ethers.BigNumber.from(0);
      
      if (contracts.analyticsHelper) {
        try {
          const tokenAnalytics = await contracts.analyticsHelper.getTokenDistributionAnalytics();
          if (tokenAnalytics && tokenAnalytics.treasuryBalance) {
            treasuryBalance = tokenAnalytics.treasuryBalance;
          }
        } catch (error) {
          console.warn("Error getting treasury balance:", error);
          // Try to get balance of governance contract as fallback
          treasuryBalance = await contracts.token.balanceOf(contracts.governance.address);
        }
      } else {
        // Try to get balance of governance contract directly
        treasuryBalance = await contracts.token.balanceOf(contracts.governance.address);
      }
      
      // Calculate circulating supply
      const circulatingSupplyBN = totalSupply.sub(treasuryBalance);
      
      return {
        circulatingSupply: ethers.utils.formatEther(circulatingSupplyBN),
        totalTokenSupply: ethers.utils.formatEther(totalSupply)
      };
    } catch (error) {
      console.warn("Error fetching supply data:", error);
      return {
        circulatingSupply: "0",
        totalTokenSupply: "0"
      };
    }
  };

  // Get active and total proposal count
  const fetchProposalStats = async () => {
    try {
      let activeProposals = 0;
      let totalProposals = 0;
      
      // Find the latest proposal ID
      let latestId = 0;
      let step = 10;
      
      // First, find an upper bound
      while (true) {
        try {
          await contracts.governance.getProposalState(latestId + step);
          latestId += step;
        } catch (error) {
          break;
        }
      }
      
      // Binary search to find the exact latest ID
      let left = latestId;
      let right = latestId + step;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        try {
          await contracts.governance.getProposalState(mid);
          left = mid + 1;
        } catch (error) {
          right = mid - 1;
        }
      }
      
      latestId = right;
      totalProposals = latestId + 1;
      
      // Count active proposals
      for (let i = 0; i <= latestId; i++) {
        try {
          const state = await contracts.governance.getProposalState(i);
          if (state === 0) { // 0 = Active
            activeProposals++;
          }
        } catch (error) {
          // Skip if proposal doesn't exist or error
        }
      }
      
      return { activeProposals, totalProposals };
    } catch (error) {
      console.warn("Error fetching proposal stats:", error);
      return { activeProposals: 0, totalProposals: 0 };
    }
  };

  // Fetch governance metrics including participation and delegation rates
  const fetchGovernanceMetrics = async () => {
    try {
      let participationRate = 0;
      let delegationRate = 0;
      let proposalSuccessRate = 0;
      
      // Try to get these metrics from the analytics helper
      if (contracts.analyticsHelper) {
        try {
          // Get proposal analytics
          const proposals = await contracts.analyticsHelper.getProposalAnalytics(0, 100);
          if (proposals) {
            participationRate = proposals.avgVotingTurnout.toNumber() / 100; // Convert basis points to percentage
            
            // Calculate success rate from executed vs total completed proposals
            const total = proposals.succeededProposals.toNumber() + 
                          proposals.defeatedProposals.toNumber() + 
                          proposals.executedProposals.toNumber() + 
                          proposals.expiredProposals.toNumber();
                          
            if (total > 0) {
              proposalSuccessRate = (proposals.executedProposals.toNumber() / total) * 100;
            }
          }
          
          // Get token analytics for delegation rate
          const tokenAnalytics = await contracts.analyticsHelper.getTokenDistributionAnalytics();
          if (tokenAnalytics) {
            delegationRate = tokenAnalytics.percentageDelegated.toNumber() / 100; // Convert basis points to percentage
          }
          
          return { 
            participationRate, 
            delegationRate, 
            proposalSuccessRate 
          };
        } catch (error) {
          console.warn("Error getting analytics from helper:", error);
        }
      }
      
      // Fallback to snapshot metrics if analytics helper fails
      try {
        const snapshotId = await contracts.token.getCurrentSnapshotId();
        const metrics = await contracts.token.getSnapshotMetrics(snapshotId);
        
        if (metrics && metrics.totalSupply.gt(0) && metrics.totalDelegatedTokens.gt(0)) {
          delegationRate = metrics.percentageDelegated.toNumber() / 100;
        }
      } catch (error) {
        console.warn("Error getting snapshot metrics:", error);
      }
      
      // Calculate a rough success rate from past proposals
      try {
        let succeeded = 0;
        let total = 0;
        
        // Find the latest proposal ID (simplified approach)
        let latestId = 0;
        while (latestId < 1000) {
          try {
            await contracts.governance.getProposalState(latestId);
            latestId++;
          } catch (error) {
            break;
          }
        }
        
        // Sample some recent proposals
        const sampleSize = Math.min(latestId, 10);
        for (let i = Math.max(0, latestId - sampleSize); i < latestId; i++) {
          try {
            const state = await contracts.governance.getProposalState(i);
            if (state === 3 || state === 4 || state === 5) { // Succeeded, Queued, or Executed
              succeeded++;
            }
            total++;
          } catch (error) {
            // Skip if error
          }
        }
        
        if (total > 0) {
          proposalSuccessRate = (succeeded / total) * 100;
        }
      } catch (error) {
        console.warn("Error calculating success rate:", error);
      }
      
      return { 
        participationRate: participationRate || 0, 
        delegationRate: delegationRate || 0, 
        proposalSuccessRate: proposalSuccessRate || 0 
      };
    } catch (error) {
      console.warn("Error fetching governance metrics:", error);
      return { 
        participationRate: 0, 
        delegationRate: 0, 
        proposalSuccessRate: 0 
      };
    }
  };

  // Load dashboard data when dependencies change
  useEffect(() => {
    if (isConnected && contractsReady) {
      loadDashboardData();
    }
  }, [loadDashboardData, contractsReady, isConnected, refreshCounter, account]);

  return { 
    ...dashboardStats, 
    reload: loadDashboardData 
  };
}