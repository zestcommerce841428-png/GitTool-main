'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import { Terminal, Loader2, AlertCircle, CheckCircle, Wrench } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

const TYPE_COLORS : Record<string, any> = { build: 'var(--danger)', test: 'var(--warning)', deploy: 'var(--accent)', config: '#8b5cf6', dependency: '#f59e0b', unknown: 'var(--text-tertiary)' };
const TYPE_ICONS : Record<string, any> = { build: '🔨', test: '🧪', deploy: '🚀', config: '⚙️', dependency: '📦', unknown: '❓"' };

export default function PipelineFailureExplainer() {
    const { selectedRepo: repo } = useWorkspace();
    const [log, setLog] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const handleExplain = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        if (!log.trim()) { setError('Paste a CI/CD log to analyze'); return; }
        setLoading(true); setError(null); setResult(null);
        try {
            const o = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/tools/${o}/${repo.name}/explain-failure`, { log });
            setResult(res);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="tool-page">
            <SEO title="Pipeline Failure Explainer" description="Understand why your GitHub Actions or CI/CD pipeline failed. GitTool's AI explains pipeline errors in plain English." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <AlertCircle size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Pipeline Failure Explainer</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            <div className="panel" style={{ marginBottom: 24 }}>
                <div className="panel-header"><h3 className="panel-title"><Terminal size={16} /> Paste Pipeline Log</h3></div>
                <div className="panel-body">
                    <textarea
                        value={log}
                        onChange={(e: any) => setLog(e.target.value)}
                        placeholder={"Paste your CI/CD failure log here...\n\nExample:\nnpm ERR! code ERESOLVE\nnpm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! peer dep missing: react@^17.0.0"}
                        style={{
                            width: '100%', minHeight: 180, background: '#020617', border: 'none',
                            borderRadius: 8, padding: 16, color: '#e2e8f0',
                            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem',
                            resize: 'vertical', outline: 'none', lineHeight: 1.6,
                        }}
                    />
                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginTop: 12 }}>{error}</div>}
                    <button className="btn-primary" onClick={handleExplain} disabled={loading} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : <><AlertCircle size={16} /> Explain Failure</>}
                    </button>
                </div>
            </div>

            {result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Error Type Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>{TYPE_ICONS[result.errorType] || '❓"'}</span>
                        <span style={{ padding: '4px 16px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', background: `${TYPE_COLORS[result.errorType] || 'var(--text-tertiary)'}20`, color: TYPE_COLORS[result.errorType] || 'var(--text-tertiary)' }}>{result.errorType} Error</span>
                    </div>

                    {/* Summary */}
                    <div className="panel">
                        <div className="panel-header"><h3 className="panel-title"><AlertCircle size={16} style={{ color: 'var(--danger)' }} /> Summary</h3></div>
                        <div className="panel-body"><p style={{ fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.6 }}>{result.summary}</p></div>
                    </div>

                    {/* Root Cause */}
                    <div className="panel">
                        <div className="panel-header"><h3 className="panel-title"><Terminal size={16} /> Root Cause</h3></div>
                        <div className="panel-body"><p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{result.rootCause}</p></div>
                    </div>

                    {/* Suggestion */}
                    <div className="panel" style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
                        <div className="panel-header"><h3 className="panel-title"><Wrench size={16} style={{ color: 'var(--success)' }} /> Suggested Fix</h3></div>
                        <div className="panel-body"><p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{result.suggestion}</p></div>
                    </div>
                </div>
            )}
        </div>
    );
}

