import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, RefreshCw, Megaphone, Inbox } from 'lucide-react';

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchCampaigns = () => {
    setLoading(true);
    fetch(`${API_URL}/api/campaigns`)
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div class="space-y-6 bg-slate-50 text-slate-800">
      {/* Top Header */}
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-black tracking-tight text-slate-900">Campaigns</h2>
          <p class="text-xs text-slate-500 mt-1">
            Monitor active campaigns and review performance statistics.
          </p>
        </div>
        <button
          onClick={fetchCampaigns}
          class="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw class="w-4 h-4" />
        </button>
      </div>

      {/* Campaigns list box */}
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase bg-slate-50/20 whitespace-nowrap">
                <th class="py-3 px-4">Campaign Name</th>
                <th class="py-3 px-4">Segment</th>
                <th class="py-3 px-4">Channel</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Audience</th>
                <th class="py-3 px-4">Created Date</th>
                <th class="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              {loading ? (
                // Skeletons
                [...Array(5)].map((_, i) => (
                  <tr key={i} class="animate-pulse">
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-2/3"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-1/2"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-1/3"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-1/4"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-1/3"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-1/2"></div></td>
                    <td class="py-4 px-4"><div class="h-4 bg-slate-200 rounded w-6"></div></td>
                  </tr>
                ))
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp._id} class="hover:bg-slate-50 transition-all group">
                    <td class="py-4 px-4 font-bold text-slate-800 whitespace-nowrap">
                      <Link to={`/campaigns/${camp._id}`} class="hover:text-amber-600 transition-colors">
                        {camp.name}
                      </Link>
                    </td>
                    <td class="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {camp.segmentId?.name || 'N/A'}
                    </td>
                    <td class="py-4 px-4 whitespace-nowrap">
                      <span class="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 border border-slate-200 text-slate-600 uppercase">
                        {camp.channel}
                      </span>
                    </td>
                    <td class="py-4 px-4 whitespace-nowrap">
                      {camp.status === 'running' ? (
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-600 rounded-full uppercase tracking-wider animate-pulse">
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          RUNNING
                        </span>
                      ) : camp.status === 'completed' ? (
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-600 rounded-full uppercase tracking-wider">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          COMPLETED
                        </span>
                      ) : camp.status === 'failed' ? (
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
                    <td class="py-4 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {camp.stats?.total?.toLocaleString() || 0}
                    </td>
                    <td class="py-4 px-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                      {new Date(camp.createdAt).toLocaleDateString()}
                    </td>
                    <td class="py-4 px-4 text-right whitespace-nowrap">
                      <Link to={`/campaigns/${camp._id}`} class="text-slate-400 group-hover:text-amber-600 transition-colors">
                        <ChevronRight class="w-5 h-5 inline" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
              {campaigns.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" class="py-16 text-center text-slate-400">
                    <div class="flex flex-col items-center gap-2">
                      <Inbox class="w-8 h-8 text-slate-300" />
                      <span class="text-xs font-bold text-slate-550">No campaigns launched yet</span>
                      <span class="text-[10px] text-slate-400">Use Aria CRM assistant to build a segment and dispatch a message!</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Campaigns;
