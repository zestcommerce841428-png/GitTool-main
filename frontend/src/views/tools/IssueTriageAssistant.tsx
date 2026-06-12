'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import { Tags, Loader2, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

export default function IssueTriageAssistant() {
    const { selectedRepo: repo } = useWorkspace();
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const handleTriage = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        setLoading(true); setError(null);
        try {
            const o = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/tools/${o}/${repo.name}/triage-issues`);
            setIssues(res.issues || []);
            if (res.message) setError(res.message);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    const LABEL_COLORS : Record<string, any> = {
        bug: '#ef4444', feature: '#3b82f6', enhancement: '#8b5cf6',
        documentation: '#06b6d4', question: '#eab308', 'good first issue': '#10b981',
        'help wanted': '#f59e0b', 'priority:high': '#ef4444', 'priority:medium': '#f59e0b',
        'priority:low': '#6b7280',
    };

    return (
        <div className="tool-page">
            <SEO title="AI Issue Triage Assistant" description="Automatically triage and label GitHub issues using AI. Save time managing issue queues with GitTool's issue triage assistant." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Tags size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Issue Triage Assistant</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button className="btn-primary" onClick={handleTriage} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing issues…</> : <><Sparkles size={16} /> Triage Issues</>}
                </button>
                {issues.length > 0 && <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>Analyzed {issues.length} open issues</span>}
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginBottom: 16 }}>{error}</div>}

            {issues.length > 0 && (
                <div className="panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><Tags size={16} /> AI-Suggested Labels</h3>
                    </div>
                    <div className="panel-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead><tr><th>#</th><th>Title</th><th>Author</th><th>Current Labels</th><th>Suggested Labels</th><th>Reason</th></tr></thead>
                            <tbody>
                                {issues.map((issue: any) => (
                                    <tr key={issue.number}>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>#{issue.number}</td>
                                        <td style={{ fontWeight: 600, fontSize: '0.8125rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</td>
                                        <td style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>@{issue.author}</td>
                                        <td>
                                            {issue.currentLabels.length > 0 ? issue.currentLabels.map((l: any) => (
                                                <span key={l} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: '0.625rem', fontWeight: 700, border: '1px solid var(--border)', marginRight: 4, color: 'var(--text-tertiary)' }}>{l}</span>
                                            )) : <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>None</span>}
                                        </td>
                                        <td>
                                            {(issue.suggestedLabels || []).map((l: any) => (
                                                <span key={l} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: '0.625rem', fontWeight: 700, background: `${LABEL_COLORS[l] || '#6b7280'}20`, color: LABEL_COLORS[l] || '#6b7280', marginRight: 4 }}>{l}</span>
                                            ))}
                                        </td>
                                        <td style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

