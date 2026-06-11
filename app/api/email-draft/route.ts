import { NextResponse } from "next/server";
import { createClientFromRequest, createServiceClient } from "@/lib/supabase/server";
import { openai, EMAIL_SYSTEM_PROMPT } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { documentId, instruction } = await request.json();

    if (!documentId || !instruction) {
      return NextResponse.json(
        { error: "documentId and instruction required" },
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

    // Get document and user profile for context
    const [{ data: doc }, { data: profile }] = await Promise.all([
      supabase
        .from("documents")
        .select("name, raw_text, analysis, document_type")
        .eq("id", documentId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("full_name, company_name, email")
        .eq("id", user.id)
        .single(),
    ]);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const senderInfo = [
      profile?.full_name ? `Name: ${profile.full_name}` : null,
      profile?.company_name ? `Company: ${profile.company_name}` : null,
      profile?.email ? `Email: ${profile.email}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const docContext = doc.analysis
      ? `Document Summary: ${(doc.analysis as { summary?: string }).summary ?? ""}\n\nDocument Type: ${doc.document_type ?? "unknown"}\n\nOriginal Document (excerpt):\n${doc.raw_text?.slice(0, 4000) ?? ""}`
      : `Document: ${doc.name}\n\n${doc.raw_text?.slice(0, 5000) ?? ""}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `${EMAIL_SYSTEM_PROMPT}\n\nSender Information:\n${senderInfo || "Business owner"}`,
        },
        {
          role: "user",
          content: `Based on this document, draft a professional email.\n\nContext:\n${docContext}\n\nInstruction:\n${instruction}`,
        },
      ],
    });

    const draft = response.choices[0]?.message?.content ?? "";

    // Save to DB
    const { data: saved } = await serviceSupabase
      .from("email_drafts")
      .insert({
        document_id: documentId,
        user_id: user.id,
        instruction,
        draft_content: draft,
      })
      .select()
      .single();

    return NextResponse.json({ draft, id: saved?.id });
  } catch (err) {
    console.error("Email draft error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email draft failed" },
      { status: 500 }
    );
  }
}
