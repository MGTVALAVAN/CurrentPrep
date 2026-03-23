import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'CurrentPrep privacy policy — how we collect, use, and protect your data.',
};

export default function PrivacyPolicyPage() {
    const lastUpdated = 'March 23, 2026';

    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
            <main id="main-content" className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Privacy Policy
                </h1>
                <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
                    Last updated: {lastUpdated}
                </p>

                <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            1. Information We Collect
                        </h2>
                        <p className="mb-3">When you use CurrentPrep, we may collect the following information:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, and password (hashed) when you register.</li>
                            <li><strong>Usage Data:</strong> Pages visited, quiz attempts, mock test scores, and study progress.</li>
                            <li><strong>Payment Information:</strong> Transaction IDs and plan details processed through Razorpay. We do not store your card or UPI details.</li>
                            <li><strong>Device Information:</strong> Browser type, operating system, and device type for analytics.</li>
                            <li><strong>Contact Information:</strong> Name, email, and message content when you use the contact form.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            2. How We Use Your Information
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To provide and improve our UPSC preparation services.</li>
                            <li>To personalize your study experience with AI-generated content.</li>
                            <li>To process payments and manage your subscription.</li>
                            <li>To send important service updates and notifications.</li>
                            <li>To respond to your queries and support requests.</li>
                            <li>To monitor and improve platform security.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            3. Data Storage &amp; Security
                        </h2>
                        <p className="mb-3">
                            Your data is stored securely using Supabase (hosted on AWS infrastructure).
                            We implement industry-standard security measures including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Password hashing using bcrypt with salting.</li>
                            <li>HTTPS encryption for all data in transit.</li>
                            <li>Row-Level Security (RLS) on our database.</li>
                            <li>Rate limiting on sensitive endpoints.</li>
                            <li>Input sanitization to prevent XSS and injection attacks.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            4. Third-Party Services
                        </h2>
                        <p className="mb-3">We use the following third-party services:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Supabase:</strong> Database and authentication infrastructure.</li>
                            <li><strong>Google Gemini AI:</strong> Content generation for quizzes and explainers.</li>
                            <li><strong>Razorpay:</strong> Payment processing (PCI-DSS compliant).</li>
                            <li><strong>Vercel:</strong> Application hosting and CDN.</li>
                            <li><strong>Google OAuth:</strong> Optional social login.</li>
                        </ul>
                        <p className="mt-3">
                            Each service has its own privacy policy. We recommend reviewing them for a complete understanding.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            5. Cookies &amp; Local Storage
                        </h2>
                        <p>
                            We use essential cookies for authentication (session tokens) and local storage for
                            theme preference and language settings. We do not use tracking cookies or
                            third-party advertising cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            6. Your Rights
                        </h2>
                        <p className="mb-3">You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Access and download your personal data.</li>
                            <li>Request correction of inaccurate data.</li>
                            <li>Request deletion of your account and associated data.</li>
                            <li>Opt out of non-essential communications.</li>
                            <li>Withdraw consent for data processing at any time.</li>
                        </ul>
                        <p className="mt-3">
                            To exercise any of these rights, contact us at{' '}
                            <a href="mailto:support@currentprep.in" style={{ color: 'var(--accent-500, #f59e0b)' }}>
                                support@currentprep.in
                            </a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            7. Data Retention
                        </h2>
                        <p>
                            We retain your account data for as long as your account is active.
                            Upon account deletion, personal data is removed within 30 days.
                            Anonymized usage analytics may be retained for service improvement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            8. Children&apos;s Privacy
                        </h2>
                        <p>
                            CurrentPrep is intended for users aged 16 and above. We do not knowingly
                            collect data from children under 16. If you believe a child has provided us
                            with personal information, please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            9. Changes to This Policy
                        </h2>
                        <p>
                            We may update this privacy policy from time to time. Significant changes will
                            be communicated via email or a prominent notice on the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-heading font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                            10. Contact Us
                        </h2>
                        <p>
                            If you have any questions about this privacy policy, please contact us at:{' '}
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
