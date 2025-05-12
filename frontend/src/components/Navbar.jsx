import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { LoginDialog } from "./LoginDialog";
import { useAuth } from "../context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLoginSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <nav className="w-full py-4 bg-white shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <span className="text-gray-800 font-bold text-xl font-poppins">
            <span className="text-[#2AB7CA]">Fresh</span>Start AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className="text-gray-800 hover:text-[#2AB7CA] transition-colors font-inter"
          >
            Home
          </Link>
          <a
            href="#features"
            className="text-gray-800 hover:text-[#2AB7CA] transition-colors font-inter"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-gray-800 hover:text-[#2AB7CA] transition-colors font-inter"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-gray-800 hover:text-[#2AB7CA] transition-colors font-inter"
          >
            FAQ
          </a>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <User className="h-5 w-5 text-[#2AB7CA]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="outline"
                className="border-[#2AB7CA] text-[#2AB7CA] hover:bg-[#2AB7CA]/10 font-inter"
                onClick={() => setIsLoginOpen(true)}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <Link to="/onboarding">
                <Button className="bg-[#2AB7CA] text-white hover:bg-[#2AB7CA]/90 font-inter">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation Toggle */}
        <button
          className="md:hidden text-gray-800"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg z-50 animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link
              to="/"
              className="text-gray-800 hover:text-[#2AB7CA] transition-colors p-2 font-inter"
            >
              Home
            </Link>
            <a
              href="#features"
              className="text-gray-800 hover:text-[#2AB7CA] transition-colors p-2 font-inter"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-gray-800 hover:text-[#2AB7CA] transition-colors p-2 font-inter"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-gray-800 hover:text-[#2AB7CA] transition-colors p-2 font-inter"
            >
              FAQ
            </a>
            {user ? (
              <>
                <Button
                  variant="outline"
                  className="w-full border-[#2AB7CA] text-[#2AB7CA] hover:bg-[#2AB7CA]/10"
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-500 text-red-500 hover:bg-red-50"
                  onClick={signOut}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <div className="p-2">
                  <Button
                    variant="outline"
                    className="w-full border-[#2AB7CA] text-[#2AB7CA] hover:bg-[#2AB7CA]/10 font-inter"
                    onClick={() => setIsLoginOpen(true)}
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
                <Link to="/onboarding" className="p-2">
                  <Button className="w-full bg-[#2AB7CA] text-white hover:bg-[#2AB7CA]/90 font-inter">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </nav>
  );
};

export default Navbar;
