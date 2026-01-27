import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 4179;
const app = express();
app.use(cors());
app.use(express.json());

// Small helper to log compact previews of objects/strings
const toPreview = (data, limit = 400) => {
  if (data === undefined) return 'undefined';
  if (data === null) return 'null';
  const str =
    typeof data === 'string'
      ? data
      : (() => {
          try {
            return JSON.stringify(data);
          } catch {
            return `[unserializable:${typeof data}]`;
          }
        })();
  const clean = str.replace(/\s+/g, ' ').trim();
  return clean.length > limit ? `${clean.slice(0, limit)}… (${clean.length} chars)` : clean;
};

// Request/response logger with timing, body previews, and status
app.use((req, res, next) => {
  const start = Date.now();
  const reqPreview = toPreview(req.body);
  console.info(`[api] --> ${req.method} ${req.originalUrl} | body=${reqPreview}`);

  // Capture response payloads sent via json() or send()
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  const capture = (payload, fn) => {
    res.locals.bodyPreview = toPreview(payload);
    return fn(payload);
  };
  res.json = (payload) => capture(payload, originalJson);
  res.send = (payload) => capture(payload, originalSend);

  res.on('finish', () => {
    const ms = Date.now() - start;
    const respPreview = res.locals.bodyPreview ?? '<stream/empty>';
    console.info(`[api] <-- ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms | resp=${respPreview}`);
  });
  next();
});

// Allow override while keeping the current default + a safe fallback
const PRIMARY_MODEL = process.env.OPENAI_MODEL_ID || 'gpt-4o-mini';
const FALLBACK_MODEL = process.env.OPENAI_FALLBACK_MODEL_ID || 'gpt-4o-mini';

const getModel = (modelId) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set on server');
  }
  const openai = createOpenAI({ apiKey });
  return openai(modelId);
};

const runText = async (prompt, opts = {}) => {
  const maxTokens = opts.maxTokens ?? 512;
  const temperature = opts.temperature ?? 0.6;
  const preview = (prompt ?? '').replace(/\s+/g, ' ').slice(0, 120);
  const start = Date.now();
  const tryModel = async (modelId, attemptLabel) => {
    const model = getModel(modelId);
    console.info(
      `[api] -> LLM ${modelId} (${attemptLabel}) | promptChars=${prompt.length} | maxTokens=${maxTokens} | temp=${temperature} | preview="${preview}${prompt.length > 120 ? '…' : ''}"`
    );
    const result = await generateText({
      model,
      prompt,
      maxTokens,
      temperature
    });
    const { text, finishReason, usage, response, toolCalls } = result;
    const ms = Date.now() - start;
    console.info(
      `[api] <- LLM ${modelId} (${attemptLabel}) | responseChars=${text?.length ?? 0} | finish=${finishReason} | promptTokens=${usage?.promptTokens ?? '?'} | completionTokens=${usage?.completionTokens ?? '?'} | ${ms}ms`
    );
    if (!text || !text.trim()) {
      const msgPreview = toPreview(response?.messages);
      console.warn(
        `[api] !! empty LLM text (finish=${finishReason}) | toolCalls=${toolCalls?.length ?? 0} | messages=${msgPreview}`
      );
      return null;
    }
    return text;
  };

  try {
    const primaryText = await tryModel(PRIMARY_MODEL, 'primary');
    if (primaryText) return primaryText;

    if (FALLBACK_MODEL && FALLBACK_MODEL !== PRIMARY_MODEL) {
      console.info(`[api] attempting fallback model ${FALLBACK_MODEL}`);
      const fallbackText = await tryModel(FALLBACK_MODEL, 'fallback');
      if (fallbackText) return fallbackText;
    }

    throw new Error('LLM returned empty text for all attempts');
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`[api] !! runText failed (models tried: ${PRIMARY_MODEL}${FALLBACK_MODEL ? ', ' + FALLBACK_MODEL : ''}; ${ms}ms)`, err);
    throw err;
  }
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
  const model = openai(MODEL_ID);
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
    if (!raw || !raw.trim()) {
      console.error('[api] /quiz empty completion');
      return res.status(502).json({ error: 'LLM returned empty completion', model: MODEL_ID });
    }
    const parsed = safeJsonParse(raw, null);
    if (!parsed || !parsed.items) {
      console.error('[api] /quiz parse failed', raw);
      return res.status(502).json({ error: 'LLM returned invalid JSON', model: MODEL_ID });
    }
    res.json(parsed);
  } catch (err) {
    console.error('quiz generation failed', err);
    res.status(500).json({ error: 'quiz generation failed' });
  }
});

// 4) Error-based quiz variant popup
app.post('/api/quiz/similar', async (req, res) => {
  const { topic, wrongAnswer } = req.body ?? {};
  const safeTopic = typeof topic === 'string' && topic.trim() ? topic.trim() : null;
  const safeWrong = typeof wrongAnswer === 'string' && wrongAnswer.trim() ? wrongAnswer.trim() : 'Not provided';
  if (!safeTopic) {
    console.warn('[api] /quiz/similar missing topic');
    return res.status(400).json({ error: 'topic is required' });
  }

  const prompt = `
Learner got a question wrong on topic "${topic}".
Wrong answer: "${wrongAnswer}".
Return a JSON object with this shape (no markdown fences):
{
  "id": "sim-<short-unique>",
  "question": "one crisp MCQ prompt",
  "options": ["A", "B", "C", "D"],
  "answer": "exact text matching one option",
  "hint": "optional short hint",
  "whyItMatters": "1 sentence on importance"
}
Rules:
- 4 options, only one correct, concise wording.
- Keep it factual, no fluff.
- Do not wrap in code fences; respond with JSON only.`;

  try {
    const raw = await runText(prompt, { maxTokens: 360, temperature: 0.55 });
    const parsed = safeJsonParse(raw, null);
    if (!parsed) {
      console.error('[api] /quiz/similar parse failed', raw);
      return res.status(500).json({ error: 'similar question generation failed' });
    }
    res.json(parsed);
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
  console.info(`[api] listening on http://localhost:${PORT}`);
  console.info(`[api] using primary model: ${PRIMARY_MODEL}`);
  console.info(`[api] fallback model: ${FALLBACK_MODEL}`);
});

// Global error handler (keep last)
app.use((err, req, res, _next) => {
  console.error('[api] unhandled error', { path: req.originalUrl, method: req.method, err });
  res.status(500).json({ error: 'internal server error' });
});
