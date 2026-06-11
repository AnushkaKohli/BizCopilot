import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  FileText,
  CheckSquare,
  AlertTriangle,
  Mail,
  Upload,
  Clock,
  ChevronRight,
  Plus,
} from "lucide-react";
import type { Document, DocumentAnalysis } from "@/lib/types";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ready: "bg-green-500/10 text-green-400 border-green-500/20",
    analyzing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    uploading: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border capitalize ${styles[status] ?? styles.error}`}
    >
      {status}
    </span>
  );
}

function DocTypeIcon({ type }: { type: string | null }) {
  return (
    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
      <FileText className="w-5 h-5" />
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: documents }, { data: emailDrafts }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user!.id).single(),
      supabase
        .from("documents")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("email_drafts")
        .select("id")
        .eq("user_id", user!.id),
    ]);

  const readyDocs = (documents ?? []).filter((d) => d.status === "ready");

  // Aggregate stats across all ready documents
  let totalActionItems = 0;
  let pendingActionItems = 0;
  let totalRisks = 0;

  for (const doc of readyDocs) {
    const analysis = doc.analysis as DocumentAnalysis | null;
    if (analysis) {
      totalActionItems += analysis.action_items?.length ?? 0;
      pendingActionItems += (analysis.action_items ?? []).filter(
        (ai) => !ai.completed
      ).length;
      totalRisks += analysis.risks?.length ?? 0;
    }
  }

  const stats = [
    {
      label: "Total Documents",
      value: documents?.length ?? 0,
      icon: FileText,
      color: "indigo",
    },
    {
      label: "Pending Action Items",
      value: pendingActionItems,
      icon: CheckSquare,
      color: "amber",
    },
    {
      label: "Risks Flagged",
      value: totalRisks,
      icon: AlertTriangle,
      color: "red",
    },
    {
      label: "Email Drafts",
      value: emailDrafts?.length ?? 0,
      icon: Mail,
      color: "green",
    },
  ];

  const colorMap: Record<
    string,
    { bg: string; text: string; iconBg: string }
  > = {
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      iconBg: "bg-indigo-500/20",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      iconBg: "bg-amber-500/20",
    },
    red: {
      bg: "bg-red-500/10",
      text: "text-red-400",
      iconBg: "bg-red-500/20",
    },
    green: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      iconBg: "bg-green-500/20",
    },
  };

  const recentDocs = (documents ?? []).slice(0, 5);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back
            {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-slate-400 mt-1">
            {profile?.company_name
              ? `${profile.company_name} · `
              : ""}
            {readyDocs.length} document{readyDocs.length !== 1 ? "s" : ""} ready
          </p>
        </div>

        {!profile?.is_demo && (
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => {
          const c = colorMap[color];
          return (
            <div
              key={label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5"
            >
              <div
                className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center mb-3`}
              >
                <Icon className={`w-5 h-5 ${c.text}`} />
              </div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-slate-500 text-sm mt-1">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Documents */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold">Recent Documents</h2>
          <Link
            href="/documents"
            className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition-colors"
          >
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {recentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-white font-medium mb-2">No documents yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Upload your first document to get started.
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
          <div className="divide-y divide-slate-800">
            {recentDocs.map((doc: Document) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors group"
              >
                <DocTypeIcon type={doc.document_type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-sm font-medium truncate">
                      {doc.name}
                    </p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-xs">
                    {doc.document_type && (
                      <span className="capitalize">{doc.document_type.replace("_", " ")}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    {doc.analysis && (
                      <>
                        <span>
                          {(doc.analysis as DocumentAnalysis).action_items
                            ?.length ?? 0}{" "}
                          actions
                        </span>
                        <span>
                          {(doc.analysis as DocumentAnalysis).risks?.length ??
                            0}{" "}
                          risks
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Demo CTA */}
      {profile?.is_demo && (
        <div className="mt-6 p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
          <h3 className="text-indigo-300 font-semibold mb-1">
            You&apos;re in demo mode
          </h3>
          <p className="text-indigo-400/70 text-sm">
            Explore the pre-loaded sample documents above. Sign up with Google to
            upload your own documents and unlock full access.
          </p>
        </div>
      )}
    </div>
  );
}
