/**
 * Credential scanning engine.
 * Scans text for API keys, secrets, tokens using regex patterns.
 * Used as a defensive firewall before syncing content to GitHub.
 */

const PATTERNS = [
    // AWS
    { type: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
    { type: 'AWS Secret Key', regex: /(?:aws_secret_access_key|secret_key)\s*[=:]\s*["']?[A-Za-z0-9/+=]{40}["']?/gi },

    // GitHub
    { type: 'GitHub Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
    { type: 'GitHub OAuth', regex: /gho_[A-Za-z0-9]{36}/g },

    // Stripe
    { type: 'Stripe Secret Key', regex: /sk_live_[A-Za-z0-9]{20,}/g },
    { type: 'Stripe Test Key', regex: /sk_test_[A-Za-z0-9]{20,}/g },

    // Google
    { type: 'Google API Key', regex: /AIza[0-9A-Za-z\-_]{35}/g },
    { type: 'Google OAuth Secret', regex: /GOCSPX-[A-Za-z0-9\-_]{28}/g },

    // Slack
    { type: 'Slack Token', regex: /xox[bporsma]-[0-9]{10,13}-[A-Za-z0-9-]+/g },

    // Generic
    { type: 'Private Key', regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g },
    { type: 'Bearer Token', regex: /bearer\s+[A-Za-z0-9\-._~+\/]+=*/gi },

    // Database URLs
    { type: 'Database URL', regex: /(?:postgres|mysql|mongodb|redis):\/\/[^\s"']+:[^\s"']+@[^\s"']+/gi },

    // Generic secrets (assignment patterns)
    { type: 'Secret Assignment', regex: /(?:api_key|apikey|secret|password|token|auth)\s*[=:]\s*["'][A-Za-z0-9\-._~+\/]{16,}["']/gi },
];

/**
 * Scan text content for potential credentials.
 * @param {string} content - The text to scan
 * @returns {Array<{line: number, type: string, match: string}>} Found secrets
 */
export function scanForCredentials(content) {
    if (!content) return [];

    const results = [];
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
        for (const pattern of PATTERNS) {
            const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
            let match;
            while ((match = regex.exec(line)) !== null) {
                results.push({
                    line: idx + 1,
                    type: pattern.type,
                    match: match[0].slice(0, 8) + '***' // Partially redact
                });
            }
        }
    });

    return results;
}
