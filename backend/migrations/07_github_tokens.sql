CREATE TABLE IF NOT EXISTS public.github_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_token TEXT NOT NULL,
    iv TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.github_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all public access to github tokens" ON public.github_tokens FOR ALL USING (false);
