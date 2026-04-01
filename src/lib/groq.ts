import {
  UserInput,
  Roadmap,
  MockTest,
  ProjectTasks,
  Flashcard,
  InterviewRound,
  InterviewQuestionPack,
  InterviewFeedback,
} from './types';
import { SYSTEM_PROMPT } from './prompts';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function extractBalancedJson(text: string, startChar: '{' | '['): string | null {
  const endChar = startChar === '{' ? '}' : ']';
  const start = text.indexOf(startChar);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === startChar) depth++;
    if (ch === endChar) depth--;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

function cleanModelJson(content: string): string {
  return content
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}

function parseModelJson<T>(content: string, expectedRoot: 'object' | 'array'): T {
  const cleaned = cleanModelJson(content);

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const block = expectedRoot === 'object'
      ? extractBalancedJson(cleaned, '{')
      : extractBalancedJson(cleaned, '[');
    if (!block) {
      throw new Error('Could not find complete JSON in model response');
    }

    const fixed = cleanModelJson(block);
    return JSON.parse(fixed) as T;
  }
}

function toYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function normalizeToYouTubeUrl(url: string, fallbackQuery: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return toYouTubeSearchUrl(fallbackQuery);

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.toLowerCase();
    const isYouTube = host.includes('youtube.com') || host.includes('youtu.be');
    return isYouTube ? parsed.toString() : toYouTubeSearchUrl(fallbackQuery);
  } catch {
    return toYouTubeSearchUrl(fallbackQuery);
  }
}

function enforceYouTubeOnlyResources(roadmap: Roadmap): Roadmap {
  return {
    ...roadmap,
    phases: roadmap.phases.map((phase) => ({
      ...phase,
      weeks: phase.weeks.map((week) => {
        const resources = Array.isArray(week.resources) ? week.resources : [];
        const primaryTopic = week.topics?.[0] || roadmap.title || 'learning';
        return {
          ...week,
          resources: resources.map((resource) => {
            const safeTitle = (resource.title || `${primaryTopic} tutorial video`).trim();
            const query = `${safeTitle} ${primaryTopic} tutorial`;
            return {
              ...resource,
              type: 'video',
              title: safeTitle,
              url: normalizeToYouTubeUrl(resource.url, query),
            };
          }),
        };
      }),
    })),
  };
}

export async function generateRoadmap(userInput: UserInput): Promise<Roadmap> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }

  // Replace placeholders in the system prompt
  const systemPrompt = SYSTEM_PROMPT.replace('{{goal}}', userInput.goal)
    .replace('{{level}}', userInput.level)
    .replace('{{hours}}', userInput.hours.toString())
    .replace('{{months}}', userInput.months.toString())
    .replace('{{resources}}', userInput.resources)
    .replace('{{language}}', userInput.language)
    .replace('{{budget}}', userInput.budget);

  const message = `Create a personalized learning roadmap for someone with these details:
- Goal: ${userInput.goal}
- Current Level: ${userInput.level}
- Hours per week: ${userInput.hours}
- Total Duration: ${userInput.months} months
- Preferred Resources: ${userInput.resources}
- Language Preference: ${userInput.language}
- Budget: ${userInput.budget}

Important: Keep ALL resources as YouTube videos only.`;

  try {
    const requestBody = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    });

    const maxAttempts = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: requestBody,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Groq API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty response from Groq');
        const parsed = parseModelJson<Roadmap>(content, 'object');
        return enforceYouTubeOnlyResources(parsed);
      } catch (err) {
        const current = err instanceof Error ? err : new Error('Unknown Groq request error');
        const canRetry =
          attempt < maxAttempts &&
          (current.message.toLowerCase().includes('fetch failed') ||
            current.message.toLowerCase().includes('timeout') ||
            current.message.toLowerCase().includes('econnreset'));

        if (!canRetry) {
          throw current;
        }

        lastError = current;
        await new Promise((resolve) => setTimeout(resolve, attempt * 600));
      }
    }

    throw lastError ?? new Error('Failed to generate roadmap after retries');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate roadmap: ${error.message}`);
    }
    throw error;
  }
}

export async function chatWithAI(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.6,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');
    return content;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Unknown error communicating with Groq');
  }
}

export async function generateMockTest(subject: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium', count = 50): Promise<MockTest> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set in environment variables');

  const prompt = `Generate a JSON object for a mock test for the subject "${subject}" with difficulty "${difficulty}". 
Include these exact fields:
- "subject": string
- "difficulty": string (easy, medium, or hard)
- "questions": array of objects with: id (string), type (mcq|short|code), question (string), choices (array for mcq), answer (string), points (number)
- "totalPoints": number (sum of all points)

Generate exactly ${count} questions.
Keep each question concise (1 line), with short choices and short answers to fit response limits.
Return ONLY valid JSON, no other text.`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 6000,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Groq API error: ${err.error?.message || 'Unknown'}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  try {
    return parseModelJson<MockTest>(content, 'object');
  } catch {
    throw new Error('Could not parse mock test JSON');
  }
}

export async function generateProjectTasks(subject: string, complexity: 'simple' | 'moderate' | 'complex' = 'moderate'): Promise<ProjectTasks> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set in environment variables');

  const prompt = `Generate a JSON object with project tasks for the subject "${subject}" with complexity "${complexity}".
Include these exact fields:
- "subject": string
- "tasks": array of objects with: id (string), title (string), description (string), milestone (string), estimated_hours (number)

Generate 3-5 realistic, achievable tasks. Return ONLY valid JSON, no other text.`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Groq API error: ${err.error?.message || 'Unknown'}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  try {
    return parseModelJson<ProjectTasks>(content, 'object');
  } catch {
    throw new Error('Could not parse project tasks JSON');
  }
}

export async function generateFlashcards(subject: string, topics?: string[], count = 10): Promise<Flashcard[]> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set in environment variables');

  const topicStr = topics && topics.length > 0 ? ` Focus on these topics: ${topics.join(', ')}.` : '';
  const prompt = `Generate ${count} flashcard Q&A pairs for the subject "${subject}".${topicStr}
Return ONLY a valid JSON array of objects with this exact structure:
[
  {"id": "1", "front": "Question or term", "back": "Answer or definition"},
  ...
]

Make questions concise and answers clear. Do not include any markdown or extra text.`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Groq API error: ${err.error?.message || 'Unknown'}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  try {
    return parseModelJson<Flashcard[]>(content, 'array');
  } catch {
    throw new Error('Could not parse flashcards JSON');
  }
}

export async function generateInterviewQuestions(
  subject: string,
  round: InterviewRound = 'technical',
  count = 5
): Promise<InterviewQuestionPack> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set in environment variables');

  const roundHint =
    round === 'hr'
      ? 'behavioral, communication, teamwork, conflict handling, motivation'
      : 'subject knowledge, problem solving, implementation details, debugging, tradeoffs';

  const prompt = `Generate a JSON object for interview preparation.
Subject: "${subject}"
Round type: "${round}"
Focus areas: ${roundHint}

Return ONLY valid JSON with this exact structure:
{
  "subject": "string",
  "round": "hr | technical",
  "questions": [
    {
      "id": "string",
      "round": "hr | technical",
      "question": "string",
      "expected_points": ["string"]
    }
  ]
}

Generate exactly ${count} concise but interview-quality questions.`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Groq API error: ${err.error?.message || 'Unknown'}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  try {
    return parseModelJson<InterviewQuestionPack>(content, 'object');
  } catch {
    throw new Error('Could not parse interview questions JSON');
  }
}

export async function evaluateInterviewAnswer(input: {
  subject: string;
  round: InterviewRound;
  question: string;
  answer: string;
}): Promise<InterviewFeedback> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set in environment variables');

  const prompt = `Evaluate this interview answer and return JSON only.

Subject: ${input.subject}
Round: ${input.round}
Question: ${input.question}
Candidate Answer: ${input.answer}

Return EXACTLY this JSON shape:
{
  "score": number,
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "modelAnswer": "string"
}

Scoring range: 1 to 10. Keep feedback concise and practical.`;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1800,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Groq API error: ${err.error?.message || 'Unknown'}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');

  try {
    return parseModelJson<InterviewFeedback>(content, 'object');
  } catch {
    throw new Error('Could not parse interview feedback JSON');
  }
}
