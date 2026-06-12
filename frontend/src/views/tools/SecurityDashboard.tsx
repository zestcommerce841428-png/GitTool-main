'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React from 'react';
import { ShieldCheck, ShieldAlert, Loader2, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToolData } from '@/hooks/useQueryHooks';

const SEV_COLORS : Record<string, any> = {
    critical: 'var(--danger)',
    high: 'var(--danger)',
    medium: 'var(--warning)',
    low: 'var(--text-tertiary)',
    warning: 'var(--warning)',
    note: 'var(--text-tertiary)',
    error: 'var(--danger)'
};

export default function SecurityDashboard() {
    const { selectedRepo: repo } = useWorkspace();
    const { data: rawData, isLoading: loading, error: fetchErr } = useToolData(repo, 'code-scanning');
    const error = rawData?.error || fetchErr?.message || null;
    const alerts = (!error && rawData?.alerts) || [];

    const criticalCount = alerts.filter((a: any) => a.rule?.security_severity_level === 'critical' || a.rule?.severity === 'error').length;
    const highCount = alerts.filter((a: any) => a.rule?.security_severity_level === 'high').length;
    const medCount = alerts.filter((a: any) => a.rule?.security_severity_level === 'medium' || a.rule?.severity === 'warning').length;

    return (
        <div className="tool-page">
            <SEO
              title="GitHub Security Dashboard — Audit Your Repository Security"
              description="Complete git security audit tool. Check your GitHub repository for vulnerabilities, exposed secrets, dependency CVEs, and insecure configurations. Free github security audit tool."
              keywords={[
                'github security audit tool', 'git security', 'git security scanner',
                'git repo vulnerability checker', 'how to secure git repository',
                'github secret detection tool', 'scan repository for hardcoded passwords',
                'git repository secret scanner free',
              ]}
              noIndex={true}
            />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ShieldCheck size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Code Security Dashboard</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            {error ? (
                <div style={{ padding: 24, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, display: 'flex', gap: 16 }}>
                    <Info size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <div>
                        <h3 style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 8 }}>Code Scanning Not Available</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {error} Make sure GitHub Advanced Security is enabled in your repository settings and that a CodeQL workflow has run.
                        </p>
                    </div>
                </div>
            ) : loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={32} className="text-accent" style={{ animation: 'spin 1s linear infinite' }} /></div>
            ) : !repo ? (
                <div className="panel" style={{ textAlign: 'center', padding: 60 }}>
                    <ShieldCheck size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-tertiary)' }}>Select a repository to view security alerts.</p>
                </div>
            ) : alerts.length === 0 ? (
                <div className="panel" style={{ textAlign: 'center', padding: 60, border: '1px solid rgba(16,185,129,0.3)' }}>
                    <ShieldCheck size={48} style={{ color: 'var(--success)', marginBottom: 16 }} />
                    <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>No Security Alerts found!</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Your code is looking secure based on the latest CodeQL scans.</p>
                </div>
            ) : (
                <>
                    <div className="stats-grid-4" style={{ marginBottom: 24 }}>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--danger)' }}>Critical</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{criticalCount}</span></div>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--danger)' }}>High</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{highCount}</span></div>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--warning)' }}>Medium / Warn</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{medCount}</span></div>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Total Open</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{alerts.length}</span></div>
                    </div>

                    <div className="panel">
                        <div className="panel-header"><h3 className="panel-title"><ShieldAlert size={16} /> Open Code Scanning Alerts</h3></div>
                        <div className="panel-body" style={{ padding: 0 }}>
                            <table className="data-table">
                                <thead><tr><th>Severity</th><th>Rule</th><th>Tool</th><th>File</th></tr></thead>
                                <tbody>
                                    {alerts.map((a: any) => {
                                        const sev = a.rule?.security_severity_level || a.rule?.severity || 'note';
                                        return (
                                            <tr key={a.number}>
                                                <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', background: `${SEV_COLORS[sev] || 'var(--text-tertiary)'}20`, color: SEV_COLORS[sev] || 'var(--text-tertiary)' }}>{sev}</span></td>
                                                <td>
                                                    <a href={a.html_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
                                                        {a.rule?.description || a.rule?.name} <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} />
                                                    </a>
                                                </td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{a.tool?.name}</td>
                                                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {a.most_recent_instance?.location?.path}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

