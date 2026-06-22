# LaunchPilot 🚀

LaunchPilot is an AI product-launch copilot built for solo founders, product managers, indie builders, and startup teams. It translates rough ideas, feature briefs, or messy PRDs into structured, launch-ready execution packs in seconds.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 15 (App Router) | React Server Components, fast router pages, deployable to Vercel |
| **Runtime** | Node.js + TypeScript | Strict typing across input parameters and output schemas |
| **Styling** | Tailwind CSS v4 | Class utilities, native design system, speed of implementation |
| **Icons** | Lucide React | Clean, professional, lightweight iconography |
| **Analytics** | Novus.ai | Pre-wired telemetry tracking 7 key launchpack funnel events |

---

## ✨ Core Features

* **Quick-Start Example Briefs**: Clickable templates to load sample ideas (`InsightSum AI`, `RemotelyWiki`, `FlowAnalytics`) instantly.
* **Launch Configurator**: Tailor the launch pack by choosing target audiences, timelines (today, this week, this month), goals (activation, adoption, retention, revenue), and launch types.
* **Structured Output Cards**: Outputs organized in 8 structured cards mapping key PM frameworks:
  1. *Launch Summary*
  2. *User Stories*
  3. *Launch Checklist* (Pre-Launch, Go-Live, Post-Launch)
  4. *Risks & Blockers Table*
  5. *Demo Script Flow*
  6. *Release Notes / Changelog*
  7. *Success Metrics Table*
  8. *Target Feedback Questions*
* **Workspace Interaction Controls**:
  * **Inline Editing**: Double-click or select the pencil icon to modify any checklist item, risk row, or story on the fly.
  * **Section-Specific Copy**: Quick copy individual card code or lists to the clipboard.
  * **Single-Section Regeneration**: Re-run AI generation for just one card if you want to rewrite/refresh its content.
  * **Master Markdown Export**: Quick-copy the entire pack or download it as a `.md` file for immediate imports into Notion, Slack, or Google Docs.
* **Flexible AI Resolution**: Simulated delay mockup engine that can be immediately upgraded to live OpenAI/Gemini endpoints by setting your API key variables.

---

## 📁 Directory Structure

```
launchpilot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate/
│   │   │       └── route.ts     # Generation API handler (Mocks / AI Router)
│   │   ├── globals.css          # Tailwind CSS v4 variables, light/dark themes, loading shimmers
│   │   ├── layout.tsx           # SEO layout, Inter font setup, navigation bars
│   │   └── page.tsx             # Interactive dashboard (Homepage, Form, Workspace)
│   └── lib/
│       ├── analytics.ts         # Novus event helper
│       ├── mock-data.ts         # Precompiled example brief outputs & fallbacks
│       └── types.ts             # Strict schemas for LaunchFormInputs and LaunchPack
├── package.json                 # Dependency manifests
├── tsconfig.json                # TypeScript configurations
└── next.config.mjs              # Custom Next build configurations
```

---

## ⚡ Getting Started

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
By default, the application runs on high-fidelity local mock data. To connect live LLM generations, create an `.env.local` file:
```env
# For Gemini API (Recommended / Fast)
GEMINI_API_KEY=your-gemini-api-key

# OR for OpenAI API
OPENAI_API_KEY=your-openai-api-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to start building launch packs.
