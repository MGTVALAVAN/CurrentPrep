'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import { prelimsData, mainsData, type SyllabusTab, type SyllabusTopic } from '@/data/syllabusData';
import { ChevronDown, ChevronRight, Download, FileText, BookOpen, HelpCircle } from 'lucide-react';

function TopicCard({ topic, language }: { topic: SyllabusTopic; language: string }) {
    const [open, setOpen] = useState(false);
    const { t } = useLanguage();
    const title = language === 'ta' ? topic.titleTa : topic.title;
    const summary = language === 'ta' ? topic.summaryTa : topic.summary;

    return (
        <div className="border rounded-xl overflow-hidden transition-all duration-200"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-primary-800/5 dark:hover:bg-primary-400/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-700 dark:text-primary-400 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>{title}</span>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                </motion.div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <p className="text-sm leading-relaxed mt-3 mb-4" style={{ color: 'var(--text-secondary)' }}>
                                {summary}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {topic.pdfUrl && (
                                    <a href={topic.pdfUrl} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-primary-800/10 text-primary-800 dark:bg-primary-400/10 dark:text-primary-300 
                      hover:bg-primary-800/20 dark:hover:bg-primary-400/20 transition-colors">
                                        <Download className="w-3.5 h-3.5" />
                                        {topic.pdfLabel || t('download_pdf')}
                                    </a>
                                )}
                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-accent-500/10 text-accent-600 dark:text-accent-400 hover:bg-accent-500/20 transition-colors">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    {t('take_quiz')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function SectionGroup({ tab, language }: { tab: SyllabusTab; language: string }) {
    const title = language === 'ta' ? tab.titleTa : tab.title;

    return (
        <div className="space-y-6">
            {tab.sections.map((section) => {
                const sectionTitle = language === 'ta' ? section.titleTa : section.title;
                return (
                    <div key={section.id}>
                        <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2"
                            style={{ color: 'var(--text-primary)' }}>
                            <BookOpen className="w-5 h-5 text-accent-500" />
                            {sectionTitle}
                        </h3>
                        <div className="space-y-2">
                            {section.topics.map((topic) => (
                                <TopicCard key={topic.id} topic={topic} language={language} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function SyllabusPage() {
    const { t, language } = useLanguage();
    const [mainTab, setMainTab] = useState<'prelims' | 'mains'>('prelims');
    const [subTabIndex, setSubTabIndex] = useState(0);

    const currentData = mainTab === 'prelims' ? prelimsData : mainsData;
    const currentSub = currentData[subTabIndex] || currentData[0];

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <section className="hero-bg py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4"
                    >
                        {t('syllabus_title')}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-blue-100/90 max-w-2xl mx-auto"
                    >
                        {t('syllabus_subtitle')}
                    </motion.p>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Main Tabs: Prelims / Mains */}
                <div className="flex justify-center gap-2 mb-8">
                    {(['prelims', 'mains'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setMainTab(tab); setSubTabIndex(0); }}
                            className={`px-6 py-3 rounded-xl font-heading font-semibold text-base transition-all duration-200
                ${mainTab === tab
                                    ? 'bg-gradient-to-r from-primary-800 to-primary-600 text-white shadow-lg'
                                    : 'border hover:bg-primary-800/5 dark:hover:bg-primary-400/5'
                                }`}
                            style={mainTab !== tab ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : {}}
                        >
                            {t(tab)}
                        </button>
                    ))}
                </div>

                {/* Sub-tabs (GS1, GS2, etc.) */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {currentData.map((tab, i) => {
                        const label = language === 'ta' ? tab.titleTa : tab.title;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setSubTabIndex(i)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${subTabIndex === i
                                        ? 'bg-accent-500 text-white shadow-md'
                                        : 'border hover:bg-accent-500/10'
                                    }`}
                                style={subTabIndex !== i ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : {}}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${mainTab}-${subTabIndex}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <SectionGroup tab={currentSub} language={language} />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
