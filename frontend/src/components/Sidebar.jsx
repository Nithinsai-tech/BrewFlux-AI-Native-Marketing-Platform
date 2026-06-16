import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Coffee, MessageSquareText, LayoutDashboard, Users, Megaphone } from 'lucide-react';

function Sidebar({ isOpen, onClose }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [clickedItem, setClickedItem] = useState(null);
  const location = useLocation();

  const assistantItem = { name: 'AI Assistant', path: '/assistant', icon: MessageSquareText };
  const coreItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
  ];

  const handleNavClick = (path) => {
    setClickedItem(path);
    if (onClose) onClose();
    setTimeout(() => setClickedItem(null), 300);
  };

  const getNavItemClass = (path) => {
    const isActive = location.pathname === path;
    const isClicked = clickedItem === path;

    // Base classes
    let classes = "cursor-pointer rounded-lg px-3 py-2 flex items-center gap-3 transition-all duration-200 ";

    // Click flash takes precedence, then active, then default/hover
    if (isClicked) {
      classes += "bg-amber-500/35 scale-95 text-amber-300";
    } else if (isActive) {
      classes += "bg-amber-500/20 border-l-4 border-amber-500 text-amber-400 font-semibold";
    } else {
      classes += "text-slate-400 hover:bg-amber-500/10 hover:text-amber-400";
    }

    return classes;
  };

  return (
    <>
      {/* Mobile Sidebar backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      <aside 
        className={`bg-[#0f172a] text-slate-300 flex flex-col h-full border-r border-slate-800/80 shrink-0
          fixed lg:static inset-y-0 left-0 z-45 lg:z-20 transition-all duration-305
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ 
          width: (isCollapsed && !isOpen) ? '60px' : '240px', 
        }}
      >
        {/* Brand Header */}
        <div className={`p-4 border-b border-slate-800/60 flex items-center ${(isCollapsed && !isOpen) ? 'justify-center' : 'justify-between'} gap-3 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/20 transition-all duration-300 hover:scale-105 shrink-0">
              <Coffee className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="animate-in fade-in duration-200">
                <h1 className="font-black text-lg tracking-tight text-white leading-tight">
                  BrewLux
                </h1>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider whitespace-nowrap">
                  Premium Coffee Chain
                </p>
              </div>
            )}
          </div>
          
          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <span className="text-sm font-bold leading-none">{isCollapsed ? '→' : '←'}</span>
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
            title="Close Sidebar"
          >
            <span className="text-sm font-bold leading-none">✕</span>
          </button>
        </div>

      {/* Nav Links Container */}
      <nav className="flex-1 py-6 flex flex-col justify-start space-y-6 px-3">
        {/* Group 1: AI Strategic Assistant */}
        <div className="space-y-2">
          {!isCollapsed && (
            <span className="px-3 text-[9px] font-black text-slate-500 uppercase tracking-wider block">
              AI Assistant
            </span>
          )}
          <Link 
            to={assistantItem.path} 
            className={getNavItemClass(assistantItem.path)}
            onClick={() => handleNavClick(assistantItem.path)}
          >
            {(() => {
              const Icon = assistantItem.icon;
              return (
                <>
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="text-sm">{assistantItem.name}</span>}
                </>
              );
            })()}
          </Link>
        </div>

        {/* Group 2: CRM Core */}
        <div className="space-y-2">
          {!isCollapsed && (
            <span className="px-3 text-[9px] font-black text-slate-500 uppercase tracking-wider block">
              CRM Core
            </span>
          )}
          <div className="flex flex-col space-y-2">
            {coreItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={getNavItemClass(item.path)}
                  onClick={() => handleNavClick(item.path)}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="text-sm">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-800/60 flex flex-col gap-2 shrink-0">
        <div className="px-2 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center transition-all duration-300 hover:border-slate-600/50">
          {!isCollapsed ? (
            <>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Powered by</span>
              <span className="text-xs text-amber-500 font-bold tracking-tight">Aria CRM AI</span>
            </>
          ) : (
            <span className="text-[10px] text-amber-500 font-bold">Aria</span>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

export default Sidebar;
