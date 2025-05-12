import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import FAQ from '@/components/FAQ';
import FeedbackForm from '@/components/FeedbackForm';
import Pricing from '@/components/Pricing';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#f7fdff] overflow-x-hidden">
      <Navbar />
      <Hero />
      
      {/* Subtle wave divider */}
      <div className="w-full overflow-hidden">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" className="w-full">
          <path fill="#E0F4FA" fillOpacity="0.5" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
        </svg>
      </div>
      
      <Features />
      
      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="bg-gradient-to-br from-[#E0F4FA] to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
              <h3 className="text-4xl font-bold text-[#2AB7CA] mb-2">1,000+</h3>
              <p className="text-gray-600 font-medium">Freshers Helped</p>
            </div>
            <div className="bg-gradient-to-br from-[#E0F4FA] to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
              <h3 className="text-4xl font-bold text-[#2AB7CA] mb-2">85%</h3>
              <p className="text-gray-600 font-medium">Interview Success Rate</p>
            </div>
            <div className="bg-gradient-to-br from-[#E0F4FA] to-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
              <h3 className="text-4xl font-bold text-[#2AB7CA] mb-2">14 Days</h3>
              <p className="text-gray-600 font-medium">Average Time to First Job</p>
            </div>
          </motion.div>
        </div>
      </section>
      
      <FAQ />
      
      {/* Fresher Wins Section with modern card design */}
      <section className="py-20 relative">
        {/* Background blob */}
        <div className="absolute -z-10 top-1/2 right-10 w-96 h-96 bg-[#E0F4FA] rounded-full opacity-50 blur-3xl"></div>
        
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 font-poppins">Fresher Wins</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
              Coming soon—real fresher successes! Be one of the first to share your story.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto border border-gray-100"
          >
            <FeedbackForm />
          </motion.div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <Pricing />
      
      {/* CTA Section with geometric shapes */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-[#E0F4FA] to-[#d5f0fa]">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#2AB7CA] rounded-full opacity-10"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#2AB7CA] rounded-full opacity-10"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#2AB7CA] rounded-full opacity-20"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-poppins">Ready to Start Your Career Journey?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 font-inter">
              Join thousands of freshers who are optimizing their job search with FreshStart AI.
            </p>
            <Link to="/onboarding">
              <Button className="bg-gradient-to-r from-[#2AB7CA] to-[#1aa5b7] text-white hover:from-[#1aa5b7] hover:to-[#159aa9] text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                Get Started Now — Free Beta Access
              </Button>
            </Link>
            <p className="mt-6 text-sm text-gray-500">No credit card required • Cancel anytime</p>
          </motion.div>
        </div>
      </section>
      
      {/* Footer with modern design */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <span className="text-gray-800 font-bold text-2xl font-poppins">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2AB7CA] to-[#36d1e6]">Fresh</span>Start AI
              </span>
              <p className="text-sm text-gray-600 mt-2 font-inter">
                Empowering freshers to land their first job
              </p>
              <div className="flex space-x-4 mt-4">
                <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-[#2AB7CA] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                </a>
                <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-[#2AB7CA] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-500 hover:text-[#2AB7CA]">Features</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-[#2AB7CA]">Testimonials</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-[#2AB7CA]">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-500 hover:text-[#2AB7CA]">Blog</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-[#2AB7CA]">Career Tips</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-[#2AB7CA]">Help Center</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-500 hover:text-[#2AB7CA]">About Us</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-[#2AB7CA]">Contact</a></li>
                  <li><a href="#" className="text-sm text-gray-500 hover:text-[#2AB7CA]">Careers</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 font-inter">
              &copy; {new Date().getFullYear()} FreshStart AI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-xs text-gray-500 hover:text-[#2AB7CA] font-inter">
                Privacy Policy
              </a>
              <a href="#" className="text-xs text-gray-500 hover:text-[#2AB7CA] font-inter">
                Terms of Service
              </a>
              <a href="#" className="text-xs text-gray-500 hover:text-[#2AB7CA] font-inter">
                Cookie Settings
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
