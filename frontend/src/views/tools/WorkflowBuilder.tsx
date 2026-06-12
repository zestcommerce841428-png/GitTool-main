'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import {
    Zap, Download, Copy, Loader2, Sparkles
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

const STACK_OPTIONS = [
    { label: 'Node CI', value: 'Node CI' },
    { label: 'Python CI', value: 'Python CI' },
    { label: 'Docker Build', value: 'Docker Build' },
    { label: 'Static Site', value: 'Static Site' },
];

export default function WorkflowBuilder() {
    const { selectedRepo: repo } = useWorkspace();
    const [stack, setStack] = useState('Node CI');
    const [content, setContent] = useState('');
    const [filename, setFilename] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);

    const handleGenerate = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        setLoading(true);
        setError(null);
        try {
            const o = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/workspace/${o}/${repo.name}/actions`, { stackType: stack });
            setContent(res.content || '');
            setFilename(res.filename || '.github/workflows/ci.yml');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.split('/').pop() || '';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="tool-page">
            <SEO title="GitHub Actions Workflow Builder" description="Build GitHub Actions CI/CD workflow YAML files visually using GitTool's AI workflow builder. No YAML expertise needed." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Zap size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Workflow Builder</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            {/* Configuration */}
            <div className="panel">
                <div className="panel-body">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Pipeline Configuration</h3>
                    <div className="form-field" style={{ marginBottom: 24 }}>
                        <label>Stack Type</label>
                        <div className="toggle-group">
                            {STACK_OPTIONS.map((opt: any) => (
                                <button
                                    key={opt.value}
                                    className={`toggle-btn ${stack === opt.value ? 'active' : ''}`}
                                    onClick={() => setStack(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginBottom: 16 }}>
                            {error}
                        </div>
                    )}

                    <button className="btn-primary" onClick={handleGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {loading
                            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                            : <><Sparkles size={16} /> Generate Workflow</>
                        }
                    </button>
                </div>
            </div>

            {/* Generated Workflow */}
            {content && (
                <div className="panel" style={{ marginTop: 24 }}>
                    <div className="panel-header" style={{ justifyContent: 'space-between' }}>
                        <h3 className="panel-title">
                            <Zap size={16} className="text-accent" />
                            <code style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{filename}</code>
                        </h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn-ghost" onClick={handleCopy}><Copy size={14} /> Copy</button>
                            <button className="btn-ghost" onClick={handleDownload}><Download size={14} /> Download</button>
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

