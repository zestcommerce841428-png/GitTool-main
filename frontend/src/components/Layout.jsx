'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import CustomScrollbar from '@/components/CustomScrollbar';
import Footer from '@/components/Footer';
import { FileText, User, LogOut } from 'lucide-react';

/* ── Main Layout ────────────────────────────────────────── */
export default function Layout({ children }) {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const avatarUrl = user?.user_metadata?.avatar_url || null;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const isHome = pathname === '/';

    return (
        <div className={`flex min-h-screen flex-col bg-background text-foreground ${isHome ? 'dark' : ''}`}>
            {/* ── Top Navbar ──────────────────────────────────── */}
            {!isHome && <nav className="sticky top-0 z-50 flex h-16 w-full items-center justify-center border-b bg-background/80 px-6 backdrop-blur-md">
                <div className="flex w-full max-w-7xl items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                        <FileText className="text-primary" size={20} />
                        <span>GitTool</span>
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2">
                                Dashboard
                            </Link>
                            
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="h-7 w-7 rounded-full border object-cover" />
                            ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-muted">
                                    <User size={14} className="text-muted-foreground" />
                                </div>
                            )}

                            <button onClick={handleLogout} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Sign out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
                            <Link href="/auth" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">Get Started</Link>
                        </div>
                    )}
                </div>
            </nav>}

            {/* ── Main Content Area ─────────────────────────── */}
            <div className="flex flex-1 flex-col relative">
                <main className="flex-1">
                    {children}
                </main>
                <CustomScrollbar />
            </div>

            <Footer />
        </div>
    );
}

