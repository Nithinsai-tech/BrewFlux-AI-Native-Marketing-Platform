import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Assistant from './pages/Assistant.jsx';
import Customers from './pages/Customers.jsx';
import Campaigns from './pages/Campaigns.jsx';
import CampaignDetail from './pages/CampaignDetail.jsx';
import { Bell, CheckCircle, Info, AlertCircle, AlertTriangle } from 'lucide-react';

export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function App() {
  const location = useLocation();
  const [toasts, setToasts] = useState([]);
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('aria_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const lastToastTime = useRef(0);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const showToast = (message, type = 'info', actionLink = null) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type, actionLink }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Listen for global Socket.IO events for Message Delivery
  useEffect(() => {
    const socket = io(API_URL);

    socket.on('communication_update', (data) => {
      if (data.status === 'delivered') {
        const now = Date.now();
        // Throttle to avoid spamming the user screen during large campaigns
        if (now - lastToastTime.current > 3000) {
          lastToastTime.current = now;
          showToast(`📬 Message successfully delivered via ${data.channel || 'SMS/WhatsApp'}.`, 'success');
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Monitor chatMessages state to trigger Toast notifications on new segment creation, drafts, or launches
  const prevLengthRef = useRef(chatMessages.length);
  useEffect(() => {
    if (chatMessages.length > prevLengthRef.current) {
      const latestMsg = chatMessages[chatMessages.length - 1];
      
      // If it's a completed tool card
      if (latestMsg.type === 'tool' && latestMsg.status === 'complete' && latestMsg.result?.success) {
        if (latestMsg.toolName === 'create_segment') {
          showToast(`Segment "${latestMsg.result.name}" created successfully!`, 'success');
        } else if (latestMsg.toolName === 'draft_message') {
          showToast(`Campaign message template drafted!`, 'success');
        } else if (latestMsg.toolName === 'launch_campaign') {
          if (latestMsg.result?.status === 'pending_approval') {
            showToast(`Campaign "${latestMsg.result.campaignName || 'Draft'}" drafted and ready for review.`, 'warning');
          } else {
            showToast(`Campaign launched successfully!`, 'success', `/campaigns/${latestMsg.result.campaignId}`);
          }
        }
      }
    }
    prevLengthRef.current = chatMessages.length;
  }, [chatMessages]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div class="flex h-screen bg-[#0f172a] overflow-hidden">
        {/* Sidebar navigation */}
        <Sidebar />

        {/* Main content display */}
        <main class="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-slate-50 text-slate-800">
          {/* Subtle top ambient glow */}
          <div class="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Page transition wrapper */}
          <div
            key={location.pathname}
            class="flex-1 flex flex-col p-6 lg:p-8 max-w-7xl w-full mx-auto z-10 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <Routes>
              <Route path="/" element={<Navigate to="/assistant" replace />} />
              <Route
                path="/assistant"
                element={
                  <Assistant
                    messages={chatMessages}
                    setMessages={setChatMessages}
                  />
                }
              />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="*" element={<Navigate to="/assistant" replace />} />
            </Routes>
          </div>
        </main>

        {/* Global Toast Container */}
        <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';

            return (
              <div
                key={t.id}
                class="pointer-events-auto bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-6 duration-300"
              >
                <div class="mt-0.5 shrink-0">
                  {isSuccess ? (
                    <CheckCircle class="w-4 h-4 text-emerald-500" />
                  ) : isWarning ? (
                    <AlertTriangle class="w-4 h-4 text-amber-500" />
                  ) : isError ? (
                    <AlertCircle class="w-4 h-4 text-red-500" />
                  ) : (
                    <Info class="w-4 h-4 text-blue-500" />
                  )}
                </div>

                <div class="flex-1 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isSuccess ? 'Success' : isWarning ? 'Warning' : isError ? 'Error' : 'Notification'}
                    </span>
                    <button
                      onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
                      class="text-slate-500 hover:text-white cursor-pointer ml-4 text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <p class="text-xs text-slate-300 font-medium leading-relaxed">{t.message}</p>
                  {t.actionLink && (
                    <a
                      href={t.actionLink}
                      class="text-[10px] text-amber-500 hover:underline font-bold block pt-1"
                    >
                      View Live Stats →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export default App;
