'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTokenBalance, useGitHubTokenStatus, useTokenTransactions } from '@/hooks/useQueryHooks';
import {
    User, Mail, FileText, Zap, Settings, Link2,
    Check, Sun, Moon, Monitor, GitBranch, Bell, MessageSquare,
    Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

export default function Profile() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const avatarUrl = user?.user_metadata?.avatar_url || null;
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';
    const email = user?.email || '';
    const initials = fullName.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase();

    const [name, setName] = useState(fullName);
    const [emailVal, setEmailVal] = useState(email);
    const [bio, setBio] = useState('');
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [slackDMs, setSlackDMs] = useState(true);

    // Live data via React Query (cached, shared with Dashboard)
    const { data: balance = null, isLoading: loadingBal } = useTokenBalance();
    const { data: ghStatus = null, isLoading: loadingGh } = useGitHubTokenStatus();
    const { data: txData = null, isLoading: loadingTx } = useTokenTransactions();
    const transactions = txData?.transactions || [];
    const loadingData = loadingBal || loadingGh || loadingTx;

    useEffect(() => {
        // Dynamically load Razorpay script only on Profile page
        if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);
    // Derive top tools from transactions
    const toolCounts: Record<string, number> = {};
    transactions.forEach((t: any) => {
        const name = t.description?.split(' for ')[0]?.replace('Generated ', '') || 'Unknown';
        toolCounts[name] = (toolCounts[name] || 0) + 1;
    });
    const topTools = Object.entries(toolCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3);

    const TOOL_COLORS = ['bg-primary', 'bg-emerald-500', 'bg-amber-500'];

    const credits = balance?.balance ?? 0;
    const totalEarned = balance?.totalEarned ?? 40;
    const totalUsed = balance?.totalUsed ?? 0;

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
            {/* ── Profile Header ───────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl} 
                            alt="Avatar" 
                            className="h-20 w-20 rounded-full border-4 border-primary/20 object-cover shadow-lg"
                        />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary/20 bg-gradient-to-br from-primary/80 to-primary text-2xl font-black text-primary-foreground shadow-lg">
                            {initials}
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">{fullName}</h1>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                            {user?.user_metadata?.user_name ? `@${user.user_metadata.user_name}` : 'Developer'}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-primary/80">
                            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline">Discard</Button>
                    <Button>Save Changes</Button>
                </div>
            </div>

            {/* ── Main Grid ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                
                {/* Left Column (Wider) */}
                <div className="md:col-span-3 space-y-8">
                    
                    {/* Personal Information */}
                    <Card className="bg-card/40 backdrop-blur border-muted/50 shadow-sm">
                        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 pt-5">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User size={18} className="text-primary" /> Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                                    <Input value={name} onChange={(e: any) => setName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
                                    <Input value={emailVal} onChange={(e: any) => setEmailVal(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</label>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                    value={bio}
                                    onChange={(e: any) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Preferences */}
                    <Card className="bg-card/40 backdrop-blur border-muted/50 shadow-sm">
                        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 pt-5">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Settings size={18} className="text-primary" /> System Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            
                            {/* Theme */}
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">Theme Appearance</h4>
                                <p className="text-xs text-muted-foreground mb-4">Choose how GitTool looks on your device</p>
                                <div className="inline-flex items-center rounded-lg border p-1 bg-muted/20">
                                    {['Dark', 'Light', 'System'].map((t: any) => {
                                        const value = t.toLowerCase();
                                        const isActive = theme === value;
                                        return (
                                            <button 
                                                key={t}
                                                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${isActive ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                                                onClick={() => setTheme(value)}
                                            >
                                                {t === 'Dark' && <Moon size={14} />}
                                                {t === 'Light' && <Sun size={14} />}
                                                {t === 'System' && <Monitor size={14} />}
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Notifications */}
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-4">Notifications</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                <Bell size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Email Alerts</p>
                                                <p className="text-xs text-muted-foreground">Daily summaries and critical notifications</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={emailAlerts} 
                                            onCheckedChange={setEmailAlerts} 
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                <MessageSquare size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Slack Direct Messages</p>
                                                <p className="text-xs text-muted-foreground">Receive DMs from the GitTool Slack bot</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={slackDMs} 
                                            onCheckedChange={setSlackDMs} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column (Narrower) */}
                <div className="md:col-span-2 space-y-8">
                    
                    {/* AI Usage */}
                    <Card className="bg-card/40 backdrop-blur border-primary/20 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <span className="inline-flex items-center rounded-sm bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                                Pro Plan
                            </span>
                        </div>
                        <CardHeader className="border-b border-border/50 bg-primary/5 pb-4 pt-5">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Zap size={18} className="text-primary" /> AI Usage
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {loadingData ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-baseline justify-between mb-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credits Remaining</span>
                                        <span className="text-xl font-bold font-mono">
                                            {credits.toLocaleString()} <span className="text-xs text-muted-foreground">/ {totalEarned.toLocaleString()}</span>
                                        </span>
                                    </div>
                                    <Progress value={(credits / totalEarned) * 100} className="h-2 mb-2" />
                                    <p className="text-[10px] text-muted-foreground">{totalUsed.toLocaleString()} credits used across all tools</p>

                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Top Tools Used</h4>
                                    <div className="space-y-4">
                                        {topTools.length > 0 ? topTools.map(([name, count], i) => (
                                            <div key={name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${TOOL_COLORS[i] || 'bg-muted-foreground'}`} />
                                                    <span className="text-sm font-medium">{name}</span>
                                                </div>
                                                <span className="text-sm font-bold font-mono text-muted-foreground">{count}</span>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-muted-foreground italic">No tool usage yet</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Connected Accounts */}
                    <Card className="bg-card/40 backdrop-blur border-muted/50 shadow-sm">
                        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4 pt-5">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Link2 size={18} className="text-primary" /> Connected Accounts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex flex-col">
                                {/* GitHub */}
                                <div className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-2xl">
                                            🐙
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">GitHub</p>
                                            {ghStatus?.connected && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    @{user?.user_metadata?.user_name || 'connected'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {loadingData ? (
                                        <Loader2 size={16} className="animate-spin text-muted-foreground" />
                                    ) : ghStatus?.connected ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
                                        </span>
                                    ) : (
                                        <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                            Link Account
                                        </Button>
                                    )}
                                </div>

                                {/* GitLab */}
                                <div className="flex items-center justify-between border-t border-border/50 p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-2xl">
                                            🦊
                                        </div>
                                        <p className="font-bold text-sm">GitLab</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                        Link Account
                                    </Button>
                                </div>

                                {/* Bitbucket */}
                                <div className="flex items-center justify-between border-t border-border/50 p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-2xl">
                                            🪣
                                        </div>
                                        <p className="font-bold text-sm">Bitbucket</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                        Link Account
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

