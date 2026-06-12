import React from 'react';

function Funnel({ stats = {} }) {
  const {
    total = 0,
    sent = 0,
    delivered = 0,
    read = 0,
    clicked = 0,
    converted = 0,
  } = stats;

  const funnelSteps = [
    { label: 'Audience Segment', value: total, color: 'bg-slate-700' },
    { label: 'Sent Messages', value: sent, color: 'bg-blue-600' },
    { label: 'Delivered', value: delivered, color: 'bg-indigo-600' },
    { label: 'Read / Opened', value: read, color: 'bg-amber-600' },
    { label: 'Clicked Link', value: clicked, color: 'bg-emerald-600' },
    { label: 'Converted Order', value: converted, color: 'bg-gold-600' },
  ];

  // Helper to calculate conversion percentage relative to total audience
  const getPercentage = (value) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Conversion Funnel</h3>
      <div class="space-y-3">
        {funnelSteps.map((step, idx) => {
          const percent = getPercentage(step.value);
          return (
            <div key={idx} class="space-y-1">
              <div class="flex justify-between text-xs font-medium">
                <span class="text-slate-400">{step.label}</span>
                <span class="text-slate-200">
                  {step.value.toLocaleString()} <span class="text-slate-500 font-mono text-[10px]">({percent}%)</span>
                </span>
              </div>
              <div class="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800/60">
                <div
                  style={{ width: `${percent}%` }}
                  class={`h-full ${step.color} rounded-full transition-all duration-500 ease-out`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Funnel;
