/**
 * Video tutorial definitions
 * Replace placeholder URLs with actual YouTube/Vimeo videos
 */

export interface VideoTutorialData {
  title: string
  description: string
  videoUrl: string
  duration: string
  category: "getting-started" | "features" | "advanced" | "tips"
  thumbnail?: string
  transcriptUrl?: string
}

export const videoTutorials: VideoTutorialData[] = [
  // Getting Started
  {
    title: "Welcome to Lexora",
    description: "5-minute overview of the platform and key features for new users.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with actual
    duration: "5:30",
    category: "getting-started",
    thumbnail: "/videos/thumbnails/welcome.jpg"
  },
  {
    title: "Setting Up Your Firm",
    description: "Configure your firm details, add team members, and set up roles.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "8:15",
    category: "getting-started"
  },
  {
    title: "Creating Your First Matter",
    description: "Step-by-step guide to creating and managing legal matters.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "6:45",
    category: "getting-started"
  },

  // Trust Accounting
  {
    title: "Trust Accounting Setup",
    description: "Complete guide to setting up SRA-compliant trust accounts.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "12:30",
    category: "features",
    transcriptUrl: "/videos/transcripts/trust-accounting-setup.pdf"
  },
  {
    title: "Three-Way Reconciliation",
    description: "How to perform monthly reconciliation and maintain compliance.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "10:20",
    category: "features"
  },
  {
    title: "Client Ledger Management",
    description: "Track client funds, deposits, and withdrawals effectively.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "7:15",
    category: "features"
  },

  // Document Management
  {
    title: "Document Vault Overview",
    description: "Upload, organize, and track documents with chain of custody.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "9:00",
    category: "features"
  },
  {
    title: "Chain of Custody Tracking",
    description: "Understand how Lexora tracks every document access and modification.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "6:30",
    category: "features"
  },

  // Time Tracking & Billing
  {
    title: "Time Tracking Essentials",
    description: "Log billable hours efficiently with timers and manual entries.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "8:45",
    category: "features"
  },
  {
    title: "Generating Invoices",
    description: "Convert tracked time into professional invoices in minutes.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "7:00",
    category: "features"
  },

  // Advanced Features
  {
    title: "Advanced Reporting",
    description: "Create custom reports for cases, billing, and time analysis.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "11:20",
    category: "advanced"
  },
  {
    title: "Conflict Checking",
    description: "Prevent ethical conflicts with automated conflict detection.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "9:15",
    category: "advanced"
  },
  {
    title: "Email Integration",
    description: "Connect Gmail/Outlook and automatically link emails to cases.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "10:30",
    category: "advanced"
  },
  {
    title: "Roles & Permissions",
    description: "Configure team access control and security settings.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "8:00",
    category: "advanced"
  },

  // Tips & Tricks
  {
    title: "Keyboard Shortcuts",
    description: "Speed up your workflow with keyboard shortcuts and power user tips.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "5:45",
    category: "tips"
  },
  {
    title: "Mobile App Features",
    description: "Use Lexora on the go with mobile-optimized features.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "6:20",
    category: "tips"
  },
  {
    title: "Productivity Best Practices",
    description: "Learn workflows that successful firms use to maximize efficiency.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "12:00",
    category: "tips"
  },
  {
    title: "Common Mistakes to Avoid",
    description: "Learn from others' mistakes and avoid common pitfalls.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace
    duration: "9:30",
    category: "tips"
  }
]

/**
 * Get videos by category
 */
export function getVideosByCategory(category: string): VideoTutorialData[] {
  if (category === "all") return videoTutorials
  return videoTutorials.filter(v => v.category === category)
}

/**
 * Get featured videos (first 3)
 */
export function getFeaturedVideos(): VideoTutorialData[] {
  return videoTutorials.slice(0, 3)
}

/**
 * Search videos by title or description
 */
export function searchVideos(query: string): VideoTutorialData[] {
  const lowerQuery = query.toLowerCase()
  return videoTutorials.filter(v =>
    v.title.toLowerCase().includes(lowerQuery) ||
    v.description.toLowerCase().includes(lowerQuery)
  )
}
