'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Terminal, GitBranch, ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';

// ── Layout ────────────────────────────────────────────────────────────────────
const W = 620, H = 215;
const MY = 78;           // main branch Y
const FY = 162;          // feature branch Y
const SX = 195;          // split commit X
const BX = 468;          // break point X
const BY = FY;

const MAIN_CX  = [52, 118, 195, 264, 334, 402];
const FEAT_CX  = [280, 386];
const HASHES   = ['3f7a1b2', 'a9c4e8d', 'c0de404', '1f3a5b7', 'dead2be', 'f00dbar'];
const FEAT_HASH = ['b4d404a', 'ca404be'];

// Sparks: [dx, dy, duration, delay]
const SPARKS = [
    [ 17, -14, '0.30s', '0.00s'],
    [-15, -16, '0.20s', '0.13s'],
    [ 20,   4, '0.36s', '0.07s'],
    [-18,   6, '0.24s', '0.21s'],
    [ 12,  18, '0.28s', '0.10s'],
    [-10,  17, '0.18s', '0.26s'],
    [ 22,  -4, '0.34s', '0.05s'],
    [  6, -20, '0.22s', '0.18s'],
];

export default function NotFound() {
    const [phase, setPhase] = useState(0);

    function replay() {
        setPhase(0);
        setTimeout(() => setPhase(1), 60);
        setTimeout(() => setPhase(2), 960);
        setTimeout(() => setPhase(3), 1780);
    }

    useEffect(() => {
        replay();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ph1 = phase >= 1;
    const ph2 = phase >= 2;
    const ph3 = phase >= 3;

    return (
        <div style={{
            minHeight: '100vh',
            background: '#080808',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <SEO title="404 - Page Not Found" description="The page you are looking for does not exist. Return to GitTool and explore AI-powered Git developer tools." noIndex={true} />
            <style>{`
                @keyframes gold-shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }
                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(22px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes spark-flash {
                    0%, 100% { opacity: 0; transform: scale(0.3); }
                    40%, 60%  { opacity: 1; transform: scale(1); }
                }
                @keyframes blink-red {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0.2; }
                }
                @keyframes drift-right {
                    0%   { transform: translateX(0);  opacity: 0.55; }
                    100% { transform: translateX(18px); opacity: 0; }
                }
                .gold-text {
                    background: linear-gradient(90deg, #B8860B, #F5D78E, #C9A84C, #F5D78E, #B8860B);
                    background-size: 300% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gold-shimmer 5s linear infinite;
                }
                .fade-up { animation: fade-up 0.65s cubic-bezier(0.16,1,0.3,1) both; }
                .back-btn {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 11px 24px;
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.45);
                    font-size: 0.82rem; letter-spacing: 0.03em;
                    transition: border-color 0.25s, color 0.25s;
                    text-decoration: none; background: transparent; cursor: pointer;
                    font-family: inherit;
                }
                .back-btn:hover { border-color: rgba(255,255,255,0.26); color: #fff; }
                .home-btn {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 11px 24px;
                    background: #C9A84C; color: #000;
                    font-weight: 700; font-size: 0.82rem; letter-spacing: 0.03em;
                    transition: background 0.25s, box-shadow 0.25s;
                    text-decoration: none; border: none; cursor: pointer;
                    font-family: inherit;
                }
                .home-btn:hover {
                    background: #F5D78E;
                    box-shadow: 0 0 28px rgba(201,168,76,0.25);
                }
                .replay-btn {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 0; background: transparent; border: none;
                    color: rgba(255,255,255,0.18);
                    font-size: 0.72rem; cursor: pointer;
                    transition: color 0.2s;
                    letter-spacing: 0.06em;
                    font-family: ui-monospace, monospace;
                }
                .replay-btn::before { content: '// '; color: rgba(255,255,255,0.09); }
                .replay-btn:hover { color: rgba(255,255,255,0.45); }
                .replay-btn:hover::before { color: rgba(255,255,255,0.18); }
            `}</style>

            {/* ── 404 heading ───────────────────────────────────────────── */}
            <div className="fade-up" style={{ animationDelay: '0s', textAlign: 'center', marginBottom: 2 }}>
                <span className="gold-text" style={{
                    fontSize: 'clamp(4.5rem, 16vw, 9rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.055em',
                    lineHeight: 0.88,
                    display: 'block',
                }} aria-label="404 — page not found">404</span>
                <div style={{
                    marginTop: 10,
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.18)',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    fontFamily: 'ui-monospace, monospace',
                }}>branch not found</div>
            </div>

            {/* ── Git branch SVG ──────────────────────────────────────────── */}
            <div className="fade-up" style={{ animationDelay: '0.1s', width: '100%', maxWidth: 660, margin: '24px 0 2px' }}>
                <svg viewBox={`0 0 ${W} ${H}`}
                    style={{ width: '100%', height: 'auto', overflow: 'visible' }}
                    aria-hidden="true">
                    <defs>
                        <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <filter id="glow-red" x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <linearGradient id="fade-right" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(255,80,80,0)" />
                            <stop offset="100%" stopColor="rgba(255,80,80,0.18)" />
                        </linearGradient>
                    </defs>

                    {/* ── MAIN BRANCH ─────────────────────────────────────── */}
                    <line x1="20" y1={MY} x2="444" y2={MY}
                        stroke="#C9A84C" strokeWidth="2.5" filter="url(#glow-gold)"
                        style={{
                            strokeDasharray: 430,
                            strokeDashoffset: ph1 ? 0 : 430,
                            transition: 'stroke-dashoffset 0.85s cubic-bezier(0.16,1,0.3,1) 0.05s',
                        }}
                    />
                    <text x="20" y={MY - 14} fill="rgba(201,168,76,0.6)"
                        fontSize="10.5" fontFamily="ui-monospace, monospace" letterSpacing="0.04em"
                        style={{ opacity: ph1 ? 1 : 0, transition: 'opacity 0.3s 0.55s' }}>
                        main
                    </text>
                    {/* HEAD badge */}
                    <rect x="452" y={MY - 12} width="52" height="20" rx="3"
                        fill="rgba(201,168,76,0.08)" stroke="rgba(201,168,76,0.32)" strokeWidth="1"
                        style={{ opacity: ph1 ? 1 : 0, transition: 'opacity 0.3s 0.95s' }} />
                    <text x="478" y={MY + 4} textAnchor="middle" fill="#C9A84C"
                        fontSize="9.5" fontFamily="ui-monospace, monospace" letterSpacing="0.05em"
                        style={{ opacity: ph1 ? 1 : 0, transition: 'opacity 0.3s 0.95s' }}>
                        HEAD
                    </text>
                    {/* main commits */}
                    {MAIN_CX.map((cx: any, i: any) => (
                        <g key={`mc${i}`} style={{ opacity: ph1 ? 1 : 0, transition: `opacity 0.15s ease ${0.08 + i * 0.1}s` }}>
                            <circle cx={cx} cy={MY} r="7" fill="#080808" stroke="#C9A84C" strokeWidth="2.5" filter="url(#glow-gold)" />
                            {/* hash label — above branch label (MY-14) with clear gap */}
                            <text x={cx} y={MY - 28} textAnchor="middle" fill="rgba(201,168,76,0.28)"
                                fontSize="7.5" fontFamily="ui-monospace, monospace">
                                {HASHES[i]}
                            </text>
                        </g>
                    ))}

                    {/* ── FEATURE BRANCH ──────────────────────────────────── */}
                    {/* elbow */}
                    <path d={`M ${SX} ${MY} C ${SX} ${MY + 46}, ${SX + 46} ${FY}, ${SX + 76} ${FY}`}
                        fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="2"
                        style={{
                            strokeDasharray: 112,
                            strokeDashoffset: ph2 ? 0 : 112,
                            transition: 'stroke-dashoffset 0.36s cubic-bezier(0.16,1,0.3,1) 0.03s',
                        }}
                    />
                    {/* horizontal to break */}
                    <line x1={SX + 76} y1={FY} x2={BX - 14} y2={FY}
                        stroke="rgba(255,255,255,0.42)" strokeWidth="2"
                        style={{
                            strokeDasharray: 210,
                            strokeDashoffset: ph2 ? 0 : 210,
                            transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16,1,0.3,1) 0.38s',
                        }}
                    />
                    {/* branch label */}
                    <text x={SX + 76} y={FY - 12} fill="rgba(255,255,255,0.28)"
                        fontSize="9.5" fontFamily="ui-monospace, monospace" letterSpacing="0.02em"
                        style={{ opacity: ph2 ? 1 : 0, transition: 'opacity 0.3s 0.75s' }}>
                        feature/lost-route
                    </text>
                    {/* feature commits */}
                    {FEAT_CX.map((cx: any, i: any) => (
                        <g key={`fc${i}`} style={{ opacity: ph2 ? 1 : 0, transition: `opacity 0.15s ease ${0.45 + i * 0.15}s` }}>
                            <circle cx={cx} cy={FY} r="6" fill="#080808" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                            {/* hash label — below commits to avoid overlapping branch label above */}
                            <text x={cx} y={FY + 18} textAnchor="middle" fill="rgba(255,255,255,0.15)"
                                fontSize="7.5" fontFamily="ui-monospace, monospace">
                                {FEAT_HASH[i]}
                            </text>
                        </g>
                    ))}

                    {/* ── BREAK POINT ─────────────────────────────────────── */}
                    {ph3 && (
                        <g>
                            {/* pulse ring (SVG-native animation for reliable scale) */}
                            <circle cx={BX} cy={BY} r="10"
                                fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5">
                                <animate attributeName="r" from="10" to="34" dur="0.7s" fill="freeze" />
                                <animate attributeName="opacity" from="0.8" to="0" dur="0.7s" fill="freeze" />
                            </circle>

                            {/* sparks */}
                            {SPARKS.map(([dx, dy, dur, delay], i) => (
                                <line key={`sk${i}`}
                                    x1={BX} y1={BY} x2={BX + (dx as number)} y2={BY + (dy as number)}
                                    stroke={i % 2 === 0 ? '#C9A84C' : 'rgba(255,255,255,0.8)'}
                                    strokeWidth="1.5" strokeLinecap="round"
                                    style={{
                                        transformOrigin: `${BX}px ${BY}px`,
                                        animation: `spark-flash ${dur} ease-in-out ${delay} infinite`,
                                    }}
                                />
                            ))}

                            {/* "ghost" tail — fades right to suggest the lost branch */}
                            <line x1={BX} y1={BY} x2={BX + 40} y2={BY}
                                stroke="rgba(255,80,80,0.22)" strokeWidth="2" strokeDasharray="4 5"
                                style={{ animation: 'drift-right 1.8s ease-out forwards' }}
                            />

                            {/* torn-end zigzag */}
                            <path d={`M ${BX-13} ${BY} L ${BX-6} ${BY-7} L ${BX+1} ${BY+6} L ${BX+8} ${BY-4}`}
                                stroke="rgba(255,80,80,0.8)" strokeWidth="2"
                                fill="none" strokeLinecap="round" strokeLinejoin="round"
                                filter="url(#glow-red)"
                                style={{ animation: 'blink-red 1.2s ease-in-out infinite' }}
                            />

                            {/* error circle */}
                            <circle cx={BX} cy={BY} r="12"
                                fill="rgba(255,40,40,0.07)" stroke="rgba(255,80,80,0.4)" strokeWidth="1.5"
                                filter="url(#glow-red)"
                            />
                            <text x={BX} y={BY + 4} textAnchor="middle"
                                fill="rgba(255,90,90,0.95)" fontSize="9.5" fontWeight="bold"
                                fontFamily="system-ui"
                                style={{ animation: 'blink-red 1.2s ease-in-out infinite' }}>
                                ✓
                            </text>

                        </g>
                    )}
                </svg>
            </div>

            {/* replay — styled as a code comment */}
            <button className="replay-btn" onClick={replay}>replay()</button>

            {/* Subtitle */}
            <p className="fade-up" style={{
                animationDelay: '0.3s',
                margin: '20px 0 28px',
                fontSize: '0.88rem',
                color: 'rgba(255,255,255,0.3)',
                textAlign: 'center',
                maxWidth: 380,
                lineHeight: 1.7,
            }}>
                Looks like this route forked off and never merged back.
                <br />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.76rem', color: 'rgba(255,255,255,0.15)' }}>
                    fatal: branch &apos;feature/lost-route&apos; has no upstream
                </span>
            </p>

            {/* Actions */}
            <div className="fade-up" style={{
                animationDelay: '0.4s',
                display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
            }}>
                <button className="back-btn" onClick={() => window.history.back()}>
                    <ArrowLeft size={14} /> Go back
                </button>
                <Link href="/" className="home-btn">
                    <Terminal size={13} /> Back to home
                </Link>
            </div>

            {/* Watermark */}
            <div style={{
                marginTop: 52,
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,255,255,0.08)',
                fontSize: '0.68rem', letterSpacing: '0.12em',
                fontFamily: 'ui-monospace, monospace',
            }}>
                <GitBranch size={11} />
                git checkout HEAD~∞
            </div>
        </div>
    );
}

