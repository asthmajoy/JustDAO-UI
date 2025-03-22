import React, { useState, useEffect } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { PROPOSAL_STATES, VOTE_TYPES } from '../utils/constants';
import { formatCountdown } from '../utils/formatters';
import Loader from './Loader';

const VoteTab = ({ proposals, castVote, hasVoted, getVotingPower, voting, account }) => {
  const [voteFilter, setVoteFilter] = useState('active');
  const [votingPowers, setVotingPowers] = useState({});
  const [loading, setLoading] = useState(false);
  
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

  // Filter proposals based on vote status
  const filteredProposals = proposals.filter(proposal => {
    if (voteFilter === 'active') {
      return proposal.state === PROPOSAL_STATES.ACTIVE && !proposal.hasVoted;
    } else if (voteFilter === 'voted') {
      return proposal.hasVoted;
    }
    return true; // 'all' filter
  });

  // Submit vote
  const submitVote = async (proposalId, support) => {
    try {
      await castVote(proposalId, support);
    } catch (error) {
      console.error("Error casting vote:", error);
      alert("Error casting vote: " + (error.message || "See console for details"));
    }
  };

  // Render vote percentage bar with a fixed approach for empty votes
  const renderVoteBar = (proposal) => {
    // If the user has voted, force the bar to show their vote
    if (proposal.hasVoted) {
      // Determine which segment to show based on user's vote
      let barContent;
      
      if (proposal.votedYes) {
        barContent = (
          <div className="flex h-full">
            <div className="bg-green-500 h-full w-full"></div>
          </div>
        );
      } else if (proposal.votedNo) {
        barContent = (
          <div className="flex h-full">
            <div className="bg-red-500 h-full w-full"></div>
          </div>
        );
      } else {
        barContent = (
          <div className="flex h-full">
            <div className="bg-gray-400 h-full w-full"></div>
          </div>
        );
      }
      
      return (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          {barContent}
        </div>
      );
    }
    
    // If no votes yet or for non-voted proposals, show the standard gray bar
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-full bg-gray-300"></div>
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
                  {/* Vote percentages - simplified for consistent display */}
                  <div className="flex justify-between text-sm mb-2">
                    <span>Yes: {proposal.hasVoted && proposal.votedYes ? '100' : '0'}%</span>
                    <span>No: {proposal.hasVoted && proposal.votedNo ? '100' : '0'}%</span>
                    <span>Abstain: {proposal.hasVoted && !proposal.votedYes && !proposal.votedNo ? '100' : '0'}%</span>
                  </div>
                  
                  {/* Custom vote bar renderer */}
                  {renderVoteBar(proposal)}
                  
                  {/* Vote counts display - show simplified counts based on user vote */}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{proposal.hasVoted && proposal.votedYes ? '1' : '0'} votes</span>
                    <span>{proposal.hasVoted && proposal.votedNo ? '1' : '0'} votes</span>
                    <span>{proposal.hasVoted && !proposal.votedYes && !proposal.votedNo ? '1' : '0'} votes</span>
                  </div>
                </div>
                
                {proposal.hasVoted ? (
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="mr-2">You voted:</span>
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {proposal.votedYes ? 'Yes' : proposal.votedNo ? 'No' : 'Abstain'}
                    </span>
                  </div>
                ) : proposal.state === PROPOSAL_STATES.ACTIVE && (
                  <div>
                    {hasVotingPower ? (
                      <div>
                        <div className="mb-2 text-sm text-gray-600">
                          Your voting power: {votingPower} JUST
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md flex items-center justify-center"
                            onClick={() => submitVote(proposal.id, VOTE_TYPES.FOR)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Vote Yes
                          </button>
                          <button 
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md flex items-center justify-center"
                            onClick={() => submitVote(proposal.id, VOTE_TYPES.AGAINST)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Vote No
                          </button>
                          <button 
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-md flex items-center justify-center"
                            onClick={() => submitVote(proposal.id, VOTE_TYPES.ABSTAIN)}
                          >
                            Abstain
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