import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'CurrentPrep terms of service — rules and guidelines for using our UPSC preparation platform.',
};

export default function TermsOfServicePage() {
    const lastUpdated = 'March 23, 2026';

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
            <main id="main-content" className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Terms of Service
                </h1>
                <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
                    Last updated: {lastUpdated}
                </p>

                <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By accessing or using CurrentPrep (&ldquo;the Platform&rdquo;), you agree to be bound by these
                            Terms of Service. If you do not agree with any part of these terms, you may not
                            use the Platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            2. Description of Service
                        </h2>
                        <p>
                            CurrentPrep is a UPSC Civil Services Examination preparation platform that provides:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li>AI-generated daily current affairs ePapers.</li>
                            <li>AI-powered quiz and mock test generation.</li>
                            <li>UPSC syllabus resources and study materials.</li>
                            <li>Community forum for aspirants.</li>
                            <li>Performance analytics and study tracking.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            3. User Accounts
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>You must provide accurate and complete information when creating an account.</li>
                            <li>You are responsible for maintaining the confidentiality of your credentials.</li>
                            <li>You must be at least 16 years old to create an account.</li>
                            <li>One person may not maintain more than one account.</li>
                            <li>You must notify us immediately of any unauthorized use of your account.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            4. Free &amp; Premium Plans
                        </h2>
                        <p className="mb-3">
                            CurrentPrep offers both free and premium (Pro) tiers:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Free Tier:</strong> Access to daily current affairs, syllabus hub, limited AI quizzes (5/day), and read-only forum access.</li>
                            <li><strong>Pro Tier:</strong> Unlimited quizzes, daily ePaper with explainers, mock tests, custom mock builder, full forum access, bookmarks, and AI answer evaluation.</li>
                        </ul>
                        <p className="mt-3">
                            We reserve the right to modify features available in each tier with reasonable notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            5. Payment &amp; Refund Policy
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Payments are processed securely through Razorpay.</li>
                            <li>Pro plans are available as monthly (₹299), quarterly (₹799), or annual (₹2,499) subscriptions.</li>
                            <li>All prices are in Indian Rupees (INR) and inclusive of applicable taxes.</li>
                            <li>Refunds are available within 7 days of purchase if you have not accessed premium content.</li>
                            <li>For refund requests, contact{' '}
                                <a href="mailto:support@currentprep.in" style={{ color: 'var(--accent-500, #f59e0b)' }}>
                                    support@currentprep.in
                                </a>.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            6. AI-Generated Content
                        </h2>
                        <p className="mb-3">
                            CurrentPrep uses Google Gemini AI to generate educational content including
                            ePaper explainers, quiz questions, and mock tests. Please note:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>AI-generated content is for educational purposes only and may contain inaccuracies.</li>
                            <li>We make reasonable efforts to ensure accuracy but cannot guarantee it.</li>
                            <li>Content should be used as supplementary study material, not as the sole source.</li>
                            <li>Source articles are attributed and linked where available.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            7. Acceptable Use
                        </h2>
                        <p className="mb-3">You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Use the Platform for any unlawful purpose.</li>
                            <li>Scrape, copy, or redistribute content without permission.</li>
                            <li>Attempt to gain unauthorized access to other users&apos; accounts.</li>
                            <li>Post offensive, harmful, or misleading content in the forum.</li>
                            <li>Use automated tools to access the Platform at scale.</li>
                            <li>Reverse-engineer or decompile any part of the Platform.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            8. Intellectual Property
                        </h2>
                        <p>
                            All content on CurrentPrep, including but not limited to text, graphics, logos,
                            AI-generated materials, and software, is the property of CurrentPrep or its
                            licensors. You may use the content for personal, non-commercial study purposes only.
                            Redistribution, reproduction, or commercial use requires written permission.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            9. Limitation of Liability
                        </h2>
                        <p>
                            CurrentPrep is provided &ldquo;as is&rdquo; without warranties of any kind.
                            We are not liable for any indirect, incidental, or consequential damages
                            arising from your use of the Platform. Our total liability is limited to
                            the amount paid by you for the service in the preceding 12 months.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            10. Account Termination
                        </h2>
                        <p>
                            We reserve the right to suspend or terminate your account if you violate
                            these terms. You may delete your account at any time by contacting support.
                            Upon termination, your access to premium features will cease immediately,
                            and your data will be handled per our Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            11. Governing Law
                        </h2>
                        <p>
                            These terms are governed by the laws of India. Any disputes arising
                            from these terms shall be subject to the exclusive jurisdiction of
                            the courts in Chennai, Tamil Nadu.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            12. Contact Us
                        </h2>
                        <p>
                            For any questions regarding these terms, contact us at:{' '}
                            <a href="mailto:support@currentprep.in" style={{ color: 'var(--accent-500, #f59e0b)' }}>
                                support@currentprep.in
                            </a>
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
