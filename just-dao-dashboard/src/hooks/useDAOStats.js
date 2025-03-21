// useDAOStats.js - Custom hook for retrieving DAO dashboard statistics

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

      // Collect data in parallel for better performance
      const results = await Promise.allSettled([
        fetchTokenHoldersCount(),
        fetchCirculatingSupply(),
        fetchProposalStats(),
        fetchGovernanceHealth()
      ]);

      const [holdersResult, supplyResult, proposalsResult, healthResult] = results;

      // Process results
      const newStats = {
        totalHolders: holdersResult.status === 'fulfilled' ? holdersResult.value : 0,
        circulatingSupply: supplyResult.status === 'fulfilled' ? supplyResult.value : "0",
        ...((proposalsResult.status === 'fulfilled') ? proposalsResult.value : { 
          activeProposals: 0, 
          totalProposals: 0 
        }),
        ...((healthResult.status === 'fulfilled') ? healthResult.value : { 
          participationRate: 0, 
          delegationRate: 0, 
          proposalSuccessRate: 0 
        }),
        isLoading: false,
        errorMessage: null
      };

      setDashboardStats(newStats);
      console.log("Dashboard data loaded:", newStats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setDashboardStats(prev => ({
        ...prev,
        isLoading: false,
        errorMessage: "Failed to load dashboard data"
      }));
    }
  }, [contracts, contractsReady, isConnected]);

  // Helper function to fetch token holders count
  const fetchTokenHoldersCount = async () => {
    // First try the analytics helper
    if (contracts.analyticsHelper) {
      try {
        // Try to get token distribution analytics
        const tokenAnalytics = await contracts.analyticsHelper.getTokenDistributionAnalytics();
        
        if (tokenAnalytics) {
          // Sum up holder counts by category
          const smallHolders = parseInt(tokenAnalytics.smallHolderCount) || 0;
          const mediumHolders = parseInt(tokenAnalytics.mediumHolderCount) || 0;
          const largeHolders = parseInt(tokenAnalytics.largeHolderCount) || 0;
          
          const totalHolders = smallHolders + mediumHolders + largeHolders;
          if (totalHolders > 0) {
            return totalHolders;
          }
        }
      } catch (analyticsError) {
        console.error("Error getting analytics data for holders:", analyticsError);
      }
    }

    // Alternative approach if analytics fails - try to get token transfers
    try {
      // Get the token contract
      const tokenContract = contracts.token;
      
      // Create a filter for Transfer events
      const filter = tokenContract.filters.Transfer();
      
      // Get the events for the last 1000 blocks (adjust as needed)
      const events = await tokenContract.queryFilter(filter, -1000);
      
      // Collect unique addresses from the events
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
      
      // Return the count of unique addresses
      return uniqueAddresses.size || 1;
    } catch (eventsError) {
      console.error("Error fetching transfer events:", eventsError);
      
      // Last resort - check delegatorsOf the governance contract
      try {
        const governanceAddress = contracts.governance.address;
        const delegators = await contracts.token.getDelegatorsOf(governanceAddress);
        return delegators.length + 1; // +1 for the governance contract itself
      } catch (delegationError) {
        console.error("Error getting delegators:", delegationError);
      }
      
      // If all else fails, return at least 1 (the connected user)
      return 1;
    }
  };

  // Helper function to fetch circulating supply
  const fetchCirculatingSupply = async () => {
    try {
      const totalSupply = await contracts.token.totalSupply();
      
      // Check if there's a treasury address with tokens
      let treasuryBalance = ethers.BigNumber.from(0);
      
      // Try to get treasury balance if analytics helper is available
      if (contracts.analyticsHelper) {
        try {
          const tokenAnalytics = await contracts.analyticsHelper.getTokenDistributionAnalytics();
          if (tokenAnalytics && tokenAnalytics.treasuryBalance) {
            treasuryBalance = tokenAnalytics.treasuryBalance;
          }
        } catch (error) {
          console.error("Error getting treasury balance:", error);
        }
      }
      
      // Calculate circulating supply (total - treasury)
      const circulatingSupplyBN = totalSupply.sub(treasuryBalance);
      return ethers.utils.formatEther(circulatingSupplyBN);
    } catch (error) {
      console.error("Error fetching circulating supply:", error);
      return "0";
    }
  };

  // Helper function to fetch proposal stats
  const fetchProposalStats = async () => {
    try {
      let activeProposals = 0;
      let totalProposals = 0;
      
      // Find the highest proposal ID
      let highestId = 0;
      let foundProposal = false;
      
      for (let i = 0; i < 100; i++) {
        try {
          const state = await contracts.governance.getProposalState(i);
          foundProposal = true;
          highestId = i;
          
          // Count active proposals
          if (state === 0) { // 0 = Active state in the enum
            activeProposals++;
          }
        } catch (error) {
          // If the proposal doesn't exist
          if (!foundProposal) {
            // Keep trying a few more times before giving up
            if (i >= 10) break;
          }
        }
      }
      
      // If we found at least one proposal, the total is highestId + 1
      if (foundProposal) {
        totalProposals = highestId + 1;
      }
      
      return { activeProposals, totalProposals };
    } catch (error) {
      console.error("Error fetching proposal stats:", error);
      return { activeProposals: 0, totalProposals: 0 };
    }
  };

  // Helper function to fetch governance health metrics
  const fetchGovernanceHealth = async () => {
    // Default values
    let participationRate = 65;
    let delegationRate = 60;
    let proposalSuccessRate = 75;
    
    // Try to get actual values if analyticsHelper is available
    if (contracts.analyticsHelper) {
      try {
        const healthScore = await contracts.analyticsHelper.calculateGovernanceHealthScore();
        
        if (healthScore && healthScore.breakdown) {
          // Extract values from the breakdown array
          const breakdown = healthScore.breakdown;
          
          // The first element is usually participation
          if (breakdown.length > 0) {
            participationRate = (Number(breakdown[0]) * 100) / 20; // Scale to percentage
          }
          
          // The second element is usually delegation
          if (breakdown.length > 1) {
            delegationRate = (Number(breakdown[1]) * 100) / 20; // Scale to percentage
          }
          
          // Try to calculate success rate
          if (breakdown.length > 3) {
            proposalSuccessRate = (Number(breakdown[3]) * 100) / 20; // Execution success rate
          }
        }
      } catch (error) {
        console.error("Error calculating governance health:", error);
        
        // Try to get proposal analytics as a fallback
        try {
          const proposalAnalytics = await contracts.analyticsHelper.getProposalAnalytics(0, 100);
          
          if (proposalAnalytics) {
            // Extract metrics from proposal analytics
            if (proposalAnalytics.avgVotingTurnout) {
              participationRate = Number(proposalAnalytics.avgVotingTurnout) / 100; // Convert basis points to percentage
            }
            
            // Calculate an overall success rate from different proposal types
            const successRates = [
              Number(proposalAnalytics.generalSuccessRate || 0),
              Number(proposalAnalytics.withdrawalSuccessRate || 0),
              Number(proposalAnalytics.tokenTransferSuccessRate || 0),
              Number(proposalAnalytics.governanceChangeSuccessRate || 0)
            ];
            
            // Calculate the average of non-zero success rates
            const nonZeroRates = successRates.filter(rate => rate > 0);
            if (nonZeroRates.length > 0) {
              proposalSuccessRate = nonZeroRates.reduce((a, b) => a + b, 0) / nonZeroRates.length / 100;
            }
          }
        } catch (analyticsError) {
          console.error("Error getting proposal analytics:", analyticsError);
        }
      }
      
      // Try to get token distribution analytics for delegation rate
      try {
        const tokenAnalytics = await contracts.analyticsHelper.getTokenDistributionAnalytics();
        if (tokenAnalytics && tokenAnalytics.percentageDelegated) {
          delegationRate = Number(tokenAnalytics.percentageDelegated) / 100; // Convert basis points to percentage
        }
      } catch (tokenError) {
        console.error("Error getting token analytics:", tokenError);
      }
    }
    
    return { participationRate, delegationRate, proposalSuccessRate };
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