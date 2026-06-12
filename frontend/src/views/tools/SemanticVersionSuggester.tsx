'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import { Tag, Loader2, Sparkles, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

const BUMP_CONFIG : Record<string, any> = {
    major: { icon: <ArrowUp size={20} />, color: 'var(--danger)', label: 'Major', desc: 'Breaking changes detected' },
    minor: { icon: <ArrowRight size={20} />, color: 'var(--warning)', label: 'Minor', desc: 'New features added' },
    patch: { icon: <ArrowDown size={20} />, color: 'var(--success)', label: 'Patch', desc: 'Bug fixes only' },
};

const TYPE_COLORS : Record<string, any> = { feat: 'var(--accent)', fix: 'var(--success)', chore: 'var(--text-tertiary)', docs: '#06b6d4', style: '#8b5cf6', refactor: '#f59e0b', test: '#eab308', perf: '#10b981' };

export default function SemanticVersionSuggester() {
    const { selectedRepo: repo } = useWorkspace();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const handleSuggest = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        setLoading(true); setError(null); setResult(null);
        try {
            const o = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/tools/${o}/${repo.name}/version-suggest`);
            setResult(res);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    const bump = result ? BUMP_CONFIG[result.bumpType] || BUMP_CONFIG.patch : null;

    return (
        <div className="tool-page">
            <SEO title="Semantic Version Suggester" description="Automatically suggest the next semantic version (semver) for your npm package based on commits and changes with GitTool." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Tag size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Semantic Version Suggester</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button className="btn-primary" onClick={handleSuggest} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : <><Sparkles size={16} /> Suggest Version</>}
                </button>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginBottom: 16 }}>{error}</div>}

            {result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Version Card */}
                    <div className="version-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <Tag size={20} /> <h3 style={{ fontWeight: 700 }}>Version Suggestion</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                            <span style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{result.suggestedVersion}</span>
                            <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>from {result.currentVersion}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 800, background: `${bump.color}20`, color: bump.color }}>{bump.icon} {bump.label} Bump</span>
                            <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>{bump.desc}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, opacity: 0.9 }}>{result.reason}</p>
                    </div>

                    {/* Commit Analysis */}
                    {result.commits?.length > 0 && (
                        <div className="panel">
                            <div className="panel-header"><h3 className="panel-title">Commit Analysis</h3></div>
                            <div className="panel-body" style={{ padding: 0 }}>
                                <table className="data-table">
                                    <thead><tr><th>Type</th><th>Message</th></tr></thead>
                                    <tbody>
                                        {result.commits.map((c: any, i: any) => (
                                            <tr key={i}>
                                                <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 800, background: `${TYPE_COLORS[c.type] || 'var(--text-tertiary)'}20`, color: TYPE_COLORS[c.type] || 'var(--text-tertiary)' }}>{c.type}</span></td>
                                                <td style={{ fontSize: '0.8125rem' }}>{c.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

