import React, { useState, useEffect } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { PROPOSAL_STATES, VOTE_TYPES } from '../utils/constants';
import { formatCountdown } from '../utils/formatters';
import Loader from './Loader';

const VoteTab = ({ proposals, castVote, hasVoted, getVotingPower, voting, account }) => {
  const [voteFilter, setVoteFilter] = useState('active');
  const [votingPowers, setVotingPowers] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Track locally which proposals the user has voted on and how
  const [votedProposals, setVotedProposals] = useState({});
  
  // Get voting power for each proposal on component mount
  useEffect(() => {
    const fetchVotingPowers = async () => {
      if (!proposals.length) return;
      
      setLoading(true);
      
      try {
        const powers = {};
        for (const proposal of proposals) {
          if (proposal.state === PROPOSAL_STATES.ACTIVE) {
            const power = await getVotingPower(proposal.snapshotId);
            powers[proposal.id] = power;
          }
        }
        setVotingPowers(powers);
      } catch (error) {
        console.error("Error fetching voting powers:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVotingPowers();
  }, [proposals, getVotingPower, account]);

  // Initialize votedProposals from the proposals data
  useEffect(() => {
    const voted = {};
    proposals.forEach(proposal => {
      if (proposal.hasVoted) {
        // Set default vote type to abstain if not specified
        let voteType = VOTE_TYPES.ABSTAIN;
        if (proposal.votedYes) voteType = VOTE_TYPES.FOR;
        if (proposal.votedNo) voteType = VOTE_TYPES.AGAINST;
        
        voted[proposal.id] = voteType;
      }
    });
    setVotedProposals(voted);
  }, [proposals]);

  // Filter proposals based on vote status - FIXED: Keep active proposals in active filter even if voted
  const filteredProposals = proposals.filter(proposal => {
    // Check if we've locally voted on this proposal
    const locallyVoted = votedProposals[proposal.id] !== undefined;
    
    if (voteFilter === 'active') {
      // Only check if proposal is active, don't exclude based on vote status
      return proposal.state === PROPOSAL_STATES.ACTIVE;
    } else if (voteFilter === 'voted') {
      return proposal.hasVoted || locallyVoted;
    }
    return true; // 'all' filter
  });

  // Submit vote with immediate UI update
  const submitVote = async (proposalId, support) => {
    try {
      // Immediately update UI to show the vote
      const newVotedProposals = {...votedProposals};
      newVotedProposals[proposalId] = support;
      setVotedProposals(newVotedProposals);
      
      // Actually cast the vote on the blockchain
      await castVote(proposalId, support);
    } catch (error) {
      console.error("Error casting vote:", error);
      alert("Error casting vote: " + (error.message || "See console for details"));
      
      // Revert the UI change if there was an error
      const newVotedProposals = {...votedProposals};
      delete newVotedProposals[proposalId];
      setVotedProposals(newVotedProposals);
    }
  };

  // Check if the user has voted on the proposal (either from data or local state)
  const hasUserVoted = (proposal) => {
    return proposal.hasVoted || votedProposals[proposal.id] !== undefined;
  };
  
  // Get the vote type
  const getUserVoteType = (proposal) => {
    // First check our local state
    if (votedProposals[proposal.id] !== undefined) {
      return votedProposals[proposal.id];
    }
    
    // Then fall back to the proposal data
    if (proposal.votedYes) return VOTE_TYPES.FOR;
    if (proposal.votedNo) return VOTE_TYPES.AGAINST;
    if (proposal.hasVoted) return VOTE_TYPES.ABSTAIN;
    
    return null;
  };

  // Helper to convert vote type to text
  const getVoteTypeText = (voteType) => {
    if (voteType === VOTE_TYPES.FOR) return 'Yes';
    if (voteType === VOTE_TYPES.AGAINST) return 'No';
    if (voteType === VOTE_TYPES.ABSTAIN) return 'Abstain';
    return '';
  };

  // Use just the contract vote counts directly - don't try to adjust locally
  const calculateVotePercentages = (proposal) => {
    // Get base vote counts from the proposal - ensure we're converting to numbers
    // These should be coming directly from the contract for all users
    const yesVotes = parseFloat(proposal.yesVotes) || 0;
    const noVotes = parseFloat(proposal.noVotes) || 0;
    const abstainVotes = parseFloat(proposal.abstainVotes) || 0;
    
    // Calculate total and percentages
    const totalVotes = yesVotes + noVotes + abstainVotes;
    
    // Log the vote data for debugging
    console.log(`Proposal ${proposal.id} vote data:`, {
      yesVotes,
      noVotes,
      abstainVotes,
      totalVotes
    });
    
    return {
      yesVotes,
      noVotes,
      abstainVotes,
      totalVotes,
      yesPercentage: totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0,
      noPercentage: totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0,
      abstainPercentage: totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0
    };
  };

  // Render vote percentage bar
  const renderVoteBar = (proposal) => {
    const voteData = calculateVotePercentages(proposal);
    
    if (voteData.totalVotes === 0) {
      return (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gray-300"></div>
        </div>
      );
    }
    
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="flex h-full">
          <div className="bg-green-500 h-full" style={{ width: `${voteData.yesPercentage}%` }}></div>
          <div className="bg-red-500 h-full" style={{ width: `${voteData.noPercentage}%` }}></div>
          <div className="bg-gray-400 h-full" style={{ width: `${voteData.abstainPercentage}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Vote</h2>
        <p className="text-gray-500">Cast your votes on active proposals</p>
      </div>
      
      {/* Filter options */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2">
          {['active', 'voted', 'all'].map(filter => (
            <button
              key={filter}
              className={`px-3 py-1 rounded-full text-sm ${voteFilter === filter ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}
              onClick={() => setVoteFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Voting cards */}
      <div className="space-y-6">
        {voting.loading || loading ? (
          <div className="flex justify-center py-8">
            <Loader size="large" text="Loading proposals..." />
          </div>
        ) : filteredProposals.length > 0 ? (
          filteredProposals.map((proposal, idx) => {
            // Get voting power for this proposal
            const votingPower = votingPowers[proposal.id] || "0";
            const hasVotingPower = parseFloat(votingPower) > 0;
            
            // Check if the user has voted
            const userVoted = hasUserVoted(proposal);
            const voteType = getUserVoteType(proposal);
            
            // Get vote data
            const voteData = calculateVotePercentages(proposal);
            
            return (
              <div key={idx} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium">{proposal.title}</h3>
                    <p className="text-xs text-gray-500">Proposal #{proposal.id}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatCountdown(proposal.deadline)}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-4">{proposal.description.substring(0, 150)}...</p>
                
                <div className="mb-4">
                  {/* Vote percentages */}
                  <div className="flex justify-between text-sm mb-2">
                    <span>Yes: {voteData.yesPercentage.toFixed(1)}%</span>
                    <span>No: {voteData.noPercentage.toFixed(1)}%</span>
                    <span>Abstain: {voteData.abstainPercentage.toFixed(1)}%</span>
                  </div>
                  
                  {/* Vote bar */}
                  {renderVoteBar(proposal)}
                  
                  {/* Vote counts */}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{Math.round(voteData.yesVotes)} votes</span>
                    <span>{Math.round(voteData.noVotes)} votes</span>
                    <span>{Math.round(voteData.abstainVotes)} votes</span>
                  </div>
                </div>
                
                {userVoted ? (
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="mr-2">You voted:</span>
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {getVoteTypeText(voteType)}
                    </span>
                  </div>
                ) : proposal.state === PROPOSAL_STATES.ACTIVE && (
                  <div>
                    {hasVotingPower ? (
                      <div>
                        <div className="mb-2 text-sm text-gray-600">
                          Your voting power: {votingPower} JUST
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            className="flex-1 min-w-0 bg-green-500 hover:bg-green-600 text-white py-2 px-1 rounded-md flex items-center justify-center text-xs sm:text-sm"
                            onClick={() => submitVote(proposal.id, VOTE_TYPES.FOR)}
                          >
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">Yes</span>
                          </button>
                          <button 
                            className="flex-1 min-w-0 bg-red-500 hover:bg-red-600 text-white py-2 px-1 rounded-md flex items-center justify-center text-xs sm:text-sm"
                            onClick={() => submitVote(proposal.id, VOTE_TYPES.AGAINST)}
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">No</span>
                          </button>
                          <button 
                            className="flex-1 min-w-0 bg-gray-500 hover:bg-gray-600 text-white py-2 px-1 rounded-md flex items-center justify-center text-xs sm:text-sm"
                            onClick={() => submitVote(proposal.id, VOTE_TYPES.ABSTAIN)}
                          >
                            <span className="truncate">Abstain</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-red-500">
                        You don't have voting power for this proposal. You may need to delegate to yourself or acquire tokens before the snapshot.
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View Full Details
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            No proposals found for this filter
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteTab;