import React from 'react';
import { COMMAND_TEMPLATES } from '../utils/commandTemplates';

const DANGER_DOT : Record<string, any> = {
  safe:    'bg-emerald-400',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
};

export default function QuickTemplates({ onSelectTemplate }: any) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/40 shrink-0 pr-1">
        Quick:
      </span>
      {COMMAND_TEMPLATES.map((t: any) => (
        <button
          key={t.id}
          onClick={() => onSelectTemplate(t)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer border-border/40 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DANGER_DOT[t.danger] || DANGER_DOT.safe}`} />
          {t.label}
        </button>
      ))}
    </div>
  );
}
