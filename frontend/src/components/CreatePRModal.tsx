'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, GitPullRequest, Loader2, ExternalLink, CheckCircle, AlertTriangle, Sparkles, FileText, ChevronDown, ChevronRight, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../lib/apiClient';

export default function CreatePRModal({ owner, repo, head, base, stats, compareData, onClose, onCreated }: any) {
    const [title, setTitle] = useState(`${head} — ${base}`);
    const [body, setBody] = useState('');
    const [isDraft, setIsDraft] = useState(false);
    
    // UI states
    const [creating, setCreating] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showCommits, setShowCommits] = useState(false);
    const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'
    const [showAnalysis, setShowAnalysis] = useState(true);
    
    const filesCount = compareData?.files?.length || 0;
    const additionsCount = compareData?.totalAdditions || 0;

    // Compute Size Classification
    let prSize = 'Small';
    if (filesCount > 100) prSize = 'XL';
    else if (filesCount > 50) prSize = 'Large';
    else if (filesCount > 10) prSize = 'Medium';
    
    // Compute warnings based on user requests
    const isLargePR = filesCount > 100;
    const isHighAdditions = additionsCount > 5000;
    const hasSensitiveFiles = compareData?.files?.some((f: any) => f.filename.includes('.env') || f.filename.includes('secret') || f.filename.includes('token') || f.filename.includes('migration'));
    const hasConfigChanges = compareData?.files?.some((f: any) => f.filename.includes('package.json') || f.filename.includes('package-lock.json') || f.filename.includes('requirements.txt'));

    // Compute Risk Score
    let riskScore = 0;
    if (isLargePR) riskScore += 20;
    if (isHighAdditions) riskScore += 20;
    if (hasSensitiveFiles) riskScore += 25;
    if (hasConfigChanges) riskScore += 15;
    if (compareData?.commits?.length > 10) riskScore += 10;
    
    riskScore = Math.min(riskScore, 100); // Cap at 100
    
    let riskLevel = 'LOW';
    let riskColor = 'text-emerald-400';
    let riskBg = 'bg-emerald-400';
    if (riskScore >= 70) {
        riskLevel = 'HIGH';
        riskColor = 'text-red-400';
        riskBg = 'bg-red-400';
    } else if (riskScore >= 40) {
        riskLevel = 'MEDIUM';
        riskColor = 'text-amber-400';
        riskBg = 'bg-amber-400';
    }

    // Compute Complexity
    let complexity = 'Low';
    let complexityColor = 'text-emerald-400';
    if (prSize === 'XL' || riskScore >= 70) {
        complexity = 'High';
        complexityColor = 'text-red-400';
    } else if (prSize === 'Large' || riskScore >= 40 || hasConfigChanges) {
        complexity = 'Medium';
        complexityColor = 'text-amber-400';
    }

    // Compute Impact Analysis
    let impactCounts = { backend: 0, frontend: 0, database: 0, config: 0, other: 0 };
    (compareData?.files || []).forEach((f: any) => {
        const path = f.filename.toLowerCase();
        if (path.includes('backend/')) impactCounts.backend++;
        else if (path.includes('frontend/') || path.includes('src/components/') || path.includes('src/pages/')) impactCounts.frontend++;
        else if (path.includes('migration') || path.endsWith('.sql')) impactCounts.database++;
        else if (path.includes('config') || path.includes('package.json') || path.includes('.env')) impactCounts.config++;
        else impactCounts.other++;
    });

    const totalImpactFiles = filesCount || 1; // Prevent division by zero
    const backendPct = Math.round((impactCounts.backend / totalImpactFiles) * 100);
    const frontendPct = Math.round((impactCounts.frontend / totalImpactFiles) * 100);
    const databasePct = Math.round((impactCounts.database / totalImpactFiles) * 100);
    const configPct = Math.round((impactCounts.config / totalImpactFiles) * 100);
    const handleCreate = useCallback(async () => {
        if (!title.trim()) return;
        setCreating(true);
        setError(null);
        try {
            const res = await api.post(`/branches/${owner}/${repo}/pulls`, {
                title: title.trim(),
                body: body.trim(),
                head,
                base,
                draft: isDraft
            });
            setResult(res);
            onCreated?.(res);
        } catch (err: any) {
            setError(err.message || 'Failed to create PR');
        } finally {
            setCreating(false);
        }
    }, [owner, repo, title, body, head, base, isDraft, onCreated]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if(onClose) onClose();
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleCreate();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCreate, onClose]);

    const handleGenerateSummary = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await api.post(`/branches/${owner}/${repo}/pr-summary`, { base, head });
            
            // Try to extract a title from the markdown if it exists (e.g. # Title)
            const generatedBody = res.content || '';
            const lines = generatedBody.split('\n');
            let parsedTitle = title;
            if (lines[0] && lines[0].startsWith('# ')) {
                parsedTitle = lines[0].replace('# ', '').trim();
                // Remove the title from the body
                setBody(lines.slice(1).join('\n').trim());
            } else {
                setBody(generatedBody);
            }
            setTitle(parsedTitle);
        } catch (err: any) {
            setError(err.message || 'Failed to generate summary');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-[900px] rounded-xl shadow-2xl flex flex-col max-h-[80vh] bg-[#0a0a0e]/95 backdrop-blur-xl border border-white/[0.08]"
                style={{ }}>

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.06] shrink-0 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <GitPullRequest size={18} className="text-primary" />
                            <h2 className="text-[16px] font-bold">Create Pull Request</h2>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08]">
                            <GitPullRequest size={14} className="text-primary" />
                            <span className="font-mono text-[12px] font-semibold text-foreground">{head}</span>
                        </div>
                        <span className="text-muted-foreground/40 font-mono">—</span>
                        <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08]">
                            <span className="font-mono text-[12px] font-semibold text-foreground/80">{base}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowAnalysis(!showAnalysis)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg hover:bg-white/[0.06] text-muted-foreground transition-colors mr-2">
                            {showAnalysis ? <><ChevronRight size={14}/> Collapse Analysis</> : <><ChevronDown size={14}/> Show Analysis</>}
                        </button>
                        <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-muted-foreground transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {result ? (
                    /* ── Success ── */
                    <div className="px-6 py-12 text-center flex-1 overflow-auto">
                        <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                        <h3 className="text-[18px] font-bold mb-2">PR #{result.number} Created</h3>
                        <p className="text-[14px] text-muted-foreground mb-6">{result.title}</p>
                        <a href={result.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[14px] font-medium text-black bg-white hover:bg-white/90 px-6 py-2.5 rounded-lg transition-colors">
                            <ExternalLink size={16} /> View on GitHub
                        </a>
                    </div>
                ) : (
                    /* ── Form Body ── */
                    <div className="flex-1 overflow-hidden flex flex-col custom-scrollbar">
                        <div className={`flex flex-1 overflow-hidden ${showAnalysis ? 'grid grid-cols-[340px_1fr]' : 'flex flex-col'}`}>
                            
                            {/* LEFT SIDE: Analysis Panel */}
                            {showAnalysis && (
                                <div className="border-r border-white/[0.06] flex flex-col overflow-y-auto custom-scrollbar bg-white/[0.01]">
                                    
                                    {/* Stats Blocks */}
                                    {stats && (
                                        <div className="grid grid-cols-4 gap-2 p-4 pb-2 border-b border-white/[0.06]">
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-md p-2 flex flex-col justify-center items-center">
                                                <span className="text-[14px] font-black">{stats.totalCommits}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Commits</span>
                                            </div>
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-md p-2 flex flex-col justify-center items-center">
                                                <span className="text-[14px] font-black">{stats.totalFiles}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Files</span>
                                            </div>
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-md p-2 flex flex-col justify-center items-center">
                                                <span className="text-[14px] font-black text-emerald-400">+{stats.totalAdditions}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Adds</span>
                                            </div>
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-md p-2 flex flex-col justify-center items-center">
                                                <span className="text-[14px] font-black text-red-400">-{stats.totalDeletions}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Dels</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 pt-2 flex flex-col gap-5">
                                        {/* Size & Risk & Complexity */}
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-md p-2 flex flex-col">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Size</span>
                                                <span className={`text-[13px] font-bold mt-auto ${prSize === 'XL' ? 'text-red-400' : prSize === 'Large' ? 'text-amber-400' : 'text-primary'}`}>{prSize}</span>
                                            </div>
                                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-md p-2 flex flex-col">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Complexity</span>
                                                <span className={`text-[13px] font-bold mt-auto ${complexityColor}`}>{complexity}</span>
                                            </div>
                                            <div className="col-span-3 bg-white/[0.02] border border-white/[0.06] rounded-md p-3 flex flex-col mt-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Risk Score</span>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className={`text-[13px] font-bold ${riskColor}`}>{riskLevel}</span>
                                                        <span className={`text-[11px] font-medium opacity-60 ${riskColor}`}>{riskScore}/100</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                    <div className={`h-full ${riskBg}`} style={{ width: `${riskScore}%`}} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Warnings Group */}
                                        {(isLargePR || isHighAdditions || hasSensitiveFiles || hasConfigChanges) && (
                                            <div className="bg-red-500/5 border border-red-500/10 rounded-md p-3">
                                                <span className="text-[11px] font-bold text-red-400 mb-2 flex items-center gap-1.5">
                                                    <AlertTriangle size={14} /> 
                                                    Warnings ({[isLargePR, isHighAdditions, hasSensitiveFiles, hasConfigChanges].filter(Boolean).length})
                                                </span>
                                                <ul className="flex flex-col gap-1.5 list-disc pl-4 mt-2">
                                                    {isLargePR && <li className="text-[12px] text-foreground/80">Large PR (&gt; 100 files)</li>}
                                                    {isHighAdditions && <li className="text-[12px] text-foreground/80">High additions risk</li>}
                                                    {hasSensitiveFiles && <li className="text-[12px] text-foreground/80">Sensitive files modified</li>}
                                                    {hasConfigChanges && <li className="text-[12px] text-foreground/80">Dependencies changed</li>}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Impact Analysis */}
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Impact Analysis</span>
                                            <div className="flex flex-col gap-3">
                                                {backendPct > 0 && (
                                                    <div className="flex items-center justify-between text-[11px] font-medium text-foreground/80">
                                                        <div className="w-14 shrink-0">Backend</div>
                                                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mx-3 shadow-inner">
                                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${backendPct}%` }} />
                                                        </div>
                                                        <div className="w-8 text-right text-muted-foreground">{backendPct}%</div>
                                                    </div>
                                                )}
                                                {frontendPct > 0 && (
                                                    <div className="flex items-center justify-between text-[11px] font-medium text-foreground/80">
                                                        <div className="w-14 shrink-0">Frontend</div>
                                                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mx-3 shadow-inner">
                                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${frontendPct}%` }} />
                                                        </div>
                                                        <div className="w-8 text-right text-muted-foreground">{frontendPct}%</div>
                                                    </div>
                                                )}
                                                {databasePct > 0 && (
                                                    <div className="flex items-center justify-between text-[11px] font-medium text-foreground/80">
                                                        <div className="w-14 shrink-0">Database</div>
                                                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mx-3 shadow-inner">
                                                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${databasePct}%` }} />
                                                        </div>
                                                        <div className="w-8 text-right text-muted-foreground">{databasePct}%</div>
                                                    </div>
                                                )}
                                                {configPct > 0 && (
                                                    <div className="flex items-center justify-between text-[11px] font-medium text-foreground/80">
                                                        <div className="w-14 shrink-0">Config</div>
                                                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mx-3 shadow-inner">
                                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${configPct}%` }} />
                                                        </div>
                                                        <div className="w-8 text-right text-muted-foreground">{configPct}%</div>
                                                    </div>
                                                )}
                                                {backendPct === 0 && frontendPct === 0 && databasePct === 0 && configPct === 0 && (
                                                    <div className="flex items-center justify-between text-[11px] font-medium text-foreground/80">
                                                        <div className="w-14 shrink-0">Other</div>
                                                        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mx-3 shadow-inner">
                                                            <div className="h-full bg-white/30 rounded-full" style={{ width: `100%` }} />
                                                        </div>
                                                        <div className="w-8 text-right text-muted-foreground">100%</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Commits Preview */}
                                        {compareData?.commits && compareData.commits.length > 0 && (
                                            <div className="border border-white/[0.06] rounded-lg overflow-hidden bg-white/[0.01]">
                                                <button onClick={() => setShowCommits(!showCommits)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
                                                    <div className="flex items-center gap-2 text-[12px] font-medium text-foreground/80">
                                                        {showCommits ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        Commits included ({compareData.commits.length})
                                                    </div>
                                                </button>
                                                {showCommits && (
                                                    <div className="flex flex-col border-t border-white/[0.06] max-h-40 overflow-y-auto custom-scrollbar">
                                                        {compareData.commits.map((c: any) => (
                                                            <div key={c.sha} className="px-4 py-2 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.01] flex flex-col gap-1">
                                                                <div className="text-[12px] font-medium font-mono text-foreground/90 truncate">{c.message}</div>
                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                    <span>{c.author}</span>
                                                                    <span className="opacity-50">•</span>
                                                                    <span className="font-mono">{c.shortSha}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* RIGHT SIDE: Form */}
                            <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar p-6 gap-6 relative">
                                
                                {/* Title */}
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Title</label>
                                    <input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg text-[13px] bg-white/[0.03] border border-white/[0.08] outline-none focus:border-primary/40 focus:bg-white/[0.05] text-foreground font-medium transition-all shadow-inner shadow-black/20"
                                        placeholder="Brief, descriptive title"
                                    />
                                </div>

                                {/* Description Editor/Preview */}
                                <div className="border border-white/[0.08] rounded-lg overflow-hidden flex flex-col focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10 transition-all flex-1 min-h-[300px] shadow-inner shadow-black/20 bg-white/[0.01]">
                                    <div className="flex items-center justify-between bg-white/[0.02] border-b border-white/[0.06] px-2 py-1.5 shrink-0">
                                        <div className="flex flex-1">
                                            <button onClick={() => setActiveTab('write')} className={`px-4 py-1.5 text-[12px] font-bold rounded-md ${activeTab === 'write' ? 'bg-white/[0.06] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'}`}>Write</button>
                                            <button onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 text-[12px] font-bold rounded-md ${activeTab === 'preview' ? 'bg-white/[0.06] text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'}`}>Preview</button>
                                        </div>
                                        <button 
                                            onClick={handleGenerateSummary} 
                                            disabled={generating}
                                            className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest px-3 py-1.5 rounded-md hover:bg-primary/10 transition-colors shrink-0 disabled:opacity-50">
                                            {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            Generate Summary
                                        </button>
                                    </div>
                                    
                                    {activeTab === 'write' ? (
                                        <textarea
                                            value={body}
                                            onChange={e => setBody(e.target.value)}
                                            className="w-full h-full px-4 py-4 text-[13px] bg-transparent outline-none text-foreground resize-none font-mono leading-relaxed"
                                            placeholder="Add a description... Markdown is supported. Leave empty to auto-generate."
                                        />
                                    ) : (
                                        <div className="w-full h-full px-5 py-5 text-[13px] bg-transparent text-foreground/90 prose prose-invert prose-sm max-w-none overflow-y-auto custom-scrollbar">
                                            {body ? (
                                                <ReactMarkdown>{body}</ReactMarkdown>
                                            ) : (
                                                <span className="italic opacity-50">No description provided.</span>
                                            )}
                                        </div>
                                    )}
                                </div>


                            </div>

                        </div>
                    </div>
                )}
                
                {/* Footer Actions */}
                {!result && (
                    <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0 rounded-b-xl sticky bottom-0 z-10">
                        {/* Error Notification */}
                        <div className="flex-1 mr-4">
                            {error && (
                                <div className="flex items-center gap-2 text-[12px] text-red-400 font-bold bg-red-400/10 px-3 py-1.5 rounded-md border border-red-400/20 inline-flex">
                                    <AlertTriangle size={14} className="shrink-0" /> {error}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 shrink-0">
                            <button 
                                onClick={() => setIsDraft(!isDraft)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-[13px] font-bold border cursor-pointer ${isDraft ? 'bg-primary/10 text-primary border-primary/30 shadow-inner shadow-primary/10' : 'bg-white/[0.02] text-foreground/70 border-white/[0.08] hover:bg-white/[0.06] hover:text-foreground'}`}>
                                {isDraft ? <Check size={14} /> : <GitPullRequest size={14} className="opacity-70" />}
                                {isDraft ? 'Draft Mode Enabled' : 'Mark as Draft'}
                            </button>
                            <button onClick={onClose}
                                className="px-5 py-2 text-[13px] font-medium rounded-lg text-foreground bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleCreate} disabled={creating || !title.trim()}
                                style={{ boxShadow: '0 0 20px rgba(120,160,255,0.15)' }}
                                className="px-6 py-2 text-[13px] font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                                {creating
                                    ? <><Loader2 size={14} className="animate-spin" /> Creating…</>
                                    : <>{isDraft ? 'Save Draft PR' : 'Create Pull Request'}</>
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

