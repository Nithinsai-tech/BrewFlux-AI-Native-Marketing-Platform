import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Users,
  DollarSign,
  Activity,
  Award,
  MessageSquare,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    activeCampaigns: 0,
    avgOrderValue: 0,
  });
  const [recommendations, setRecommendations] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [channelPerformance, setChannelPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [countRes, insightsRes, campaignsRes] = await Promise.all([
        axios.get(`${API_URL}/api/customers/count`),
        axios.get(`${API_URL}/api/insights`),
        axios.get(`${API_URL}/api/campaigns`),
      ]);

      const totalCustomers = countRes.data.count || 0;
      const insights = insightsRes.data || {};
      const campaignsList = campaignsRes.data || [];

      const activeCampaigns = campaignsList.filter(c => c.status === 'running').length;

      const totalRevenue = insights.summary?.totalRevenue || 0;
      const totalOrders = insights.summary?.totalOrders || 1;
      const avgOrderValue = Math.round(totalRevenue / totalOrders);

      setStats({
        totalCustomers,
        totalRevenue,
        activeCampaigns,
        avgOrderValue,
      });

      setRecommendations(insights.insights || insights.recommendations || []);
      setRecentCampaigns(campaignsList.slice(0, 5));

      const channelStats = {
        whatsapp: { opened: 0, sent: 0, fallback: 78 },
        email: { opened: 0, sent: 0, fallback: 22 },
        sms: { opened: 0, sent: 0, fallback: 45 },
        rcs: { opened: 0, sent: 0, fallback: 65 },
      };

      campaignsList.forEach(c => {
        const ch = c.channel?.toLowerCase();
        if (channelStats[ch]) {
          channelStats[ch].opened += (c.stats?.opened || 0);
          channelStats[ch].sent += (c.stats?.total || 0);
        }
      });

      const performanceData = Object.keys(channelStats).map(ch => {
        const statsObj = channelStats[ch];
        const rate = statsObj.sent > 0
          ? Math.round((statsObj.opened / statsObj.sent) * 100)
          : statsObj.fallback;
        return {
          name: ch === 'whatsapp' ? 'WhatsApp' : ch === 'rcs' ? 'RCS' : ch.toUpperCase(),
          rate,
        };
      });

      setChannelPerformance(performanceData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch with loading spinner/skeleton
    fetchData(true);

    // Setup Socket.IO listener for real-time updates
    const socket = io(API_URL);

    const handleUpdate = () => {
      console.log('[Socket.IO] Real-time change detected. Refreshing dashboard metrics...');
      fetchData(false); // Silent fetch in background
    };

    socket.on('communication_update', handleUpdate);
    socket.on('campaign_status_change', handleUpdate);
    socket.on('campaign_created', handleUpdate);
    socket.on('data_ingested', handleUpdate);

    return () => {
      socket.off('communication_update', handleUpdate);
      socket.off('campaign_status_change', handleUpdate);
      socket.off('campaign_created', handleUpdate);
      socket.off('data_ingested', handleUpdate);
      socket.disconnect();
    };
  }, []);

  const handleLaunchRecommendation = (rec) => {
    sessionStorage.setItem('aria_prefill', JSON.stringify({
      prefillMessage: `Launch a ${rec.recommendedChannel} campaign for ${rec.segmentName}: ${rec.description}`
    }));
    navigate('/assistant');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getChannelIcon = (ch) => {
    switch (ch?.toLowerCase()) {
      case 'whatsapp':
        return <MessageSquare class="w-4 h-4 text-emerald-600" />;
      case 'email':
        return <Mail class="w-4 h-4 text-blue-600" />;
      case 'sms':
        return <Phone class="w-4 h-4 text-indigo-600" />;
      case 'rcs':
        return <Sparkles class="w-4 h-4 text-amber-600" />;
      default:
        return <MessageSquare class="w-4 h-4 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div class="space-y-8 p-1 animate-pulse">
        {/* Title skeleton */}
        <div class="space-y-2">
          <div class="h-8 bg-slate-200 rounded-lg w-1/5"></div>
          <div class="h-4 bg-slate-200 rounded-lg w-1/3"></div>
        </div>

        {/* KPI grid skeleton */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} class="h-32 bg-white border border-slate-200/60 rounded-2xl p-6 flex justify-between items-center shadow-sm">
              <div class="space-y-3 flex-1">
                <div class="h-3.5 bg-slate-200 rounded w-1/2"></div>
                <div class="h-7 bg-slate-200 rounded w-2/3"></div>
                <div class="h-3 bg-slate-200 rounded w-1/3"></div>
              </div>
              <div class="w-12 h-12 rounded-xl bg-slate-100 shrink-0"></div>
            </div>
          ))}
        </div>

        {/* Insights grid skeleton */}
        <div class="space-y-4">
          <div class="h-5 bg-slate-200 rounded w-1/6"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} class="bg-white border border-slate-200/60 rounded-2xl p-5 h-80 space-y-6 shadow-sm">
                <div class="flex justify-between items-center">
                  <div class="h-5 bg-slate-200 rounded w-1/2"></div>
                  <div class="w-7 h-7 rounded-lg bg-slate-100"></div>
                </div>
                <div class="space-y-2">
                  <div class="h-4 bg-slate-200 rounded w-full"></div>
                  <div class="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
                <div class="flex gap-2">
                  <div class="h-5 bg-slate-200 rounded w-20"></div>
                  <div class="h-5 bg-slate-200 rounded w-20"></div>
                </div>
                <div class="h-10 bg-slate-100 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 max-w-lg mx-auto mt-10">
        <span class="text-4xl block mb-4">⚠️</span>
        <h3 class="text-base font-extrabold text-slate-800">Failed to load dashboard insights</h3>
        <p class="text-xs text-slate-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div class="space-y-8 bg-slate-50 text-slate-800">
      {/* Title */}
      <div>
        <h2 class="text-2xl font-black tracking-tight text-slate-900">Dashboard</h2>
        <p class="text-xs text-slate-500 mt-1">
          BrewLux marketing hub and real-time CRM tracking matrix.
        </p>
      </div>

      {/* KPI Stats Row */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Customers */}
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm border-t-4 border-t-amber-600 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md group">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Customers</span>
            <span class="text-2xl font-black text-slate-800 mt-1 block tracking-tight">{stats.totalCustomers.toLocaleString()}</span>
            <span class="text-[9px] text-slate-400 font-bold block mt-1.5">across active retail hubs</span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-100">
            <Users class="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Total Revenue */}
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm border-t-4 border-t-amber-600 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md group">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <span class="text-2xl font-black text-slate-800 mt-1 block tracking-tight">{formatCurrency(stats.totalRevenue)}</span>
            <span class="text-[9px] text-slate-400 font-bold block mt-1.5">accumulated sales value</span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-100">
            <DollarSign class="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Active Campaigns */}
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm border-t-4 border-t-amber-600 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md group">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Campaigns</span>
            <span class="text-2xl font-black text-slate-800 mt-1 block tracking-tight">{stats.activeCampaigns}</span>
            <span class="text-[9px] text-slate-400 font-bold block mt-1.5">running right now</span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-100">
            <Activity class="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Avg Order Value */}
        <div class="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm border-t-4 border-t-amber-600 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md group">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Order Value</span>
            <span class="text-2xl font-black text-slate-800 mt-1 block tracking-tight">{formatCurrency(stats.avgOrderValue)}</span>
            <span class="text-[9px] text-slate-400 font-bold block mt-1.5">per checkout ticket</span>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-100">
            <Award class="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div class="space-y-4">
        <h3 class="text-base font-black text-slate-800 flex items-center gap-2">
          <Sparkles class="w-4.5 h-4.5 text-amber-600 animate-pulse" />
          Recommended Campaigns
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((rec, i) => {
            const urgencyStyles =
              rec.urgency === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200/50' :
              rec.urgency === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
              'bg-emerald-50 text-emerald-700 border-emerald-200/50';

            const urgencyEmoji =
              rec.urgency === 'high' ? '🔴' :
              rec.urgency === 'medium' ? '🟡' :
              '🟢';

            return (
              <div key={i} class="p-[1px] bg-gradient-to-br from-amber-500/80 to-amber-700 rounded-2xl shadow-sm flex flex-col hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] group">
                <div class="bg-white p-5 rounded-[15px] flex flex-col justify-between h-full space-y-4">
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${urgencyStyles}`}>
                        {urgencyEmoji} {rec.urgency} Priority
                      </span>
                      <span class="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {getChannelIcon(rec.recommendedChannel)}
                      </span>
                    </div>

                    <div class="space-y-1">
                      <h4 class="font-extrabold text-slate-800 text-sm group-hover:text-amber-700 transition-colors">{rec.segmentName}</h4>
                      <p class="text-[11px] text-slate-500 leading-relaxed">{rec.description}</p>
                    </div>

                    <div class="flex flex-wrap gap-2 pt-1">
                      <span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 text-[9px] text-slate-600 font-extrabold">
                        👥 {rec.customerCount} customers
                      </span>
                      <span class="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/40 text-[9px] text-amber-700 font-extrabold">
                        📈 {rec.estimatedOpenRate} open rate
                      </span>
                    </div>

                    <p class="text-[11px] text-slate-400 font-semibold italic border-t border-slate-50 pt-2 leading-relaxed">
                      "{rec.reasoning}"
                    </p>
                  </div>

                  <button
                    onClick={() => handleLaunchRecommendation(rec)}
                    class="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Launch with Aria <ArrowRight class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaigns Table & Channel Chart */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Recent Campaigns list */}
        <div class="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 class="text-sm font-black text-slate-900">Recent Campaigns</h3>
            <Link to="/campaigns" class="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1">
              View All <ChevronRight class="w-3.5 h-3.5" />
            </Link>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">
                  <th class="py-3 px-3">Name</th>
                  <th class="py-3 px-3">Channel</th>
                  <th class="py-3 px-3">Status</th>
                  <th class="py-3 px-3">Sent</th>
                  <th class="py-3 px-3">Delivery%</th>
                  <th class="py-3 px-3">Open%</th>
                  <th class="py-3 px-3">Created</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                {recentCampaigns.map((c) => {
                  const sentCount = c.stats?.total || 0;
                  const deliveredCount = c.stats?.delivered || 0;
                  const openedCount = c.stats?.opened || 0;

                  const deliveryRate = sentCount > 0 ? Math.round((deliveredCount / sentCount) * 100) : 0;
                  const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;

                  return (
                    <tr
                      key={c._id}
                      onClick={() => navigate(`/campaigns/${c._id}`)}
                      class="hover:bg-slate-50 transition-all cursor-pointer group"
                    >
                      <td class="py-3.5 px-3 font-bold text-slate-850 group-hover:text-amber-600 transition-colors whitespace-nowrap">
                        {c.name}
                      </td>
                      <td class="py-3.5 px-3 whitespace-nowrap">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600 uppercase">
                          {getChannelIcon(c.channel)}
                          <span class="text-[10px] ml-0.5">{c.channel}</span>
                        </span>
                      </td>
                      <td class="py-3.5 px-3 whitespace-nowrap">
                        {c.status === 'running' ? (
                          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-600 rounded-full uppercase tracking-wider animate-pulse">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            RUNNING
                          </span>
                        ) : c.status === 'completed' ? (
                          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-600 rounded-full uppercase tracking-wider">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            COMPLETED
                          </span>
                        ) : c.status === 'failed' ? (
                          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-200 text-[10px] font-black text-rose-600 rounded-full uppercase tracking-wider">
                            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            FAILED
                          </span>
                        ) : (
                          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-500 rounded-full uppercase tracking-wider">
                            <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            DRAFT
                          </span>
                        )}
                      </td>
                      <td class="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">{sentCount}</td>
                      <td class="py-3.5 px-3 font-bold text-slate-800 whitespace-nowrap">{deliveryRate}%</td>
                      <td class="py-3.5 px-3 font-bold text-slate-800 whitespace-nowrap">{openRate}%</td>
                      <td class="py-3.5 px-3 text-slate-500 text-xs font-medium whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {recentCampaigns.length === 0 && (
                  <tr>
                    <td colSpan="7" class="py-12 text-center text-slate-400">
                      <div class="flex flex-col items-center gap-2">
                        <Inbox class="w-8 h-8 text-slate-300" />
                        <span class="text-xs font-bold text-slate-500">No campaigns found</span>
                        <span class="text-[10px] text-slate-400">Use Aria to draft and dispatch your first campaign!</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel Performance Chart */}
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div class="pb-2 border-b border-slate-100">
            <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp class="w-4 h-4 text-amber-600" />
              Channel Performance
            </h3>
          </div>
          <div class="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelPerformance}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip
                  cursor={{ fill: 'rgba(217, 119, 6, 0.04)' }}
                  contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                />
                <Bar dataKey="rate" fill="#d97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
