import { supabase } from './supabase';

export const setupSupabase = async () => {
  try {
    // We'll skip automatic bucket creation since it requires admin privileges
    // Instead, create the bucket manually in the Supabase dashboard
    
    // Set up profiles table if needed
    const { error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (tableError?.code === '42P01') { // Table doesn't exist
      console.error('Profiles table does not exist. Please create it using the SQL migration.');
    }
  } catch (error) {
    console.error('Error setting up Supabase:', error);
  }
};
