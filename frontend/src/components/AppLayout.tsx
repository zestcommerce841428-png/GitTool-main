'use client';

import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import GlobalRepoSelector from './GlobalRepoSelector';
import { Bell } from 'lucide-react';
import ExpandableSearch from './ExpandableSearch';
import CustomScrollbar from './CustomScrollbar';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth');
        }
    }, [loading, router, user]);

    if (loading || !user) {
        return null;
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
            <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((p: any) => !p)} />

            <main
                className="flex flex-1 flex-col h-full overflow-hidden transition-[margin-left] duration-300 ease-in-out"
                style={{ marginLeft: sidebarCollapsed ? 68 : 220 }}
            >
                {/* ── Top Header Bar ──────────────────────── */}
                <header
                    className="flex h-14 items-center justify-between z-[100] relative px-5 sm:px-6 shrink-0"
                    style={{
                        background: 'rgba(10, 10, 14, 0.75)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    {/* Left: Dynamic Navbar Content (portal target) */}
                    <div id="navbar-left" className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden" />

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Search */}
                        <ExpandableSearch />

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-5 bg-white/[0.08]" />

                        {/* Repo + Branch Selectors */}
                        <GlobalRepoSelector />

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-5 bg-white/[0.08]" />

                        {/* Notification Bell */}
                        <button
                            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                            title="Notifications"
                        >
                            <Bell size={17} />
                            <span
                                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
                                style={{
                                    background: '#ef4444',
                                    boxShadow: '0 0 6px rgba(239,68,68,0.7)',
                                }}
                            />
                        </button>
                    </div>
                </header>

                {/* ── Scrollable Content Area ─────────────── */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 sm:p-6 bg-muted/20 relative">
                    {children}
                </div>
                <CustomScrollbar scrollContainerRef={scrollRef} />
            </main>
        </div>
    );
}
