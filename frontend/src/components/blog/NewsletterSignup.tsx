'use client';

import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function NewsletterSignup({
  title = 'Subscribe to my newsletter',
  description = 'A periodic update about new articles, Git tips, and developer tools. No spam, ever.',
}: any) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r: any) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-zinc-900">
      {/* Diagonal crosshatch overlay */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '8px 8px',
        }}
      />

      {/* Corner crosshairs */}
      <span className="absolute left-4 top-4 h-px w-4 bg-white/25" />
      <span className="absolute left-4 top-4 h-4 w-px bg-white/25" />
      <span className="absolute right-4 top-4 h-px w-4 bg-white/25" />
      <span className="absolute right-4 top-4 h-4 w-px bg-white/25" />
      <span className="absolute bottom-4 left-4 h-px w-4 bg-white/25" />
      <span className="absolute bottom-4 left-4 h-4 w-px bg-white/25" />
      <span className="absolute bottom-4 right-4 h-px w-4 bg-white/25" />
      <span className="absolute bottom-4 right-4 h-4 w-px bg-white/25" />

      {/* Content */}
      <div className="relative px-10 py-14 text-center md:px-16 md:py-16">
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/55">{description}</p>

        {submitted ? (
          <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-5 py-2.5 text-sm text-green-400">
            <CheckCircle size={15} />
            You're on the list - talk soon!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto mt-8 flex w-full max-w-md">
            <div className="flex w-full items-center rounded-full border border-white/15 bg-white/5 px-1 py-1">
              <input
                type="email"
                required
                placeholder="youremail@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent px-4 text-sm text-white placeholder:text-white/35 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Subscribe'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-xs text-white/35">
          <span className="font-bold text-white/55">NO SPAM.</span>{' '}
          I never send spam. You can unsubscribe at any time!
        </p>
      </div>
    </section>
  );
}

