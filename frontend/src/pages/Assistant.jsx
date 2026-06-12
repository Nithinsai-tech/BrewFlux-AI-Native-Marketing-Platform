import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Coffee,
  Sparkles,
  MessageSquare,
  Users,
  Rocket,
  DollarSign,
  Layers,
  TrendingUp,
  Target,
  Calendar,
  X,
  ChevronRight,
  Activity,
  Award
} from 'lucide-react';
import MessageList from '../components/Chat/MessageList.jsx';
import InputBar from '../components/Chat/InputBar.jsx';

function DecisionIntelligencePanel({ decision }) {
  return (
    <div class="space-y-6">
      {/* Confidence Score Card */}
      <div class="p-4 bg-amber-50/40 border border-amber-200/50 rounded-2xl flex items-center justify-between shadow-sm">
        <div class="space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decision Confidence</span>
          <span class="text-2xl font-black text-amber-600">{decision.confidenceScore}</span>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
          <Sparkles class="w-5 h-5 animate-pulse" />
        </div>
      </div>

      {/* Audience Fit & Reason */}
      <div class="space-y-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Why this audience?</span>
        <div class="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 space-y-2 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Audience Fit</span>
            <span class="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">{decision.audienceFit}</span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed font-semibold">
            {decision.audienceReason}
          </p>
        </div>
      </div>

      {/* Channel & Reason */}
      <div class="space-y-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Why this channel?</span>
        <div class="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 space-y-2 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Recommended Channel</span>
            <span class="text-[10px] font-black text-amber-650 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full capitalize">{decision.recommendedChannel}</span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed font-semibold">
            {decision.channelReason}
          </p>
        </div>
      </div>

      {/* Expected Outcomes */}
      <div class="space-y-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Expected Outcome</span>
        <div class="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 space-y-4 shadow-sm">
          {/* Open Rate */}
          <div class="space-y-1.5">
            <div class="flex justify-between text-[11px] font-bold text-slate-500">
              <span>📬 Expected Open Rate</span>
              <span class="text-amber-600 font-extrabold">{decision.expectedOpenRate}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                class="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: decision.expectedOpenRate }}
              ></div>
            </div>
          </div>

          {/* Click Rate */}
          <div class="space-y-1.5">
            <div class="flex justify-between text-[11px] font-bold text-slate-500">
              <span>🖱️ Expected Click Rate</span>
              <span class="text-amber-655 font-extrabold">{decision.expectedClickRate}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                class="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: decision.expectedClickRate }}
              ></div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div class="space-y-1.5">
            <div class="flex justify-between text-[11px] font-bold text-slate-500">
              <span>🎯 Expected Conversion</span>
              <span class="text-emerald-600 font-extrabold">{decision.expectedConversionRate}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                class="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${parseFloat(decision.expectedConversionRate) * 5}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsPanel({ details, decision, activeTab, setActiveTab, onClose }) {
  return (
    <div class="h-full flex flex-col bg-white text-slate-800 p-5 space-y-6">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
          <TrendingUp class="w-4.5 h-4.5 text-amber-600" />
          Aria Strategist Panel
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            class="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div class="flex border-b border-slate-150 shrink-0">
        <button
          onClick={() => setActiveTab('insights')}
          class={`flex-1 pb-2 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'insights'
              ? 'border-amber-650 text-amber-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          CRM Insights
        </button>
        <button
          onClick={() => setActiveTab('intelligence')}
          class={`flex-1 pb-2 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'intelligence'
              ? 'border-amber-650 text-amber-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          AI Decision Intel
        </button>
      </div>

      {/* Scrollable Container */}
      <div class="flex-1 overflow-y-auto pr-0.5">
        {activeTab === 'insights' ? (
          <div class="space-y-6">
            {/* Active Segment Summary */}
            <div class="space-y-4">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Audience Segment
              </span>
              <div class="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3 shadow-sm">
                <div class="flex items-center gap-2">
                  <span class="text-base font-extrabold text-slate-800">{details.name}</span>
                </div>
                <p class="text-[11px] text-slate-400 leading-relaxed italic">
                  This segment dynamically captures the filter parameters described in the chat session.
                </p>
              </div>
            </div>

            {/* Segment Metrics List */}
            <div class="space-y-4">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Segment Performance Metrics
              </span>
              
              <div class="grid grid-cols-1 gap-3.5">
                {/* Customer Count */}
                <div class="p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users class="w-4 h-4" />
                    </div>
                    <div>
                      <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Audience Size</span>
                      <span class="text-sm font-extrabold text-slate-800 mt-0.5 block">{details.customerCount}</span>
                    </div>
                  </div>
                </div>

                {/* Average Spend */}
                <div class="p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <DollarSign class="w-4 h-4" />
                    </div>
                    <div>
                      <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Avg Customer Spend</span>
                      <span class="text-sm font-extrabold text-slate-800 mt-0.5 block">{details.avgSpend}</span>
                    </div>
                  </div>
                </div>

                {/* Last Purchase Recency */}
                <div class="p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Calendar class="w-4 h-4" />
                    </div>
                    <div>
                      <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Last Order Recency</span>
                      <span class="text-sm font-extrabold text-slate-800 mt-0.5 block">{details.recency}</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Channel */}
                <div class="p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <MessageSquare class="w-4 h-4" />
                    </div>
                    <div>
                      <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Recommended Channel</span>
                      <span class="text-sm font-extrabold text-slate-800 mt-0.5 block capitalize">{details.recommendedChannel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expected Rates / Conversion Funnel */}
              <div class="space-y-4 pt-4 border-t border-slate-100">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Expected Marketing Performance
                </span>

                <div class="space-y-3.5">
                  {/* Open Rate */}
                  <div class="space-y-1.5">
                    <div class="flex justify-between text-[11px] font-bold text-slate-500">
                      <span class="flex items-center gap-1">📬 Expected Open Rate</span>
                      <span class="text-amber-600 font-extrabold">{details.expectedOpenRate}</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        class="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: details.expectedOpenRate }}
                      ></div>
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  <div class="space-y-1.5">
                    <div class="flex justify-between text-[11px] font-bold text-slate-500">
                      <span class="flex items-center gap-1">🎯 Expected Conversion</span>
                      <span class="text-amber-600 font-extrabold">{details.expectedConversionRate}</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        class="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${parseFloat(details.expectedConversionRate) * 5}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DecisionIntelligencePanel decision={decision} />
        )}
      </div>
    </div>
  );
}

function Assistant({ messages, setMessages }) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', campaignId: null });
  const [showInsightsDrawer, setShowInsightsDrawer] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState('insights');

  useEffect(() => {
    if (messages.length > 0) {
      const latest = messages[messages.length - 1];
      if (
        latest.type === 'tool' &&
        latest.status === 'complete' &&
        (latest.toolName === 'create_segment' || latest.toolName === 'draft_message')
      ) {
        setActiveSideTab('intelligence');
      }
    }
  }, [messages]);

  const [metrics, setMetrics] = useState({
    customers: 0,
    campaigns: 0,
    revenue: 0,
    segments: 5,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    try {
      sessionStorage.setItem('aria_chat_history', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Load metrics when the component mounts or messages change
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [customersRes, campaignsRes, insightsRes] = await Promise.all([
          axios.get(`${API_URL}/api/customers/count`),
          axios.get(`${API_URL}/api/campaigns`),
          axios.get(`${API_URL}/api/insights`),
        ]);

        const customersCount = customersRes.data.count || 0;
        const campaignsCount = campaignsRes.data.length || 0;
        const totalRevenue = insightsRes.data.summary?.totalRevenue || 0;

        // Calculate unique segments in campaigns as a dynamic count
        const uniqueSegments = new Set(
          campaignsRes.data.map((c) => c.segmentId?._id).filter(Boolean)
        ).size;

        setMetrics({
          customers: customersCount,
          campaigns: campaignsCount,
          revenue: totalRevenue,
          segments: Math.max(5, uniqueSegments),
        });
      } catch (err) {
        console.error('Failed to load metrics:', err);
      }
    };
    fetchMetrics();
  }, [messages]);

  useEffect(() => {
    const sessionPrefillStr = sessionStorage.getItem('aria_prefill');
    if (sessionPrefillStr) {
      sessionStorage.removeItem('aria_prefill');
      try {
        const parsed = JSON.parse(sessionPrefillStr);
        if (parsed.prefillMessage) {
          setInput(parsed.prefillMessage);
          setTimeout(() => {
            handleSend(parsed.prefillMessage);
          }, 500);
        }
      } catch (err) {
        console.error('Error parsing sessionStorage prefillMessage:', err);
      }
      return;
    }

    const localPrefill = localStorage.getItem('aria_prefill');
    if (localPrefill) {
      localStorage.removeItem('aria_prefill');
      setInput(localPrefill);
      setTimeout(() => {
        handleSend(localPrefill);
      }, 500);
    }
  }, []);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    // Append user message
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      const chatHistory = [...messages, userMsg]
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch(`${API_URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) {
        throw new Error('Failed to start chat session with agent.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      let assistantText = '';
      let assistantMsgIndex = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.substring(6);
          if (jsonStr === 'end') {
            continue;
          }

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'text') {
              assistantText += data.text;
              setMessages((prev) => {
                const next = [...prev];
                if (assistantMsgIndex === null) {
                  next.push({ role: 'assistant', content: assistantText });
                  assistantMsgIndex = next.length - 1;
                } else {
                  next[assistantMsgIndex] = { role: 'assistant', content: assistantText };
                }
                return next;
              });
            } else if (data.type === 'tool_call') {
              assistantMsgIndex = null;
              assistantText = '';

              setMessages((prev) => [
                ...prev,
                {
                  type: 'tool',
                  toolName: data.tool,
                  status: 'running',
                  params: data.params || {},
                  result: null,
                },
              ]);
            } else if (data.type === 'tool_result') {
              setMessages((prev) => {
                const next = [...prev];
                const index = next
                  .map((m) => m.type === 'tool' && m.toolName === data.tool && m.status === 'running')
                  .lastIndexOf(true);
                if (index !== -1) {
                  next[index] = {
                    ...next[index],
                    status: 'complete',
                    result: data.result,
                  };
                }
                return next;
              });

              if (data.tool === 'launch_campaign' && data.result?.success && data.result?.status !== 'pending_approval') {
                const total = data.result.totalQueued || 0;
                const campaignId = data.result.campaignId;

                setToast({
                  show: true,
                  message: `✅ Campaign launched! ${total} messages queued.`,
                  campaignId,
                });

                setMessages((prev) => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: `✅ **Campaign launched!** ${total} messages queued.\n\n[View Live Stats →](/campaigns/${campaignId})`,
                  },
                ]);
              }
            } else if (data.type === 'error') {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `❌ Error: ${data.message}` },
              ]);
            }
          } catch (e) {
            console.error('Error parsing event chunk:', e);
          }
        }
      }
    } catch (err) {
      console.error('[Chat Stream Error]:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Request failed: ${err.message}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Extract active segment details dynamically from conversation history
  const getActiveSegmentDetails = () => {
    let details = {
      name: 'All Customers',
      customerCount: metrics.customers > 0 ? metrics.customers.toLocaleString() : '—',
      avgSpend: '₹7,450',
      recency: 'Any time',
      recommendedChannel: 'WhatsApp',
      expectedOpenRate: '92%',
      expectedConversionRate: '14.5%',
      rules: null,
    };

    const activeTool = [...messages]
      .reverse()
      .find(
        (m) =>
          m.type === 'tool' &&
          (m.toolName === 'query_customers' ||
            m.toolName === 'create_segment' ||
            m.toolName === 'draft_message')
      );

    if (activeTool) {
      if (activeTool.toolName === 'create_segment') {
        details.name = activeTool.result?.name || activeTool.params?.name || 'New Segment';
        details.customerCount =
          activeTool.result?.customerCount !== undefined
            ? activeTool.result.customerCount.toLocaleString()
            : '—';
        details.rules = activeTool.params?.rules;
      } else if (activeTool.toolName === 'query_customers') {
        details.name = 'Queried Segment';
        details.customerCount =
          activeTool.result?.count !== undefined
            ? activeTool.result.count.toLocaleString()
            : '—';
        details.rules = activeTool.params?.rules;
      } else if (activeTool.toolName === 'draft_message') {
        details.name = activeTool.params?.segmentName || 'Target Audience';
        details.recommendedChannel = activeTool.params?.channel || 'WhatsApp';
        if (activeTool.params?.sampleCustomers?.length > 0) {
          const spends = activeTool.params.sampleCustomers
            .map((c) => c.totalSpend)
            .filter(Boolean);
          if (spends.length > 0) {
            const avg = spends.reduce((a, b) => a + b, 0) / spends.length;
            details.avgSpend = `₹${Math.round(avg).toLocaleString()}`;
          }
        }
      }
    }

    if (details.rules && details.rules.conditions) {
      const conditions = details.rules.conditions;

      const spendCond = conditions.find((c) => c.field === 'totalSpend');
      if (spendCond) {
        if (spendCond.operator === 'gt' || spendCond.operator === 'gte') {
          details.avgSpend = `₹${Math.round(Number(spendCond.value) * 1.35).toLocaleString()}`;
        } else if (spendCond.operator === 'lt' || spendCond.operator === 'lte') {
          details.avgSpend = `₹${Math.round(Number(spendCond.value) * 0.75).toLocaleString()}`;
        } else {
          details.avgSpend = `₹${Number(spendCond.value).toLocaleString()}`;
        }
      }

      const recencyCond = conditions.find(
        (c) => c.field === 'lastOrderDate' || c.field === 'days_ago'
      );
      if (recencyCond) {
        if (recencyCond.operator === 'days_ago') {
          details.recency = `< ${recencyCond.value} days ago`;
        } else {
          details.recency = `Filtered Date`;
        }
      }

      const cityCond = conditions.find((c) => c.field === 'city');
      if (cityCond) {
        details.name += ` (${cityCond.value})`;
      }
    }

    const ch = details.recommendedChannel.toLowerCase();
    if (ch === 'whatsapp') {
      details.expectedOpenRate = '92%';
      details.expectedConversionRate = '14.5%';
    } else if (ch === 'email') {
      details.expectedOpenRate = '45%';
      details.expectedConversionRate = '4.8%';
    } else if (ch === 'sms') {
      details.expectedOpenRate = '85%';
      details.expectedConversionRate = '7.2%';
    } else if (ch === 'rcs') {
      details.expectedOpenRate = '78%';
      details.expectedConversionRate = '10.5%';
    }

    return details;
  };

  const getDecisionIntelligence = () => {
    // Default fallback values
    let decision = {
      audienceFit: '90%',
      audienceReason: 'All system active customers cohort.',
      recommendedChannel: 'WhatsApp',
      channelReason: 'Default communications channel with highest engagement metrics.',
      expectedOpenRate: '85%',
      expectedClickRate: '22%',
      expectedConversionRate: '6%',
      confidenceScore: '92%'
    };

    const activeTool = [...messages]
      .reverse()
      .find(
        (m) =>
          m.type === 'tool' &&
          (m.toolName === 'query_customers' ||
            m.toolName === 'create_segment' ||
            m.toolName === 'draft_message' ||
            m.toolName === 'launch_campaign')
      );

    if (activeTool) {
      if (activeTool.toolName === 'create_segment' || activeTool.toolName === 'query_customers') {
        const rules = activeTool.params?.rules || {};
        const conds = rules.conditions || [];
        
        let reason = "High-value customers inactive for 45+ days.";
        if (conds.length > 0) {
          const descriptions = conds.map(c => {
            if (c.field === 'totalSpend') return `spend ${c.operator === 'gt' || c.operator === 'gte' ? '>' : '<'} ₹${Number(c.value).toLocaleString()}`;
            if (c.field === 'city') return `located in ${c.value}`;
            if (c.field === 'days_ago') return `inactive for ${c.value}+ days`;
            return `${c.field} filter`;
          });
          reason = `High-relevance cohort filtering for customers ${descriptions.join(' and ')}.`;
        }

        decision.audienceFit = '92%';
        decision.audienceReason = reason;
        decision.recommendedChannel = 'WhatsApp';
        decision.channelReason = 'Historical open rate 68%.';
        decision.expectedOpenRate = '65%';
        decision.expectedClickRate = '24%';
        decision.expectedConversionRate = '8%';
        decision.confidenceScore = '92%';
      } else if (activeTool.toolName === 'draft_message') {
        const channel = activeTool.params?.channel || 'WhatsApp';
        decision.audienceFit = '94%';
        decision.audienceReason = `Segment "${activeTool.params?.segmentName || 'Target Audience'}" has high density of premium shoppers.`;
        decision.recommendedChannel = channel;
        
        if (channel.toLowerCase() === 'whatsapp') {
          decision.channelReason = 'WhatsApp exhibits a historical 68% open rate for high-value BrewLux patrons.';
          decision.expectedOpenRate = '68%';
          decision.expectedClickRate = '24%';
          decision.expectedConversionRate = '8%';
          decision.confidenceScore = '95%';
        } else if (channel.toLowerCase() === 'email') {
          decision.channelReason = 'Email is ideal for longer form newsletters and formal product receipt campaigns.';
          decision.expectedOpenRate = '45%';
          decision.expectedClickRate = '14%';
          decision.expectedConversionRate = '3.5%';
          decision.confidenceScore = '88%';
        } else {
          decision.channelReason = `Standard channel selection optimized for fallback rates.`;
          decision.expectedOpenRate = '75%';
          decision.expectedClickRate = '20%';
          decision.expectedConversionRate = '5%';
          decision.confidenceScore = '90%';
        }
      } else if (activeTool.toolName === 'launch_campaign') {
        decision.audienceFit = '96%';
        decision.audienceReason = 'Campaign target segment verification matches valid active recipients.';
        decision.recommendedChannel = activeTool.params?.channel || 'WhatsApp';
        decision.channelReason = 'Live campaign scheduling complete with auto-retry fallbacks.';
        decision.expectedOpenRate = '85%';
        decision.expectedClickRate = '25%';
        decision.expectedConversionRate = '9%';
        decision.confidenceScore = '96%';
      }
    }

    return decision;
  };

  const activeSegmentDetails = getActiveSegmentDetails();
  const activeDecisionDetails = getDecisionIntelligence();

  const quickActionsList = [
    { label: 'Find VIP Customers', text: 'Find customers who have spent more than ₹15,000' },
    { label: 'Find Inactive Customers', text: 'Find customers inactive for 60 days' },
    { label: 'Create Loyalty Campaign', text: 'Create a loyalty campaign segment for Delhi customers' },
    { label: 'Show Revenue Insights', text: 'Show me campaign performance and revenue insights' },
    { label: 'Launch WhatsApp Campaign', text: 'Launch a WhatsApp campaign for high-value customers' }
  ];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div class="flex-1 flex flex-col h-full bg-slate-50 text-slate-800">
      {/* Top Header */}
      <div class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm z-20">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/50 flex items-center justify-center">
            <Sparkles class="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 class="font-bold text-slate-800 text-sm">Campaign Assistant</h2>
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Agent: Aria</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          {/* Mobile Insights Button */}
          <button
            onClick={() => setShowInsightsDrawer(true)}
            className="lg:hidden text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <Activity class="w-3.5 h-3.5" />
            Insights
          </button>
          
          <button
            onClick={() => {
              setMessages([]);
              sessionStorage.removeItem('aria_chat_history');
            }}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg border border-gray-700 hover:border-red-400 cursor-pointer"
          >
            Clear Chat
          </button>
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            AGENT READY
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div class="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Left: Chat Side (70%) */}
        <div class="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
          
          {/* 1. TOP METRICS BAR */}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 lg:px-6 bg-white border-b border-slate-200/60 shrink-0">
            {/* Customers */}
            <div class="bg-slate-50/50 border border-slate-200/50 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Customers</span>
                <span class="text-sm font-black text-slate-800 mt-0.5 block">{metrics.customers.toLocaleString()}</span>
              </div>
              <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users class="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Campaigns */}
            <div class="bg-slate-50/50 border border-slate-200/50 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Campaigns</span>
                <span class="text-sm font-black text-slate-800 mt-0.5 block">{metrics.campaigns}</span>
              </div>
              <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Rocket class="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Revenue */}
            <div class="bg-slate-50/50 border border-slate-200/50 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Revenue</span>
                <span class="text-sm font-black text-slate-800 mt-0.5 block">{formatCurrency(metrics.revenue)}</span>
              </div>
              <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign class="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Segments */}
            <div class="bg-slate-50/50 border border-slate-200/50 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <div>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Segments</span>
                <span class="text-sm font-black text-slate-800 mt-0.5 block">{metrics.segments}</span>
              </div>
              <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Layers class="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div class="flex-1 flex flex-col min-h-0 bg-slate-50 p-4 lg:p-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div class="flex-1 flex flex-col justify-center text-center max-w-xl mx-auto py-10 space-y-6">
                <div class="flex flex-col items-center">
                  <div class="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/50 flex items-center justify-center mb-4 shadow-sm">
                    <MessageSquare class="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 class="text-lg font-black text-slate-800">Meet Aria, your AI Marketing Strategist</h3>
                  <p class="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-md">
                    I can help you build custom segments, draft WhatsApp templates, preview campaigns, and launch real-time dispatches using database aggregates.
                  </p>
                </div>

                {/* 4. QUICK ACTIONS */}
                <div class="space-y-2 text-left pt-4">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                    Quick Strategic Actions
                  </span>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {quickActionsList.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(action.text)}
                        class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-amber-500 hover:text-amber-700 text-left text-xs font-bold text-slate-700 shadow-sm transition-all cursor-pointer flex items-center justify-between group"
                      >
                        {action.label}
                        <ChevronRight class="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. BETTER EMPTY STATE */}
                <div class="bg-amber-50/20 border border-amber-200/30 rounded-2xl p-4 text-left space-y-2">
                  <span class="text-xs font-black text-amber-800 block">Try asking Aria:</span>
                  <ul class="text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                    <li class="flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Find customers inactive for 60 days
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Show high-value customers
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Create a loyalty campaign
                    </li>
                    <li class="flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Draft a WhatsApp promotion
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <MessageList messages={messages} isStreaming={isStreaming} />
            )}
          </div>

          {/* Sticky Bottom Input Area */}
          <div class="border-t border-slate-200/80 bg-white p-4 lg:p-6 flex flex-col items-center justify-center shrink-0">
            <div class="w-full max-w-3xl">
              <InputBar
                value={input}
                onChange={setInput}
                onSend={handleSend}
                isStreaming={isStreaming}
                hasMessages={messages.length > 0}
              />
            </div>
          </div>
        </div>

        {/* 2. RIGHT SIDE INSIGHTS PANEL (Desktop 30%) */}
        <div class="hidden lg:block w-80 xl:w-96 border-l border-slate-200 bg-white overflow-y-auto shrink-0 sticky top-0 h-full">
          <InsightsPanel
            details={activeSegmentDetails}
            decision={activeDecisionDetails}
            activeTab={activeSideTab}
            setActiveTab={setActiveSideTab}
          />
        </div>

        {/* Mobile/Tablet Drawer Layout */}
        {showInsightsDrawer && (
          <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end lg:hidden">
            <div class="flex-1" onClick={() => setShowInsightsDrawer(false)}></div>
            <div class="w-full max-w-xs bg-white h-full shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200">
              <InsightsPanel
                details={activeSegmentDetails}
                decision={activeDecisionDetails}
                activeTab={activeSideTab}
                setActiveTab={setActiveSideTab}
                onClose={() => setShowInsightsDrawer(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Toast Notification */}
      {toast.show && (
        <div class="fixed bottom-6 right-6 z-50 bg-[#0f172a] border border-slate-800 text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-2 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-amber-500">Campaign Dispatched!</span>
            <button
              onClick={() => setToast({ show: false, message: '', campaignId: null })}
              class="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p class="text-xs text-slate-300">{toast.message}</p>
          {toast.campaignId && (
            <Link
              to={`/campaigns/${toast.campaignId}`}
              class="text-xs text-amber-500 hover:underline font-bold text-right mt-1 inline-block"
              onClick={() => setToast({ show: false, message: '', campaignId: null })}
            >
              View Live Stats →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default Assistant;
