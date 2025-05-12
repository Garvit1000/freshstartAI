import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const FeedbackForm = () => {
  const [interviews, setInterviews] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.from("feedback").insert([
        {
          user_id: user.id,
          rating: parseInt(
            interviews === "3+" ? "3" : interviews.split("-")[0],
          ),
          feedback_text: feedback,
          feedback_type: "interview_feedback",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description:
          "Thank you for sharing your experience with FreshStart AI!",
      });

      // Reset form and close dialog
      setInterviews("");
      setFeedback("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error submitting feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#2AB7CA] hover:bg-[#2AB7CA]/90 w-full sm:w-auto">
          <MessageSquare size={16} className="mr-2" />
          Share Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg w-[95%] mx-auto">
        <DialogHeader>
          <DialogTitle className="font-poppins">
            Help Us Improve FreshStart AI
          </DialogTitle>
          <DialogDescription className="font-inter">
            Your feedback helps us optimize our platform for freshers just like
            you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label
              htmlFor="interviews"
              className="text-sm font-medium font-inter block"
            >
              Interviews Received After Using FreshStart AI
            </label>
            <Select value={interviews} onValueChange={setInterviews} required>
              <SelectTrigger
                id="interviews"
                className="w-full font-inter border-gray-200 text-sm"
              >
                <SelectValue placeholder="Select number of interviews" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1-2">1-2</SelectItem>
                  <SelectItem value="3+">3+</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="feedback"
              className="text-sm font-medium font-inter block"
            >
              Your Feedback
            </label>
            <Textarea
              id="feedback"
              placeholder="What worked well? What could be improved?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] font-inter resize-none border-gray-200 text-sm"
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-gray-200 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#2AB7CA] hover:bg-[#2AB7CA]/90 w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackForm;
