import { z } from "zod";

const API_BASE = "/api";

const fetchJson = async <T>(path: string, fallback: T, init?: RequestInit): Promise<T> => {
  try {
    const res = await fetch(`${API_BASE}${path}`, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data as T) ?? fallback;
  } catch (err) {
    console.warn(`[geminiService] request failed for ${path}`, err);
    return fallback;
  }
};

const unwrapText = (payload: unknown, fallback: string) => {
  if (typeof payload === "string") return payload;
  if (payload && typeof payload === "object" && "text" in (payload as Record<string, unknown>)) {
    const t = (payload as { text?: unknown }).text;
    if (typeof t === "string") return t;
  }
  return fallback;
};

// 1) Lecture summary popup
export const generateLectureSummary = async (lectureTitle: string, course: string, notes?: string) => {
  const raw = await fetchJson<unknown>(
    "/summary",
    "Summary unavailable (server endpoint required).",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureTitle, course, notes })
    }
  );
  return unwrapText(raw, "Summary unavailable (server endpoint required).");
};

// 2) Practice tasks popup
export const generatePracticeTasks = async (lectureTitle: string, course: string, skillLevel: "beginner" | "intermediate" | "advanced" = "intermediate") => {
  const raw = await fetchJson<unknown>(
    "/practice",
    "Practice tasks unavailable (server endpoint required).",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureTitle, course, skillLevel })
    }
  );
  return unwrapText(raw, "Practice tasks unavailable (server endpoint required).");
};

// 3) Quiz / flashcards after lecture (JSON structure for UI)
export type QuizItem = {
  id: string;
  question: string;
  options: string[];
  answer: string;
  hint?: string;
  whyItMatters: string;
};

const quizItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.string(),
  hint: z.string().optional(),
  whyItMatters: z.string()
});

const quizSchema = z
  .object({
    items: z.array(quizItemSchema).min(3).max(12)
  })
  .strict();

type QuizPayload = z.infer<typeof quizSchema>;

export const generateLectureQuiz = async (lectureTitle: string, course: string, count = 5): Promise<QuizItem[]> => {
  const data = await fetchJson<QuizPayload>(
    "/quiz",
    { items: [] },
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureTitle, course, count })
    }
  );
  try {
    const { items } = quizSchema.parse(data);
    return items as QuizItem[];
  } catch {
    return [];
  }
};

// 4) Error-based quiz variant popup
const similarQuizItemSchema = quizItemSchema.extend({
  id: z.string().min(1),
  options: z.array(z.string()).min(2),
  answer: z.string().min(1),
  whyItMatters: z.string().min(1)
});

export const generateSimilarQuestions = async (topic: string, wrongAnswer: string = 'Not provided') => {
  const raw = await fetchJson<unknown>(
    "/quiz/similar",
    null,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, wrongAnswer })
    }
  );

  if (!raw) return null;
  try {
    const parsed = similarQuizItemSchema.parse(raw);
    return parsed as QuizItem;
  } catch (err) {
    console.warn("[geminiService] similar question parse failed", err);
    return null;
  }
};

// 5) Recap last 2 weeks popup (digest)
export const generateTwoWeekRecap = async (course: string, recentLectures: string[]) => {
  const raw = await fetchJson<unknown>(
    "/recap",
    "Recap unavailable (server endpoint required).",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, recentLectures })
    }
  );
  return unwrapText(raw, "Recap unavailable (server endpoint required).");
};

// 6) Full-day recap (for same-day lecture digest)
export const generateFullDayRecap = async (course: string, lectures: string[]) => {
  const raw = await fetchJson<unknown>(
    "/recap/day",
    "Full-day recap unavailable (server endpoint required).",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, lectures })
    }
  );
  return unwrapText(raw, "Full-day recap unavailable (server endpoint required).");
};

// Existing brief (kept for widget)
export const getDailyBrief = async (): Promise<string> => {
  const prompt = "Give me a very short, 2-sentence motivating daily brief for a Masters student in AI at MBZUAI. Mention a cutting edge topic like LLMs or Computer Vision.";
  console.log("[geminiService] getDailyBrief called");

  try {
    const res = await fetch("/api/brief");
    if (res.ok) {
      const data = await res.json();
      if (data?.text) {
        console.log("[geminiService] brief fetched from /api/brief");
        return data.text;
      }
    }
    console.warn("[geminiService] /api/brief returned no text");
  } catch (err) {
    console.error("[geminiService] fetch /api/brief failed", err);
  }

  console.warn("[geminiService] returning fallback brief");
  return "Keep pushing the boundaries of AI!";
};
