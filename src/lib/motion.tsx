/**
 * Lazy-loaded Framer Motion Components
 * 
 * Reduces initial JS bundle by code-splitting Framer Motion.
 * Pages that don't use animations skip this ~30KB dependency entirely.
 */

'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Lazy-load framer-motion's motion.div
export const LazyMotionDiv = dynamic(
    () => import('framer-motion').then(mod => {
        const MotionDiv = mod.motion.div;
        // Wrap in forwardRef-compatible component
        return function LazyDiv(props: any) {
            return <MotionDiv {...props} />;
        };
    }),
    {
        ssr: false,
        loading: () => <div />,
    }
);

// For pages that definitely need framer-motion, re-export directly
export { motion, AnimatePresence } from 'framer-motion';
