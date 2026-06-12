'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React from 'react';
import { FolderTree, Loader2, File, Folder } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToolData } from '@/hooks/useQueryHooks';

const LANG_COLORS : Record<string, any> = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Java: '#b07219', Go: '#00ADD8', Rust: '#dea584', Ruby: '#701516',
    HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
};

export default function ArchitectureDiagram() {
    const { selectedRepo: repo } = useWorkspace();
    const { data, isLoading: loading, error: fetchErr } = useToolData(repo, 'architecture');
    const error = fetchErr?.message || null;

    return (
        <div className="tool-page">
            <SEO title="Architecture Diagram Generator" description="Visualize your GitHub repository architecture with an AI-generated architecture diagram. Understand code structure at a glance." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FolderTree size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Architecture Diagram</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginBottom: 16 }}>{error}</div>}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={32} className="text-accent" style={{ animation: 'spin 1s linear infinite' }} /></div>
            ) : data ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Stats */}
                    <div className="panel">
                        <div className="panel-header"><h3 className="panel-title"><FolderTree size={16} /> Repo Overview</h3></div>
                        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', gap: 24 }}>
                                <div><p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800 }}>Files</p><p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{(data as any).totalFiles}</p></div>
                                <div><p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800 }}>Directories</p><p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{(data as any).totalDirs}</p></div>
                                <div><p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800 }}>Branch</p><p style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{(data as any).defaultBranch}</p></div>
                            </div>
                            {(data as any).description && <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{(data as any).description}</p>}
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="panel">
                        <div className="panel-header"><h3 className="panel-title">Languages</h3></div>
                        <div className="panel-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {(data as any).languages.map((lang: any) => (
                                <span key={lang} style={{ padding: '6px 14px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: `${LANG_COLORS[lang] || '#6b7280'}20`, color: LANG_COLORS[lang] || '#6b7280', border: `1px solid ${LANG_COLORS[lang] || '#6b7280'}40` }}>
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Directory Tree */}
                    <div className="panel" style={{ gridColumn: 'span 2' }}>
                        <div className="panel-header"><h3 className="panel-title"><Folder size={16} /> Directory Structure</h3></div>
                        <div className="panel-body">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                                {(data as any).directories.map((dir: any) => (
                                    <div key={dir} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8125rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>
                                        <Folder size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> {dir}
                                    </div>
                                ))}
                            </div>
                            {(data as any).rootFiles.length > 0 && (
                                <>
                                    <p style={{ marginTop: 20, marginBottom: 8, fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Root Files</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {(data as any).rootFiles.map((f: any) => (
                                            <span key={f.path} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                                <File size={12} style={{ color: 'var(--text-tertiary)' }} /> {f.path}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="panel" style={{ textAlign: 'center', padding: 60 }}>
                    <FolderTree size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-tertiary)' }}>Select a repository to view its architecture.</p>
                </div>
            )}
        </div>
    );
}

