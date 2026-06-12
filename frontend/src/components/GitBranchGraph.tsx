'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { GitBranch, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { useCommitGraph } from '../hooks/useQueryHooks';

/* ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   CONSTANTS
   ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
const LANE_W   = 44;
const ROW_H    = 38;
const MERGE_ROW = 50;
const DOT_R    = 4;
const HEAD_R   = 6;
const PAD_L    = 28;
const PAD_T    = 16;

const COLORS = [
    '#58A6FF', '#F78166', '#D2A8FF', '#56D364',
    '#FFA657', '#FF7B72', '#79C0FF', '#E3B341',
];

/* ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   DAG-BASED LANE ASSIGNMENT ALGORITHM
   ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   Key: lanes are assigned by commit RELATIONSHIPS, not branch
   names. Lanes are reused when branches merge or terminate.
   This is the GitKraken / Sublime Merge approach.
   ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
function buildGraph(commits: any) {
    if (!commits?.length) return { nodes: [], edges: [], laneCount: 0, totalH: 0, branchLanes: {} as Record<string, any> };

    // Index for fast lookup
    const shaIdx = new Map();
    commits.forEach((c: any, i: any) => shaIdx.set(c.hash, i));

    /*
     * lanes[]   — array of active lane slots. null = free, sha = occupied
     * laneMap{} — hash — lane index assignment
     */
    const lanes: any[] = [];
    const laneMap: Record<string, any> = {};

    function findFreeLane() {
        for (let i = 0; i < lanes.length; i++) {
            if (lanes[i] === null) return i;
        }
        lanes.push(null);
        return lanes.length - 1;
    }

    /* ── Pass 1: assign lanes top—bottom ──────────────────── */
    const nodeData: any[] = []; // intermediate node info

    commits.forEach((commit: any, rowIdx: any) => {
        // 1️⃣ Find or assign lane for this commit
        let lane;
        if ((laneMap as Record<string,any>)[commit.hash] !== undefined) {
            lane = (laneMap as Record<string,any>)[commit.hash];
        } else {
            lane = findFreeLane();
        }
        lanes[lane] = commit.hash;

        const isMerge = (commit.parents || []).length > 1;

        nodeData.push({
            ...commit,
            idx: rowIdx,
            lane,
            isMerge,
            color: COLORS[lane % COLORS.length],
        });

        // 2️⃣ Handle parents
        const parents = commit.parents || [];

        parents.forEach((parentHash: any, pi: any) => {
            if ((laneMap as Record<string,any>)[parentHash] !== undefined) {
                // Parent already has a lane assignment (from another child)
                return;
            }

            if (pi === 0) {
                // First parent: continues in the SAME lane (straight line down)
                (laneMap as Record<string,any>)[parentHash] = lane;
            } else {
                // Additional parents (merge sources): assign a NEW or FREE lane
                const newLane = findFreeLane();
                (laneMap as Record<string,any>)[parentHash] = newLane;
                lanes[newLane] = parentHash;
            }
        });

        // 3️⃣ If this commit's lane is not continued by any child's first-parent,
        //    and no parent continues it, free the lane.
        //    We check: does any parent use this lane? If not, free it.
        const laneUsedByParent = parents.some((ph: any) => (laneMap as Record<string,any>)[ph] === lane);
        if (!laneUsedByParent && parents.length > 0) {
            // Lane is no longer needed (branch terminated here via merge)
            // But only free if the first parent took a different lane
            if ((laneMap as Record<string,any>)[parents[0]] !== lane) {
                lanes[lane] = null;
            }
        }
    });

    /* ── Pass 2: compute positions ────────────────────────── */
    let cumY = PAD_T;
    const nodes = nodeData.map((n: any) => {
        const y = cumY;
        cumY += n.isMerge ? MERGE_ROW : ROW_H;
        return {
            ...n,
            x: PAD_L + n.lane * LANE_W,
            y,
        };
    });

    /* ── Edges ────────────────────────────────────────────── */
    const edges: any[] = [];
    nodes.forEach((node: any) => {
        (node.parents || []).forEach((pHash: any) => {
            const pIdx = shaIdx.get(pHash);
            if (pIdx === undefined) return;
            const parent = nodes[pIdx];
            edges.push({
                from: node,
                to: parent,
                color: node.lane === parent.lane ? node.color : parent.color,
                sameLane: node.lane === parent.lane,
            });
        });
    });

    /* ── Lane spans (for vertical continuation lines) ─────── */
    const laneSpans: Record<string, any> = {};
    nodes.forEach((n: any) => {
        if (!laneSpans[n.lane]) laneSpans[n.lane] = { minY: n.y, maxY: n.y, color: n.color };
        laneSpans[n.lane].minY = Math.min(laneSpans[n.lane].minY, n.y);
        laneSpans[n.lane].maxY = Math.max(laneSpans[n.lane].maxY, n.y);
    });

    /* ── Map branch names — lanes (for legend) ────────────── */
    const branchLanes: Record<string, any> = {};
    nodes.forEach((n: any) => {
        if (n.branches) {
            n.branches.forEach((b: any) => {
                if (branchLanes[b] === undefined) branchLanes[b] = n.lane;
            });
        }
    });

    const laneCount = lanes.length || 1;
    const totalH = cumY + 24;

    return { nodes, edges, laneCount, laneSpans, totalH, branchLanes };
}

/* ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
export default function GitBranchGraph({ repo }: any) {
    const { data, isLoading, error } = useCommitGraph(repo);
    const [hoveredIdx, setHoveredIdx] = useState<any>(null);
    const [hoveredLane, setHoveredLane] = useState<any>(null);

    const { nodes, edges, laneCount, laneSpans, totalH, branchLanes } = useMemo(() => {
        if (!(data as any)?.commits) return { nodes: [], edges: [], laneCount: 0, laneSpans: {}, totalH: 0, branchLanes: {} as Record<string, any> };
        return buildGraph((data as any).commits);
    }, [data]);

    const graphW = PAD_L + Math.max(laneCount, 1) * LANE_W + 24;

    const onRowEnter = useCallback((idx: any, lane: any) => {
        setHoveredIdx(idx);
        setHoveredLane(lane);
    }, []);
    const onRowLeave = useCallback(() => {
        setHoveredIdx(null);
        setHoveredLane(null);
    }, []);

    return (
        <div className="relative flex flex-col rounded-2xl border border-white/10
                        bg-[#0c1319]/90 backdrop-blur-md overflow-hidden h-full
                        min-h-[380px] shadow-[0_8px_30px_rgb(0,0,0,0.3)]">

            {/* ────── Header ────────────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-1 z-10">
                <div className="flex items-center gap-2 font-semibold text-white/90">
                    <GitBranch size={18} className="text-[#58A6FF]" />
                    <span>Commit Graph</span>
                    {repo && <span className="text-[11px] font-normal text-white/30 ml-1">{repo.name}</span>}
                </div>
                <button className="text-white/40 hover:text-white/80 transition-colors">
                    <MoreHorizontal size={18} />
                </button>
            </div>

            {/* ────── Legend ────────────────────────────────────────────────────────────────── */}
            {(data as any)?.branches?.length > 0 && (
                <div className="flex items-center gap-4 px-5 py-2 border-b border-white/5 flex-wrap">
                    {(data as any).branches.map((b: any) => {
                        const li = branchLanes[b] ?? 0;
                        return (
                            <div key={b}
                                className="flex items-center gap-1.5 text-[10px] cursor-pointer transition-opacity"
                                style={{ opacity: hoveredLane === null || hoveredLane === li ? 1 : 0.3 }}
                                onMouseEnter={() => setHoveredLane(li)}
                                onMouseLeave={() => setHoveredLane(null)}
                            >
                                <span className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ background: COLORS[li % COLORS.length] }} />
                                <span className="text-white/60 font-medium truncate max-w-[90px]">{b}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ────── Body ──────────────────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pb-16">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64 text-white/50 text-sm">
                        <Loader2 className="animate-spin mr-2" size={18} /> Loading commit graph…
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64 text-white/50 text-sm">
                        <AlertCircle className="mr-2" size={18} /> Failed to load
                    </div>
                ) : nodes.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-white/40 text-sm">No data</div>
                ) : (
                    <div className="relative" style={{ height: totalH }}>

                        {/* ── SVG ────────────────────────── */}
                        <svg className="absolute top-0 left-0 pointer-events-none"
                             width={graphW} height={totalH} fill="none">
                            <defs>
                                <filter id="nglow">
                                    <feGaussianBlur stdDeviation="3" result="b"/>
                                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                                </filter>
                            </defs>

                            {/* Grid lines */}
                            {Array.from({ length: laneCount }).map((_: any, li: any) => {
                                const lx = PAD_L + li * LANE_W;
                                return (
                                    <line key={`g${li}`}
                                        x1={lx} y1={0} x2={lx} y2={totalH}
                                        stroke={hoveredLane === li ? COLORS[li % COLORS.length] : '#1f2937'}
                                        strokeWidth={hoveredLane === li ? 1.2 : 0.5}
                                        opacity={hoveredLane === li ? 0.2 : 0.25}
                                    />
                                );
                            })}

                            {/* Vertical continuation lines */}
                            {Object.entries(laneSpans as Record<string, any>).map(([ls, span]) => {
                                const li = Number(ls);
                                const lx = PAD_L + li * LANE_W;
                                const col = span.color;
                                const dim = hoveredLane !== null && hoveredLane !== li;
                                return (
                                    <line key={`v${li}`}
                                        x1={lx} y1={span.minY} x2={lx} y2={span.maxY}
                                        stroke={col} strokeWidth={2}
                                        strokeLinecap="round"
                                        opacity={dim ? 0.08 : 0.45}
                                        style={{ transition: 'opacity 0.2s' }}
                                    />
                                );
                            })}

                            {/* Edges */}
                            {edges.map((e: any, i: any) => {
                                const dim = hoveredLane !== null
                                    && hoveredLane !== e.from.lane
                                    && hoveredLane !== e.to.lane;

                                if (e.sameLane) {
                                    return (
                                        <line key={`e${i}`}
                                            x1={e.from.x} y1={e.from.y}
                                            x2={e.to.x}   y2={e.to.y}
                                            stroke={e.color} strokeWidth={2}
                                            strokeLinecap="round"
                                            opacity={dim ? 0.06 : 0.7}
                                            style={{ transition: 'opacity 0.2s' }}
                                        />
                                    );
                                }
                                // Bezier for cross-lane
                                const midY = (e.from.y + e.to.y) / 2;
                                return (
                                    <path key={`e${i}`}
                                        d={`M ${e.from.x} ${e.from.y}
                                            C ${e.from.x} ${midY},
                                              ${e.to.x}   ${midY},
                                              ${e.to.x}   ${e.to.y}`}
                                        stroke={e.color} strokeWidth={2}
                                        strokeLinecap="round" strokeLinejoin="round"
                                        fill="none"
                                        opacity={dim ? 0.06 : 0.5}
                                        style={{ transition: 'opacity 0.2s' }}
                                    />
                                );
                            })}

                            {/* Nodes */}
                            {nodes.map((n: any, i: any) => {
                                const isHead = (data as any)?.branchHeads
                                    && n.branches?.some((b: any) => (data as any).branchHeads[b] === n.hash);
                                const dim = hoveredLane !== null && hoveredLane !== n.lane;
                                const hov = hoveredIdx === i;
                                const r = isHead ? HEAD_R : DOT_R;

                                return (
                                    <g key={`n${i}`}
                                       opacity={dim ? 0.15 : 1}
                                       style={{ transition: 'opacity 0.15s' }}>

                                        {hov && (
                                            <circle cx={n.x} cy={n.y} r={12}
                                                fill={n.color} opacity={0.2} filter="url(#nglow)" />
                                        )}

                                        {n.isMerge ? (
                                            <rect x={n.x - 5} y={n.y - 5}
                                                  width={10} height={10} rx={1.5}
                                                  transform={`rotate(45 ${n.x} ${n.y})`}
                                                  fill={n.color} stroke="#0c1319" strokeWidth={2} />
                                        ) : (
                                            <>
                                                {isHead && (
                                                    <circle cx={n.x} cy={n.y} r={r + 2}
                                                        fill="none" stroke={n.color}
                                                        strokeWidth={1.5} opacity={0.5} />
                                                )}
                                                <circle cx={n.x} cy={n.y} r={r}
                                                    fill={n.color} stroke="#0c1319" strokeWidth={2} />
                                            </>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>

                        {/* ── Row labels ─────────────────── */}
                        {nodes.map((n: any, i: any) => {
                            const isHead = (data as any)?.branchHeads
                                && n.branches?.some((b: any) => (data as any).branchHeads[b] === n.hash);
                            const rowH = n.isMerge ? MERGE_ROW : ROW_H;
                            const dim = hoveredLane !== null && hoveredLane !== n.lane;

                            return (
                                <div key={`r${i}`}
                                    className="absolute flex items-center gap-2 cursor-pointer
                                               transition-all duration-150 rounded-r-lg"
                                    style={{
                                        top: n.y - rowH / 2,
                                        left: graphW,
                                        right: 0,
                                        height: rowH,
                                        paddingLeft: 10,
                                        paddingRight: 12,
                                        opacity: dim ? 0.2 : 1,
                                        background: hoveredIdx === i ? 'rgba(255,255,255,0.03)' : 'transparent',
                                    }}
                                    onMouseEnter={() => onRowEnter(i, n.lane)}
                                    onMouseLeave={onRowLeave}
                                >
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[12px] text-white/80 truncate leading-tight font-medium">
                                            {n.message}
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-mono"
                                                  style={{ color: n.color + 'AA' }}>
                                                {n.shortHash}
                                            </span>
                                            <span className="text-[10px] text-white/25 truncate">
                                                {n.author}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Branch head tags */}
                                    {isHead && (data as any)?.branchHeads &&
                                        n.branches
                                            .filter((b: any) => (data as any).branchHeads[b] === n.hash)
                                            .map((b: any) => {
                                                const bl = branchLanes[b] ?? 0;
                                                return (
                                                    <span key={b}
                                                        className="shrink-0 text-[9px] font-bold px-2 py-0.5
                                                                   rounded-md truncate max-w-[80px]"
                                                        style={{
                                                            color: COLORS[bl % COLORS.length],
                                                            border: `1px solid ${COLORS[bl % COLORS.length]}30`,
                                                            background: COLORS[bl % COLORS.length] + '12',
                                                        }}>
                                                        {b}
                                                    </span>
                                                );
                                            })
                                    }

                                    {/* Tooltip */}
                                    {hoveredIdx === i && (
                                        <div className="absolute left-2 -top-1 -translate-y-full
                                                        bg-[#161b22] border border-white/10 rounded-lg
                                                        px-3 py-2 text-[11px] z-50 shadow-xl
                                                        min-w-[200px] max-w-[300px] pointer-events-none">
                                            <div className="font-bold text-white/90 mb-1 break-words">{n.message}</div>
                                            <div className="text-white/40 font-mono text-[10px] mb-1">
                                                {n.shortHash} • {n.author}
                                            </div>
                                            <div className="text-white/30 text-[10px]">
                                                {n.branches?.join(', ')}
                                                {n.isMerge && <span className="ml-1 text-[#D2A8FF]">— merge</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 inset-x-0 h-16
                            bg-gradient-to-t from-[#0c1319] to-transparent
                            pointer-events-none z-20" />
        </div>
    );
}

