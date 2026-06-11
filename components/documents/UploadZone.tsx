"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE, getFileType } from "@/lib/document-parser";

type UploadState = "idle" | "uploading" | "analyzing" | "done" | "error";

export default function UploadZone({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setError(null);
      setState("idle");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_FILE_TYPES,
      maxFiles: 1,
      maxSize: MAX_FILE_SIZE,
    });

  async function handleUpload() {
    if (!file) return;
    setState("uploading");
    setError(null);

    try {
      const fileType = getFileType(file.name);
      const filePath = `${userId}/${Date.now()}_${file.name}`;

      // Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (storageError) throw new Error(storageError.message);

      // Create document record
      const { data: doc, error: dbError } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          name: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
          status: "analyzing",
        })
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      setDocId(doc.id);
      setState("analyzing");

      // Trigger analysis
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Analysis failed");
      }

      setState("done");
      setTimeout(() => router.push(`/documents/${doc.id}`), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setState("error");
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const rejectionMessage = fileRejections[0]?.errors[0]?.message;

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-indigo-500 bg-indigo-500/5"
            : file
            ? "border-slate-600 bg-slate-800/30"
            : "border-slate-700 hover:border-slate-600 bg-slate-900/50"
        }`}
      >
        <input {...getInputProps()} />

        {!file ? (
          <>
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-white font-medium mb-1">
              {isDragActive ? "Drop it here" : "Drag & drop your document"}
            </p>
            <p className="text-slate-500 text-sm mb-4">
              or click to browse files
            </p>
            <p className="text-slate-600 text-xs">
              PDF, DOCX, TXT, CSV, XLSX · Max 20MB
            </p>
          </>
        ) : (
          <div className="flex items-center gap-4 justify-center">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <File className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-slate-500 text-sm">{formatSize(file.size)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setState("idle");
              }}
              className="ml-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Rejection message */}
      {(rejectionMessage || error) && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-red-400 text-sm">{rejectionMessage ?? error}</p>
        </div>
      )}

      {/* Progress states */}
      {state === "uploading" && (
        <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <p className="text-blue-400 text-sm">Uploading document...</p>
        </div>
      )}
      {state === "analyzing" && (
        <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <div>
            <p className="text-indigo-400 text-sm font-medium">
              AI is analyzing your document...
            </p>
            <p className="text-indigo-400/60 text-xs mt-0.5">
              Extracting key info, action items, and risks. This takes 15–30 seconds.
            </p>
          </div>
        </div>
      )}
      {state === "done" && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-green-400 text-sm">
            Analysis complete! Redirecting...
          </p>
        </div>
      )}

      {/* Upload button */}
      {file && state === "idle" && (
        <button
          onClick={handleUpload}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Analyze Document
        </button>
      )}

      {/* Supported formats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "PDF", desc: "Invoices, contracts, reports" },
          { label: "DOCX", desc: "Word documents, agreements" },
          { label: "CSV / XLSX", desc: "Spreadsheets, financial data" },
          { label: "TXT", desc: "Emails, meeting notes" },
        ].map(({ label, desc }) => (
          <div
            key={label}
            className="bg-slate-900 border border-slate-800 rounded-lg p-3"
          >
            <div className="text-white text-sm font-medium">{label}</div>
            <div className="text-slate-500 text-xs">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
