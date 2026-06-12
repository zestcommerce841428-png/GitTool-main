import React, { useState, useEffect, useCallback } from 'react';
import NavbarPortal from '@/components/NavbarPortal';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Terminal, RotateCcw } from 'lucide-react';

import { useRepoContext } from './hooks/useRepoContext';
import { useCommandBuilder } from './hooks/useCommandBuilder';
import { COMMAND_SCHEMA } from './utils/commandSchema';

import OperationSelector from './components/form/OperationSelector';
import CommandComposer from './components/CommandComposer';
import CommandPreview from './components/CommandPreview';
import CommandExplanation from './components/CommandExplanation';
import CommandVisualization from './components/CommandVisualization';
import CommandChain from './components/CommandChain';
import QuickTemplates from './components/QuickTemplates';
import AICommandInput from './components/AICommandInput';

// Only show visualization for commands that affect Git history/tree
const VIZ_ACTIONS = ['git branch', 'git merge', 'git rebase', 'git reset', 'git checkout', 'git commit'];

export default function CommandBuilderPage() {
  const { selectedRepo: repo, selectedBranch: branch } = useWorkspace();
  const repoContext = useRepoContext(repo);

  const {
    action, setAction, state, updateState, resetState, buildCommand,
    chain, setChain, schema
  } = useCommandBuilder('git checkout');

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [buildCommand]);

  useEffect(() => {
    const handler = (e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleCopy(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleCopy]);

  const exportAlias = () => {
    const cmd = buildCommand();
    const a = cmd.replace(/^git /, '').split(' ')[0] + '-custom';
    navigator.clipboard.writeText(`[alias]\n    ${a} = ${cmd.replace(/^git /, '')}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const exportShellScript = () => {
    const cmd = buildCommand();
    const cmds = chain.length ? [...chain, cmd] : [cmd];
    const script = `#!/bin/bash\n# ${new Date().toISOString()}\nset -e\n\n${cmds.join('\n')}\n\necho "✅ Done!"`;
    const blob = new Blob([script], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'git-commands.sh'; a.click(); URL.revokeObjectURL(url);
  };

  const handleTemplateSelect = (t: any) => {
    const cmd = t.commands.join(' && ');
    resetState();
    setChain([]);
    if (cmd.includes('git reset --hard'))       { setAction('git reset');    updateState('resetMode', '--hard'); }
    else if (cmd.includes('git reset --soft'))  { setAction('git reset');    updateState('resetMode', '--soft'); }
    else if (cmd.includes('git checkout -b'))   { setAction('git branch');   updateState('branchName', 'feature/new'); }
    else if (cmd.includes('git stash'))         { setAction('git stash'); }
    else if (cmd.includes('git log'))           { setAction('git log'); }
    else if (cmd.includes('git clean'))         { setAction('git clean');    updateState('cleanForce', true); }
    if (t.commands.length > 1) setChain(t.commands.slice(0, -1));
  };

  const handleReset = () => { setAction('git checkout'); resetState(); setChain([]); };

  const showViz = VIZ_ACTIONS.includes(action);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 pb-8">
      <NavbarPortal>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Terminal size={18} />
          </div>
          <h2 className="tool-page-title">Command Builder</h2>
        </div>
      </NavbarPortal>

      {/* ── Zone 1: Context bar ── */}
      <div className="flex items-center gap-5 flex-wrap text-[11px] text-muted-foreground/50 font-mono border-b border-border/40 pb-4">
        {repo && (
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30">Repo</span>
            <span className="font-semibold text-foreground/70">{repo.name}</span>
          </span>
        )}
        {branch && (
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30">Branch</span>
            <span className="font-semibold text-foreground/70">{branch}</span>
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground/30">Dir</span>
          <span className="font-semibold text-foreground/70">~/projects</span>
        </span>
        <div className="ml-auto">
          <AICommandInput onIntentParsed={({ action: a, state: s }: any) => {
            setAction(a);
            Object.entries(s).forEach(([k, v]) => updateState(k, v));
          }} />
        </div>
      </div>

      {/* ── Zone 2: Quick Actions row ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/30 shrink-0 mr-1">
          Quick Git Actions
        </span>
        <QuickTemplates onSelectTemplate={handleTemplateSelect} />
      </div>


      {/* ── Main 2-pane layout ── */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-[340px_1fr] items-start">

        {/* ── LEFT: Builder ── */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

          {/* Operation header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h4 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/50">Operation</h4>
            <button onClick={handleReset} className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer">
              <RotateCcw size={10} /> Reset
            </button>
          </div>
          <div className="px-4 pt-3 pb-2">
            <OperationSelector
              action={action}
              setAction={(a: any) => { setAction(a); resetState(); }}
              options={Object.keys(COMMAND_SCHEMA)}
            />
          </div>

          {/* Dynamic inputs */}
          <div className="px-4 pb-4">
            <CommandComposer
              action={action}
              schema={schema}
              state={state}
              updateState={updateState}
              repoContext={repoContext}
            />
          </div>

          {/* Command Chain — always visible at the bottom of the builder */}
          <div className="border-t border-border/40 px-4 py-4">
            <CommandChain
              chain={chain}
              setChain={setChain}
              currentCmd={buildCommand()}
              onAddCurrent={() => {}}
              onExport={exportShellScript}
            />
          </div>
        </div>

        {/* ── RIGHT: Terminal + Explanation + (optional) Visualization ── */}
        <div className="flex flex-col gap-4">

          {/* Terminal Preview — hero element */}
          <div className="min-h-[280px]">
            <CommandPreview
              branch={branch}
              cmdString={buildCommand()}
              chainMode={chain.length > 0}
              chainCommands={chain}
              copied={copied}
              onCopy={handleCopy}
              onExportAlias={exportAlias}
              onExportScript={exportShellScript}
            />
          </div>

          {/* Explanation */}
          <CommandExplanation action={action} state={state} />

          {/* Visualization — only when relevant */}
          {showViz && <CommandVisualization action={action} state={state} />}
        </div>
      </div>
    </div>
  );
}
