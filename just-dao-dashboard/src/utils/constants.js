// Contract addresses (update these with your deployed contract addresses)
export const CONTRACT_ADDRESSES = {
    token: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // JustToken address
    governance: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", // JustGovernance address
    timelock: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // JustTimelock address
    analyticsHelper: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318", // JustAnalyticsHelper address
    daoHelper: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853" // JustDAOHelper address 
  };
  
  // Proposal Types
  export const PROPOSAL_TYPES = {
    GENERAL: 0,
    WITHDRAWAL: 1,
    TOKEN_TRANSFER: 2,
    GOVERNANCE_CHANGE: 3,
    EXTERNAL_ERC20_TRANSFER: 4,
    TOKEN_MINT: 5,
    TOKEN_BURN: 6
  };
  
  // Proposal States
  export const PROPOSAL_STATES = {
    ACTIVE: 0,
    CANCELED: 1,
    DEFEATED: 2,
    SUCCEEDED: 3,
    QUEUED: 4,
    EXECUTED: 5,
    EXPIRED: 6
  };
  
  // Vote Types
  export const VOTE_TYPES = {
    AGAINST: 0,
    FOR: 1,
    ABSTAIN: 2
  };
  
  // Timelock Threat Levels
  export const THREAT_LEVELS = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3
  };
  
  // Role Definitions (keccak256 hashed strings for role definitions)
  export const ROLES = {
    DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
    ADMIN_ROLE: "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
    GUARDIAN_ROLE: "0x453f3692ccb18feb8e89def77b6a1eabf5ef16e60b3c5b58ca8ef3ce3a07c96d",
    ANALYTICS_ROLE: "0x8f82dbb8f65f0a98b6debd351f8cdf5034e44c5f5ee65c0a1688a3d16cdf9ccd",
    PROPOSER_ROLE: "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1",
    EXECUTOR_ROLE: "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63",
    MINTER_ROLE: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
  };