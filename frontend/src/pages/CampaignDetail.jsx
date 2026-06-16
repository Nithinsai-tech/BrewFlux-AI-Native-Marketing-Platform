import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  ArrowLeft,
  Rocket,
  RefreshCw,
  Radio,
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox,
  Activity,
  Send,
  CheckCircle2,
  Eye,
  MousePointer,
  Trophy,
  AlertCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useToast } from '../App.jsx';

function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(value || 0);

  useEffect(() => {
    let start = displayValue;
    const end = value || 0;
    if (start === end) return;

    const duration = 800;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

function AnimatedPercent({ value }) {
  const [displayValue, setDisplayValue] = useState(value || 0);

  useEffect(() => {
    let start = displayValue;
    const end = value || 0;
    if (start === end) return;

    const duration = 800;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return <span>{displayValue}%</span>;
}

function CampaignDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [campaign, setCampaign] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [commPage, setCommPage] = useState(1);
  const [commPages, setCommPages] = useState(1);
  const [commTotal, setCommTotal] = useState(0);
  const [commStatus, setCommStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [events, setEvents] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchCampaign = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/campaigns/${id}`);
      setCampaign(res.data);
    } catch (err) {
      console.error('Error fetching campaign details:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/campaigns/${id}/stats`);
      setStatsData(res.data);
    } catch (err) {
      console.error('Error fetching campaign stats:', err);
    }
  };

  const fetchCommunications = async (page = 1, status = 'all') => {
    try {
      const statusParam = status !== 'all' ? `&status=${status}` : '';
      const res = await axios.get(
        `${API_URL}/api/campaigns/${id}/communications?page=${page}&limit=20${statusParam}`
      );
      setCommunications(res.data.communications || []);
      setCommPage(res.data.page || 1);
      setCommPages(res.data.pages || 1);
      setCommTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching communications list:', err);
    }
  };

  const fetchInitialEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/campaigns/${id}/communications?limit=50`);
      const comms = res.data.communications || [];
      const loadedEvents = comms.map((comm) => {
        const timestamp = comm.updatedAt || comm.sentAt || new Date();
        return {
          id: comm._id + '-' + comm.status,
          timestamp: new Date(timestamp),
          time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
          status: comm.status,
          customerName: comm.customerId?.name || 'Unknown Customer',
        };
      });
      setEvents(loadedEvents);
    } catch (err) {
      console.error('Error fetching initial events:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCampaign(), fetchStats(), fetchCommunications(1, 'all'), fetchInitialEvents()]);
      setLoading(false);
    };
    init();
  }, [id]);

  // Polling for stats every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchInitialEvents();
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  // Socket.IO real-time listeners
  useEffect(() => {
    const socket = io(API_URL);

    socket.on('connect', () => {
      socket.emit('join_campaign', id);
    });

    socket.on('campaign_status_change', (data) => {
      if (data.campaignId === id) {
        setCampaign((prev) => (prev ? { ...prev, status: data.status } : null));
        if (data.status === 'running') {
          showToast(`🚀 Campaign "${campaign?.name || 'Campaign'}" is now running live!`, 'info');
        } else if (data.status === 'completed') {
          showToast(`✅ Campaign "${campaign?.name || 'Campaign'}" has completed dispatches!`, 'success');
        }
      }
    });

    socket.on('stat_update', (data) => {
      if (data.campaignId === id) {
        setStatsData((prev) => (prev ? { ...prev, stats: data.stats } : null));
        setCampaign((prev) => (prev ? { ...prev, stats: data.stats } : null));
      }
    });

    socket.on('communication_update', (data) => {
      if (data.campaignId === id) {
        setStatsData((prev) =>
          prev ? { ...prev, stats: data.updatedStats.stats } : null
        );
        setCampaign((prev) =>
          prev ? { ...prev, stats: data.updatedStats.stats } : null
        );
        // Add to live events feed
        setEvents((prevEvents) => {
          const eventId = data.communicationId + '-' + data.status;
          if (prevEvents.some((e) => e.id === eventId)) return prevEvents;

          const newEvent = {
            id: eventId,
            timestamp: new Date(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            status: data.status,
            customerName: data.customerName || 'Customer',
          };
          return [newEvent, ...prevEvents].slice(0, 50);
        });
        fetchCommunications(commPage, commStatus);
      }
    });

    return () => {
      socket.emit('leave_campaign', id);
      socket.disconnect();
    };
  }, [id, commPage, commStatus, campaign]);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await axios.post(`${API_URL}/api/campaigns/${id}/launch`);
      showToast('🚀 Campaign launched successfully! Dispatching messages in real time.', 'success');
      await Promise.all([fetchCampaign(), fetchStats(), fetchCommunications(1, commStatus)]);
    } catch (err) {
      console.error('Error launching campaign:', err);
      showToast('⚠️ Failed to launch campaign. Please check backend services.', 'error');
    } finally {
      setLaunching(false);
    }
  };

  const handleStatusTabChange = (status) => {
    setCommStatus(status);
    fetchCommunications(1, status);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Pending'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Pending'
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div class="space-y-8 animate-pulse p-1">
        {/* Header skeleton */}
        <div class="flex justify-between items-center">
          <div class="h-5 bg-slate-200 rounded w-28"></div>
          <div class="flex gap-2">
            <div class="w-8 h-8 rounded bg-slate-200"></div>
            <div class="w-32 h-8 rounded bg-slate-200"></div>
          </div>
        </div>

        {/* Campaign Info Card skeleton */}
        <div class="bg-white border border-slate-200/60 rounded-2xl p-6 h-36 space-y-4 shadow-sm">
          <div class="h-4 bg-slate-200 rounded w-16"></div>
          <div class="h-6 bg-slate-200 rounded w-1/3"></div>
          <div class="h-3 bg-slate-200 rounded w-1/5"></div>
        </div>

        {/* Funnel grid skeleton */}
        <div class="grid grid-cols-1 sm:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} class="bg-white border border-slate-200/60 rounded-2xl p-5 h-28 shadow-sm flex flex-col justify-center items-center gap-2">
              <div class="h-6 bg-slate-200 rounded w-1/2"></div>
              <div class="h-3.5 bg-slate-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>

        {/* Graph skeleton */}
        <div class="h-80 bg-white border border-slate-200/60 rounded-2xl shadow-sm"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div class="text-center py-20 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto mt-10 shadow-sm">
        <h3 class="text-base font-extrabold text-slate-800">Campaign not found</h3>
        <Link to="/dashboard" class="text-xs text-amber-600 hover:underline mt-3 inline-block font-bold">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const stats = statsData?.stats || campaign.stats || {
    total: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    read: 0,
    clicked: 0,
    converted: 0,
    failed: 0,
  };

  const totalQueued = stats.total || 0;
  const sentCount = stats.sent || 0;
  const deliveredCount = stats.delivered || 0;
  const readCount = stats.read || stats.opened || 0;
  const clickedCount = stats.clicked || 0;
  const convertedCount = stats.converted || 0;

  const sentPct = totalQueued > 0 ? Math.round((sentCount / totalQueued) * 100) : 0;
  const devPct = sentCount > 0 ? Math.round((deliveredCount / sentCount) * 100) : 0;
  const readPct = deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100) : 0;
  const clPct = readCount > 0 ? Math.round((clickedCount / readCount) * 100) : 0;
  const coPct = clickedCount > 0 ? Math.round((convertedCount / clickedCount) * 100) : 0;

  // Prepare line chart timeline data
  const chartData = (statsData?.timeline || []).map((t) => ({
    time: formatTime(t.minute),
    Delivered: t.delivered,
    Opened: t.opened,
    Clicked: t.clicked,
  }));

  const getEventDetails = (status) => {
    switch (status) {
      case 'queued':
        return {
          label: 'Message Queued',
          color: 'text-slate-500 bg-slate-100 border-slate-200',
          icon: <Clock class="w-4 h-4" />
        };
      case 'sent':
        return {
          label: 'Message Sent',
          color: 'text-blue-500 bg-blue-50 border-blue-100',
          icon: <Send class="w-4 h-4" />
        };
      case 'delivered':
        return {
          label: 'Message Delivered',
          color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
          icon: <CheckCircle2 class="w-4 h-4" />
        };
      case 'read':
      case 'opened':
        return {
          label: 'Message Read',
          color: 'text-amber-500 bg-amber-50 border-amber-100',
          icon: <Eye class="w-4 h-4" />
        };
      case 'clicked':
        return {
          label: 'Link Clicked',
          color: 'text-orange-500 bg-orange-50 border-orange-100',
          icon: <MousePointer class="w-4 h-4" />
        };
      case 'converted':
        return {
          label: 'Goal Converted',
          color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
          icon: <Trophy class="w-4 h-4" />
        };
      case 'failed':
        return {
          label: 'Delivery Failed',
          color: 'text-rose-500 bg-rose-50 border-rose-100',
          icon: <AlertCircle class="w-4 h-4" />
        };
      default:
        return {
          label: 'Activity Logged',
          color: 'text-slate-500 bg-slate-50 border-slate-100',
          icon: <Activity class="w-4 h-4" />
        };
    }
  };

  return (
    <div class="space-y-8 bg-slate-50 text-slate-800">
      {/* Top Header Navigation */}
      <div class="flex items-center justify-between">
        <Link to="/dashboard" class="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft class="w-4 h-4" /> Back to Dashboard
        </Link>
        <div class="flex items-center gap-3">
          <button
            onClick={() => Promise.all([fetchCampaign(), fetchStats(), fetchCommunications(1, commStatus), fetchInitialEvents()])}
            class="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
          
          {campaign.status === 'draft' ? (
            <button
              onClick={handleLaunch}
              disabled={launching}
              class="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Rocket class="w-3.5 h-3.5" /> {launching ? 'Launching...' : 'Launch Campaign'}
            </button>
          ) : (
            <span class="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-650 font-bold text-xs flex items-center gap-1.5 shadow-sm">
              <Radio class="w-3.5 h-3.5 animate-pulse text-emerald-500" /> Live Funnel Tracking
            </span>
          )}
        </div>
      </div>

      {/* Main Campaign details */}
      <div class="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden border-t-4 border-t-amber-600">
        <div class="flex items-start justify-between">
          <div class="space-y-1.5">
            <span class="px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest bg-slate-100 border border-slate-200 text-slate-500">
              {campaign.channel} Channel
            </span>
            <h2 class="text-xl font-black text-slate-900 mt-2">{campaign.name}</h2>
            <p class="text-[10px] text-slate-400 font-semibold">Created: {new Date(campaign.createdAt).toLocaleString()}</p>
          </div>
          <div class="text-right">
            <span class="text-[9px] text-slate-400 block uppercase font-black tracking-widest">Status</span>
            <div class="mt-1">
              {campaign.status === 'running' ? (
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-600 rounded-full uppercase tracking-wider animate-pulse">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  RUNNING
                </span>
              ) : campaign.status === 'completed' ? (
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-600 rounded-full uppercase tracking-wider">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  COMPLETED
                </span>
              ) : campaign.status === 'failed' ? (
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-200 text-[10px] font-black text-rose-600 rounded-full uppercase tracking-wider">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  FAILED
                </span>
              ) : (
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-505 rounded-full uppercase tracking-wider">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  DRAFT
                </span>
              )}
            </div>
          </div>
        </div>

        <div class="mt-5 p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
          <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest block">Message Template</span>
          <p class="text-xs text-slate-700 font-semibold italic leading-relaxed">"{campaign.messageTemplate}"</p>
        </div>
      </div>

      {/* Two column layout: Left (Stats, Funnel, Logs) & Right (Live Activity Feed) */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column */}
        <div class="lg:col-span-2 space-y-8">
          {/* Live Funnel (Queued -> Sent -> Delivered -> Read -> Clicked -> Converted) */}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
            📊 Conversion Funnel
          </h3>
          {stats.failed > 0 && (
            <span class="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-650 text-[11px] font-bold">
              ⚠️ {stats.failed} dispatches failed
            </span>
          )}
        </div>

        <div class="flex flex-col lg:flex-row items-stretch justify-between gap-3 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm overflow-x-auto">
          {/* Queued Card */}
          <div class="flex-1 min-w-[130px] flex flex-col justify-between p-4 bg-slate-50 border border-slate-200/50 rounded-xl relative hover:shadow-md transition-all duration-300">
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Queued</span>
              <span class="text-2xl font-black text-slate-800 block mt-2">
                <AnimatedNumber value={totalQueued} />
              </span>
            </div>
            <div class="h-6 mt-2"></div>
          </div>

          {/* Arrow */}
          <div class="flex lg:flex-col items-center justify-center text-slate-300 shrink-0">
            <div class="p-1.5 rounded-full bg-slate-100 border border-slate-200">
              <ArrowRight class="w-3.5 h-3.5 text-slate-400 stroke-[3] rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* Sent Card */}
          <div class="flex-1 min-w-[130px] flex flex-col justify-between p-4 bg-slate-50 border border-slate-200/50 rounded-xl relative hover:shadow-md transition-all duration-300">
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Sent</span>
              <span class="text-2xl font-black text-slate-800 block mt-2">
                <AnimatedNumber value={sentCount} />
              </span>
            </div>
            <div class="h-6 mt-2"></div>
          </div>

          {/* Arrow */}
          <div class="flex lg:flex-col items-center justify-center text-slate-300 shrink-0">
            <div class="p-1.5 rounded-full bg-slate-100 border border-slate-200">
              <ArrowRight class="w-3.5 h-3.5 text-slate-400 stroke-[3] rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* Delivered Card */}
          <div class="flex-1 min-w-[130px] flex flex-col justify-between p-4 bg-blue-50/10 border border-blue-100/70 rounded-xl relative hover:shadow-md transition-all duration-300 border-t-4 border-t-blue-500">
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider text-blue-500 block">Delivered</span>
              <span class="text-2xl font-black text-blue-600 block mt-2">
                <AnimatedNumber value={deliveredCount} />
              </span>
            </div>
            <div class="mt-2">
              <span class="inline-flex items-center px-2 py-0.5 bg-blue-50 text-[10px] font-extrabold text-blue-600 rounded">
                <AnimatedPercent value={devPct} />
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div class="flex lg:flex-col items-center justify-center text-slate-300 shrink-0">
            <div class="p-1.5 rounded-full bg-slate-100 border border-slate-200">
              <ArrowRight class="w-3.5 h-3.5 text-slate-400 stroke-[3] rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* Read Card */}
          <div class="flex-1 min-w-[130px] flex flex-col justify-between p-4 bg-amber-50/10 border border-amber-100/70 rounded-xl relative hover:shadow-md transition-all duration-300 border-t-4 border-t-amber-500">
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider text-amber-600 block">Read</span>
              <span class="text-2xl font-black text-amber-600 block mt-2">
                <AnimatedNumber value={readCount} />
              </span>
            </div>
            <div class="mt-2">
              <span class="inline-flex items-center px-2 py-0.5 bg-amber-50 text-[10px] font-extrabold text-amber-600 rounded">
                <AnimatedPercent value={readPct} />
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div class="flex lg:flex-col items-center justify-center text-slate-300 shrink-0">
            <div class="p-1.5 rounded-full bg-slate-100 border border-slate-200">
              <ArrowRight class="w-3.5 h-3.5 text-slate-400 stroke-[3] rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* Clicked Card */}
          <div class="flex-1 min-w-[130px] flex flex-col justify-between p-4 bg-orange-50/10 border border-orange-100/70 rounded-xl relative hover:shadow-md transition-all duration-300 border-t-4 border-t-orange-500">
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider text-orange-500 block">Clicked</span>
              <span class="text-2xl font-black text-orange-600 block mt-2">
                <AnimatedNumber value={clickedCount} />
              </span>
            </div>
            <div class="mt-2">
              <span class="inline-flex items-center px-2 py-0.5 bg-orange-50 text-[10px] font-extrabold text-orange-600 rounded">
                <AnimatedPercent value={clPct} />
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div class="flex lg:flex-col items-center justify-center text-slate-300 shrink-0">
            <div class="p-1.5 rounded-full bg-slate-100 border border-slate-200">
              <ArrowRight class="w-3.5 h-3.5 text-slate-400 stroke-[3] rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* Converted Card */}
          <div class="flex-1 min-w-[130px] flex flex-col justify-between p-4 bg-emerald-50/10 border border-emerald-100/70 rounded-xl relative hover:shadow-md transition-all duration-300 border-t-4 border-t-emerald-500">
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider text-emerald-500 block">Converted</span>
              <span class="text-2xl font-black text-emerald-600 block mt-2">
                <AnimatedNumber value={convertedCount} />
              </span>
            </div>
            <div class="mt-2">
              <span class="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-[10px] font-extrabold text-emerald-600 rounded">
                <AnimatedPercent value={coPct} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Event Log Chart */}
      <div class="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div class="mb-4 pb-2 border-b border-slate-105">
          <h3 class="text-sm font-black text-slate-900">Timeline Performance</h3>
          <p class="text-xs text-slate-500 mt-0.5">Real-time minute-by-minute performance curves.</p>
        </div>
        <div class="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="Delivered" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Opened" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Clicked" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Communications Paginated Logs Table */}
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-black text-slate-900">Delivery Audits</h3>
            <p class="text-xs text-slate-500 mt-0.5">Individual customer log transaction audits.</p>
          </div>

          {/* Filter Tabs */}
          <div class="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
            {['all', 'delivered', 'opened', 'clicked', 'failed'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleStatusTabChange(tab)}
                class={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  commStatus === tab
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Table */}
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">
                <th class="py-3 px-3">Customer Name</th>
                <th class="py-3 px-3">Channel</th>
                <th class="py-3 px-3">Message Preview</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3">Sent At</th>
                <th class="py-3 px-3">Last Updated</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              {communications.map((comm) => (
                <tr key={comm._id} class="hover:bg-slate-50 transition-colors">
                  <td class="py-3.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                    {comm.customerId?.name || 'Unknown Shopper'}
                  </td>
                  <td class="py-3.5 px-3 whitespace-nowrap">
                    <span class="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 uppercase">
                      {campaign.channel}
                    </span>
                  </td>
                  <td class="py-3.5 px-3 text-slate-600 truncate max-w-xs font-semibold whitespace-nowrap">
                    {comm.message}
                  </td>
                  <td class="py-3.5 px-3 whitespace-nowrap">
                    {comm.status === 'converted' ? (
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 border border-emerald-200 text-emerald-600 uppercase">
                        converted
                      </span>
                    ) : comm.status === 'clicked' ? (
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-50 border border-orange-200 text-orange-600 uppercase">
                        clicked
                      </span>
                    ) : comm.status === 'opened' || comm.status === 'read' ? (
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 border border-amber-200 text-amber-600 uppercase">
                        opened
                      </span>
                    ) : comm.status === 'failed' ? (
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 border border-rose-200 text-rose-600 uppercase">
                        failed
                      </span>
                    ) : comm.status === 'delivered' ? (
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 border border-blue-200 text-blue-600 uppercase">
                        delivered
                      </span>
                    ) : (
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 border border-slate-200 text-slate-500 uppercase">
                        {comm.status}
                      </span>
                    )}
                  </td>
                  <td class="py-3.5 px-3 text-slate-500 text-xs font-semibold whitespace-nowrap">
                    {formatDate(comm.sentAt)}
                  </td>
                  <td class="py-3.5 px-3 text-slate-500 text-xs font-semibold whitespace-nowrap">
                    {new Date(comm.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {communications.length === 0 && (
                <tr>
                  <td colSpan="6" class="py-12 text-center text-slate-400">
                    <div class="flex flex-col items-center gap-2">
                      <Inbox class="w-8 h-8 text-slate-300" />
                      <span class="text-xs font-bold text-slate-550">No audits found</span>
                      <span class="text-[10px] text-slate-400">No communication logs match the filter.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {commPages > 1 && (
          <div class="flex items-center justify-between border-t border-slate-100 pt-4">
            <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Showing page {commPage} of {commPages} ({commTotal} audits)
            </span>
            <div class="flex items-center gap-2">
              <button
                onClick={() => fetchCommunications(commPage - 1, commStatus)}
                disabled={commPage === 1}
                class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchCommunications(commPage + 1, commStatus)}
                disabled={commPage === commPages}
                class="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      </div> {/* End Left Column */}

      {/* Right Column (Live Activity Feed) */}
      <div class="space-y-6 lg:sticky lg:top-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col max-h-[600px]">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-black text-slate-900 flex items-center gap-2">
              <Activity class="w-4 h-4 text-amber-600 animate-pulse" /> Live Activity Feed
            </h3>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-150 text-[9px] font-extrabold text-emerald-600">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              LIVE
            </span>
          </div>

          <div class="overflow-y-auto flex-1 pr-1 space-y-3 custom-scrollbar" style={{ maxHeight: '500px' }}>
            {events.length === 0 ? (
              <div class="text-center py-12 text-slate-400 space-y-2">
                <Clock class="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                <p class="text-xs font-bold">Awaiting campaign events...</p>
              </div>
            ) : (
              events.map((event) => {
                const details = getEventDetails(event.status);
                return (
                  <div
                    key={event.id}
                    class="flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div class={`p-1.5 rounded-lg border ${details.color} shrink-0 mt-0.5`}>
                      {details.icon}
                    </div>
                    <div class="flex-1 min-w-0 space-y-0.5">
                      <div class="flex items-center justify-between">
                        <span class="text-[11px] font-black text-slate-800">{details.label}</span>
                        <span class="text-[9px] font-semibold text-slate-400">[{event.time}]</span>
                      </div>
                      <p class="text-xs text-slate-500 font-bold truncate">
                        Customer: <span class="text-slate-700">{event.customerName}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      </div> {/* End Two Column Grid */}
    </div>
  );
}

export default CampaignDetail;
