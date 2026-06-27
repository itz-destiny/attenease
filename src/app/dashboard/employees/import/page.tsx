"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

type ParsedRow = { name: string; email: string; role: string; _rowNum: number; _error?: string };
type ResultRow = { name: string; email: string; password: string; status: "created" | "skipped"; reason?: string };

const REQUIRED_COLS = ["Full Name", "Email Address"];
const TEMPLATE_ROWS = [
  ["Full Name", "Email Address", "Role (employee/admin)"],
  ["Chisom Eze", "chisom.eze@acmecorp.com", "employee"],
  ["Biodun Adeyemi", "biodun.adeyemi@acmecorp.com", "employee"],
  ["Ngozi Obi", "ngozi.obi@acmecorp.com", "admin"],
  ["Tunde Salami", "tunde.salami@acmecorp.com", "employee"],
];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
  ws["!cols"] = [{ wch: 28 }, { wch: 36 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, ws, "Employees");
  XLSX.writeFile(wb, "AttendEase_Import_Template.xlsx");
}

function exportCredentials(results: ResultRow[]) {
  const created = results.filter((r) => r.status === "created");
  const rows = [
    ["Full Name", "Email Address", "Temporary Password", "Login URL"],
    ...created.map((r) => [r.name, r.email, r.password, `${window.location.origin}/sign-in`]),
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 28 }, { wch: 36 }, { wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws, "Credentials");
  XLSX.writeFile(wb, "AttendEase_Employee_Credentials.xlsx");
}

function parseFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];
        if (raw.length < 2) return reject(new Error("File is empty or has no data rows."));

        const header = raw[0].map((h) => String(h).trim());
        const nameIdx = header.findIndex((h) => h.toLowerCase().includes("name") || h.toLowerCase().includes("full"));
        const emailIdx = header.findIndex((h) => h.toLowerCase().includes("email"));
        const roleIdx = header.findIndex((h) => h.toLowerCase().includes("role"));

        if (nameIdx === -1 || emailIdx === -1) {
          return reject(new Error(`Missing required columns. File must have "Full Name" and "Email Address" columns.`));
        }

        const rows: ParsedRow[] = [];
        for (let i = 1; i < raw.length; i++) {
          const row = raw[i];
          const name = String(row[nameIdx] ?? "").trim();
          const email = String(row[emailIdx] ?? "").trim().toLowerCase();
          const role = roleIdx !== -1 ? String(row[roleIdx] ?? "employee").trim().toLowerCase() : "employee";
          if (!name && !email) continue;
          const error = !name ? "Missing name" : !email.includes("@") ? "Invalid email" : undefined;
          rows.push({ name, email, role: ["admin", "employee"].includes(role) ? role : "employee", _rowNum: i + 1, _error: error });
        }
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultRow[] | null>(null);

  async function handleFile(file: File) {
    setParseError("");
    setParsed(null);
    setResults(null);
    try {
      const rows = await parseFile(file);
      setParsed(rows);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : "Failed to parse file.");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function runImport() {
    if (!parsed) return;
    const validRows = parsed.filter((r) => !r._error);
    if (validRows.length === 0) return;

    setImporting(true);
    setProgress(0);

    // Batch in chunks of 100 to avoid hitting timeouts
    const CHUNK = 100;
    const allResults: ResultRow[] = [];

    for (let i = 0; i < validRows.length; i += CHUNK) {
      const chunk = validRows.slice(i, i + CHUNK);
      const res = await fetch("/api/employees/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: chunk }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImporting(false);
        setParseError(data.error || "Import failed.");
        return;
      }
      allResults.push(...data.results);
      setProgress(Math.round(((i + chunk.length) / validRows.length) * 100));
    }

    // Also add skipped (parse-error) rows to results for full report
    for (const r of parsed.filter((r) => r._error)) {
      allResults.push({ name: r.name, email: r.email, password: "", status: "skipped", reason: r._error });
    }

    setResults(allResults);
    setImporting(false);
    setProgress(100);
  }

  const validCount = parsed?.filter((r) => !r._error).length ?? 0;
  const errorCount = parsed?.filter((r) => r._error).length ?? 0;
  const createdCount = results?.filter((r) => r.status === "created").length ?? 0;
  const skippedCount = results?.filter((r) => r.status === "skipped").length ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/employees"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Bulk Import Employees</h1>
          <p className="text-slate-500 text-sm mt-0.5">Import up to 1,000 employees from Excel or CSV in one go</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6">
        <h2 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
          <span>📋</span> How it works
        </h2>
        <ol className="space-y-1.5 text-sm text-indigo-700">
          <li className="flex items-start gap-2"><span className="font-bold flex-shrink-0">1.</span> Download the Excel template below and fill in your employees' Full Name and Email Address.</li>
          <li className="flex items-start gap-2"><span className="font-bold flex-shrink-0">2.</span> Upload the completed file — we'll show a preview so you can review before importing.</li>
          <li className="flex items-start gap-2"><span className="font-bold flex-shrink-0">3.</span> Click Import. We'll create accounts with auto-generated passwords.</li>
          <li className="flex items-start gap-2"><span className="font-bold flex-shrink-0">4.</span> Download the credentials sheet and share it with your employees so they can log in.</li>
        </ol>
      </div>

      {/* Template download */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-800">Download Import Template</h3>
          <p className="text-sm text-slate-500 mt-0.5">Excel file with the correct column headers and example rows</p>
        </div>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Template (.xlsx)
        </button>
      </div>

      {/* Upload area */}
      {!results && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-5 ${
            dragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
          <div className="text-4xl mb-3">📂</div>
          <p className="font-semibold text-slate-700 mb-1">Drop your file here or click to browse</p>
          <p className="text-sm text-slate-400">Supports .xlsx, .xls, .csv — up to 1,000 rows</p>
          {parseError && <p className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl inline-block">{parseError}</p>}
        </div>
      )}

      {/* Preview table */}
      {parsed && !results && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-800">Preview</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {parsed.length} rows detected ·{" "}
                <span className="text-emerald-600 font-medium">{validCount} valid</span>
                {errorCount > 0 && <span className="text-red-500 font-medium"> · {errorCount} with errors (will be skipped)</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setParsed(null); setParseError(""); if (fileRef.current) fileRef.current.value = ""; }}
                className="border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                Change file
              </button>
              <button onClick={runImport} disabled={importing || validCount === 0}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                {importing ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing… {progress}%</>
                ) : (
                  `Import ${validCount} Employee${validCount !== 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </div>

          {importing && (
            <div className="h-1.5 bg-slate-100">
              <div className="h-full bg-indigo-600 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {["#", "Full Name", "Email Address", "Role", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {parsed.map((row, i) => (
                  <tr key={i} className={row._error ? "bg-red-50/50" : ""}>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{row._rowNum}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{row.name || <span className="text-slate-300 italic">empty</span>}</td>
                    <td className="px-4 py-2.5 text-slate-600">{row.email || <span className="text-slate-300 italic">empty</span>}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {row._error && <span className="text-xs text-red-500 bg-red-100 px-2 py-0.5 rounded-full">{row._error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-emerald-600">{createdCount}</p>
                <p className="text-sm text-emerald-700 font-medium mt-1">Accounts Created</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-extrabold text-amber-600">{skippedCount}</p>
                <p className="text-sm text-amber-700 font-medium mt-1">Skipped</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
                <p className="text-3xl font-extrabold text-indigo-600">{results.length}</p>
                <p className="text-sm text-indigo-700 font-medium mt-1">Total Processed</p>
              </div>
            </div>

            {createdCount > 0 && (
              <div className="bg-emerald-600 rounded-xl p-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold">Download Credentials Sheet</p>
                  <p className="text-emerald-200 text-sm mt-0.5">Contains email addresses and temporary passwords for all {createdCount} new accounts</p>
                </div>
                <button onClick={() => exportCredentials(results)}
                  className="bg-white text-emerald-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-emerald-50 transition-colors flex items-center gap-2 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Credentials (.xlsx)
                </button>
              </div>
            )}
          </div>

          {/* Full results table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Import Log</h3>
              <div className="flex gap-2">
                <button onClick={() => { setParsed(null); setResults(null); setParseError(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  Import another file →
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    {["Name", "Email", "Password", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.map((r, i) => (
                    <tr key={i} className={r.status === "skipped" ? "bg-amber-50/30" : ""}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.email}</td>
                      <td className="px-4 py-2.5 font-mono text-sm text-slate-700">{r.password || "—"}</td>
                      <td className="px-4 py-2.5">
                        {r.status === "created" ? (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Created</span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium" title={r.reason}>Skipped{r.reason ? `: ${r.reason}` : ""}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/employees"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              View Employees →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
