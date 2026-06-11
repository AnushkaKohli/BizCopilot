import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UploadZone from "@/components/documents/UploadZone";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_demo")
    .eq("id", user.id)
    .single();

  if (profile?.is_demo) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8 text-center">
          <h2 className="text-amber-300 font-semibold text-lg mb-2">
            Demo Mode
          </h2>
          <p className="text-amber-400/70">
            Document upload is disabled in demo mode. Sign in with Google to
            upload your own business documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Upload Document</h1>
        <p className="text-slate-400 mt-1">
          Upload a business document to get instant AI analysis.
        </p>
      </div>
      <UploadZone userId={user.id} />
    </div>
  );
}
