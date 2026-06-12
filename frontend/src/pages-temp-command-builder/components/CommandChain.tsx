import React, { useState } from 'react';
import { ArrowUp, ArrowDown, X, Link2, Plus, Download } from 'lucide-react';

export default function CommandChain({ chain, setChain, onExport, currentCmd, onAddCurrent }: any) {
  const [active, setActive] = useState(false);

  const moveUp = (index: any) => {
    if (index === 0) return;
    const n = [...chain];
    [n[index - 1], n[index]] = [n[index], n[index - 1]];
    setChain(n);
  };

  const moveDown = (index: any) => {
    if (index === chain.length - 1) return;
    const n = [...chain];
    [n[index + 1], n[index]] = [n[index], n[index + 1]];
    setChain(n);
  };

  const remove = (index: any) => {
    const next = chain.filter((_: any, i: any) => i !== index);
    setChain(next);
    if (next.length === 0) setActive(false);
  };

  const addCurrent = () => {
    if (!currentCmd) return;
    setChain([...chain, currentCmd]);
    setActive(true);
    if (onAddCurrent) onAddCurrent();
  };

  return (
    <div>
      {/* Always-visible "Add to Chain" button */}
      <button
        onClick={addCurrent}
        disabled={!currentCmd}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold border border-dashed border-border/50 text-muted-foreground/60 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus size={12} /> Add current command to chain
      </button>

      {/* Chain list — visible once there are commands */}
      {(active || chain.length > 0) && (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
              <Link2 size={11} /> Chain ({chain.length})
            </span>
            <button
              onClick={() => { setChain([]); setActive(false); }}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
            {chain.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/50 italic text-center py-2">
                Add commands above
              </p>
            ) : (
              chain.map((cmd: any, i: any) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/40 group">
                  <span className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 bg-muted/60 text-muted-foreground">
                    {i + 1}
                  </span>
                  <code className="flex-1 text-[11px] font-mono truncate text-foreground/80">{cmd}</code>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30">
                      <ArrowUp size={10} />
                    </button>
                    <button onClick={() => moveDown(i)} disabled={i === chain.length - 1} className="w-5 h-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30">
                      <ArrowDown size={10} />
                    </button>
                    <button onClick={() => remove(i)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/10 text-red-500">
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {chain.length > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground/50">
                joined with <code className="bg-muted px-1 rounded">&&</code>
              </span>
              <button
                onClick={() => onExport(chain.join(' && \n'))}
                className="inline-flex items-center gap-1 text-[10px] text-primary font-bold hover:underline cursor-pointer"
              >
                <Download size={10} /> Export .sh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
