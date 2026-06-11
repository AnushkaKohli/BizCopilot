export async function extractTextFromFile(
  buffer: Buffer,
  fileType: string,
): Promise<string> {
  const type = fileType.toLowerCase();

  if (type === "pdf") {
    return extractFromPdf(buffer);
  } else if (type === "docx") {
    return extractFromDocx(buffer);
  } else if (type === "txt") {
    return buffer.toString("utf-8");
  } else if (type === "csv") {
    return extractFromCsv(buffer);
  } else if (type === "xlsx" || type === "xls") {
    return extractFromXlsx(buffer);
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();

  return result.text.trim();
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

async function extractFromCsv(buffer: Buffer): Promise<string> {
  const PapaModule = await import("papaparse");
  const Papa = PapaModule.default;

  const csvText = buffer.toString("utf-8");
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (result.errors.length > 0 && result.data.length === 0) {
    return csvText;
  }

  const headers = result.meta.fields as string[];
  const rows = result.data as Record<string, string>[];

  let text = `CSV Data — ${rows.length} rows, ${headers.length} columns\n\n`;
  text += `Columns: ${headers.join(", ")}\n\n`;

  // Include up to 200 rows as readable text
  const preview = rows.slice(0, 200);
  text += preview
    .map((row) => headers.map((h) => `${h}: ${row[h] ?? ""}`).join(" | "))
    .join("\n");

  if (rows.length > 200) {
    text += `\n\n[${rows.length - 200} additional rows not shown]`;
  }

  return text;
}

async function extractFromXlsx(buffer: Buffer): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });

  let text = "";

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csvData = XLSX.utils.sheet_to_csv(sheet);

    const PapaModule = await import("papaparse");
    const Papa = PapaModule.default;
    const result = Papa.parse(csvData, { header: true, skipEmptyLines: true });

    text += `Sheet: ${sheetName}\n`;

    if (result.meta.fields && result.data.length > 0) {
      const headers = result.meta.fields as string[];
      const rows = result.data as Record<string, string>[];

      text += `Columns: ${headers.join(", ")}\n`;
      const preview = rows.slice(0, 100);
      text += preview
        .map((row) => headers.map((h) => `${h}: ${row[h] ?? ""}`).join(" | "))
        .join("\n");

      if (rows.length > 100) {
        text += `\n[${rows.length - 100} additional rows not shown]`;
      }
    } else {
      text += csvData.slice(0, 3000);
    }

    text += "\n\n";
  }

  return text.trim();
}

export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 100,
): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk.trim());
    if (i + chunkSize >= words.length) break;
  }

  return chunks;
}

export function getFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "pdf",
    doc: "docx",
    docx: "docx",
    txt: "txt",
    csv: "csv",
    xls: "xlsx",
    xlsx: "xlsx",
  };
  return map[ext] ?? ext;
}

export const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/msword": [".doc"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
};

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
