'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isSuspended } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!user) {
            router.replace(`/auth?from=${encodeURIComponent(pathname)}`);
        } else if (isSuspended) {
            router.replace('/suspended');
        }
    }, [user, isSuspended, pathname, router]);

    if (!user || isSuspended) return null;
    return children;
}

