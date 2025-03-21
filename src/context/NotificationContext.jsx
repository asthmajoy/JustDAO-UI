// src/context/NotificationContext.jsx
import React, { createContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { NETWORKS } from '../config/constants';

// Create context
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [pendingTransactions, setPendingTransactions] = useState([]);

  // Add a pending transaction to the list
  const addPendingTransaction = useCallback((tx, description) => {
    const newPendingTx = {
      hash: tx.hash,
      description,
      timestamp: Date.now()
    };
    
    setPendingTransactions(prev => [...prev, newPendingTx]);
    
    // Return a promise that will resolve when the transaction is confirmed
    return tx.wait().then(receipt => {
      // Remove from pending list
      setPendingTransactions(prev => prev.filter(t => t.hash !== tx.hash));
      
      // Check if transaction was successful
      if (receipt.status === 1) {
        notifySuccess(`${description} completed successfully!`);
      } else {
        notifyError(`${description} failed.`);
      }
      
      return receipt;
    }).catch(error => {
      // Remove from pending list
      setPendingTransactions(prev => prev.filter(t => t.hash !== tx.hash));
      
      // Show error notification
      notifyError(`${description} failed: ${error.message}`);
      throw error;
    });
  }, []);

  // Get explorer link for transaction
  const getExplorerLink = useCallback((hash, networkId = 11155111) => {
    const network = NETWORKS[networkId];
    if (!network || !network.explorerUrl) return '';
    return `${network.explorerUrl}/tx/${hash}`;
  }, []);

  // Success notification
  const notifySuccess = useCallback((message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  // Error notification
  const notifyError = useCallback((message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  // Info notification
  const notifyInfo = useCallback((message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  // Warning notification
  const notifyWarning = useCallback((message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, []);

  // Value to be provided by the context
  const value = {
    pendingTransactions,
    addPendingTransaction,
    getExplorerLink,
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;