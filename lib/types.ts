export type DocumentStatus = "uploading" | "analyzing" | "ready" | "error";
export type DocumentType =
  | "invoice"
  | "contract"
  | "email"
  | "meeting_notes"
  | "spreadsheet"
  | "other";
export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type MessageRole = "user" | "assistant";

export interface ActionItem {
  id: string;
  task: string;
  owner?: string;
  due_date?: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
}

export interface Risk {
  id: string;
  description: string;
  severity: RiskSeverity;
  category?: string;
}

export interface KeyInformation {
  [key: string]: string | number | string[] | undefined;
}

export interface DocumentAnalysis {
  summary: string;
  document_type: DocumentType;
  key_information: KeyInformation;
  action_items: ActionItem[];
  risks: Risk[];
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  name: string;
  file_path: string | null;
  file_type: string;
  file_size: number | null;
  document_type: DocumentType | null;
  status: DocumentStatus;
  raw_text: string | null;
  analysis: DocumentAnalysis | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  document_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface EmailDraft {
  id: string;
  document_id: string;
  user_id: string;
  instruction: string;
  draft_content: string;
  created_at: string;
}

export interface DashboardStats {
  total_documents: number;
  pending_action_items: number;
  total_risks: number;
  email_drafts: number;
}
