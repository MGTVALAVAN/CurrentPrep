'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageProvider';
import {
    Mail, MapPin, Phone, Send, MessageCircle, Clock,
    HelpCircle, BookOpen, ExternalLink, CheckCircle2
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
    }),
};

const faqs = [
    {
        q: 'Is CurrentPrep really free?',
        a: 'Yes! Our core features — NCERT summaries, syllabus hub, current affairs, community forum, and basic AI quizzes — are completely free forever. We have an optional Premium tier with advanced AI tools and mentorship for ₹299/month.',
    },
    {
        q: 'Do I need to create an account to access content?',
        a: 'You can browse the syllabus, blog, and current affairs without an account. To track progress, take quizzes, or participate in the community forum, you\'ll need a free account.',
    },
    {
        q: 'What language options are available?',
        a: 'Currently we support English and Tamil. We\'re working on adding Hindi, Telugu, and Kannada support in the coming months.',
    },
    {
        q: 'Can I access the platform on mobile?',
        a: 'Absolutely! CurrentPrep is a Progressive Web App (PWA). You can install it on your phone directly from the browser for an app-like experience, even with limited offline access.',
    },
    {
        q: 'How is the AI quiz generator different from other platforms?',
        a: 'Our AI generates questions based on specific NCERT chapters and syllabus topics, mimicking the UPSC question pattern. It provides detailed explanations and tracks your weak areas for focused revision.',
    },
    {
        q: 'I found a bug or have a feature suggestion. How do I report it?',
        a: 'Please use the contact form on this page or email us at hello@currentprep.in. We actively review every suggestion and release updates weekly.',
    },
];

export default function ContactPage() {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '', email: '', subject: '', message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div style={{ background: 'var(--bg-primary)' }}>
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="hero-bg py-16 lg:py-20">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-900/30" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={0}
                            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                            Get in Touch
                        </motion.h1>
                        <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={1}
                            className="text-primary-200 text-lg max-w-2xl mx-auto">
                            Have a question, feedback, or collaboration idea? We&apos;d love to hear from you.
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { icon: Mail, label: 'Email Us', value: 'hello@currentprep.in', desc: 'We reply within 24 hours' },
                        { icon: MapPin, label: 'Location', value: 'Chennai, Tamil Nadu', desc: 'India 🇮🇳' },
                        { icon: Clock, label: 'Support Hours', value: 'Mon-Sat, 9am-6pm IST', desc: 'Excluding public holidays' },
                    ].map((item, i) => (
                        <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                            className="glass-card p-5 text-center card-hover shadow-xl">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <item.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-heading font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{item.label}</h3>
                            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Contact Form + FAQ */}
            <section className="section-padding">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Form */}
                    <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                        <div className="flex items-center gap-2 mb-6">
                            <Send className="w-5 h-5 text-accent-500" />
                            <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Send a Message
                            </h2>
                        </div>

                        {submitted ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="font-heading text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                    Message Sent!
                                </h3>
                                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                    Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                                </p>
                                <button onClick={() => setSubmitted(false)}
                                    className="btn-outline text-sm !px-5 !py-2">
                                    Send Another Message
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            Your Name
                                        </label>
                                        <input type="text" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter your name" className="input-field" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                            Email Address
                                        </label>
                                        <input type="email" value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="you@example.com" className="input-field" required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        Subject
                                    </label>
                                    <select value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="input-field" required>
                                        <option value="">Select a subject</option>
                                        <option value="general">General Inquiry</option>
                                        <option value="support">Technical Support</option>
                                        <option value="feedback">Feedback / Suggestion</option>
                                        <option value="partnership">Partnership / Collaboration</option>
                                        <option value="bug">Bug Report</option>
                                        <option value="premium">Premium Plan Questions</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                                        Message
                                    </label>
                                    <textarea value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="How can we help you?" rows={5}
                                        className="input-field resize-none" required />
                                </div>

                                <button type="submit" disabled={isSubmitting}
                                    className="btn-primary flex items-center gap-2 disabled:opacity-60">
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>

                    {/* FAQ */}
                    <motion.div custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                        <div className="flex items-center gap-2 mb-6">
                            <HelpCircle className="w-5 h-5 text-primary-500" />
                            <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Frequently Asked Questions
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {faqs.map((faq, i) => (
                                <div key={i} className="glass-card overflow-hidden transition-all duration-200">
                                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between p-4 text-left">
                                        <span className="font-medium text-sm pr-4" style={{ color: 'var(--text-primary)' }}>
                                            {faq.q}
                                        </span>
                                        <motion.span
                                            animate={{ rotate: openFaq === i ? 45 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-accent-500 flex-shrink-0 text-xl font-light">
                                            +
                                        </motion.span>
                                    </button>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="px-4 pb-4">
                                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
