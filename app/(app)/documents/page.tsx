import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  ChevronRight,
  Upload,
  Search,
  Plus,
} from "lucide-react";
import type { Document, DocumentAnalysis } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-green-500/10 text-green-400 border-green-500/20",
  analyzing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  uploading: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: documents }, { data: profile }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("is_demo")
      .eq("id", user.id)
      .single(),
  ]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-slate-400 mt-1">
            {documents?.length ?? 0} document{documents?.length !== 1 ? "s" : ""}
          </p>
        </div>
        {!profile?.is_demo && (
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload
          </Link>
        )}
      </div>

      {!documents || documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-white font-medium mb-2">No documents yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs">
            Upload your first document to get instant AI analysis.
          </p>
          {!profile?.is_demo && (
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-800">
            {documents.map((doc: Document) => {
              const analysis = doc.analysis as DocumentAnalysis | null;
              return (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white text-sm font-medium truncate">{doc.name}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${
                          STATUS_STYLES[doc.status] ?? STATUS_STYLES.error
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-xs">
                      {doc.document_type && (
                        <span className="capitalize">
                          {doc.document_type.replace("_", " ")}
                        </span>
                      )}
                      {doc.file_size && <span>{formatSize(doc.file_size)}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      {analysis && (
                        <>
                          <span>{analysis.action_items?.length ?? 0} actions</span>
                          <span>{analysis.risks?.length ?? 0} risks</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
