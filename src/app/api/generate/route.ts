import { NextRequest, NextResponse } from 'next/server';
import { getMockLaunchPack } from '@/lib/mock-data';
import { LaunchFormInputs, LaunchPack } from '@/lib/types';

// Helper to validate structured output format from LLM
function validateLaunchPack(json: any): json is LaunchPack {
  return (
    json &&
    typeof json.launch_summary === 'string' &&
    Array.isArray(json.user_stories) &&
    json.launch_checklist &&
    Array.isArray(json.launch_checklist.before_launch) &&
    Array.isArray(json.launch_checklist.launch_day) &&
    Array.isArray(json.launch_checklist.after_launch) &&
    Array.isArray(json.risks_and_blockers) &&
    Array.isArray(json.demo_script) &&
    Array.isArray(json.release_notes) &&
    Array.isArray(json.success_metrics) &&
    Array.isArray(json.feedback_questions)
  );
}

export async function POST(req: NextRequest) {
  try {
    const inputs: LaunchFormInputs = await req.json();

    // Check if we want to regenerate a specific section (for individual card regeneration)
    const { searchParams } = new URL(req.url);
    const regenerateSection = searchParams.get('regenerateSection'); // e.g. "user_stories", "launch_checklist", etc.

    // 1. Check if LLM integration is requested and keys exist
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;

    // Use simulated delay for mock data to look like processing
    const isMock = !geminiApiKey && !openAiApiKey && !openrouterApiKey;

    if (isMock) {
      // Simulate real AI processing latency (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const mockPack = getMockLaunchPack(inputs);

      if (regenerateSection) {
        // Return just that section
        return NextResponse.json({
          [regenerateSection]: mockPack[regenerateSection as keyof LaunchPack]
        });
      }
      return NextResponse.json(mockPack);
    }

    // 2. Real AI Route Integration (Phase 2 ready!)
    const prompt = `You are an expert product manager, growth marketer, and product launch director.
Generate a structured, launch-ready execution pack for:
Product Name: ${inputs.product_name}
Launch Brief/Description: ${inputs.description}
Target Audience: ${inputs.audience}
Launch Type: ${inputs.launch_type}
Timeline: ${inputs.timeline}
Primary Goal: ${inputs.primary_goal}

Your response MUST be valid JSON matching this schema:
{
  "launch_summary": "A concise, 2-3 sentence strategic launch summary",
  "user_stories": ["3 key user stories formatted as 'As a..., I want..., So that...'"],
  "launch_checklist": {
    "before_launch": ["3 actionable checklists for pre-launch"],
    "launch_day": ["3 actionable checklists for launch day"],
    "after_launch": ["3 actionable checklists for post-launch analytics/follow-up"]
  },
  "risks_and_blockers": [
    {
      "risk": "Potential risk name",
      "impact": "Low/Medium/High - specific brief outcome",
      "mitigation": "Concrete action user can take to prevent or solve this risk"
    }
  ],
  "demo_script": ["3-4 specific sequential steps for a live video or walkthrough demo"],
  "release_notes": ["3-4 product updates or changelog bullet points, prefixing with bold titles like **Title**:"],
  "success_metrics": [
    {
      "metric": "Name of metric",
      "target": "Target objective (e.g. 500 actions completed)",
      "why_it_matters": "Context link to primary goal of ${inputs.primary_goal}"
    }
  ],
  "feedback_questions": ["3 specific product feedback questions to ask target audience"]
}

${
  regenerateSection
    ? `NOTE: The user requested to specifically regenerate ONLY the '${regenerateSection}' section. Please still return the full valid JSON schema, but pay extra close attention to randomize, refine, and improve the content of the '${regenerateSection}' section.`
    : ''
}

Do NOT wrap the output in markdown formatting like \`\`\`json ... \`\`\`. Return raw JSON content only.`;

    if (geminiApiKey) {
      // Call Gemini API (using fast 2.5 flash or latest model)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const resData = await response.json();
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No content returned from Gemini API');

      const parsed = JSON.parse(text);
      if (validateLaunchPack(parsed)) {
        if (regenerateSection) {
          return NextResponse.json({
            [regenerateSection]: parsed[regenerateSection as keyof LaunchPack]
          });
        }
        return NextResponse.json(parsed);
      }
      throw new Error('Invalid LaunchPack structure returned from Gemini');
    }

    if (openAiApiKey) {
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const resData = await response.json();
      const text = resData.choices?.[0]?.message?.content;
      if (!text) throw new Error('No content returned from OpenAI API');

      const parsed = JSON.parse(text);
      if (validateLaunchPack(parsed)) {
        if (regenerateSection) {
          return NextResponse.json({
            [regenerateSection]: parsed[regenerateSection as keyof LaunchPack]
          });
        }
        return NextResponse.json(parsed);
      }
      throw new Error('Invalid LaunchPack structure returned from OpenAI');
    }

    if (openrouterApiKey) {
      // Call OpenRouter API
      let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterApiKey}`,
          'HTTP-Referer': 'https://launchpilot.app',
          'X-Title': 'LaunchPilot'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (response.status === 402) {
        console.warn('Paid model returned 402 (Insufficient Credits) during generation. Retrying with free model openrouter/free');
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openrouterApiKey}`,
            'HTTP-Referer': 'https://launchpilot.app',
            'X-Title': 'LaunchPilot'
          },
          body: JSON.stringify({
            model: 'openrouter/free',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
        });
      }

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Your OpenRouter API key has insufficient credits (Error 402). Please add credits at https://openrouter.ai/settings/credits to enable AI launch pack generation.');
        }
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const resData = await response.json();
      const text = resData.choices?.[0]?.message?.content;
      if (!text) throw new Error('No content returned from OpenRouter API');

      const parsed = JSON.parse(text);
      if (validateLaunchPack(parsed)) {
        if (regenerateSection) {
          return NextResponse.json({
            [regenerateSection]: parsed[regenerateSection as keyof LaunchPack]
          });
        }
        return NextResponse.json(parsed);
      }
      throw new Error('Invalid LaunchPack structure returned from OpenRouter');
    }

    throw new Error('API Key configuration error');
  } catch (error: any) {
    console.error('Generation API Route Error:', error);
    let message = error.message || 'Failed to generate launch pack.';
    if (message.includes('402')) {
      message = 'Your OpenRouter API key has insufficient credits (Error 402). Please add credits at https://openrouter.ai/settings/credits to enable AI launch pack generation.';
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
