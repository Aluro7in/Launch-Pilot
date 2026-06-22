'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AssistantPanel from '@/components/AssistantPanel';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCw, 
  Download, 
  FileText, 
  Play, 
  CheckSquare, 
  AlertTriangle, 
  BarChart3, 
  MessageSquare, 
  ChevronRight, 
  PenLine, 
  ArrowLeft,
  BookOpen,
  Send,
  Loader2,
  Zap,
  Layers,
  Target,
  Shield
} from 'lucide-react';
import { LaunchFormInputs, LaunchPack, RiskBlocker, SuccessMetric } from '@/lib/types';
import { EXAMPLE_BRIEFS } from '@/lib/mock-data';
import { trackEvent } from '@/lib/analytics';

export default function Home() {
  // Page view state: 'landing' | 'workspace'
  const [viewState, setViewState] = useState<'landing' | 'workspace'>('landing');

  // Input states
  const [inputs, setInputs] = useState<LaunchFormInputs>({
    product_name: '',
    description: '',
    audience: '',
    launch_type: 'feature launch',
    timeline: 'this week',
    primary_goal: 'activation',
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pack, setPack] = useState<LaunchPack | null>(null);
  
  // Section-specific states
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Form errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Trigger page viewed analytics event on mount
  useEffect(() => {
    trackEvent({ name: 'homepage_viewed' });
    
    // Load persisted state if exists
    const cachedPack = sessionStorage.getItem('launchpilot_pack');
    const cachedInputs = sessionStorage.getItem('launchpilot_inputs');
    if (cachedPack && cachedInputs) {
      try {
        setPack(JSON.parse(cachedPack));
        setInputs(JSON.parse(cachedInputs));
        setViewState('workspace');
      } catch {
        // Clear corrupt cache
        sessionStorage.removeItem('launchpilot_pack');
        sessionStorage.removeItem('launchpilot_inputs');
      }
    }
  }, []);

  // Handle example brief quick pre-fills
  const handleUseExample = (exampleId: number) => {
    const example = EXAMPLE_BRIEFS.find(e => e.id === exampleId);
    if (!example) return;

    const selectedInputs = {
      product_name: example.product_name,
      description: example.description,
      audience: example.audience,
      launch_type: example.launch_type,
      timeline: example.timeline,
      primary_goal: example.primary_goal,
    };

    setInputs(selectedInputs);
    setValidationErrors({});
    setViewState('workspace');
    
    trackEvent({ 
      name: 'example_brief_used', 
      properties: { briefId: example.id, title: example.title } 
    });
  };

  // Validate inputs before generation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!inputs.product_name.trim()) errors.product_name = 'Product name is required';
    if (!inputs.description.trim()) errors.description = 'Launch description / brief is required';
    if (!inputs.audience.trim()) errors.audience = 'Target audience is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle core launch pack generation
  const handleGeneratePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsGenerating(true);
    setError(null);
    setPack(null);

    trackEvent({ 
      name: 'launch_pack_generation_started', 
      properties: { ...inputs } 
    });

    const startTime = Date.now();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error encountered during generation.');
      }

      const data: LaunchPack = await response.json();
      setPack(data);
      
      // Persist in session storage so refresh doesn't wipe work
      sessionStorage.setItem('launchpilot_pack', JSON.stringify(data));
      sessionStorage.setItem('launchpilot_inputs', JSON.stringify(inputs));

      trackEvent({ 
        name: 'launch_pack_generation_completed', 
        properties: { durationMs: Date.now() - startTime, success: true } 
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      trackEvent({ 
        name: 'launch_pack_generation_completed', 
        properties: { durationMs: Date.now() - startTime, success: false } 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle single section regeneration
  const handleRegenerateSection = async (sectionKey: keyof LaunchPack) => {
    if (!pack) return;

    setRegeneratingSection(sectionKey);
    trackEvent({ name: 'section_regenerated', properties: { sectionId: sectionKey } });

    try {
      const response = await fetch(`/api/generate?regenerateSection=${sectionKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate section');
      }

      const data = await response.json();
      const updatedPack = {
        ...pack,
        [sectionKey]: data[sectionKey],
      };
      
      setPack(updatedPack);
      sessionStorage.setItem('launchpilot_pack', JSON.stringify(updatedPack));
    } catch (err) {
      console.error(err);
      alert('Failed to regenerate this section. Please try again.');
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    trackEvent({ name: 'section_copied', properties: { sectionId } });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Format section data to raw text for copying
  const getSectionText = (key: keyof LaunchPack): string => {
    if (!pack) return '';
    const val = pack[key];
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
      return val.map((item: any) => {
        if (typeof item === 'string') return `• ${item}`;
        if (item.risk) return `Risk: ${item.risk}\nImpact: ${item.impact}\nMitigation: ${item.mitigation}`;
        if (item.metric) return `Metric: ${item.metric}\nTarget: ${item.target}\nWhy: ${item.why_it_matters}`;
        return JSON.stringify(item);
      }).join('\n\n');
    }
    // Checklist object
    const checklist = val as any;
    return [
      'PRE-LAUNCH:',
      ...checklist.before_launch.map((i: string) => `[ ] ${i}`),
      '\nLAUNCH DAY:',
      ...checklist.launch_day.map((i: string) => `[ ] ${i}`),
      '\nPOST-LAUNCH:',
      ...checklist.after_launch.map((i: string) => `[ ] ${i}`),
    ].join('\n');
  };

  // Copy whole pack in markdown
  const handleCopyAll = () => {
    if (!pack) return;
    const md = generateMarkdownContent();
    navigator.clipboard.writeText(md);
    setCopiedAll(true);
    trackEvent({ name: 'section_copied', properties: { sectionId: 'all' } });
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Generate markdown template for download
  const generateMarkdownContent = (): string => {
    if (!pack) return '';
    
    return `# Launch Pack: ${inputs.product_name}
Generated by LaunchPilot for ${inputs.audience}
Launch Type: ${inputs.launch_type} | Goal: ${inputs.primary_goal}

---

## 1. Launch Summary
${pack.launch_summary}

## 2. User Stories
${pack.user_stories.map(story => `* ${story}`).join('\n')}

## 3. Launch Checklist

### Pre-Launch
${pack.launch_checklist.before_launch.map(i => `- [ ] ${i}`).join('\n')}

### Launch Day
${pack.launch_checklist.launch_day.map(i => `- [ ] ${i}`).join('\n')}

### Post-Launch & Follow-up
${pack.launch_checklist.after_launch.map(i => `- [ ] ${i}`).join('\n')}

## 4. Risks & Blockers
${pack.risks_and_blockers.map(r => `* **Risk**: ${r.risk}\n  * **Impact**: ${r.impact}\n  * **Mitigation**: ${r.mitigation}`).join('\n\n')}

## 5. Demo Script
${pack.demo_script.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

## 6. Release Notes / Changelog
${pack.release_notes.map(note => `* ${note}`).join('\n')}

## 7. Success Metrics
${pack.success_metrics.map(m => `* **Metric**: ${m.metric}\n  * **Target**: ${m.target}\n  * **Why it matters**: ${m.why_it_matters}`).join('\n\n')}

## 8. Feedback Questions
${pack.feedback_questions.map(q => `* ${q}`).join('\n')}
`;
  };

  // Export package to local file (Markdown format)
  const handleExportMarkdown = () => {
    if (!pack) return;
    const markdown = generateMarkdownContent();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const safeName = inputs.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.setAttribute('download', `launchpack-${safeName || 'pack'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    trackEvent({ name: 'export_clicked', properties: { format: 'markdown' } });
  };

  // Inline value updates
  const updateSummary = (newVal: string) => {
    if (!pack) return;
    const updated = { ...pack, launch_summary: newVal };
    setPack(updated);
    sessionStorage.setItem('launchpilot_pack', JSON.stringify(updated));
  };

  const updateArrayItem = (key: keyof LaunchPack, idx: number, newVal: string) => {
    if (!pack) return;
    const arr = [...(pack[key] as any)];
    arr[idx] = newVal;
    const updated = { ...pack, [key]: arr };
    setPack(updated);
    sessionStorage.setItem('launchpilot_pack', JSON.stringify(updated));
  };

  const updateChecklistItem = (subKey: keyof LaunchPack['launch_checklist'], idx: number, newVal: string) => {
    if (!pack) return;
    const list = [...pack.launch_checklist[subKey]];
    list[idx] = newVal;
    const updated = {
      ...pack,
      launch_checklist: {
        ...pack.launch_checklist,
        [subKey]: list
      }
    };
    setPack(updated);
    sessionStorage.setItem('launchpilot_pack', JSON.stringify(updated));
  };

  const updateRiskItem = (idx: number, field: keyof RiskBlocker, newVal: string) => {
    if (!pack) return;
    const list = [...pack.risks_and_blockers];
    list[idx] = { ...list[idx], [field]: newVal };
    const updated = { ...pack, risks_and_blockers: list };
    setPack(updated);
    sessionStorage.setItem('launchpilot_pack', JSON.stringify(updated));
  };

  const updateMetricItem = (idx: number, field: keyof SuccessMetric, newVal: string) => {
    if (!pack) return;
    const list = [...pack.success_metrics];
    list[idx] = { ...list[idx], [field]: newVal };
    const updated = { ...pack, success_metrics: list };
    setPack(updated);
    sessionStorage.setItem('launchpilot_pack', JSON.stringify(updated));
  };

  const handleReset = () => {
    setPack(null);
    setViewState('landing');
    sessionStorage.removeItem('launchpilot_pack');
    sessionStorage.removeItem('launchpilot_inputs');
  };

  return (
    <div className="flex-1 flex flex-col items-center">
      
      {/* LANDING VIEW */}
      <AnimatePresence mode="wait">
      {viewState === 'landing' && (
        <motion.div 
          key="landing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center relative overflow-hidden"
        >

          {/* ── Aurora Glow Blobs ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="aurora-blob aurora-blob-1" />
            <div className="aurora-blob aurora-blob-2" />
            <div className="aurora-blob aurora-blob-3" />
          </div>

          {/* ── Floating Particles ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`particle-${i}`}
                className={`particle particle-${i}`}
              />
            ))}
          </div>

          {/* ── Badge ── */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 mb-6 badge-shimmer"
          >
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              The AI Co-pilot for Product Launches
            </span>
          </motion.div>

          {/* ── Headline with Animated Gradient ── */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white max-w-3xl leading-tight"
          >
            Turn rough product ideas into{' '}
            <span className="gradient-text-animated">launch-ready</span>{' '}
            plans
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed relative"
          >
            LaunchPilot helps solo founders and product teams turn messy ideas, PRDs, and feature briefs into practical launch packs in minutes.
          </motion.p>

          {/* ── CTA Buttons ── */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center relative"
          >
            <button
              onClick={() => setViewState('workspace')}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium text-sm rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden group cta-glow"
            >
              <span className="relative z-10">Generate your launch pack</span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </button>
            <a
              href="#examples"
              className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm rounded-lg transition-all cursor-pointer hover:shadow-md"
            >
              Browse examples
            </a>
          </motion.div>

          {/* ── Feature Highlights Strip ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="mt-16 w-full relative"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Zap, label: 'Instant Packs', desc: 'Generate in seconds' },
                { icon: Layers, label: 'Full Coverage', desc: 'Checklists, risks, metrics' },
                { icon: Target, label: 'Goal-Driven', desc: 'Aligned to your KPIs' },
                { icon: Shield, label: 'Risk Analysis', desc: 'Blockers identified' },
              ].map((feat, i) => (
                <motion.div
                  key={feat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                  className="flex flex-col items-center p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900/60 transition-all group"
                >
                  <div className={`h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center mb-3 icon-float icon-float-delay-${i} group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors`}>
                    <feat.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{feat.label}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{feat.desc}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Quick-Start Example Cards ── */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            id="examples" 
            className="mt-20 pt-16 border-t border-gray-200 dark:border-gray-800 w-full text-left relative"
          >
            <div className="flex items-center space-x-2.5 mb-8">
              <BookOpen className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Explore Quick-Start Briefs
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 perspective-1000">
              {EXAMPLE_BRIEFS.map((brief, idx) => (
                <motion.div 
                  key={brief.id}
                  initial={{ opacity: 0, y: 25, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.9 + idx * 0.12, duration: 0.45, ease: 'easeOut' }}
                  onClick={() => handleUseExample(brief.id)}
                  className="glass-card gradient-border card-tilt p-6 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 relative group flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold tracking-wide uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100/50 dark:border-indigo-900/40 px-2 py-0.5 rounded">
                      {brief.tagline}
                    </span>
                    <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {brief.title}
                    </h3>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                      {brief.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    Use this brief <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* WORKSPACE VIEW */}
      {viewState === 'workspace' && (
        <motion.div 
          key="workspace"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8"
        >
          
          {/* Header Action Row */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={handleReset}
              className="inline-flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to home</span>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Workspace / {inputs.product_name || "New Launch"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: INPUT FORM */}
            <div className="lg:col-span-4 sticky top-18 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-2.5 mb-6">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  Launch Configurator
                </h2>
              </div>

              <form onSubmit={handleGeneratePack} className="space-y-5">
                
                {/* Product Name */}
                <div>
                  <label htmlFor="product_name" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Product / Feature Name
                  </label>
                  <input
                    id="product_name"
                    type="text"
                    placeholder="e.g. InsightSum AI"
                    value={inputs.product_name}
                    onChange={(e) => setInputs({ ...inputs, product_name: e.target.value })}
                    className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-950 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white ${
                      validationErrors.product_name ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                    }`}
                  />
                  {validationErrors.product_name && (
                    <p className="mt-1 text-[11px] text-red-500">{validationErrors.product_name}</p>
                  )}
                </div>

                {/* What is being launched */}
                <div>
                  <label htmlFor="description" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    What is being launched?
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Describe the feature or project. Include core capabilities and key parameters..."
                    value={inputs.description}
                    onChange={(e) => setInputs({ ...inputs, description: e.target.value })}
                    className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-950 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white resize-none ${
                      validationErrors.description ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                    }`}
                  />
                  {validationErrors.description && (
                    <p className="mt-1 text-[11px] text-red-500">{validationErrors.description}</p>
                  )}
                </div>

                {/* Who is it for */}
                <div>
                  <label htmlFor="audience" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Who is it for?
                  </label>
                  <input
                    id="audience"
                    type="text"
                    placeholder="e.g. startup founders, remote engineers"
                    value={inputs.audience}
                    onChange={(e) => setInputs({ ...inputs, audience: e.target.value })}
                    className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-950 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white ${
                      validationErrors.audience ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                    }`}
                  />
                  {validationErrors.audience && (
                    <p className="mt-1 text-[11px] text-red-500">{validationErrors.audience}</p>
                  )}
                </div>

                {/* Launch Type */}
                <div>
                  <label htmlFor="launch_type" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Launch Type
                  </label>
                  <select
                    id="launch_type"
                    value={inputs.launch_type}
                    onChange={(e) => setInputs({ ...inputs, launch_type: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white cursor-pointer"
                  >
                    <option value="feature launch">Feature Launch</option>
                    <option value="beta launch">Beta Launch</option>
                    <option value="internal tool">Internal Tool</option>
                    <option value="full product launch">Full Product Launch</option>
                  </select>
                </div>

                {/* Timeline */}
                <div>
                  <label htmlFor="timeline" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Timeline
                  </label>
                  <select
                    id="timeline"
                    value={inputs.timeline}
                    onChange={(e) => setInputs({ ...inputs, timeline: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white cursor-pointer"
                  >
                    <option value="today">Today</option>
                    <option value="this week">This Week</option>
                    <option value="this month">This Month</option>
                  </select>
                </div>

                {/* Primary Goal */}
                <div>
                  <label htmlFor="primary_goal" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Primary Goal
                  </label>
                  <select
                    id="primary_goal"
                    value={inputs.primary_goal}
                    onChange={(e) => setInputs({ ...inputs, primary_goal: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white cursor-pointer"
                  >
                    <option value="activation">Activation</option>
                    <option value="adoption">Adoption</option>
                    <option value="feedback">Feedback</option>
                    <option value="retention">Retention</option>
                    <option value="revenue">Revenue</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium text-sm rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating pack...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Generate Launch Pack</span>
                    </>
                  )}
                </button>

              </form>

              {/* Sample Selector Quick Button inside form */}
              <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                  Or load demo template
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_BRIEFS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleUseExample(b.id)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
                    >
                      {b.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: RESULTS WORKSPACE */}
            <div className="lg:col-span-8 flex flex-col min-h-[500px]">
              
              {/* EMPTY STATE */}
              {!pack && !isGenerating && !error && (
                <div className="flex-1 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-900/50">
                  <div className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    No Launch Pack Generated
                  </h3>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                    Fill out the Launch Configurator fields on the left and click Generate, or select one of the quick briefs to load a demo project template instantly.
                  </p>
                </div>
              )}

              {/* ERROR STATE */}
              {error && (
                <div className="flex-1 border border-red-200 dark:border-red-900/50 rounded-xl flex flex-col items-center justify-center text-center p-8 bg-red-50/50 dark:bg-red-950/10">
                  <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500 mb-4" />
                  <h3 className="text-base font-bold text-red-900 dark:text-red-300">
                    Generation Failed
                  </h3>
                  <p className="mt-2 text-xs text-red-500 dark:text-red-400 max-w-sm">
                    {error}
                  </p>
                  <button
                    onClick={handleGeneratePack}
                    className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* GENERATING / LOADING STATE */}
              {isGenerating && (
                <div className="space-y-6">
                  {/* Summary Skeleton */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4 shimmer"></div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded shimmer"></div>
                      <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded shimmer"></div>
                      <div className="h-3 w-4/6 bg-gray-200 dark:bg-gray-800 rounded shimmer"></div>
                    </div>
                  </div>

                  {/* Split Cards Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                      <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded mb-4 shimmer"></div>
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded shimmer"></div>
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded shimmer"></div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                      <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded mb-4 shimmer"></div>
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded shimmer"></div>
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded shimmer"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PACK DISPLAY SYSTEM */}
              {pack && !isGenerating && (
                <div className="space-y-6">
                  
                  {/* Top Workspace Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
                        Launch Pack is Ready
                      </h3>
                      <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400 mt-0.5">
                        Customize sections directly, copy individual components, or export the full markdown pack.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={handleCopyAll}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {copiedAll ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Markdown</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleExportMarkdown}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export Pack</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. LAUNCH SUMMARY CARD */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm relative group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                        <FileText className="h-4 w-4 text-indigo-500" />
                        <h4 className="text-sm font-bold tracking-tight">1. Launch Summary</h4>
                      </div>
                      <div className="flex items-center space-x-1 opacity-60 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingSection(editingSection === 'summary' ? null : 'summary')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Edit summary"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRegenerateSection('launch_summary')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          disabled={regeneratingSection === 'launch_summary'}
                          title="Regenerate summary"
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === 'launch_summary' ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(pack.launch_summary, 'summary')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Copy summary"
                        >
                          {copiedSection === 'summary' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {editingSection === 'summary' ? (
                      <textarea
                        rows={3}
                        value={pack.launch_summary}
                        onChange={(e) => updateSummary(e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white resize-none"
                        title="Edit Launch Summary"
                      />
                    ) : (
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                        {pack.launch_summary}
                      </p>
                    )}
                  </div>

                  {/* 2. USER STORIES & 5. DEMO SCRIPT IN A 2-COLUMN GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* USER STORIES */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                          <BookOpen className="h-4 w-4 text-indigo-500" />
                          <h4 className="text-sm font-bold tracking-tight">2. User Stories</h4>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingSection(editingSection === 'stories' ? null : 'stories')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit user stories"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRegenerateSection('user_stories')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            disabled={regeneratingSection === 'user_stories'}
                            title="Regenerate user stories"
                          >
                            <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === 'user_stories' ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => copyToClipboard(getSectionText('user_stories'), 'stories')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            {copiedSection === 'stories' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {pack.user_stories.map((story, idx) => (
                          <div key={idx} className="text-xs">
                            {editingSection === 'stories' ? (
                              <input
                                type="text"
                                value={story}
                                onChange={(e) => updateArrayItem('user_stories', idx, e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                title="Edit user story"
                              />
                            ) : (
                              <div className="flex items-start space-x-2">
                                <span className="text-indigo-500 font-semibold">•</span>
                                <span className="text-gray-600 dark:text-gray-300 leading-normal">{story}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DEMO SCRIPT */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                          <Play className="h-4 w-4 text-indigo-500" />
                          <h4 className="text-sm font-bold tracking-tight">5. Demo Flow Script</h4>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingSection(editingSection === 'demo' ? null : 'demo')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit demo flow script"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRegenerateSection('demo_script')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            disabled={regeneratingSection === 'demo_script'}
                            title="Regenerate demo flow script"
                          >
                            <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === 'demo_script' ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => copyToClipboard(getSectionText('demo_script'), 'demo')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            {copiedSection === 'demo' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {pack.demo_script.map((step, idx) => (
                          <div key={idx} className="text-xs">
                            {editingSection === 'demo' ? (
                              <input
                                type="text"
                                value={step}
                                onChange={(e) => updateArrayItem('demo_script', idx, e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                title="Edit demo step"
                              />
                            ) : (
                              <div className="flex items-start space-x-2">
                                <span className="h-5 w-5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-gray-600 dark:text-gray-300 leading-normal pt-0.5">{step}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* 3. LAUNCH CHECKLIST */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                        <CheckSquare className="h-4 w-4 text-indigo-500" />
                        <h4 className="text-sm font-bold tracking-tight">3. Structured Launch Checklist</h4>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingSection(editingSection === 'checklist' ? null : 'checklist')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Edit launch checklist"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRegenerateSection('launch_checklist')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          disabled={regeneratingSection === 'launch_checklist'}
                          title="Regenerate launch checklist"
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === 'launch_checklist' ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(getSectionText('launch_checklist'), 'checklist')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          {copiedSection === 'checklist' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* BEFORE LAUNCH */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Before Launch (Prep)
                        </h5>
                        <div className="space-y-2.5">
                          {pack.launch_checklist.before_launch.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              {editingSection === 'checklist' ? (
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => updateChecklistItem('before_launch', idx, e.target.value)}
                                  className="w-full p-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                  title="Edit prep checklist item"
                                />
                              ) : (
                                <label className="flex items-start space-x-2 text-gray-600 dark:text-gray-300 leading-normal cursor-pointer select-none">
                                  <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 shrink-0" />
                                  <span>{item}</span>
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* LAUNCH DAY */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Launch Day (Go-Live)
                        </h5>
                        <div className="space-y-2.5">
                          {pack.launch_checklist.launch_day.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              {editingSection === 'checklist' ? (
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => updateChecklistItem('launch_day', idx, e.target.value)}
                                  className="w-full p-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                  title="Edit launch day checklist item"
                                />
                              ) : (
                                <label className="flex items-start space-x-2 text-gray-600 dark:text-gray-300 leading-normal cursor-pointer select-none">
                                  <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 shrink-0" />
                                  <span>{item}</span>
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AFTER LAUNCH */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          After Launch (Analysis)
                        </h5>
                        <div className="space-y-2.5">
                          {pack.launch_checklist.after_launch.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              {editingSection === 'checklist' ? (
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => updateChecklistItem('after_launch', idx, e.target.value)}
                                  className="w-full p-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                  title="Edit post-launch checklist item"
                                />
                              ) : (
                                <label className="flex items-start space-x-2 text-gray-600 dark:text-gray-300 leading-normal cursor-pointer select-none">
                                  <input type="checkbox" className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 shrink-0" />
                                  <span>{item}</span>
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 4. RISKS & MITIGATIONS (TABLE LAYOUT) */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                        <AlertTriangle className="h-4 w-4 text-indigo-500" />
                        <h4 className="text-sm font-bold tracking-tight">4. Risks & Mitigations</h4>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingSection(editingSection === 'risks' ? null : 'risks')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Edit risks"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRegenerateSection('risks_and_blockers')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          disabled={regeneratingSection === 'risks_and_blockers'}
                          title="Regenerate risks"
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === 'risks_and_blockers' ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(getSectionText('risks_and_blockers'), 'risks')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          {copiedSection === 'risks' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto -mx-6">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            <th className="py-2.5 px-6 font-semibold">Identified Risk</th>
                            <th className="py-2.5 px-6 font-semibold w-1/4">Impact</th>
                            <th className="py-2.5 px-6 font-semibold w-1/2">Mitigation Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {pack.risks_and_blockers.map((risk, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                              <td className="py-3.5 px-6 align-top">
                                {editingSection === 'risks' ? (
                                  <input
                                    type="text"
                                    value={risk.risk}
                                    onChange={(e) => updateRiskItem(idx, 'risk', e.target.value)}
                                    className="w-full p-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none dark:text-white"
                                    title="Edit risk name"
                                  />
                                ) : (
                                  <span className="font-semibold text-gray-900 dark:text-white leading-normal">{risk.risk}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-6 align-top">
                                {editingSection === 'risks' ? (
                                  <input
                                    type="text"
                                    value={risk.impact}
                                    onChange={(e) => updateRiskItem(idx, 'impact', e.target.value)}
                                    className="w-full p-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none dark:text-white"
                                    title="Edit risk impact"
                                  />
                                ) : (
                                  <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wide uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 leading-normal">
                                    {risk.impact}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-6 align-top text-gray-500 dark:text-gray-400">
                                {editingSection === 'risks' ? (
                                  <textarea
                                    rows={2}
                                    value={risk.mitigation}
                                    onChange={(e) => updateRiskItem(idx, 'mitigation', e.target.value)}
                                    className="w-full p-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none dark:text-white resize-none"
                                    title="Edit risk mitigation"
                                  />
                                ) : (
                                  <span className="leading-relaxed block">{risk.mitigation}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 6. RELEASE NOTES & 8. FEEDBACK QUESTIONS (2-COLUMN GRID) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* RELEASE NOTES */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                          <FileText className="h-4 w-4 text-indigo-500" />
                          <h4 className="text-sm font-bold tracking-tight">6. Release Notes / Changelog</h4>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingSection(editingSection === 'release' ? null : 'release')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit release notes"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRegenerateSection('release_notes')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            disabled={regeneratingSection === 'release_notes'}
                            title="Regenerate release notes"
                          >
                            <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === 'release_notes' ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => copyToClipboard(getSectionText('release_notes'), 'release')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            {copiedSection === 'release' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        {pack.release_notes.map((note, idx) => (
                          <div key={idx} className="text-xs">
                            {editingSection === 'release' ? (
                              <input
                                type="text"
                                value={note}
                                onChange={(e) => updateArrayItem('release_notes', idx, e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                title="Edit release note item"
                              />
                            ) : (
                              <div className="flex items-start space-x-2">
                                <span className="text-indigo-500 font-semibold">•</span>
                                <span className="text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                                  {/* Auto format bold strings inside string */}
                                  {note.startsWith('**') && note.includes('**:') ? (
                                    <>
                                      <strong className="text-gray-900 dark:text-white">
                                        {note.split('**:')[0].replace(/\*\*/g, '')}:
                                      </strong>
                                      {note.split('**:')[1]}
                                    </>
                                  ) : note}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* FEEDBACK QUESTIONS */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                          <MessageSquare className="h-4 w-4 text-indigo-500" />
                          <h4 className="text-sm font-bold tracking-tight">8. Target Feedback Questions</h4>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setEditingSection(editingSection === 'feedback' ? null : 'feedback')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Edit feedback questions"
                          >
                            <PenLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRegenerateSection('feedback_questions')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            disabled={regeneratingSection === 'feedback_questions'}
                            title="Regenerate feedback questions"
                          >
                            <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === 'feedback_questions' ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => copyToClipboard(getSectionText('feedback_questions'), 'feedback')}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            {copiedSection === 'feedback' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {pack.feedback_questions.map((q, idx) => (
                          <div key={idx} className="text-xs text-gray-600 dark:text-gray-300">
                            {editingSection === 'feedback' ? (
                              <input
                                type="text"
                                value={q}
                                onChange={(e) => updateArrayItem('feedback_questions', idx, e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                title="Edit feedback question"
                              />
                            ) : (
                              <div className="flex items-start space-x-2">
                                <span className="text-indigo-500 font-semibold">{idx + 1}.</span>
                                <span className="leading-relaxed">{q}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* 7. SUCCESS METRICS & TARGET OBJECTIVES */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                        <h4 className="text-sm font-bold tracking-tight">7. Success Metrics & Objectives</h4>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingSection(editingSection === 'metrics' ? null : 'metrics')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Edit success metrics"
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRegenerateSection('success_metrics')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          disabled={regeneratingSection === 'success_metrics'}
                          title="Regenerate success metrics"
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${regeneratingSection === 'success_metrics' ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => copyToClipboard(getSectionText('success_metrics'), 'metrics')}
                          className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          {copiedSection === 'metrics' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto -mx-6">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            <th className="py-2.5 px-6 font-semibold">Success Metric</th>
                            <th className="py-2.5 px-6 font-semibold w-1/3">Target Objective</th>
                            <th className="py-2.5 px-6 font-semibold w-1/3">Why It Matters</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {pack.success_metrics.map((metric, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                              <td className="py-3.5 px-6 align-top">
                                {editingSection === 'metrics' ? (
                                  <input
                                    type="text"
                                    value={metric.metric}
                                    onChange={(e) => updateMetricItem(idx, 'metric', e.target.value)}
                                    className="w-full p-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none dark:text-white font-semibold"
                                    title="Edit metric name"
                                  />
                                ) : (
                                  <span className="font-semibold text-gray-900 dark:text-white leading-normal">{metric.metric}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-6 align-top">
                                {editingSection === 'metrics' ? (
                                  <input
                                    type="text"
                                    value={metric.target}
                                    onChange={(e) => updateMetricItem(idx, 'target', e.target.value)}
                                    className="w-full p-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none dark:text-white"
                                    title="Edit metric target"
                                  />
                                ) : (
                                  <span className="text-gray-900 dark:text-white font-normal leading-normal">{metric.target}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-6 align-top text-gray-500 dark:text-gray-400">
                                {editingSection === 'metrics' ? (
                                  <textarea
                                    rows={2}
                                    value={metric.why_it_matters}
                                    onChange={(e) => updateMetricItem(idx, 'why_it_matters', e.target.value)}
                                    className="w-full p-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded focus:outline-none dark:text-white resize-none"
                                    title="Edit metric importance reason"
                                  />
                                ) : (
                                  <span className="leading-relaxed block">{metric.why_it_matters}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* AI Assistant Floating Panel */}
          <AssistantPanel 
            inputs={inputs} 
            pack={pack} 
            onInsertBriefAction={(text) => {
              setInputs((prev) => ({
                ...prev,
                description: prev.description
                  ? `${prev.description}\n\n${text}`
                  : text,
              }));
            }}
          />

        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
