import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export function useDelegation() {
  const { contracts, account, isConnected, contractsReady } = useWeb3();
  const [delegationInfo, setDelegationInfo] = useState({
    currentDelegate: null,
    lockedTokens: "0",
    delegatedToYou: "0",
    delegators: []
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
      
      // Get locked tokens (tokens delegated by the user)
      const lockedTokens = await contracts.token.getLockedTokens(account);
      
      // Get tokens delegated to the user
      const delegatedToUser = await contracts.token.getDelegatedToAddress(account);
      
      // Get delegators (addresses delegating to the user)
      const delegatorAddresses = await contracts.token.getDelegatorsOf(account);
      
      // Get delegator balances
      const delegators = await Promise.all(
        delegatorAddresses.map(async (delegator) => {
          const balance = await contracts.token.balanceOf(delegator);
          return {
            address: delegator,
            balance: ethers.utils.formatEther(balance)
          };
        })
      );
      
      setDelegationInfo({
        currentDelegate,
        lockedTokens: ethers.utils.formatEther(lockedTokens),
        delegatedToYou: ethers.utils.formatEther(delegatedToUser),
        delegators
      });
    } catch (err) {
      console.error("Error fetching delegation info:", err);
      setError("Failed to fetch delegation information");
    } finally {
      setLoading(false);
    }
  }, [contracts, account, isConnected, contractsReady]);

  useEffect(() => {
    fetchDelegationInfo();
  }, [fetchDelegationInfo]);

  const delegate = async (delegateeAddress) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.token) throw new Error("Token contract not initialized");
    if (!ethers.utils.isAddress(delegateeAddress)) throw new Error("Invalid address");
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await contracts.token.delegate(delegateeAddress);
      await tx.wait();
      
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

  const resetDelegation = async () => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.token) throw new Error("Token contract not initialized");
    
    try {
      setLoading(true);
      setError(null);
      
      const tx = await contracts.token.resetDelegation();
      await tx.wait();
      
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

  const getDelegationDepthWarning = async (delegator, delegatee) => {
    if (!isConnected || !contractsReady) throw new Error("Not connected");
    if (!contracts.daoHelper) throw new Error("DAO helper contract not initialized");
    
    try {
      const warningLevel = await contracts.daoHelper.checkDelegationDepthWarning(delegator, delegatee);
      return {
        warningLevel,
        message: getWarningMessage(warningLevel)
      };
    } catch (err) {
      console.error("Error checking delegation depth:", err);
      throw err;
    }
  };

  function getWarningMessage(warningLevel) {
    switch (warningLevel) {
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