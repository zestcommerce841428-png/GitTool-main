'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import {
    FileText, Loader2, Wand2, Copy, Check, Download,
    Eye, Code2, BookOpen, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

const LOAD_STEPS = [
    'Scanning route handlers & controllers...',
    'Inferring request / response shapes...',
    'Generating structured documentation...',
];

export default function ApiDocsGenerator() {
    const { selectedRepo: repo } = useWorkspace();
    const [content, setContent]   = useState('');
    const [loading, setLoading]   = useState(false);
    const [loadStep, setLoadStep] = useState(0);
    const [error, setError]       = useState<string | null>(null);
    const [tab, setTab]           = useState<'preview' | 'markdown'>('preview');
    const [copied, setCopied]     = useState(false);

    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

    const handleGenerate = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        setLoading(true); setError(null); setContent(''); setLoadStep(0);

        const ticker = setInterval(() =>
            setLoadStep(s => Math.min(s + 1, LOAD_STEPS.length - 1)), 2000);

        try {
            const o = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/tools/${o}/${repo.name}/generate-api-docs`);
            setContent(res.content || 'No API documentation could be generated.');
            setTab('preview');
        } catch (err: any) {
            setError(err.message || 'Generation failed');
        } finally {
            clearInterval(ticker);
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'API_DOCS.md'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="tool-page max-w-[1200px]">
            <SEO
                title="AI API Docs Generator - Auto Generate API Documentation"
                description="Automatically generate API documentation from your GitHub repository code using AI."
                keywords={[]}
                noIndex={true}
            />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BookOpen size={16} />
                    </div>
                    <h2 className="tool-page-title">API Docs Generator</h2>
                    {content && (
                        <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full border border-border/50 bg-muted/40 text-muted-foreground">
                            {wordCount.toLocaleString()} words
                        </span>
                    )}
                </div>
            </NavbarPortal>

            {/* ---- Empty / Hero state ---- */}
            {!content && !loading && (
                <div className="panel relative overflow-hidden flex flex-col items-center justify-center py-24 text-center gap-5">
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.025]">
                        <BookOpen size={280} />
                    </div>

                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/30"
                        style={{ boxShadow: '0 8px 32px rgba(139,92,246,0.2)' }}>
                        <BookOpen size={32} className="text-violet-400" />
                    </div>

                    <div className="max-w-md">
                        <p className="text-[17px] font-bold text-foreground">Auto-generate your API docs</p>
                        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                            AI scans your route handlers, controllers, and middleware to produce structured,
                            developer-friendly API documentation — no manual effort required.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 text-[11px] text-muted-foreground">
                        {['Endpoints & methods', 'Request / response shapes', 'Auth requirements', 'Query params'].map(f => (
                            <span key={f} className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-3 py-1.5">
                                <CheckCircle2 size={10} className="text-violet-400" /> {f}
                            </span>
                        ))}
                    </div>

                    {error && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/8 px-4 py-2.5 text-[12px] text-destructive max-w-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !repo}
                        className="flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #8b5cf6dd, #6366f188)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
                    >
                        <Wand2 size={15} />
                        {repo ? `Generate for ${repo.name}` : 'Select a repository first'}
                        {repo && <ArrowRight size={14} />}
                    </button>
                </div>
            )}

            {/* ---- Loading state ---- */}
            {loading && (
                <div className="panel flex flex-col items-center justify-center py-24 gap-6">
                    <div className="relative flex h-20 w-20 items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                            <circle cx="40" cy="40" r="36" fill="none" strokeWidth="2"
                                stroke="#8b5cf6"
                                strokeLinecap="round"
                                strokeDasharray="226"
                                strokeDashoffset={226 - (226 * (loadStep + 1)) / LOAD_STEPS.length}
                                style={{ transition: 'stroke-dashoffset 1.4s ease' }}
                            />
                        </svg>
                        <BookOpen size={26} className="text-violet-400 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <p className="text-[15px] font-bold">Analyzing {repo?.name}...</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">Reading routes & inferring API shapes</p>
                    </div>
                    <div className="flex flex-col gap-2 w-64">
                        {LOAD_STEPS.map((s, i) => (
                            <div key={i} className={`flex items-center gap-2.5 text-[11px] transition-all duration-500 ${i <= loadStep ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                                {i < loadStep
                                    ? <Check size={12} className="shrink-0 text-violet-400" />
                                    : i === loadStep
                                        ? <Loader2 size={12} className="animate-spin shrink-0 text-violet-400" />
                                        : <span className="h-3 w-3 rounded-full border border-current shrink-0" />
                                }
                                {s}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ---- Output panel ---- */}
            {content && !loading && (
                <div className="panel flex flex-col overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20 shrink-0 flex-wrap gap-2">
                        <div className="flex items-center gap-0.5 rounded-lg bg-background border border-border/50 p-0.5">
                            {([['preview', Eye, 'Preview'], ['markdown', Code2, 'Markdown']] as const).map(([t, Icon, label]) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${tab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Icon size={12} /> {label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono bg-muted/60 border border-border/40 rounded px-2 py-1 text-muted-foreground">
                                <FileText size={10} /> API_DOCS.md
                            </span>
                            <button onClick={handleCopy} className="btn-ghost-sm flex items-center gap-1.5">
                                {copied ? <><Check size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
                            </button>
                            <button onClick={handleDownload} className="btn-ghost-sm flex items-center gap-1.5">
                                <Download size={12} /> .md
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="btn-ghost-sm flex items-center gap-1.5 text-muted-foreground"
                            >
                                <Wand2 size={12} /> Regenerate
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {tab === 'preview' ? (
                        <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                            <div className="api-docs-preview px-8 py-6 text-[13.5px] leading-[1.9]">
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-auto bg-[#0d1117]" style={{ maxHeight: '70vh' }}>
                            <pre className="m-0 px-6 py-5 text-[12px] leading-relaxed text-slate-300 whitespace-pre-wrap font-mono">
                                {content}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .api-docs-preview h1 { font-size: 1.55rem; font-weight: 800; margin: 0 0 .75rem; padding-bottom: .6rem; border-bottom: 1px solid color-mix(in oklch, var(--border) 60%, transparent); }
                .api-docs-preview h2 { font-size: 1.15rem; font-weight: 700; margin: 1.75rem 0 .5rem; padding-bottom: .35rem; border-bottom: 1px solid color-mix(in oklch, var(--border) 40%, transparent); }
                .api-docs-preview h3 { font-size: .95rem; font-weight: 600; margin: 1.25rem 0 .4rem; }
                .api-docs-preview p  { margin-bottom: .75rem; color: color-mix(in oklch, var(--foreground) 80%, transparent); }
                .api-docs-preview ul, .api-docs-preview ol { padding-left: 1.5rem; margin-bottom: .75rem; }
                .api-docs-preview li { margin-bottom: .25rem; color: color-mix(in oklch, var(--foreground) 75%, transparent); }
                .api-docs-preview code { background: color-mix(in oklch, var(--muted) 80%, transparent); border: 1px solid var(--border); border-radius: 4px; padding: .1em .4em; font-size: .83em; font-family: 'JetBrains Mono', monospace; color: #a78bfa; }
                .api-docs-preview pre { background: #0d1117; border: 1px solid var(--border); border-radius: 10px; padding: 1.1rem; overflow-x: auto; margin-bottom: 1rem; }
                .api-docs-preview pre code { background: transparent; border: none; padding: 0; color: #e2e8f0; font-size: .82rem; }
                .api-docs-preview blockquote { border-left: 3px solid #8b5cf6; margin: .5rem 0 1rem; padding: .5rem 1rem; background: rgba(139,92,246,0.06); border-radius: 0 8px 8px 0; }
                .api-docs-preview table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; font-size: .84rem; }
                .api-docs-preview th { text-align: left; padding: .5rem .75rem; background: var(--muted); border: 1px solid var(--border); font-weight: 600; }
                .api-docs-preview td { padding: .5rem .75rem; border: 1px solid color-mix(in oklch, var(--border) 60%, transparent); }
                .api-docs-preview a { color: #a78bfa; text-underline-offset: 3px; }
                .api-docs-preview img { max-width: 100%; border-radius: 8px; }
                .api-docs-preview hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
            `}</style>
        </div>
    );
}
