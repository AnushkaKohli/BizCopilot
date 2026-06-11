import { NextResponse } from "next/server";
import { createClientFromRequest, createServiceClient } from "@/lib/supabase/server";
import { openai, getEmbeddingsModel, CHAT_SYSTEM_PROMPT } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { documentId, message } = await request.json();

    if (!documentId || !message) {
      return NextResponse.json(
        { error: "documentId and message required" },
        { status: 400 }
      );
    }

    const supabase = await createClientFromRequest(request.headers);
    const serviceSupabase = await createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify document ownership
    const { data: doc } = await supabase
      .from("documents")
      .select("id, raw_text, document_type, analysis")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Save user message
    await serviceSupabase.from("chat_messages").insert({
      document_id: documentId,
      user_id: user.id,
      role: "user",
      content: message,
    });

    // Embed the user query for RAG
    const embeddingsModel = getEmbeddingsModel();
    const queryEmbedding = await embeddingsModel.embedQuery(message);

    // Vector similarity search for relevant chunks
    const { data: chunks } = await serviceSupabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_document_id: documentId,
      match_count: 5,
    });

    const context =
      chunks && chunks.length > 0
        ? chunks
            .map((c: { content: string; similarity: number }, i: number) =>
              `[Excerpt ${i + 1}]:\n${c.content}`
            )
            .join("\n\n")
        : doc.raw_text?.slice(0, 8000) ?? "No document text available.";

    // Fetch recent chat history
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true })
      .limit(20);

    const historyMessages = (history ?? []).slice(0, -1); // exclude the just-inserted message

    // Stream response from GPT-4o
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      stream: true,
      messages: [
        {
          role: "system",
          content: `${CHAT_SYSTEM_PROMPT}\n\nRelevant document excerpts:\n\n${context}`,
        },
        ...historyMessages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
    });

    // Return as a readable stream (SSE-compatible)
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullResponse += delta;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
          }
        }

        // Save assistant reply
        await serviceSupabase.from("chat_messages").insert({
          document_id: documentId,
          user_id: user.id,
          role: "assistant",
          content: fullResponse,
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 }
    );
  }
}
