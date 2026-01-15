-- Create table to track Perplexity searches
CREATE TABLE IF NOT EXISTS public.perplexity_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS perplexity_searches_user_id_idx ON public.perplexity_searches(user_id);
CREATE INDEX IF NOT EXISTS perplexity_searches_created_at_idx ON public.perplexity_searches(created_at DESC);

-- Enable RLS
ALTER TABLE public.perplexity_searches ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own searches
CREATE POLICY "Users can view own searches" ON public.perplexity_searches
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Service role can insert searches
CREATE POLICY "Service role can insert searches" ON public.perplexity_searches
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.perplexity_searches IS 'Tracks Perplexity API searches for analytics and Pro quota management';
