// src/config/constants.js
export const CONTRACT_ADDRESSES = {
  // Contract addresses on Sepolia
  token: "0xA3448DD0BdeFc13dD7e5a59994f1f15D8cc18521",
  timelock: "0x4ac8b4aaA12D9F051FFD3cA27301007Dc1A3a26b",
  governance: "0xFB195C11B511e646A4516d1a29DDa46E7516C9A4", 
  daoHelper: "0xc542d0fAD38404bFaac6c0AD8476535cbA88614E",
  analyticsHelper: "0xFe13C1DA26A1b5FeB032AA54155FC7e92E236b90"
};

// Role constants
export const ROLES = {
  ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000041444d494e", // ADMIN_ROLE
  GUARDIAN_ROLE: "0x47554152444941e0000000000000000000000000000000000000000000000000", // GUARDIAN_ROLE
  PROPOSER_ROLE: "0x50524f504f5345520000000000000000000000000000000000000000000000", // PROPOSER_ROLE
  EXECUTOR_ROLE: "0x45584543555445000000000000000000000000000000000000000000000000", // EXECUTOR_ROLE
  ANALYTICS_ROLE: "0x414e414c5954494353000000000000000000000000000000000000000000", // ANALYTICS_ROLE
  GOVERNANCE_ROLE: "0x4741564552e414e43450000000000000000000000000000000000000000", // GOVERNANCE_ROLE
  MINTER_ROLE: "0x4d494e5445520000000000000000000000000000000000000000000000000000" // MINTER_ROLE
};

// Network information
export const NETWORKS = {
  1: {
    name: "Ethereum Mainnet",
    chainId: "0x1",
    explorerUrl: "https://etherscan.io"
  },
  11155111: {
    name: "Sepolia",
    chainId: "0xaa36a7",
    explorerUrl: "https://sepolia.etherscan.io",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
  }
};

// Expected network ID for the application
export const EXPECTED_NETWORK_ID = 11155111; // Sepolia

// Proposal states mapping for display
export const PROPOSAL_STATES = [
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Executed",
  "Expired"
];

// Proposal types mapping for display
export const PROPOSAL_TYPES = [
  "General",
  "Withdrawal",
  "TokenTransfer",
  "GovernanceChange",
  "ExternalERC20Transfer",
  "TokenMint",
  "TokenBurn"
];

// Threat levels for Timelock
export const THREAT_LEVELS = [
  "Low",
  "Medium",
  "High",
  "Critical"
];

// Vote types
export const VOTE_TYPES = {
  AGAINST: 0,
  FOR: 1,
  ABSTAIN: 2
};