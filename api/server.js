import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 4179;
const app = express();
app.use(cors());
app.use(express.json());

// Cached exercise sheet content (parsed from docs/mocks/exercise.pdf or fallback)
let cachedExerciseSheet = null;
const EXERCISE_PDF_CANDIDATES = [
  path.join(__dirname, '..', 'docs', 'mocks', 'exercise.pdf'),
  path.join(__dirname, '..', 'docs', 'assets', 'exercise.pdf'),
  path.join(__dirname, '..', 'public', 'exercise.pdf'),
  path.join(__dirname, '..', 'public', 'assets', 'mocks', 'exercise.pdf')
];

const DEFAULT_EXERCISE_TEXT = `
AI 1100 – Calculus and Linear Algebra
Week 7: Eigenvalues and matrix factorizations: Eigenvalues and eigenvectors; symmetric matrices; decomposition theorems. MBZUAI – Fall 2025
1. In problems below, find the (real) eigenvalues and associated eigenvectors of the given matrix A. Find a basis for each eigenspace of dimension 2 or larger.
(a) [4  -2; 1  1] (b) [5  -6; 3  -4] (c) [10  -8; 6  -4] (d) [7  -6; 12  -10]
(e) [[20  -1  2]; [-2  -2  -1]; [-2  6  3]] (f) [[3  5  -2]; [0  2  0]; [0  2  1]] (g) [[1  0  0]; [-6  8  2]; [1  2  -15 -3]]
2. Find the eigenvalues and a basis for each eigenspace of the linear operator defined by the stated formula.
   (a) T(x,y) = (x + 4y, 2x + 3y). (b) T(x,y,z) = (2x − y − z, x − z, −x + y + 2z).
3. Suppose that λ is an eigenvalue of matrix A with associated eigenvector v and n is a positive integer. Show that λ^n is an eigenvalue of A^n with eigenvector v.
4. Prove that the characteristic equation of a 2×2 matrix A can be expressed as λ^2 − tr(A)λ + det(A) = 0.
5. Show that if A = [[a b]; [c d]], eigenvalues are λ = 1/2[(a+d) ± sqrt((a−d)^2 + 4bc)] and analyze cases for sign of discriminant.
6. For matrix in 5, if b ≠ 0, eigenvectors x1 = [-b; a-λ1], x2 = [-b; a-λ2].
7. If λ is eigenvalue of invertible A and x eigenvector, then 1/λ is eigenvalue of A^{-1}.
8. If λ eigenvalue of A, then λ − s eigenvalue of A − sI. 9. If λ eigenvalue of A, then sλ eigenvalue of sA.
10. Compute eigenvalues/eigenspaces of A = [[-2 2 3]; [-2 3 2]; [-4 2 5]]; then deduce for A^{-1}, A−3I, A+2I.
11. Characteristic polynomial of n×n matrix has degree n with leading coefficient 1.
12. (a) A and A^T have same eigenvalues. (b) Not necessarily same eigenspaces; find 2×2 counterexample.
13. Show A and B not similar for given pairs (three 2×2, two 3×3 examples).
14. Find P that diagonalizes A for four given matrices; verify via P^{-1}AP.
15. For A = [[4 0 1]; [2 3 2]; [1 0 4]], find eigenvalues, rank of λI−A per eigenvalue, and decide diagonalizability.
16. For four matrices, compute geometric/algebraic multiplicity, diagonalizability, and P.
17. Given characteristic equations, infer matrix size and possible eigenspace dimensions.
18. Compute A^{10} for two 2×2 matrices.
19. Given A and P, confirm diagonalization and compute A^{11}.
20. Similarity transitivity question.
21. (a) Can matrix be similar to itself? (b) Matrix similar to zero matrix implications. (c) Nonsingular similar to singular?
22. Characteristic polynomial p(λ) = (λ−1)(λ−3)^2(λ−4)^3: discuss eigenspace dimensions, diagonalizable case, and eigenvalue with 3 LI eigenvectors.
23. For four linear operators, find standard matrix, diagonalizability, and P if applicable.
24. Similarity transform operator S_P(A)=P^{-1}AP: show linearity, kernel, rank.
25. Singular values for several matrices. 26. SVD for several matrices (2×2 and 3×3 cases).
`.trim();

const findPdfPath = async () => {
  for (const candidate of EXERCISE_PDF_CANDIDATES) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
};

const loadExerciseSheet = async () => {
  if (cachedExerciseSheet) return cachedExerciseSheet;
  try {
    const pdfPath = await findPdfPath();
    if (!pdfPath) {
      console.warn('[api] exercise.pdf not found, using default text fallback');
      cachedExerciseSheet = { text: DEFAULT_EXERCISE_TEXT, meta: { pages: 0, source: 'fallback' } };
      return cachedExerciseSheet;
    }

    const buffer = await fs.readFile(pdfPath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    // Preserve line breaks but trim noisy whitespace to keep prompt compact
    const text = (result.text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    cachedExerciseSheet = {
      text,
      meta: { pages: result.total ?? 0, source: pdfPath }
    };
    console.info(`[api] loaded exercise.pdf | source=${pdfPath} | pages=${result.total ?? '?'} | chars=${text.length}`);
  } catch (err) {
    console.error('[api] failed to load exercise.pdf', err);
    cachedExerciseSheet = { text: DEFAULT_EXERCISE_TEXT, meta: { pages: 0, source: 'fallback' } };
  }
  return cachedExerciseSheet;
};

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

  const exerciseSheet = await loadExerciseSheet();
  const sheetText = exerciseSheet?.text ?? '';
  const sheetNote = exerciseSheet
    ? `${exerciseSheet.meta.source ?? 'exercise.pdf'} (${exerciseSheet.meta.pages ?? '?'} pages)`
    : 'exercise.pdf unavailable';

  const prompt = `
You are an MBZUAI TA generating extra practice tasks for the lecture popup.
Ground your tasks in the provided exercise sheet content (do not invent a different topic).
Exercise sheet source: ${sheetNote}
Content:
"""
${sheetText}
"""
Requirements:
- Audience: ${skillLevel} learner.
- Lecture: "${lectureTitle}" | Course: "${course}".
- Return JSON ONLY (no markdown, no code fences) with this exact shape:
{
  "tasks": [
    {
      "id": "t1",
      "text": "<concise task description>",
      "latex": "<optional LaTeX if math expression>",
      "artifact": "<expected deliverable, e.g., notebook / slide / chart>",
      "difficulty": "<Core|Stretch|Challenge>",
      "hint": "<one-sentence nudge>",
      "solution": "<short solution sketch in plain text or LaTeX>",
      "timeMinutes": 5
    }
  ],
  "source": "exercise.pdf"
}
Rules:
- Use 4–6 tasks.
- Keep language crisp; mirror the style of the sheet but modernize wording.
- Prefer ${skillLevel} level phrasing; keep “Challenge” rare.
- If a task includes formulas, include them in "latex". Solutions may use LaTeX too.`;

  try {
    const raw = await runText(prompt, { maxTokens: 900, temperature: 0.35 });
    if (!raw || !raw.trim()) {
      console.error('[api] /practice empty completion');
      return res.status(502).json({ error: 'LLM returned empty completion', model: PRIMARY_MODEL });
    }
    const parsed = safeJsonParse(raw, null);
    if (!parsed?.tasks || !Array.isArray(parsed.tasks)) {
      console.warn('[api] /practice parse failed, returning raw text');
      return res.json({ text: raw.trim(), tasks: [] });
    }
    const tasks = parsed.tasks
      .filter((t) => t && typeof t.text === 'string')
      .map((t, idx) => ({
        id: t.id && typeof t.id === 'string' ? t.id : `t${idx + 1}`,
        text: t.text,
        latex: typeof t.latex === 'string' ? t.latex : undefined,
        artifact: typeof t.artifact === 'string' ? t.artifact : undefined,
        difficulty: typeof t.difficulty === 'string' ? t.difficulty : undefined,
        hint: typeof t.hint === 'string' ? t.hint : undefined,
        solution: typeof t.solution === 'string' ? t.solution : undefined,
        timeMinutes: Number.isFinite(t.timeMinutes) ? Number(t.timeMinutes) : undefined
      }));
    if (!tasks.length) {
      return res.json({ text: raw.trim(), tasks: [] });
    }
    const text = tasks.map((t) => `- ${t.text}`).join('\n');
    res.json({ tasks, text, source: parsed.source ?? sheetNote });
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
