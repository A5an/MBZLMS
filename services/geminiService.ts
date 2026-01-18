import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateKnowledgeGraph = async (topic: string): Promise<any> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("Missing GEMINI_API_KEY");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a knowledge graph structure for the topic: "${topic}" in the context of Artificial Intelligence and Computer Science. 
      Return a JSON object with 'nodes' (concepts) and 'links' (relationships). 
      Nodes should have 'id' (name) and 'group' (1 for main topic, 2 for sub-concepts, 3 for details). 
      Links should have 'source' and 'target' matching node ids. Limit to 10-15 nodes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  group: { type: Type.NUMBER }
                }
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating graph:", error);
    return {
      nodes: [{id: "Error", group: 1}],
      links: []
    };
  }
};

export const getDailyBrief = async (): Promise<string> => {
    try {
        const ai = getAiClient();
        if (!ai) throw new Error("Missing GEMINI_API_KEY");
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Give me a very short, 2-sentence motivating daily brief for a Masters student in AI at MBZUAI. Mention a cutting edge topic like LLMs or Computer Vision."
        });
        return response.text || "Keep pushing the boundaries of AI!";
    } catch (e) {
        return "Welcome back to campus.";
    }
}
