import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Linkedin, Sparkles, Copy, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

const LinkedInOptimization = () => {
  const [headlineInput, setHeadlineInput] = useState("");
  const [aboutInput, setAboutInput] = useState("");
  const [optimizedHeadline, setOptimizedHeadline] = useState("");
  const [optimizedAbout, setOptimizedAbout] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedHeadline, setCopiedHeadline] = useState(false);
  const [copiedAbout, setCopiedAbout] = useState(false);
  const [credits, setCredits] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "headline") {
        setCopiedHeadline(true);
        setTimeout(() => setCopiedHeadline(false), 2000);
      } else {
        setCopiedAbout(true);
        setTimeout(() => setCopiedAbout(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard.`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying manually.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setCredits(profile.credits || 0);
      } catch (error) {
        console.error("Error fetching credits:", error);
        toast({
          title: "Error",
          description: "Failed to fetch credits",
          variant: "destructive",
        });
      }
    };

    fetchCredits();
  }, [user]);

  const handleCreditDeduction = async () => {
    if (credits <= 0) {
      toast({
        title: "No credits",
        description: "You need credits to optimize your LinkedIn profile",
        variant: "destructive",
      });
      return false;
    }

    try {
      const newCredits = credits - 1;
      const { error } = await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", user.id);

      if (error) throw error;
      setCredits(newCredits);
      return true;
    } catch (error) {
      console.error("Error updating credits:", error);
      toast({
        title: "Error",
        description: "Failed to update credits",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleOptimizeHeadline = async () => {
    if (credits <= 0) {
      toast({
        title: "No credits",
        description: "You need credits to optimize your LinkedIn profile",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        "https://freshstartai.onrender.com/api/linkedin/optimize-headline",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentHeadline: headlineInput }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to optimize headline");
      }

      if (!(await handleCreditDeduction())) {
        throw new Error("Failed to deduct credits");
      }

      setOptimizedHeadline(data.optimizedHeadline);
      toast({
        title: "Success!",
        description: "Your headline has been optimized.",
      });
    } catch (error) {
      console.error("Error optimizing headline:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to optimize headline",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeAbout = async () => {
    if (credits <= 0) {
      toast({
        title: "No credits",
        description: "You need credits to optimize your LinkedIn profile",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        "https://freshstartai.onrender.com/api/linkedin/optimize-about",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentAbout: aboutInput }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to optimize about section");
      }

      if (!(await handleCreditDeduction())) {
        throw new Error("Failed to deduct credits");
      }

      setOptimizedAbout(data.optimizedAbout);
      toast({
        title: "Success!",
        description: "Your about section has been optimized.",
      });
    } catch (error) {
      console.error("Error optimizing about section:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to optimize about section",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            LinkedIn Optimization
          </h1>
          <p className="text-gray-500 mt-2">
            Enhance your LinkedIn profile with AI-powered optimization
          </p>
          <div className="mt-2 flex items-center">
            <span
              className={`text-sm font-medium ${credits > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {credits} credits remaining
            </span>
            {credits <= 0 && (
              <div className="ml-2 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Contact support for more credits
              </div>
            )}
          </div>
        </div>
        <Linkedin className="h-10 w-10 text-[#0A66C2]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Headline Optimization */}
        <Card>
          <CardHeader>
            <CardTitle>Headline Optimization</CardTitle>
            <CardDescription>
              Make your headline stand out and attract more profile views
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Headline
              </label>
              <Input
                placeholder="Enter your current LinkedIn headline"
                value={headlineInput}
                onChange={(e) => setHeadlineInput(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleOptimizeHeadline}
              disabled={!headlineInput || loading || credits <= 0}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading
                ? "Optimizing..."
                : `Optimize Headline (${credits} credits)`}
            </Button>
            {optimizedHeadline && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Optimized Headline
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(optimizedHeadline, "headline")}
                  >
                    {copiedHeadline ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {optimizedHeadline}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* About Section Optimization */}
        <Card>
          <CardHeader>
            <CardTitle>About Section Optimization</CardTitle>
            <CardDescription>
              Create a compelling about section that showcases your expertise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current About Section
              </label>
              <Textarea
                placeholder="Enter your current LinkedIn about section"
                value={aboutInput}
                onChange={(e) => setAboutInput(e.target.value)}
                className="w-full min-h-[150px]"
              />
            </div>
            <Button
              onClick={handleOptimizeAbout}
              disabled={!aboutInput || loading || credits <= 0}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading
                ? "Optimizing..."
                : `Optimize About Section (${credits} credits)`}
            </Button>
            {optimizedAbout && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Optimized About Section
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(optimizedAbout, "about")}
                  >
                    {copiedAbout ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap">
                  {optimizedAbout}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LinkedInOptimization;
