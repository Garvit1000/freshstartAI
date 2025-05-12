import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const getUserProfile = async () => {
    try {
      if (!user) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits, beta_access, waitlist_position')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const updateCredits = async (newCredits) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (error) throw error;

      // Update localStorage
      const profileData = JSON.parse(localStorage.getItem('userProfile') || '{}');
      localStorage.setItem('userProfile', JSON.stringify({
        ...profileData,
        credits: newCredits
      }));

      return true;
    } catch (error) {
      console.error('Error updating credits:', error);
      return false;
    }
  };

  const value = {
    signUp: async (data) => {
      try {
        // Get current user count to determine beta access
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const isBetaUser = userCount < 25;
        const waitlistPosition = isBetaUser ? null : userCount - 24;

        const result = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              username: data.options?.data?.username,
              credits: 10,
              beta_access: isBetaUser,
              waitlist_position: waitlistPosition,
              onboarding_completed: false
            },
            emailRedirectTo: null,
            shouldCreateUser: true,
            emailConfirm: false
          }
        });

        if (result.error) {
          throw result.error;
        }

        // Wait briefly before attempting sign in
        await new Promise(resolve => setTimeout(resolve, 500));

        // Sign in after signup
        const signInResult = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });

        if (signInResult.error) {
          throw signInResult.error;
        }

        // Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        const session = await supabase.auth.getSession();
        
        if (!session.data.session) {
          throw new Error('Failed to establish session');
        }

        // Ensure profile is properly initialized
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: session.data.session.user.id,
            username: data.options?.data?.username,
            email: data.email,
            credits: 10,
            beta_access: isBetaUser,
            waitlist_position: waitlistPosition,
            updated_at: new Date().toISOString(),
            onboarding_completed: false
          });

        if (profileError) {
          console.error('Error initializing profile:', profileError);
        }

        return { data: session.data, error: null };
      } catch (error) {
        console.error('Auth error:', error);
        return { data: null, error };
      }
    },
    signIn: async (data) => {
      try {
        const { data: result, error } = await supabase.auth.signInWithPassword(data);
        if (error) return { error };

        // Check for waitlist status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('waitlist_position, beta_access, credits')
          .eq('id', result.user.id)
          .single();

        if (profileError) return { error: profileError };

        // Store user profile data in localStorage for easy access
        localStorage.setItem('userProfile', JSON.stringify({
          credits: profile.credits,
          betaAccess: profile.beta_access,
          waitlistPosition: profile.waitlist_position
        }));

        // Redirect to waitlist if user has a waitlist position and no beta access
        if (profile.waitlist_position && !profile.beta_access) {
          window.location.href = '/waitlist';
        }

        return { data: result, error: null };
      } catch (error) {
        console.error('Sign in error:', error);
        return { data: null, error };
      }
    },
    signOut: async () => {
      try {
        await supabase.auth.signOut()
        window.location.href = '/'
      } catch (error) {
        console.error('Error signing out:', error)
      }
    },
    user,
    getUserProfile,
    updateCredits,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
