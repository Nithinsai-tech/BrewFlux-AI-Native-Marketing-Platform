import React from 'react';
import { NavLink } from 'react-router-dom';
import { Coffee, MessageSquareText, LayoutDashboard, Users, Megaphone } from 'lucide-react';

function Sidebar() {
  const assistantItem = { name: 'AI Assistant', path: '/assistant', icon: MessageSquareText };
  const coreItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3.5 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg mx-3 border-l-2 ${
      isActive
        ? 'bg-amber-500/10 text-amber-500 font-bold border-l-amber-500 shadow-sm shadow-amber-500/5'
        : 'text-slate-400 hover:text-slate-250 hover:bg-slate-800/30 border-l-transparent'
    }`;

  return (
    <aside class="w-64 bg-[#0f172a] text-slate-300 flex flex-col h-full z-20 border-r border-slate-800/80">
      {/* Brand Header */}
      <div class="p-6 border-b border-slate-800/60 flex items-center gap-3 shrink-0">
        <div class="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/20 transition-all duration-300 hover:scale-105">
          <Coffee class="w-5 h-5 text-white stroke-[2.5]" />
        </div>
        <div>
          <h1 class="font-black text-lg tracking-tight text-white">
            BrewLux
          </h1>
          <p class="text-[10px] text-amber-500 font-bold uppercase tracking-wider whitespace-nowrap">
            Premium Coffee Chain
          </p>
        </div>
      </div>

      {/* Nav Links Container */}
      <nav class="flex-1 py-6 flex flex-col justify-start">
        {/* Group 1: AI Strategic Assistant */}
        <div class="space-y-4">
          <span class="px-6 text-[9px] font-black text-slate-500 uppercase tracking-wider block">
            AI Assistant
          </span>
          <NavLink to={assistantItem.path} class={linkClass}>
            {({ isActive }) => {
              const Icon = assistantItem.icon;
              return (
                <>
                  <Icon
                    class={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-250'
                    }`}
                  />
                  <span>{assistantItem.name}</span>
                </>
              );
            }}
          </NavLink>
        </div>

        {/* Larger Gap between Groups */}
        <div class="mt-8 space-y-4">
          <span class="px-6 text-[9px] font-black text-slate-500 uppercase tracking-wider block">
            CRM Core
          </span>
          <div class="flex flex-col space-y-4">
            {coreItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} class={linkClass}>
                  {({ isActive }) => (
                    <>
                      <Icon
                        class={`w-5 h-5 transition-colors duration-200 ${
                          isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-slate-250'
                        }`}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer Branding */}
      <div class="p-6 border-t border-slate-800/60 flex flex-col gap-2 shrink-0">
        <div class="px-2 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center transition-all duration-300 hover:border-slate-600/50">
          <span class="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Powered by</span>
          <span class="text-xs text-amber-500 font-bold tracking-tight">Aria CRM AI</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
