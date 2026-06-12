'use client';

import React from 'react';
import BranchSelector from './form/BranchSelector';
import { FlagCard } from './form/CommandOptions';

export default function CommandComposer({ action, schema, state, updateState, repoContext }: any) {

  // ── Section divider ─────────────────────────────────────────────
  const SectionLabel = ({ children }: any) => (
    <h4 className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/40 mb-3 mt-5 flex items-center gap-2 first:mt-0">
      {children}
      <span className="flex-1 h-px bg-border/50" />
    </h4>
  );

  // ── Classify steps into groups ───────────────────────────────────
  const INPUT_STEPS   = ['branchName', 'baseBranch', 'targetBranch', 'targetCommit', 'commits', 'stashMessage', 'resetMode', 'strategy'];
  const OPTION_STEPS  = ['options', 'cleanOptions'];

  const inputSteps  = schema?.steps?.filter((s: any) => s !== 'operation' && INPUT_STEPS.includes(s))  || [];
  const optionSteps = schema?.steps?.filter((s: any) => OPTION_STEPS.includes(s)) || [];
  const hasAny      = inputSteps.length > 0 || optionSteps.length > 0;

  // ── Individual step renderers ────────────────────────────────────
  const renderOptions = () => (
    <div className="flex flex-col gap-1">
      <FlagCard label="Force (--force)" desc="Override safety checks" checked={state.force}   onChange={(v: any) => updateState('force', v)} />
      {action !== 'git clean' && <FlagCard label="Dry Run (-n)"     desc="Preview only, no changes" checked={state.dryRun}   onChange={(v: any) => updateState('dryRun', v)} />}
      <FlagCard label="Verbose (-v)"    desc="Extended output"         checked={state.verbose} onChange={(v: any) => updateState('verbose', v)} />
      {action === 'git checkout' && (
        <FlagCard label="New Branch (-b)" desc="Create and switch"
          checked={!!state.targetBranch?.startsWith('-b')}
          onChange={(v: any) => updateState('targetBranch', v ? '-b new-branch' : '')} />
      )}
    </div>
  );

  const renderCleanOptions = () => (
    <div className="flex flex-col gap-1">
      <FlagCard label="-n (dry run)"    desc="Preview deletions"     checked={state.cleanDryRun}  onChange={(v: any) => updateState('cleanDryRun', v)} />
      <FlagCard label="-f (force)"      desc="Delete untracked files" checked={state.cleanForce}   onChange={(v: any) => updateState('cleanForce', v)} />
      <FlagCard label="-x (ignored)"    desc="Remove gitignored files" checked={state.cleanIgnored} onChange={(v: any) => updateState('cleanIgnored', v)} conflict={state.cleanIgnored ? 'Removes .gitignore files!' : ''} />
    </div>
  );

  const renderBranchName = () => (
    <div className="form-field">
      <label className="text-xs text-muted-foreground font-semibold">Branch Name</label>
      <input className="form-input rounded-xl" value={state.branchName || ''} onChange={(e: any) => updateState('branchName', e.target.value)} placeholder="feature/new-branch" />
    </div>
  );

  const renderBaseBranch = () => (
    <BranchSelector label="Base Branch" value={state.baseBranch} onChange={(v: any) => updateState('baseBranch', v)} branches={repoContext?.branches} loading={repoContext?.loading} />
  );

  const renderTargetBranch = () => (
    <BranchSelector label="Target Branch" value={state.targetBranch?.replace('-b ', '') || ''} onChange={(v: any) => updateState('targetBranch', state.targetBranch?.startsWith('-b ') ? `-b ${v}` : v)} branches={repoContext?.branches} loading={repoContext?.loading} />
  );

  const renderTargetCommit = () => (
    <div className="form-field">
      <label className="text-xs text-muted-foreground font-semibold">Target Commit / Ref</label>
      <input className="form-input rounded-xl" value={state.targetCommit || ''} onChange={(e: any) => updateState('targetCommit', e.target.value)} placeholder="HEAD~1 or SHA" />
    </div>
  );

  const renderResetMode = () => (
    <div>
      <label className="text-xs text-muted-foreground font-semibold mb-2 block">Reset Mode</label>
      <div className="flex gap-2">
        {['--soft', '--mixed', '--hard'].map((mode: any) => (
          <button key={mode} onClick={() => updateState('resetMode', mode)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold border cursor-pointer transition-all ${state.resetMode === mode ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:border-border'}`}>
            {mode}
          </button>
        ))}
      </div>
      {state.resetMode === '--hard' && <p className="text-[10px] text-red-400 mt-1.5">⚠ Discards all uncommitted changes</p>}
    </div>
  );

  const renderMergeStrategy = () => (
    <div>
      <label className="text-xs text-muted-foreground font-semibold mb-2 block">Merge Strategy</label>
      <div className="flex gap-2">
        {['squash', 'no-ff', 'ff-only'].map((s: any) => (
          <button key={s} onClick={() => updateState('mergeStrategy', state.mergeStrategy === s ? '' : s)}
            className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer transition-all ${state.mergeStrategy === s ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 text-muted-foreground hover:border-border'}`}>
            --{s}
          </button>
        ))}
      </div>
    </div>
  );

  const renderCommitsSelector = () => (
    <div className="form-field">
      <label className="text-xs text-muted-foreground font-semibold">Commit SHAs</label>
      <input className="form-input rounded-xl" value={state.targetCommit || ''} onChange={(e: any) => updateState('targetCommit', e.target.value)} placeholder="Paste SHA(s), space separated" />
    </div>
  );

  const renderStashMessage = () => (
    <div className="form-field">
      <label className="text-xs text-muted-foreground font-semibold">Stash Message</label>
      <input className="form-input rounded-xl" value={state.stashMessage || ''} onChange={e => updateState('stashMessage', e.target.value)} placeholder="WIP: feature" />
    </div>
  );

  const renderStep = (stepName: any) => {
    switch (stepName) {
      case 'options':       return <div key={stepName}>{renderOptions()}</div>;
      case 'cleanOptions':  return <div key={stepName}>{renderCleanOptions()}</div>;
      case 'branchName':    return <div key={stepName}>{renderBranchName()}</div>;
      case 'baseBranch':    return <div key={stepName}>{renderBaseBranch()}</div>;
      case 'targetBranch':  return <div key={stepName}>{renderTargetBranch()}</div>;
      case 'targetCommit':  return <div key={stepName}>{renderTargetCommit()}</div>;
      case 'resetMode':     return <div key={stepName}>{renderResetMode()}</div>;
      case 'strategy':      return <div key={stepName}>{renderMergeStrategy()}</div>;
      case 'commits':       return <div key={stepName}>{renderCommitsSelector()}</div>;
      case 'stashMessage':  return <div key={stepName}>{renderStashMessage()}</div>;
      default: return null;
    }
  };

  if (!hasAny) return null;

  return (
    <div className="flex flex-col gap-4 mt-4">
      {inputSteps.length > 0 && (
        <>
          <SectionLabel>Inputs</SectionLabel>
          <div className="flex flex-col gap-3">
            {inputSteps.map((step: any) => renderStep(step))}
          </div>
        </>
      )}
      {optionSteps.length > 0 && (
        <>
          <SectionLabel>Options</SectionLabel>
          {optionSteps.map((step: any) => renderStep(step))}
        </>
      )}
    </div>
  );
}

