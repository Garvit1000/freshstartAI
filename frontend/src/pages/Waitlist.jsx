import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Waitlist = () => {
  const [waitlistInfo, setWaitlistInfo] = useState({
    position: null,
    totalWaitlist: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchWaitlistPosition = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Not authenticated');
        }

        // Get user's waitlist info
        const { data, error } = await supabase
          .from('profiles')
          .select('waitlist_position')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        // Get total number of people in waitlist
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('waitlist_position', { count: 'exact' })
          .not('waitlist_position', 'is', null);

        if (countError) throw countError;

        setWaitlistInfo({
          position: data.waitlist_position,
          totalWaitlist: count,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching waitlist position:', error);
        setWaitlistInfo(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchWaitlistPosition();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="p-6">
        <div className="container mx-auto">
          <Link to="/" className="flex items-center">
            <span className="text-gray-800 font-bold text-xl font-poppins">
              <span className="text-[#2AB7CA]">Fresh</span>Start AI
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="space-y-3">
            <div className="text-center">
              <span className="font-bold text-xl font-poppins">
                <span className="text-[#2AB7CA]">Fresh</span>Start AI
              </span>
            </div>
            <CardTitle className="text-center">You're on the Waitlist!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {waitlistInfo.loading ? (
              <div className="text-center">Loading your position...</div>
            ) : waitlistInfo.error ? (
              <div className="text-red-500 text-center">{waitlistInfo.error}</div>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-[#2AB7CA]">
                    #{waitlistInfo.position}
                  </div>
                  <p className="text-gray-600">
                    Your position in line
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">
                    There are currently <span className="font-bold">{waitlistInfo.totalWaitlist}</span> people 
                    waiting to get access to FreshStart AI.
                  </p>
                </div>
                <div className="text-center text-sm text-gray-500">
                  We'll notify you when it's your turn to join!
                </div>
              </>
            )}
            <Button
              className="w-full bg-[#2AB7CA] hover:bg-[#2AB7CA]/90"
              asChild
            >
              <Link to="/">
                Return Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="p-6">
        <div className="container mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} FreshStart AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Waitlist;