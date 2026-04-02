type CsvCell = string | number | boolean | null | undefined;

interface BuildCsvContentOptions {
  title?: string;
  summary?: Array<[string, CsvCell]>;
  header: string[];
  rows: CsvCell[][];
}

function escapeCsvCell(value: CsvCell): string {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[,"\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function buildCsvContent(options: BuildCsvContentOptions): string {
  const lines: string[] = [];

  if (options.title) {
    lines.push(escapeCsvCell(options.title));
    lines.push("");
  }

  if (options.summary && options.summary.length > 0) {
    lines.push("Summary");

    for (const [label, value] of options.summary) {
      lines.push([escapeCsvCell(label), escapeCsvCell(value)].join(","));
    }

    lines.push("");
  }

  lines.push(options.header.map(escapeCsvCell).join(","));

  for (const row of options.rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }

  return `\ufeff${lines.join("\r\n")}`;
}

export function downloadTextFile(fileName: string, content: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}