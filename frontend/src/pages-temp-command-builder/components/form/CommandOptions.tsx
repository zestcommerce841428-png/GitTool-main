import React from 'react';

// Compact inline toggle row
export function FlagCard({ label, desc, checked, onChange, conflict }: any) {
  return (
    <label className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-colors select-none ${checked ? 'bg-primary/8' : 'hover:bg-muted/30'}`}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-8 h-4.5 rounded-full transition-colors focus:outline-none ${checked ? 'bg-primary' : 'bg-muted'}`}
        style={{ height: '18px', width: '32px' }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-3.5' : 'translate-x-0'}`}
          style={{ width: '14px', height: '14px' }}
        />
      </button>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-semibold text-foreground leading-none">{label}</span>
        {conflict ? (
          <span className="text-[10px] text-red-400 mt-0.5">{conflict}</span>
        ) : desc ? (
          <span className="text-[10px] text-muted-foreground/60 mt-0.5">{desc}</span>
        ) : null}
      </div>
    </label>
  );
}

// Tooltip (kept for compat but simplified)
export function FlagTip({ text }: any) {
  return (
    <span className="text-[10px] text-amber-400 ml-1">{text}</span>
  );
}
