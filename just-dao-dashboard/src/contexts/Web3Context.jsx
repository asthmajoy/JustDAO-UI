import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import JustTokenABI from '../config/abis/JustTokenUpgradeable.json';
import JustGovernanceABI from '../config/abis/JustGovernanceUpgradeable.json';
import JustTimelockABI from '../config/abis/JustTimelockUpgradeable.json';
import JustAnalyticsHelperABI from '../config/abis/JustAnalyticsHelperUpgradeable.json';
import JustDAOHelperABI from '../config/abis/JustDAOHelperUpgradeable.json';
import { CONTRACT_ADDRESSES } from '../utils/constants.js';

const Web3Context = createContext();
 
export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [networkId, setNetworkId] = useState(null);
  const [contracts, setContracts] = useState({
    token: null,
    governance: null,
    timelock: null,
    analyticsHelper: null,
    daoHelper: null
  });

  async function connectWallet() {
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const web3Signer = web3Provider.getSigner();
        const chainId = await web3Provider.getNetwork().then(network => network.chainId);
        
        setAccount(accounts[0]);
        setProvider(web3Provider);
        setSigner(web3Signer);
        setIsConnected(true);
        setNetworkId(chainId);
        
        initializeContracts(web3Provider, web3Signer);
        
        // Set up listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      } else {
        console.error("MetaMask is not installed");
        alert("Please install MetaMask to use this application");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      // User has disconnected all accounts
      setIsConnected(false);
      setAccount('');
    } else {
      setAccount(accounts[0]);
    }
  }

  function handleChainChanged() {
    // Reload the page when the chain changes
    window.location.reload();
  }

  async function initializeContracts(provider, signer) {
    try {
      const tokenContract = new ethers.Contract(
        CONTRACT_ADDRESSES.token,
        JustTokenABI.abi,
        signer
      );
      
      const governanceContract = new ethers.Contract(
        CONTRACT_ADDRESSES.governance,
        JustGovernanceABI.abi,
        signer
      );
      
      const timelockContract = new ethers.Contract(
        CONTRACT_ADDRESSES.timelock,
        JustTimelockABI.abi,
        signer
      );
      
      const analyticsHelperContract = new ethers.Contract(
        CONTRACT_ADDRESSES.analyticsHelper,
        JustAnalyticsHelperABI.abi,
        signer
      );
      
      const daoHelperContract = new ethers.Contract(
        CONTRACT_ADDRESSES.daoHelper,
        JustDAOHelperABI.abi,
        signer
      );
      
      setContracts({
        token: tokenContract,
        governance: governanceContract,
        timelock: timelockContract,
        analyticsHelper: analyticsHelperContract,
        daoHelper: daoHelperContract
      });
    } catch (error) {
      console.error("Error initializing contracts:", error);
    }
  }

  async function disconnectWallet() {
    setIsConnected(false);
    setAccount('');
    setSigner(null);
    setContracts({
      token: null,
      governance: null,
      timelock: null,
      analyticsHelper: null,
      daoHelper: null
    });
    
    // Remove listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
  }

  const value = {
    provider,
    signer,
    account,
    isConnected,
    networkId,
    contracts,
    connectWallet,
    disconnectWallet
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}