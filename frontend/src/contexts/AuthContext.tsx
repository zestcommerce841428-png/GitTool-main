'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
    user: any;
    loading: boolean;
    isSuspended: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    isSuspended: false,
});

export const useAuth = () => useContext(AuthContext);

const isBanned = (user: any) =>
    user?.banned_until && new Date(user.banned_until) > new Date();

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSuspended, setIsSuspended] = useState(false);

    const applySession = async (session: any) => {
        const u = session?.user ?? null;
        setUser(u);
        setIsSuspended(!!isBanned(u));
        if (session?.provider_token && session?.access_token) {
            try {
                const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
                await fetch(`${API_BASE}/users/github-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ token: session.provider_token })
                });
            } catch (err: any) {
                console.error("Failed to securely store github token", err);
            }
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            applySession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            applySession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Instant SSE logout if suspended by admin
    useEffect(() => {
        if (!user || isSuspended) return;

        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
        const controller = new AbortController();

        const connectStream = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;

                const res = await fetch(`${API_BASE}/auth/stream/status`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    signal: controller.signal
                });
                if (!res.ok) return;

                const reader = res.body!.getReader();
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    if (chunk.includes("event: suspended")) {
                        await supabase.auth.signOut();
                        setIsSuspended(true);
                        setUser(null);
                        break;
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setTimeout(() => !controller.signal.aborted && connectStream(), 5000);
                }
            }
        };

        connectStream();
        return () => controller.abort();
    }, [user, isSuspended]);

    const value = { user, loading, isSuspended };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
