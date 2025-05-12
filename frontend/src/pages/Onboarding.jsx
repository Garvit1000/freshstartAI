import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import OnboardingWizard from '@/components/OnboardingWizard';
import { X } from 'lucide-react';

const Onboarding = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBetaAccess = async () => {
      try {
        // Get count of profiles
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        if (error) throw error;

        // If more than 25 users, redirect to waitlist
        if (count >= 25) {
          window.location.href = '/waitlist';
        }
      } catch (error) {
        console.error('Error checking beta access:', error);
      } finally {
        setLoading(false);
      }
    };

    checkBetaAccess();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="p-6">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className="text-gray-800 font-bold text-xl font-poppins">
              <span className="text-[#2AB7CA]">Fresh</span>Start AI
            </span>
          </Link>
          
          <Link to="/" className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <OnboardingWizard />
      </main>
      
      <footer className="p-6">
        <div className="container mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} FreshStart AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Onboarding;