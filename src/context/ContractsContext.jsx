// src/context/ContractsContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { WalletContext } from './WalletContext';
import { CONTRACT_ADDRESSES } from '../config/constants';

// Import ABIs
import JustTokenABI from '../config/abis/JustToken.json';
import JustGovernanceABI from '../config/abis/JustGovernance.json';
import JustTimelockABI from '../config/abis/JustTimelock.json';
import JustDAOHelperABI from '../config/abis/JustDAOHelper.json';
import JustAnalyticsHelperABI from '../config/abis/JustAnalyticsHelper.json';

// Create context
export const ContractsContext = createContext();

export const ContractsProvider = ({ children }) => {
  // Access wallet context
  const { provider, signer, account } = useContext(WalletContext);

  // Contract instances
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenContractWithSigner, setTokenContractWithSigner] = useState(null);
  const [governanceContract, setGovernanceContract] = useState(null);
  const [governanceContractWithSigner, setGovernanceContractWithSigner] = useState(null);
  const [timelockContract, setTimelockContract] = useState(null);
  const [timelockContractWithSigner, setTimelockContractWithSigner] = useState(null);
  const [daoHelperContract, setDAOHelperContract] = useState(null);
  const [daoHelperContractWithSigner, setDAOHelperContractWithSigner] = useState(null);
  const [analyticsHelperContract, setAnalyticsHelperContract] = useState(null);
  const [analyticsHelperContractWithSigner, setAnalyticsHelperContractWithSigner] = useState(null);

  // Initialize contract instances
  useEffect(() => {
    if (!provider) return;

    // Create read-only contract instances
    const tokenContract = new ethers.Contract(
      CONTRACT_ADDRESSES.token,
      JustTokenABI,
      provider
    );
    
    const governanceContract = new ethers.Contract(
      CONTRACT_ADDRESSES.governance,
      JustGovernanceABI,
      provider
    );
    
    const timelockContract = new ethers.Contract(
      CONTRACT_ADDRESSES.timelock,
      JustTimelockABI,
      provider
    );
    
    const daoHelperContract = new ethers.Contract(
      CONTRACT_ADDRESSES.daoHelper,
      JustDAOHelperABI,
      provider
    );
    
    const analyticsHelperContract = new ethers.Contract(
      CONTRACT_ADDRESSES.analyticsHelper,
      JustAnalyticsHelperABI,
      provider
    );

    // Set read-only contracts
    setTokenContract(tokenContract);
    setGovernanceContract(governanceContract);
    setTimelockContract(timelockContract);
    setDAOHelperContract(daoHelperContract);
    setAnalyticsHelperContract(analyticsHelperContract);
  }, [provider]);

  // Initialize signer instances when signer is available
  useEffect(() => {
    if (!signer || !tokenContract || !governanceContract || !timelockContract || !daoHelperContract || !analyticsHelperContract) return;

    // Create signer contract instances
    const tokenContractWithSigner = tokenContract.connect(signer);
    const governanceContractWithSigner = governanceContract.connect(signer);
    const timelockContractWithSigner = timelockContract.connect(signer);
    const daoHelperContractWithSigner = daoHelperContract.connect(signer);
    const analyticsHelperContractWithSigner = analyticsHelperContract.connect(signer);

    // Set signer contracts
    setTokenContractWithSigner(tokenContractWithSigner);
    setGovernanceContractWithSigner(governanceContractWithSigner);
    setTimelockContractWithSigner(timelockContractWithSigner);
    setDAOHelperContractWithSigner(daoHelperContractWithSigner);
    setAnalyticsHelperContractWithSigner(analyticsHelperContractWithSigner);
  }, [signer, tokenContract, governanceContract, timelockContract, daoHelperContract, analyticsHelperContract]);

  // Value to be provided by the context
  const value = {
    // Read-only contracts
    tokenContract,
    governanceContract,
    timelockContract,
    daoHelperContract,
    analyticsHelperContract,
    
    // Signer contracts
    tokenContractWithSigner,
    governanceContractWithSigner,
    timelockContractWithSigner,
    daoHelperContractWithSigner,
    analyticsHelperContractWithSigner,
    
    // Helper function to get the appropriate contract based on write needs
    getContract: (contractName, needsWrite = false) => {
      if (contractName === 'token') {
        return needsWrite ? tokenContractWithSigner : tokenContract;
      } else if (contractName === 'governance') {
        return needsWrite ? governanceContractWithSigner : governanceContract;
      } else if (contractName === 'timelock') {
        return needsWrite ? timelockContractWithSigner : timelockContract;
      } else if (contractName === 'daoHelper') {
        return needsWrite ? daoHelperContractWithSigner : daoHelperContract;
      } else if (contractName === 'analyticsHelper') {
        return needsWrite ? analyticsHelperContractWithSigner : analyticsHelperContract;
      }
      return null;
    }
  };

  return (
    <ContractsContext.Provider value={value}>
      {children}
    </ContractsContext.Provider>
  );
};

export default ContractsProvider;