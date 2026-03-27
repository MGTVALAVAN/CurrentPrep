'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, Gift, MessageCircle, ChevronRight, ChevronLeft,
    Globe, BookOpen, Newspaper, Target, BarChart3, IndianRupee,
    Lightbulb, CheckCircle2, Sparkles, Flame, Users,
    Clock, Layout, Smartphone, Palette, Search, Zap,
    FileText, TrendingUp, Heart, AlertCircle, 
} from 'lucide-react';
import Link from 'next/link';

// ── GA4 Tracking ───────────────────────────────────────────────────────

function trackEvent(event: string, params: Record<string, any> = {}) {
    if (typeof window !== 'undefined') {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({ event, ...params });
    }
}

// ── Types ──────────────────────────────────────────────────────────────

interface SectionData {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
}

const SECTIONS: SectionData[] = [
    { id: 'website', title: 'Website Experience', subtitle: 'UI, navigation & overall feel', icon: <Globe className="w-5 h-5" />, color: 'from-blue-500 to-indigo-600' },
    { id: 'current-affairs', title: 'Current Affairs', subtitle: 'Daily ePaper & news coverage', icon: <Newspaper className="w-5 h-5" />, color: 'from-emerald-500 to-teal-600' },
    { id: 'content', title: 'Content Quality', subtitle: 'Questions, solutions & explanations', icon: <BookOpen className="w-5 h-5" />, color: 'from-violet-500 to-purple-600' },
    { id: 'daily-mocks', title: 'Daily Mocks', subtitle: 'Daily practice tests', icon: <Clock className="w-5 h-5" />, color: 'from-amber-500 to-orange-600' },
    { id: 'practice-mocks', title: 'Practice Mock Tests', subtitle: 'Custom & full-length mocks', icon: <Target className="w-5 h-5" />, color: 'from-rose-500 to-pink-600' },
    { id: 'pricing', title: 'Pricing & Value', subtitle: 'Plans, packs & value for money', icon: <IndianRupee className="w-5 h-5" />, color: 'from-cyan-500 to-blue-600' },
    { id: 'suggestions', title: 'Suggestions', subtitle: 'Your ideas for improvement', icon: <Lightbulb className="w-5 h-5" />, color: 'from-yellow-500 to-amber-600' },
];

// ── Star Rating Component ──────────────────────────────────────────────

function StarRating({
    rating,
    onRate,
    label,
}: {
    rating: number;
    onRate: (v: number) => void;
    label: string;
}) {
    const [hover, setHover] = useState(0);
    const labels = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

    return (
        <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                {label} <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => onRate(star)}
                        className="p-0.5 transition-transform hover:scale-125"
                    >
                        <Star
                            className={`w-6 h-6 transition-colors ${
                                star <= (hover || rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                            }`}
                        />
                    </button>
                ))}
                {(hover || rating) > 0 && (
                    <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-600 dark:text-yellow-400">
                        {labels[hover || rating]}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── NPS Scale Component ────────────────────────────────────────────────

function NPSScale({
    value,
    onChange,
    label,
}: {
    value: number;
    onChange: (v: number) => void;
    label: string;
}) {
    return (
        <div>
            <label className="text-sm font-medium mb-3 block" style={{ color: 'var(--text-primary)' }}>
                {label} <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-1 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                            value === n
                                ? n <= 6
                                    ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30'
                                    : n <= 8
                                    ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/30'
                                    : 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30'
                                : 'hover:border-primary-400'
                        }`}
                        style={value !== n ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : {}}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <div className="flex justify-between mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Not at all likely</span>
                <span>Extremely likely</span>
            </div>
        </div>
    );
}

// ── Multi-Select Chip Component ────────────────────────────────────────

function ChipSelect({
    options,
    selected,
    onChange,
    label,
    multiple = true,
}: {
    options: string[];
    selected: string[];
    onChange: (v: string[]) => void;
    label: string;
    multiple?: boolean;
}) {
    const toggle = (opt: string) => {
        if (multiple) {
            onChange(
                selected.includes(opt)
                    ? selected.filter((s) => s !== opt)
                    : [...selected, opt]
            );
        } else {
            onChange([opt]);
        }
    };

    return (
        <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                {label} {multiple && <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(select all that apply)</span>}
            </label>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => toggle(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                            selected.includes(opt)
                                ? 'bg-primary-600/10 border-primary-500/40 text-primary-700 dark:text-primary-300'
                                : ''
                        }`}
                        style={
                            !selected.includes(opt)
                                ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                                : {}
                        }
                    >
                        {selected.includes(opt) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  SECTION FORMS
// ═══════════════════════════════════════════════════════════════════════

function WebsiteSection({ data, setData }: { data: any; setData: (d: any) => void }) {
    return (
        <div className="space-y-5">
            <StarRating
                rating={data.overallRating || 0}
                onRate={(v) => setData({ ...data, overallRating: v })}
                label="Overall website experience"
            />
            <StarRating
                rating={data.designRating || 0}
                onRate={(v) => setData({ ...data, designRating: v })}
                label="Visual design & aesthetics"
            />
            <StarRating
                rating={data.navigationRating || 0}
                onRate={(v) => setData({ ...data, navigationRating: v })}
                label="Navigation & ease of finding things"
            />
            <StarRating
                rating={data.speedRating || 0}
                onRate={(v) => setData({ ...data, speedRating: v })}
                label="Loading speed & performance"
            />
            <StarRating
                rating={data.mobileRating || 0}
                onRate={(v) => setData({ ...data, mobileRating: v })}
                label="Mobile responsiveness"
            />

            <ChipSelect
                label="Which device do you primarily use?"
                options={['Mobile Phone', 'Laptop/Desktop', 'Tablet', 'Multiple Devices']}
                selected={data.primaryDevice || []}
                onChange={(v) => setData({ ...data, primaryDevice: v })}
                multiple={false}
            />

            <ChipSelect
                label="Which features do you find most useful?"
                options={[
                    'Current Affairs', 'Daily Mocks', 'Practice Mock Tests',
                    'ePaper PDF', 'Syllabus Tracker', 'Analytics Dashboard',
                    'Dark Mode', 'Question Solutions',
                ]}
                selected={data.usefulFeatures || []}
                onChange={(v) => setData({ ...data, usefulFeatures: v })}
            />

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    Any specific UI issues or broken pages you noticed?
                </label>
                <textarea
                    value={data.uiIssues || ''}
                    onChange={(e) => setData({ ...data, uiIssues: e.target.value })}
                    placeholder="e.g., The sidebar overlaps on mobile, the login page doesn't load..."
                    rows={3}
                    className="input-field text-sm resize-none"
                />
            </div>
        </div>
    );
}

function CurrentAffairsSection({ data, setData }: { data: any; setData: (d: any) => void }) {
    return (
        <div className="space-y-5">
            <StarRating
                rating={data.overallRating || 0}
                onRate={(v) => setData({ ...data, overallRating: v })}
                label="Overall current affairs quality"
            />
            <StarRating
                rating={data.relevanceRating || 0}
                onRate={(v) => setData({ ...data, relevanceRating: v })}
                label="Relevance to UPSC syllabus"
            />
            <StarRating
                rating={data.coverageRating || 0}
                onRate={(v) => setData({ ...data, coverageRating: v })}
                label="Breadth of topic coverage"
            />
            <StarRating
                rating={data.explanationRating || 0}
                onRate={(v) => setData({ ...data, explanationRating: v })}
                label="Quality of explanations & analysis"
            />
            <StarRating
                rating={data.timelinessRating || 0}
                onRate={(v) => setData({ ...data, timelinessRating: v })}
                label="Timeliness — how quickly updates arrive"
            />

            <ChipSelect
                label="How often do you read the daily ePaper?"
                options={['Every day', '3-5 times/week', '1-2 times/week', 'Rarely', 'Never tried']}
                selected={data.epaperFrequency || []}
                onChange={(v) => setData({ ...data, epaperFrequency: v })}
                multiple={false}
            />

            <ChipSelect
                label="Which ePaper sections do you value most?"
                options={[
                    'GS Paper 1', 'GS Paper 2', 'GS Paper 3', 'GS Paper 4',
                    'Prelims Mock Questions', 'Mains Mock Answers',
                    'Quote of the Day', 'On This Day', 'Data Snapshot',
                ]}
                selected={data.valuedSections || []}
                onChange={(v) => setData({ ...data, valuedSections: v })}
            />

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    Any topics you wish were covered but aren&apos;t?
                </label>
                <textarea
                    value={data.missingTopics || ''}
                    onChange={(e) => setData({ ...data, missingTopics: e.target.value })}
                    placeholder="e.g., More focus on international relations, detailed maps for geography topics..."
                    rows={3}
                    className="input-field text-sm resize-none"
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    Do you prefer the web version or PDF? Why?
                </label>
                <textarea
                    value={data.formatPreference || ''}
                    onChange={(e) => setData({ ...data, formatPreference: e.target.value })}
                    placeholder="e.g., I prefer PDF because I print it out for revision..."
                    rows={2}
                    className="input-field text-sm resize-none"
                />
            </div>
        </div>
    );
}

function ContentSection({ data, setData }: { data: any; setData: (d: any) => void }) {
    return (
        <div className="space-y-5">
            <StarRating
                rating={data.questionQuality || 0}
                onRate={(v) => setData({ ...data, questionQuality: v })}
                label="Quality of questions (realistic UPSC standard)"
            />
            <StarRating
                rating={data.solutionQuality || 0}
                onRate={(v) => setData({ ...data, solutionQuality: v })}
                label="Quality of answer explanations"
            />
            <StarRating
                rating={data.difficultyCalibration || 0}
                onRate={(v) => setData({ ...data, difficultyCalibration: v })}
                label="Difficulty level accuracy (Easy/Medium/Hard)"
            />
            <StarRating
                rating={data.subjectCoverage || 0}
                onRate={(v) => setData({ ...data, subjectCoverage: v })}
                label="Coverage across all GS subjects"
            />
            <StarRating
                rating={data.csatQuality || 0}
                onRate={(v) => setData({ ...data, csatQuality: v })}
                label="CSAT (Paper II) content quality"
            />

            <ChipSelect
                label="Have you found any errors in questions/answers?"
                options={['No errors found', 'Minor typos', 'Some wrong answers', 'Frequent errors']}
                selected={data.errorFrequency || []}
                onChange={(v) => setData({ ...data, errorFrequency: v })}
                multiple={false}
            />

            <ChipSelect
                label="Which subjects need more questions?"
                options={[
                    'History', 'Geography', 'Polity', 'Economy',
                    'Science & Tech', 'Environment', 'Current Affairs',
                    'Ethics', 'CSAT Maths', 'CSAT Reasoning', 'CSAT Comprehension',
                ]}
                selected={data.needMoreQuestions || []}
                onChange={(v) => setData({ ...data, needMoreQuestions: v })}
            />

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    How does our content compare to other platforms you&apos;ve used?
                </label>
                <textarea
                    value={data.comparison || ''}
                    onChange={(e) => setData({ ...data, comparison: e.target.value })}
                    placeholder="e.g., Better than Vision IAS for Polity, but InstaLinks has better maps..."
                    rows={3}
                    className="input-field text-sm resize-none"
                />
            </div>
        </div>
    );
}

function DailyMocksSection({ data, setData }: { data: any; setData: (d: any) => void }) {
    return (
        <div className="space-y-5">
            <StarRating
                rating={data.overallRating || 0}
                onRate={(v) => setData({ ...data, overallRating: v })}
                label="Overall daily mock experience"
            />
            <StarRating
                rating={data.questionRelevance || 0}
                onRate={(v) => setData({ ...data, questionRelevance: v })}
                label="Relevance of daily questions to recent news"
            />
            <StarRating
                rating={data.explanationClarity || 0}
                onRate={(v) => setData({ ...data, explanationClarity: v })}
                label="Clarity of explanations after the test"
            />
            <StarRating
                rating={data.difficultyLevel || 0}
                onRate={(v) => setData({ ...data, difficultyLevel: v })}
                label="Difficulty level appropriateness"
            />

            <ChipSelect
                label="How often do you take the daily mock?"
                options={['Every day', '3-5 times/week', '1-2 times/week', 'Occasionally', 'Never tried']}
                selected={data.frequency || []}
                onChange={(v) => setData({ ...data, frequency: v })}
                multiple={false}
            />

            <ChipSelect
                label="What time do you usually take it?"
                options={['Morning (6-9 AM)', 'Forenoon (9-12 PM)', 'Afternoon (12-3 PM)', 'Evening (3-6 PM)', 'Night (6 PM+)']}
                selected={data.preferredTime || []}
                onChange={(v) => setData({ ...data, preferredTime: v })}
                multiple={false}
            />

            <ChipSelect
                label="Preferred number of daily questions"
                options={['5 questions', '10 questions', '15 questions', '20 questions']}
                selected={data.preferredCount || []}
                onChange={(v) => setData({ ...data, preferredCount: v })}
                multiple={false}
            />

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    Any specific feedback on daily mocks?
                </label>
                <textarea
                    value={data.feedback || ''}
                    onChange={(e) => setData({ ...data, feedback: e.target.value })}
                    placeholder="e.g., Would love a leaderboard, the timer is too stressful, add topic-wise breakdown..."
                    rows={3}
                    className="input-field text-sm resize-none"
                />
            </div>
        </div>
    );
}

function PracticeMocksSection({ data, setData }: { data: any; setData: (d: any) => void }) {
    return (
        <div className="space-y-5">
            <StarRating
                rating={data.overallRating || 0}
                onRate={(v) => setData({ ...data, overallRating: v })}
                label="Overall practice mock test experience"
            />
            <StarRating
                rating={data.examInterface || 0}
                onRate={(v) => setData({ ...data, examInterface: v })}
                label="Exam interface (timer, palette, navigation)"
            />
            <StarRating
                rating={data.customization || 0}
                onRate={(v) => setData({ ...data, customization: v })}
                label="Customization options (subjects, difficulty, length)"
            />
            <StarRating
                rating={data.resultAnalysis || 0}
                onRate={(v) => setData({ ...data, resultAnalysis: v })}
                label="Results & performance analytics"
            />
            <StarRating
                rating={data.realisticFeel || 0}
                onRate={(v) => setData({ ...data, realisticFeel: v })}
                label="How realistic compared to actual UPSC exam"
            />

            <ChipSelect
                label="Which test lengths do you prefer?"
                options={['10 Questions', '25 Questions', '50 Questions', '100 Questions', 'Full Length (200)']}
                selected={data.preferredLengths || []}
                onChange={(v) => setData({ ...data, preferredLengths: v })}
            />

            <ChipSelect
                label="What features would you like added?"
                options={[
                    'Leaderboard', 'Peer Comparison', 'Section-wise Timing',
                    'Review Bookmarks', 'Previous Year Questions',
                    'Mains Answer Writing', 'Detailed Analytics Graph',
                    'Weakness Reports', 'Revision Sheets',
                ]}
                selected={data.wantedFeatures || []}
                onChange={(v) => setData({ ...data, wantedFeatures: v })}
            />

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    How does the exam interface compare to other test series you&apos;ve used?
                </label>
                <textarea
                    value={data.interfaceFeedback || ''}
                    onChange={(e) => setData({ ...data, interfaceFeedback: e.target.value })}
                    placeholder="e.g., The question palette is cleaner than Testbook, but needs a section filter..."
                    rows={3}
                    className="input-field text-sm resize-none"
                />
            </div>
        </div>
    );
}

function PricingSection({ data, setData }: { data: any; setData: (d: any) => void }) {
    return (
        <div className="space-y-5">
            <StarRating
                rating={data.valueForMoney || 0}
                onRate={(v) => setData({ ...data, valueForMoney: v })}
                label="Value for money overall"
            />
            <StarRating
                rating={data.pricingClarity || 0}
                onRate={(v) => setData({ ...data, pricingClarity: v })}
                label="Clarity of pricing page & plans"
            />
            <StarRating
                rating={data.planOptions || 0}
                onRate={(v) => setData({ ...data, planOptions: v })}
                label="Variety of plan options (single, pack, pro)"
            />

            <ChipSelect
                label="Which plan interests you most?"
                options={['Single Test', 'Test Pack (5/15)', 'Pro Monthly', 'Pro Yearly', 'Free Tier Only']}
                selected={data.interestedPlan || []}
                onChange={(v) => setData({ ...data, interestedPlan: v })}
                multiple={false}
            />

            <ChipSelect
                label="What would make you pay for a premium plan?"
                options={[
                    'Lower Price', 'More Test Variety', 'Mains Answer Writing',
                    'Peer Comparison', 'Expert Video Solutions',
                    'Personal Mentor', 'Offline Access', 'Study Material Included',
                ]}
                selected={data.payMotivation || []}
                onChange={(v) => setData({ ...data, payMotivation: v })}
            />

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    How much are you willing to pay monthly for this kind of platform?
                </label>
                <div className="flex flex-wrap gap-2">
                    {['Free only', '₹99-199', '₹200-399', '₹400-599', '₹600+'].map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => setData({ ...data, budgetRange: opt })}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                                data.budgetRange === opt
                                    ? 'bg-green-500/10 border-green-500/40 text-green-600 dark:text-green-400'
                                    : ''
                            }`}
                            style={
                                data.budgetRange !== opt
                                    ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                                    : {}
                            }
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    How does our pricing compare to competitors?
                </label>
                <div className="flex flex-wrap gap-2">
                    {['Much Cheaper', 'Slightly Cheaper', 'About the Same', 'Slightly Expensive', 'Too Expensive'].map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => setData({ ...data, priceComparison: opt })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                                data.priceComparison === opt
                                    ? 'bg-primary-600/10 border-primary-500/40 text-primary-700 dark:text-primary-300'
                                    : ''
                            }`}
                            style={
                                data.priceComparison !== opt
                                    ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                                    : {}
                            }
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    Any thoughts on our pricing structure?
                </label>
                <textarea
                    value={data.pricingFeedback || ''}
                    onChange={(e) => setData({ ...data, pricingFeedback: e.target.value })}
                    placeholder="e.g., Would love a quarterly plan, or a special price for working professionals..."
                    rows={3}
                    className="input-field text-sm resize-none"
                />
            </div>
        </div>
    );
}

function SuggestionsSection({ data, setData }: { data: any; setData: (d: any) => void }) {
    return (
        <div className="space-y-5">
            <NPSScale
                value={data.nps ?? -1}
                onChange={(v) => setData({ ...data, nps: v })}
                label="How likely are you to recommend CurrentPrep to a friend? (0-10)"
            />

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    What is the #1 thing you love about CurrentPrep? <span className="text-red-400">*</span>
                </label>
                <textarea
                    value={data.bestThing || ''}
                    onChange={(e) => setData({ ...data, bestThing: e.target.value })}
                    placeholder="Tell us what keeps you coming back..."
                    rows={3}
                    className="input-field text-sm resize-none"
                    required
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    What is the #1 thing you&apos;d change? <span className="text-red-400">*</span>
                </label>
                <textarea
                    value={data.worstThing || ''}
                    onChange={(e) => setData({ ...data, worstThing: e.target.value })}
                    placeholder="Be brutally honest — your feedback directly shapes our roadmap..."
                    rows={3}
                    className="input-field text-sm resize-none"
                    required
                />
            </div>

            <ChipSelect
                label="What new features would you love to see?"
                options={[
                    'Discussion Forum', 'Video Explanations', 'Mains Answer Writing Practice',
                    'AI-Powered Study Plan', 'Mentor Connect', 'Study Groups',
                    'Optional Subject Coverage', 'Interview Guidance',
                    'Offline App', 'WhatsApp Daily Updates',
                    'Monthly Magazine', 'One-liners Compilation',
                ]}
                selected={data.wantedFeatures || []}
                onChange={(v) => setData({ ...data, wantedFeatures: v })}
            />

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    Which other platforms do you currently use for UPSC prep?
                </label>
                <textarea
                    value={data.otherPlatforms || ''}
                    onChange={(e) => setData({ ...data, otherPlatforms: e.target.value })}
                    placeholder="e.g., Unacademy, Vision IAS, Testbook, InsightsonIndia..."
                    rows={2}
                    className="input-field text-sm resize-none"
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    Any other suggestions or comments?
                </label>
                <textarea
                    value={data.otherComments || ''}
                    onChange={(e) => setData({ ...data, otherComments: e.target.value })}
                    placeholder="Anything else on your mind — we read every single response..."
                    rows={4}
                    className="input-field text-sm resize-none"
                />
            </div>

            <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-primary)' }}>
                    Your UPSC attempt year (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                    {['2026', '2027', '2028', '2029', 'Not decided'].map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => setData({ ...data, attemptYear: opt })}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                                data.attemptYear === opt
                                    ? 'bg-primary-600/10 border-primary-500/40 text-primary-700 dark:text-primary-300'
                                    : ''
                            }`}
                            style={
                                data.attemptYear !== opt
                                    ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
                                    : {}
                            }
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN FEEDBACK PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function FeedbackPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>({
        website: {},
        'current-affairs': {},
        content: {},
        'daily-mocks': {},
        'practice-mocks': {},
        pricing: {},
        suggestions: {},
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const currentSection = SECTIONS[currentStep];
    const progress = ((currentStep + 1) / SECTIONS.length) * 100;

    const updateSectionData = (sectionId: string, data: any) => {
        setFormData((prev) => ({ ...prev, [sectionId]: data }));
    };

    const handleNext = () => {
        if (currentStep < SECTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async () => {
        setError('');

        // Validate suggestions section (required fields)
        const suggestions = formData.suggestions;
        if (!suggestions.nps && suggestions.nps !== 0) {
            setError('Please select an NPS rating in the Suggestions section.');
            return;
        }
        if (!suggestions.bestThing || suggestions.bestThing.trim().length < 10) {
            setError('Please tell us what you love about CurrentPrep (at least 10 characters).');
            return;
        }
        if (!suggestions.worstThing || suggestions.worstThing.trim().length < 10) {
            setError('Please tell us what you\'d change (at least 10 characters).');
            return;
        }

        setIsSubmitting(true);
        trackEvent('feedback_form_submit_start');

        try {
            const res = await fetch('/api/early-access/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedbackType: 'detailed_form',
                    feedbackRating: formData.website.overallRating || 0,
                    feedbackWhatYouLike: suggestions.bestThing,
                    feedbackWhatToImprove: suggestions.worstThing,
                    feedbackWouldRecommend: (suggestions.nps ?? 0) >= 7,
                    detailedFeedback: formData,
                }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setIsSubmitted(true);
                trackEvent('feedback_form_submitted', { slot: data.slotNumber });
            } else {
                setError(data.error || 'Something went wrong. Please try again.');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSection = () => {
        const sectionId = currentSection.id;
        const data = formData[sectionId];
        const setData = (d: any) => updateSectionData(sectionId, d);

        switch (sectionId) {
            case 'website': return <WebsiteSection data={data} setData={setData} />;
            case 'current-affairs': return <CurrentAffairsSection data={data} setData={setData} />;
            case 'content': return <ContentSection data={data} setData={setData} />;
            case 'daily-mocks': return <DailyMocksSection data={data} setData={setData} />;
            case 'practice-mocks': return <PracticeMocksSection data={data} setData={setData} />;
            case 'pricing': return <PricingSection data={data} setData={setData} />;
            case 'suggestions': return <SuggestionsSection data={data} setData={setData} />;
            default: return null;
        }
    };

    // ── Success State ──────────────────────────────────────────────────
    if (isSubmitted) {
        return (
            <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-lg w-full text-center"
                >
                    <div
                        className="rounded-2xl border p-8 sm:p-10"
                        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                            🎉 Thank You!
                        </h1>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Your detailed feedback has been submitted successfully.
                        </p>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            Your <span className="font-bold text-green-600 dark:text-green-400">1 Year of Pro access</span> has been activated.
                            Every response helps us build a better platform for all UPSC aspirants.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/mock-tests"
                                className="btn-gold text-sm inline-flex items-center justify-center"
                            >
                                <Zap className="w-4 h-4" /> Start Unlimited Tests
                            </Link>
                            <Link
                                href="/pricing"
                                className="btn-outline text-sm inline-flex items-center justify-center"
                            >
                                View Your Plan
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-primary)' }} className="min-h-screen">

            {/* ═══════════════════════════════════════════════
                 HERO
                ═══════════════════════════════════════════════ */}
            <section className="hero-bg relative overflow-hidden py-16 lg:py-20">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-green-400/10 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm text-green-200 mb-6 urgency-badge"
                    >
                        <Flame className="w-4 h-4 text-green-400" />
                        <span>First 250 Users — Free Pro Access for 1 Year</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.7 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white leading-tight mb-4"
                    >
                        Share Your Feedback,{' '}
                        <span className="gold-text">Get Pro Free</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-base sm:text-lg text-blue-100/90 max-w-2xl mx-auto mb-6 leading-relaxed"
                    >
                        Take 5 minutes to help us improve. In return, get{' '}
                        <span className="font-semibold text-white">12 months of unlimited Pro access</span> — worth ₹3,999 — absolutely free.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center justify-center gap-6 text-blue-200/80 text-sm"
                    >
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> ~5 min
                        </span>
                        <span className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" /> 7 sections
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Gift className="w-4 h-4" /> Free Pro
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════
                 FORM BODY
                ═══════════════════════════════════════════════ */}
            <section className="section-padding">
                <div className="max-w-4xl mx-auto">

                    {/* Section Navigator — Desktop */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="hidden lg:block mb-8"
                    >
                        <div className="flex items-center justify-between gap-1">
                            {SECTIONS.map((section, i) => (
                                <button
                                    key={section.id}
                                    onClick={() => { setCurrentStep(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-300 border ${
                                        i === currentStep
                                            ? 'border-primary-500/30 shadow-lg'
                                            : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                    }`}
                                    style={
                                        i === currentStep
                                            ? { background: 'var(--bg-card)' }
                                            : {}
                                    }
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white bg-gradient-to-br ${
                                        i === currentStep ? section.color : 'from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
                                    } transition-all duration-300`}>
                                        {i < currentStep ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                        ) : (
                                            <span className="text-xs font-bold">{i + 1}</span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-[10px] font-medium text-center leading-tight ${
                                            i === currentStep ? '' : ''
                                        }`}
                                        style={{ color: i === currentStep ? 'var(--text-primary)' : 'var(--text-muted)' }}
                                    >
                                        {section.title}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Mobile Step Indicator */}
                    <div className="lg:hidden mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Step {currentStep + 1} of {SECTIONS.length}
                            </span>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                {Math.round(progress)}% complete
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                            <motion.div
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                            />
                        </div>
                    </div>

                    {/* Progress Bar — Desktop */}
                    <div className="hidden lg:block mb-8">
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                            <motion.div
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500"
                            />
                        </div>
                    </div>

                    {/* Section Card */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSection.id}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div
                                className="rounded-2xl border overflow-hidden"
                                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                            >
                                {/* Section Header */}
                                <div className={`bg-gradient-to-r ${currentSection.color} p-5 sm:p-6`}>
                                    <div className="flex items-center gap-3 text-white">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            {currentSection.icon}
                                        </div>
                                        <div>
                                            <h2 className="font-heading font-bold text-lg sm:text-xl">
                                                {currentSection.title}
                                            </h2>
                                            <p className="text-sm text-white/80">
                                                {currentSection.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section Body */}
                                <div className="p-5 sm:p-8">
                                    {renderSection()}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800/30"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-6 flex items-center justify-between gap-4">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                                currentStep === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md'
                            }`}
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>

                        {currentStep < SECTIONS.length - 1 ? (
                            <button
                                onClick={handleNext}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                Next: {SECTIONS[currentStep + 1].title} <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="btn-gold text-sm"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Gift className="w-4 h-4" />
                                        Submit & Claim Free Pro
                                    </span>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Info Note */}
                    <div className="mt-8 text-center">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            You must be signed in to submit. • One submission per user. • All fields with <span className="text-red-400">*</span> are required.
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            Your feedback is anonymous and will only be used to improve CurrentPrep.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
