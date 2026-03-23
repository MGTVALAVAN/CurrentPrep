'use client';
import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeProvider';

export default function MockTestsPage() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { theme } = useTheme();

    // Sync theme to embedded mock engine
    useEffect(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                { type: 'theme', theme },
                '*'
            );
        }
    }, [theme]);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            <iframe
                ref={iframeRef}
                src="/mock-engine/index.html?embed=1"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                }}
                title="UPSC CSE Prelims Mock Tests"
                onLoad={() => {
                    // Sync theme on load
                    if (iframeRef.current?.contentWindow) {
                        iframeRef.current.contentWindow.postMessage(
                            { type: 'theme', theme },
                            '*'
                        );
                    }
                }}
            />
        </div>
    );
}
