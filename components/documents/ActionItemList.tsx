"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckSquare,
  Square,
  Calendar,
  User,
  Download,
  Copy,
  Check,
} from "lucide-react";
import type { ActionItem, DocumentAnalysis } from "@/lib/types";

const PRIORITY_STYLES = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

export default function ActionItemList({
  documentId,
  actionItems: initial,
}: {
  documentId: string;
  actionItems: ActionItem[];
}) {
  const [items, setItems] = useState<ActionItem[]>(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  async function toggleItem(id: string) {
    setSaving(id);
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);

    // Update the full analysis in DB
    const { data: doc } = await supabase
      .from("documents")
      .select("analysis")
      .eq("id", documentId)
      .single();

    if (doc?.analysis) {
      const analysis = doc.analysis as DocumentAnalysis;
      analysis.action_items = updated;
      await supabase
        .from("documents")
        .update({ analysis })
        .eq("id", documentId);
    }
    setSaving(null);
  }

  function exportToCsv() {
    const headers = ["Task", "Owner", "Due Date", "Priority", "Status"];
    const rows = items.map((item) => [
      `"${item.task}"`,
      item.owner ?? "",
      item.due_date ?? "",
      item.priority,
      item.completed ? "Completed" : "Pending",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "action-items.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyAsChecklist() {
    const text = items
      .map(
        (item) =>
          `${item.completed ? "☑" : "☐"} ${item.task}${item.owner ? ` (@${item.owner})` : ""}${item.due_date ? ` — Due: ${item.due_date}` : ""} [${item.priority}]`
      )
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const pending = items.filter((i) => !i.completed).length;
  const completed = items.filter((i) => i.completed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">
            {items.length} Action Item{items.length !== 1 ? "s" : ""}
          </h2>
          <p className="text-slate-500 text-sm">
            {pending} pending · {completed} completed
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={copyAsChecklist}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "Copied!" : "Copy checklist"}
            </button>
            <button
              onClick={exportToCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-500">No action items identified.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-900 border rounded-xl p-4 transition-opacity ${
                item.completed ? "opacity-60 border-slate-800" : "border-slate-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleItem(item.id)}
                  disabled={saving === item.id}
                  className="mt-0.5 shrink-0 text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
                >
                  {item.completed ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      item.completed
                        ? "line-through text-slate-500"
                        : "text-slate-200"
                    }`}
                  >
                    {item.task}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                        PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.low
                      }`}
                    >
                      {item.priority}
                    </span>
                    {item.owner && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        {item.owner}
                      </span>
                    )}
                    {item.due_date && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {item.due_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
