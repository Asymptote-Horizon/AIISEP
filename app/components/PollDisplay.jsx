'use client';

import { BarChart3, Check } from 'lucide-react';

export default function PollDisplay({ poll, userId, onVote }) {
  if (!poll || !poll.question) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  const userVotedOptions = poll.options
    .filter(opt => opt.votes?.some(v => v === userId || v.toString?.() === userId))
    .map(opt => opt._id);
  const hasVoted = userVotedOptions.length > 0;

  return (
    <div className="poll-display">
      <div className="poll-display-header">
        <BarChart3 size={18} className="inline-icon" />
        <span className="poll-question">{poll.question}</span>
        {poll.multiSelect && <span className="poll-multi-badge">Multi-select</span>}
      </div>

      <div className="poll-options">
        {poll.options.map((opt) => {
          const voteCount = opt.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = userVotedOptions.includes(opt._id);

          return (
            <button
              key={opt._id}
              type="button"
              className={`poll-option-btn ${isSelected ? 'poll-option-selected' : ''}`}
              onClick={() => onVote(opt._id)}
            >
              <div className="poll-option-bar" style={{ width: `${percentage}%` }} />
              <div className="poll-option-content">
                <span className="poll-option-text">
                  {isSelected && <Check size={14} className="inline-icon" />}
                  {opt.text}
                </span>
                <span className="poll-option-stats">
                  {voteCount} {voteCount === 1 ? 'vote' : 'votes'} · {percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="poll-total">
        {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
        {hasVoted && <span className="poll-voted-label"> · You voted</span>}
      </div>
    </div>
  );
}
