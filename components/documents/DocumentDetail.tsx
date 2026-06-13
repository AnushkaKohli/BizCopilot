"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  CheckSquare,
  AlertTriangle,
  Info,
  MessageSquare,
  Mail,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import type { Document, ChatMessage, EmailDraft, ActionItem, Risk } from "@/lib/types";
import ChatPanel from "@/components/chat/ChatPanel";
import EmailDraftPanel from "@/components/email/EmailDraftPanel";
import ActionItemList from "@/components/documents/ActionItemList";

type Tab = "summary" | "key_info" | "actions" | "risks" | "chat" | "email";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "summary", label: "Summary", icon: <FileText className="w-4 h-4" /> },
  { id: "key_info", label: "Key Info", icon: <Info className="w-4 h-4" /> },
  { id: "actions", label: "Actions", icon: <CheckSquare className="w-4 h-4" /> },
  { id: "risks", label: "Risks", icon: <AlertTriangle className="w-4 h-4" /> },
  { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "email", label: "Email Draft", icon: <Mail className="w-4 h-4" /> },
];

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-green-500/10 text-green-400 border-green-500/20",
  analyzing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  uploading: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

function CopyButton ({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy () {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

export default function DocumentDetail ({
  doc,
  chatMessages,
  emailDrafts,
  profile,
  fileUrl,
}: {
  doc: Document;
  chatMessages: ChatMessage[];
  emailDrafts: EmailDraft[];
  profile: { full_name: string | null; company_name: string | null } | null;
  fileUrl: string | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const analysis = doc.analysis;

  const pendingActions = (analysis?.action_items ?? []).filter((a) => !a.completed).length;
  const criticalRisks = (analysis?.risks ?? []).filter(
    (r) => r.severity === "critical" || r.severity === "high"
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-8 py-5">
        <div className="flex items-start justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-semibold text-lg truncate">{doc.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[doc.status] ?? STATUS_STYLES.error}`}
                >
                  {doc.status}
                </span>
                {doc.document_type && (
                  <span className="text-xs text-slate-500 capitalize">
                    {doc.document_type.replace("_", " ")}
                  </span>
                )}
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
                {pendingActions > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {pendingActions} pending actions
                  </span>
                )}
                {criticalRisks > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {criticalRisks} high risks
                  </span>
                )}
              </div>
            </div>
          </div>

          {fileUrl && (
            <a
              href={fileUrl}
              download={doc.name}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm rounded-lg transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 max-w-6xl mx-auto overflow-x-auto">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
              {icon}
              {label}
              {id === "actions" && pendingActions > 0 && (
                <span className="w-4 h-4 bg-amber-500 text-black text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingActions}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Not analyzed yet */}
          {!analysis && doc.status !== "error" && (
            <div className="text-center py-16 text-slate-500">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-600" />
              </div>
              <p>Analysis in progress...</p>
            </div>
          )}

          {doc.status === "error" && (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 font-medium">Analysis failed</p>
              <p className="text-red-400/70 text-sm mt-1">
                {doc.error_message ?? "An error occurred during analysis."}
              </p>
            </div>
          )}

          {analysis && (
            <>
              {/* SUMMARY */}
              {activeTab === "summary" && (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-white font-semibold mb-3">Summary</h2>
                    <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {analysis.action_items?.length ?? 0}
                      </div>
                      <div className="text-slate-500 text-sm">Action Items</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {analysis.risks?.length ?? 0}
                      </div>
                      <div className="text-slate-500 text-sm">Risks Identified</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white mb-1 capitalize">
                        {analysis.document_type?.replace("_", " ") ?? "—"}
                      </div>
                      <div className="text-slate-500 text-sm">Document Type</div>
                    </div>
                  </div>
                </div>
              )}

              {/* KEY INFO */}
              {activeTab === "key_info" && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-white font-semibold">Key Information</h2>
                    <CopyButton
                      text={Object.entries(analysis.key_information ?? {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join("\n")}
                      label="Copy all"
                    />
                  </div>
                  <div className="divide-y divide-slate-800">
                    {Object.entries(analysis.key_information ?? {}).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-4 px-6 py-3">
                        <div className="text-slate-500 text-sm capitalize w-1/3 shrink-0 pt-0.5">
                          {key.replace(/_/g, " ")}
                        </div>
                        <div className="text-slate-200 text-sm flex-1">
                          {/* {Array.isArray(value) ? value.join(", ") : String(value ?? "—")} */}
                          {Array.isArray(value)
                            ? value.map(item =>
                              typeof item === "object" && item !== null
                                ? JSON.stringify(item)
                                : String(item)
                            ).join(", ")
                            : typeof value === "object" && value !== null
                              ? JSON.stringify(value, null, 2)
                              : String(value ?? "—")}
                        </div>
                      </div>
                    ))}
                    {Object.keys(analysis.key_information ?? {}).length === 0 && (
                      <div className="px-6 py-8 text-slate-500 text-sm text-center">
                        No key information extracted.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ACTION ITEMS */}
              {activeTab === "actions" && (
                <ActionItemList
                  documentId={doc.id}
                  actionItems={analysis.action_items ?? []}
                />
              )}

              {/* RISKS */}
              {activeTab === "risks" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold">
                      {analysis.risks?.length ?? 0} Risk
                      {(analysis.risks?.length ?? 0) !== 1 ? "s" : ""} Identified
                    </h2>
                  </div>

                  {(analysis.risks ?? []).length === 0 ? (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-8 text-center">
                      <p className="text-green-400 font-medium">No risks identified</p>
                      <p className="text-green-400/60 text-sm mt-1">
                        This document appears to have no significant risks.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(analysis.risks as Risk[]).map((risk) => (
                        <div
                          key={risk.id}
                          className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle
                              className={`w-4 h-4 mt-0.5 shrink-0 ${risk.severity === "critical"
                                  ? "text-red-400"
                                  : risk.severity === "high"
                                    ? "text-orange-400"
                                    : risk.severity === "medium"
                                      ? "text-amber-400"
                                      : "text-green-400"
                                }`}
                            />
                            <div className="flex-1">
                              <p className="text-slate-200 text-sm">{risk.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full border capitalize ${SEVERITY_STYLES[risk.severity] ?? SEVERITY_STYLES.medium
                                    }`}
                                >
                                  {risk.severity}
                                </span>
                                {risk.category && (
                                  <span className="text-xs text-slate-600">{risk.category}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CHAT */}
              {activeTab === "chat" && (
                <ChatPanel
                  documentId={doc.id}
                  documentType={doc.document_type}
                  initialMessages={chatMessages}
                />
              )}

              {/* EMAIL DRAFT */}
              {activeTab === "email" && (
                <EmailDraftPanel
                  documentId={doc.id}
                  documentName={doc.name}
                  existingDrafts={emailDrafts}
                  profile={profile}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
