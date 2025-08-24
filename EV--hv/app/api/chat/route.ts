// app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { query, context } = await req.json();

  if (!query || !context) {
    return NextResponse.json({ error: "Missing query or context" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are the "ChargeConnect Assistant", a helpful AI for an EV charging app.
      Your goal is to answer user questions based on the provided context.
      If the answer is not in the context, say you don't have enough information.
      Keep your answers concise and helpful.

      Context:
      ---
      ${context}
      ---

      Question: "${query}"
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}