-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Update profiles table structure
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS username_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS email_check;

-- Add or modify columns
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS username text,
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS credits integer DEFAULT 10,
    ADD COLUMN IF NOT EXISTS beta_access boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS waitlist_position integer DEFAULT null;

-- Add constraints
ALTER TABLE profiles 
    ADD CONSTRAINT username_length CHECK (username IS NULL OR char_length(username) >= 3) NOT VALID,
    ADD CONSTRAINT email_check CHECK (email IS NULL OR char_length(email) >= 5) NOT VALID;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    total_users INTEGER;
    user_metadata jsonb;
BEGIN
    -- Get total number of existing users
    SELECT COUNT(*) INTO total_users FROM public.profiles;
    
    -- Extract user metadata
    user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    
    -- Insert new profile
    INSERT INTO public.profiles (
        id,
        username,
        email,
        credits,
        beta_access,
        waitlist_position,
        updated_at,
        onboarding_completed
    )
    VALUES (
        NEW.id,
        COALESCE(
            user_metadata->>'username',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.email,
        10, -- Default credits
        CASE 
            WHEN total_users < 25 THEN true  -- First 25 users get beta access
            ELSE false
        END,
        CASE 
            WHEN total_users >= 25 THEN total_users - 24  -- Waitlist position after first 25
            ELSE null
        END,
        NOW(),
        false
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Fallback insert with minimal data if something goes wrong
        INSERT INTO public.profiles (id, email, credits, updated_at)
        VALUES (NEW.id, NEW.email, 10, NOW());
        RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone."
    ON profiles FOR SELECT
    USING ( true );

CREATE POLICY "Users can insert their own profile."
    ON profiles FOR INSERT
    WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
    ON profiles FOR UPDATE
    USING ( auth.uid() = id );

-- Update existing profiles
UPDATE profiles 
SET credits = COALESCE(credits, 10)
WHERE credits IS NULL;

-- Update beta access and waitlist positions based on updated_at
WITH ranked_users AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY COALESCE(updated_at, NOW()) ASC) as user_rank
    FROM profiles
)
UPDATE profiles p
SET 
    beta_access = CASE 
        WHEN r.user_rank <= 25 THEN true 
        ELSE false 
    END,
    waitlist_position = CASE 
        WHEN r.user_rank > 25 THEN r.user_rank - 25
        ELSE null
    END,
    updated_at = COALESCE(p.updated_at, NOW())
FROM ranked_users r
WHERE p.id = r.id;

-- Enable RLS
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;