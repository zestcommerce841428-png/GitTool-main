'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SEO from '@/components/SEO';
import { Github, ArrowRight, Shield, Zap, GitBranch } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

function Auth() {
    const router = useRouter();
    const { user } = useAuth();

    // Check for login errors in the URL hash
    useEffect(() => {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const errorDesc = params.get('error_description');
        if (errorDesc) {
            toast.error(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, []);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    const handleGithubLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                    scopes: 'repo read:user'
                }
            });
            if (error) throw error;
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <>
        <SEO
            title="Sign In — Login to GitTool"
            description="Sign in to GitTool with GitHub to access all AI-powered developer tools: README generator, branch compare, secrets scanner and more."
            keywords={['gittool login', 'sign in with github', 'github oauth developer tools', 'gittool sign up']}
            canonical="/auth"
            noIndex={true}
        />
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            minHeight: 'calc(100vh - var(--topbar-height) - 100px)',
            padding: '60px 24px',
            position: 'relative',
        }}>
            {/* Background glow */}
            <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '600px', height: '500px',
                background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div className="glass-card" style={{
                maxWidth: '440px', width: '100%', padding: '48px 40px', textAlign: 'center',
                position: 'relative', zIndex: 1,
            }}>
                {/* Icon */}
                <div style={{
                    width: '64px', height: '64px', borderRadius: '16px',
                    background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 28px',
                }}>
                    <Github size={28} style={{ color: 'var(--accent)' }} />
                </div>

                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '8px' }}>
                    Welcome to <span className="text-gradient">GitTool</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    Sign in to access 70+ Git utilities, AI automation, and real-time analytics.
                </p>

                {/* GitHub button */}
                <button
                    type="button"
                    className="btn-primary"
                    onClick={handleGithubLogin}
                    style={{
                        width: '100%', justifyContent: 'center', display: 'flex',
                        gap: '12px', padding: '14px 20px', fontSize: '1rem',
                        marginBottom: '20px',
                    }}
                >
                    <Github size={20} />
                    Continue with GitHub
                    <ArrowRight size={16} />
                </button>

                {/* Future providers (disabled) */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button disabled className="btn-outline" style={{
                        flex: 1, opacity: 0.35, cursor: 'not-allowed', fontSize: '0.8rem', padding: '10px',
                    }}>
                        GitLab
                    </button>
                    <button disabled className="btn-outline" style={{
                        flex: 1, opacity: 0.35, cursor: 'not-allowed', fontSize: '0.8rem', padding: '10px',
                    }}>
                        Bitbucket
                    </button>
                </div>

                <p style={{
                    color: 'var(--text-tertiary)', fontSize: '0.72rem', marginTop: '20px',
                    fontFamily: 'var(--font-mono)',
                }}>
                    Coming soon: GitLab & Bitbucket OAuth
                </p>

                {/* Scope info */}
                <div style={{
                    marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--border)',
                    textAlign: 'left',
                }}>
                    <p style={{
                        fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)',
                        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px',
                        fontFamily: 'var(--font-mono)',
                    }}>
                        Requested Permissions
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            { icon: GitBranch, label: 'Repository access', desc: 'Read & write to your repos' },
                            { icon: Shield, label: 'Profile data', desc: 'Read your GitHub profile' },
                            { icon: Zap, label: 'No code execution', desc: 'We never run or modify code' },
                        ].map((perm, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 12px', borderRadius: 'var(--radius)',
                                background: 'rgba(255,255,255,0.02)',
                            }}>
                                <perm.icon size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {perm.label}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                        {perm.desc}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default Auth;

