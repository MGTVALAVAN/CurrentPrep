/**
 * Core Web Vitals Reporter
 * 
 * Reports CLS, FID, LCP, FCP, TTFB to console (dev) and
 * can be extended to send to analytics endpoints.
 * 
 * Usage: import in layout.tsx client wrapper
 */

'use client';

import { useEffect } from 'react';

type MetricName = 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB' | 'INP';

interface WebVitalMetric {
    name: MetricName;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
    navigationType: string;
}

// Thresholds for Core Web Vitals
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    INP: { good: 200, poor: 500 },
    LCP: { good: 2500, poor: 4000 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[name];
    if (!threshold) return 'good';
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
}

function reportMetric(metric: WebVitalMetric) {
    const rating = getRating(metric.name, metric.value);
    const emoji = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
    
    if (process.env.NODE_ENV === 'development') {
        console.log(
            `${emoji} [Web Vital] ${metric.name}: ${
                metric.name === 'CLS' ? metric.value.toFixed(3) : `${Math.round(metric.value)}ms`
            } (${rating})`
        );
    }

    // Send to analytics endpoint (extend as needed)
    // Example: send to /api/analytics/vitals
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        const body = JSON.stringify({
            name: metric.name,
            value: metric.value,
            rating,
            delta: metric.delta,
            id: metric.id,
            page: window.location.pathname,
            timestamp: Date.now(),
        });

        // Uncomment when analytics endpoint is ready:
        // navigator.sendBeacon('/api/analytics/vitals', body);
    }
}

export function WebVitalsReporter() {
    useEffect(() => {
        // Dynamically import web-vitals to avoid bundle impact
        import('web-vitals').then(({ onCLS, onLCP, onFCP, onTTFB, onINP }) => {
            onCLS((m) => reportMetric(m as unknown as WebVitalMetric));
            onLCP((m) => reportMetric(m as unknown as WebVitalMetric));
            onFCP((m) => reportMetric(m as unknown as WebVitalMetric));
            onTTFB((m) => reportMetric(m as unknown as WebVitalMetric));
            onINP((m) => reportMetric(m as unknown as WebVitalMetric));
        }).catch(() => {
            // web-vitals not installed — silently skip
        });
    }, []);

    return null; // No visual output
}
