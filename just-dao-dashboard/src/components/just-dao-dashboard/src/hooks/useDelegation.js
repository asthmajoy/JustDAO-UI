// useDelegation.js - Fixed implementation for delegation functionality

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export function useDelegation() {
  const { contracts, account, isConnected, contractsReady, refreshCounter } = useWeb3();
  const [delegationInfo, setDelegationInfo] = useState({
    currentDelegate: null,
    lockedTokens: "0",
    delegatedToYou: "0",
    delegators: [],
    isSelfDelegated: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDelegationInfo = useCallback(async () => {
    if (!isConnected || !contractsReady || !contracts.token || !account) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get current delegate
      const currentDelegate = await contracts.token.getDelegate(account);
      
      // Check if self-delegated
      const isSelfDelegated = currentDelegate === account || currentDelegate === ethers.constants.AddressZero;
      
      // Get locked tokens for delegation
      const lockedTokens = await contracts.token.getLockedTokens(account);
      
      // Get tokens delegated to the user (total voting power delegated to this account)
      const delegatedToUser = await contracts.token.getDelegatedToAddress(account);
      
      // Get list of addresses delegating to this user
      const delegatorAddresses = await contracts.token.getDelegatorsOf(account);
      
      // Get each delegator's balance
      const delegators = await Promise.all(
        delegatorAddresses.map(async (delegator) => {
          try {
            const balance = await contracts.token.balanceOf(delegator);
            return {
              address: delegator,
              balance: ethers.utils.formatEther(balance)
            };
          } catch (err) {
            console.warn(`Error getting balance for delegator ${delegator}:`, err);
            return {
              address: delegator,
              balance: "0"
            };
          }
        })
      );
      
      setDelegationInfo({
        currentDelegate,
        lockedTokens: ethers.utils.formatEther(lockedTokens),
        delegatedToYou: ethers.utils.formatEther(delegatedToUser),
        delegators,
        isSelfDelegated
      });
    } catch (err) {
      console.error("Error fetching delegation info:", err);
      setError("Failed to fetch delegation information: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [contracts, account, isConnected, contractsReady]);

  // Load delegation info on initial load and when dependencies change
  useEffect(() => {
    if (isConnected && contractsReady) {
      fetchDelegationInfo();
    }
  }, [fetchDelegationInfo, isConnected, contractsReady, refreshCounter]);

  // Delegate voting power to another address
  const delegate = async (delegateeAddress) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.token) throw new Error("Token contract not initialized");
    if (!ethers.utils.isAddress(delegateeAddress)) throw new Error("Invalid address format");
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Delegating from ${account} to ${delegateeAddress}`);
      
      // First check for potential delegation issues
      if (contracts.daoHelper) {
        try {
          const warningLevel = await contracts.daoHelper.checkDelegationDepthWarning(account, delegateeAddress);
          
          if (warningLevel === 3) {
            throw new Error("This delegation would exceed the maximum delegation depth limit or create a cycle");
          } else if (warningLevel === 2) {
            console.warn("This delegation will reach the maximum allowed delegation depth");
          } else if (warningLevel === 1) {
            console.warn("This delegation is getting close to the maximum depth limit");
          }
        } catch (depthErr) {
          // Only throw if this was an actual depth error, not a contract call error
          if (depthErr.message.includes("delegation")) {
            throw depthErr;
          } else {
            console.warn("Could not check delegation depth:", depthErr);
          }
        }
      }
      
      // Execute the delegation
      const tx = await contracts.token.delegate(delegateeAddress, {
        gasLimit: 300000 // Set a reasonable gas limit
      });
      
      await tx.wait();
      console.log("Delegation transaction confirmed");
      
      // Refresh delegation info
      await fetchDelegationInfo();
      
      return true;
    } catch (err) {
      console.error("Error delegating:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset delegation (self-delegate)
  const resetDelegation = async () => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.token) throw new Error("Token contract not initialized");
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Resetting delegation to self");
      
      // Call the resetDelegation method to self-delegate
      const tx = await contracts.token.resetDelegation({
        gasLimit: 200000
      });
      
      await tx.wait();
      console.log("Reset delegation transaction confirmed");
      
      // Refresh delegation info
      await fetchDelegationInfo();
      
      return true;
    } catch (err) {
      console.error("Error resetting delegation:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get delegation depth warning info
  const getDelegationDepthWarning = async (delegator, delegatee) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    
    try {
      // Try to use DAO helper if available
      if (contracts.daoHelper) {
        try {
          const warningLevel = await contracts.daoHelper.checkDelegationDepthWarning(delegator, delegatee);
          return {
            warningLevel: Number(warningLevel),
            message: getWarningMessage(Number(warningLevel))
          };
        } catch (helperErr) {
          console.warn("Error using DAO helper for delegation depth check:", helperErr);
        }
      }
      
      // Fallback: Try to calculate delegation depth ourselves
      let depth = 0;
      let currentDelegate = delegatee;
      const visited = new Set();
      
      // Check if this would create a cycle
      if (currentDelegate === delegator) {
        return { warningLevel: 0, message: "Self-delegation has no depth issues" };
      }
      
      // Check the delegation chain depth
      while (currentDelegate && currentDelegate !== ethers.constants.AddressZero) {
        if (visited.has(currentDelegate)) {
          return { warningLevel: 3, message: "This delegation would create a cycle" };
        }
        
        visited.add(currentDelegate);
        depth++;
        
        if (depth >= 8) { // Max depth is 8 in the contract
          return { warningLevel: 3, message: "This delegation would exceed the maximum delegation depth limit" };
        }
        
        // Get the next delegate in the chain
        try {
          currentDelegate = await contracts.token.getDelegate(currentDelegate);
          
          // If the delegate is delegating to themself or not delegating, stop
          if (currentDelegate === ethers.constants.AddressZero || visited.has(currentDelegate)) {
            break;
          }
        } catch (err) {
          break;
        }
      }
      
      // Determine warning level based on depth
      let warningLevel = 0;
      if (depth >= 6) {
        warningLevel = 2;
      } else if (depth >= 4) {
        warningLevel = 1;
      }
      
      return {
        warningLevel,
        message: getWarningMessage(warningLevel)
      };
    } catch (err) {
      console.error("Error checking delegation depth:", err);
      throw err;
    }
  };

  // Get delegation warning message
  function getWarningMessage(warningLevel) {
    switch (Number(warningLevel)) {
      case 0:
        return "No delegation depth issues";
      case 1:
        return "This delegation is getting close to the maximum delegation depth limit";
      case 2:
        return "This delegation will reach the maximum delegation depth limit";
      case 3:
        return "This delegation would exceed the maximum delegation depth limit or create a cycle";
      default:
        return "Unknown delegation depth warning";
    }
  }

  return {
    delegationInfo,
    loading,
    error,
    delegate,
    resetDelegation,
    fetchDelegationInfo,
    getDelegationDepthWarning
  };
}