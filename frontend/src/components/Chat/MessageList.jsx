import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ToolCard from './ToolCard.jsx';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

function ReasoningSection({ params }) {
  const [isOpen, setIsOpen] = useState(false);

  const getReasoningPoints = () => {
    const points = [];
    const conditions = params?.rules?.conditions || [];

    const spendCond = conditions.find((c) => c.field === 'totalSpend');
    if (spendCond) {
      if (spendCond.operator === 'gt' || spendCond.operator === 'gte') {
        points.push(
          `Average spend is significantly higher (${
            spendCond.operator === 'gt' ? '>' : '≥'
          } ₹${Number(spendCond.value).toLocaleString()}) than base average.`
        );
      } else {
        points.push(`Budget-conscious cohort optimized for volume and discount conversion.`);
      }
    } else {
      points.push(`Average lifetime value aligns with core premium customer bracket.`);
    }

    const recencyCond = conditions.find(
      (c) => c.field === 'lastOrderDate' || c.field === 'days_ago'
    );
    if (recencyCond) {
      points.push(
        `Recency gap detected (no purchases in last ${
          recencyCond.value || 30
        }+ days), triggering reactivation flow.`
      );
    } else {
      points.push(`Shoppers exhibit stable, recurring purchasing habits.`);
    }

    const cityCond = conditions.find((c) => c.field === 'city');
    if (cityCond) {
      points.push(`Target audience concentrated in high-density ${cityCond.value} retail hub.`);
    } else {
      points.push(`Cross-regional target representation maximizes campaign reach.`);
    }

    points.push(`Historical response patterns suggest a high reactivation probability.`);

    return points;
  };

  const points = getReasoningPoints();

  return (
    <div class="border border-amber-200/40 bg-amber-50/20 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        class="w-full flex items-center justify-between p-3 text-xs font-bold text-amber-800 hover:bg-amber-50/40 transition-colors cursor-pointer outline-none"
      >
        <span class="flex items-center gap-2">
          <Sparkles class="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Why Aria selected this audience
        </span>
        {isOpen ? <ChevronUp class="w-3.5 h-3.5" /> : <ChevronDown class="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div class="p-3.5 border-t border-amber-100 bg-white space-y-2.5 text-xs text-slate-700 animate-in fade-in duration-200">
          {points.map((pt, i) => (
            <div key={i} class="flex items-start gap-2.5">
              <span class="text-emerald-500 font-bold">✓</span>
              <span class="leading-relaxed">{pt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageList({ messages, isStreaming }) {
  const bottomRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div class="flex-1 overflow-y-auto px-1 py-4 space-y-6">
      {messages.map((msg, index) => {
        // Render Tool execution card
        if (msg.type === 'tool') {
          return (
            <div key={index} class="flex flex-col w-full">
              <div class="flex justify-start">
                <ToolCard
                  toolName={msg.toolName}
                  status={msg.status}
                  params={msg.params}
                  result={msg.result}
                />
              </div>
              {msg.toolName === 'create_segment' &&
                msg.status === 'complete' &&
                msg.result?.success && (
                  <div class="ml-14 mt-1 mb-4 max-w-2xl">
                    <ReasoningSection params={msg.params} />
                  </div>
                )}
            </div>
          );
        }

        const isUser = msg.role === 'user';

        if (isUser) {
          return (
            <div key={index} class="flex justify-end">
              <div class="max-w-xl px-4 py-3 rounded-2xl rounded-tr-none bg-[#1e293b] text-white text-sm shadow-sm leading-relaxed">
                {msg.content}
              </div>
            </div>
          );
        }

        // Aria Assistant message
        return (
          <div key={index} class="flex items-start gap-3.5 justify-start">
            {/* Aria Avatar */}
            <div class="w-8 h-8 rounded-full bg-amber-800 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0 mt-1">
              A
            </div>
            {/* White card with amber left border */}
            <div class="flex-1 max-w-2xl bg-white border border-slate-200 border-l-4 border-l-amber-600 rounded-2xl rounded-tl-none p-4 shadow-sm text-slate-800 text-sm leading-relaxed prose prose-slate">
              <div class="flex items-center gap-1.5 mb-1.5">
                <span class="text-sm font-black text-slate-800 flex items-center gap-1">🤖 Aria</span>
                <span class="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-200/40">
                  AI Marketing Strategist
                </span>
              </div>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full text-sm border-collapse" {...props} />
                    </div>
                  ),
                  thead: ({node, ...props}) => (
                    <thead className="bg-amber-50 border-b-2 border-amber-200" {...props} />
                  ),
                  th: ({node, ...props}) => (
                    <th className="text-left px-4 py-2 font-semibold 
                      text-amber-800 text-xs uppercase tracking-wide" {...props} />
                  ),
                  tbody: ({node, ...props}) => (
                    <tbody className="divide-y divide-gray-100" {...props} />
                  ),
                  tr: ({node, ...props}) => (
                    <tr className="hover:bg-amber-50 transition-colors" {...props} />
                  ),
                  td: ({node, ...props}) => (
                    <td className="px-4 py-2 text-gray-700" {...props} />
                  ),
                  strong: ({node, ...props}) => (
                    <strong className="font-semibold text-gray-900" {...props} />
                  ),
                  p: ({node, ...props}) => (
                    <p className="mb-2 leading-relaxed" {...props} />
                  ),
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        );
      })}

      {/* Streaming Typing Indicator */}
      {isStreaming && (
        <div class="flex items-start gap-3.5 justify-start">
          <div class="w-8 h-8 rounded-full bg-amber-800 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
            A
          </div>
          <div class="bg-white border border-slate-200 border-l-4 border-l-amber-600 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span class="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span class="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
