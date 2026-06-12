import React, { useState } from 'react';
import axios from 'axios';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  Play,
  Settings,
  Database,
  MessageSquareCode,
  Eye,
  Rocket,
  BarChart3,
  HelpCircle,
  Calendar,
  DollarSign,
  Users,
  Edit2,
  List,
  Activity
} from 'lucide-react';
import { useToast } from '../../App.jsx';

const toolMetadata = {
  query_customers: {
    icon: Database,
    title: 'Querying Customer Database',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  create_segment: {
    icon: Settings,
    title: 'Creating Customer Segment',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  draft_message: {
    icon: MessageSquareCode,
    title: 'Drafting Message Template',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
  preview_campaign: {
    icon: Eye,
    title: 'Generating Campaign Preview',
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
  },
  launch_campaign: {
    icon: Rocket,
    title: 'Launching Campaign Dispatch',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  get_campaign_stats: {
    icon: BarChart3,
    title: 'Aggregating Campaign Metrics',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  list_segments: {
    icon: Play,
    title: 'Listing Saved Segments',
    color: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  },
  list_campaigns: {
    icon: List,
    title: 'Listing Campaigns',
    color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
  },
  analyze_campaign_performance: {
    icon: Activity,
    title: 'Analyzing Campaign Performance',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
};

function ToolCard({ toolName, status, params, result }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  
  const toastCtx = useToast();
  const showToast = toastCtx ? toastCtx.showToast : () => {};
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const isPendingApproval = result?.status === 'pending_approval';
  const [isApproved, setIsApproved] = useState(!isPendingApproval && result?.success);
  const [launchResult, setLaunchResult] = useState(!isPendingApproval ? result : null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState(result?.messageTemplate || params?.messageTemplate || '');

  React.useEffect(() => {
    if (result) {
      if (result.status !== 'pending_approval' && result.success) {
        setIsApproved(true);
        setLaunchResult(result);
      }
      if (!editedTemplate) {
        setEditedTemplate(result.messageTemplate || params?.messageTemplate || '');
      }
    }
  }, [result]);

  const meta = toolMetadata[toolName] || {
    icon: HelpCircle,
    title: `Running ${toolName}`,
    color: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  };

  const Icon = meta.icon;
  const isRunning = status === 'running';

  const getSummary = () => {
    if (isRunning) return 'Executing operations...';
    if (!result) return 'Completed.';

    if (!result.success && result.error) {
      return `Failed: ${result.error}`;
    }

    switch (toolName) {
      case 'query_customers':
        return `Found ${result.count || 0} customers matching target criteria.`;
      case 'create_segment':
        return `Segment "${result.name}" created with ${result.customerCount || 0} customers.`;
      case 'draft_message':
        return `Drafted template message for ${result.channel || 'sms'}.`;
      case 'preview_campaign':
        return `Generated previews for ${result.previews?.length || 0} customers.`;
      case 'launch_campaign':
        return isApproved
          ? `Campaign launched! ${launchResult?.totalQueued || result?.audienceSize || result?.totalQueued || 0} messages queued successfully.`
          : `Campaign drafted and awaiting approval for ${result?.channel || params?.channel || 'WhatsApp'}.`;
      case 'get_campaign_stats':
        return `Retrieved live metrics. Delivery: ${result.rates?.deliveryRate || 0}%, Conversion: ${result.rates?.convertRate || 0}%.`;
      case 'list_segments':
        return `Loaded ${result.count || 0} saved segment filters.`;
      case 'list_campaigns':
        return `Loaded ${result.campaigns?.length || 0} campaigns from database.`;
      case 'analyze_campaign_performance':
        return `Analyzed metrics. Overall conversion rate is ${result.summary?.conversionRate || '0%'}.`;
      default:
        return 'Operation completed successfully.';
    }
  };

  // Structured Renderer: Segment Creation Card
  const renderSegmentDetails = () => {
    const count = result?.customerCount || 0;
    let avgSpend = '₹7,450';
    let recency = 'Any time';

    const conditions = params?.rules?.conditions || [];
    const spendCond = conditions.find((c) => c.field === 'totalSpend');
    if (spendCond) {
      if (spendCond.operator === 'gt' || spendCond.operator === 'gte') {
        avgSpend = `> ₹${Number(spendCond.value).toLocaleString()}`;
      } else if (spendCond.operator === 'lt' || spendCond.operator === 'lte') {
        avgSpend = `< ₹${Number(spendCond.value).toLocaleString()}`;
      } else {
        avgSpend = `₹${Number(spendCond.value).toLocaleString()}`;
      }
    }

    const recencyCond = conditions.find((c) => c.field === 'lastOrderDate' || c.field === 'days_ago');
    if (recencyCond) {
      if (recencyCond.operator === 'days_ago') {
        recency = `< ${recencyCond.value} days ago`;
      } else {
        recency = `Filtered Date`;
      }
    }

    const createdTime = result?.createdAt
      ? new Date(result.createdAt).toLocaleString()
      : new Date().toLocaleString();

    return (
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border-t border-slate-100 text-xs">
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Segment Name</span>
          <span class="font-extrabold text-slate-800">{result?.name || params?.name || '—'}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Customer Count</span>
          <span class="font-extrabold text-slate-800">{count.toLocaleString()} shoppers</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Average Spend</span>
          <span class="font-extrabold text-amber-600">{avgSpend}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Purchase Recency</span>
          <span class="font-extrabold text-slate-800">{recency}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Created Timestamp</span>
          <span class="font-semibold text-slate-600">{createdTime}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Status</span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-600 rounded-full">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            ACTIVE
          </span>
        </div>
      </div>
    );
  };

  // Structured Renderer: Campaign/Message Drafting Card
  const renderDraftDetails = () => {
    const channel = result?.channel || params?.channel || 'sms';
    let discount = 'Standard Promo';
    const textToSearch = `${params?.goal || ''} ${result?.message || ''}`.toLowerCase();
    const discountMatch = textToSearch.match(/(\d+%\s*(off|discount)?)/);
    if (discountMatch) {
      discount = discountMatch[1].toUpperCase();
    }

    return (
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border-t border-slate-100 text-xs">
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Campaign Name</span>
          <span class="font-extrabold text-slate-800">{`Draft: ${params?.segmentName || 'Campaign'}`}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Target Segment</span>
          <span class="font-extrabold text-slate-800">{params?.segmentName || '—'}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Audience Size</span>
          <span class="font-extrabold text-slate-800">Dynamic Segment</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Channel</span>
          <span class="font-extrabold text-slate-800 capitalize">{channel}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Discount/Goal</span>
          <span class="font-extrabold text-amber-600">{discount}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Status</span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-[10px] font-black text-indigo-600 rounded-full">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            DRAFTED
          </span>
        </div>
      </div>
    );
  };

  // Structured Renderer: Campaign Review Card (Approval Workflow)
  const renderCampaignReview = () => {
    const audienceSize = result?.audienceSize || 0;
    const estDeliveryRate = result?.estimatedDeliveryRate || 98;
    const expOpenRate = result?.expectedOpenRate || 68;
    const previewRecipients = result?.previewRecipients || [];

    const handleLaunch = async () => {
      setIsLaunching(true);
      try {
        const campaignId = result?.campaignId || launchResult?.campaignId;
        if (!campaignId) {
          throw new Error('No campaignId found to launch');
        }

        // 1. If edited, update the campaign messageTemplate in DB
        const templateToSave = editedTemplate || result?.messageTemplate || params?.messageTemplate || '';
        const originalTemplate = result?.messageTemplate || params?.messageTemplate || '';
        if (templateToSave !== originalTemplate) {
          await axios.put(`${API_URL}/api/campaigns/${campaignId}`, {
            messageTemplate: templateToSave
          });
        }

        // 2. Launch the campaign
        const launchRes = await axios.post(`${API_URL}/api/campaigns/${campaignId}/launch`);
        
        showToast('🚀 Campaign launched successfully!', 'success', `/campaigns/${campaignId}`);
        
        setIsApproved(true);
        setLaunchResult({
          success: true,
          totalQueued: launchRes.data.totalQueued || audienceSize,
          campaignId: campaignId,
          campaignName: result?.campaignName || params?.campaignName,
          channel: result?.channel || params?.channel
        });
      } catch (err) {
        console.error('Error launching campaign:', err);
        showToast('⚠️ Failed to launch campaign. Please check backend services.', 'error');
      } finally {
        setIsLaunching(false);
      }
    };

    return (
      <div class="border-t border-slate-100 bg-slate-50/50 p-5 space-y-5 text-xs text-slate-800">
        {/* Review Banner */}
        <div class="bg-amber-50 border border-amber-200/50 rounded-xl p-3.5 flex items-start gap-2.5">
          <Rocket class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div class="space-y-0.5">
            <span class="font-bold text-amber-800">Campaign Ready for Review</span>
            <p class="text-[10px] text-amber-700 leading-relaxed font-medium">
              This campaign has been drafted. Please review the segment details, message preview, and expected performance metrics before launching.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm">
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Campaign Name</span>
            <span class="font-extrabold text-slate-800">{result?.campaignName || params?.campaignName || '—'}</span>
          </div>
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Target Segment</span>
            <span class="font-extrabold text-slate-800">{result?.segmentName || params?.segmentName || '—'}</span>
          </div>
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Audience Size</span>
            <span class="font-extrabold text-slate-800">{audienceSize.toLocaleString()} recipients</span>
          </div>
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Channel</span>
            <span class="font-extrabold text-slate-800 capitalize">{result?.channel || params?.channel || '—'}</span>
          </div>
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Est. Delivery Rate</span>
            <span class="font-extrabold text-blue-600">{estDeliveryRate}%</span>
          </div>
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Expected Open Rate</span>
            <span class="font-extrabold text-amber-600">{expOpenRate}%</span>
          </div>
        </div>

        {/* Message Template Preview Box */}
        <div class="space-y-2">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-black">Message Preview</span>
          {isEditing ? (
            <div class="space-y-2">
              <textarea
                value={editedTemplate}
                onChange={(e) => setEditedTemplate(e.target.value)}
                class="w-full min-h-[80px] p-3 text-xs border border-slate-350 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none font-semibold text-slate-700 bg-white"
                placeholder="Enter customized template message..."
              />
              <div class="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div class="p-3.5 bg-slate-100/80 border border-slate-200/50 rounded-xl font-semibold italic text-slate-700 leading-relaxed relative group">
              "{editedTemplate || result?.messageTemplate || params?.messageTemplate}"
            </div>
          )}
        </div>

        {/* Preview Recipients Drawer */}
        {showPreview && (
          <div class="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-black">Recipient Sample Preview</span>
            <div class="overflow-x-auto bg-white border border-slate-200/60 rounded-xl shadow-sm">
              <table class="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-150 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <th class="py-2.5 px-3">Customer Name</th>
                    <th class="py-2.5 px-3">City</th>
                    <th class="py-2.5 px-3 text-right">Total Spend</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {previewRecipients.map((cust, idx) => (
                    <tr key={idx} class="hover:bg-slate-50/50">
                      <td class="py-2 px-3 font-bold text-slate-800">{cust.name}</td>
                      <td class="py-2 px-3 text-slate-500 font-semibold">{cust.city}</td>
                      <td class="py-2 px-3 text-right font-extrabold text-amber-600">
                        ₹{Number(cust.totalSpend).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Buttons / Actions Row */}
        <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-150">
          <div class="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Eye class="w-3.5 h-3.5 text-slate-400" />
              {showPreview ? 'Hide Recipients' : 'Preview Recipients'}
            </button>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                class="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Edit2 class="w-3.5 h-3.5 text-slate-400" />
                Edit Message
              </button>
            )}
          </div>

          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            class="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold flex items-center gap-2 shadow-md shadow-amber-600/10 hover:shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLaunching ? (
              <>
                <Loader2 class="w-3.5 h-3.5 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Rocket class="w-3.5 h-3.5" />
                Launch Campaign
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Structured Renderer: Campaign Launch Success Card
  const renderLaunchSuccess = () => {
    const queuedCount = launchResult?.totalQueued || result?.audienceSize || 0;
    const launchTime = new Date().toLocaleString();
    const campaignId = launchResult?.campaignId || result?.campaignId;

    return (
      <div class="border-t border-slate-100 bg-emerald-50/10 p-5 space-y-4 text-xs text-slate-850">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Launch Approval</span>
            <span class="text-sm font-black text-slate-900 block mt-0.5">Campaign Dispatched Successfully!</span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm">
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Campaign Name</span>
            <span class="font-extrabold text-slate-800">{launchResult?.campaignName || result?.campaignName || params?.campaignName || '—'}</span>
          </div>
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Messages Queued</span>
            <span class="font-extrabold text-slate-800">{queuedCount.toLocaleString()} dispatches</span>
          </div>
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Delivery Progress</span>
            <div class="flex flex-col gap-1 mt-0.5">
              <span class="font-extrabold text-emerald-650 flex items-center gap-1">100% Dispatched</span>
              <div class="w-24 bg-slate-200 rounded-full h-1 overflow-hidden">
                <div class="bg-emerald-500 h-1 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          <div class="space-y-0.5">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Launch Time</span>
            <span class="font-semibold text-slate-650">{launchTime}</span>
          </div>
          <div class="space-y-0.5 col-span-2">
            <span class="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Status</span>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-600 rounded-full mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              DISPATCHED
            </span>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <a
            href={`/campaigns/${campaignId}`}
            class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold flex items-center gap-2 shadow-sm transition-all text-[11px]"
          >
            <BarChart3 class="w-3.5 h-3.5 text-amber-500" />
            View Live Performance Stats →
          </a>
        </div>
      </div>
    );
  };

  // Structured Renderer: Query Customers Card
  const renderQueryDetails = () => {
    const count = result?.count || 0;
    return (
      <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 border-t border-slate-100 text-xs">
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Matched Count</span>
          <span class="font-extrabold text-slate-800">{count.toLocaleString()} customers found</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Target Filters</span>
          <span class="font-semibold text-slate-600 font-mono">
            {params?.rules?.conditions?.map((c) => `${c.field} ${c.operator} ${c.value}`).join(', ') || 'No filters'}
          </span>
        </div>
      </div>
    );
  };

  // Structured Renderer: Campaign Stats Card
  const renderStatsDetails = () => {
    return (
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border-t border-slate-100 text-xs">
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Sent</span>
          <span class="font-extrabold text-slate-800">{result?.stats?.sent || 0}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Delivery Rate</span>
          <span class="font-extrabold text-slate-800">{result?.rates?.deliveryRate || 0}%</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Open Rate</span>
          <span class="font-extrabold text-amber-600">{result?.rates?.openRate || 0}%</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Conversion Rate</span>
          <span class="font-extrabold text-emerald-600">{result?.rates?.convertRate || 0}%</span>
        </div>
      </div>
    );
  };

  const renderAnalysisDetails = () => {
    return (
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 bg-slate-50 border-t border-slate-100 text-xs">
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Audience Size</span>
          <span class="font-extrabold text-slate-800">{result?.summary?.audienceSize || 0}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Delivery Rate</span>
          <span class="font-extrabold text-slate-800">{result?.summary?.deliveryRate || '0%'}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Read Rate</span>
          <span class="font-extrabold text-amber-600">{result?.summary?.readRate || '0%'}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Click Rate</span>
          <span class="font-extrabold text-orange-600">{result?.summary?.clickRate || '0%'}</span>
        </div>
        <div class="space-y-1">
          <span class="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Conversion Rate</span>
          <span class="font-extrabold text-emerald-600">{result?.summary?.conversionRate || '0%'}</span>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isRunning) return null;
    switch (toolName) {
      case 'create_segment':
        return renderSegmentDetails();
      case 'draft_message':
        return renderDraftDetails();
      case 'launch_campaign':
        return isApproved ? renderLaunchSuccess() : renderCampaignReview();
      case 'query_customers':
        return renderQueryDetails();
      case 'get_campaign_stats':
        return renderStatsDetails();
      case 'analyze_campaign_performance':
        return renderAnalysisDetails();
      default:
        return null;
    }
  };

  return (
    <div class="border border-slate-200 bg-white rounded-2xl my-3 overflow-hidden shadow-sm max-w-2xl w-full transition-all duration-200">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        class="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 select-none transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class={`p-2 rounded-xl border flex items-center justify-center ${meta.color}`}>
            <Icon class="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
          <div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">System Exec</span>
            <span class="text-sm font-black text-slate-800 mt-0.5 block">{meta.title}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          {isRunning ? (
            <Loader2 class="w-4 h-4 text-amber-600 animate-spin" />
          ) : (
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
          )}
          {isOpen ? <ChevronUp class="w-4 h-4 text-slate-400" /> : <ChevronDown class="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Summary status text */}
      <div class="px-4 py-2.5 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
        <span class="text-xs font-semibold text-slate-500 italic">
          {getSummary()}
        </span>
        {!isRunning && (
          toolName === 'launch_campaign' && !isApproved ? (
            <span class="text-[9px] font-black px-2 py-0.5 bg-amber-50 border border-amber-200/60 text-amber-700 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Awaiting Approval
            </span>
          ) : (
            <span class="text-[9px] font-black px-2 py-0.5 bg-emerald-50 border border-emerald-200/60 text-emerald-700 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span class="w-1 h-1 rounded-full bg-emerald-500"></span>
              Success
            </span>
          )
        )}
      </div>

      {/* Structured Details Render */}
      {isOpen && renderContent()}

      {/* Developer Raw JSON Toggle */}
      {isOpen && (
        <div class="px-4 py-2.5 border-t border-slate-100 bg-slate-50/20 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRawJson(!showRawJson);
            }}
            class="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer uppercase tracking-wider"
          >
            {showRawJson ? 'Hide Raw JSON' : 'Show Raw JSON'}
          </button>
        </div>
      )}

      {/* Raw Developer JSON */}
      {isOpen && showRawJson && (
        <div class="p-4 border-t border-slate-100 bg-slate-900 font-mono text-[10px] text-slate-300 overflow-x-auto divide-y divide-slate-800">
          {params && (
            <div class="pb-3">
              <span class="text-[9px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Input Parameters:</span>
              <pre class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400 leading-relaxed overflow-x-auto">
                {JSON.stringify(params, null, 2)}
              </pre>
            </div>
          )}
          {result && (
            <div class="pt-3">
              <span class="text-[9px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Output Result:</span>
              <pre class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400 leading-relaxed overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ToolCard;
