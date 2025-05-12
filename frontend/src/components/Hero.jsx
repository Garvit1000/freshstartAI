import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#E0F4FA] to-[#f7fdff] pt-20 pb-24">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-0 right-0 w-72 h-72 bg-[#2AB7CA] rounded-full opacity-5"
        initial={{ x: 200, y: -100 }}
        animate={{ x: 160, y: -80 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      ></motion.div>
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-[#2AB7CA] rounded-full opacity-10"
        initial={{ x: -100, y: 100 }}
        animate={{ x: -80, y: 80 }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      ></motion.div>
      <motion.div
        className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#2AB7CA] rounded-full opacity-10"
        initial={{ scale: 1 }}
        animate={{ scale: 1.2 }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      ></motion.div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          {/* Hero Text */}
          <motion.div
            className="md:w-1/2 text-center md:text-left md:pr-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1 bg-white bg-opacity-60 rounded-full text-[#2AB7CA] text-sm font-medium mb-6 shadow-sm backdrop-blur-sm">
              🚀 Now in Beta • Limited Free Access
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6 font-poppins">
              Land Your First Job{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2AB7CA] to-[#36d1e6]">
                Faster
              </span>{" "}
              with AI
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 font-inter max-w-lg mx-auto md:mx-0">
              Optimize your resume, cover letter, and LinkedIn—built
              specifically for freshers entering the job market!
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
              <Link to="/onboarding">
                <Button className="bg-gradient-to-r from-[#2AB7CA] to-[#1aa5b7] text-white hover:shadow-lg transition-all duration-300 px-8 py-6 rounded-full text-lg font-medium w-full sm:w-auto">
                  Join the Beta—Free Access!
                </Button>
              </Link>
              <a href="#pricing">
                <Button
                  variant="outline"
                  className="border-[#2AB7CA] text-gray-700 hover:bg-[#2AB7CA]/10 px-8 py-6 rounded-full text-lg font-medium w-full sm:w-auto backdrop-blur-sm bg-white bg-opacity-50"
                >
                  Learn More
                </Button>
              </a>
            </div>
            <div className="mt-10 flex items-center justify-center md:justify-start">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
                  >
                    <img
                      src={`https://randomuser.me/api/portraits/men/${20 + i}.jpg`}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#2AB7CA] flex items-center justify-center text-xs text-white font-medium">
                  +
                </div>
              </div>
              <div className="ml-3 text-sm text-gray-500">
                <span className="font-semibold text-gray-700">1,000+</span>{" "}
                freshers already getting results
              </div>
            </div>
          </motion.div>

          {/* Hero Image/Mockup */}
          <motion.div
            className="md:w-1/2 mt-12 md:mt-0 relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative max-w-full">
              <div className="absolute -right-6 -bottom-6 w-full h-full bg-gradient-to-br from-[#2AB7CA]/30 to-[#36d1e6]/20 rounded-xl blur-sm"></div>
              <div className="absolute -left-2 -top-2 w-24 h-24 bg-[#2AB7CA]/20 rounded-full blur-md"></div>

              {/* Main dashboard image */}
              <div className="relative bg-white p-2 rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
                  alt="FreshStart AI Dashboard"
                  className="rounded-lg w-full"
                />

                {/* Floating elements */}
                <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>

                <motion.div
                  className="absolute right-0 top-1/4 bg-white py-2 px-4 rounded-lg shadow-lg flex items-center"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs font-medium">Resume optimized!</span>
                </motion.div>

                <motion.div
                  className="absolute left-0 bottom-1/3 bg-white py-2 px-4 rounded-lg shadow-lg flex items-center"
                  initial={{ x: -80, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-xs font-medium">Interview ready!</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
