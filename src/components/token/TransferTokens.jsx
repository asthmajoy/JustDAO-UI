// src/components/token/TransferTokens.jsx
import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { NotificationContext } from '../../context/NotificationContext';
import { LoadingState, TransactionPending } from '../common/LoadingSpinner';
import { LockIcon, SendIcon, InfoIcon } from 'lucide-react';

const TransferTokens = () => {
  const { account } = useContext(WalletContext);
  const { tokenContract, getContract } = useContext(ContractsContext);
  const { addPendingTransaction, notifySuccess, notifyError, notifyWarning } = useContext(NotificationContext);
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isValidRecipient, setIsValidRecipient] = useState(true);
  const [isValidAmount, setIsValidAmount] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [balances, setBalances] = useState({
    total: ethers.parseEther("0"),
    locked: ethers.parseEther("0"),
    unlocked: ethers.parseEther("0")
  });

  // Fetch token balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!account || !tokenContract) return;
      
      try {
        setLoading(true);
        const totalBalance = await tokenContract.balanceOf(account);
        const lockedTokens = await tokenContract.getLockedTokens(account);
        const unlockedTokens = totalBalance - lockedTokens;
        
        setBalances({
          total: totalBalance,
          locked: lockedTokens,
          unlocked: unlockedTokens
        });
      } catch (error) {
        console.error("Error fetching token balances:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalances();
  }, [account, tokenContract]);

  // Validate recipient address
  const validateRecipient = (address) => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  // Validate amount
  const validateAmount = (amount) => {
    try {
      const parsedAmount = ethers.parseEther(amount || '0');
      
      // Check if amount is > 0
      if (parsedAmount <= 0) return false;
      
      // Check if amount <= unlocked balance
      if (parsedAmount > balances.unlocked) return false;
      
      return true;
    } catch {
      return false;
    }
  };

  // Handle recipient change
  const handleRecipientChange = (e) => {
    const address = e.target.value;
    setRecipient(address);
    setIsValidRecipient(address === '' || validateRecipient(address));
  };

  // Handle amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setIsValidAmount(value === '' || validateAmount(value));
  };

  // Set max available amount
  const handleSetMaxAmount = () => {
    try {
      const unlockedEther = ethers.formatEther(balances.unlocked);
      setAmount(unlockedEther);
      setIsValidAmount(validateAmount(unlockedEther));
    } catch (error) {
      console.error("Error setting max amount:", error);
    }
  };

  // Handle transfer submission
  const handleTransfer = async () => {
    if (!account || !isValidRecipient || !isValidAmount) return;
    
    try {
      setPending(true);
      const tokenContractWithSigner = getContract('token', true);
      
      // Parse amount to wei
      const amountWei = ethers.parseEther(amount);
      
      // Make the transfer
      const tx = await tokenContractWithSigner.transfer(recipient, amountWei);
      
      // Track the transaction
      await addPendingTransaction(tx, `Transfer tokens to ${recipient}`);
      
      // Show success message
      notifySuccess(`Successfully transferred ${amount} JUST tokens`);
      
      // Reset form
      setRecipient('');
      setAmount('');
      
      // Update balances after a short delay
      setTimeout(async () => {
        const totalBalance = await tokenContract.balanceOf(account);
        const lockedTokens = await tokenContract.getLockedTokens(account);
        const unlockedTokens = totalBalance - lockedTokens;
        
        setBalances({
          total: totalBalance,
          locked: lockedTokens,
          unlocked: unlockedTokens
        });
      }, 2000);
    } catch (error) {
      console.error("Transfer error:", error);
      
      // Show specific error messages based on common failure cases
      if (error.message.includes("insufficient")) {
        notifyError("Insufficient unlocked tokens for this transfer");
      } else if (error.message.includes("locked")) {
        notifyError("Cannot transfer locked tokens. Reset your delegation first.");
      } else {
        notifyError(`Transfer failed: ${error.message}`);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Transfer Tokens</h2>
      
      {loading ? (
        <LoadingState message="Loading token balances..." />
      ) : (
        <>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Total Balance</span>
                <span className="font-medium">{ethers.formatEther(balances.total)} JUST</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <LockIcon size={16} className="text-amber-500 mr-1" />
                  <span className="text-sm text-gray-500">Locked (Delegated)</span>
                </div>
                <span className="font-medium">{ethers.formatEther(balances.locked)} JUST</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Available for Transfer</span>
                <span className="font-medium text-green-600">{ethers.formatEther(balances.unlocked)} JUST</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Address
              </label>
              <input
                id="recipient"
                type="text"
                value={recipient}
                onChange={handleRecipientChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  !isValidRecipient ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0x..."
              />
              {!isValidRecipient && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid Ethereum address</p>
              )}
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    !isValidAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.0"
                />
                <button
                  onClick={handleSetMaxAmount}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  MAX
                </button>
              </div>
              {!isValidAmount && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid amount (must be less than your available balance)
                </p>
              )}
            </div>
            
            <div className="flex items-center p-3 bg-blue-50 text-blue-800 rounded-md">
              <InfoIcon size={20} className="flex-shrink-0 mr-2" />
              <span className="text-sm">
                Tokens that are delegated for voting cannot be transferred. You need to reset your delegation first.
              </span>
            </div>
            
            <button
              onClick={handleTransfer}
              disabled={!isValidRecipient || !isValidAmount || pending || balances.unlocked <= 0}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${
                  !isValidRecipient || !isValidAmount || pending || balances.unlocked <= 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
            >
              {pending ? (
                <TransactionPending />
              ) : (
                <>
                  <SendIcon size={18} className="mr-2" />
                  Transfer Tokens
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TransferTokens;