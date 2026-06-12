import React, { useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';

const INTENT_MAP = [
  { patterns: ['create branch', 'new branch', 'make branch'],       action: 'git branch',    state: { branchName: 'feature/new' } },
  { patterns: ['checkout', 'switch to', 'switch branch'],            action: 'git checkout',  state: {} },
  { patterns: ['undo commit', 'undo last commit'],                    action: 'git reset',     state: { resetMode: '--soft', targetCommit: 'HEAD~1' } },
  { patterns: ['squash', 'squash commits'],                          action: 'git reset',     state: { resetMode: '--soft', targetCommit: 'HEAD~3' } },
  { patterns: ['delete branch', 'remove branch'],                    action: 'git branch',    state: { force: true } },
  { patterns: ['hard reset', 'reset to origin', 'reset to remote'],  action: 'git reset',     state: { resetMode: '--hard', targetCommit: 'origin/main' } },
  { patterns: ['rebase onto', 'rebase on'],                          action: 'git rebase',    state: {} },
  { patterns: ['merge'],                                             action: 'git merge',     state: {} },
  { patterns: ['stash', 'save changes'],                              action: 'git stash',     state: {} },
  { patterns: ['clean', 'remove untracked', 'clear working'],        action: 'git clean',     state: { cleanForce: true } },
  { patterns: ['log', 'history', 'view commits'],                    action: 'git log',       state: {} },
  { patterns: ['cherry-pick', 'cherry pick', 'apply commit'],        action: 'git cherry-pick', state: {} },
];

function parseIntent(input: any) {
  const lower = input.toLowerCase();
  for (const entry of INTENT_MAP) {
    if (entry.patterns.some((p: any) => lower.includes(p))) {
      const branchMatch = input.match(/(?:branch|onto|from|to) +([a-zA-Z0-9_/-]+)/i);
      if (branchMatch) {
        const b = branchMatch[1];
        if (entry.action === 'git branch') return { action: entry.action, state: { ...entry.state, branchName: b } };
        if (entry.action === 'git checkout') return { action: entry.action, state: { ...entry.state, targetBranch: b } };
        if (entry.action === 'git rebase') return { action: entry.action, state: { ...entry.state, targetBranch: b } };
        if (entry.action === 'git merge') return { action: entry.action, state: { ...entry.state, targetBranch: b } };
      }
      return { action: entry.action, state: entry.state };
    }
  }
  return null;
}

export default function AICommandInput({ onIntentParsed }: any) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleParse = (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;
    const result = parseIntent(input);
    if (result) {
      setError('');
      onIntentParsed(result);
      setInput('');
      setOpen(false);
    } else {
      setError("Didn't recognise that. Try: \"create branch from dev\"");
      setTimeout(() => setError(''), 3000);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
      >
        <Sparkles size={12} className="text-primary" />
        Try AI command →
      </button>
    );
  }

  return (
    <form onSubmit={handleParse} className="relative animate-in fade-in slide-in-from-top-1 duration-150">
      <Sparkles size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
      <input
        autoFocus
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="form-input rounded-xl w-full pl-10 pr-20 h-11 text-sm bg-primary/5 border-primary/20 placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary/30"
        placeholder='e.g. "create branch from dev" or "squash last 3 commits"'
      />
      <div className="absolute inset-y-1.5 right-1.5 flex gap-1">
        <button type="button" onClick={() => { setOpen(false); setInput(''); setError(''); }}
          className="px-2 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors">
          <X size={13} />
        </button>
        <button type="submit" disabled={!input.trim()}
          className="px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 transition-colors flex items-center">
          <ArrowRight size={13} />
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1 px-1 absolute -bottom-5 left-0">{error}</p>}
    </form>
  );
}
