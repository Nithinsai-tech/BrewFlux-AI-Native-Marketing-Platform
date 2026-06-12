import React, { useRef, useEffect } from 'react';
import { Send, ArrowUp } from 'lucide-react';

const suggestedPrompts = [
  'Who are my high-value customers?',
  "Find customers who haven't ordered in 60 days",
  'Run a WhatsApp re-engagement campaign',
  'Show me campaign performance',
];

function InputBar({ value, onChange, onSend, isStreaming, hasMessages }) {
  const textareaRef = useRef(null);

  // Auto-resize handler
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isStreaming) {
        onSend(value);
      }
    }
  };

  const handleChipClick = (prompt) => {
    if (!isStreaming) {
      onSend(prompt);
    }
  };

  return (
    <div class="space-y-4">
      {/* Suggested Prompt Chips */}
      {!hasMessages && (
        <div class="flex flex-wrap gap-2 max-w-2xl">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(prompt)}
              disabled={isStreaming}
              class="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-amber-500 hover:text-amber-600 transition-all text-left shadow-sm cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input container */}
      <div class="relative bg-white border border-slate-200 rounded-2xl p-2 shadow-sm focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all flex items-end gap-2 max-w-3xl">
        <textarea
          ref={textareaRef}
          rows="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Ask Aria to segment, draft, or launch a campaign..."
          class="flex-1 max-h-40 outline-none border-none py-2 px-3 resize-none text-sm bg-transparent text-slate-800 placeholder-slate-400 leading-relaxed font-sans"
        />

        <button
          onClick={() => {
            if (value.trim()) onSend(value);
          }}
          disabled={isStreaming || !value.trim()}
          class="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-100 disabled:text-slate-400 text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send class="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default InputBar;
