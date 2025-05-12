-- Add credits column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'credits') THEN
        ALTER TABLE profiles ADD COLUMN credits INTEGER DEFAULT 10;
    END IF;
END $$;

-- Update existing profiles to have 10 credits if they don't have any
UPDATE profiles SET credits = 10 WHERE credits IS NULL;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function to handle new user creation with credits
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Get total number of users (excluding the new user)
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    -- Insert new profile with appropriate status
    INSERT INTO public.profiles (
        id,
        credits,
        beta_access,
        waitlist_position,
        updated_at
    )
    VALUES (
        NEW.id,
        10, -- Default credits for new users
        CASE 
            WHEN user_count < 25 THEN true -- First 25 users get beta access
            ELSE false
        END,
        CASE 
            WHEN user_count >= 25 THEN user_count - 24 -- Waitlist position starts after first 25
            ELSE null
        END,
        now()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add policy for users to update their own credits
CREATE POLICY "Users can update their own credits"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);