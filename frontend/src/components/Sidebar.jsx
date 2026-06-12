'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CustomScrollbar from './CustomScrollbar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    GitBranch, Shield, Lock, FileText,
    ChevronRight, LogOut, FolderGit2, Users, AlertCircle, Route, LayoutDashboard,
    PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

const SECTIONS = [
    {
        label: 'GIT',
        categories: [
            {
                name: 'Git Core',
                icon: <GitBranch size={18} />,
                tools: [
                    { name: 'Branches', path: '/tools/branch-merge' },
                    { name: 'Command Builder', path: '/tools/command-builder' },
                    { name: 'Version Suggester', path: '/tools/version-suggester' },
                ]
            },
        ]
    },
    {
        label: 'PROJECT',
        categories: [
            {
                name: 'Documentation',
                icon: <FileText size={18} />,
                tools: [
                    { name: 'README Generator', path: '/tools/readme-generator' },
                    { name: 'API Docs Generator', path: '/tools/api-docs' },
                    { name: 'Architecture Diagram', path: '/tools/architecture-diagram' },
                    { name: 'Changelog', path: '/tools/release-notes' },
                ]
            },
            {
                name: 'Issues',
                icon: <AlertCircle size={18} />,
                tools: [
                    { name: 'Issue Triage', path: '/tools/issue-triage' },
                ]
            },
            {
                name: 'Collaboration',
                icon: <Users size={18} />,
                tools: [
                    { name: 'Activity Feed', path: '/tools/collaboration' },
                    { name: 'TODO Converter', path: '/tools/todo-converter' },
                ]
            },
        ]
    },
    {
        label: 'DEVOPS',
        categories: [
            {
                name: 'CI/CD',
                icon: <Route size={18} />,
                tools: [
                    { name: 'Workflow Builder', path: '/tools/workflow-builder' },
                    { name: 'Failure Explainer', path: '/tools/failure-explainer' },
                ]
            },
            {
                name: 'Security',
                icon: <Lock size={18} />,
                tools: [
                    { name: 'Security Dashboard', path: '/tools/security' },
                    { name: 'CVE Alerts', path: '/tools/cve-alerts' },
                    { name: 'Secrets Scanner', path: '/tools/secrets-scanner' },
                ]
            },
            {
                name: 'Code Quality',
                icon: <Shield size={18} />,
                tools: [
                    { name: 'Dead Code Detector', path: '/tools/dead-code' },
                    { name: 'Dependency Auditor', path: '/tools/dependency-auditor' },
                ]
            },
        ]
    },
];

/* ── Tooltip that appears on hover when sidebar is collapsed ── */
function SidebarTooltip({ children, label, collapsed }) {
    const [show, setShow] = useState(false);
    if (!collapsed) return children;
    return (
        <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && (
                <div
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[100] pointer-events-none"
                    style={{ animation: 'fadeIn 0.15s ease' }}
                >
                    <div className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xl border"
                        style={{ background: 'var(--popover)', color: 'var(--popover-foreground)', borderColor: 'var(--border)' }}>
                        {label}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Sidebar({ collapsed, onToggle }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const avatarUrl = user?.user_metadata?.avatar_url || null;
    const displayName = user?.user_metadata?.full_name || user?.email || 'Developer';
    const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const scrollRef = useRef(null);

    // Flatten all categories for expand/collapse logic
    const allCategories = SECTIONS.flatMap(s => s.categories);

    const [expanded, setExpanded] = useState(() => {
        const initial = {};
        allCategories.forEach(cat => {
            if (cat.tools.some(t => location.pathname === t.path)) {
                initial[cat.name] = true;
            }
        });
        return initial;
    });

    React.useEffect(() => {
        setExpanded(prev => {
            const next = { ...prev };
            let changed = false;
            allCategories.forEach(cat => {
                if (cat.tools.some(t => pathname === t.path)) {
                    if (!next[cat.name]) {
                        next[cat.name] = true;
                        changed = true;
                    }
                }
            });
            return changed ? next : prev;
        });
    }, [location.pathname]);

    const toggleCategory = (name) => {
        if (collapsed) {
            onToggle();
            setExpanded(prev => ({ ...prev, [name]: true }));
            return;
        }
        setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <aside
            className="fixed top-0 left-0 z-50 flex h-screen flex-col overflow-hidden"
            style={{
                width: collapsed ? 68 : 220,
                transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
                background: 'var(--sidebar-bg, hsl(var(--muted) / 0.4))',
                borderRight: '1px solid var(--border)',
            }}
        >
            {/* ── Brand ── */}
            <div className="flex items-center h-14 px-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                {collapsed ? (
                    <div className="flex items-center justify-center w-full">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff' }}>
                            <FolderGit2 size={18} />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff' }}>
                            <FolderGit2 size={18} />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-foreground whitespace-nowrap">
                            GitTool<span className="text-primary">Pro</span>
                        </h1>
                    </div>
                )}
            </div>

            {/* ── Navigation ── */}
            <div className="relative flex flex-1 flex-col overflow-hidden">
                <nav ref={scrollRef} className={`flex flex-1 flex-col gap-1 overflow-y-auto py-3 ${collapsed ? 'px-2' : 'px-3'}`}>

                    {/* Dashboard */}
                    <SidebarTooltip label="Dashboard" collapsed={collapsed}>
                        <Link
                            href="/dashboard"
                            className={`group relative flex items-center rounded-xl transition-all duration-200 ${collapsed ? 'justify-center h-10 w-full' : 'px-3 py-2.5 gap-3'}
                                ${pathname === '/dashboard'
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            {pathname === '/dashboard' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary" style={{ height: '60%' }} />}
                            <span className="shrink-0"><LayoutDashboard size={18} /></span>
                            {!collapsed && <span className="text-sm whitespace-nowrap">Dashboard</span>}
                        </Link>
                    </SidebarTooltip>

                    {/* ── Sections with labels ── */}
                    {SECTIONS.map((section) => (
                        <div key={section.label}>
                            {/* Section label */}
                            {!collapsed && (
                                <div className="mt-5 mb-2 px-3">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                                        {section.label}
                                    </span>
                                </div>
                            )}
                            {collapsed && (
                                <div className="my-2 mx-2 h-px" style={{ background: 'var(--border)' }} />
                            )}

                            {/* Categories within section */}
                            {section.categories.map((cat) => {
                                const isExpanded = expanded[cat.name] && !collapsed;
                                const hasTools = cat.tools.length > 0;
                                const isActiveCategory = hasTools && cat.tools.some(t => pathname === t.path);

                                return (
                                    <div key={cat.name}>
                                        <SidebarTooltip label={cat.name} collapsed={collapsed}>
                                            <button
                                                className={`group relative flex w-full items-center rounded-xl transition-all duration-200
                                                    ${collapsed ? 'justify-center h-10' : 'px-3 py-2.5 justify-between'}
                                                    ${isActiveCategory
                                                        ? 'bg-primary/10 text-primary'
                                                        : isExpanded
                                                            ? 'bg-muted/60 text-foreground'
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                                onClick={() => hasTools && toggleCategory(cat.name)}
                                                style={{ cursor: hasTools ? 'pointer' : 'default' }}
                                            >
                                                {isActiveCategory && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary" style={{ height: '60%' }} />}
                                                <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                                                    <span className="shrink-0">{cat.icon}</span>
                                                    {!collapsed && <span className="text-sm font-semibold whitespace-nowrap">{cat.name}</span>}
                                                </div>
                                                {!collapsed && hasTools && (
                                                    <ChevronRight
                                                        size={14}
                                                        className={`text-muted-foreground/60 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                    />
                                                )}
                                            </button>
                                        </SidebarTooltip>

                                        {/* Expanded tool list */}
                                        {isExpanded && hasTools && (
                                            <div className="ml-[22px] mt-1 mb-2 flex flex-col gap-0.5 border-l border-border/60 pl-3">
                                                {cat.tools.map(tool => (
                                                    <Link
                                                        key={tool.name}
                                                        href={tool.path}
                                                        className={`relative block rounded-lg px-3 py-1.5 text-xs transition-all duration-150 whitespace-nowrap
                                                            ${pathname === tool.path
                                                                ? 'bg-primary/10 font-semibold text-primary'
                                                                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}
                                                    >
                                                        {tool.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>
                <CustomScrollbar scrollContainerRef={scrollRef} />
            </div>

            {/* ── Collapse Toggle ── */}
            <div className={`shrink-0 ${collapsed ? 'px-2 py-2' : 'px-3 py-2'}`} style={{ borderTop: '1px solid var(--border)' }}>
                <SidebarTooltip label={collapsed ? 'Expand' : 'Collapse'} collapsed={collapsed}>
                    <button
                        onClick={onToggle}
                        className={`flex items-center w-full rounded-xl py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200
                            ${collapsed ? 'justify-center px-0' : 'px-3 gap-3'}`}
                    >
                        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                        {!collapsed && <span className="text-xs font-medium">Collapse</span>}
                    </button>
                </SidebarTooltip>
            </div>

            {/* ── User Footer ── */}
            <div className={`shrink-0 ${collapsed ? 'px-2 pb-3 pt-1' : 'px-3 pb-4 pt-1'}`}>
                {collapsed ? (
                    <SidebarTooltip label={displayName} collapsed={collapsed}>
                        <Link href="/profile" className="flex items-center justify-center w-full rounded-xl py-2 hover:bg-muted transition-colors">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full object-cover ring-2 ring-border" />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold ring-2 ring-border"
                                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))', color: 'hsl(var(--primary))' }}>
                                    {initials}
                                </div>
                            )}
                        </Link>
                    </SidebarTooltip>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl p-2.5"
                        style={{ background: 'hsl(var(--muted) / 0.5)' }}>
                        <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3 text-inherit hover:opacity-80 transition-opacity">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full object-cover ring-2 ring-border" />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-bold shrink-0"
                                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))', color: 'hsl(var(--primary))' }}>
                                    {initials}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-semibold m-0">{displayName}</p>
                                <p className="m-0 text-[10px] text-muted-foreground">Pro Account</p>
                            </div>
                        </Link>
                        <button onClick={handleLogout} className="p-1.5 rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-muted" title="Log out">
                            <LogOut size={14} />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

