'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import { Clock, Tag, ArrowRight } from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.5 },
    }),
};

const blogPosts = [
    {
        title: 'How to Complete NCERT Reading in 90 Days: A Realistic Plan',
        excerpt: 'A day-by-day reading schedule covering all essential NCERTs from Class 6-12, organized by subject priority for UPSC Prelims and Mains.',
        date: '2025-01-20',
        readTime: '8 min',
        category: 'Strategy',
        featured: true,
    },
    {
        title: 'UPSC Prelims 2025: Expected Cut-off & Preparation Tips',
        excerpt: 'Analysis of trend in UPSC Prelims cut-offs, difficulty level predictions, and last-minute preparation strategies.',
        date: '2025-01-18',
        readTime: '6 min',
        category: 'Prelims',
    },
    {
        title: 'Mastering GS4 Ethics: Framework for Case Studies',
        excerpt: 'Step-by-step framework to approach ethics case studies—stakeholder analysis, ethical theories application, and answer structuring.',
        date: '2025-01-16',
        readTime: '10 min',
        category: 'Mains',
    },
    {
        title: 'Economic Survey 2024-25: Key Takeaways for UPSC',
        excerpt: 'Chapter-wise important points from the latest Economic Survey. GDP growth, fiscal consolidation, and social sector spending highlights.',
        date: '2025-01-14',
        readTime: '12 min',
        category: 'Economy',
    },
    {
        title: 'Best Optional Subjects for UPSC CSE 2025: Data-Driven Analysis',
        excerpt: 'Comparing success rates, scoring trends, and overlap with GS for top optional subjects. Includes profiles of ideal candidates for each.',
        date: '2025-01-12',
        readTime: '9 min',
        category: 'Strategy',
    },
    {
        title: 'Tamil Nadu Through UPSC Lens: Art, Culture & Heritage',
        excerpt: 'Comprehensive notes on Tamil Nadu\'s contribution to Indian culture — Sangam literature, Bharatanatyam, temple architecture, and more.',
        date: '2025-01-10',
        readTime: '11 min',
        category: 'Culture',
    },
    {
        title: 'International Relations 2025: India\'s G20 Legacy & Beyond',
        excerpt: 'How India\'s G20 presidency shaped its diplomatic narrative. Key bilateral developments, Indo-Pacific strategy, and multilateral reforms.',
        date: '2025-01-08',
        readTime: '7 min',
        category: 'IR',
    },
    {
        title: 'Science & Technology: ISRO Missions You Must Know',
        excerpt: 'From Chandrayaan-3 to Gaganyaan — complete list of ISRO missions relevant for UPSC with key facts and significance.',
        date: '2025-01-06',
        readTime: '8 min',
        category: 'Science',
    },
    {
        title: 'Answer Writing Practice: 10 Model Answers for GS2',
        excerpt: 'Governance and polity model answers with examiner\'s perspective. Covers Parliament, judiciary, federalism, and local governance topics.',
        date: '2025-01-04',
        readTime: '15 min',
        category: 'Mains',
    },
];

const categories = ['All', 'Strategy', 'Prelims', 'Mains', 'Economy', 'Culture', 'IR', 'Science'];

export default function BlogPage() {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = React.useState('All');

    const filtered = activeCategory === 'All' ? blogPosts : blogPosts.filter((p) => p.category === activeCategory);

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <section className="hero-bg py-16 lg:py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                        {t('blog_title')}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-lg text-blue-100/90 max-w-xl mx-auto">
                        {t('blog_subtitle')}
                    </motion.p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeCategory === cat
                                    ? 'bg-primary-800 text-white dark:bg-primary-600 shadow-md'
                                    : 'border hover:bg-primary-800/5 dark:hover:bg-primary-400/5'
                                }`}
                            style={activeCategory !== cat ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : {}}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Featured Post */}
                {filtered.find((p) => p.featured) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 rounded-2xl border mb-8 card-hover cursor-pointer"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500 text-white font-medium">Featured</span>
                        <h2 className="font-heading font-bold text-xl sm:text-2xl mt-3 mb-2" style={{ color: 'var(--text-primary)' }}>
                            {filtered.find((p) => p.featured)!.title}
                        </h2>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                            {filtered.find((p) => p.featured)!.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {filtered.find((p) => p.featured)!.readTime}</span>
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {filtered.find((p) => p.featured)!.category}</span>
                            <span>{filtered.find((p) => p.featured)!.date}</span>
                        </div>
                    </motion.div>
                )}

                {/* Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.filter((p) => !p.featured).map((post, i) => (
                        <motion.div
                            key={post.title}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="p-6 rounded-2xl border card-hover cursor-pointer group"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                        >
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-800/10 dark:bg-primary-400/10 text-primary-800 dark:text-primary-300 font-medium">
                                {post.category}
                            </span>
                            <h3 className="font-heading font-semibold text-base mt-3 mb-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
                                {post.title}
                            </h3>
                            <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                                {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                                    <span>{post.date}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-accent-500" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
