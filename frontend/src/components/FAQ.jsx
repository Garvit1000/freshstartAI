
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqItems = [
    {
      question: "Why is this better than LinkedIn AI?",
      answer: "Unlike LinkedIn AI, FreshStart is specifically designed for early-career professionals with no experience. We focus on transferable skills from academic projects, internships, and extracurriculars that general AI tools might miss."
    },
    {
      question: "How does the Skill Evolution Tracker work?",
      answer: "Our AI analyzes job descriptions to identify key skills, then compares them with your resume to find gaps. It then recommends targeted free or affordable resources to help you develop those exact skills employers are looking for."
    },
    {
      question: "Is FreshStart AI free?",
      answer: "We currently offer a free beta access program with limited features. Our full platform will launch with both free and premium tiers, with special discounts for students and recent graduates."
    },
    {
      question: "Can FreshStart AI help me with technical roles?",
      answer: "Absolutely! We support optimization for both technical and non-technical roles across various industries, including software development, data science, marketing, design, and more."
    },
    {
      question: "How accurate are the job market insights?",
      answer: "Our real-time job insights are gathered from analyzing thousands of entry-level job postings weekly, giving you up-to-date information on in-demand skills and realistic salary expectations for freshers in your field."
    }
  ];

  return (
    <section className="py-16 bg-[#F8FBFC]" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 font-poppins">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-inter">
            Everything you need to know about optimizing your job search as a fresher
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 shadow-sm">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium text-lg py-4 font-poppins">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4 font-inter">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 font-inter">
            Have more questions? <a href="#" className="text-[#2AB7CA] font-medium hover:underline">Contact our support team</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
