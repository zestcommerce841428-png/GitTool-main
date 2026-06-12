'use client';

import React, { useEffect, useState, RefObject } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

export default function CustomScrollbar({ scrollContainerRef }: { scrollContainerRef?: RefObject<HTMLElement | null> }) {
    const { scrollYProgress } = useScroll(
        scrollContainerRef ? { container: scrollContainerRef } : undefined
    );

    const springProgress = useSpring(scrollYProgress, {
        stiffness: 400,
        damping: 30,
        mass: 0.8,
        restDelta: 0.0001
    });

    const [isVisible, setIsVisible] = useState(false);
    const [thumbHeight, setThumbHeight] = useState(100);
    const [maxScrollY, setMaxScrollY] = useState(0);

    useEffect(() => {
        const updateHeight = () => {
            let scrollHeight = 0;
            let clientHeight = 0;

            if (scrollContainerRef && (scrollContainerRef.current as any)) {
                scrollHeight = (scrollContainerRef.current as any).scrollHeight;
                clientHeight = (scrollContainerRef.current as any).clientHeight;
            } else {
                scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
                clientHeight = window.innerHeight;
            }
            
            if (scrollHeight > clientHeight + 10) {
                const proportion = clientHeight / scrollHeight;
                const newThumbHeight = Math.max(30, clientHeight * proportion);
                setThumbHeight(newThumbHeight);
                setMaxScrollY(clientHeight - newThumbHeight);
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        // Initial check and set up an interval to catch late-renders or images loading
        updateHeight();
        const interval = setInterval(updateHeight, 500);
        window.addEventListener('resize', updateHeight);
        
        let resizeObserver: ResizeObserver | null = null;
        let mutObserver: MutationObserver | null = null;

        if (typeof window !== 'undefined') {
            resizeObserver = new ResizeObserver(updateHeight);
            mutObserver = new MutationObserver(updateHeight);
            const target = scrollContainerRef?.current || document.body;
            
            if (target) {
                try {
                    resizeObserver.observe(target);
                    mutObserver.observe(target, { childList: true, subtree: true, characterData: true });
                } catch (e: any) {}
            }
        }

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', updateHeight);
            if (resizeObserver) resizeObserver.disconnect();
            if (mutObserver) mutObserver.disconnect();
        };
    }, [scrollContainerRef]);

    const y = useTransform(springProgress, [0, 1], [0, maxScrollY]);
    const scaleY = useTransform(springProgress, [-0.1, 0, 1, 1.1], [0.5, 1, 1, 0.5]);
    const scaleX = useTransform(springProgress, [-0.1, 0, 1, 1.1], [1.5, 1, 1, 1.5]);
    const originY = useTransform(springProgress, [-0.1, 0, 1, 1.1], ['0%', '50%', '50%', '100%']);

    if (!isVisible) return null;

    const positionClass = scrollContainerRef ? "absolute" : "fixed";

    return (
        <div className={`${positionClass} right-0 top-0 bottom-0 w-3 z-[100] pointer-events-none`}>
            <motion.div
                style={{
                    y,
                    scaleX,
                    scaleY,
                    originY,
                    height: thumbHeight,
                }}
                className="absolute right-[2px] w-2 rounded-full bg-foreground/30 backdrop-blur-sm"
            />
        </div>
    );
}

