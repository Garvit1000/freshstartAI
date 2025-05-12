import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileCheck,
  Upload,
  FileText,
  Lightbulb,
  Linkedin,
  BarChart as ChartBar,
  Mail,
  Loader2,
} from "lucide-react";
import FeedbackForm from "./FeedbackForm";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Typography, Grid, Paper } from "@mui/material";

const DashboardMain = () => {
  const [isEditingOptimized, setIsEditingOptimized] = useState(false);
  const [transparencyMode, setTransparencyMode] = useState(false);
  const [userName, setUserName] = useState("User");
  const [credits, setCredits] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [optimizedText, setOptimizedText] = useState("");
  const [editableOptimizedText, setEditableOptimizedText] = useState("");
  const [skillGaps, setSkillGaps] = useState(null);
  const [error, setError] = useState(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [transparencyInsights, setTransparencyInsights] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const { user, updateCredits } = useAuth();
  const navigate = useNavigate();
  const [atsScores, setAtsScores] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const handleCreditDeduction = async () => {
    if (credits <= 0) {
      setShowCreditWarning(true);
      setError(
        "You don't have enough credits to optimize your resume. Please contact support.",
      );
      return false;
    }
    try {
      const newCredits = credits - 1;
      const { data: profile, error } = await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", user.id);

      if (error) throw error;
      setCredits(newCredits);
      setShowCreditWarning(false);
      return true;
    } catch (error) {
      console.error("Error updating credits:", error);
      setError("Failed to update credits. Please try again.");
      return false;
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const checkWaitlistStatus = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("waitlist_position")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // If user has waitlist position, redirect to waitlist
        if (profile.waitlist_position) {
          navigate("/waitlist");
        }
      } catch (error) {
        console.error("Error checking waitlist status:", error);
      }
    };

    const fetchUserData = async () => {
      if (!user) {
        setIsLoading(false);
        setIsDataLoaded(false);
        return;
      }

      try {
        // First try to get username from auth metadata
        if (user.user_metadata?.username) {
          setUserName(user.user_metadata.username);
        } else if (user.email) {
          // Fallback to email username if no metadata
          setUserName(user.email.split("@")[0]);
        }

        // Get profile data including credits
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("username, email, credits, beta_access, waitlist_position")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Profile fetch error:", error);
          // Don't throw error here, just log it and continue with defaults
        } else {
          // Update username if profile has one
          if (profile?.username) {
            setUserName(profile.username);
          }

          // Set credits from profile or default to 10 for new users
          setCredits(profile?.credits ?? 10);

          // Check access
          if (profile?.waitlist_position && !profile?.beta_access) {
            navigate("/waitlist");
            return;
          }
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
        // Don't set error message here since we already have a username
      } finally {
        setIsLoading(false);
        setIsDataLoaded(true);
      }
    };

    const fetchTemplates = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/resume-templates",
        );
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates);
        } else {
          console.error("Failed to fetch templates");
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };

    fetchUserData();
    fetchTemplates();
  }, [user, navigate]);

  // Template card component
  const TemplateCard = ({ template, isSelected, onSelect }) => {
    const { id, name, description } = template;

    return (
      <div
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected
            ? "border-[#2AB7CA] bg-[#E0F4FA]/30 shadow-md"
            : "border-gray-200 hover:border-[#2AB7CA]/50 hover:bg-gray-50"
        }`}
        onClick={() => onSelect(id)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-800">{name}</h3>
          {isSelected && (
            <div className="bg-[#2AB7CA] rounded-full w-4 h-4 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600">{description}</p>

        {/* Template preview - simplified representation */}
        <div className="mt-3 h-24 bg-white border border-gray-200 rounded overflow-hidden">
          <div className={`h-6 ${getTemplatePreviewColor(id)}`}></div>
          <div className="p-2">
            <div className="w-3/4 h-2 bg-gray-200 rounded mb-2"></div>
            <div className="w-1/2 h-2 bg-gray-200 rounded mb-1"></div>
            <div className="w-3/5 h-2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function for template preview colors
  const getTemplatePreviewColor = (template) => {
    const colors = {
      classic: "bg-gray-700",
      professional: "bg-blue-800",
      modern: "bg-teal-600",
      tech: "bg-cyan-600",
      minimalist: "bg-gray-300",
    };
    return colors[template] || "bg-blue-800";
  };

  // Handler for starting edit mode
  const handleStartEditing = async () => {
    if (credits <= 0) {
      setError(
        "You don't have enough credits to optimize your resume. Please contact support to get more credits.",
      );
      return;
    }
    console.log("Starting edit mode");
    setEditableOptimizedText(optimizedText);
    setIsEditingOptimized(true);
    // Focus will happen after the component renders with the editable content
    setTimeout(() => {
      const editableDiv = document.querySelector(".resume-editable");
      if (editableDiv) {
        editableDiv.focus();
        // Place cursor at the end
        const range = document.createRange();
        range.selectNodeContents(editableDiv);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, 100);
  };

  // Handler for saving edits
  const handleSaveEdits = async () => {
    console.log("Saving edits with direct approach");

    // Ensure we preserve newlines properly
    let processedText = editableOptimizedText;

    // Update local state first
    setIsEditingOptimized(false);

    // Show saving indicator
    setIsOptimizing(true);
    setError("Generating updated PDF with your edits...");

    // Update the resume on the backend with edited content
    if (selectedFile && jobDescription) {
      try {
        if (credits <= 0) {
          throw new Error(
            "You don't have enough credits to optimize your resume. Please contact support to get more credits.",
          );
        }

        // Create form data with all necessary information
        const formData = new FormData();
        formData.append("resume", selectedFile);
        formData.append("jobDescription", jobDescription);
        formData.append("template", selectedTemplate);
        formData.append("customText", processedText);

        // Use the direct PDF generation endpoint

        const response = await fetch(
          "http://localhost:3000/api/generate-direct-pdf",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to update resume: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Server response:", data);

        // Update local state with processed text
        setOptimizedText(processedText);

        // Handle ATS scores update
        if (data.atsScores) {
          console.log("Received ATS scores:", data.atsScores);
          setAtsScores(data.atsScores);
        }

        // Indicate PDF is ready
        setPdfReady(true);

        // Deduct credit and update state
        const newCredits = credits - 1;
        await supabase
          .from("profiles")
          .update({ credits: newCredits })
          .eq("id", user.id);
        setCredits(newCredits);

        // Clear error state and show success message
        setError(null);
        alert(
          "Resume optimized successfully! 1 credit has been deducted. You can now download the PDF.",
        );
      } catch (err) {
        console.error("Error updating resume:", err);
        setIsOptimizing(false);
        setOptimizedText(processedText); // Still update the displayed text
        setError("Error updating resume: " + err.message);
      } finally {
        setIsOptimizing(false);
      }
    } else {
      // Just update local state if we don't have a file or job description
      setOptimizedText(processedText);
      setIsOptimizing(false);
    }
  };

  // Handler for canceling edits
  const handleCancelEdits = () => {
    console.log("Canceling edits");
    setEditableOptimizedText(optimizedText);
    setIsEditingOptimized(false);
    console.log("isEditingOptimized set to:", false);
  };

  // ATS Score Card Component with improvement indicator
  const ATSScoreCard = ({ title, score, description, improvement }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="flex items-center">
          <div
            className={`text-lg font-bold ${score >= 70 ? "text-green-600" : "text-orange-500"}`}
          >
            {Math.round(score)}%
          </div>
          {improvement !== undefined && (
            <div
              className={`ml-2 text-sm font-medium ${improvement >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {improvement > 0 ? "+" : ""}
              {Math.round(improvement)}%
            </div>
          )}
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${score >= 70 ? "bg-green-600" : "bg-orange-500"}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );

  // Keywords List Component
  const KeywordsList = ({ title, keywords, type = "success" }) => {
    if (!keywords || keywords.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
              }`}
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ATS improvement areas and strengths component
  // Credit display component
  const CreditDisplay = ({ credits }) => (
    <div className="flex items-center gap-2 bg-cyan-50 rounded-lg px-3 py-1.5 shadow-sm border border-cyan-200">
      <span className="text-sm font-medium text-gray-700">Credits:</span>
      <span
        className={`text-sm font-bold ${credits > 0 ? "text-cyan-600" : "text-red-600"}`}
      >
        {credits}
      </span>
    </div>
  );

  const ATSDetailsList = ({ title, items, type }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
        <div className="max-h-40 overflow-y-auto">
          <ul className="list-disc list-inside text-sm space-y-2">
            {items.map((item, index) => (
              <li
                key={index}
                className={
                  type === "improvement" ? "text-orange-600" : "text-green-600"
                }
              >
                <span className="font-medium">
                  {item.area || item.title || ""}
                </span>
                {item.description && (
                  <span className="text-gray-600 ml-1">
                    : {item.description}
                  </span>
                )}
                {item.importance && (
                  <span className="text-gray-400 ml-1">
                    (Priority: {item.importance}/5)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Optimize resume button click handler
  const handleOptimizeResume = async () => {
    try {
      const hasCredits = await handleCreditDeduction();
      if (!hasCredits) return;

      setIsOptimizing(true);
      setError(null);
      setPdfReady(false);

      const formData = new FormData();
      formData.append("resume", selectedFile);
      formData.append("jobDescription", jobDescription);
      formData.append("template", selectedTemplate);
      formData.append("transparencyMode", transparencyMode);

      const response = await fetch(
        "http://localhost:3000/api/optimize-resume",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to optimize resume");
      }

      const data = await response.json();
      setOriginalText(data.originalText);
      setOptimizedText(data.optimizedText.optimizedText || data.optimizedText);
      setEditableOptimizedText(
        data.optimizedText.optimizedText || data.optimizedText,
      ); // Initialize editable text with optimized text
      setSkillGaps(data.skillGaps);
      setAtsScores(data.atsScores);
      setPdfReady(data.pdfReady);
      if (data.transparencyInsights) {
        setTransparencyInsights(data.transparencyInsights);
      }
      setSuccessMessage("Resume optimized successfully!");
    } catch (err) {
      setError(err.message);
      console.error("Error optimizing resume:", err);
      // Restore credit if optimization failed
      const { error: creditError } = await supabase
        .from("profiles")
        .update({ credits: credits + 1 })
        .eq("id", user.id);
      if (creditError) {
        console.error("Error restoring credit:", creditError);
      } else {
        setCredits(credits + 1);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  // Download PDF function
  const downloadPDF = async () => {
    try {
      // Simple approach - just redirect to the download endpoint
      window.location.href = "http://localhost:3000/api/download-pdf";
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setError("Failed to download PDF: " + error.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-full overflow-x-hidden">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
            <div className="absolute inset-0 animate-pulse bg-cyan-500/20 rounded-full"></div>
          </div>
          <span className="text-cyan-500 font-medium text-lg">
            Loading your dashboard
          </span>
          <span className="text-cyan-400/80 text-sm">
            Please wait a moment...
          </span>
        </div>
      ) : !isDataLoaded ? (
        <div className="text-center text-red-500 min-h-[400px] flex flex-col items-center justify-center">
          <p className="mb-4">Failed to load user data.</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            Refresh Page
          </Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="font-poppins text-2xl md:text-3xl font-bold text-gray-800">
                Welcome, {userName}!
              </h1>
              <p className="text-gray-600 font-inter mt-1">
                Let's land your first job faster.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center mt-4 md:mt-0 gap-3">
              <CreditDisplay credits={credits} />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Transparency Mode
                </span>
                <Switch
                  checked={transparencyMode}
                  onCheckedChange={setTransparencyMode}
                  className="bg-gray-200 data-[state=checked]:bg-[#2AB7CA]"
                />
              </div>
              <div className="w-full sm:w-auto">
                <FeedbackForm />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Welcome Card */}
      <Card className="mb-8 bg-white shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="font-poppins text-xl font-bold text-gray-800 mb-2">
                Let's optimize your job application
              </h2>
              <p className="text-gray-600 font-inter">
                Upload your resume and job description to get started.
                {credits <= 0 && (
                  <span className="text-red-500 block mt-1">
                    You need credits to optimize your resume. Please contact
                    support for more credits.
                  </span>
                )}
                {credits > 0 && (
                  <span className="text-green-600 block mt-1">
                    You have {credits} optimization credits available.
                  </span>
                )}
              </p>
            </div>
            <Button
              className="bg-[#2AB7CA] hover:bg-[#2AB7CA]/90"
              disabled={credits <= 0}
            >
              {isOptimizing
                ? "Optimizing..."
                : `Optimize Resume ${credits > 0 ? `(${credits} credits)` : ""}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="resume" className="w-full">
        {/* <TabsList className="grid grid-cols-3 mb-8 bg-gray-100">
          <TabsTrigger
            value="resume"
            className="data-[state=active]:bg-[#2AB7CA] data-[state=active]:text-white"
          >
            Resume
          </TabsTrigger> */}
        {/* Commented out Cover Letter Tab
          <TabsTrigger
            value="cover-letter"
            className="data-[state=active]:bg-[#2AB7CA] data-[state=active]:text-white"
          >
            Cover Letter
          </TabsTrigger>
          */}
        {/* Commented out LinkedIn Tab
          <TabsTrigger
            value="linkedin"
            className="data-[state=active]:bg-[#2AB7CA] data-[state=active]:text-white"
          >
            LinkedIn
          </TabsTrigger>
          */}
        {/* </TabsList> */}

        {/* Resume Tab */}
        <TabsContent value="resume" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="shadow-sm border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-poppins">
                  <Upload className="w-5 h-5 mr-2 text-[#2AB7CA]" />
                  Upload Your Resume
                </CardTitle>
                <CardDescription className="font-inter">
                  Upload your current resume to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#2AB7CA]/50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file?.type === "application/pdf") {
                      setSelectedFile(file);
                    } else {
                      setError("Please upload a PDF file");
                    }
                  }}
                >
                  {selectedFile ? (
                    <>
                      <FileCheck className="w-12 h-12 mx-auto text-[#2AB7CA] mb-4" />
                      <p className="text-gray-600 mb-4 font-inter">
                        {selectedFile.name}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setOriginalText("");
                        }}
                      >
                        Remove File
                      </Button>
                    </>
                  ) : (
                    <>
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4 font-inter">
                        Drag and drop your resume here or
                      </p>
                      <Button
                        className="bg-[#2AB7CA] hover:bg-[#2AB7CA]/90"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "application/pdf";
                          input.onchange = async (e) => {
                            const file = e.target.files[0];
                            if (file?.type === "application/pdf") {
                              setSelectedFile(file);
                            } else {
                              setError("Please upload a PDF file");
                            }
                          };
                          input.click();
                        }}
                      >
                        Browse Files
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-poppins">
                  <FileCheck className="w-5 h-5 mr-2 text-[#2AB7CA]" />
                  Job Description
                </CardTitle>
                <CardDescription className="font-inter">
                  Paste the job description you're applying for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste job description here..."
                  className="min-h-[200px] font-inter resize-none border-gray-200 focus-visible:ring-[#2AB7CA]"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-[#2AB7CA] hover:bg-[#2AB7CA]/90"
                  disabled={!selectedFile || !jobDescription || isOptimizing}
                  onClick={handleOptimizeResume}
                >
                  {isOptimizing ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Optimizing</span>
                        <span className="animate-pulse">...</span>
                      </div>
                    </>
                  ) : (
                    "Optimize Resume"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Template Selection */}
          <Card className="shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-poppins">
                <FileText className="w-5 h-5 mr-2 text-[#2AB7CA]" />
                Choose Resume Template
              </CardTitle>
              <CardDescription className="font-inter">
                Select a professional template for your optimized resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate === template.id}
                    onSelect={setSelectedTemplate}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-poppins">
                <Lightbulb className="w-5 h-5 mr-2 text-[#2AB7CA]" />
                Resume Analysis & Optimization
              </CardTitle>
              <CardDescription className="font-inter">
                AI-enhanced resume with ATS score analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                  <p className="font-medium">{error}</p>
                  {process.env.NODE_ENV === "development" && (
                    <p className="mt-1 text-sm opacity-80">
                      Check the console for more details.
                    </p>
                  )}
                </div>
              )}

              {/* ATS Score Display */}
              {atsScores && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">ATS Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <h4 className="text-md font-medium mb-2">
                        Original Resume
                      </h4>
                      <div className="space-y-3">
                        <ATSScoreCard
                          title="Overall Score"
                          score={atsScores.original?.overallScore || 0}
                          description="Overall ATS compatibility"
                        />
                        <ATSScoreCard
                          title="Keyword Match"
                          score={atsScores.original?.keywordScore || 0}
                          description="Job-specific keyword matching"
                        />
                        <ATSScoreCard
                          title="Formatting"
                          score={atsScores.original?.formattingScore || 0}
                          description="Resume structure and formatting"
                        />
                        <ATSScoreCard
                          title="Content Quality"
                          score={atsScores.original?.contentScore || 0}
                          description="Achievement quality and relevance"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium mb-2">
                        Optimized Resume
                      </h4>
                      <div className="space-y-3">
                        <ATSScoreCard
                          title="Overall Score"
                          score={atsScores.optimized?.overallScore || 0}
                          description="Overall ATS compatibility"
                          improvement={atsScores.improvements?.overall}
                        />
                        <ATSScoreCard
                          title="Keyword Match"
                          score={atsScores.optimized?.keywordScore || 0}
                          description="Job-specific keyword matching"
                          improvement={atsScores.improvements?.keywords}
                        />
                        <ATSScoreCard
                          title="Formatting"
                          score={atsScores.optimized?.formattingScore || 0}
                          description="Resume structure and formatting"
                          improvement={atsScores.improvements?.formatting}
                        />
                        <ATSScoreCard
                          title="Content Quality"
                          score={atsScores.optimized?.contentScore || 0}
                          description="Achievement quality and relevance"
                          improvement={atsScores.improvements?.content}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Display ATS insights below the scores */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <KeywordsList
                        title="Matched Keywords"
                        keywords={atsScores.optimized?.keywordMatches}
                        type="success"
                      />
                      <KeywordsList
                        title="Missing Keywords"
                        keywords={atsScores.optimized?.missingKeywords}
                        type="warning"
                      />
                    </div>
                    <div>
                      <ATSDetailsList
                        title="Improvement Areas"
                        items={atsScores.original?.improvementAreas}
                        type="improvement"
                      />
                      <ATSDetailsList
                        title="Resume Strengths"
                        items={atsScores.optimized?.strengths}
                        type="strength"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Resume Content Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Original Resume
                  </Label>
                  <div className="bg-gray-50 rounded-lg p-4 h-[300px] overflow-auto border border-gray-200">
                    <p className="text-gray-500 font-inter whitespace-pre-wrap">
                      {originalText ||
                        "Your original resume content will appear here..."}
                    </p>
                  </div>
                </div>
                <div className="w-full overflow-x-hidden">
                  <Label className="text-sm font-medium mb-2 flex flex-wrap justify-between">
                    <span>
                      Optimized Resume{" "}
                      {isEditingOptimized && (
                        <span className="ml-2 text-green-600 text-xs">
                          (Editing Mode)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-[#2AB7CA]">
                      Using{" "}
                      {templates.find((t) => t.id === selectedTemplate)?.name ||
                        "Professional"}{" "}
                      template
                    </span>
                  </Label>
                  {isEditingOptimized ? (
                    <div className="bg-white rounded-lg p-4 h-[300px] overflow-auto border-2 border-green-500 font-inter">
                      <textarea
                        className="w-full h-full resize-none border-none outline-none font-inter text-gray-700 whitespace-pre-wrap"
                        value={editableOptimizedText}
                        onChange={(e) =>
                          setEditableOptimizedText(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const start = e.target.selectionStart;
                            const end = e.target.selectionEnd;
                            const value = e.target.value;
                            e.target.value =
                              value.substring(0, start) +
                              "    " +
                              value.substring(end);
                            e.target.selectionStart = e.target.selectionEnd =
                              start + 4;
                            setEditableOptimizedText(e.target.value);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-[#E0F4FA]/50 rounded-lg p-4 h-[300px] overflow-auto border border-[#2AB7CA]/20">
                      <p className="text-gray-700 font-inter whitespace-pre-wrap">
                        {optimizedText ||
                          "AI-optimized resume will appear here..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {transparencyMode && transparencyInsights.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-medium mb-2 text-sm">
                    AI Optimization Insights:
                  </h4>
                  <div className="space-y-3">
                    {transparencyInsights.map((insight, index) => (
                      <div
                        key={index}
                        className="bg-[#E0F4FA]/30 rounded-md p-3 border border-[#2AB7CA]/10"
                      >
                        <div className="flex items-start">
                          <div className="h-2 w-2 rounded-full bg-[#2AB7CA] mt-1.5 mr-2 flex-shrink-0"></div>
                          <div>
                            <h5 className="text-sm font-medium mb-1 text-gray-800">
                              {insight.category}
                            </h5>
                            <div className="text-xs">
                              <span className="font-medium">
                                {insight.description}
                              </span>
                              <br />
                              <span className="text-gray-500">
                                {insight.rationale}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 p-4">
              {isEditingOptimized ? (
                <>
                  <Button
                    variant="outline"
                    className="border-red-400 text-red-500 hover:bg-red-50 w-full sm:w-auto"
                    onClick={handleCancelEdits}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    onClick={handleSaveEdits}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="border-[#2AB7CA] text-[#2AB7CA] hover:bg-[#2AB7CA]/10 w-full sm:w-auto"
                    onClick={handleStartEditing}
                    disabled={!optimizedText}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit AI Suggestions
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      className="bg-[#2AB7CA] hover:bg-[#2AB7CA]/90 w-full sm:w-auto"
                      disabled={isOptimizing || !optimizedText}
                      onClick={downloadPDF}
                    >
                      Download PDF
                    </Button>
                  </div>
                </>
              )}
            </CardFooter>
          </Card>

          <Card className="shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-poppins">
                <ChartBar className="w-5 h-5 mr-2 text-[#2AB7CA]" />
                Skill Gap Analysis
              </CardTitle>
              <CardDescription className="font-inter">
                Based on the job description, here are skills you should develop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillGaps?.missingSkills?.map((skill, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <ChartBar size={16} className="text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{skill.skill}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {skill.description}
                      </p>
                      <div className="mt-2">
                        <a
                          href={skill.learningResource}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#2AB7CA] hover:underline"
                        >
                          Learn {skill.skill} →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

                {skillGaps?.matchingSkills?.map((skill, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <ChartBar size={16} className="text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{skill.skill}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardMain;
