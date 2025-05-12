import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PricingTier = ({
  title,
  price,
  description,
  features,
  recommended = false,
  ctaText = "Get Started",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative flex flex-col p-6 bg-white rounded-2xl shadow-md border ${
        recommended ? "border-[#2AB7CA]" : "border-gray-200"
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-[#2AB7CA] text-white text-xs font-semibold rounded-full">
          Recommended
        </div>
      )}
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        <div className="flex items-baseline mb-4">
          <span className="text-3xl font-bold text-gray-900">${price}</span>
          {price > 0 && <span className="text-gray-500 ml-1">/month</span>}
        </div>
      </div>

      <ul className="mb-6 space-y-2 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="h-5 w-5 text-[#2AB7CA] mr-2 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-600 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Link to="/onboarding" className="mt-auto">
        <Button
          className={`w-full ${
            recommended
              ? "bg-[#2AB7CA] hover:bg-[#1aa5b7] text-white"
              : "bg-white text-[#2AB7CA] border border-[#2AB7CA] hover:bg-[#f7fdff]"
          }`}
        >
          {ctaText}
        </Button>
      </Link>
    </motion.div>
  );
};

const Pricing = () => {
  const pricingTiers = [
    {
      title: "Free",
      price: 0,
      description: "Perfect for getting started",
      features: [
        "Basic Resume Analysis",
        "Limited AI Template Suggestions",
        "1 Resume Version",
        "Email Support",
      ],
      ctaText: "Start for Free",
    },
    {
      title: "Pro",
      price: 5,
      description: "For serious job seekers",
      features: [
        "Advanced Resume Analysis",
        "Unlimited AI Template Suggestions",
        "5 Resume Versions",
        "Job Match Recommendations",
        "Priority Email Support",
      ],
      recommended: true,
    },
    {
      title: "Premium",
      price: 10,
      description: "For maximum advantage",
      features: [
        "All Pro Features",
        "Mock Interview AI Practice",
        "Unlimited Resume Versions",
        "Advanced Skill Gap Analysis",
        "24/7 Priority Support",
        "Personal Career Coach Consultation",
      ],
    },
  ];

  return (
    <section className="py-20 relative" id="pricing">
      {/* Background elements */}
      <div className="absolute -z-10 top-20 left-0 w-72 h-72 bg-[#E0F4FA] rounded-full opacity-40 blur-3xl"></div>
      <div className="absolute -z-10 bottom-20 right-0 w-80 h-80 bg-[#E0F4FA] rounded-full opacity-40 blur-3xl"></div>

      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-poppins">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 font-inter">
              Choose the plan that works best for your needs, with no hidden
              fees or long-term commitments.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <PricingTier key={index} {...tier} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500">
            All plans include a 7-day free trial. No credit card required to
            start.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
