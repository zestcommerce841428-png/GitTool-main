'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-deep)',
            marginTop: 'auto',
        }}>
            <div style={{
                maxWidth: '1060px', margin: '0 auto',
                padding: 'clamp(40px,5vw,60px) 24px 32px',
            }}>
                {/* Top row */}
                <div className="footer-grid">
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1rem', marginBottom: '12px' }}>
                            <FileText size={18} style={{ color: 'var(--accent)' }} />
                            GitTool
                        </div>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', lineHeight: 1.7, maxWidth: '260px', margin: '0 0 16px' }}>
                            70+ Git utilities, AI automation, and deep repository analytics — unified in one premium interface.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                                { icon: Github, href: 'https://github.com/Vibhav-y' },
                                { icon: Twitter, href: 'https://twitter.com' },
                                { icon: Mail, href: 'mailto:support@gittool.dev' },
                            ].map(({ icon: Icon, href }, i) => (
                                <a key={i} href={href} target="_blank" rel="noreferrer" style={{
                                    color: 'var(--text-tertiary)',
                                    display: 'flex', alignItems: 'center',
                                    transition: 'color 0.2s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                                >
                                    <Icon size={17} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 style={{
                            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '14px',
                            fontFamily: 'var(--font-mono)',
                        }}>Product</h4>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { label: 'Features', href: '/#tools' },
                                { label: 'Analytics', href: '/#insights' },
                                { label: 'Blog', href: '/blog' },
                                { label: 'Changelog', href: '/changelog' },
                            ].map(({ label, href }) => (
                                <Link key={href} href={href} style={{
                                    color: 'var(--text-tertiary)', fontSize: '0.85rem',
                                    textDecoration: 'none', transition: 'color 0.2s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 style={{
                            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '14px',
                            fontFamily: 'var(--font-mono)',
                        }}>Legal</h4>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { label: 'Privacy Policy', href: '/privacy' },
                                { label: 'Terms of Service', href: '/terms' },
                                { label: 'Changelog', href: '/changelog' },
                            ].map(({ label, href }) => (
                                <Link key={href} href={href} style={{
                                    color: 'var(--text-tertiary)', fontSize: '0.85rem',
                                    textDecoration: 'none', transition: 'color 0.2s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                                >
                                    {label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Stack */}
                    <div>
                        <h4 style={{
                            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: '14px',
                            fontFamily: 'var(--font-mono)',
                        }}>Built With</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {['React + Vite', 'Node.js + Express', 'OpenAI GPT', 'Supabase Auth & DB', 'GitHub OAuth API', 'Razorpay Payments'].map(t => (
                                <span key={t} style={{
                                    color: 'var(--text-tertiary)', fontSize: '0.82rem',
                                    fontFamily: 'var(--font-mono)',
                                }}>{t}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '12px',
                }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        © {year} GitTool. All rights reserved.
                    </span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                        Made with ❤️ for developers.
                    </span>
                </div>
            </div>

            <style>{`
                .footer-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 48px;
                }
                @media (max-width: 768px) {
                    .footer-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 32px;
                    }
                }
                @media (max-width: 480px) {
                    .footer-grid {
                        grid-template-columns: 1fr;
                        gap: 28px;
                    }
                }
            `}</style>
        </footer>
    );
}

