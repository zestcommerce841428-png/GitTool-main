'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export default function ExpandableSearch() {
    const [isExpanded, setIsExpanded] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Focus input when expanding
    useEffect(() => {
        if (isExpanded && (inputRef.current as any)) {
            (inputRef.current as any).focus();
        }
    }, [isExpanded]);

    // Handle escape key + ⌘K shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded((prev: any) => !prev);
                return;
            }
            if (e.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [isExpanded]);

    return (
        <div className="relative flex items-center h-full">
            {/* Overlay */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            {/* Search trigger / expanded input */}
            <div className={`relative z-50 flex items-center transition-all duration-300 ease-in-out ${isExpanded ? 'w-64 sm:w-80' : ''}`}>
                {!isExpanded ? (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center gap-2 h-8 rounded-lg px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                        aria-label="Open search"
                    >
                        <Search size={14} className="shrink-0 opacity-60" />
                        <span className="hidden sm:inline text-muted-foreground/60">Search…</span>
                        <kbd className="hidden sm:inline-flex ml-3 h-5 items-center rounded border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[10px] text-muted-foreground/50">
                            {isMac ? '⌘K' : 'Ctrl K'}
                        </kbd>
                    </button>
                ) : (
                    <div className="relative w-full">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder="Search repos, commits, branches…"
                            className="pl-9 pr-4 w-full bg-background shadow-md border-primary/20 focus-visible:ring-primary/30 h-9 text-sm"
                            onBlur={() => setIsExpanded(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

