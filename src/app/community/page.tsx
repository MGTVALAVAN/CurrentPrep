'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    MessageSquare, ThumbsUp, Eye, Clock, Pin, Search,
    Filter, PlusCircle, TrendingUp, Users, Flame,
    ChevronRight, ArrowUp, BookOpen, Award, Tag
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
    }),
};

const categories = [
    { id: 'all', label: 'All Posts', icon: MessageSquare, count: 156 },
    { id: 'prelims', label: 'Prelims', icon: BookOpen, count: 45 },
    { id: 'mains', label: 'Mains', icon: Tag, count: 38 },
    { id: 'optional', label: 'Optional', icon: Filter, count: 22 },
    { id: 'strategy', label: 'Strategy', icon: TrendingUp, count: 31 },
    { id: 'current_affairs', label: 'Current Affairs', icon: Flame, count: 20 },
];

const forumPosts = [
    {
        id: 1, title: 'How I cracked Prelims in my 2nd attempt — Complete Strategy',
        body: 'After failing in my 1st attempt, I changed my approach completely. Here\'s what worked: 1) Focus on NCERT first, 2) Solve previous year papers topic-wise, 3) Current affairs from 2 sources only...',
        author: { name: 'Rajesh K.', avatar: '👨‍🎓', badge: 'Prelims Cleared' },
        category: 'strategy', upvotes: 234, replies: 45, views: 1520,
        isPinned: true, createdAt: '2 hours ago',
    },
    {
        id: 2, title: 'Best resources for Indian Economy — Budget 2025-26 analysis',
        body: 'With the Union Budget recently presented, here are the key points for UPSC: fiscal deficit targets, capital expenditure trends, sector-wise allocation changes, and important schemes announced...',
        author: { name: 'Priya S.', avatar: '👩‍💼', badge: null },
        category: 'current_affairs', upvotes: 186, replies: 32, views: 980,
        isPinned: true, createdAt: '5 hours ago',
    },
    {
        id: 3, title: 'PSIR vs Public Admin — Which optional to choose in 2025?',
        body: 'I\'ve been debating between Political Science & IR and Public Administration. My background is in Arts. Looking at the last 5 years\' trends: PSIR has seen more overlap with GS-II...',
        author: { name: 'Arun M.', avatar: '👨‍💻', badge: null },
        category: 'optional', upvotes: 98, replies: 56, views: 780,
        isPinned: false, createdAt: '1 day ago',
    },
    {
        id: 4, title: 'Answer writing practice — GS2 model answers (Week 12)',
        body: 'This week\'s questions: 1) Critically analyze the role of Governor in Indian federal system 2) Examine the impact of 73rd and 74th amendments on grassroots democracy...',
        author: { name: 'Deepa N.', avatar: '👩‍🏫', badge: 'Mentor' },
        category: 'mains', upvotes: 145, replies: 23, views: 650,
        isPinned: false, createdAt: '2 days ago',
    },
    {
        id: 5, title: 'NCERT reading plan — 90 days schedule with daily targets',
        body: 'Here\'s my detailed day-by-day NCERT reading schedule covering all subjects from Class 6 to 12. I\'ve prioritized based on UPSC relevance: History > Polity > Geography > Economy > Science...',
        author: { name: 'Vijay R.', avatar: '👨‍🎓', badge: null },
        category: 'prelims', upvotes: 312, replies: 67, views: 2340,
        isPinned: false, createdAt: '3 days ago',
    },
    {
        id: 6, title: 'How to prepare Geography maps effectively for Prelims',
        body: 'Map-based questions have been increasing in Prelims. Here\'s my method: 1) Use blank map practice daily 2) Focus on rivers, mountain passes, national parks 3) Mark current events on maps...',
        author: { name: 'Kavitha L.', avatar: '👩‍🔬', badge: null },
        category: 'prelims', upvotes: 89, replies: 18, views: 456,
        isPinned: false, createdAt: '4 days ago',
    },
    {
        id: 7, title: 'Essay writing tips — How I scored 145+ in Essay paper',
        body: 'The essay paper can be a game-changer. My approach: 1) Write at least 2 practice essays per week 2) Use the Introduction-Body-Conclusion-Summary structure 3) Include quotes, data, and examples...',
        author: { name: 'Meena G.', avatar: '👩‍🎓', badge: 'Mains Qualified' },
        category: 'mains', upvotes: 267, replies: 41, views: 1890,
        isPinned: false, createdAt: '5 days ago',
    },
    {
        id: 8, title: 'Science & Tech current affairs compilation — Jan 2025',
        body: 'Monthly compilation of important S&T developments: Gaganyaan updates, ISRO launches, AI regulations globally, biotechnology breakthroughs, and space exploration milestones...',
        author: { name: 'Suresh P.', avatar: '👨‍🔬', badge: null },
        category: 'current_affairs', upvotes: 156, replies: 12, views: 890,
        isPinned: false, createdAt: '1 week ago',
    },
];

const topContributors = [
    { name: 'Vijay R.', avatar: '👨‍🎓', posts: 45, upvotes: 1230 },
    { name: 'Deepa N.', avatar: '👩‍🏫', posts: 38, upvotes: 980 },
    { name: 'Rajesh K.', avatar: '👨‍🎓', posts: 32, upvotes: 876 },
    { name: 'Meena G.', avatar: '👩‍🎓', posts: 28, upvotes: 745 },
    { name: 'Priya S.', avatar: '👩‍💼', posts: 25, upvotes: 620 },
];

export default function CommunityPage() {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewPost, setShowNewPost] = useState(false);

    const filteredPosts = forumPosts.filter(post => {
        const matchCategory = activeCategory === 'all' || post.category === activeCategory;
        const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.body.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="hero-bg py-16 lg:py-20">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-900/30" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm mb-6">
                                <Users className="w-4 h-4" />
                                <span>12,400+ aspirants in the community</span>
                            </div>
                        </motion.div>
                        <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                            Aspirant Community
                        </motion.h1>
                        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                            className="text-primary-200 text-lg max-w-2xl mx-auto">
                            Discuss strategies, share resources, and prepare together with fellow UPSC aspirants.
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Search + Actions */}
            <section className="px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 shadow-xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
                                style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text" value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search discussions..."
                                className="input-field !pl-11"
                            />
                        </div>
                        <button onClick={() => setShowNewPost(!showNewPost)}
                            className="btn-accent flex items-center justify-center gap-2 !py-2.5 text-sm whitespace-nowrap">
                            <PlusCircle className="w-4 h-4" />
                            New Post
                        </button>
                    </div>
                </div>
            </section>

            {/* New Post Form */}
            <AnimatePresence>
                {showNewPost && (
                    <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="px-4 sm:px-6 lg:px-8 overflow-hidden">
                        <div className="max-w-7xl mx-auto mt-4">
                            <div className="glass-card p-6 border-2 border-accent-500/30">
                                <h3 className="font-heading font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                                    Create New Post
                                </h3>
                                <div className="space-y-4">
                                    <input type="text" placeholder="Post title..." className="input-field" />
                                    <select className="input-field" defaultValue="">
                                        <option value="" disabled>Select category</option>
                                        <option value="prelims">Prelims</option>
                                        <option value="mains">Mains</option>
                                        <option value="optional">Optional</option>
                                        <option value="strategy">Strategy</option>
                                        <option value="current_affairs">Current Affairs</option>
                                        <option value="general">General</option>
                                    </select>
                                    <textarea placeholder="Write your post..." rows={5} className="input-field resize-none" />
                                    <div className="flex gap-3 justify-end">
                                        <button onClick={() => setShowNewPost(false)}
                                            className="btn-outline text-sm !px-5 !py-2">Cancel</button>
                                        <button className="btn-primary text-sm !px-5 !py-2">Post</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <section className="section-padding">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar - Categories */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-card p-5">
                            <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                                Categories
                            </h3>
                            <div className="space-y-1">
                                {categories.map((cat) => (
                                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${activeCategory === cat.id
                                            ? 'bg-primary-800/10 dark:bg-primary-400/10 font-semibold'
                                            : 'hover:bg-primary-800/5 dark:hover:bg-primary-400/5'
                                            }`}
                                        style={{ color: activeCategory === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                        <cat.icon className="w-4 h-4" />
                                        <span className="flex-1 text-left">{cat.label}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                                            {cat.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Top Contributors */}
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Award className="w-4 h-4 text-amber-500" />
                                <h3 className="font-heading font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                                    Top Contributors
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {topContributors.map((user, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-lg w-8 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : user.avatar}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                                {user.name}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {user.posts} posts · {user.upvotes} upvotes
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Community Stats */}
                        <div className="glass-card p-5">
                            <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
                                Community Stats
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Total Posts', value: '1,560' },
                                    { label: 'Active Members', value: '3,240' },
                                    { label: 'Posts Today', value: '24' },
                                    { label: 'Replies Today', value: '89' },
                                ].map((stat, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Post List */}
                    <div className="lg:col-span-3 space-y-4">
                        {filteredPosts.length === 0 ? (
                            <div className="glass-card p-12 text-center">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                                <p className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    No posts found
                                </p>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                    Try a different search or category
                                </p>
                            </div>
                        ) : (
                            filteredPosts.map((post, i) => (
                                <motion.article key={post.id} custom={i} variants={fadeUp} initial="hidden"
                                    whileInView="visible" viewport={{ once: true }}
                                    className="glass-card p-5 card-hover cursor-pointer group">
                                    <div className="flex items-start gap-4">
                                        {/* Upvote */}
                                        <div className="flex flex-col items-center gap-1 pt-1">
                                            <button className="p-1.5 rounded-lg hover:bg-primary-800/10 dark:hover:bg-primary-400/10 transition-colors"
                                                style={{ color: 'var(--text-muted)' }}>
                                                <ArrowUp className="w-5 h-5" />
                                            </button>
                                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                                {post.upvotes}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Title + Badge */}
                                            <div className="flex items-start gap-2 mb-2">
                                                {post.isPinned && (
                                                    <Pin className="w-4 h-4 text-accent-500 mt-1 flex-shrink-0" />
                                                )}
                                                <h3 className="font-heading font-semibold text-base group-hover:text-accent-500 transition-colors"
                                                    style={{ color: 'var(--text-primary)' }}>
                                                    {post.title}
                                                </h3>
                                            </div>

                                            {/* Preview */}
                                            <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
                                                {post.body}
                                            </p>

                                            {/* Meta */}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{post.author.avatar}</span>
                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {post.author.name}
                                                    </span>
                                                    {post.author.badge && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-500 font-medium">
                                                            {post.author.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                                                    {post.category.replace('_', ' ')}
                                                </span>
                                                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                    <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.replies}</span>
                                                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.views}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.createdAt}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <ChevronRight className="w-5 h-5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent-500" />
                                    </div>
                                </motion.article>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
