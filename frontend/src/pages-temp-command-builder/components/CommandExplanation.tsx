import React, { useState } from 'react';
import { Lightbulb, AlertTriangle, ChevronDown } from 'lucide-react';
import { getCommandExplanation } from '../utils/commandExplanation';

export default function CommandExplanation({ action, state }: any) {
  const explanation = getCommandExplanation(action, state);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-border/50 p-4 flex gap-3" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.04), rgba(139,92,246,0.04))' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))' }}>
        <Lightbulb size={14} style={{ color: '#60a5fa' }} />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-bold text-foreground">What this does</h5>

        {explanation.description && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {explanation.description}
          </p>
        )}

        {explanation.warning && (
          <div className="mt-3 p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 flex gap-2 items-start">
            <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-red-400 font-semibold leading-relaxed">{explanation.warning}</p>
          </div>
        )}

        {explanation.effects?.length > 0 && (
          <>
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
            >
              <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              {expanded ? 'Less detail' : 'More detail'}
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground/80">
                {explanation.effects.map((effect: any, i: any) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{effect}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
