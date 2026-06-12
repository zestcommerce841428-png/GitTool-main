'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import { Sparkles, Copy, Upload, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

export default function ReleaseNotesGenerator() {
    const { selectedRepo: repo } = useWorkspace();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const handleGenerate = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        setLoading(true);
        setError(null);
        try {
            const o = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/workspace/${o}/${repo.name}/changelog`);
            setContent(res.content || '');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
    };

    return (
        <div className="tool-page">
            <SEO title="AI Release Notes Generator" description="Generate polished release notes from GitHub commits and pull requests automatically using GitTool's AI release notes generator." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Release Notes Generator</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            {/* Generate Button */}
            <div className="panel">
                <div className="panel-body">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Generate Release Notes</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: 24, lineHeight: 1.6 }}>
                        This will analyze the last 30 commits in <b style={{ color: 'var(--text-primary)' }}>{repo?.full_name || '…'}</b> and organize them into a structured changelog using AI.
                    </p>
                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginBottom: 16 }}>
                            {error}
                        </div>
                    )}
                    <button className="btn-primary" onClick={handleGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {loading
                            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing commits…</>
                            : <><Sparkles size={16} /> Generate Release Notes</>
                        }
                    </button>
                </div>
            </div>

            {/* Generated Content */}
            {content && (
                <div className="panel" style={{ marginTop: 24 }}>
                    <div className="panel-header" style={{ justifyContent: 'space-between' }}>
                        <h3 className="panel-title"><Sparkles size={16} className="text-accent" /> Generated Release Notes</h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn-ghost" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Copy size={14} /> Copy Markdown
                            </button>
                        </div>
                    </div>
                    <div className="panel-body">
                        <pre style={{
                            background: '#020617', borderRadius: 8, padding: 20,
                            fontSize: '0.8125rem', lineHeight: 1.7, color: '#e2e8f0',
                            fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap',
                            overflow: 'auto', maxHeight: 500,
                        }}>
                            {content}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

