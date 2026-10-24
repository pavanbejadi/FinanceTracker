import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { analyzeFinance } from "./financeAnalyzer.js";

const parseInsights = (text) => {
  const rawText = text?.trim();
  if (!rawText) return [];

  const candidates = [rawText];
  const arrayStart = rawText.indexOf("[");
  const arrayEnd = rawText.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    candidates.push(rawText.slice(arrayStart, arrayEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      const value = JSON.parse(candidate);
      if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
        return value;
      }
    } catch {
      // Try the extracted JSON array if the model wrapped it in extra text.
    }
  }

  throw new Error("Gemini did not return a valid JSON array of insights.");
};

export const generateAIInsights = async ({ transactions, budget }) => {
  const analysis = analyzeFinance({ transactions, budget });
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      provider: "heuristic",
      insights: [...analysis.insights, ...analysis.recommendations].slice(0, 8),
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = [
      "Generate exactly 3 concise, practical personal finance insights based on this user's summary.",
      "Keep each insight under 25 words. Return only a JSON array of strings. Do not include markdown.",
      JSON.stringify({
        totalIncome: analysis.totalIncome,
        totalExpense: analysis.totalExpense,
        savings: analysis.savings,
        budgetRemaining: analysis.budgetRemaining,
        categoryBreakdown: analysis.categoryBreakdown,
        monthlyTrend: analysis.monthlyTrend,
      }),
    ].join("\n");

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.4,
      },
    });

    const insights = parseInsights(response.text);

    return {
      provider: "gemini",
      insights: insights.length ? insights.slice(0, 8) : analysis.insights,
    };
  } catch (error) {
    console.error("Gemini insights failed:", error.message);

    return {
      provider: "heuristic",
      insights: [...analysis.insights, ...analysis.recommendations].slice(0, 8),
    };
  }
};

export const predictExpense = async ({ transactions, budget }) => {
  const analysis = analyzeFinance({ transactions, budget });

  return {
    predictedExpense: analysis.predictedExpense,
    confidence: analysis.confidence,
    budgetRisk:
      analysis.monthlyBudget > 0
        ? analysis.predictedExpense > analysis.monthlyBudget
        : false,
    recommendations: analysis.recommendations,
  };
};
