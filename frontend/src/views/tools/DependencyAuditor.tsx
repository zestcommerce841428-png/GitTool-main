'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import { Package, Loader2, AlertTriangle, ArrowUp, ExternalLink } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToolData } from '@/hooks/useQueryHooks';

export default function DependencyAuditor() {
    const { selectedRepo: repo } = useWorkspace();
    const { data: rawData, isLoading: loading, error: fetchErr } = useToolData(repo, 'dependencies');
    const deps = rawData?.dependencies || [];
    const devDeps = rawData?.devDependencies || [];
    const total = rawData?.total || 0;
    const outdatedCount = rawData?.outdatedCount ?? null;
    const error = rawData?.message || fetchErr?.message || null;
    const [tab, setTab] = useState('production');
    const [filterOutdated, setFilterOutdated] = useState(false);

    const allShown = tab === 'production' ? deps : devDeps;
    const shown = filterOutdated ? allShown.filter((d: any) => d.outdated) : allShown;

    return (
        <div className="tool-page">
            <SEO title="Dependency Auditor" description="Audit your GitHub project's npm or pip dependencies for vulnerabilities and outdated packages with GitTool's dependency auditor." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Package size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Dependency Auditor</h2>
                    </div>
                </div>
            </NavbarPortal>

            {/* Stats */}
            <div className="stats-grid-4 mb-6">
                <div className="stat-card-vertical">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total</span>
                    <span className="text-2xl font-black">{total}</span>
                </div>
                <div className="stat-card-vertical">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Production</span>
                    <span className="text-2xl font-black">{deps.length}</span>
                </div>
                <div className="stat-card-vertical">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500">Dev</span>
                    <span className="text-2xl font-black">{devDeps.length}</span>
                </div>
                <div className="stat-card-vertical">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--danger)' }}>Outdated</span>
                    <span className="text-2xl font-black" style={{ color: outdatedCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {outdatedCount ?? '—'}
                    </span>
                </div>
            </div>

            {error && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-[13px] text-destructive">{error}</div>}

            {/* Tabs + filter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div className="toggle-group">
                    <button className={`toggle-btn ${tab === 'production' ? 'active' : ''}`} onClick={() => setTab('production')}>Production ({deps.length})</button>
                    <button className={`toggle-btn ${tab === 'development' ? 'active' : ''}`} onClick={() => setTab('development')}>Development ({devDeps.length})</button>
                </div>
                {outdatedCount > 0 && (
                    <button
                        className={`toggle-btn ${filterOutdated ? 'active' : ''}`}
                        onClick={() => setFilterOutdated((f: any) => !f)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <ArrowUp size={12} /> Outdated only
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-16">
                    <Loader2 size={32} className="text-primary animate-spin" />
                </div>
            ) : (
                <div className="panel">
                    <div className="panel-body p-0">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Package</th>
                                    <th>Current</th>
                                    <th>Latest</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shown.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center p-10 text-muted-foreground">
                                        {repo ? (filterOutdated ? 'All up to date!' : 'No dependencies found.') : 'Select a repository.'}
                                    </td></tr>
                                ) : shown.map((d: any) => (
                                    <tr key={d.name}>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: '0.8125rem' }}>
                                            <a
                                                href={`https://www.npmjs.com/package/${d.name}`}
                                                target="_blank" rel="noreferrer"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', textDecoration: 'none' }}
                                            >
                                                {d.name} <ExternalLink size={11} style={{ color: 'var(--text-tertiary)' }} />
                                            </a>
                                        </td>
                                        <td><code style={{ borderRadius: 4, background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '2px 8px', fontSize: '0.75rem' }}>{d.currentVersion || '—'}</code></td>
                                        <td>
                                            {d.latestVersion
                                                ? <code style={{ borderRadius: 4, background: d.outdated ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${d.outdated ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, padding: '2px 8px', fontSize: '0.75rem', color: d.outdated ? '#f87171' : 'var(--success)' }}>{d.latestVersion}</code>
                                                : <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            {d.outdated
                                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 800, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}><ArrowUp size={11} /> Outdated</span>
                                                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 700, background: 'rgba(16,185,129,0.08)', color: 'var(--success)' }}>Up to date</span>
                                            }
                                        </td>
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

