import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Layout,
  FileText,
  Mail,
  Linkedin,
  BarChart,
  MessageSquare,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const MobileSidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
      navigate("/", { replace: true });
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("supabase.auth.refresh_token");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  const navItems = [
    { name: "Dashboard", icon: Layout, path: "/dashboard" },
    { name: "LinkedIn", icon: Linkedin, path: "/dashboard/linkedin" },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const hamburger = document.getElementById("hamburger-button");
      if (
        isOpen &&
        sidebar &&
        !sidebar.contains(event.target) &&
        !hamburger.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        id="hamburger-button"
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-[#25A3B4] text-white hover:bg-[#25A3B4]/90"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        id="mobile-sidebar"
        className={`fixed top-0 right-0 w-64 h-screen bg-[#25A3B4] transform transition-transform duration-300 ease
          ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col z-40`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <Link to="/" className="flex items-center">
            <span className="font-poppins font-bold text-xl">
              <span className="text-white">Fresh</span>
              <span className="text-white/90">Start AI</span>
            </span>
          </Link>
        </div>

        {/* Navigation - Compact layout */}
        <div className="flex-1 overflow-y-auto p-3">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-3 py-2 text-white hover:bg-[#25A3B4]/90 rounded-lg transition-colors mb-1"
            >
              <item.icon size={16} className="mr-2" />
              <span className="font-inter text-sm">{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Footer - Sticky at Bottom with less padding */}
        <div className="p-4 border-t border-white/10 bg-[#25A3B4]">
          <div className="flex items-center mb-3">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-[#25A3B4] mr-2">
              <User size={14} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {loading
                  ? "Loading..."
                  : user?.user_metadata?.username || "User"}
              </p>
              <p className="text-xs text-white/80">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center bg-white hover:bg-white/90 border-white text-[#25A3B4] py-1 h-auto text-sm"
            onClick={handleSignOut}
          >
            <LogOut size={14} className="mr-2" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30"></div>
      )}
    </div>
  );
};

export default MobileSidebar;
