
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Lightbulb, Clock } from 'lucide-react';

const Features = () => {
  const features = [
    {
      title: 'Resume Optimization with Fresher Templates',
      description: 'Tailor your resume to job descriptions with our AI assistant designed specifically for early-career professionals.',
      icon: FileText,
    },
    {
      title: 'Skill Evolution Tracker',
      description: 'Identify skill gaps between your resume and job requirements, with personalized recommendations to upskill.',
      icon: Lightbulb,
    },
    {
      title: 'Real-Time Job Insights',
      description: 'Get market insights on industry trends and salary expectations for entry-level positions in your field.',
      icon: Clock,
    },
  ];

  return (
    <section className="py-16 bg-white" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 font-poppins">Built for Fresh Graduates</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
            Our AI-powered tools are specifically designed to help freshers overcome the "no experience" challenge and land their first professional role.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border border-gray-100 hover:border-[#2AB7CA] transition-colors shadow-sm">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 text-[#2AB7CA] bg-white p-2 rounded-full shadow-md mb-4">
                  <feature.icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-xl font-semibold font-poppins">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 font-inter">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="p-6 bg-[#E0F4FA] rounded-lg max-w-3xl mx-auto">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800 font-poppins">Ready in just 3 steps</h3>
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex flex-col items-center mb-6 md:mb-0">
                <div className="w-12 h-12 rounded-full bg-[#2AB7CA] text-white flex items-center justify-center font-bold text-lg mb-2">1</div>
                <p className="font-medium font-inter">Create Account</p>
              </div>
              <div className="w-12 h-1 bg-[#2AB7CA] hidden md:block mt-6"></div>
              <div className="flex flex-col items-center mb-6 md:mb-0">
                <div className="w-12 h-12 rounded-full bg-[#2AB7CA] text-white flex items-center justify-center font-bold text-lg mb-2">2</div>
                <p className="font-medium font-inter">Upload Resume</p>
              </div>
              <div className="w-12 h-1 bg-[#2AB7CA] hidden md:block mt-6"></div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#2AB7CA] text-white flex items-center justify-center font-bold text-lg mb-2">3</div>
                <p className="font-medium font-inter">Get Optimized</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
