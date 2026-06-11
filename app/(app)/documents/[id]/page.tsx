import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import DocumentDetail from "@/components/documents/DocumentDetail";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: doc } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) notFound();

  const { data: chatMessages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("document_id", id)
    .order("created_at", { ascending: true });

  const { data: emailDrafts } = await supabase
    .from("email_drafts")
    .select("*")
    .eq("document_id", id)
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .single();

  // Get signed URL for original file download
  let fileUrl: string | null = null;
  if (doc.file_path) {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 3600);
    fileUrl = data?.signedUrl ?? null;
  }

  return (
    <DocumentDetail
      doc={doc}
      chatMessages={chatMessages ?? []}
      emailDrafts={emailDrafts ?? []}
      profile={profile}
      fileUrl={fileUrl}
    />
  );
}
