'use client';

import NavbarPortal from '@/components/NavbarPortal';
import SEO from '@/components/SEO';
import React, { useState } from 'react';
import { ShieldAlert, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import api from '@/lib/apiClient';

const TYPE_COLORS : Record<string, any> = { 'API Key': 'var(--danger)', 'Secret': 'var(--danger)', 'Token': 'var(--warning)', 'AWS Key': 'var(--danger)', 'Private Key': 'var(--danger)' };

export default function SecretsScanner() {
    const { selectedRepo: repo } = useWorkspace();
    const [findings, setFindings] = useState<any[]>([]);
    const [scannedFiles, setScannedFiles] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [scanned, setScanned] = useState(false);

    const handleScan = async () => {
        if (!repo) { setError('Select a repository first'); return; }
        setLoading(true); setError(null); setScanned(false);
        try {
            const o = repo.owner?.login || repo.full_name?.split('/')[0];
            const res = await api.post(`/tools/${o}/${repo.name}/scan-secrets`);
            setFindings(res.findings || []);
            setScannedFiles(res.scannedFiles || 0);
            setScanned(true);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="tool-page">
            <SEO
              title="Git Secrets Scanner — Scan GitHub Repo for API Keys & Credentials"
              description="Free git security scanner. Scan your git repository for exposed secrets, API keys, tokens, hardcoded passwords, and .env files committed to GitHub. Detect API keys in git history before they cause a breach."
              keywords={[
                'git security scanner', 'scan git repo for secrets',
                'detect api keys in git history', 'git repository secret scanner free',
                'git leaks scanner online', 'github secret detection tool',
                'scan repository for hardcoded passwords', 'git commit history secrets audit',
                'detect env files committed to github', 'github security audit tool',
                'how to find exposed credentials in github', 'remove sensitive data from git',
                'git repo vulnerability checker', 'git security',
              ]}
              noIndex={true}
            />
            <NavbarPortal>
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ShieldAlert size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <h2 className="tool-page-title">Secrets Scanner</h2>
                        
                    </div>
                </div>
            </NavbarPortal>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button className="btn-primary" onClick={handleScan} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</> : <><ShieldAlert size={16} /> Run Scan</>}
                </button>
                {scanned && <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>Scanned {scannedFiles} files · Found {findings.length} potential secrets</span>}
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: '0.8125rem', color: '#f87171', marginBottom: 16 }}>{error}</div>}

            {findings.length > 0 && (
                <div className="panel">
                    <div className="panel-header">
                        <h3 className="panel-title"><AlertTriangle size={16} style={{ color: 'var(--danger)' }} /> Detected Secrets ({findings.length})</h3>
                    </div>
                    <div className="panel-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead><tr><th>Type</th><th>File</th><th>Line</th><th>Preview</th></tr></thead>
                            <tbody>
                                {findings.map((f: any, i: any) => (
                                    <tr key={i}>
                                        <td><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 800, background: 'rgba(239,68,68,0.1)', color: TYPE_COLORS[f.type] || 'var(--danger)' }}>{f.type}</span></td>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{f.file}</td>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>:{f.line}</td>
                                        <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{f.preview}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {scanned && findings.length === 0 && (
                <div className="panel" style={{ textAlign: 'center', padding: 60 }}>
                    <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: 16 }} />
                    <h3 style={{ fontWeight: 700, marginBottom: 8 }}>All Clear!</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No secrets or credentials detected in your code.</p>
                </div>
            )}
        </div>
    );
}

