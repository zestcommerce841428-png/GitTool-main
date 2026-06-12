'use client';

import React, { useState } from 'react';
import { Terminal as TerminalIcon, Maximize2, Minimize2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ToolWorkspace({
    title,
    description,
    icon,
    children,
    primaryAction,
    terminalOutput = []
}: any) {
    const [terminalOpen, setTerminalOpen] = useState(false);

    return (
        <div className="flex h-full flex-col">
            {/* ── Workspace Header ──────────────────────────── */}
            <header className="mb-6 flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-muted text-primary">
                        {icon}
                    </div>
                    <div>
                        <h1 className="m-0 text-2xl font-bold tracking-tight text-foreground">
                            {title}
                        </h1>
                        <p className="m-0 mt-1 text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setTerminalOpen(!terminalOpen)}>
                        <TerminalIcon size={16} className="mr-2" />
                        {terminalOpen ? 'Hide Terminal' : 'Show Terminal'}
                    </Button>
                    {primaryAction && (
                        <Button onClick={primaryAction.onClick}>
                            {primaryAction.icon || <Play size={16} className="mr-2" />}
                            {primaryAction.label}
                        </Button>
                    )}
                </div>
            </header>

            {/* ── Main Tool Area ────────────────────────────── */}
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
                {children}
            </div>

            {/* ── Terminal Drawer ───────────────────────────── */}
            {terminalOpen && (
                <div className="mt-6 flex h-60 flex-col overflow-hidden rounded-xl border bg-muted/30 font-mono text-[13px]">
                    <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <TerminalIcon size={14} /> Output Log
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 text-foreground/90">
                        {terminalOutput.length > 0 ? terminalOutput.map((line: any, i: any) => (
                            <div key={i} className={`mb-1 flex gap-3 ${line.startsWith('Error') ? 'text-destructive' : line.startsWith('Success') ? 'text-emerald-500' : ''}`}>
                                <span className="text-muted-foreground">{new Date().toLocaleTimeString().split(' ')[0]}</span>
                                <span>{line}</span>
                            </div>
                        )) : (
                            <div className="italic text-muted-foreground">No output yet...</div>
                        )}
                        {/* Blinking cursor effect */}
                        <div className="mt-1 flex gap-3">
                            <span className="text-muted-foreground">{new Date().toLocaleTimeString().split(' ')[0]}</span>
                            <span className="animate-pulse text-primary">_</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

