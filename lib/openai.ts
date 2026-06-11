import OpenAI from "openai";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function getChatModel(streaming = false) {
  return new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.3,
    streaming,
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function getEmbeddingsModel() {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export const ANALYSIS_SYSTEM_PROMPT = `You are BizCopilot, an expert business document analyst.
Analyze the provided document and extract structured information.
Be precise, professional, and thorough. Focus on what matters most for a business owner.
Respond ONLY with valid JSON matching the requested schema.`;

export const CHAT_SYSTEM_PROMPT = `You are BizCopilot, a helpful business assistant.
You help business owners understand and act on their documents.
You have been provided with relevant excerpts from the document the user is asking about.
Be concise, professional, and actionable. Use bullet points and formatting where helpful.
If you're unsure about something, say so clearly.`;

export const EMAIL_SYSTEM_PROMPT = `You are BizCopilot, an expert business communication assistant.
You draft professional emails on behalf of business owners.
Write clear, concise, and professional emails.
Match the tone to the context (formal for contracts/legal, friendly for general business).
Include a subject line at the top prefixed with "Subject: ".`;
