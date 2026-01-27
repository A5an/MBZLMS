import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 4179;
const app = express();
app.use(cors());
app.use(express.json());

const getModel = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set on server');
  }
  const openai = createOpenAI({ apiKey });
  return openai('gpt-4o-mini');
};

const runText = async (prompt, opts = {}) => {
  const model = getModel();
  const { text } = await generateText({
    model,
    prompt,
    maxTokens: opts.maxTokens ?? 512,
    temperature: opts.temperature ?? 0.6
  });
  return text;
};

const safeJsonParse = (raw, fallback) => {
  if (!raw) return fallback;
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[api] JSON parse failed, returning fallback', err);
    return fallback;
  }
};

// Simple health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/brief', async (_req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not set on server' });
  }

  const openai = createOpenAI({ apiKey });
  const model = openai('gpt-4o-mini');
  const prompt =
    'Give me a very short, 2-sentence motivating daily brief for a Masters student in AI at MBZUAI. Mention a cutting edge topic like LLMs or Computer Vision.';

  try {
    const { text } = await generateText({ model, prompt, maxTokens: 120, temperature: 0.6 });
    res.json({ text });
  } catch (err) {
    console.error('brief generation failed', err);
    res.status(500).json({ error: 'brief generation failed' });
  }
});

// 1) Lecture summary popup
app.post('/api/summary', async (req, res) => {
  const { lectureTitle, course, notes } = req.body ?? {};
  if (!lectureTitle || !course) {
    return res.status(400).json({ error: 'lectureTitle and course are required' });
  }

  const prompt = `
You are an MBZUAI teaching assistant creating a succinct recap.
Lecture title: "${lectureTitle}"
Course: "${course}"
Context/notes: "${notes ?? 'n/a'}"

Return 5 bullets max. Each bullet must be 1 sentence, leading with a bolded label in brackets (e.g., [Key Idea]).
Tone: concise, high-signal, no fluff.`;

  try {
    const text = await runText(prompt, { maxTokens: 320, temperature: 0.45 });
    res.json({ text });
  } catch (err) {
    console.error('summary generation failed', err);
    res.status(500).json({ error: 'summary generation failed' });
  }
});

// 2) Practice tasks popup
app.post('/api/practice', async (req, res) => {
  const { lectureTitle, course, skillLevel = 'intermediate' } = req.body ?? {};
  if (!lectureTitle || !course) {
    return res.status(400).json({ error: 'lectureTitle and course are required' });
  }

  const prompt = `
Design 4 practice tasks for "${lectureTitle}" in course "${course}".
Skill level: ${skillLevel}.
Each task: one line, start with a verb, include expected artifact (e.g., notebook, slide, chart).
Return plain text list with hyphen bullets. Keep it tight.`;

  try {
    const text = await runText(prompt, { maxTokens: 280, temperature: 0.5 });
    res.json({ text });
  } catch (err) {
    console.error('practice generation failed', err);
    res.status(500).json({ error: 'practice generation failed' });
  }
});

// 3) Quiz / flashcards after lecture
app.post('/api/quiz', async (req, res) => {
  const { lectureTitle, course, count = 5 } = req.body ?? {};
  if (!lectureTitle || !course) {
    return res.status(400).json({ error: 'lectureTitle and course are required' });
  }

  const prompt = `
Create a JSON object for a post-lecture quiz.
Lecture: "${lectureTitle}" | Course: "${course}" | Items: ${count}
Schema: { "items": [ { "id": "q1", "question": "...", "options": ["A", "B", ...], "answer": "exact option text", "hint": "optional", "whyItMatters": "1 sentence" } ] }
Rules: 
- 3-5 options per question, only one correct answer.
- Use short, clear wording. No code blocks, no markdown. Respond with JSON only.`;

  try {
    const raw = await runText(prompt, { maxTokens: 800, temperature: 0.4 });
    const parsed = safeJsonParse(raw, { items: [] });
    res.json(parsed);
  } catch (err) {
    console.error('quiz generation failed', err);
    res.status(500).json({ error: 'quiz generation failed' });
  }
});

// 4) Error-based quiz variant popup
app.post('/api/quiz/similar', async (req, res) => {
  const { topic, wrongAnswer } = req.body ?? {};
  if (!topic || !wrongAnswer) {
    return res.status(400).json({ error: 'topic and wrongAnswer are required' });
  }

  const prompt = `
Learner got a question wrong on topic "${topic}".
Wrong answer: "${wrongAnswer}".
Write 1 similar multiple-choice question plus correct answer and a quick why-it-matters note.
Return 3 lines:
Q: ...
A: ...
Why: ...`;

  try {
    const text = await runText(prompt, { maxTokens: 260, temperature: 0.55 });
    res.json({ text });
  } catch (err) {
    console.error('similar question generation failed', err);
    res.status(500).json({ error: 'similar question generation failed' });
  }
});

// 5) Recap last 2 weeks popup (digest)
app.post('/api/recap', async (req, res) => {
  const { course, recentLectures = [] } = req.body ?? {};
  if (!course) {
    return res.status(400).json({ error: 'course is required' });
  }

  const list = Array.isArray(recentLectures) ? recentLectures : [];
  const prompt = `
Produce a 2-week learning recap for the course "${course}".
Recent lecture titles: ${list.length ? list.map((l) => `"${l}"`).join(', ') : 'not provided'}.
Include: 3 headline takeaways, 2 retention checkpoints, 1 suggested next action.
Format as short bullets, no markdown code fences.`;

  try {
    const text = await runText(prompt, { maxTokens: 320, temperature: 0.45 });
    res.json({ text });
  } catch (err) {
    console.error('recap generation failed', err);
    res.status(500).json({ error: 'recap generation failed' });
  }
});

// 6) Full-day recap (single-day digest)
app.post('/api/recap/day', async (req, res) => {
  const { course, lectures = [] } = req.body ?? {};
  if (!course) {
    return res.status(400).json({ error: 'course is required' });
  }

  const list = Array.isArray(lectures) ? lectures : [];
  const prompt = `
You are an MBZUAI study coach. Create a SAME-DAY recap for course "${course}" based on today's lectures:
${list.length ? list.map((l) => `- ${l}`).join('\n') : '- Lecture titles not provided'}

Deliver:
- 3 headline takeaways (one line each, no numbering)
- 3 flashcard-ready Q/A pairs (format: Q: ... | A: ...)
- 1 action for tomorrow.
Keep it ultra concise. No code fences.`;

  try {
    const text = await runText(prompt, { maxTokens: 360, temperature: 0.45 });
    res.json({ text });
  } catch (err) {
    console.error('day recap generation failed', err);
    res.status(500).json({ error: 'day recap generation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
