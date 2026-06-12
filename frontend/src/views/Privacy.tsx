'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';

const Section = ({ title, children }: any) => (
    <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '14px', color: 'var(--foreground)', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            {title}
        </h2>
        <div style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem', lineHeight: 1.85 }}>
            {children}
        </div>
    </div>
);

const Sub = ({ title, children }: any) => (
    <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>{title}</h3>
        <div>{children}</div>
    </div>
);

const Bullet = ({ items }: any) => (
    <ul style={{ paddingLeft: '18px', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item: any, i: any) => <li key={i}>{item}</li>)}
    </ul>
);

export default function PrivacyPolicy() {
    const lastUpdated = 'March 1, 2026';

    return (
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(32px,5vw,60px) 20px' }}>
            <SEO
                title="Privacy Policy"
                description="Read the GitTool privacy policy. Learn how we handle your data, GitHub tokens, and personal information when using our developer tools."
                keywords={['gittool privacy policy', 'developer tools privacy', 'github oauth data policy']}
                canonical="/privacy"
            />
            {/* Back link */}
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--muted-foreground)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '32px' }}
                onMouseEnter={(e: any) => e.currentTarget.style.color = 'var(--foreground)'}
                onMouseLeave={(e: any) => e.currentTarget.style.color = 'var(--muted-foreground)'}>
                <ArrowLeft size={14} /> Back to Home
            </Link>

            {/* Header */}
            <div style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: 'linear-gradient(135deg, rgba(201,149,106,0.12), rgba(226,196,160,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} style={{ color: '#c9956a' }} />
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, margin: 0 }}>Privacy Policy</h1>
                </div>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                    Last updated: <strong style={{ color: 'var(--foreground)' }}>{lastUpdated}</strong>
                </p>
                <div style={{ marginTop: '16px', padding: '16px 20px', borderRadius: '10px', background: 'rgba(201,149,106,0.06)', border: '1px solid rgba(201,149,106,0.2)', fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
                    <strong style={{ color: '#c9956a' }}>TL;DR:</strong> We don't store your code. We use GitHub OAuth to read repository metadata only, with your permission. We don't sell your data. You can delete your account anytime.
                </div>
            </div>

            {/* Sections */}
            <Section title="1. Introduction">
                <p>Welcome to <strong style={{ color: 'var(--foreground)' }}>GitTool</strong> ("we", "our", or "us"), operated at <strong style={{ color: 'var(--foreground)' }}>gittool.dev</strong>. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our web application and services.</p>
                <p style={{ marginTop: '10px' }}>By accessing or using GitTool, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use of our service immediately.</p>
            </Section>

            <Section title="2. Information We Collect">
                <Sub title="2.1 Account Information (via GitHub OAuth)">
                    <p>When you sign in using GitHub OAuth, we receive the following from GitHub, with your explicit authorization:</p>
                    <Bullet items={[
                        'Your GitHub username and display name',
                        'Your public email address (if set on GitHub)',
                        'Your GitHub profile picture URL',
                        'Your GitHub user ID (for identifying your account)',
                        'A GitHub OAuth access token (stored only in your browser\'s localStorage, never on our servers)',
                    ]} />
                    <p style={{ marginTop: '10px' }}>We do <strong style={{ color: 'var(--foreground)' }}>not</strong> receive or store your GitHub password.</p>
                </Sub>

                <Sub title="2.2 Repository Data (Read-Only, On Demand)">
                    <p>When you choose to generate a README for a specific repository, we temporarily read the following from the GitHub API in real-time:</p>
                    <Bullet items={[
                        'Repository name, description, star count, fork count, license, and topics',
                        'File and folder names (file tree) — not file contents',
                        'Recent commit messages and commit author names (last 15 commits)',
                        'Contents of specific configuration files: package.json, requirements.txt, Dockerfile, docker-compose.yml, vercel.json, netlify.toml, fly.toml, render.yaml, tsconfig.json, vite.config.js, next.config.js, .env.example, Cargo.toml, go.mod, pyproject.toml',
                        'Programming languages detected in the repository',
                    ]} />
                    <p style={{ marginTop: '10px' }}>This data is passed directly to the OpenAI API for README generation and is <strong style={{ color: 'var(--foreground)' }}>not persisted on our servers</strong> beyond temporary in-memory processing.</p>
                </Sub>

                <Sub title="2.3 Generated Content">
                    <p>The README markdown generated by GitTool is stored in our database (Supabase) linked to your user account. This allows you to:</p>
                    <Bullet items={[
                        'Access previously generated READMEs from your dashboard',
                        'Edit and update them using the AI chat or markdown editor',
                        'Download them at any time',
                    ]} />
                    <p style={{ marginTop: '10px' }}>You can delete any stored project (and its associated content) at any time from your dashboard.</p>
                </Sub>

                <Sub title="2.4 Payment Information">
                    <p>All payment processing is handled by <strong style={{ color: 'var(--foreground)' }}>Razorpay</strong>, a PCI-DSS compliant payment gateway. GitTool does <strong style={{ color: 'var(--foreground)' }}>not</strong> collect, store, or process your credit or debit card information. We store only:</p>
                    <Bullet items={[
                        'Razorpay Order ID (for tracking your purchase)',
                        'Razorpay Payment ID (for verification)',
                        'Amount paid and tokens purchased',
                        'Payment status (created, paid, or failed)',
                    ]} />
                </Sub>

                <Sub title="2.5 Usage Data">
                    <p>We may automatically collect limited technical data when you access GitTool:</p>
                    <Bullet items={[
                        'Browser type and version',
                        'Operating system',
                        'Pages visited and time spent',
                        'Timestamp of API requests',
                        'IP address (used for rate limiting only, not stored persistently)',
                    ]} />
                </Sub>
            </Section>

            <Section title="3. How We Use Your Information">
                <p>We use the information we collect for the following purposes:</p>
                <Bullet items={[
                    'To authenticate you and maintain your session',
                    'To generate README documentation using the OpenAI API based on your repository\'s public structure',
                    'To store and display your generated README projects in your dashboard',
                    'To manage your token balance and process token purchases',
                    'To enforce rate limits and prevent abuse',
                    'To send transactional emails (e.g., payment confirmations), if applicable',
                    'To improve and optimize our service',
                    'To comply with legal obligations',
                ]} />
                <p style={{ marginTop: '10px' }}>We do <strong style={{ color: 'var(--foreground)' }}>not</strong> use your data for advertising, behavioural profiling, or sale to third parties.</p>
            </Section>

            <Section title="4. Third-Party Services">
                <p>GitTool integrates with the following third-party services. Each has their own privacy policy:</p>

                <Sub title="4.1 GitHub (Authentication & API)">
                    <p>We use GitHub OAuth for authentication and the GitHub REST API for fetching repository metadata. Your GitHub access token is stored in your browser's localStorage and sent to our backend only when making API requests. We request only the scopes <code style={{ background: 'var(--muted)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.8rem' }}>repo</code> and <code style={{ background: 'var(--muted)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.8rem' }}>read:user</code>.</p>
                    <p style={{ marginTop: '6px' }}>— <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noreferrer" style={{ color: '#c9956a' }}>GitHub Privacy Statement</a></p>
                </Sub>

                <Sub title="4.2 Supabase (Database & Authentication)">
                    <p>Supabase hosts our database and manages authentication sessions. Your account data (user ID, email, username), generated README projects, token balances, and payment records are stored in Supabase's infrastructure (AWS, US region by default).</p>
                    <p style={{ marginTop: '6px' }}>— <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" style={{ color: '#c9956a' }}>Supabase Privacy Policy</a></p>
                </Sub>

                <Sub title="4.3 OpenAI (AI Generation)">
                    <p>Repository context (file names, commit messages, config file contents) and your chat messages are sent to OpenAI's API to generate README content. OpenAI may retain API inputs for a limited period per their data retention policy. We recommend reviewing OpenAI's Enterprise Privacy policy for details.</p>
                    <p style={{ marginTop: '6px' }}>— <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noreferrer" style={{ color: '#c9956a' }}>OpenAI Privacy Policy</a></p>
                </Sub>

                <Sub title="4.4 Razorpay (Payments)">
                    <p>Token purchases are processed through Razorpay. Payment information (card details, UPI, etc.) is collected directly by Razorpay and is not accessible to GitTool. Razorpay is PCI-DSS Level 1 compliant.</p>
                    <p style={{ marginTop: '6px' }}>— <a href="https://razorpay.com/privacy/" target="_blank" rel="noreferrer" style={{ color: '#c9956a' }}>Razorpay Privacy Policy</a></p>
                </Sub>
            </Section>

            <Section title="5. Data Storage & Security">
                <Sub title="5.1 Storage Location">
                    <p>Your data is stored in Supabase's managed PostgreSQL database. Configuration and credentials are managed through environment variables and are never exposed to the client.</p>
                </Sub>

                <Sub title="5.2 Security Measures">
                    <Bullet items={[
                        'All communications between the client and server use HTTPS/TLS encryption',
                        'Authentication is handled via Supabase JWT tokens with short expiry periods',
                        'Row Level Security (RLS) is enforced on all database tables — you can only access your own data',
                        'GitHub tokens are stored only in browser localStorage and are never persisted server-side',
                        'Rate limiting is applied to all API endpoints to prevent abuse',
                        'Payment signature verification using HMAC-SHA256 for all Razorpay transactions',
                    ]} />
                </Sub>

                <Sub title="5.3 Data Retention">
                    <p>We retain your account data, generated projects, and transaction records for as long as your account is active. If you delete your account, all associated data is permanently deleted within 30 days.</p>
                </Sub>
            </Section>

            <Section title="6. Your Rights">
                <p>Depending on your location, you may have the following rights under applicable data protection laws (including GDPR and India's DPDP Act):</p>
                <Bullet items={[
                    'Right to Access: Request a copy of the personal data we hold about you',
                    'Right to Rectification: Correct inaccurate or incomplete data',
                    'Right to Erasure ("Right to be Forgotten"): Request deletion of your account and all associated data',
                    'Right to Data Portability: Request your generated README content in a machine-readable format',
                    'Right to Withdraw Consent: Revoke GitHub OAuth access at any time from your GitHub Settings — Applications',
                    'Right to Object: Object to processing of your personal data in certain circumstances',
                ]} />
                <p style={{ marginTop: '12px' }}>To exercise any of these rights, contact us at: <a href="mailto:privacy@gittool.dev" style={{ color: '#c9956a' }}>privacy@gittool.dev</a></p>
            </Section>

            <Section title="7. Cookies & Local Storage">
                <p>GitTool uses browser <strong style={{ color: 'var(--foreground)' }}>localStorage</strong> (not traditional cookies) to store:</p>
                <Bullet items={[
                    'Your GitHub OAuth access token (for API calls)',
                    'Your Supabase session token (for authentication)',
                ]} />
                <p style={{ marginTop: '10px' }}>We do not use advertising cookies, tracking pixels, or analytics cookies. You can clear localStorage at any time via your browser settings, which will log you out of GitTool.</p>
            </Section>

            <Section title="8. Children's Privacy">
                <p>GitTool is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with their information, please contact us at <a href="mailto:privacy@gittool.dev" style={{ color: '#c9956a' }}>privacy@gittool.dev</a> and we will promptly delete such data.</p>
            </Section>

            <Section title="9. Changes to This Policy">
                <p>We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. For significant changes, we will make reasonable efforts to notify users (e.g., via a banner on the website). Your continued use of GitTool after any changes constitutes your acceptance of the updated policy.</p>
            </Section>

            <Section title="10. Contact Us">
                <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please reach out:</p>
                <div style={{ marginTop: '12px', padding: '20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--card)' }}>
                    <div style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--foreground)' }}>GitTool</strong></div>
                    <div>🔧 Privacy: <a href="mailto:privacy@gittool.dev" style={{ color: '#c9956a' }}>privacy@gittool.dev</a></div>
                    <div>🔧 Support: <a href="mailto:support@gittool.dev" style={{ color: '#c9956a' }}>support@gittool.dev</a></div>
                    <div>🌐 Website: <a href="https://gittool.dev" style={{ color: '#c9956a' }}>gittool.dev</a></div>
                </div>
            </Section>

            {/* Bottom note */}
            <div style={{ marginTop: '16px', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--muted)', fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
                This privacy policy is effective as of {lastUpdated}. By using GitTool, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
            </div>
        </div>
    );
}

