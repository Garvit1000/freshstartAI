import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
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
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const DashboardSidebar = () => {
  const { isOpen, toggle } = useSidebar();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      // Sign out from Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      // Remove user data from state
      setUser(null);

      // Navigate to home page
      navigate("/", { replace: true });

      // Clear any stored session data
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("supabase.auth.refresh_token");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  const navItems = [
    { name: "Dashboard", icon: Layout, path: "/dashboard" },
    // { name: "Optimize Resume", icon: FileText, path: "/dashboard/resume" },
    // { name: 'Email Templates', icon: Mail, path: '/dashboard/templates' },
    { name: "LinkedIn", icon: Linkedin, path: "/dashboard/linkedin" },
    // { name: 'Analytics', icon: BarChart, path: '/dashboard/analytics' },
    // { name: 'AI Chat', icon: MessageSquare, path: '/dashboard/chat' }
  ];

  return (
    <Sidebar
      variant="sidebar"
      className="border-r border-gray-100 bg-[#25A3B4]"
    >
      <SidebarContent className="py-6">
        <div className="px-6 mb-6">
          <Link to="/" className="flex items-center">
            <span className="font-poppins font-bold text-xl">
              <span className="text-white">Fresh</span>
              <span className="text-white/90">Start AI</span>
            </span>
          </Link>
        </div>

        <SidebarMenu>
          {navItems.map((item, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton asChild>
                <Link
                  to={item.path}
                  className="flex items-center px-6 py-3 text-white hover:bg-[#25A3B4]/90 transition-colors"
                >
                  <item.icon size={18} className="mr-3" />
                  <span className="font-inter">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-gray-100">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#25A3B4] mr-3">
            <User size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {loading ? "Loading..." : user?.user_metadata?.username || "User"}
            </p>
            <p className="text-xs text-white/80">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center bg-white hover:bg-white/90 border-white text-[#25A3B4]"
          onClick={handleSignOut}
        >
          <LogOut size={16} className="mr-2" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
