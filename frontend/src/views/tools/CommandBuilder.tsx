'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState, useEffect, useCallback } from 'react';
import {
    GitBranch, History, Copy, RotateCcw, Star, Lightbulb, Loader2,
    AlertTriangle, ShieldCheck, AlertCircle, Download, BookOpen,
    Terminal, Zap, ChevronDown, ChevronRight, X, Clock, Trash2,
    HelpCircle, Link2, Tag, Search, FileText, Sparkles, Check,
    GitMerge, GitPullRequest, Cherry, Package, RotateCw,
    ScrollText, FileDiff, Eraser, Globe, Microscope, TimerReset,
    ArrowDownToLine
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── CONSTANTS ──────────────────────────────────────────────────────
const ACTIONS = [
    'git checkout', 'git branch', 'git merge', 'git rebase',
    'git cherry-pick', 'git stash', 'git reset',
    'git log', 'git diff', 'git clean', 'git remote', 'git tag',
    'git bisect', 'git reflog',
];

const ACTION_ICONS : Record<string, any> = {
    'git checkout': ArrowDownToLine,
    'git branch': GitBranch,
    'git merge': GitMerge,
    'git rebase': GitPullRequest,
    'git cherry-pick': Cherry,
    'git stash': Package,
    'git reset': RotateCw,
    'git log': ScrollText,
    'git diff': FileDiff,
    'git clean': Eraser,
    'git remote': Globe,
    'git tag': Tag,
    'git bisect': Microscope,
    'git reflog': TimerReset,
};

const RECIPES = [
    { name: 'Undo last commit (keep changes)', cmd: 'git reset --soft HEAD~1', danger: 'safe' },
    { name: 'Squash last 3 commits', cmd: 'git reset --soft HEAD~3 && git commit', danger: 'caution' },
    { name: 'Force push safely', cmd: 'git push --force-with-lease', danger: 'caution' },
    { name: 'Delete merged branches', cmd: 'git branch --merged | grep -v main | xargs git branch -d', danger: 'caution' },
    { name: 'Stash everything (incl untracked)', cmd: 'git stash push -u -m "quick-save"', danger: 'safe' },
    { name: 'Interactive rebase last 5', cmd: 'git rebase -i HEAD~5', danger: 'caution' },
    { name: 'Discard all local changes', cmd: 'git checkout -- . && git clean -fd', danger: 'destructive' },
    { name: 'Cherry-pick without committing', cmd: 'git cherry-pick --no-commit <sha>', danger: 'safe' },
    { name: 'View compact log graph', cmd: 'git log --oneline --graph --all --decorate', danger: 'safe' },
    { name: 'Recover deleted branch', cmd: 'git reflog | grep <branch> # then checkout', danger: 'safe' },
];

const FLAG_TOOLTIPS : Record<string, any> = {
    '--force': 'Overrides safety checks. Rewrites remote history. Prefer --force-with-lease.',
    '--verbose': 'Display extended operation information.',
    '--squash': 'Combine all changes into one commit. Mutually exclusive with --no-ff.',
    '--no-ff': 'Always create a merge commit. Mutually exclusive with --squash / --ff-only.',
    '--ff-only': 'Refuse to merge unless fast-forward is possible.',
    '--no-commit': 'Apply changes without committing, letting you modify the result.',
    '--signoff': 'Add a Signed-off-by trailer to the commit message.',
    '-i': 'Opens an editor to reorder, squash, reword, or drop commits.',
    '--soft': 'Moves HEAD only. Index and working tree stay intact.',
    '--mixed': 'Moves HEAD and resets index. Working tree stays intact.',
    '--hard': 'Moves HEAD and destroys ALL uncommitted changes. IRREVERSIBLE.',
    '--staged': 'Show only staged (indexed) changes.',
    '--stat': 'Show a diffstat summary instead of full patch.',
    '--name-only': 'Show only the names of changed files.',
    '--oneline': 'Condense each commit to a single line.',
    '--graph': 'Draw a text-based graph of the commit history.',
    '--all': 'Show all branches, not just the current one.',
    '-n': 'Dry run — show what would happen without doing it.',
    '-f': 'Force — required to actually delete files.',
    '-d': 'Remove untracked directories in addition to files.',
    '-x': 'Remove ignored files too. Very destructive.',
};

function timeAgo(date: any) {
    if (!date) return '—';
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`; const d = Math.floor(h / 24);
    return `${d}d ago`;
}

// ─── SYNTAX HIGHLIGHTING ────────────────────────────────────────────
function highlightCommand(cmd: any) {
    if (!cmd) return null;
    return cmd.split(' ').map((token: any, i: any) => {
        let color = '#cbd5e1';
        if (i < 2 && token.startsWith('git') || token === 'git') color = '#34d399';
        else if (['--force', '--hard', '-x', '-fd', '--force-with-lease'].includes(token)) color = '#f87171';
        else if (token.startsWith('--') || (token.startsWith('-') && token.length <= 3)) color = '#fbbf24';
        else if (token.startsWith('"') || token.startsWith("'")) color = '#c084fc';
        else if (token.startsWith('<') || token === 'HEAD~1' || token === 'HEAD~3') color = '#38bdf8';
        return <span key={i} style={{ color }}>{i > 0 ? ' ' : ''}{token}</span>;
    });
}

// ─── PLAIN ENGLISH EXPLANATIONS ─────────────────────────────────────
function getExplanation(action: any, st: any) {
    if (action === 'git reset') {
        if (st.resetMode === '--soft') return 'Moves HEAD back one commit. Your changes stay staged — just re-commit them.';
        if (st.resetMode === '--mixed') return 'Moves HEAD back and un-stages changes. Files stay in your working directory.';
        if (st.resetMode === '--hard') return '⚠️ DANGER: Permanently discards ALL uncommitted changes. Cannot be undone.';
    }
    if (action === 'git merge' && st.mergeStrategy) {
        if (st.mergeStrategy === 'squash') return 'Squashes all branch commits into a single commit on your current branch.';
        if (st.mergeStrategy === 'no-ff') return 'Always creates a merge commit, even when fast-forward is possible.';
        if (st.mergeStrategy === 'ff-only') return 'Only merges if fast-forward is possible. Aborts otherwise.';
    }
    if (action === 'git clean') return st.cleanDryRun ? 'Dry run — previews what would be deleted. Nothing will be removed.' : 'Permanently removes untracked files from your working directory.';
    if (action === 'git rebase' && st.rebaseInteractive) return 'Opens an interactive editor to squash, reword, reorder, or drop commits.';
    if (action === 'git stash') return 'Safely stores your local modifications for later. Restore with git stash pop.';
    if (action === 'git cherry-pick') return 'Applies selected commit(s) onto your current branch as new commits.';
    if (action === 'git log') return 'Displays the commit history with your selected filters.';
    if (action === 'git diff') return 'Shows differences between your working tree, index, or commits.';
    if (action === 'git tag') return 'Tags mark specific points in history — typically used for releases.';
    if (action === 'git bisect') return 'Binary search through commits to find the one that introduced a bug.';
    if (action === 'git reflog') return 'Shows where HEAD has been. The ultimate recovery tool for lost commits.';
    if (action === 'git remote') return 'Manage the set of remote repositories you track.';
    if (st.force) return '⚠️ --force overrides remote safety checks. Prefer --force-with-lease.';
    return 'This command is safe to run. It will not modify history or affect remotes.';
}

// ─── DANGER LEVEL ───────────────────────────────────────────────────
function getDangerLevel(action: any, st: any) {
    const D : Record<string, any> = { level: 'destructive', text: 'DESTRUCTIVE', icon: AlertTriangle, color: '#ef4444', bg: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: 'rgba(239,68,68,0.3)' };
    const C : Record<string, any> = { level: 'caution', text: 'CAUTION', icon: AlertCircle, color: '#f59e0b', bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', border: 'rgba(245,158,11,0.3)' };
    const S : Record<string, any> = { level: 'safe', text: 'SAFE', icon: ShieldCheck, color: '#10b981', bg: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: 'rgba(16,185,129,0.3)' };
    if (st.force) return D;
    if (action === 'git reset' && st.resetMode === '--hard') return D;
    if (action === 'git clean' && !st.cleanDryRun) return D;
    if (action === 'git reset' && st.resetMode === '--mixed') return C;
    if (action === 'git rebase') return C;
    return S;
}

// ─── TOOLTIP ────────────────────────────────────────────────────────
function Tip({ text }: any) {
    const [show, setShow] = useState(false);
    if (!text) return null;
    return (
        <span className="relative inline-flex ml-1" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            <HelpCircle size={13} className="text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 rounded-xl border shadow-2xl text-[11px] z-50 leading-relaxed pointer-events-none"
                    style={{ background: 'var(--popover)', color: 'var(--popover-foreground)', borderColor: 'var(--border)' }}>
                    {text}
                </div>
            )}
        </span>
    );
}

// ─── TOGGLE CARD ────────────────────────────────────────────────────
function FlagCard({ label, desc, checked, onChange, tooltip, conflict, disabled }: any) {
    return (
        <div
            onClick={() => !disabled && onChange(!checked)}
            className={`group relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-all duration-200 ${disabled ? 'opacity-30 pointer-events-none' : ''} ${checked ? 'border-primary/40 shadow-[0_0_20px_rgba(59,130,246,0.08)]' : 'border-border/50 hover:border-border hover:shadow-sm'}`}
            style={checked ? { background: 'linear-gradient(135deg, rgba(59,130,246,0.06), transparent)' } : {}}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold flex items-center gap-1">
                        {label}
                        {tooltip && <Tip text={tooltip} />}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                    {conflict && <p className="text-[10px] text-amber-500 mt-1.5 font-medium flex items-center gap-1"><AlertCircle size={10} /> {conflict}</p>}
                </div>
                <div className={`w-10 h-[22px] rounded-full relative transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
                </div>
            </div>
        </div>
    );
}

// ─── SECTION HEADING ────────────────────────────────────────────────
function SectionHeading({ children }: any) {
    return <h4 className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground/70 mb-4 flex items-center gap-2">
        <span className="w-6 h-px bg-border" />{children}<span className="flex-1 h-px bg-border" />
    </h4>;
}

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// ─── MAIN COMPONENT ─────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export default function CommandBuilder() {
    const { selectedRepo: repo, selectedBranch: branch } = useWorkspace();

    const [action, setAction] = useState('git branch');
    const [force, setForce] = useState(false);
    const [verbose, setVerbose] = useState(false);
    const [noCheckout, setNoCheckout] = useState(false);
    const [dryRun, setDryRun] = useState(false);
    const [stashMessage, setStashMessage] = useState('');
    const [stashUntracked, setStashUntracked] = useState(true);
    const [resetMode, setResetMode] = useState('--mixed');
    const [mergeStrategy, setMergeStrategy] = useState('');
    const [rebaseInteractive, setRebaseInteractive] = useState(false);
    const [commits, setCommits] = useState<any[]>([]);
    const [selectedCommits, setSelectedCommits] = useState<any[]>([]);
    const [loadingCommits, setLoadingCommits] = useState(false);
    const [commitError, setCommitError] = useState<any>(null);
    const [cherryNoCommit, setCherryNoCommit] = useState(false);
    const [cherrySignoff, setCherrySignoff] = useState(false);
    const [logOneline, setLogOneline] = useState(true);
    const [logGraph, setLogGraph] = useState(false);
    const [logAll, setLogAll] = useState(false);
    const [logSince, setLogSince] = useState('');
    const [logAuthor, setLogAuthor] = useState('');
    const [logGrep, setLogGrep] = useState('');
    const [logCount, setLogCount] = useState('');
    const [diffStaged, setDiffStaged] = useState(false);
    const [diffStat, setDiffStat] = useState(false);
    const [diffNameOnly, setDiffNameOnly] = useState(false);
    const [diffPath, setDiffPath] = useState('');
    const [cleanForce, setCleanForce] = useState(true);
    const [cleanDirs, setCleanDirs] = useState(false);
    const [cleanDryRun, setCleanDryRun] = useState(true);
    const [cleanIgnored, setCleanIgnored] = useState(false);
    const [remoteAction, setRemoteAction] = useState('add');
    const [remoteName, setRemoteName] = useState('');
    const [remoteUrl, setRemoteUrl] = useState('');
    const [tagName, setTagName] = useState('');
    const [tagMessage, setTagMessage] = useState('');
    const [tagAnnotated, setTagAnnotated] = useState(true);
    const [tagPush, setTagPush] = useState(false);
    const [tagDelete, setTagDelete] = useState(false);
    const [bisectStep, setBisectStep] = useState(0);
    const bisectSteps = ['git bisect start', 'git bisect bad', 'git bisect good <commit>', 'git bisect reset'];
    const [reflogSha, setReflogSha] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showRecipes, setShowRecipes] = useState(false);
    const [chainMode, setChainMode] = useState(false);
    const [chainCommands, setChainCommands] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => { try { setHistory(JSON.parse(localStorage.getItem('cmd_history') || '[]')); } catch { /**/ } }, []);

    useEffect(() => {
        if (action === 'git cherry-pick' && repo && commits.length === 0) {
            (async () => {
                setLoadingCommits(true); setCommitError(null);
                try {
                    const o = repo.owner?.login || repo.full_name?.split('/')[0];
                    const res = await api.get(`/tools/${o}/${repo.name}/commits`);
                    setCommits(res.commits || []);
                } catch (err: any) { setCommitError(err.message); } finally { setLoadingCommits(false); }
            })();
        }
    }, [action, repo, commits.length]);

    useEffect(() => {
        const handler = (e: any) => {
            if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); copyCommand(); }
            if (e.ctrlKey && e.shiftKey && e.key === 'R') { e.preventDefault(); resetAll(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    const resetAll = () => {
        setForce(false); setVerbose(false); setNoCheckout(false); setDryRun(false);
        setStashMessage(''); setStashUntracked(true); setResetMode('--mixed');
        setMergeStrategy(''); setRebaseInteractive(false);
        setSelectedCommits([]); setCherryNoCommit(false); setCherrySignoff(false);
        setLogOneline(true); setLogGraph(false); setLogAll(false); setLogSince(''); setLogAuthor(''); setLogGrep(''); setLogCount('');
        setDiffStaged(false); setDiffStat(false); setDiffNameOnly(false); setDiffPath('');
        setCleanForce(true); setCleanDirs(false); setCleanDryRun(true); setCleanIgnored(false);
        setRemoteAction('add'); setRemoteName(''); setRemoteUrl('');
        setTagName(''); setTagMessage(''); setTagAnnotated(true); setTagPush(false); setTagDelete(false);
        setBisectStep(0); setReflogSha('');
        setChainMode(false); setChainCommands([]);
    };

    const buildCommand = useCallback(() => {
        let cmd = '';
        switch (action) {
            case 'git stash': cmd = 'git stash push'; if (stashMessage) cmd += ` -m "${stashMessage}"`; if (stashUntracked) cmd += ' -u'; break;
            case 'git cherry-pick': { const o = []; if (cherryNoCommit) o.push('--no-commit'); if (cherrySignoff) o.push('--signoff'); cmd = `git cherry-pick${o.length ? ' ' + o.join(' ') : ''} ${selectedCommits.length ? selectedCommits.join(' ') : '<commit-hashes>'}`; break; }
            case 'git reset': cmd = `git reset ${resetMode} HEAD~1`; break;
            case 'git log': { const p = ['git log']; if (logOneline) (p as any).push('--oneline'); if (logGraph) (p as any).push('--graph'); if (logAll) (p as any).push('--all'); if (logCount) (p as any).push(`-n ${logCount}`); if (logSince) (p as any).push(`--since="${logSince}"`); if (logAuthor) (p as any).push(`--author="${logAuthor}"`); if (logGrep) (p as any).push(`--grep="${logGrep}"`); cmd = (p as any).join(' '); break; }
            case 'git diff': { const p = ['git diff']; if (diffStaged) (p as any).push('--staged'); if (diffStat) (p as any).push('--stat'); if (diffNameOnly) (p as any).push('--name-only'); if (diffPath) (p as any).push(`-- ${diffPath}`); cmd = (p as any).join(' '); break; }
            case 'git clean': { const p = ['git clean']; if (cleanDryRun) (p as any).push('-n'); if (cleanForce) (p as any).push('-f'); if (cleanDirs) (p as any).push('-d'); if (cleanIgnored) (p as any).push('-x'); cmd = (p as any).join(' '); break; }
            case 'git remote': {
                if (remoteAction === 'add') cmd = `git remote add ${remoteName || '<name>'} ${remoteUrl || '<url>'}`; else if (remoteAction === 'remove') cmd = `git remote remove ${remoteName || '<name>'}`; else if (remoteAction === 'rename') cmd = `git remote rename ${remoteName || '<old>'} <new>`; else if (remoteAction === 'set-url') cmd = `git remote set-url ${remoteName || '<name>'} ${remoteUrl || '<url>'}`; else cmd = `git remote prune ${remoteName || 'origin'}`; break;
            }
            case 'git tag': { if (tagDelete) cmd = `git push origin --delete ${tagName || '<tag>'}`; else { cmd = tagAnnotated ? `git tag -a ${tagName || '<tag>'} -m "${tagMessage || 'Release'}"` : `git tag ${tagName || '<tag>'}`; if (tagPush) cmd += ' && git push origin --tags'; } break; }
            case 'git bisect': cmd = bisectSteps[bisectStep]; break;
            case 'git reflog': cmd = reflogSha ? `git checkout -b recovery-branch ${reflogSha}` : 'git reflog --oneline -n 20'; break;
            default: { cmd = action; if (action === 'git merge' && mergeStrategy) cmd += ` --${mergeStrategy}`; if (action === 'git rebase' && rebaseInteractive) cmd += ' -i'; if (noCheckout && action === 'git branch') cmd += ' --no-checkout'; if (force) cmd += ' --force'; if (verbose) cmd += ' --verbose'; if (dryRun) cmd += ' --dry-run'; cmd += ' target-branch'; }
        }
        return cmd;
    }, [action, stashMessage, stashUntracked, selectedCommits, cherryNoCommit, cherrySignoff, resetMode, logOneline, logGraph, logAll, logSince, logAuthor, logGrep, logCount, diffStaged, diffStat, diffNameOnly, diffPath, cleanForce, cleanDirs, cleanDryRun, cleanIgnored, remoteAction, remoteName, remoteUrl, tagName, tagMessage, tagAnnotated, tagPush, tagDelete, bisectStep, reflogSha, mergeStrategy, rebaseInteractive, noCheckout, force, verbose, dryRun]);

    const cmdString = buildCommand();
    const danger = getDangerLevel(action, { force, resetMode, cleanDryRun });
    const explanation = getExplanation(action, { resetMode, mergeStrategy, cleanDryRun, rebaseInteractive, force });

    const saveToHistory = (cmd: any) => {
        const entry = { cmd, date: new Date().toISOString(), action };
        const updated = [entry, ...history.filter((h: any) => h.cmd !== cmd)].slice(0, 15);
        setHistory(updated); localStorage.setItem('cmd_history', JSON.stringify(updated));
    };

    const copyCommand = () => {
        navigator.clipboard.writeText(cmdString); saveToHistory(cmdString);
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const exportAlias = () => { const a = cmdString.replace(/^git /, '').split(' ')[0] + '-custom'; navigator.clipboard.writeText(`[alias]\n    ${a} = ${cmdString.replace(/^git /, '')}`); };
    const exportShellScript = () => {
        const cmds = chainMode && chainCommands.length ? [...chainCommands, cmdString] : [cmdString];
        const script = `#!/bin/bash\n# Generated by GitToolPro\n# ${new Date().toISOString()}\nset -e\n\n${cmds.join('\n')}\n\necho "✓ Done!"`;
        const blob = new Blob([script], { type: 'text/x-shellscript' }); const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'git-commands.sh'; a.click(); URL.revokeObjectURL(url);
    };

    // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    return (
        <div className="tool-page">
            {/* ── HEADER ── */}
            <SEO title="Git Command Builder" description="Build complex Git commands visually without memorizing syntax. GitTool's AI command builder generates safe, ready-to-run Git commands." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Terminal size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Command Builder</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            {/* ── RECIPES ── */}
            {showRecipes && (
                <div className="rounded-2xl border border-border overflow-hidden mb-6" style={{ background: 'linear-gradient(180deg, var(--card), transparent)' }}>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                        <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles size={14} className="text-primary" /> Common Recipes</h3>
                        <button onClick={() => setShowRecipes(false)} className="btn-ghost-sm"><X size={14} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
                        {RECIPES.map((r: any, i: any) => (
                            <button key={i} onClick={() => { navigator.clipboard.writeText(r.cmd); saveToHistory(r.cmd); }}
                                className="text-left p-3.5 rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 group cursor-pointer" style={{ background: 'var(--background)' }}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{r.name}</span>
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${r.danger === 'destructive' ? 'bg-red-500/10 text-red-500 border-red-500/20' : r.danger === 'caution' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>{r.danger}</span>
                                </div>
                                <code className="text-[10px] text-muted-foreground font-mono block truncate">{r.cmd}</code>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── HISTORY ── */}
            {showHistory && (
                <div className="rounded-2xl border border-border overflow-hidden mb-6" style={{ background: 'linear-gradient(180deg, var(--card), transparent)' }}>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                        <h3 className="text-sm font-bold flex items-center gap-2"><Clock size={14} className="text-primary" /> Command History</h3>
                        <div className="flex gap-2">
                            <button onClick={() => { setHistory([]); localStorage.removeItem('cmd_history'); }} className="btn-ghost-sm text-destructive"><Trash2 size={12} /></button>
                            <button onClick={() => setShowHistory(false)} className="btn-ghost-sm"><X size={14} /></button>
                        </div>
                    </div>
                    {history.length === 0
                        ? <p className="text-center text-sm text-muted-foreground py-8">No commands yet. Copy a command to save it here.</p>
                        : <div className="divide-y divide-border/50 max-h-[280px] overflow-y-auto">
                            {history.map((h: any, i: any) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                                    <div className="flex-1 min-w-0"><code className="text-xs font-mono text-foreground block truncate">{h.cmd}</code><span className="text-[10px] text-muted-foreground">{timeAgo(h.date)}</span></div>
                                    <button onClick={() => navigator.clipboard.writeText(h.cmd)} className="btn-ghost-sm ml-2 shrink-0"><Copy size={12} /></button>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            )}

            {/* ── MAIN GRID ── */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
                {/* ────── LEFT: BUILDER ────── */}
                <div className="flex flex-col gap-6">
                    <div className="rounded-2xl border border-border overflow-hidden shadow-sm" style={{ background: 'var(--card)' }}>
                        <div style={{ padding: '28px 28px 32px' }}>
                            {/* Action + Branch selectors */}
                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</label>
                                    <Select value={action} onValueChange={(v: any) => { setAction(v); if (v !== 'git cherry-pick') setSelectedCommits([]); }}>
                                        <SelectTrigger className="w-full h-11 rounded-xl bg-background/80 border-border/60 text-sm font-semibold"><SelectValue /></SelectTrigger>
                                        <SelectContent>{ACTIONS.map((a: any) => { const Icon = ACTION_ICONS[a]; return <SelectItem key={a} value={a}><span className="inline-flex items-center gap-2">{Icon && <Icon size={14} className="text-muted-foreground" />}{a}</span></SelectItem>; })}</SelectContent>
                                    </Select>
                                </div>
                                <div className="form-field">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</label>
                                    <div className="relative">
                                        <div className="flex items-center h-11 w-full rounded-xl border border-border/60 bg-muted/30 px-3 text-sm font-medium text-muted-foreground cursor-not-allowed">{branch || 'main'}</div>
                                        <GitBranch size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                    </div>
                                </div>
                            </div>

                            {/* ── DYNAMIC OPTIONS ── */}
                            <div className="mt-7">

                                {/* RESET */}
                                {action === 'git reset' && (<>
                                    <SectionHeading>Reset Mode</SectionHeading>
                                    <div className="flex flex-col gap-3">
                                        {[
                                            { mode: '--soft', desc: 'Moves HEAD. Files remain staged.', gradient: 'rgba(16,185,129,0.08)', ring: 'ring-emerald-500/50' },
                                            { mode: '--mixed', desc: 'Moves HEAD. Files become unstaged.', gradient: 'rgba(245,158,11,0.08)', ring: 'ring-amber-500/50' },
                                            { mode: '--hard', desc: 'Destroys ALL uncommitted changes. ⚠️', gradient: 'rgba(239,68,68,0.08)', ring: 'ring-red-500/50' },
                                        ].map((r: any) => (
                                            <div key={r.mode} onClick={() => setResetMode(r.mode)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${resetMode === r.mode ? `ring-2 ${r.ring} shadow-sm` : 'border-border/50 hover:border-border'}`}
                                                style={resetMode === r.mode ? { background: r.gradient } : {}}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${resetMode === r.mode ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}>
                                                        {resetMode === r.mode && <Check size={12} className="text-primary-foreground" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold font-mono flex items-center gap-1">{r.mode}<Tip text={FLAG_TOOLTIPS[r.mode]} /></p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>)}

                                {/* STASH */}
                                {action === 'git stash' && (<>
                                    <SectionHeading>Stash Configuration</SectionHeading>
                                    <div className="space-y-4">
                                        <div className="form-field"><label>Stash Message</label><input className="form-input rounded-xl h-11" value={stashMessage} onChange={e => setStashMessage(e.target.value)} placeholder="e.g. WIP: refactoring dashboard" /></div>
                                        <FlagCard label="Include Untracked (-u)" desc="Stash new files not yet added to git" checked={stashUntracked} onChange={setStashUntracked} />
                                    </div>
                                </>)}

                                {/* CHERRY-PICK */}
                                {action === 'git cherry-pick' && (<>
                                    <SectionHeading>Select Commits</SectionHeading>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <FlagCard label="--no-commit" desc="Apply without committing" checked={cherryNoCommit} onChange={setCherryNoCommit} tooltip={FLAG_TOOLTIPS['--no-commit']} />
                                        <FlagCard label="--signoff" desc="Add Signed-off-by" checked={cherrySignoff} onChange={setCherrySignoff} tooltip={FLAG_TOOLTIPS['--signoff']} />
                                    </div>
                                    {commitError && <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2 text-sm text-destructive mb-4">{commitError}</div>}
                                    <div className="border border-border/50 rounded-xl overflow-hidden">
                                        {loadingCommits ? <div className="py-10 flex justify-center"><Loader2 size={24} className="text-primary animate-spin" /></div>
                                            : commits.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">No recent commits found.</div>
                                                : <div className="max-h-[260px] overflow-y-auto"><table className="data-table" style={{ margin: 0 }}><thead className="bg-card sticky top-0 z-10"><tr><th style={{ width: 40 }}></th><th>SHA</th><th>Message</th><th>Date</th></tr></thead><tbody>{commits.map((c: any) => (
                                                    <tr key={c.sha} className={selectedCommits.includes(c.sha) ? 'bg-primary/5' : ''} style={{ cursor: 'pointer' }} onClick={() => setSelectedCommits(p => (p as any).includes(c.sha) ? (p as any).filter((s: any) => s !== c.sha) : [...p, c.sha])}>
                                                        <td onClick={(e: any) => e.stopPropagation()}><input type="checkbox" checked={selectedCommits.includes(c.sha)} onChange={() => setSelectedCommits(p => (p as any).includes(c.sha) ? (p as any).filter((s: any) => s !== c.sha) : [...p, c.sha])} className="rounded" /></td>
                                                        <td><code className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-bold border border-border">{c.sha.slice(0, 7)}</code></td>
                                                        <td className="text-[13px] font-semibold truncate max-w-[200px]">{c.message}</td>
                                                        <td className="text-xs text-muted-foreground">{timeAgo(c.date)}</td>
                                                    </tr>))}</tbody></table></div>}
                                    </div>
                                    {selectedCommits.length > 0 && <p className="text-xs text-primary font-semibold mt-3">{selectedCommits.length} commit{selectedCommits.length > 1 ? 's' : ''} selected</p>}
                                </>)}

                                {/* MERGE */}
                                {action === 'git merge' && (<>
                                    <SectionHeading>Merge Strategy</SectionHeading>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[{ id: 'squash', l: '--squash', d: 'One commit' }, { id: 'no-ff', l: '--no-ff', d: 'Always merge commit' }, { id: 'ff-only', l: '--ff-only', d: 'Fast-forward only' }].map((s: any) => (
                                            <div key={s.id} onClick={() => setMergeStrategy(p => p === s.id ? '' : s.id)}
                                                className={`px-3 py-3 rounded-xl border cursor-pointer text-center transition-all duration-200 ${mergeStrategy === s.id ? 'border-primary bg-primary/8 shadow-sm ring-1 ring-primary/30' : 'border-border/50 hover:border-border'}`}>
                                                <div className="text-xs font-bold font-mono">{s.l}</div>
                                                <div className="text-[10px] text-muted-foreground mt-1">{s.d}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {mergeStrategy && <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1"><AlertCircle size={10} /> Merge strategies are mutually exclusive</p>}
                                </>)}

                                {/* REBASE */}
                                {action === 'git rebase' && <FlagCard label="Interactive Mode (-i)" desc="Open editor to squash, reword, or drop commits" checked={rebaseInteractive} onChange={setRebaseInteractive} tooltip={FLAG_TOOLTIPS['-i']} />}

                                {/* LOG */}
                                {action === 'git log' && (<>
                                    <SectionHeading>Log Filters</SectionHeading>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FlagCard label="--oneline" desc="One line per commit" checked={logOneline} onChange={setLogOneline} tooltip={FLAG_TOOLTIPS['--oneline']} />
                                        <FlagCard label="--graph" desc="Branch topology graph" checked={logGraph} onChange={setLogGraph} tooltip={FLAG_TOOLTIPS['--graph']} />
                                        <FlagCard label="--all" desc="All branches" checked={logAll} onChange={setLogAll} tooltip={FLAG_TOOLTIPS['--all']} />
                                        <div className="form-field"><label>-n (count)</label><input className="form-input rounded-xl" value={logCount} onChange={(e: any) => setLogCount(e.target.value)} placeholder="e.g. 20" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div className="form-field"><label>--since</label><input className="form-input rounded-xl" value={logSince} onChange={(e: any) => setLogSince(e.target.value)} placeholder="2 weeks ago" /></div>
                                        <div className="form-field"><label>--author</label><input className="form-input rounded-xl" value={logAuthor} onChange={(e: any) => setLogAuthor(e.target.value)} placeholder="John" /></div>
                                        <div className="form-field" style={{ gridColumn: 'span 2' }}><label>--grep</label><input className="form-input rounded-xl" value={logGrep} onChange={(e: any) => setLogGrep(e.target.value)} placeholder="fix, feat, refactor" /></div>
                                    </div>
                                </>)}

                                {/* DIFF */}
                                {action === 'git diff' && (<>
                                    <SectionHeading>Diff Options</SectionHeading>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FlagCard label="--staged" desc="Staged changes only" checked={diffStaged} onChange={setDiffStaged} tooltip={FLAG_TOOLTIPS['--staged']} />
                                        <FlagCard label="--stat" desc="Summary stats" checked={diffStat} onChange={setDiffStat} tooltip={FLAG_TOOLTIPS['--stat']} />
                                        <FlagCard label="--name-only" desc="File names only" checked={diffNameOnly} onChange={setDiffNameOnly} tooltip={FLAG_TOOLTIPS['--name-only']} />
                                        <div className="form-field"><label>File Path</label><input className="form-input rounded-xl" value={diffPath} onChange={(e: any) => setDiffPath(e.target.value)} placeholder="src/index.js" /></div>
                                    </div>
                                </>)}

                                {/* CLEAN */}
                                {action === 'git clean' && (<>
                                    <SectionHeading>Clean Options</SectionHeading>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FlagCard label="-n (dry run)" desc="Preview deletions" checked={cleanDryRun} onChange={setCleanDryRun} tooltip={FLAG_TOOLTIPS['-n']} />
                                        <FlagCard label="-f (force)" desc="Delete files" checked={cleanForce} onChange={setCleanForce} tooltip={FLAG_TOOLTIPS['-f']} />
                                        <FlagCard label="-d (directories)" desc="Remove dirs too" checked={cleanDirs} onChange={setCleanDirs} tooltip={FLAG_TOOLTIPS['-d']} />
                                        <FlagCard label="-x (ignored)" desc="Remove gitignored" checked={cleanIgnored} onChange={setCleanIgnored} tooltip={FLAG_TOOLTIPS['-x']} conflict={cleanIgnored ? 'Deletes .gitignore files!' : ''} />
                                    </div>
                                </>)}

                                {/* REMOTE */}
                                {action === 'git remote' && (<>
                                    <SectionHeading>Remote Action</SectionHeading>
                                    <div className="flex gap-1.5 flex-wrap mb-4">
                                        {['add', 'remove', 'rename', 'set-url', 'prune'].map((a: any) => (
                                            <button key={a} onClick={() => setRemoteAction(a)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${remoteAction === a ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border/50 hover:bg-muted/50 text-muted-foreground'}`}>{a}</button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="form-field"><label>Name</label><input className="form-input rounded-xl" value={remoteName} onChange={(e: any) => setRemoteName(e.target.value)} placeholder="origin" /></div>
                                        {['add', 'set-url'].includes(remoteAction) && <div className="form-field"><label>URL</label><input className="form-input rounded-xl" value={remoteUrl} onChange={e => setRemoteUrl(e.target.value)} placeholder="https://github.com/..." /></div>}
                                    </div>
                                </>)}

                                {/* TAG */}
                                {action === 'git tag' && (<>
                                    <SectionHeading>Tag Builder</SectionHeading>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="form-field"><label>Tag Name</label><input className="form-input rounded-xl" value={tagName} onChange={(e: any) => setTagName(e.target.value)} placeholder="v1.0.0" /></div>
                                        {tagAnnotated && !tagDelete && <div className="form-field"><label>Message</label><input className="form-input rounded-xl" value={tagMessage} onChange={(e: any) => setTagMessage(e.target.value)} placeholder="Release 1.0" /></div>}
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-3">
                                        <FlagCard label="Annotated" desc="Full tag object" checked={tagAnnotated} onChange={(v: any) => { setTagAnnotated(v); if (v) setTagDelete(false); }} />
                                        <FlagCard label="Push Tags" desc="Push to origin" checked={tagPush} onChange={(v: any) => { setTagPush(v); if (v) setTagDelete(false); }} />
                                        <FlagCard label="Delete Remote" desc="Remove from origin" checked={tagDelete} onChange={(v: any) => { setTagDelete(v); if (v) { setTagPush(false); setTagAnnotated(false); } }} />
                                    </div>
                                </>)}

                                {/* BISECT */}
                                {action === 'git bisect' && (<>
                                    <SectionHeading>Bisect Wizard</SectionHeading>
                                    <div className="flex flex-col gap-2">
                                        {bisectSteps.map((step: any, i: any) => (
                                            <div key={i} onClick={() => setBisectStep(i)}
                                                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${bisectStep === i ? 'ring-2 ring-primary border-primary/30 shadow-sm' : i < bisectStep ? 'border-emerald-500/30' : 'border-border/50'}`}
                                                style={bisectStep === i ? { background: 'rgba(59,130,246,0.06)' } : i < bisectStep ? { background: 'rgba(16,185,129,0.04)' } : {}}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${i < bisectStep ? 'bg-emerald-500 text-white' : bisectStep === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i < bisectStep ? <Check size={14} /> : i + 1}</div>
                                                <code className="text-sm font-mono font-medium">{step}</code>
                                            </div>
                                        ))}
                                    </div>
                                </>)}

                                {/* REFLOG */}
                                {action === 'git reflog' && (<>
                                    <SectionHeading>Reflog Recovery</SectionHeading>
                                    <div className="form-field"><label>Recover from SHA</label><input className="form-input rounded-xl h-11" value={reflogSha} onChange={(e: any) => setReflogSha(e.target.value)} placeholder="Paste SHA from reflog to generate recovery command" /></div>
                                    <p className="text-[11px] text-muted-foreground mt-3">Run <code className="px-1.5 py-0.5 bg-muted rounded text-foreground text-[10px]">git reflog</code> first, then paste the SHA above.</p>
                                </>)}

                                {/* GENERAL MODIFIERS */}
                                {['git checkout', 'git branch', 'git merge', 'git rebase'].includes(action) && (
                                    <div className="mt-6">
                                        <SectionHeading>Execution Modifiers</SectionHeading>
                                        <div className="grid grid-cols-2 gap-3">
                                            <FlagCard label="Force (--force)" desc="Override conflict checks" checked={force} onChange={setForce} tooltip={FLAG_TOOLTIPS['--force']} />
                                            <FlagCard label="Verbose (--verbose)" desc="Extended output" checked={verbose} onChange={setVerbose} tooltip={FLAG_TOOLTIPS['--verbose']} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* FOOTER */}
                            <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex gap-2">
                                    <button onClick={() => setChainMode(!chainMode)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${chainMode ? 'bg-primary/10 border-primary/40 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'}`}>
                                        <Link2 size={12} /> Chain {chainMode && `(${chainCommands.length})`}
                                    </button>
                                    {chainMode && <button onClick={() => setChainCommands((p: any) => [...p, cmdString])} className="btn-ghost-sm"><Zap size={12} /> Add</button>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={resetAll} className="btn-ghost"><RotateCcw size={14} /> Reset</button>
                                    <button onClick={copyCommand} className="btn-primary group relative overflow-hidden">
                                        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy & Save</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ────── RIGHT: TERMINAL + INFO ────── */}
                <div className="flex flex-col gap-4">
                    {/* Terminal */}
                    <div className="rounded-2xl overflow-hidden flex flex-col shadow-lg" style={{ background: '#0c1222', minHeight: 420, border: '1px solid rgba(255,255,255,0.06)' }}>
                        {/* Header */}
                        <div className="flex justify-between items-center px-5 py-3" style={{ background: 'linear-gradient(180deg, rgba(30,41,59,0.6), rgba(15,23,42,0.4))', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
                                <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors" />
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#475569' }}>Live Preview</span>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider border" style={{ background: danger.bg, color: danger.color, borderColor: danger.border }}>
                                    <danger.icon size={11} strokeWidth={3} />{danger.text}
                                </div>
                            </div>
                        </div>
                        {/* Body */}
                        <div className="flex-1 px-6 py-5 font-mono text-[13px]" style={{ lineHeight: 2 }}>
                            <div className="flex gap-3 flex-wrap">
                                <span style={{ color: '#34d399' }}>➜</span>
                                <span style={{ color: '#475569' }}>~/projects</span>
                                <span style={{ color: '#818cf8', fontStyle: 'italic' }}>git({branch || 'main'})</span>
                            </div>
                            <div className="mt-4" style={{ wordBreak: 'break-all' }}>
                                {chainMode && chainCommands.length > 0 && chainCommands.map((c: any, i: any) => <div key={i} className="mb-1">{highlightCommand(c)}<span style={{ color: '#475569' }}> &&</span></div>)}
                                {highlightCommand(cmdString)}
                                <span className="inline-block w-0.5 h-5 ml-1 align-middle" style={{ background: '#818cf8', animation: 'pulse 1.2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
                            </div>
                            <div className="mt-8 text-xs leading-relaxed" style={{ color: '#334155' }}>
                                <span style={{ color: '#475569' }}>#</span> {explanation}
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="px-5 py-3 flex flex-wrap justify-between items-center gap-2" style={{ background: 'rgba(8,12,24,0.6)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            <div className="flex gap-1.5">
                                <button onClick={exportAlias} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer hover:bg-white/5" style={{ color: '#64748b' }}><BookOpen size={12} /> Alias</button>
                                <button onClick={exportShellScript} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer hover:bg-white/5" style={{ color: '#64748b' }}><Download size={12} /> .sh</button>
                            </div>
                            <button onClick={copyCommand} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer hover:bg-white/5" style={{ color: '#94a3b8' }}>
                                {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                            </button>
                        </div>
                    </div>

                    {/* Explanation Card */}
                    <div className="rounded-2xl border border-border/50 p-5 flex gap-4" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.04), rgba(139,92,246,0.04))' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))' }}>
                            <Lightbulb size={18} style={{ color: '#60a5fa' }} />
                        </div>
                        <div>
                            <h5 className="text-sm font-bold text-foreground">What this does</h5>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{explanation}</p>
                            {danger.level === 'destructive' && <p className="text-[11px] text-red-400 mt-2 font-semibold">⚠ This operation is destructive and cannot be undone.</p>}
                        </div>
                    </div>

                    {/* Shortcuts */}
                    <div className="text-[10px] text-muted-foreground/60 flex flex-wrap gap-x-5 gap-y-1 px-1">
                        <span><kbd className="px-1.5 py-0.5 bg-muted/50 rounded border border-border/50 text-[9px] font-mono">Ctrl+↵</kbd> Copy</span>
                        <span><kbd className="px-1.5 py-0.5 bg-muted/50 rounded border border-border/50 text-[9px] font-mono">Ctrl+⇧+R</kbd> Reset</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

