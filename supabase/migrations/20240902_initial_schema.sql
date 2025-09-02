-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trackers table
CREATE TABLE IF NOT EXISTS public.trackers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  schedule TEXT DEFAULT '0 9 * * *', -- Daily at 9am
  sources JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tracker_runs table
CREATE TABLE IF NOT EXISTS public.tracker_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error TEXT,
  metadata JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create tracker_results table
CREATE TABLE IF NOT EXISTS public.tracker_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES public.tracker_runs(id) ON DELETE CASCADE,
  tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT,
  images TEXT[],
  videos TEXT[],
  source TEXT,
  score NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tracker_id UUID REFERENCES public.trackers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, tracker_id)
);

-- Create indexes for performance
CREATE INDEX idx_trackers_user_id ON public.trackers(user_id);
CREATE INDEX idx_trackers_is_public ON public.trackers(is_public);
CREATE INDEX idx_tracker_runs_tracker_id ON public.tracker_runs(tracker_id);
CREATE INDEX idx_tracker_runs_status ON public.tracker_runs(status);
CREATE INDEX idx_tracker_results_run_id ON public.tracker_results(run_id);
CREATE INDEX idx_tracker_results_tracker_id ON public.tracker_results(tracker_id);
CREATE INDEX idx_follows_user_id ON public.follows(user_id);
CREATE INDEX idx_follows_tracker_id ON public.follows(tracker_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles: Users can view all profiles but only edit their own
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trackers: Users can view public trackers or their own
CREATE POLICY "Public trackers are viewable by everyone" 
  ON public.trackers FOR SELECT 
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create trackers" 
  ON public.trackers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trackers" 
  ON public.trackers FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trackers" 
  ON public.trackers FOR DELETE 
  USING (auth.uid() = user_id);

-- Tracker runs: Viewable if user owns tracker or tracker is public
CREATE POLICY "Tracker runs are viewable based on tracker visibility" 
  ON public.tracker_runs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.trackers 
      WHERE id = tracker_runs.tracker_id 
      AND (is_public = true OR user_id = auth.uid())
    )
  );

-- Tracker results: Same as runs
CREATE POLICY "Tracker results are viewable based on tracker visibility" 
  ON public.tracker_results FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.trackers 
      WHERE id = tracker_results.tracker_id 
      AND (is_public = true OR user_id = auth.uid())
    )
  );

-- Follows: Users can manage their own follows
CREATE POLICY "Users can view follows" 
  ON public.follows FOR SELECT 
  USING (true);

CREATE POLICY "Users can create follows" 
  ON public.follows FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follows" 
  ON public.follows FOR DELETE 
  USING (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
