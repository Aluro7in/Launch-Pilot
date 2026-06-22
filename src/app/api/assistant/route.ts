import { NextRequest, NextResponse } from 'next/server';
import { ASSISTANT_SYSTEM_PROMPT } from '@/lib/assistant-prompt';

interface AssistantMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AssistantRequestBody {
  messages: AssistantMessage[];
  documentContext?: string;
  launchContext?: {
    inputs?: Record<string, any>;
    pack?: Record<string, any>;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: AssistantRequestBody = await req.json();
    const { messages, documentContext, launchContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    // Graceful fallback when no API key is configured
    if (!apiKey) {
      return NextResponse.json({
        role: 'assistant',
        content: `I'm LaunchPilot Assistant — ready to help you build better launch plans! 🚀\n\nRight now, my AI backend isn't connected yet (no API key configured). But here's what I can tell you about using LaunchPilot:\n\n**Quick start:**\n1. Fill out the **Launch Configurator** on the left with your product details\n2. Click **Generate Launch Pack** to create all 8 sections\n3. Use the edit ✏️, regenerate 🔄, and copy 📋 buttons on each section\n4. Export your full pack as Markdown when you're ready\n\n**Tip:** Try one of the example briefs first to see how a complete launch pack looks!\n\n*To enable full AI assistant capabilities, add your \`OPENROUTER_API_KEY\` to the environment variables.*`,
      });
    }

    // Build system message with full context
    let systemContent = ASSISTANT_SYSTEM_PROMPT;

    // Inject current launch context if available
    if (launchContext?.inputs) {
      const inp = launchContext.inputs;
      systemContent += `\n\n## Current User Context\nThe user is currently working on:\n- **Product**: ${inp.product_name || '(not yet entered)'}\n- **Description**: ${inp.description || '(not yet entered)'}\n- **Audience**: ${inp.audience || '(not yet entered)'}\n- **Launch Type**: ${inp.launch_type || 'feature launch'}\n- **Timeline**: ${inp.timeline || 'this week'}\n- **Primary Goal**: ${inp.primary_goal || 'activation'}`;
    }

    if (launchContext?.pack) {
      systemContent += `\n\n## Generated Launch Pack (Summary)\nThe user has already generated a launch pack. Key sections available:\n- Launch Summary: "${(launchContext.pack.launch_summary || '').substring(0, 150)}..."\n- ${(launchContext.pack.user_stories as string[])?.length || 0} user stories\n- Checklist with pre-launch, launch day, and post-launch items\n- ${(launchContext.pack.risks_and_blockers as any[])?.length || 0} risks identified\n- ${(launchContext.pack.success_metrics as any[])?.length || 0} success metrics defined`;
    }

    // Inject document context if user uploaded a file
    if (documentContext) {
      systemContent += `\n\n## Uploaded Document Content\nThe user uploaded a document. Here is the extracted text (use this to help them):\n\n---\n${documentContext.substring(0, 8000)}\n---`;
    }

    // Build messages array for OpenRouter (OpenAI-compatible format)
    const apiMessages = [
      { role: 'system', content: systemContent },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://launchpilot.app',
        'X-Title': 'LaunchPilot Assistant',
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    let fellBack = false;
    if (response.status === 402) {
      console.warn('Paid model returned 402 (Insufficient Credits). Retrying with free model openrouter/free');
      fellBack = true;
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://launchpilot.app',
          'X-Title': 'LaunchPilot Assistant',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: apiMessages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      
      if (response.status === 402) {
        return NextResponse.json({
          role: 'assistant',
          content: `### 💳 OpenRouter Credit Limit Reached (Error 402)

I attempted to process your request, but your OpenRouter account has **insufficient credits** to complete the query (even using our free fallback model).

**How to resolve this:**
1. Log in to your [OpenRouter Dashboard](https://openrouter.ai/settings/credits).
2. Add credits to your account balance (usually a minimum deposit of $1–$2 is sufficient).
3. If you recently added credits, please wait 30–60 seconds for OpenRouter to synchronize your new balance and try again!

*While your AI assistant is paused, you can still fill out the **Launch Configurator** on the left to review example briefs and explore the features of LaunchPilot.*`
        });
      }
      
      throw new Error(`AI service error (${response.status})`);
    }

    const data = await response.json();
    let assistantContent =
      data.choices?.[0]?.message?.content ||
      "I couldn't generate a response. Please try again.";

    if (fellBack) {
      assistantContent += `\n\n---\n*💡 **System Note:** Using free fallback model (\`openrouter/free\`) because your OpenRouter key has insufficient credits.*`;
    }

    return NextResponse.json({
      role: 'assistant',
      content: assistantContent,
    });
  } catch (error: any) {
    console.error('Assistant API Route Error:', error);
    
    if (error.message?.includes('402')) {
      return NextResponse.json({
        role: 'assistant',
        content: `### 💳 OpenRouter Credit Limit Reached (Error 402)

I attempted to process your request, but your OpenRouter account has **insufficient credits** to complete the query (even using our free fallback model).

**How to resolve this:**
1. Log in to your [OpenRouter Dashboard](https://openrouter.ai/settings/credits).
2. Add credits to your account balance.
3. If you recently added credits, please wait 30–60 seconds for OpenRouter to synchronize your new balance and try again!

*While your AI assistant is paused, you can still fill out the **Launch Configurator** on the left to review example briefs and explore the features of LaunchPilot.*`
      });
    }

    return NextResponse.json(
      {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
      },
      { status: 500 }
    );
  }
}
