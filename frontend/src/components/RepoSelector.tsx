'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Loader2 } from 'lucide-react';
import api from '../lib/apiClient';

/**
 * Shared repo selector dropdown used across all tool pages.
 *
 * Props:
 *  - value   { owner, repo } | null
 *  - onChange (repo) => void   — fires with the raw GitHub repo object
 */
export default function RepoSelector({ value, onChange }: { value: any; onChange: (repo: any) => void }) {
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await api.get('/repos');
                setRepos(res.repos || []);
                // Auto-select first if nothing selected
                if (!value && res.repos?.length) {
                    onChange(res.repos[0]);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load repositories');
            }
            finally { setLoading(false); }
        }
        load();
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = repos.filter((r: any) =>
        r.full_name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedName = value?.full_name || value?.name || 'Select repository…';

    return (
        <div ref={ref} style={{ position: 'relative', minWidth: 240 }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, padding: '10px 16px', borderRadius: 12,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : selectedName}
                </span>
                <ChevronDown size={16} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.4)', overflow: 'hidden', maxHeight: 320,
                    display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Filter repos…"
                                style={{
                                    width: '100%', padding: '8px 12px 8px 32px', border: 'none',
                                    background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: 256 }}>
                        {error && (
                            <div style={{ padding: '16px', color: '#f87171', fontSize: '0.8125rem', textAlign: 'center', background: 'rgba(239,68,68,0.1)', margin: '8px', borderRadius: '8px' }}>
                                {error}
                            </div>
                        )}
                        {!error && filtered.length === 0 && (
                            <p style={{ padding: 16, color: 'var(--text-tertiary)', fontSize: '0.8125rem', textAlign: 'center' }}>
                                No repositories found
                            </p>
                        )}
                        {filtered.map((r: any) => (
                            <button
                                key={r.id}
                                onClick={() => { onChange(r); setOpen(false); setSearch(''); }}
                                style={{
                                    width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none',
                                    background: value?.id === r.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                                    color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8125rem',
                                    borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between',
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>{r.full_name}</span>
                                <span style={{ fontSize: '0.6875rem', color: r.private ? 'var(--warning)' : 'var(--success)' }}>
                                    {r.private ? 'Private' : 'Public'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

