import { NextResponse } from "next/server";
import { createClientFromRequest, createServiceClient } from "@/lib/supabase/server";
import { extractTextFromFile, chunkText } from "@/lib/document-parser";
import { openai, getEmbeddingsModel, ANALYSIS_SYSTEM_PROMPT } from "@/lib/openai";

export async function POST(request: Request) {
  let documentId: string | undefined;
  try {
    const body = await request.json();
    documentId = body?.documentId;
    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 });
    }

    const supabase = await createClientFromRequest(request.headers);
    const serviceSupabase = await createServiceClient();

    // Verify user owns this document
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Use existing raw_text if available, otherwise download + extract from Storage
    let rawText: string = doc.raw_text ?? "";

    if (!rawText.trim()) {
      if (!doc.file_path) {
        return NextResponse.json({ error: "No file or text available" }, { status: 422 });
      }

      const { data: fileData, error: storageError } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (storageError || !fileData) {
        await serviceSupabase
          .from("documents")
          .update({ status: "error", error_message: "Failed to download file" })
          .eq("id", documentId);
        return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      rawText = await extractTextFromFile(buffer, doc.file_type);

      if (!rawText.trim()) {
        await serviceSupabase
          .from("documents")
          .update({ status: "error", error_message: "Could not extract text from file" })
          .eq("id", documentId);
        return NextResponse.json({ error: "Could not extract text" }, { status: 422 });
      }
    }

    // Truncate for analysis (GPT-4o context: keep up to ~80k chars)
    const textForAnalysis = rawText.slice(0, 80000);

    // GPT-4o structured analysis with function calling
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this business document and extract structured information.\n\nDocument:\n${textForAnalysis}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_document_analysis",
            description: "Extract structured analysis from a business document",
            parameters: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description: "2-3 sentence TL;DR summary of the document",
                },
                document_type: {
                  type: "string",
                  enum: ["invoice", "contract", "email", "meeting_notes", "spreadsheet", "other"],
                  description: "Auto-detected document type",
                },
                key_information: {
                  type: "object",
                  description: "Key facts: amounts, dates, parties, terms, etc.",
                  additionalProperties: true,
                },
                action_items: {
                  type: "array",
                  description: "List of action items identified in the document",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      task: { type: "string" },
                      owner: { type: "string" },
                      due_date: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                      completed: { type: "boolean" },
                    },
                    required: ["id", "task", "priority", "completed"],
                  },
                },
                risks: {
                  type: "array",
                  description: "Risks and concerns identified in the document",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                      category: { type: "string" },
                    },
                    required: ["id", "description", "severity"],
                  },
                },
              },
              required: ["summary", "document_type", "key_information", "action_items", "risks"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_document_analysis" } },
    });

    const toolCall = analysisResponse.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No analysis returned from GPT-4o");
    }

    // Type assertion: tool_calls items always have .function when created by function tool use
    const fnCall = toolCall as { function: { arguments: string } };
    const analysis = JSON.parse(fnCall.function.arguments);

    // Ensure IDs are present on action items and risks
    analysis.action_items = (analysis.action_items ?? []).map(
      (item: Record<string, unknown>, i: number) => ({
        ...item,
        id: item.id || `ai_${i + 1}`,
        completed: item.completed ?? false,
      })
    );
    analysis.risks = (analysis.risks ?? []).map(
      (risk: Record<string, unknown>, i: number) => ({
        ...risk,
        id: risk.id || `r_${i + 1}`,
      })
    );

    // Chunk text and create embeddings for RAG
    const chunks = chunkText(rawText);
    const embeddingsModel = getEmbeddingsModel();
    const embeddings = await embeddingsModel.embedDocuments(chunks);

    // Store chunks with embeddings (use service role to bypass RLS for efficiency)
    const chunkRecords = chunks.map((content, i) => ({
      document_id: documentId,
      content,
      embedding: embeddings[i],
      chunk_index: i,
    }));

    // Delete any existing chunks first
    await serviceSupabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    // Insert new chunks in batches of 50
    for (let i = 0; i < chunkRecords.length; i += 50) {
      const batch = chunkRecords.slice(i, i + 50);
      const { error: chunkError } = await serviceSupabase
        .from("document_chunks")
        .insert(batch);
      if (chunkError) {
        console.error("Chunk insert error:", chunkError);
      }
    }

    // Update document with analysis and status
    const { error: updateError } = await serviceSupabase
      .from("documents")
      .update({
        status: "ready",
        raw_text: rawText.slice(0, 100000), // store up to 100k chars
        document_type: analysis.document_type,
        analysis,
        error_message: null,
      })
      .eq("id", documentId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    console.error("Analysis error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";

    try {
      const svc = await createServiceClient();
      if (documentId) {
        await svc.from("documents")
          .update({ status: "error", error_message: message })
          .eq("id", documentId);
      }
    } catch {}

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
