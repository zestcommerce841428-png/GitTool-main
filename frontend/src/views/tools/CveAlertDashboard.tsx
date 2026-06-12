'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React from 'react';
import { ShieldAlert, Loader2, AlertTriangle, Info, ExternalLink, Package } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useToolData } from '@/hooks/useQueryHooks';

const SEV_COLORS : Record<string, any> = {
    critical: 'var(--danger)',
    high: 'var(--danger)',
    medium: 'var(--warning)',
    low: 'var(--text-tertiary)'
};

export default function CveAlertDashboard() {
    const { selectedRepo: repo } = useWorkspace();
    const { data: rawData, isLoading: loading, error: fetchErr } = useToolData(repo, 'dependabot');
    const error = rawData?.error || fetchErr?.message || null;
    const alerts = (!error && rawData?.alerts) || [];

    const criticalCount = alerts.filter((a: any) => a.security_vulnerability?.severity === 'critical').length;
    const highCount = alerts.filter((a: any) => a.security_vulnerability?.severity === 'high').length;
    const medCount = alerts.filter((a: any) => a.security_vulnerability?.severity === 'medium').length;

    return (
        <div className="tool-page">
            <SEO title="CVE Alert Dashboard" description="Monitor GitHub repositories for known CVE vulnerabilities in dependencies. Stay ahead of security threats with GitTool." keywords={[]} noIndex={true} />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ShieldAlert size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">CVE Alerts (Dependabot)</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            {error ? (
                <div style={{ padding: 24, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, display: 'flex', gap: 16 }}>
                    <Info size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <div>
                        <h3 style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 8 }}>Dependabot Not Available</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {error} Make sure Dependabot alerts are enabled in your repository settings under Code Security and Analysis.
                        </p>
                    </div>
                </div>
            ) : loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={32} className="text-accent" style={{ animation: 'spin 1s linear infinite' }} /></div>
            ) : !repo ? (
                <div className="panel" style={{ textAlign: 'center', padding: 60 }}>
                    <Package size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-tertiary)' }}>Select a repository to view CVE alerts.</p>
                </div>
            ) : alerts.length === 0 ? (
                <div className="panel" style={{ textAlign: 'center', padding: 60, border: '1px solid rgba(16,185,129,0.3)' }}>
                    <ShieldAlert size={48} style={{ color: 'var(--success)', marginBottom: 16 }} />
                    <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>No Vulnerabilities Found!</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Your dependencies are completely up to date.</p>
                </div>
            ) : (
                <>
                    <div className="stats-grid-4" style={{ marginBottom: 24 }}>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--danger)' }}>Critical</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{criticalCount}</span></div>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--danger)' }}>High</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{highCount}</span></div>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--warning)' }}>Medium / Low</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{medCount}</span></div>
                        <div className="stat-card-vertical"><span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Total Open</span><span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{alerts.length}</span></div>
                    </div>

                    <div className="panel">
                        <div className="panel-header"><h3 className="panel-title"><AlertTriangle size={16} /> Vulnerable Dependencies</h3></div>
                        <div className="panel-body" style={{ padding: 0 }}>
                            <table className="data-table">
                                <thead><tr><th>Severity</th><th>Package</th><th>Vulnerability</th><th>Patched Version</th></tr></thead>
                                <tbody>
                                    {alerts.map((a: any) => {
                                        const sev = a.security_vulnerability?.severity || 'low';
                                        return (
                                            <tr key={a.number}>
                                                <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', background: `${SEV_COLORS[sev]}20`, color: SEV_COLORS[sev] }}>{sev}</span></td>
                                                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem', fontWeight: 600 }}>{a.security_vulnerability?.package?.name}</td>
                                                <td>
                                                    <a href={a.html_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', textDecoration: 'none' }}>
                                                        {a.security_advisory?.summary} <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} />
                                                    </a>
                                                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{a.security_advisory?.cve_id}</span>
                                                </td>
                                                <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--success)' }}>
                                                    {a.security_vulnerability?.first_patched_version?.identifier || 'No patch'}
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

