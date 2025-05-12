import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';

/**
 * TransparencyToggle component - Renders a toggle switch for enabling/disabling transparency mode
 * 
 * @param {boolean} enabled - Current state of transparency mode
 * @param {function} onChange - Function to call when toggle is changed
 */
export const TransparencyToggle = ({ enabled, onChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">
        Transparency Mode
      </span>
      <Switch
        checked={enabled}
        onCheckedChange={onChange}
        className="bg-gray-200 data-[state=checked]:bg-[#2AB7CA]"
      />
    </div>
  );
};

/**
 * TransparencyDisplay component - Renders AI explanation insights when transparency mode is enabled
 * 
 * @param {Array} insights - Array of insight objects with category, description, and rationale
 * @param {boolean} enabled - Whether transparency mode is enabled
 */
export const TransparencyDisplay = ({ insights, enabled }) => {
  if (!enabled || !insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h4 className="font-medium mb-3 text-sm flex items-center">
        <Info className="h-4 w-4 mr-1 text-[#2AB7CA]" />
        AI Optimization Insights:
      </h4>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="bg-[#E0F4FA]/30 rounded-md p-3 border border-[#2AB7CA]/10">
            <div className="flex items-start">
              <div className="h-2 w-2 rounded-full bg-[#2AB7CA] mt-1.5 mr-2 flex-shrink-0"></div>
              <div>
                <h5 className="text-sm font-medium mb-1 text-gray-800">
                  {insight.category}
                </h5>
                <div className="text-xs">
                  <span className="font-medium">{insight.description}</span>
                  <br />
                  <span className="text-gray-500">{insight.rationale}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * ExampleTransparencyInsights - Example AI insights for demonstration purposes
 */
export const ExampleTransparencyInsights = [
  {
    category: "Keywords",
    description: "Added technical keywords like 'Python (Pandas, NumPy)' and 'Web Development'",
    rationale: "These align with job requirements and improve ATS matching score by ~15%"
  },
  {
    category: "Quantification",
    description: "Added specific metrics to achievements",
    rationale: "Quantified results (e.g., 'improved client data analysis by 25%') make achievements more credible"
  },
  {
    category: "Action Verbs",
    description: "Replaced generic terms with action verbs like 'Contributed', 'Implemented'",
    rationale: "Strong action verbs demonstrate initiative and impact to recruiters"
  },
  {
    category: "Skills Organization",
    description: "Grouped related skills and highlighted priority ones",
    rationale: "Improves readability and emphasizes most relevant skills for the position"
  },
  {
    category: "Content Restructuring",
    description: "Reorganized experience details to highlight outcomes first",
    rationale: "Puts emphasis on results rather than responsibilities, increasing perceived value"
  }
];

export default { TransparencyToggle, TransparencyDisplay, ExampleTransparencyInsights };