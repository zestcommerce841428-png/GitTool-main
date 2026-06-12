'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, Shield, Bug, Sparkles, Wrench, Package } from 'lucide-react';
import SEO from '@/components/SEO';

const TYPE_META : Record<string, any> = {
    feature: { label: 'New Feature', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: <Sparkles size={11} /> },
    fix: { label: 'Bug Fix', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: <Bug size={11} /> },
    security: { label: 'Security', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', icon: <Shield size={11} /> },
    perf: { label: 'Performance', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)', icon: <Zap size={11} /> },
    refactor: { label: 'Refactor', color: '#c9956a', bg: 'rgba(201,149,106,0.08)', border: 'rgba(201,149,106,0.2)', icon: <Wrench size={11} /> },
    infra: { label: 'Infrastructure', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', icon: <Package size={11} /> },
    improvement: { label: 'Improvement', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)', icon: <Zap size={11} /> },
    announcement: { label: 'Announcement', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', icon: <Sparkles size={11} /> },
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

const Badge = ({ type }: any) => {
    const m = TYPE_META[type as keyof typeof TYPE_META];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '100px', fontSize: '0.68rem', fontWeight: 600,
            color: m.color, background: m.bg, border: `1px solid ${m.border}`,
            flexShrink: 0, whiteSpace: 'nowrap',
        }}>
            {m.icon} {m.label}
        </span>
    );
};

export default function Changelog() {
    const [releases, setReleases] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = useState('all');
    const types = ['all', 'feature', 'fix', 'security', 'perf', 'refactor', 'infra', 'improvement', 'announcement'];

    React.useEffect(() => {
        fetch(`${API_BASE}/changelogs`)
            .then(res => res.json())
            .then(data => setReleases(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filteredReleases = releases.filter((r: any) => filter === 'all' || r.type === filter);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(32px,5vw,60px) 20px' }}>
            <SEO
                title="Changelog - New Features & Updates"
                description="See the latest GitTool updates, new AI developer tools, bug fixes, and improvements. Stay up to date with the newest features in the git toolbox."
                keywords={['gittool changelog', 'gittool updates', 'new developer tools', 'github tools release notes']}
                canonical="/changelog"
            />
            {/* Back */}
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--muted-foreground)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '32px' }}
                onMouseEnter={(e: any) => e.currentTarget.style.color = 'var(--foreground)'}
                onMouseLeave={(e: any) => e.currentTarget.style.color = 'var(--muted-foreground)'}>
                <ArrowLeft size={14} /> Back to Home
            </Link>

            {/* Header */}
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: '8px' }}>Changelog</h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                    Every release, feature, fix, and improvement - documented.
                </p>
            </div>

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
                {types.map((t: any) => {
                    const active = filter === t;
                    const m = t === 'all' ? null : TYPE_META[t as keyof typeof TYPE_META];
                    return (
                        <button key={t} onClick={() => setFilter(t)} style={{
                            padding: '5px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 500,
                            border: `1px solid ${active ? (m ? m.border : 'var(--border)') : 'var(--border)'}`,
                            background: active ? (m ? m.bg : 'var(--muted)') : 'transparent',
                            color: active ? (m ? m.color : 'var(--foreground)') : 'var(--muted-foreground)',
                            cursor: 'pointer', transition: 'all 0.15s',
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                        }}>
                            {m && m.icon}
                            {t === 'all' ? 'All' : TYPE_META[t as keyof typeof TYPE_META].label}
                        </button>
                    );
                })}
            </div>

            {/* Timeline */}
            <div style={{ position: 'relative' }}>
                <div style={{
                    position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '1px',
                    background: 'linear-gradient(to bottom, var(--border), transparent)',
                }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {loading ? (
                        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading latest updates...</div>
                    ) : filteredReleases.length === 0 ? (
                        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted-foreground)' }}>No updates found.</div>
                    ) : filteredReleases.map((release: any, idx: any) => {
                        const isLatest = idx === 0 && filter === 'all';
                        return (
                            <div key={release.id} style={{ paddingLeft: '32px', position: 'relative' }}>
                                {/* Timeline dot */}
                                <div style={{
                                    position: 'absolute', left: 0, top: '6px',
                                    width: '15px', height: '15px', borderRadius: '50%',
                                    background: isLatest ? '#c9956a' : 'var(--card)',
                                    border: `2px solid ${isLatest ? '#c9956a' : 'var(--border)'}`,
                                    boxShadow: isLatest ? '0 0 10px rgba(201,149,106,0.4)' : 'none',
                                }} />

                                {/* Release content */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        {release.version && (
                                            <span style={{
                                                fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem', fontWeight: 700,
                                                padding: '2px 10px', borderRadius: '6px',
                                                background: isLatest ? 'rgba(201,149,106,0.12)' : 'var(--muted)',
                                                border: `1px solid ${isLatest ? 'rgba(201,149,106,0.3)' : 'var(--border)'}`,
                                                color: isLatest ? '#c9956a' : 'var(--foreground)',
                                            }}>
                                                {release.version}
                                            </span>
                                        )}
                                        {TYPE_META[release.type as keyof typeof TYPE_META] ? <Badge type={release.type} /> : (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>{release.type}</span>
                                        )}
                                        {isLatest && (
                                            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(201,149,106,0.15)', color: '#c9956a', fontWeight: 600, border: '1px solid rgba(201,149,106,0.3)' }}>
                                                Latest
                                            </span>
                                        )}
                                    </div>
                                    <h2 style={{ fontWeight: 700, fontSize: '1.2rem', margin: '4px 0 6px 0', color: 'var(--foreground)' }}>{release.title}</h2>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>{new Date(release.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>

                                <div style={{
                                    padding: '16px 20px', borderRadius: '12px',
                                    background: 'var(--card)', border: '1px solid var(--border)',
                                    fontSize: '0.9rem', color: 'var(--muted-foreground)', lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {release.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom note */}
            <div style={{ marginTop: '60px', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--muted)', fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.7, textAlign: 'center' }}>
                GitTool is actively developed. New features, fixes, and improvements are shipped regularly.
                <br />Have a suggestion? <a href="mailto:support@gittool.dev" style={{ color: '#c9956a' }}>support@gittool.dev</a>
            </div>
        </div>
    );
}

