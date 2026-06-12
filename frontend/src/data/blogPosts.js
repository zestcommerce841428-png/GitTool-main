export const blogPosts = [
  {
    slug: 'git-best-practices-2026',
    title: 'Git Best Practices for 2026: Team Workflow Playbook',
    excerpt: 'A practical guide to branch strategy, PR quality, commit hygiene, and CI checks for modern teams.',
    summary: 'Whether you lead a 3-person startup or a 50-engineer org, these Git habits separate high-velocity teams from those constantly fighting their own history.',
    categories: ['workflow', 'teams', 'git'],
    publishedAt: '2026-04-20',
    updatedAt: '2026-04-20',
    readingTime: '9 min read',
    gradient: 'from-violet-600 to-indigo-700',
    headings: [
      { id: 'branch-strategy', text: 'Branch Strategy', level: 2 },
      { id: 'commit-hygiene', text: 'Commit Hygiene', level: 2 },
      { id: 'pull-request-quality', text: 'Pull Request Quality', level: 2 },
      { id: 'ci-checks', text: 'CI Checks as Guardrails', level: 2 },
      { id: 'code-review-culture', text: 'Code Review Culture', level: 2 },
      { id: 'tagging-releases', text: 'Tagging Releases', level: 2 },
    ],
    content: `
<h2 id="branch-strategy">Branch Strategy</h2>
<p>Adopt a naming convention your whole team agrees on before the first commit. A simple pattern like <code>type/short-description</code> (e.g., <code>feat/user-auth</code>, <code>fix/null-pointer-login</code>) keeps branches scannable in list views and enables automation like auto-labeling PRs.</p>
<p>Keep branches short-lived. Branches that drift more than a few days accumulate merge debt. Use feature flags to ship incomplete features behind a toggle rather than hoarding work in a long-running branch.</p>
<ul>
  <li><strong>main</strong> — always deployable, protected</li>
  <li><strong>feat/*</strong> — new capabilities, merged via PR</li>
  <li><strong>fix/*</strong> — bug fixes and hot patches</li>
  <li><strong>chore/*</strong> — tooling, deps, infra, no functional change</li>
</ul>

<h2 id="commit-hygiene">Commit Hygiene</h2>
<p>Each commit should represent one logical unit of change. Mixing a refactor, a bug fix, and a feature into one commit makes <code>git bisect</code> useless and code review painful.</p>
<p>Follow the <a href="/blog/how-to-write-better-git-commit-messages">Conventional Commits spec</a>: a short imperative subject (≤72 chars), a blank line, then a body explaining <em>why</em> not <em>what</em>. Your diff already shows what changed — the message should explain motivation.</p>
<pre><code>feat(auth): add OAuth2 PKCE flow for mobile clients

Mobile clients cannot safely store a client secret.
PKCE removes that requirement while preserving security.</code></pre>

<h2 id="pull-request-quality">Pull Request Quality</h2>
<p>A PR is a communication artifact, not just a merge request. Write a description that answers: <em>Why does this PR exist? What approach was taken? How was it tested?</em></p>
<p>Keep PRs small. Aim for under 400 lines of meaningful diff. Large PRs get rubber-stamped or stall. If a feature requires more, split it into a foundation PR and follow-ups.</p>
<p>Link every PR to an issue. This creates a traceable history from business requirement → implementation → commit → deployment.</p>

<h2 id="ci-checks">CI Checks as Guardrails</h2>
<p>Never merge a PR that fails CI. Configure branch protection to require status checks before merge. The minimum useful check set:</p>
<ul>
  <li>Lint (ESLint, Prettier, or language-equivalent)</li>
  <li>Unit tests with coverage threshold</li>
  <li>Build succeeds</li>
  <li>Secrets scan (prevent accidental credential commits)</li>
</ul>
<p>Add a preview deployment so reviewers can QA UI changes without pulling the branch locally. Platforms like Vercel and Netlify make this trivial.</p>

<h2 id="code-review-culture">Code Review Culture</h2>
<p>Reviews should be asynchronous-first. Give reviewers 24 hours before pinging. Use a tiered commenting convention to distinguish blocking from non-blocking feedback:</p>
<ul>
  <li><strong>blocking:</strong> must be resolved before merge</li>
  <li><strong>nit:</strong> style preference, author decides</li>
  <li><strong>question:</strong> clarification only, no action required</li>
</ul>
<p>Approve with comments when the change is good but you have non-blocking suggestions. Never use "Request Changes" for nitpicks — it blocks the PR and frustrates authors.</p>

<h2 id="tagging-releases">Tagging Releases</h2>
<p>Tag every production deployment. Use semantic versioning: <code>MAJOR.MINOR.PATCH</code>. Automate tag creation from your CI pipeline on merge to main.</p>
<pre><code>git tag -a v2.4.1 -m "release: v2.4.1 — fix checkout race condition"
git push origin v2.4.1</code></pre>
<p>Tags give you a precise anchor for rollbacks, changelogs, and support triage. A repo with no tags makes incident response much harder than it needs to be.</p>
    `,
  },
  {
    slug: 'common-git-mistakes-to-avoid',
    title: 'Common Git Mistakes to Avoid (and How to Fix Them)',
    excerpt: 'Real mistakes developers make in daily Git workflows and safe recovery steps for each case.',
    summary: 'Everyone commits secrets, force-pushes shared branches, or loses work to a bad reset at some point. Here\'s how to recover from the most painful Git mistakes.',
    categories: ['git', 'debugging', 'beginners'],
    publishedAt: '2026-04-18',
    updatedAt: '2026-04-18',
    readingTime: '7 min read',
    gradient: 'from-rose-600 to-orange-600',
    headings: [
      { id: 'committed-secrets', text: 'Committing Secrets', level: 2 },
      { id: 'force-push-shared', text: 'Force-Pushing Shared Branches', level: 2 },
      { id: 'bad-reset', text: 'Losing Work with git reset --hard', level: 2 },
      { id: 'wrong-branch', text: 'Committing to the Wrong Branch', level: 2 },
      { id: 'giant-commits', text: 'Making Giant Commits', level: 2 },
      { id: 'ignoring-gitignore', text: 'Ignoring .gitignore', level: 2 },
    ],
    content: `
<h2 id="committed-secrets">Committing Secrets</h2>
<p>Credentials in Git history are effectively public, even in private repos — access tokens get rotated but the commit stays forever. If you push a secret:</p>
<ol>
  <li><strong>Rotate the credential immediately.</strong> Assume it is compromised.</li>
  <li>Remove it from history with <code>git filter-repo</code> (preferred over <code>BFG Repo Cleaner</code> for new projects).</li>
  <li>Force-push the cleaned history.</li>
  <li>Notify your team so they re-clone.</li>
</ol>
<p>Prevention: use <code>git-secrets</code> or <a href="/tools/secrets-scanner">GitTool's Secrets Scanner</a> as a pre-commit hook to block commits containing patterns that look like keys or passwords.</p>

<h2 id="force-push-shared">Force-Pushing Shared Branches</h2>
<p>Running <code>git push --force</code> on <code>main</code> or any branch teammates are using rewrites remote history, causing everyone else's local branches to diverge. It's disorienting and can cause work to appear lost.</p>
<p>Rules:</p>
<ul>
  <li>Never force-push to <code>main</code>, <code>develop</code>, or any branch others track.</li>
  <li>If you must rewrite history on your own feature branch, use <code>--force-with-lease</code> — it aborts if someone else has pushed in the meantime.</li>
</ul>
<pre><code>git push --force-with-lease origin feat/my-feature</code></pre>

<h2 id="bad-reset">Losing Work with git reset --hard</h2>
<p>Running <code>git reset --hard HEAD~3</code> discards your last three commits and all working-directory changes. If you didn't push, it feels like the work is gone — but Git keeps "dangling" commits in the reflog for 30 days.</p>
<pre><code># Show the reflog — each entry has a hash
git reflog

# Restore the commit you lost
git checkout -b recovery/lost-work abc1234</code></pre>
<p>Lesson: use <code>git stash</code> before hard resets so you have a safety net.</p>

<h2 id="wrong-branch">Committing to the Wrong Branch</h2>
<p>You finished a feature and realize you committed directly to <code>main</code> instead of your feature branch. Fix:</p>
<pre><code># Create the correct branch at current HEAD
git branch feat/correct-branch

# Remove the commits from main (move HEAD back)
git reset --hard HEAD~N   # N = number of commits to undo

# The commits are now only on feat/correct-branch</code></pre>
<p>If you already pushed to main, use <code>git revert</code> instead of reset — it creates a new commit that undoes the changes, preserving shared history.</p>

<h2 id="giant-commits">Making Giant Commits</h2>
<p>A 2,000-line commit that touches 30 files for three different reasons breaks <code>git bisect</code>, makes code review impossible, and generates unhelpful changelogs. Commit often and logically.</p>
<p>Use <code>git add -p</code> (patch mode) to stage individual hunks from a file so you can split related changes into separate commits even when you edited them in the same session.</p>

<h2 id="ignoring-gitignore">Ignoring .gitignore</h2>
<p>Committing <code>node_modules</code>, <code>.env</code>, <code>*.log</code>, or build artifacts pollutes history, inflates clone size, and leaks environment-specific paths. Use <a href="/tools/gitignore-generator">GitTool's Gitignore Generator</a> to create a solid baseline for your stack.</p>
<p>If you've already tracked a file that should be ignored:</p>
<pre><code>git rm --cached path/to/file
echo "path/to/file" >> .gitignore
git commit -m "chore: untrack file and add to .gitignore"</code></pre>
    `,
  },
  {
    slug: 'gitflow-vs-trunk-based-development',
    title: 'GitFlow vs Trunk-Based Development: Which Should You Use?',
    excerpt: 'A direct comparison of release velocity, risk, and team ergonomics across both strategies.',
    summary: 'GitFlow and trunk-based development represent opposite ends of the branching spectrum. Here\'s how to pick the one that matches your release cadence.',
    categories: ['workflow', 'teams', 'ci-cd'],
    publishedAt: '2026-04-16',
    updatedAt: '2026-04-16',
    readingTime: '8 min read',
    gradient: 'from-cyan-600 to-teal-700',
    headings: [
      { id: 'what-is-gitflow', text: 'What is GitFlow?', level: 2 },
      { id: 'what-is-tbd', text: 'What is Trunk-Based Development?', level: 2 },
      { id: 'release-cadence', text: 'Release Cadence', level: 2 },
      { id: 'team-size', text: 'Team Size & Structure', level: 2 },
      { id: 'feature-flags', text: 'Feature Flags Replace Long Branches', level: 2 },
      { id: 'verdict', text: 'The Verdict', level: 2 },
    ],
    content: `
<h2 id="what-is-gitflow">What is GitFlow?</h2>
<p>GitFlow, introduced by Vincent Driessen in 2010, defines a rigid set of long-lived branches: <code>main</code>, <code>develop</code>, <code>feature/*</code>, <code>release/*</code>, and <code>hotfix/*</code>. Features are merged into <code>develop</code>, periodically cut to <code>release/*</code> for stabilization, then merged to <code>main</code> and tagged.</p>
<p>This model made sense in an era of scheduled releases where shipping every two weeks required careful coordination. It creates a clear separation between in-development code and production-ready code.</p>

<h2 id="what-is-tbd">What is Trunk-Based Development?</h2>
<p>Trunk-based development (TBD) has a single long-lived branch — <code>main</code> (the "trunk"). Everyone integrates directly to trunk multiple times per day. Feature branches exist, but they're typically under 24 hours old before being merged.</p>
<p>TBD is the foundation of continuous delivery. Google, Facebook, and most high-velocity SaaS companies use variants of trunk-based development because it minimizes merge conflicts and keeps the feedback loop tight.</p>

<h2 id="release-cadence">Release Cadence</h2>
<p><strong>GitFlow</strong> suits teams on scheduled releases — mobile apps where App Store review takes time, enterprise software with quarterly versioning, or regulated industries that require release documentation before deployment.</p>
<p><strong>TBD</strong> suits teams who deploy multiple times per day. If your deployment is a button click and rollback takes 60 seconds, you have no reason to accumulate changes in a staging branch for a week.</p>

<h2 id="team-size">Team Size & Structure</h2>
<p>Counter-intuitively, TBD tends to scale better to <em>larger</em> teams because it forces continuous integration. With GitFlow, a 20-person team can let five feature branches drift for two weeks, then face a catastrophic merge day.</p>
<p>TBD requires stronger CI discipline: tests must pass quickly, and the culture must treat a broken build as a P0 incident.</p>

<h2 id="feature-flags">Feature Flags Replace Long Branches</h2>
<p>The main objection to TBD: "What if a feature isn't ready to ship but we need to deploy?" The answer is feature flags. Incomplete code ships to production behind a toggle that's off for all users. This decouples deployment from release.</p>
<pre><code>if (featureFlags.isEnabled('new-checkout-flow', user)) {
  return &lt;NewCheckout /&gt;;
}
return &lt;LegacyCheckout /&gt;;</code></pre>
<p>Feature flags let you gradually roll out to 1% → 10% → 100% of users and instantly kill a feature without a deployment if something goes wrong.</p>

<h2 id="verdict">The Verdict</h2>
<p>For most modern web applications: <strong>trunk-based development with feature flags</strong>. It reduces merge pain, tightens feedback loops, and forces a CI discipline that pays dividends as the team grows.</p>
<p>Choose GitFlow if you have hard external constraints on release timing (mobile app stores, enterprise contracts, regulated environments) or if your deployment is risky enough that you need extended stabilization periods.</p>
    `,
  },
  {
    slug: 'how-to-write-better-git-commit-messages',
    title: 'How to Write Better Git Commit Messages',
    excerpt: 'Use a repeatable format to make history readable, searchable, and automation-friendly.',
    summary: 'Good commit messages are free documentation. Bad ones are noise. Here\'s a practical guide to writing messages that your future self will thank you for.',
    categories: ['git', 'workflow', 'beginners'],
    publishedAt: '2026-04-15',
    updatedAt: '2026-04-15',
    readingTime: '6 min read',
    gradient: 'from-amber-500 to-orange-600',
    headings: [
      { id: 'conventional-commits', text: 'Conventional Commits', level: 2 },
      { id: 'anatomy', text: 'Anatomy of a Good Message', level: 2 },
      { id: 'imperative-mood', text: 'Use the Imperative Mood', level: 2 },
      { id: 'what-not-why', text: 'Why, Not What', level: 2 },
      { id: 'automate', text: 'Automate Your Changelog', level: 2 },
    ],
    content: `
<h2 id="conventional-commits">Conventional Commits</h2>
<p>The <a href="https://www.conventionalcommits.org" target="_blank" rel="noopener">Conventional Commits</a> specification is a lightweight convention that sits on top of commit messages. It gives machines and humans a shared parsing format. The structure is:</p>
<pre><code>&lt;type&gt;[optional scope]: &lt;description&gt;

[optional body]

[optional footer(s)]</code></pre>
<p>Valid types: <code>feat</code>, <code>fix</code>, <code>docs</code>, <code>style</code>, <code>refactor</code>, <code>perf</code>, <code>test</code>, <code>chore</code>, <code>ci</code>.</p>

<h2 id="anatomy">Anatomy of a Good Message</h2>
<pre><code>feat(payments): add Stripe webhook signature verification

Previously, our webhook endpoint accepted any POST request.
Without signature verification, a bad actor could forge events
and trigger refunds or subscription upgrades.

This commit adds Stripe's recommended HMAC-SHA256 signature check
using the STRIPE_WEBHOOK_SECRET env variable.

Closes #412</code></pre>
<p>This message tells you: what changed (<em>signature verification added</em>), where (<em>payments module</em>), why (<em>security gap</em>), and links to the issue for full context.</p>

<h2 id="imperative-mood">Use the Imperative Mood</h2>
<p>Write the subject as if completing the sentence "If applied, this commit will ___."</p>
<ul>
  <li>✅ <code>fix: prevent double submission on checkout form</code></li>
  <li>❌ <code>fixed double submission bug</code></li>
  <li>❌ <code>fixing the double submit issue</code></li>
</ul>
<p>This matches Git's own generated messages (<em>"Merge branch 'feat/auth'"</em>) and makes <code>git log --oneline</code> read like a list of actions rather than a journal.</p>

<h2 id="what-not-why">Why, Not What</h2>
<p>The diff already shows <em>what</em> changed. The commit message should explain <em>why</em>. "Refactor auth middleware" is low-value. "Refactor auth middleware to reduce token validation latency by ~40ms per request" is high-value.</p>
<p>Include context reviewers and future maintainers won't have: performance benchmarks, business reasons, security considerations, or alternative approaches you rejected.</p>

<h2 id="automate">Automate Your Changelog</h2>
<p>The payoff for consistent commit messages is automation. Tools like <code>standard-version</code>, <code>release-please</code>, and <code>semantic-release</code> parse Conventional Commits to:</p>
<ul>
  <li>Determine the next semantic version (feat → minor bump, fix → patch, BREAKING CHANGE → major)</li>
  <li>Generate a CHANGELOG.md grouped by type</li>
  <li>Create GitHub releases with the correct tag</li>
</ul>
<p>This means your release notes come for free from well-structured commit messages. The investment in discipline compounds over the lifetime of the project.</p>
    `,
  },
  {
    slug: 'protecting-main-branch-in-github',
    title: 'Protecting the Main Branch in GitHub: A Complete Setup',
    excerpt: 'Required checks, review rules, and guardrails that prevent accidental breaks in production.',
    summary: 'One unreviewed force-push to main can take down production. Branch protection rules are your last line of defense — here\'s how to configure them properly.',
    categories: ['git', 'teams', 'security'],
    publishedAt: '2026-04-14',
    updatedAt: '2026-04-14',
    readingTime: '5 min read',
    gradient: 'from-green-600 to-emerald-700',
    headings: [
      { id: 'why-protect', text: 'Why Protect main?', level: 2 },
      { id: 'required-reviews', text: 'Required Reviews', level: 2 },
      { id: 'required-checks', text: 'Required Status Checks', level: 2 },
      { id: 'no-force-push', text: 'Block Force Pushes', level: 2 },
      { id: 'codeowners', text: 'CODEOWNERS File', level: 2 },
    ],
    content: `
<h2 id="why-protect">Why Protect main?</h2>
<p>Without branch protection, any team member with push access can commit directly to <code>main</code>, force-push over history, or merge a PR without any review. One tired engineer at 2am can delete a month of history. Branch protection rules on GitHub make these actions require explicit override — slowing down mistakes while barely slowing down normal work.</p>

<h2 id="required-reviews">Required Reviews</h2>
<p>Navigate to <strong>Settings → Branches → Add rule</strong>. Enable <em>Require a pull request before merging</em> and set <em>Required approving reviews</em> to at least 1 (2 for critical repos).</p>
<p>Enable <em>Dismiss stale pull request approvals when new commits are pushed</em>. This prevents the sneaky pattern of getting approval, then pushing additional unreviewed changes before merging.</p>
<p>Enable <em>Require review from Code Owners</em> once you have a CODEOWNERS file set up — it routes the review to the right person automatically.</p>

<h2 id="required-checks">Required Status Checks</h2>
<p>Enable <em>Require status checks to pass before merging</em> and add your CI job names (e.g., <code>test</code>, <code>lint</code>, <code>build</code>). These must be GitHub Actions or third-party status checks already reporting to the repo.</p>
<p>Check <em>Require branches to be up to date before merging</em> — this ensures the PR was tested against the latest main, not a stale snapshot from a week ago.</p>

<h2 id="no-force-push">Block Force Pushes</h2>
<p>Enable <em>Do not allow force pushes</em> and <em>Do not allow deletions</em>. These two rules combined make it impossible to rewrite or destroy main's history, even for admins (unless they specifically bypass the rule with an audit trail).</p>
<p>If you need to undo a bad commit to main, use <code>git revert</code> — it adds a new commit that undoes the change, preserving history and creating a clear record of what happened.</p>

<h2 id="codeowners">CODEOWNERS File</h2>
<p>Create a <code>.github/CODEOWNERS</code> file to automatically assign reviewers based on which files changed:</p>
<pre><code># Global fallback — any file not matched below
*                   @your-org/core-team

# Frontend
src/frontend/**     @your-org/frontend-team

# Infrastructure
infra/**            @alice @bob

# Security-sensitive
src/auth/**         @security-lead</code></pre>
<p>Combine with <em>Require review from Code Owners</em> in branch protection and the right people are always in the loop, without manual triage of who should review what.</p>
    `,
  },
  {
    slug: 'git-hooks-practical-guide',
    title: 'Git Hooks: A Practical Guide to Automating Your Workflow',
    excerpt: 'Run linters, tests, and formatters automatically at the right moments in your Git workflow.',
    summary: 'Git hooks are shell scripts that fire at key points in the Git lifecycle. Used well, they eliminate entire categories of "oops" commits.',
    categories: ['git', 'workflow', 'ci-cd'],
    publishedAt: '2026-04-10',
    updatedAt: '2026-04-10',
    readingTime: '7 min read',
    gradient: 'from-purple-600 to-violet-700',
    headings: [
      { id: 'what-are-hooks', text: 'What Are Git Hooks?', level: 2 },
      { id: 'pre-commit', text: 'pre-commit Hook', level: 2 },
      { id: 'commit-msg', text: 'commit-msg Hook', level: 2 },
      { id: 'pre-push', text: 'pre-push Hook', level: 2 },
      { id: 'sharing-hooks', text: 'Sharing Hooks with the Team', level: 2 },
    ],
    content: `
<h2 id="what-are-hooks">What Are Git Hooks?</h2>
<p>Git hooks are scripts stored in <code>.git/hooks/</code> that Git executes automatically at specific lifecycle events: before a commit, after a push, before a merge, and more. They can be shell scripts, Python scripts, Node.js scripts — anything executable on your system.</p>
<p>Hooks are local by default (not committed with the repo), which is both their strength (can't break your team if misconfigured) and weakness (need tooling to share). Two hooks cover 80% of use cases: <code>pre-commit</code> and <code>commit-msg</code>.</p>

<h2 id="pre-commit">pre-commit Hook</h2>
<p>The <code>pre-commit</code> hook fires before Git writes the commit object. Exit with a non-zero code to abort the commit. Use it to:</p>
<ul>
  <li>Run a linter on staged files</li>
  <li>Format code with Prettier</li>
  <li>Scan for secrets or debug statements</li>
  <li>Run fast unit tests</li>
</ul>
<pre><code>#!/bin/sh
# .git/hooks/pre-commit

npx lint-staged
exit $?</code></pre>
<p>Configure lint-staged in <code>package.json</code> to only run on staged files — this keeps the hook fast even in large repos:</p>
<pre><code>"lint-staged": {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.css": ["prettier --write"]
}</code></pre>

<h2 id="commit-msg">commit-msg Hook</h2>
<p>The <code>commit-msg</code> hook receives the commit message file path as its first argument. Use it to enforce your commit message convention:</p>
<pre><code>#!/bin/sh
# .git/hooks/commit-msg

COMMIT_MSG=$(cat "$1")
PATTERN="^(feat|fix|docs|style|refactor|perf|test|chore|ci)(\\(.+\\))?: .{1,72}"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo "❌ Commit message must follow Conventional Commits format"
  echo "   Example: feat(auth): add OAuth2 PKCE support"
  exit 1
fi</code></pre>

<h2 id="pre-push">pre-push Hook</h2>
<p>The <code>pre-push</code> hook fires before pushing to a remote. It's the right place for slower checks you don't want in every commit — a full test suite, a type-check pass, or a build verification.</p>
<pre><code>#!/bin/sh
# .git/hooks/pre-push

npm test -- --passWithNoTests
exit $?</code></pre>
<p>Be careful not to make this too slow. If pushing takes 3 minutes, developers will start using <code>--no-verify</code> to skip it, defeating the purpose.</p>

<h2 id="sharing-hooks">Sharing Hooks with the Team</h2>
<p>Since <code>.git/hooks/</code> isn't version-controlled, use a tool to share hooks. The two most common options:</p>
<p><strong>Husky</strong>: npm package that stores hooks in <code>.husky/</code> and auto-installs them via <code>npm install</code>. Zero config for JS/TS projects.</p>
<pre><code>npm install --save-dev husky
npx husky init</code></pre>
<p><strong>git config core.hooksPath</strong>: Set a custom hooks directory that <em>is</em> version-controlled:</p>
<pre><code>git config core.hooksPath .githooks</code></pre>
<p>Add <code>.githooks/</code> to your repo, commit your hooks there, and document the one-time setup step in your README.</p>
    `,
  },
  {
    slug: 'monorepo-vs-multirepo',
    title: 'Monorepo vs Multirepo: Choosing the Right Git Strategy',
    excerpt: 'How repository structure affects code sharing, CI build times, and team autonomy.',
    summary: 'The monorepo vs multirepo debate is less about technical limits and more about organizational trade-offs. Here\'s a framework for choosing.',
    categories: ['workflow', 'teams', 'ci-cd'],
    publishedAt: '2026-04-08',
    updatedAt: '2026-04-08',
    readingTime: '8 min read',
    gradient: 'from-sky-600 to-blue-700',
    headings: [
      { id: 'definitions', text: 'Defining the Terms', level: 2 },
      { id: 'monorepo-pros', text: 'Monorepo Advantages', level: 2 },
      { id: 'multirepo-pros', text: 'Multirepo Advantages', level: 2 },
      { id: 'scale', text: 'Scaling Challenges', level: 2 },
      { id: 'decision-framework', text: 'Decision Framework', level: 2 },
    ],
    content: `
<h2 id="definitions">Defining the Terms</h2>
<p>A <strong>monorepo</strong> stores multiple projects (frontend, backend, shared libraries, infra) in a single Git repository. A <strong>multirepo</strong> (also called polyrepo) gives each project its own repository. Both can work — the question is which fits your team's workflow, tooling, and release cadence.</p>

<h2 id="monorepo-pros">Monorepo Advantages</h2>
<p><strong>Atomic cross-project changes.</strong> Renaming a shared API contract, updating a type definition, or fixing a bug in a utility library can be done in a single commit that touches all affected packages. No coordinating version bumps across repositories.</p>
<p><strong>Unified tooling.</strong> One ESLint config, one Prettier config, one CI pipeline, one <code>tsconfig.json</code> base. Enforcing standards across 10 packages is trivial when they're in the same repo.</p>
<p><strong>Simplified code discovery.</strong> Engineers can search, navigate, and understand the whole system without juggling multiple repo clones and divergent tooling setups.</p>

<h2 id="multirepo-pros">Multirepo Advantages</h2>
<p><strong>Team autonomy.</strong> Each team controls their own release cadence, dependency versions, and tooling without stepping on other teams. Permission scoping is simpler — you give a contractor access to one repo, not the whole codebase.</p>
<p><strong>Smaller CI scope.</strong> A change to the frontend doesn't trigger a full backend test suite. CI runs stay fast because only the affected service is built and tested.</p>
<p><strong>Cleaner ownership.</strong> When a repo corresponds to a service owned by one team, responsibility is unambiguous. In a monorepo, ownership can become blurry without explicit CODEOWNERS rules.</p>

<h2 id="scale">Scaling Challenges</h2>
<p>Monorepos at scale require specialized tooling. Google's internal monorepo has billions of lines of code — standard <code>git clone</code> would take days. Tools like Nx, Turborepo, and Bazel solve this with affected-package detection (only rebuild what changed) and remote caching.</p>
<p>Multirepos at scale create dependency synchronization problems. If 20 services depend on a shared library and you have a security patch, you need to open 20 PRs, coordinate 20 deployments, and track version drift across all of them.</p>

<h2 id="decision-framework">Decision Framework</h2>
<p>Start with a <strong>monorepo if:</strong></p>
<ul>
  <li>Your team is small (1-20 engineers) and co-owns the whole system</li>
  <li>You have heavy code sharing between services</li>
  <li>You want to enforce consistent standards without overhead</li>
</ul>
<p>Start with a <strong>multirepo if:</strong></p>
<ul>
  <li>Different teams have completely different tech stacks</li>
  <li>Services have radically different release cadences or compliance boundaries</li>
  <li>You need fine-grained access control at the repo level</li>
</ul>
<p>Most startups benefit from a monorepo early on. Most large organizations end up with a hybrid: a monorepo per domain or team, with a few independent repos for truly isolated concerns.</p>
    `,
  },
];

// Helper: get all unique categories
export function getAllCategories(posts = blogPosts) {
  const cats = new Set();
  posts.forEach((p) => (p.categories || []).forEach((c) => cats.add(c)));
  return Array.from(cats).sort();
}

// Helper: get related posts (same category, exclude current)
export function getRelatedPosts(currentSlug, count = 3) {
  const current = blogPosts.find((p) => p.slug === currentSlug);
  if (!current) return [];
  return blogPosts
    .filter(
      (p) =>
        p.slug !== currentSlug &&
        (p.categories || []).some((c) => (current.categories || []).includes(c)),
    )
    .slice(0, count);
}

