'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import { Users, GitPullRequest, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToolData } from '@/hooks/useQueryHooks';

function timeAgo(date: any) {
    if (!date) return '—';
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return `${s}s ago`; const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`; const d = Math.floor(h / 24);
    return `${d}d ago`;
}

export default function CollaborationHub() {
    const { selectedRepo: repo } = useWorkspace();
    const { data, isLoading: loading, error: fetchErr } = useToolData(repo, 'collaboration');
    const error = fetchErr?.message || null;
    const [tab, setTab] = useState('contributors');

    const PR_COLORS : Record<string, any> = { open: 'var(--success)', closed: 'var(--danger)', merged: '#8b5cf6' };

    return (
        <div className="tool-page">
            <SEO title="Collaboration Hub" description="Manage pull requests and team collaboration on GitHub with GitTool's Collaboration Hub. Streamline code review workflows." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Users size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Collaboration Hub</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            <div className="toggle-group" style={{ marginBottom: 24 }}>
                {['contributors', 'pullRequests', 'issues'].map((t: any) => (
                    <button key={t} className={`toggle-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                        {t === 'contributors' ? `Contributors (${(data as any)?.contributors?.length || 0})` : t === 'pullRequests' ? `PRs (${(data as any)?.pullRequests?.length || 0})` : `Issues (${(data as any)?.issues?.length || 0})`}
                    </button>
                ))}
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginBottom: 16 }}>{error}</div>}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={32} className="text-accent" style={{ animation: 'spin 1s linear infinite' }} /></div>
            ) : data ? (
                <>
                    {tab === 'contributors' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {(data as any).contributors.map((c: any) => (
                                <div key={c.login} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
                                    <img src={c.avatar} alt={c.login} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--border)' }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{c.login}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{c.contributions} commits</p>
                                    </div>
                                    <a href={c.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}><ExternalLink size={16} /></a>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'pullRequests' && (
                        <div className="panel"><div className="panel-body" style={{ padding: 0 }}>
                            <table className="data-table"><thead><tr><th>#</th><th>Title</th><th>Author</th><th>State</th><th>Created</th></tr></thead>
                                <tbody>{(data as any).pullRequests.map((pr: any) => (
                                    <tr key={pr.number}>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>#{pr.number}</td>
                                        <td style={{ fontWeight: 600, fontSize: '0.8125rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.title}</td>
                                        <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>@{pr.author}</td>
                                        <td><span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.625rem', fontWeight: 800, background: `${PR_COLORS[pr.merged_at ? 'merged' : pr.state] || 'var(--text-tertiary)'}20`, color: PR_COLORS[pr.merged_at ? 'merged' : pr.state] }}>{pr.merged_at ? 'merged' : pr.state}</span></td>
                                        <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{timeAgo(pr.created_at)}</td>
                                    </tr>
                                ))}</tbody></table>
                        </div></div>
                    )}

                    {tab === 'issues' && (
                        <div className="panel"><div className="panel-body" style={{ padding: 0 }}>
                            <table className="data-table"><thead><tr><th>#</th><th>Title</th><th>Author</th><th>State</th><th>Labels</th></tr></thead>
                                <tbody>{(data as any).issues.map((i: any) => (
                                    <tr key={i.number}>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>#{i.number}</td>
                                        <td style={{ fontWeight: 600, fontSize: '0.8125rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</td>
                                        <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>@{i.author}</td>
                                        <td><span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.625rem', fontWeight: 800, color: i.state === 'open' ? 'var(--success)' : 'var(--danger)', background: i.state === 'open' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>{i.state}</span></td>
                                        <td>{i.labels.map((l: any) => <span key={l} style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 4, fontSize: '0.5625rem', fontWeight: 700, border: '1px solid var(--border)', marginRight: 4, color: 'var(--text-tertiary)' }}>{l}</span>)}</td>
                                    </tr>
                                ))}</tbody></table>
                        </div></div>
                    )}
                </>
            ) : (
                <div className="panel" style={{ textAlign: 'center', padding: 60 }}><Users size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} /><p style={{ color: 'var(--text-tertiary)' }}>Select a repository to view collaboration data.</p></div>
            )}
        </div>
    );
}

