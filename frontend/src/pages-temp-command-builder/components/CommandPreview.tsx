import React from 'react';
import { getCommandSafetyLevel } from '../utils/commandSafety';
import { Copy, BookOpen, Download, Check, FolderGit2, GitBranch } from 'lucide-react';

function highlightCommand(cmd: any) {
  if (!cmd) return null;
  return cmd.split(' ').map((token: any, i: any) => {
    let color = '#cbd5e1';
    if (token === 'git' || (i === 0 && token.startsWith('git'))) color = '#34d399';
    else if (['--force', '--hard', '-x', '-fd', '--force-with-lease'].includes(token)) color = '#f87171';
    else if (token.startsWith('--') || (token.startsWith('-') && token.length <= 3)) color = '#fbbf24';
    else if (token.startsWith('"') || token.startsWith("'")) color = '#c084fc';
    else if (token.startsWith('<') || token === 'HEAD~1' || token === 'HEAD~3') color = '#38bdf8';
    else if (i === 1) color = '#818cf8';         // sub-command (checkout, branch, merge...)
    return <span key={i} style={{ color }}>{i > 0 ? ' ' : ''}{token}</span>;
  });
}

export default function CommandPreview({ branch, cmdString, chainMode, chainCommands, copied, onCopy, onExportAlias, onExportScript }: any) {
  const safety = getCommandSafetyLevel(cmdString);
  const SafetyIcon = safety.icon;

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col shadow-lg h-full" style={{ background: '#080c18', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* ── Mac chrome ── */}
      <div
        className="flex justify-between items-center px-5 py-3 shrink-0"
        style={{ background: 'linear-gradient(180deg, rgba(25,33,52,0.8), rgba(12,18,34,0.6))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Traffic lights */}
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors" />
        </div>

        {/* Context + Safety */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono" style={{ color: '#64748b' }}>
            TERMINAL PREVIEW
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider border" style={{ background: safety.bg, color: safety.color, borderColor: safety.border }}>
            <SafetyIcon size={11} strokeWidth={3} />
            {safety.label}
          </div>
        </div>
      </div>

      {/* ── Context bar (Warp-style) ── */}
      <div className="flex items-center gap-4 px-5 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: '#475569' }}>
          <FolderGit2 size={11} />
          <span>~/projects</span>
        </div>
        {branch && (
          <>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: '#6366f1' }}>
              <GitBranch size={11} />
              <span>{branch}</span>
            </div>
          </>
        )}
        <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
        <span className="text-[10px] font-mono" style={{ color: '#334155' }}>Local Repository</span>
      </div>

      {/* ── Terminal body ── */}
      <div className="flex-1 px-6 py-5 font-mono text-[13px] overflow-y-auto" style={{ lineHeight: 2 }}>
        <div className="flex gap-2 items-center">
          <span style={{ color: '#34d399' }}>➜</span>
          <span style={{ color: '#818cf8', fontStyle: 'italic' }}>git({branch || 'main'})</span>
        </div>
        <div className="mt-3" style={{ wordBreak: 'break-all' }}>
          {chainMode && chainCommands.length > 0 && chainCommands.map((c: any, i: any) => (
            <div key={i} className="mb-1">{highlightCommand(c)}<span style={{ color: '#334155' }}> &&</span></div>
          ))}
          {highlightCommand(cmdString)}
          <span className="inline-block w-0.5 h-5 ml-1 align-middle" style={{ background: '#818cf8', animation: 'pulse 1.2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 flex flex-wrap justify-between items-center gap-2 shrink-0" style={{ background: 'rgba(4,8,16,0.7)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex gap-1.5">
          <button onClick={onExportAlias} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer hover:bg-white/5" style={{ color: '#475569' }}>
            <BookOpen size={12} /> Alias
          </button>
          <button onClick={onExportScript} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer hover:bg-white/5" style={{ color: '#475569' }}>
            <Download size={12} /> .sh
          </button>
        </div>
        <button onClick={onCopy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer hover:bg-white/5" style={{ color: '#94a3b8' }}>
          {copied ? <><Check size={13} className="text-emerald-500" /> <span className="text-emerald-500">Copied</span></> : <><Copy size={13} /> Copy</>}
        </button>
      </div>
    </div>
  );
}
