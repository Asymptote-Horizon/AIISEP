'use client';

import { useState } from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';

export default function PollCreator({ poll, onChange }) {
  const [question, setQuestion] = useState(poll?.question || '');
  const [options, setOptions] = useState(poll?.options || ['', '']);
  const [multiSelect, setMultiSelect] = useState(poll?.multiSelect || false);

  const updatePoll = (q, opts, multi) => {
    onChange({
      question: q,
      options: opts.filter(o => o.trim()),
      multiSelect: multi,
    });
  };

  const addOption = () => {
    if (options.length >= 10) return;
    const newOpts = [...options, ''];
    setOptions(newOpts);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, i) => i !== index);
    setOptions(newOpts);
    updatePoll(question, newOpts, multiSelect);
  };

  const updateOption = (index, value) => {
    const newOpts = [...options];
    newOpts[index] = value;
    setOptions(newOpts);
    updatePoll(question, newOpts, multiSelect);
  };

  const updateQuestion = (value) => {
    setQuestion(value);
    updatePoll(value, options, multiSelect);
  };

  const toggleMultiSelect = () => {
    const newMulti = !multiSelect;
    setMultiSelect(newMulti);
    updatePoll(question, options, newMulti);
  };

  return (
    <div className="poll-creator">
      <div className="poll-creator-header">
        <BarChart3 size={18} className="inline-icon" />
        <span>Create Poll</span>
      </div>

      <div className="form-group">
        <input
          className="form-input"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => updateQuestion(e.target.value)}
        />
      </div>

      <div className="poll-options-list">
        {options.map((opt, idx) => (
          <div key={idx} className="poll-option-input-row">
            <input
              className="form-input"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
            />
            {options.length > 2 && (
              <button
                type="button"
                className="poll-option-remove"
                onClick={() => removeOption(idx)}
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="poll-creator-actions">
        {options.length < 10 && (
          <button type="button" className="btn btn-sm btn-secondary" onClick={addOption}>
            <Plus size={14} className="inline-icon" /> Add Option
          </button>
        )}
        <label className="poll-multi-toggle">
          <input
            type="checkbox"
            checked={multiSelect}
            onChange={toggleMultiSelect}
          />
          <span>Allow multiple selections</span>
        </label>
      </div>
    </div>
  );
}
