// src/components/token/TokenBalance.jsx
import React, { useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { NotificationContext } from '../../context/NotificationContext';
import DashboardCard from '../common/DashboardCard';
import { LoadingState } from '../common/LoadingSpinner';
import { CoinsIcon, LockIcon, AlertCircleIcon } from 'lucide-react';

const TokenBalance = () => {
  const { account } = useContext(WalletContext);
  const { tokenContract } = useContext(ContractsContext);
  const { notifyError } = useContext(NotificationContext);
  
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState({
    total: ethers.parseEther("0"),
    locked: ethers.parseEther("0"),
    unlocked: ethers.parseEther("0"),
    delegatedTo: ethers.parseEther("0"),
    receivedDelegations: ethers.parseEther("0")
  });
  const [delegateAddress, setDelegateAddress] = useState(null);
  const [delegators, setDelegators] = useState([]);

  // Fetch token balances and delegation info
  useEffect(() => {
    const fetchBalances = async () => {
      if (!account || !tokenContract) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get total balance
        const totalBalance = await tokenContract.balanceOf(account);
        
        // Get locked tokens (tokens used for delegation)
        const lockedTokens = await tokenContract.getLockedTokens(account);
        
        // Get delegation info
        const delegate = await tokenContract.getDelegate(account);
        
        // Get delegated power
        const delegatedToAddress = delegate !== account ? 
          await tokenContract.getCurrentDelegatedVotes(delegate) : 
          ethers.parseEther("0");
        
        // Get received delegations
        const receivedDelegations = await tokenContract.getCurrentDelegatedVotes(account);
        
        // Get delegators list
        const delegatorsList = await tokenContract.getDelegatorsOf(account);
        
        // Calculate unlocked tokens
        const unlockedTokens = totalBalance - lockedTokens;
        
        setBalances({
          total: totalBalance,
          locked: lockedTokens,
          unlocked: unlockedTokens,
          delegatedTo: delegatedToAddress,
          receivedDelegations
        });
        
        setDelegateAddress(delegate);
        setDelegators(delegatorsList);
      } catch (error) {
        console.error("Error fetching token balances:", error);
        notifyError("Failed to fetch token balances");
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
    
    // Set up polling for balance updates
    const interval = setInterval(fetchBalances, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [account, tokenContract, notifyError]);

  if (!account) {
    return (
      <DashboardCard
        title="Token Balance"
        icon={<CoinsIcon size={24} />}
        description="Connect your wallet to view your token balance."
      />
    );
  }

  if (loading) {
    return <LoadingState text="Loading token balance..." />;
  }

  // Format balances for display
  const formatBalance = (balance) => {
    return parseFloat(ethers.formatEther(balance)).toFixed(4);
  };

  // Determine delegation status
  const isSelfDelegated = !delegateAddress || delegateAddress === account;
  const hasDelegators = delegators && delegators.length > 0;

  return (
    <div className="space-y-6">
      <DashboardCard
        title="Your Token Balance"
        icon={<CoinsIcon size={24} />}
        description="Your JUST token balance and delegation details"
      >
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Balance */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Total Balance</div>
            <div className="text-2xl font-bold">{formatBalance(balances.total)} JUST</div>
          </div>
          
          {/* Locked & Unlocked Tokens */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Available (Unlocked)</div>
            <div className="text-2xl font-bold">{formatBalance(balances.unlocked)} JUST</div>
            
            {balances.locked > 0 && (
              <div className="mt-2 flex items-center text-sm text-yellow-600">
                <LockIcon size={16} className="mr-1" />
                <span>{formatBalance(balances.locked)} JUST locked for delegation</span>
              </div>
            )}
          </div>
        </div>
      </DashboardCard>
      
      {/* Delegation Status */}
      <DashboardCard
        title="Delegation Status"
        icon={<LockIcon size={24} />}
        description={isSelfDelegated 
          ? "You are currently delegating to yourself"
          : `You are delegating to ${delegateAddress}`
        }
      >
        <div className="mt-4">
          {isSelfDelegated ? (
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-sm text-green-800">
                You are delegating to yourself. Your tokens are unlocked and can be transferred.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm text-yellow-800 flex items-center">
                <AlertCircleIcon size={16} className="mr-1" />
                You are delegating to another address. Your tokens are locked and cannot be transferred.
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Delegation Address: <span className="font-mono">{delegateAddress}</span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Amount Delegated: {formatBalance(balances.locked)} JUST
              </p>
            </div>
          )}
          
          {/* Received Delegations */}
          {balances.receivedDelegations > 0 && (
            <div className="mt-4 bg-indigo-50 p-4 rounded-md">
              <p className="text-sm text-indigo-800">
                You have received delegations from {delegators.length} address(es).
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Received Voting Power: {formatBalance(balances.receivedDelegations)} JUST
              </p>
              
              {hasDelegators && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 font-medium">Delegators:</p>
                  <div className="mt-1 max-h-24 overflow-y-auto">
                    {delegators.map((delegator, index) => (
                      <div key={index} className="text-xs font-mono text-gray-600 truncate">
                        {delegator}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
};

export default TokenBalance;