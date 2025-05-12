-- Add credits column to profiles table and modify user onboarding function
ALTER TABLE profiles ADD COLUMN credits INTEGER DEFAULT 10;

-- Function to calculate beta user position and waitlist position
CREATE OR REPLACE FUNCTION handle_new_user_onboarding()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Get total number of users (excluding the new user)
    SELECT COUNT(*) INTO user_count FROM profiles WHERE id != NEW.id;
    
    -- First 25 users are beta users
    IF user_count < 25 THEN
        NEW.beta_access := true;
        NEW.waitlist_position := null;
        NEW.credits := 10;
    ELSE
        -- Users after first 25 go to waitlist
        NEW.beta_access := false;
        NEW.waitlist_position := user_count - 24; -- Start waitlist positions from 1
        NEW.credits := 0; -- No credits for waitlisted users
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_user_created ON profiles;

-- Create new trigger
CREATE TRIGGER on_user_created
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_onboarding();