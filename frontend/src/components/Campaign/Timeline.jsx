import React from 'react';
import { Send, CheckCircle2, MessageSquare, AlertCircle, ShoppingBag, Eye, MousePointerClick } from 'lucide-react';

function Timeline({ events = [] }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'sent':
        return { icon: Send, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' };
      case 'delivered':
        return { icon: CheckCircle2, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' };
      case 'opened':
      case 'read':
        return { icon: Eye, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
      case 'clicked':
        return { icon: MousePointerClick, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
      case 'converted':
        return { icon: ShoppingBag, color: 'text-gold-500 bg-gold-600/15 border-gold-600/30' };
      case 'failed':
        return { icon: AlertCircle, color: 'text-red-500 bg-red-500/10 border-red-500/30' };
      default:
        return { icon: MessageSquare, color: 'text-slate-500 bg-slate-500/10 border-slate-500/30' };
    }
  };

  if (events.length === 0) {
    return (
      <div class="text-center p-8 border border-dashed border-slate-800 rounded-xl">
        <p class="text-sm text-slate-500">Waiting for campaign execution to begin...</p>
      </div>
    );
  }

  return (
    <div class="relative pl-6 border-l border-slate-800 space-y-6 max-h-[450px] overflow-y-auto pr-2">
      {events.map((event, idx) => {
        const { icon: Icon, color } = getStatusConfig(event.status);
        return (
          <div key={idx} class="relative group">
            {/* Timeline Dot Icon */}
            <div
              class={`absolute -left-[35px] top-0.5 w-7 h-7 rounded-lg border flex items-center justify-center ${color} shadow-sm transition-transform duration-200 group-hover:scale-110`}
            >
              <Icon class="w-3.5 h-3.5" />
            </div>

            {/* Event Content */}
            <div class="flex items-start justify-between gap-4">
              <div>
                <h4 class="text-xs font-semibold text-slate-200">
                  {event.customerName}{' '}
                  <span class="font-normal text-slate-400">
                    {event.status === 'sent' && 'dispatched message'}
                    {event.status === 'delivered' && 'received message'}
                    {event.status === 'read' && 'read message'}
                    {event.status === 'opened' && 'opened message'}
                    {event.status === 'clicked' && 'clicked message link'}
                    {event.status === 'converted' && 'placed purchase conversion!'}
                    {event.status === 'failed' && 'failed message delivery'}
                  </span>
                </h4>
                <p class="text-[10px] font-mono text-slate-500 mt-0.5">{event.messagePreview || 'Campaign dispatch'}</p>
              </div>
              <span class="text-[10px] text-slate-500 font-mono flex-shrink-0">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
