'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

const CONF_COLORS : Record<string, any> = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--text-tertiary)' };

export default function DeadCodeDetector() {
    const { selectedRepo: repo } = useWorkspace();
    const [results, setResults] = useState<any[]>([]);
    const [totalFiles, setTotalFiles] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const handleAnalyze = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        setLoading(true); setError(null);
        try {
            const o = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/tools/${o}/${repo.name}/dead-code`);
            setResults(res.results || []);
            setTotalFiles(res.totalFiles || 0);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    const highCount = results.filter((r: any) => r.confidence === 'high').length;
    const medCount = results.filter((r: any) => r.confidence === 'medium').length;
    const lowCount = results.filter((r: any) => r.confidence === 'low').length;

    return (
        <div className="tool-page">
            <SEO title="Dead Code Detector" description="Find and remove unused dead code in your GitHub repository with GitTool's AI-powered dead code detector." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Trash2 size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Dead Code Detector</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button className="btn-primary" onClick={handleAnalyze} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : <><Trash2 size={16} /> Detect Dead Code</>}
                </button>
                {totalFiles > 0 && <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>Analyzed {totalFiles} code files</span>}
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginBottom: 16 }}>{error}</div>}

            {results.length > 0 && (
                <>
                    <div className="stats-grid-4" style={{ marginBottom: 24 }}>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--danger)' }}>High</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{highCount}</span></div>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--warning)' }}>Medium</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{medCount}</span></div>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Low</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{lowCount}</span></div>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)' }}>Total Flagged</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{results.length}</span></div>
                    </div>

                    <div className="panel">
                        <div className="panel-header"><h3 className="panel-title"><AlertTriangle size={16} /> Potentially Dead Files</h3></div>
                        <div className="panel-body" style={{ padding: 0 }}>
                            <table className="data-table">
                                <thead><tr><th>Confidence</th><th>File</th><th>Reason</th></tr></thead>
                                <tbody>
                                    {results.map((r: any, i: any) => (
                                        <tr key={i}>
                                            <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 800, background: `${CONF_COLORS[r.confidence]}20`, color: CONF_COLORS[r.confidence] }}>{r.confidence}</span></td>
                                            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', fontWeight: 600 }}>{r.file}</td>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{r.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

