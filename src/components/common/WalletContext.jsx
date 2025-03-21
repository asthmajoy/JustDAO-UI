// src/context/WalletContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { EXPECTED_NETWORK_ID, NETWORKS } from '../config/constants';

// Create context
export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  // State variables
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Initialize provider from window.ethereum (if available)
  useEffect(() => {
    const initializeProvider = async () => {
      if (window.ethereum) {
        try {
          // Create ethers provider
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethersProvider);
          
          // Check connected network
          const network = await ethersProvider.getNetwork();
          setNetwork(network);
          setIsCorrectNetwork(Number(network.chainId) === EXPECTED_NETWORK_ID);
          
          // Check if already connected
          const accounts = await ethersProvider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            const signer = await ethersProvider.getSigner();
            setSigner(signer);
          }
        } catch (err) {
          console.error("Provider initialization error:", err);
          setError(err.message);
        }
      }
    };

    initializeProvider();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          setAccount(null);
          setSigner(null);
        } else if (accounts[0] !== account) {
          // Account changed
          setAccount(accounts[0]);
          if (provider) {
            const signer = await provider.getSigner();
            setSigner(signer);
          }
        }
      };

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload(); // Reload the page on chain change
      });
      
      return () => {
        // Cleanup listeners
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [account, provider]);

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("No Ethereum wallet found. Please install MetaMask.");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      // Get signer and account
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Get network info
      const network = await provider.getNetwork();
      
      // Update state
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setNetwork(network);
      setIsCorrectNetwork(Number(network.chainId) === EXPECTED_NETWORK_ID);
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Switch network function
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) {
      setError("No Ethereum wallet found. Please install MetaMask.");
      return;
    }

    try {
      // Request network switch
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORKS[EXPECTED_NETWORK_ID].chainId }],
      });
    } catch (switchError) {
      // Network not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORKS[EXPECTED_NETWORK_ID].chainId,
                chainName: NETWORKS[EXPECTED_NETWORK_ID].name,
                rpcUrls: [NETWORKS[EXPECTED_NETWORK_ID].rpcUrl],
                blockExplorerUrls: [NETWORKS[EXPECTED_NETWORK_ID].explorerUrl],
              },
            ],
          });
        } catch (addError) {
          setError(addError.message);
        }
      } else {
        setError(switchError.message);
      }
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
  }, []);

  // Format address for display
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Context value
  const value = {
    account,
    provider,
    signer,
    network,
    isConnecting,
    error,
    isCorrectNetwork,
    connectWallet,
    switchNetwork,
    disconnectWallet,
    formatAddress,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;