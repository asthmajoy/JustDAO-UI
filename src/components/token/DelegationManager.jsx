// src/components/token/DelegationManager.jsx
import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { NotificationContext } from '../../context/NotificationContext';
import { LoadingState, TransactionPending } from '../common/LoadingSpinner';
import { LockIcon, UnlockIcon, UserIcon, AlertTriangleIcon } from 'lucide-react';

const DelegationManager = () => {
  const { account } = useContext(WalletContext);
  const { tokenContract, getContract, daoHelperContract } = useContext(ContractsContext);
  const { addPendingTransaction, notifySuccess, notifyError, notifyInfo } = useContext(NotificationContext);
  
  const [delegateAddress, setDelegateAddress] = useState('');
  const [currentDelegate, setCurrentDelegate] = useState(null);
  const [isValidAddress, setIsValidAddress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [checkingDelegation, setCheckingDelegation] = useState(false);
  const [delegationDepthWarning, setDelegationDepthWarning] = useState(null);

  // Fetch current delegation
  useEffect(() => {
    const fetchDelegation = async () => {
      if (!account || !tokenContract) return;
      
      try {
        setLoading(true);
        const delegate = await tokenContract.getDelegate(account);
        setCurrentDelegate(delegate);
        
        // If self-delegated or no delegation, we show the address as empty
        if (delegate === account) {
          setCurrentDelegate(account);
        }
      } catch (error) {
        console.error("Error fetching delegation info:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDelegation();
  }, [account, tokenContract]);

  // Validate address format
  const validateAddress = (address) => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  // Handle input change
  const handleAddressChange = (e) => {
    const address = e.target.value;
    setDelegateAddress(address);
    setIsValidAddress(address === '' || validateAddress(address));
    setDelegationDepthWarning(null);
  };

  // Check delegation safety
  const checkDelegationSafety = async () => {
    if (!account || !daoHelperContract || !delegateAddress || !isValidAddress) return;
    
    try {
      setCheckingDelegation(true);
      
      // Check if delegation would exceed max depth
      const warningLevel = await daoHelperContract.checkDelegationDepthWarning(
        account,
        delegateAddress
      );
      
      if (warningLevel > 0) {
        // Warning levels: 1=close to limit, 2=at limit, 3=exceeds limit
        if (warningLevel === 3) {
          setDelegationDepthWarning({
            level: 'error',
            message: 'This delegation would exceed the maximum delegation depth or create a cycle. Please choose another address.'
          });
        } else if (warningLevel === 2) {
          setDelegationDepthWarning({
            level: 'warning',
            message: 'This delegation will reach the maximum allowed depth. It will work but cannot be extended further.'
          });
        } else {
          setDelegationDepthWarning({
            level: 'info',
            message: 'This delegation is approaching the maximum allowed depth.'
          });
        }
      } else {
        setDelegationDepthWarning(null);
        notifyInfo('Delegation check passed. You can proceed safely.');
      }
    } catch (error) {
      console.error("Error checking delegation safety:", error);
      setDelegationDepthWarning({
        level: 'error',
        message: 'Failed to check delegation safety. Please contact support.'
      });
    } finally {
      setCheckingDelegation(false);
    }
  };

  // Handle delegation submission
  const handleDelegate = async () => {
    if (!account || !isValidAddress) return;
    
    // Self delegation case (reset delegation)
    const isSelfDelegation = delegateAddress === account || delegateAddress === '';
    
    try {
      setPending(true);
      const tokenContractWithSigner = getContract('token', true);
      
      // Call the appropriate function
      const tx = await tokenContractWithSigner.delegate(
        isSelfDelegation ? account : delegateAddress
      );
      
      // Track the transaction
      notifyInfo(`Delegation transaction submitted`);
      await addPendingTransaction(
        tx, 
        isSelfDelegation ? 'Reset delegation' : 'Delegate voting power'
      );
      
      // Reset form after successful delegation
      notifySuccess(
        isSelfDelegation 
          ? 'Successfully reset your delegation' 
          : `Successfully delegated to ${delegateAddress}`
      );
      
      if (isSelfDelegation) {
        setDelegateAddress('');
      }
      
      // Update current delegate
      setCurrentDelegate(isSelfDelegation ? account : delegateAddress);
    } catch (error) {
      console.error("Delegation error:", error);
      notifyError(`Delegation failed: ${error.message}`);
    } finally {
      setPending(false);
    }
  };

  // Handle resetting delegation
  const handleResetDelegation = async () => {
    try {
      setPending(true);
      const tokenContractWithSigner = getContract('token', true);
      
      // Call the reset function
      const tx = await tokenContractWithSigner.resetDelegation();
      
      // Track the transaction
      notifyInfo(`Reset delegation transaction submitted`);
      await addPendingTransaction(tx, 'Reset delegation');
      
      // Show success message
      notifySuccess('Successfully reset your delegation');
      
      // Update current delegate
      setCurrentDelegate(account);
      setDelegateAddress('');
    } catch (error) {
      console.error("Reset delegation error:", error);
      notifyError(`Reset delegation failed: ${error.message}`);
    } finally {
      setPending(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading delegation info..." />;
  }

  if (pending) {
    return <TransactionPending text="Delegation transaction pending..." />;
  }

  const isSelfDelegated = currentDelegate === account;

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Delegation</h2>
      
      {/* Current Delegation Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-md font-medium text-gray-900 mb-2">Current Delegation</h3>
        
        {isSelfDelegated ? (
          <div className="flex items-center text-green-700">
            <UnlockIcon size={18} className="mr-2" />
            <span>
              You are currently delegating to yourself. Your tokens are unlocked.
            </span>
          </div>
        ) : (
          <div className="flex items-center text-yellow-700">
            <LockIcon size={18} className="mr-2" />
            <span>
              You are delegating to: <span className="font-mono">{currentDelegate}</span>
            </span>
          </div>
        )}
      </div>
      
      {/* Delegation Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="delegateAddress" className="block text-sm font-medium text-gray-700">
            Delegate Address
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="delegateAddress"
              value={delegateAddress}
              onChange={handleAddressChange}
              placeholder={isSelfDelegated ? "Enter address to delegate to" : "Enter new address or leave empty to reset"}
              className={`block w-full pl-10 py-2 sm:text-sm rounded-md ${
                !isValidAddress 
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>
          {!isValidAddress && (
            <p className="mt-2 text-sm text-red-600">
              Please enter a valid Ethereum address
            </p>
          )}
        </div>
        
        {/* Delegation Safety Check */}
        {delegateAddress && isValidAddress && delegateAddress !== account && (
          <div className="flex items-center">
            <button
              onClick={checkDelegationSafety}
              disabled={checkingDelegation}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {checkingDelegation ? 'Checking...' : 'Check Delegation Safety'}
            </button>
            <span className="ml-2 text-xs text-gray-500">
              Recommended before delegating
            </span>
          </div>
        )}
        
        {/* Delegation Warning */}
        {delegationDepthWarning && (
          <div className={`p-3 rounded-md ${
            delegationDepthWarning.level === 'error' 
              ? 'bg-red-50 text-red-700'
              : delegationDepthWarning.level === 'warning'
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-blue-50 text-blue-700'
          }`}>
            <div className="flex">
              <AlertTriangleIcon size={16} className="mr-2 mt-0.5" />
              <p className="text-sm">{delegationDepthWarning.message}</p>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-3">
          <button
            onClick={handleDelegate}
            disabled={(!delegateAddress && isSelfDelegated) || !isValidAddress || pending || (delegationDepthWarning?.level === 'error')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSelfDelegated 
              ? 'Delegate Voting Power' 
              : delegateAddress 
                ? 'Change Delegation' 
                : 'Reset to Self-Delegation'}
          </button>
          
          {!isSelfDelegated && (
            <button
              onClick={handleResetDelegation}
              disabled={pending}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Reset Delegation
            </button>
          )}
        </div>
      </div>
      
      {/* Information Box */}
      <div className="mt-6 bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">About Delegation</h3>
        <p className="text-sm text-gray-600">
          Delegating your voting power allows another address to vote on your behalf in governance proposals.
          When you delegate:
        </p>
        <ul className="mt-2 ml-4 list-disc text-sm text-gray-600">
          <li>Your tokens will be locked and cannot be transferred</li>
          <li>You can reset your delegation at any time</li>
          <li>The delegate can vote with your voting power, but cannot transfer your tokens</li>
        </ul>
      </div>
    </div>
  );
};

export default DelegationManager;