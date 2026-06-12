'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/SEO';
import {
    ArrowRight, Github, Terminal, GitBranch, Shield, Bot,
    BarChart3, Search, Star, ArrowUpRight, Package, CheckCircle
} from 'lucide-react';

const TOOLS = [
    'README Generator', 'Branch Compare', 'Security Scanner', 'Code Analysis',
    'Dependency Audit', 'Gitignore Generator', 'Branch Pruner', 'AI Triage',
    'PR Simulator', 'License Checker', 'Dead Code Finder', 'TODO Scanner',
    'Commit Analyser', 'Repo Health Score', 'PR Reviewer', 'Changelog Gen',
];

export default function Home() {
    const { user } = useAuth();
    return (
        <div className="min-h-screen bg-[#080808] text-white">
            <SEO
                title="Free Online Git Tools for Developers | Best Git Toolkit 2026"
                description="GitTool is a free online git toolkit for developers. AI-powered git tools: README generator, security scanner, branch pruner, branch compare, secrets scanner, dependency auditor and 16+ more git utilities. The best git tools in 2026."
                keywords={[
                  'git tools', 'online git tools', 'free git tools for developers',
                  'git productivity tools', 'git utilities online', 'best git tools 2026',
                  'git developer tools free', 'github helper tools', 'git workflow tools',
                  'git toolkit online free', 'tools for git beginners',
                  'learn git', 'git tutorial', 'git commands', 'git for beginners',
                  'learn git online free', 'interactive git tutorial for beginners',
                  'git best practices', 'git tips and tricks', 'common git mistakes to avoid',
                  'how to write better git commit messages', 'how to undo a git commit',
                  'git workflow for teams best practices', 'best way to learn git for developers',
                ]}
                canonical="/"
            />
            <style>{`
                @keyframes marquee {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes gold-shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }
                @keyframes gold-pulse {
                    0%, 100% { opacity: 0.35; }
                    50%      { opacity: 1; }
                }
                .marquee-track { animation: marquee 40s linear infinite; }
                .marquee-track:hover { animation-play-state: paused; }
                .t1 { animation: fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both 0.05s; opacity:0; }
                .t2 { animation: fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both 0.15s; opacity:0; }
                .t3 { animation: fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both 0.25s; opacity:0; }
                .t4 { animation: fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both 0.35s; opacity:0; }
                .gold-text {
                    background: linear-gradient(90deg, #B8860B, #F5D78E, #C9A84C, #F5D78E, #B8860B);
                    background-size: 300% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gold-shimmer 5s linear infinite;
                }
                .gold-dot {
                    width: 7px; height: 7px; border-radius: 50%;
                    background: #C9A84C;
                    animation: gold-pulse 2.5s ease infinite;
                    flex-shrink: 0;
                }
                .bento-card {
                    background: #0D0D0D;
                    border: 1px solid rgba(255,255,255,0.07);
                    transition: border-color 0.35s ease,
                                transform 0.35s cubic-bezier(0.34,1.56,0.64,1),
                                box-shadow 0.35s ease;
                }
                .bento-card:hover {
                    border-color: rgba(201,168,76,0.4);
                    transform: translateY(-5px);
                    box-shadow: 0 14px 48px rgba(201,168,76,0.07);
                }
                .gold-border-card {
                    background: rgba(201,168,76,0.02);
                    border: 1px solid rgba(201,168,76,0.22);
                    transition: border-color 0.35s ease, box-shadow 0.35s ease;
                }
                .gold-border-card:hover {
                    border-color: rgba(201,168,76,0.5);
                    box-shadow: 0 0 48px rgba(201,168,76,0.07);
                }
                .nav-link {
                    position: relative; color: rgba(255,255,255,0.4);
                    transition: color 0.2s; text-decoration: none;
                }
                .nav-link::after {
                    content: ''; position: absolute;
                    bottom: -2px; left: 0; height: 1px; width: 0;
                    background: #C9A84C; transition: width 0.3s ease;
                }
                .nav-link:hover { color: white; }
                .nav-link:hover::after { width: 100%; }
                .step-num {
                    font-size: 5rem; font-weight: 800;
                    color: rgba(255,255,255,0.06); line-height: 1;
                    transition: color 0.3s ease; user-select: none;
                }
                .step-card:hover .step-num { color: rgba(201,168,76,0.18); }
                .cta-btn {
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 13px 26px; background: #C9A84C; color: #000;
                    font-weight: 600; font-size: 0.875rem; letter-spacing: 0.01em;
                    transition: background 0.25s ease; white-space: nowrap;
                    text-decoration: none;
                }
                .cta-btn:hover { background: #F5D78E; }
                .cta-btn .arrow { transition: transform 0.25s ease; }
                .cta-btn:hover .arrow { transform: translateX(4px); }
                .ghost-btn {
                    display: inline-flex; align-items: center; gap: 10px;
                    padding: 13px 26px; border: 1px solid rgba(255,255,255,0.11);
                    color: rgba(255,255,255,0.5); font-size: 0.875rem;
                    transition: border-color 0.25s, color 0.25s;
                    text-decoration: none;
                }
                .ghost-btn:hover { border-color: rgba(255,255,255,0.28); color: white; }
                .icon-box {
                    width: 40px; height: 40px;
                    border: 1px solid rgba(255,255,255,0.09);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; transition: border-color 0.3s;
                }
                .bento-card:hover .icon-box { border-color: rgba(201,168,76,0.35); }
                .gold-icon-box {
                    width: 38px; height: 38px;
                    border: 1px solid rgba(201,168,76,0.35);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .tag {
                    padding: 3px 10px; border: 1px solid rgba(255,255,255,0.08);
                    font-size: 0.68rem; color: rgba(255,255,255,0.35);
                    letter-spacing: 0.06em;
                }
                /* Responsive stat separators */
                .stat-item { border-bottom: 1px solid rgba(255,255,255,0.07); }
                .stat-item:nth-child(odd) { border-right: 1px solid rgba(255,255,255,0.07); }
                @media (min-width: 768px) {
                    .stat-item { border-bottom: none; border-right: 1px solid rgba(255,255,255,0.07); }
                    .stat-item:nth-child(odd) { border-right: 1px solid rgba(255,255,255,0.07); }
                    .stat-item:last-child { border-right: none; }
                }
                /* Step card mobile separators */
                @media (max-width: 767px) {
                    .step-card:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.07); }
                }
                /* Footer CSS variable overrides for dark home page */
                .dark {
                    --bg-deep: #060606;
                    --border: rgba(255,255,255,0.07);
                    --accent: #C9A84C;
                    --text-primary: #ffffff;
                    --text-tertiary: rgba(255,255,255,0.32);
                    --font-mono: ui-monospace, 'Fira Code', monospace;
                }
            `}</style>

            {/* Nav */}
            <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080808]/95 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="gold-icon-box">
                            <Terminal size={15} className="text-[#C9A84C]" />
                        </div>
                        <span className="font-semibold tracking-tight">GitTool</span>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-8">
                        <a href="#features" className="nav-link text-sm hidden sm:inline">Features</a>
                        <a href="#testimonials" className="nav-link text-sm hidden sm:inline">Reviews</a>
                        <Link href="/blog" className="nav-link text-sm hidden sm:inline">Blog</Link>
                        <Link href="/learn" className="nav-link text-sm hidden sm:inline">Learn</Link>
                        {user ? (
                            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 border border-white/[0.12] text-sm text-white/55 hover:border-[#C9A84C]/45 hover:text-[#C9A84C] transition-all duration-300">
                                Dashboard <ArrowUpRight size={13} />
                            </Link>
                        ) : (
                            <Link href="/auth" className="flex items-center gap-2 px-4 py-2 border border-white/[0.12] text-sm text-white/55 hover:border-[#C9A84C]/45 hover:text-[#C9A84C] transition-all duration-300">
                                Sign in <Github size={13} />
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-12 sm:pb-20">
                <div className="max-w-5xl">
                    <div className="flex items-center gap-3 mb-10 t1">
                        <div className="gold-dot" />
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            Git automation platform — 30+ tools
                        </span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(2.8rem,10vw,8.5rem)', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 0.92, marginBottom: 32 }} className="t2">
                        Git work,<br />
                        <span className="gold-text">automated.</span>
                    </h1>
                    <p className="t3" style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.45)', maxWidth: 480, lineHeight: 1.7, marginBottom: 48 }}>
                        README generation, security scanning, branch analysis — all from your browser. No installation required.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 t4">
                        {user ? (
                            <Link href="/dashboard" className="cta-btn">
                                Open Dashboard <ArrowRight size={16} className="arrow" />
                            </Link>
                        ) : (
                            <Link href="/auth" className="cta-btn">
                                <Github size={15} /> Start for free <ArrowRight size={16} className="arrow" />
                            </Link>
                        )}
                        <a href="#features" className="ghost-btn">Explore tools</a>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={13} className="text-[#C9A84C]" />
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>40 free tokens</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marquee */}
            <div className="border-y border-white/[0.06] py-3.5 overflow-hidden select-none">
                <div className="flex">
                    <div className="marquee-track flex gap-10 flex-shrink-0">
                        {[...TOOLS, ...TOOLS].map((tool: any, i: any) => (
                            <div key={i} className="flex items-center gap-3 flex-shrink-0">
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                    {tool}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <section className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 border border-white/[0.07]">
                    {[
                        { value: '50K+',  label: 'Repositories scanned' },
                        { value: '99.9%', label: 'Uptime SLA' },
                        { value: '2.4s',  label: 'Avg response time' },
                        { value: '500K+', label: 'Developer hours saved' },
                    ].map(({ value, label }) => (
                        <div key={label} className="stat-item px-6 sm:px-8 py-6 sm:py-7">
                            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#C9A84C', lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
                            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bento Grid */}
            <section id="features" className="max-w-7xl mx-auto px-6 py-16">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <div style={{ fontSize: '0.68rem', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>Tools & Features</div>
                        <h2 style={{ fontSize: 'clamp(2.2rem,4.5vw,3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                            Built for serious<br />developers.
                        </h2>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-1">
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>30+ tools</span>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>no install</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bento-card p-6 sm:p-8 flex flex-col" style={{ minHeight: 300 }}>
                        <div className="gold-icon-box mb-auto"><Bot size={17} className="text-[#C9A84C]" /></div>
                        <div style={{ marginTop: 52 }}>
                            <div style={{ fontSize: '0.65rem', color: '#C9A84C', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>AI-Powered</div>
                            <h3 style={{ fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12 }}>README Generator</h3>
                            <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, fontSize: '0.9rem', maxWidth: 400, marginBottom: 20 }}>
                                Professional docs in under 60 seconds. Four templates, AI chat refinement, live preview, one-click export.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {['Professional', 'Minimal', 'Creative', 'Detailed'].map((t: any) => (
                                    <span key={t} className="tag">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bento-card p-6">
                        <div className="icon-box mb-7"><Shield size={17} className="text-white/45" /></div>
                        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>Security Scanner</h3>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>50+ patterns. Secrets flagged before they hit production.</p>
                    </div>
                    <div className="bento-card p-6">
                        <div className="icon-box mb-7"><GitBranch size={17} className="text-white/45" /></div>
                        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>Branch Compare</h3>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>Visual diff, commit timeline, direct PR creation.</p>
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 bento-card p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-8">
                            <div className="flex-1">
                                <div className="icon-box mb-6"><BarChart3 size={17} className="text-white/45" /></div>
                                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Repository Analytics</h3>
                                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.87rem', lineHeight: 1.65 }}>Commit patterns, contributor velocity, code growth — visualized.</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flexShrink: 0 }}>
                                {[{ n: '1.2K', l: 'commits' }, { n: '87%', l: 'health' }, { n: '24', l: 'contributors' }, { n: '+34%', l: 'growth' }].map(({ n, l }) => (
                                    <div key={l} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#C9A84C' }}>{n}</div>
                                        <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bento-card p-6">
                        <div className="icon-box mb-7"><Search size={17} className="text-white/45" /></div>
                        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>Code Analysis</h3>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>TODOs, dead code, tech debt. Auto-convert to issues.</p>
                    </div>
                    <div className="bento-card p-6">
                        <div className="icon-box mb-7"><Package size={17} className="text-white/45" /></div>
                        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>Dependency Audit</h3>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>Outdated packages and vulnerabilities surfaced instantly.</p>
                    </div>
                    <div className="gold-border-card p-6 flex flex-col justify-between">
                        <div style={{ fontSize: '3.2rem', fontWeight: 800, color: '#C9A84C', lineHeight: 1 }}>+24</div>
                        <div>
                            <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>More Tools</h3>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>Gitignore gen, PR simulator, AI triage, branch pruner…</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/[0.06]">
                <div style={{ fontSize: '0.68rem', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>How it works</div>
                <h2 style={{ fontSize: 'clamp(2rem,4vw,3.25rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 48 }}>
                    Three steps.<br />
                    <span style={{ color: 'rgba(255,255,255,0.22)' }}>Zero friction.</span>
                </h2>
                <div className="grid md:grid-cols-3 border border-white/[0.07]">
                    {[
                        { n: '01', title: 'Connect GitHub',    body: 'OAuth in seconds. AES-256 encrypted tokens. Your code never leaves GitHub servers.' },
                        { n: '02', title: 'Select Repository', body: 'Works with any public or private repo you have access to. No extra permissions needed.' },
                        { n: '03', title: 'Run Any Tool',      body: 'No CLI, no config, no installation. Pick a tool and results appear in seconds.' },
                    ].map(({ n, title, body }, i) => (
                        <div key={n} className="step-card px-6 sm:px-8 py-8 sm:py-10 transition-colors duration-300 hover:bg-white/[0.018] md:border-r md:last:border-r-0 border-white/[0.07]">
                            <div className="step-num mb-6">{n}</div>
                            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 10 }}>{title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.65 }}>{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/[0.06]">
                <div className="flex items-center gap-4 mb-14">
                    <div style={{ fontSize: '0.68rem', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>Developer reviews</div>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <div className="flex gap-0.5">
                        {[...Array(5)].map((_: any, i: any) => <Star key={i} size={13} fill="#C9A84C" className="text-[#C9A84C]" />)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.32)' }}>4.9 / 5</div>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                    {[
                        { quote: 'The README generator alone is worth switching. Went from an hour of docs to 60 seconds. Pushed it to my entire org.', name: 'Marcus Chen',  role: 'Full-stack Developer' },
                        { quote: 'Security scanner caught an API key before it hit main. We would have had a serious incident. Non-negotiable for us now.', name: 'Jordan Lee',   role: 'Lead Security Engineer' },
                        { quote: 'Branch comparison with visual diff changed how we do code review. The PR creation integration is seamless.',              name: 'Anjali Patel', role: 'DevOps Lead' },
                    ].map(({ quote, name, role }) => (
                        <div key={name} className="bento-card p-8">
                            <div className="flex gap-0.5 mb-6">
                                {[...Array(5)].map((_: any, i: any) => <Star key={i} size={13} fill="#C9A84C" className="text-[#C9A84C]" />)}
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, fontSize: '0.875rem', marginBottom: 28 }}>"{quote}"</p>
                            <div className="flex items-center gap-3">
                                <div style={{ width: 36, height: 36, background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#C9A84C', flexShrink: 0 }}>
                                    {name.split(' ').map((w: any) => w[0]).join('')}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.32)' }}>{role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/[0.06]">
                <div className="gold-border-card p-7 sm:p-12 md:p-20">
                    <div style={{ maxWidth: 560 }}>
                        <div style={{ fontSize: '0.68rem', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Get started — free</div>
                        <h2 style={{ fontSize: 'clamp(2.6rem,6vw,5.25rem)', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 0.93, marginBottom: 20 }}>
                            Your repo,<br /><span className="gold-text">supercharged.</span>
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 36 }}>
                            40 free tokens on signup. No credit card. Works instantly with any GitHub repository.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            {user ? (
                                <Link href="/dashboard" className="cta-btn">Open Dashboard <ArrowRight size={16} className="arrow" /></Link>
                            ) : (
                                <Link href="/auth" className="cta-btn"><Github size={15} /> Start for free <ArrowRight size={16} className="arrow" /></Link>
                            )}
                            <div className="hidden sm:flex items-center gap-5">
                                {['No credit card', '40 free tokens', 'Cancel anytime'].map((t: any) => (
                                    <div key={t} className="flex items-center gap-1.5">
                                        <CheckCircle size={13} className="text-[#C9A84C]" />
                                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>{t}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

