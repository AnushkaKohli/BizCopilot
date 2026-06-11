"use client";

import { useState } from "react";
import {
  Mail,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import type { EmailDraft } from "@/lib/types";

const INSTRUCTIONS = [
  "Reply acknowledging receipt and confirming we'll process this",
  "Reply accepting the terms and confirming we'll proceed",
  "Reply requesting more information or clarification",
  "Reply pushing back on specific terms",
  "Reply declining politely",
  "Write a follow-up email asking for a status update",
];

export default function EmailDraftPanel({
  documentId,
  documentName,
  existingDrafts,
  profile,
}: {
  documentId: string;
  documentName: string;
  existingDrafts: EmailDraft[];
  profile: { full_name: string | null; company_name: string | null } | null;
}) {
  const [instruction, setInstruction] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editedDraft, setEditedDraft] = useState<string>("");

  async function generateDraft() {
    if (!instruction.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/email-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, instruction }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setDraft(data.draft);
      setEditedDraft(data.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function loadDraft(d: EmailDraft) {
    setDraft(d.draft_content);
    setEditedDraft(d.draft_content);
    setInstruction(d.instruction);
    setShowHistory(false);
  }

  // Parse subject line from draft
  function parseEmailParts(text: string) {
    const lines = text.split("\n");
    const subjectLine = lines.find((l) => l.toLowerCase().startsWith("subject:"));
    const body = subjectLine
      ? lines.filter((l) => l !== subjectLine).join("\n").trim()
      : text;
    const subject = subjectLine
      ? subjectLine.replace(/^subject:\s*/i, "").trim()
      : null;
    return { subject, body };
  }

  const { subject, body } = draft ? parseEmailParts(editedDraft) : { subject: null, body: null };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-semibold mb-1">Email Draft Generator</h2>
        <p className="text-slate-500 text-sm">
          Describe what you want to say — BizCopilot will draft a professional
          email{profile?.full_name ? ` from ${profile.full_name}` : ""}
          {profile?.company_name ? `, ${profile.company_name}` : ""}.
        </p>
      </div>

      {/* Instruction input */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-white text-sm font-medium block mb-2">
            What should the email do?
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={`e.g. "Reply accepting the invoice and confirming payment by next week"`}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 outline-none resize-none transition-colors"
          />
        </div>

        {/* Quick suggestion chips */}
        <div className="flex flex-wrap gap-2">
          {INSTRUCTIONS.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => setInstruction(s)}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={generateDraft}
          disabled={!instruction.trim() || isGenerating}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerating ? "Generating..." : "Generate Draft"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Draft output */}
      {draft && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span className="text-white text-sm font-medium">Draft Email</span>
            </div>
            <button
              onClick={() => handleCopy(editedDraft)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "Copied!" : "Copy email"}
            </button>
          </div>

          {subject && (
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30">
              <span className="text-slate-500 text-xs uppercase tracking-wide">
                Subject
              </span>
              <p className="text-white text-sm mt-1">{subject}</p>
            </div>
          )}

          <div className="p-5">
            <textarea
              value={editedDraft}
              onChange={(e) => setEditedDraft(e.target.value)}
              className="w-full bg-transparent text-slate-200 text-sm leading-relaxed outline-none resize-none min-h-[200px]"
              rows={12}
              placeholder="Your email draft will appear here..."
            />
          </div>
          <div className="px-5 pb-4 text-slate-600 text-xs">
            You can edit the draft above before copying.
          </div>
        </div>
      )}

      {/* Draft history */}
      {existingDrafts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <span>
              Previous drafts ({existingDrafts.length})
            </span>
            {showHistory ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showHistory && (
            <div className="border-t border-slate-800 divide-y divide-slate-800">
              {existingDrafts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => loadDraft(d)}
                  className="w-full text-left px-5 py-3 hover:bg-slate-800/50 transition-colors"
                >
                  <p className="text-slate-300 text-sm truncate">{d.instruction}</p>
                  <p className="text-slate-600 text-xs mt-1">
                    {new Date(d.created_at).toLocaleDateString()}{" "}
                    {new Date(d.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
