'use client';

import React, { useState, useEffect } from 'react';
import { Download, Printer, ArrowLeft, Loader2 } from 'lucide-react';
import './epaper-print.css';
import { V2Epaper, DailyEpaper } from './_components/V2Epaper';

export default function EpaperPrintView({ date }: { date: string }) {
    const [epaper, setEpaper] = useState<DailyEpaper | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPdfModal, setShowPdfModal] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const t = Date.now();
                let res = await fetch(`/api/epaper?date=${date}&_t=${t}`, {
                    cache: 'no-store',
                });
                if (!res.ok) res = await fetch(`/api/epaper?_t=${t}`, { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                if (data.articles && data.articles.length > 0) {
                    setEpaper(data);
                } else {
                    setEpaper(null);
                }
            } catch {
                setEpaper(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [date]);

    const handleDownloadPDF = () => setShowPdfModal(true);
    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="epaper-print-loading">
                <Loader2 className="animate-spin" size={32} />
                <p>Loading ePaper…</p>
            </div>
        );
    }

    if (!epaper || epaper.articles.length === 0) {
        return (
            <div className="epaper-print-loading">
                <p>No ePaper available for {date}</p>
                <a href="/daily-epaper" style={{ color: '#b45309', marginTop: 12 }}>
                    ← Back to Daily ePaper
                </a>
            </div>
        );
    }

    return (
        <>
            {/* Modal for PDF Generation */}
            {showPdfModal && (
                <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
                    <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-[#8B4513]/20">
                        <div className="bg-[#8B4513] px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-bold font-serif text-lg m-0">Generate PDF</h3>
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="text-white/80 hover:text-white transition-colors p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-6 text-sm">
                                To save this ePaper as a PDF:
                            </p>
                            <ol className="list-decimal list-outside ml-4 mb-6 text-sm text-gray-700 space-y-3">
                                <li>Click <strong>Generate PDF</strong> below (opens browser print dialog).</li>
                                <li>In the print window, set Destination to <strong>Save as PDF</strong>.</li>
                                <li>Set Paper Size to <strong>A4</strong>.</li>
                                <li>Set Margins to <strong>None</strong> or <strong>Default</strong>.</li>
                                <li><strong>Important:</strong> Check "Background graphics" to include colors and styling.</li>
                            </ol>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowPdfModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPdfModal(false);
                                        setTimeout(() => window.print(), 100);
                                    }}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-[#D4791C] text-white font-medium hover:bg-[#B85A10] transition-colors shadow-sm"
                                >
                                    Proceed to Print
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Toolbar (Non-Printable) */}
            <div className="epaper-print-toolbar no-print">
                <a href="/daily-epaper" className="epaper-print-btn-back">
                    <ArrowLeft size={16} /> Back to Daily ePaper
                </a>
                <div className="epaper-print-toolbar-right">
                    <button
                        onClick={handleDownloadPDF}
                        className="epaper-print-btn"
                        style={{
                            background: 'linear-gradient(135deg, #C0392B, #8B1A1A)',
                            minWidth: 200,
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Download size={16} /> Download PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="epaper-print-btn"
                        style={{ background: '#33200A', opacity: 0.7 }}
                    >
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>

            {/* ── Printable A4 Content ──────────────────────────────── */}
            <div id="epaper-pdf-content">
                <V2Epaper epaper={epaper} />
            </div>
        </>
    );
}
