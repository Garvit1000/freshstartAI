import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Upload,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const OnboardingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [submitBlocked, setSubmitBlocked] = useState(false);
  const totalSteps = 3;
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Rate limiting effect
  useEffect(() => {
    if (submitAttempts >= 5) {
      setSubmitBlocked(true);
      const timer = setTimeout(() => {
        setSubmitAttempts(0);
        setSubmitBlocked(false);
      }, 60000); // 1 minute cooldown

      return () => clearTimeout(timer);
    }
  }, [submitAttempts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing in that field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Email validation function
  const isValidEmail = (email) => {
    // Basic regex for email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Check basic format
    if (!emailRegex.test(email)) {
      return false;
    }

    // Check common disposable email domains (add more as needed)
    const disposableDomains = [
      "tempmail.com",
      "throwawaymail.com",
      "mailinator.com",
      "guerrillamail.com",
      "sharklasers.com",
      "yopmail.com",
    ];

    const domain = email.split("@")[1];
    if (disposableDomains.includes(domain)) {
      return false;
    }

    return true;
  };

  // Password strength validation
  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must include an uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must include a lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must include a number";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must include a special character";
    }
    return null;
  };

  // Username validation with security checks
  const validateUsername = (username) => {
    if (!username || typeof username !== 'string') {
      return "Invalid username format";
    }
    if (username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username.length > 20) {
      return "Username must be less than 20 characters";
    }
    // Check for valid characters - only alphanumeric and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
      return "Username must start with a letter";
    }
    // Check for common patterns that might indicate impersonation
    const restrictedTerms = ['admin', 'administrator', 'mod', 'moderator', 'system'];
    if (restrictedTerms.some(term => username.toLowerCase().includes(term))) {
      return "Username contains restricted terms";
    }
    return null;
  };

  // Form validation before submission
  const validateForm = () => {
    const newErrors = {};

    // Username validation
    const usernameError = validateUsername(formData.username);
    if (usernameError) {
      newErrors.username = usernameError;
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailAuth = async () => {
    if (submitBlocked) {
      setErrors({
        general: "Too many attempts. Please try again in 1 minute.",
      });
      return;
    }

    setSubmitAttempts((prev) => prev + 1);

    if (!validateForm()) {
      return;
    }

    try {
      setErrors({});
      setLoading(true);

      // Check if email or username already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from("profiles")
        .select("email, username")
        .or(`email.eq.${formData.email.toLowerCase()},username.eq.${formData.username.trim()}`)
        .limit(2);

      if (checkError) throw checkError;

      if (existingUsers && existingUsers.length > 0) {
        const emailExists = existingUsers.some(user => user.email === formData.email.toLowerCase());
        const usernameExists = existingUsers.some(user => user.username === formData.username.trim());
        
        if (emailExists && usernameExists) {
          setErrors({ 
            email: "This email is already registered",
            username: "This username is already taken"
          });
        } else if (emailExists) {
          setErrors({ email: "This email is already registered" });
        } else {
          setErrors({ username: "This username is already taken" });
        }
        return;
      }

      const { data: signUpData, error: signUpError } = await signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        options: {
          data: {
            username: formData.username.trim(),
            onboarding_completed: false,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Wait for session to be established
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("Failed to establish session");

      nextStep();
    } catch (error) {
      console.error("Auth error:", error);

      // Handle specific error messages
      if (error.message.includes("already in use")) {
        setErrors({ email: "This email is already registered" });
      } else {
        setErrors({
          general: error.message || "An error occurred during signup",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (submitBlocked) {
      setErrors({
        general: "Too many attempts. Please try again in 1 minute.",
      });
      return;
    }

    setSubmitAttempts((prev) => prev + 1);

    try {
      setErrors({});
      setLoading(true);

      // Generate CSRF token for OAuth security
      const csrfToken = crypto.randomUUID();
      sessionStorage.setItem("oauthCsrfToken", csrfToken);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
            state: csrfToken, // Include CSRF token in the OAuth flow
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Google sign up error:", error);
      setErrors({ general: error.message || "Google authentication failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (file) => {
    try {
      setErrors({});
      setLoading(true);

      // Validate file size (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size must be less than 5MB");
      }

      // Validate file type
      const allowedTypes = ["pdf", "doc", "docx"];
      const fileExt = file.name.split(".").pop().toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        throw new Error("File type must be PDF, DOC, or DOCX");
      }

      // Check for potentially malicious file extensions
      if (file.name.match(/\.(php|js|exe|sh|bat)$/i)) {
        throw new Error("Invalid file type");
      }

      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.user) {
        throw new Error("You must be logged in to upload a resume");
      }

      // Create unique filename with random component to prevent guessing
      const randomId = crypto.randomUUID().substring(0, 8);
      const fileName = `${session.user.id}-${randomId}-${Date.now()}.${fileExt}`;

      console.log("Uploading file:", fileName);

      // Upload file to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
          contentType:
            fileExt === "pdf"
              ? "application/pdf"
              : fileExt === "doc"
                ? "application/msword"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("File uploaded successfully:", data);

      // Get the public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("resumes").getPublicUrl(fileName);

      console.log("File public URL:", publicUrl);

      // Update user profile with resume URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          resume_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      console.log("Profile updated successfully");
      nextStep();
    } catch (error) {
      console.error("Resume upload error:", error);
      setErrors({ general: error.message || "Resume upload failed" });
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      setErrors({});
      setLoading(true);

      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session?.user) {
        throw new Error("No active session");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (error) throw error;

      // Navigate to dashboard on success
      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setErrors({ general: error.message || "Failed to complete onboarding" });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper to render field errors
  const renderFieldError = (fieldName) => {
    return errors[fieldName] ? (
      <p className="text-red-500 text-xs mt-1 flex items-center">
        <AlertCircle size={12} className="inline mr-1" /> {errors[fieldName]}
      </p>
    ) : null;
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > index + 1
                      ? "bg-cyan-500 text-white"
                      : currentStep === index + 1
                        ? "bg-cyan-500-bg-opacity-20 border-2 border-cyan-500 text-blue-500"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > index + 1 ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-2 text-gray-600">
                  {index === 0
                    ? "Sign Up"
                    : index === 1
                      ? "Upload Resume"
                      : "Get Optimized"}
                </span>
              </div>

              {index < totalSteps - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > index + 1 ? "bg-blue-500" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Card className="card-shadow border border-gray-200">
        {currentStep === 1 && (
          <div className="space-y-6">
            <CardHeader className="space-y-3">
              <div className="text-center">
                <span className="font-bold text-xl font-poppins">
                  <span className="text-[#2AB7CA]">Fresh</span>Start AI
                </span>
              </div>
              <CardTitle className="text-center">Create Your Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-600 text-sm flex items-center">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="username">Username</Label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={errors.username ? "border-red-500" : ""}
                  required
                />
                {renderFieldError("username")}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "border-red-500" : ""}
                  required
                />
                {renderFieldError("email")}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? "border-red-500" : ""}
                  required
                />
                {renderFieldError("password")}
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase,
                  number, and special character
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                  required
                />
                {renderFieldError("confirmPassword")}
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to our{" "}
                  <a href="/terms" className="text-cyan-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-cyan-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </CardContent>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <CardHeader>
              <CardTitle className="text-center">Upload Your Resume</CardTitle>
            </CardHeader>
            <CardContent>
              {errors.general && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-600 text-sm mb-4 flex items-center">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleResumeUpload(file);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Drag and drop your resume here or
                </p>
                <input
                  type="file"
                  id="resume"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleResumeUpload(file);
                  }}
                />
                <label htmlFor="resume">
                  <Button
                    className="bg-cyan-500 hover:bg-opacity-90"
                    disabled={loading}
                  >
                    Browse Files
                  </Button>
                </label>
                <p className="text-xs text-gray-500 mt-4">
                  Supported formats: PDF, DOCX, DOC (Max 5MB)
                </p>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={nextStep}
                  className="text-cyan-600 text-sm hover:underline"
                >
                  Skip for now
                </button>
              </div>
            </CardContent>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <CardHeader>
              <CardTitle className="text-center">Ready to Go!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {errors.general && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-600 text-sm mb-4 flex items-center">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              <div className="w-16 h-16 rounded-full bg-cyan-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-600">
                Your account is set up and ready! Start optimizing your job
                applications now.
              </p>
            </CardContent>
          </div>
        )}

        <CardFooter className="flex justify-between">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center gap-1"
              disabled={loading}
            >
              <ArrowLeft size={16} /> Back
            </Button>
          ) : (
            <div></div>
          )}

          {currentStep < totalSteps ? (
            currentStep === 1 ? (
              <Button
                onClick={handleEmailAuth}
                className="bg-[#2AB7CA] hover:bg-[#2AB7CA]/90 flex items-center gap-1"
                disabled={loading || submitBlocked}
              >
                {loading ? "Processing..." : "Next"}{" "}
                {!loading && <ArrowRight size={16} />}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="bg-[#2AB7CA] hover:bg-[#2AB7CA]/90 flex items-center gap-1"
                disabled={loading}
              >
                {loading ? "Processing..." : "Next"}{" "}
                {!loading && <ArrowRight size={16} />}
              </Button>
            )
          ) : (
            <Button
              onClick={completeOnboarding}
              className="bg-[#2AB7CA] hover:bg-[#2AB7CA]/90"
              disabled={loading}
            >
              {loading ? "Processing..." : "Go to Dashboard"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingWizard;
