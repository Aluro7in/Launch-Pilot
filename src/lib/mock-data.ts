import { LaunchFormInputs, LaunchPack } from './types';

export const EXAMPLE_BRIEFS = [
  {
    id: 1,
    product_name: "InsightSum AI",
    description: "Launch an AI feature that summarizes customer interview notes for startup founders in 7 days.",
    audience: "Startup Founders",
    launch_type: "feature launch" as const,
    timeline: "this week" as const,
    primary_goal: "activation" as const,
    title: "AI Interview Summarizer",
    tagline: "7-day Feature Launch"
  },
  {
    id: 2,
    product_name: "RemotelyWiki",
    description: "Prepare a beta launch plan for a team wiki tool for remote startups.",
    audience: "Remote Startups",
    launch_type: "beta launch" as const,
    timeline: "this month" as const,
    primary_goal: "adoption" as const,
    title: "Beta Launch of Team Wiki",
    tagline: "1-Month Private Beta"
  },
  {
    id: 3,
    product_name: "FlowAnalytics",
    description: "Create a rollout plan for a new onboarding flow for a SaaS analytics product.",
    audience: "Product Managers & SaaS Founders",
    launch_type: "feature launch" as const,
    timeline: "today" as const,
    primary_goal: "retention" as const,
    title: "Onboarding Flow Rollout",
    tagline: "Immediate Phased Rollout"
  }
];

export const MOCK_PACK_1: LaunchPack = {
  launch_summary: "InsightSum AI is a direct-value add for busy startup founders, transforming unstructured, messy interview transcripts into high-fidelity action summaries. Built as a native sub-feature of our interview intelligence suite, this 7-day launch targets maximum activation by minimizing time-to-value (TTV) for early adopters.",
  user_stories: [
    "As a startup founder, I want to upload a raw Zoom audio recording so I can immediately view main feature requests, bugs, and friction points.",
    "As a product manager, I want to copy a clean, structured bullet-point summary of a user call so I can paste it directly into our Slack feedback channel.",
    "As a founder, I want to see action items grouped by category so I can assign follow-up tasks to engineers without re-watching transcripts."
  ],
  launch_checklist: {
    before_launch: [
      "Finalize prompt templates for core summary engine and test with 20+ variable quality transcript files",
      "Deploy optimized Tailwind interface with inline audio-upload capabilities",
      "Instrument 'summarize_clicked' and 'summary_copied' events in Novus analytics",
      "Draft internal help document containing FAQ on AI summary limits and context window usage"
    ],
    launch_day: [
      "Deploy Vercel branch to production and verify live API connection health",
      "Publish Launch Day announcement post on Product Hunt and Twitter/X with a 2-minute demo video",
      "Send dedicated email broadcast to founders on waitlist with direct activation link",
      "Monitor error budgets, API rate limits, and latency metrics in real-time"
    ],
    after_launch: [
      "Review Novus usage metrics to find top active summarizers and email them for feedback",
      "Fix any styling issues or transcription anomalies flagged in user comments",
      "Implement a fast follow: direct markdown export to Notion and Linear workspace links",
      "Analyze Day 1 to Day 7 customer activation and retention delta"
    ]
  },
  risks_and_blockers: [
    {
      risk: "LLM token limits exceeded during high-volume customer transcript uploads",
      impact: "High - Causes summary failures and high API error rates for critical users",
      mitigation: "Implement input chunking or display error messages asking users to upload files shorter than 60 minutes."
    },
    {
      risk: "Prompt injection causing weird formatting or system prompt exposure",
      impact: "Medium - Looks unprofessional to initial batch of early adopters",
      mitigation: "Enforce strict JSON schema validation on the LLM output and add post-processing checks."
    },
    {
      risk: "Launch delay due to Apple App Store or third-party OAuth review",
      impact: "Low - Safe to run web-only bypass",
      mitigation: "Use standard email-based Magic Link sign-in for Web App during launch day."
    }
  ],
  demo_script: [
    "Show the problem: Open a blank notes document showing 10 pages of unorganized user transcripts.",
    "Introduce the solution: Navigate to InsightSum AI and drop the transcript into the upload zone.",
    "Show the magic: Wait 3 seconds, watch live rendering of structured bullets, feature requests, and risks.",
    "Close with CTA: Click the export button to show integration, then guide founders to register for a free account."
  ],
  release_notes: [
    "**Introducing InsightSum AI**: Turn unstructured transcript walls into clean summaries instantly.",
    "**Smart Classification**: Automates categorization of user pain points into requests, bugs, and friction.",
    "**Time-to-Value in Seconds**: Drop transcripts directly with zero setup or configuration required.",
    "**Copy to Clipboard**: Quick-copy snippets directly format in Slack, Notion, or email templates."
  ],
  success_metrics: [
    {
      metric: "Summaries Generated",
      target: "500 summaries generated in Week 1",
      why_it_matters: "Measures core product value adoption and user intent."
    },
    {
      metric: "Activation Rate",
      target: "60% of registered founders complete a summary",
      why_it_matters: "Indicates that the onboarding and core interface successfully guides users to value."
    },
    {
      metric: "Fast-Follow Return Rate",
      target: "25% of users return to summarize a second transcript within 72 hours",
      why_it_matters: "Shows immediate habitual utility and retention indicators."
    }
  ],
  feedback_questions: [
    "What specific parts of the AI summary did you find inaccurate or missing?",
    "How does the structure of this summary match your current user feedback templates?",
    "If you could send this summary to one external tool automatically (e.g., Notion, Linear, Slack), which would you choose?"
  ]
};

export const MOCK_PACK_2: LaunchPack = {
  launch_summary: "RemotelyWiki is a high-speed, collaborative documentation base designed for decentralized startup teams. This private beta launch focuses on testing collaborative stability and finding critical features needed for product-market fit (PMF) before moving to public beta.",
  user_stories: [
    "As a remote developer, I want to edit a document in real-time with teammates so we don't overwrite each other's changes.",
    "As an engineering lead, I want to link pages together instantly using slash-commands (/link) to build a clear documentation tree.",
    "As an HR manager, I want to share read-only company policy pages with contractors without granting them write access to internal spaces."
  ],
  launch_checklist: {
    before_launch: [
      "Load test WebSockets server with 50 concurrent active typers per document space",
      "Set up security controls for workspace subdomains and draft private beta privacy agreement",
      "Deploy custom user feedback tab directly in workspace sidebar using a light overlay",
      "Create 5 boilerplate wiki templates (Engineering Handbook, PRD, Meeting Notes, QA, Roadmap)"
    ],
    launch_day: [
      "Send private beta invite emails with personalized tokens to selected 100 remote startups",
      "Activate live dashboard measuring database latency, WebSocket socket disconnects, and collaborative sync lag",
      "Create a private Slack community for beta founders to share direct feedback and bug alerts",
      "Publish behind-the-scenes launch article on Substack detailing our database design choices"
    ],
    after_launch: [
      "Review collaborative editor performance metrics to fix concurrent update conflicts",
      "Perform weekly video checkins with top 10 most active remote teams to understand workflow fit",
      "Refine onboarding experience to ensure teams create their first page in under 30 seconds",
      "Decide on final features needed to exit private beta and begin general public release planning"
    ]
  },
  risks_and_blockers: [
    {
      risk: "WebSocket connection failures for users behind strict enterprise VPNs",
      impact: "High - Prevents editor collaborative sync from working",
      mitigation: "Implement auto-fallback to long-polling HTTP requests when WebSocket handshakes fail."
    },
    {
      risk: "Database schema migrations causing downtime during active editing sessions",
      impact: "Medium - Interrupts document writing and frustrates initial beta users",
      mitigation: "Run migrations during low-activity windows (Sundays 03:00 UTC) and use zero-downtime double-write strategy."
    }
  ],
  demo_script: [
    "Create a new document inside RemotelyWiki and start typing an engineering spec outline.",
    "Share the workspace invite link with a team member in real-time, watching their cursor enter the page instantly.",
    "Demonstrate keyboard-only workflows: press '/' to insert templates, code blocks, and sub-pages.",
    "Ask the teammate to add comments inline, showing the live sidebar conversation threads next to the doc."
  ],
  release_notes: [
    "**RemotelyWiki Private Beta**: Welcome to a blazing fast document database built for distributed teams.",
    "**Real-time Collaboration**: Write documents together with smooth, low-latency cursor synchronization.",
    "**Markdown & Slash Commands**: Fast, keyboard-driven editor layout designed to optimize formatting speed.",
    "**Instant Document Linking**: Link documents recursively using inline markdown brackets or slash shortcuts."
  ],
  success_metrics: [
    {
      metric: "Team Workspace Creation",
      target: "30+ active workspaces setup in Month 1",
      why_it_matters: "Validates signup intent and initial utility configuration."
    },
    {
      metric: "Active Writing Days",
      target: "Active spaces edit documents at least 3 days per week",
      why_it_matters: "Indicates that the wiki is serving as a source of truth for ongoing projects, not just an empty vault."
    },
    {
      metric: "Feedback Response Rate",
      target: "40% of beta teams submitting at least one bug report or feature request",
      why_it_matters: "Crucial for iterating toward product-market fit during beta phase."
    }
  ],
  feedback_questions: [
    "What was the biggest blocker when importing your existing documentation from Notion or Google Docs?",
    "How does the speed of the collaborative editor compare to other tools your team uses daily?",
    "Which team templates were missing that you had to build from scratch?"
  ]
};

export const MOCK_PACK_3: LaunchPack = {
  launch_summary: "This feature launch rolls out a redesigned SaaS onboarding flow for FlowAnalytics. The primary goal is retention: by guiding new signups to connect their database and visualize data on their first session, we hope to reduce churn by 20% in the first 14 days.",
  user_stories: [
    "As a new SaaS user, I want a 3-step setup guide so I don't feel overwhelmed when connecting my analytical database.",
    "As a marketing manager, I want to see sample dashboards immediately using test data so I understand what the charts represent before connecting live metrics.",
    "As a platform admin, I want to invite my team members during setup so we can configure alerts collaboratively."
  ],
  launch_checklist: {
    before_launch: [
      "Set up A/B test routing (50% old flow, 50% new onboarding flow) in middleware layer",
      "Verify analytical database connection error codes return clear troubleshooting links in the new UI",
      "Pre-compile demo dataset and configure toggle behavior for 'Sample Sandbox Data'",
      "Audit accessibility elements (screen readers, keyboard tab focus) across the 3 new onboarding steps"
    ],
    launch_day: [
      "Enable onboarding feature flag for 10% of new signups to verify telemetry stability",
      "Deploy custom user session tracking (LogRocket/PostHog) to watch for signup funnel drop-offs",
      "Update internal intercom triggers to send custom help articles matching the new UI steps",
      "Ramp feature flag user target from 10% to 50% after confirming zero API crash alerts"
    ],
    after_launch: [
      "Compare A/B test metrics: Onboarding Completion Rate (old vs new flow) at 7-day mark",
      "Identify the specific setup step showing the highest drop-off rate and optimize help prompts",
      "Publish changelog entry explaining our layout choices to current userbase",
      "Promote the new flow to 100% of new signups once retention uplift is statically verified"
    ]
  },
  risks_and_blockers: [
    {
      risk: "A/B testing cookie mismatches causing users to see parts of both flows",
      impact: "Medium - Creates a highly confusing user onboarding experience",
      mitigation: "Store onboarding variant assignment in DB user profile, not just browser cookies, to ensure cross-device consistency."
    },
    {
      risk: "Third-party analytical database APIs timeout during setup phase",
      impact: "High - Blocks user from reaching the main application dashboard",
      mitigation: "Include simulated sandbox databases that users can play with while connection retries run in background."
    }
  ],
  demo_script: [
    "Navigate to FlowAnalytics registration page and complete signup.",
    "Show the new 3-step visual wizard: Step 1 database credentials, Step 2 metric selection, Step 3 preview dashboard.",
    "Toggle 'Interactive Demo Sandbox' to show charts rendering immediately without live database configuration.",
    "Show the database checklist guiding user through IP whitelisting details."
  ],
  release_notes: [
    "**Redesigned Onboarding**: Get connected and visualize your analytical database in under 2 minutes.",
    "**Interactive Sandbox**: Explore charts and dashboards immediately using pre-loaded sample datasets.",
    "**Smart Setup Guides**: Streamlined database configuration wizard with inline whitelisting helpers.",
    "**Teammate Invites**: Invite your organization administrators directly from the setup flow."
  ],
  success_metrics: [
    {
      metric: "Onboarding Completion Rate",
      target: "Increase from 42% (old flow) to 65% (new flow)",
      why_it_matters: "Direct indicator of onboarding friction reduction."
    },
    {
      metric: "Day 1 Active Rate",
      target: "70% of signups query database inside 24 hours",
      why_it_matters: "Shows immediate activation and utility validation."
    },
    {
      metric: "Support Tickets",
      target: "Reduce connection support tickets by 30%",
      why_it_matters: "Indicates that inline troubleshooting guidance successfully solves credential problems."
    }
  ],
  feedback_questions: [
    "At what point in the onboarding flow did you feel confused or unsure what to do next?",
    "How clear were the database whitelisting instructions on Step 1?",
    "Did the interactive sandbox data help you understand how to navigate your dashboard?"
  ]
};

export function getMockLaunchPack(inputs: LaunchFormInputs): LaunchPack {
  // Check if it matches an example brief
  const desc = inputs.description.toLowerCase();
  if (desc.includes("summarize customer interview notes") || desc.includes("summarize customer interview") || desc.includes("summarize") && desc.includes("interview")) {
    return MOCK_PACK_1;
  }
  if (desc.includes("team wiki tool") || desc.includes("wiki") || desc.includes("wiki tool")) {
    return MOCK_PACK_2;
  }
  if (desc.includes("onboarding flow") || desc.includes("rollout plan for a new onboarding")) {
    return MOCK_PACK_3;
  }

  // Otherwise, return a dynamically compiled customized package incorporating user inputs
  return {
    launch_summary: `Launch Pack for ${inputs.product_name || "your product"}. This launch targets ${inputs.audience || "your target users"} with a tailored ${inputs.launch_type || "feature launch"} rollout. Scheduled to deploy ${inputs.timeline || "soon"}, the main execution objective is to drive user ${inputs.primary_goal || "growth"}.`,
    user_stories: [
      `As a user in the ${inputs.audience || "target audience"} segment, I want to access the core utility of ${inputs.product_name || "the product"} immediately so I can solve my main friction point.`,
      `As a customer, I want to see clear instructions and onboarding documentation so I can understand the configuration layout.`,
      `As a developer, I want to track user behaviors in our dashboard so we can monitor adoption rates during deployment.`
    ],
    launch_checklist: {
      before_launch: [
        `Complete quality assurance checks on all ${inputs.launch_type || "release"} components`,
        `Configure instrumentation for tracking the primary goal: ${inputs.primary_goal || "retention"}`,
        `Publish API reference docs and set up demo spaces for testing`
      ],
      launch_day: [
        `Release ${inputs.product_name || "the product"} to selected early adopters`,
        `Send product updates and email announcements to waitlisted ${inputs.audience || "users"}`,
        `Monitor analytics dashboard for initial signups and feature adoption`
      ],
      after_launch: [
        `Gather feedback from users in the ${inputs.audience || "target audience"} category`,
        `Review onboarding funnels and fix usability roadblocks`,
        `Plan fast-follow updates based on high priority feedback questions`
      ]
    },
    risks_and_blockers: [
      {
        risk: `User confusion regarding the core value of ${inputs.product_name || "the product"}`,
        impact: "Medium - May lower initial signup activation rates",
        mitigation: `Refine initial landing copy and embed a clear, step-by-step onboarding wizard.`
      },
      {
        risk: `Scale issues during ${inputs.launch_type || "launch"} timeline: ${inputs.timeline || "today"}`,
        impact: "High - Results in server downtime and bad initial user impressions",
        mitigation: "Use scalable serverless deployment and configure API rate limit alerts."
      }
    ],
    demo_script: [
      `Introduce ${inputs.product_name || "the product"} and the core challenge it solves for ${inputs.audience || "users"}.`,
      "Show how to navigate the settings dashboard and activate the new feature.",
      `Validate successful execution of the core action: achieving ${inputs.primary_goal || "activation"}.`,
      "Conclude by sharing customer support pathways and documentation wiki links."
    ],
    release_notes: [
      `**Introducing ${inputs.product_name || "the product"}**: Built to address pain points for ${inputs.audience || "our target segment"}.`,
      `**Optimized for ${inputs.primary_goal || "growth"}**: Configured key workflows to streamline customer success path.`,
      `**Custom ${inputs.launch_type || "launch"} layout**: Enjoy high-speed UI layout built for immediate scaling.`
    ],
    success_metrics: [
      {
        metric: `${inputs.primary_goal || "Adoption"} rate`,
        target: `Achieve target performance within ${inputs.timeline || "this cycle"}`,
        why_it_matters: `Aligns with our primary goal of driving launch ${inputs.primary_goal || "adoption"}.`
      },
      {
        metric: "User Retention Funnel",
        target: "Keep user return rates above 30% in Week 1",
        why_it_matters: `Ensures that target users (${inputs.audience || "customers"}) find recurring utility in the application.`
      }
    ],
    feedback_questions: [
      `How easily were you able to configure ${inputs.product_name || "the product"} during your first session?`,
      `What features do you feel are missing to make this a daily part of your team's workflow?`,
      `Would you recommend this tool to other startup builders or founders in your network?`
    ]
  };
}
