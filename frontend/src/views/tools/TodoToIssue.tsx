'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import { FileSearch, Loader2, CheckCircle, AlertTriangle, GitBranch, ExternalLink } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

const TYPE_COLORS : Record<string, any> = { TODO: 'var(--accent)', FIXME: 'var(--danger)', HACK: 'var(--warning)', XXX: 'var(--warning)', BUG: 'var(--danger)' };

export default function TodoToIssue() {
    const { selectedRepo: repo } = useWorkspace();
    const [todos, setTodos] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    // Track which todos have been created as issues: { index -> { number, url } }
    const [createdIssues, setCreatedIssues] = useState<any>({});
    const [creating, setCreating] = useState<any>({}); // index -> bool

    const handleScan = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        setLoading(true); setError(null); setCreatedIssues({});
        try {
            const o = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/tools/${o}/${repo.name}/todo-scan`);
            setTodos(res.todos || []);
            setMeta({ scannedFiles: res.scannedFiles, totalFiles: res.totalFiles });
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    const handleCreateIssue = async (todo: any, index: any) => {
        const o = repo.owner?.login || repo.full_name?.split('/')[0];
        setCreating((prev: any) => ({ ...prev, [index]: true }));
        try {
            const title = `${todo.type}: ${todo.text.slice(0, 80)}`;
            const body = `**Found in:** \`${todo.file}\` at line ${todo.line}\n\n**Comment:**\n\`\`\`\n${todo.type}: ${todo.text}\n\`\`\`\n\n*Created by [GitTool](https://gittool.dev) TODO — Issue converter.*`;
            const labels = todo.type === 'BUG' || todo.type === 'FIXME' ? ['bug'] : ['enhancement'];
            const result = await api.post(`/tools/${o}/${repo.name}/create-issue`, { title, body, labels });
            setCreatedIssues((prev: any) => ({ ...prev, [index]: result }));
        } catch (err: any) {
            setError(`Failed to create issue: ${err.message}`);
        } finally {
            setCreating((prev: any) => ({ ...prev, [index]: false }));
        }
    };

    const grouped: Record<string, number> = {};
    todos.forEach((t: any) => { grouped[t.type] = (grouped[t.type] || 0) + 1; });

    return (
        <div className="tool-page">
            <SEO title="TODO to GitHub Issue Converter" description="Scan your codebase for TODO comments and automatically convert them into GitHub issues with GitTool's TODO converter." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileSearch size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">TODO — Issue Converter</h2>
                    </div>
                </div>
            </NavbarPortal>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button className="btn-primary" onClick={handleScan} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</> : <><FileSearch size={16} /> Scan Repository</>}
                </button>
                {meta && (
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                        Scanned {meta.scannedFiles} / {meta.totalFiles} files · Found {todos.length} comments
                    </span>
                )}
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginBottom: 16 }}>{error}</div>}

            {/* Stats */}
            {todos.length > 0 && (
                <div className="stats-grid-4" style={{ marginBottom: 24 }}>
                    {Object.entries(grouped).map(([type, count]) => (
                        <div className="stat-card-vertical" key={type}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: TYPE_COLORS[type] || 'var(--text-tertiary)' }}>{type}</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{count}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            {todos.length > 0 && (
                <div className="panel">
                    <div className="panel-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead><tr><th>Type</th><th>File</th><th>Line</th><th>Comment</th><th>Action</th></tr></thead>
                            <tbody>
                                {todos.map((t: any, i: any) => {
                                    const created = createdIssues[i];
                                    return (
                                        <tr key={i}>
                                            <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 800, background: `${TYPE_COLORS[t.type]}20`, color: TYPE_COLORS[t.type] }}>{t.type}</span></td>
                                            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{t.file}</td>
                                            <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>:{t.line}</td>
                                            <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{t.text}</td>
                                            <td>
                                                {created ? (
                                                    <a
                                                        href={created.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textDecoration: 'none' }}
                                                    >
                                                        <CheckCircle size={13} /> #{created.number} <ExternalLink size={11} />
                                                    </a>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCreateIssue(t, i)}
                                                        disabled={creating[i]}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                                            padding: '3px 10px', borderRadius: 6, fontSize: '0.6875rem', fontWeight: 700,
                                                            background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                                            color: 'var(--text-secondary)', cursor: 'pointer',
                                                            opacity: creating[i] ? 0.6 : 1,
                                                        }}
                                                    >
                                                        {creating[i]
                                                            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                                            : <GitBranch size={12} />}
                                                        {creating[i] ? 'Creating…' : 'Create Issue'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && todos.length === 0 && meta && (
                <div className="panel" style={{ textAlign: 'center', padding: 60 }}>
                    <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: 16 }} />
                    <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Clean Codebase!</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No TODO/FIXME comments found.</p>
                </div>
            )}
        </div>
    );
}

