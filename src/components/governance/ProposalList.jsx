// src/components/governance/ProposalList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { WalletContext } from '../../context/WalletContext';
import { ContractsContext } from '../../context/ContractsContext';
import { NotificationContext } from '../../context/NotificationContext';
import { LoadingState } from '../common/LoadingSpinner';
import { ProposalStateBadge } from '../common/StatusBadge';
import { ClockIcon, FileTextIcon, VoteIcon, CheckCircleIcon, SearchIcon } from 'lucide-react';
import { PROPOSAL_TYPES } from '../../config/constants';

const ProposalList = () => {
  const { account } = useContext(WalletContext);
  const { governanceContract } = useContext(ContractsContext);
  const { notifyError } = useContext(NotificationContext);
  
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    state: 'all',
    type: 'all',
    voted: 'all'
  });

  // Fetch proposals
  useEffect(() => {
    const fetchProposals = async () => {
      if (!governanceContract) return;
      
      try {
        setLoading(true);
        
        // Find the latest proposal ID by searching backward
        let latestProposalId = 0;
        let foundValidProposal = false;
        
        // Start from a reasonably high number and search backward
        for (let i = 100; i >= 0; i--) {
          try {
            await governanceContract.getProposalState(i);
            latestProposalId = i;
            foundValidProposal = true;
            break;
          } catch (error) {
            // Proposal doesn't exist, continue searching
            continue;
          }
        }
        
        if (!foundValidProposal) {
          setProposals([]);
          setLoading(false);
          return;
        }
        
        // Fetch proposals from most recent to oldest
        const proposalData = [];
        for (let i = latestProposalId; i >= 0; i--) {
          try {
            // Get proposal state
            const state = await governanceContract.getProposalState(i);
            
            // Get proposal data
            const proposal = await governanceContract._proposals(i);
            
            // Check if the current user has voted on this proposal
            let hasVoted = false;
            if (account) {
              const votingPower = await governanceContract.proposalVoterInfo(i, account);
              hasVoted = !votingPower.isZero();
            }
            
            // Format proposal data
            const formattedProposal = {
              id: i,
              state: Number(state),
              type: Number(proposal.pType),
              typeName: PROPOSAL_TYPES[Number(proposal.pType)],
              description: proposal.description,
              proposer: proposal.proposer,
              yesVotes: ethers.formatEther(proposal.yesVotes),
              noVotes: ethers.formatEther(proposal.noVotes),
              abstainVotes: ethers.formatEther(proposal.abstainVotes),
              totalVotes: ethers.formatEther(
                proposal.yesVotes + proposal.noVotes + proposal.abstainVotes
              ),
              createdAt: new Date(Number(proposal.createdAt) * 1000),
              deadline: new Date(Number(proposal.deadline) * 1000),
              hasVoted,
              isActive: Number(state) === 0,
              isExecuted: Number(state) === 5,
              timelockTxHash: proposal.timelockTxHash
            };
            
            proposalData.push(formattedProposal);
          } catch (error) {
            console.error(`Error fetching proposal ${i}:`, error);
            continue;
          }
        }
        
        setProposals(proposalData);
      } catch (error) {
        console.error("Error fetching proposals:", error);
        notifyError("Failed to fetch proposals");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposals();
  }, [governanceContract, account, notifyError]);

  // Apply filters and search
  useEffect(() => {
    if (!proposals.length) {
      setFilteredProposals([]);
      return;
    }
    
    let filtered = [...proposals];
    
    // Apply state filter
    if (filters.state !== 'all') {
      filtered = filtered.filter(proposal => proposal.state === parseInt(filters.state));
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(proposal => proposal.type === parseInt(filters.type));
    }
    
    // Apply voted filter
    if (filters.voted !== 'all') {
      filtered = filtered.filter(proposal => {
        if (filters.voted === 'voted') return proposal.hasVoted;
        return !proposal.hasVoted;
      });
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(proposal => 
        proposal.description.toLowerCase().includes(term) || 
        proposal.proposer.toLowerCase().includes(term) || 
        proposal.id.toString().includes(term) ||
        proposal.typeName.toLowerCase().includes(term)
      );
    }
    
    setFilteredProposals(filtered);
  }, [proposals, filters, searchTerm]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time remaining for active proposals
  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const diff = deadline - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-blue-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search proposals..."
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All States</option>
              <option value="0">Active</option>
              <option value="1">Canceled</option>
              <option value="2">Defeated</option>
              <option value="3">Succeeded</option>
              <option value="4">Queued</option>
              <option value="5">Executed</option>
              <option value="6">Expired</option>
            </select>
            
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              {PROPOSAL_TYPES.map((type, index) => (
                <option key={index} value={index}>{type}</option>
              ))}
            </select>
            
            {account && (
              <select
                value={filters.voted}
                onChange={(e) => handleFilterChange('voted', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Votes</option>
                <option value="voted">Voted</option>
                <option value="not-voted">Not Voted</option>
              </select>
            )}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="p-8">
          <LoadingState message="Loading proposals..." />
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="p-8 text-center">
          <FileTextIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No proposals found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {proposals.length > 0
              ? "No proposals match your current filters."
              : "There are no proposals yet. Create the first one!"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title & Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Votes
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timing
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{proposal.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {proposal.description.length > 60
                        ? `${proposal.description.substring(0, 60)}...`
                        : proposal.description}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {proposal.typeName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ProposalStateBadge state={proposal.state} />
                    {proposal.hasVoted && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <VoteIcon size={12} className="mr-1" />
                        Voted
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="font-medium">{parseFloat(proposal.yesVotes).toLocaleString()}</span>
                        <span className="text-gray-500 ml-1">Yes</span>
                      </div>
                      <div className="flex items-center mb-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        <span className="font-medium">{parseFloat(proposal.noVotes).toLocaleString()}</span>
                        <span className="text-gray-500 ml-1">No</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                        <span className="font-medium">{parseFloat(proposal.abstainVotes).toLocaleString()}</span>
                        <span className="text-gray-500 ml-1">Abstain</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {proposal.isActive ? (
                        <div className="flex items-center text-amber-600">
                          <ClockIcon size={16} className="mr-1" />
                          {getTimeRemaining(proposal.deadline)}
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          {formatDate(proposal.createdAt)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/governance/proposals/${proposal.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProposalList;