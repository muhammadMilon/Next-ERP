"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download, Eye, FileSpreadsheet, FileText, Image as ImageIcon, Paperclip, Upload } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/Badge";
import type { DatasetSpec, Row } from "@/lib/data/types";
import { DOC_TYPES } from "@/lib/data/reference";
import { dateShort } from "@/lib/utils/format";
import { hashString } from "@/lib/utils/random";
import { cn } from "@/lib/utils/cn";

const ICONS = [FileText, FileSpreadsheet, ImageIcon, Paperclip];
const EXT = ["pdf", "xlsx", "jpg", "docx"];

interface DocCard {
  id: string;
  ref: string;
  type: string;
  ext: string;
  size: string;
  uploaded: string;
  status: string;
  iconIndex: number;
}

/** Turns the register rows into a document view — the shape every
 *  "document" screen in the specification needs. */
export function DocumentVault({ rows, spec }: { rows: Row[]; spec: DatasetSpec }) {
  const [uploading, setUploading] = useState(false);

  const docs = useMemo<DocCard[]>(
    () =>
      rows.slice(0, 8).map((r) => {
        const ref = String(r[spec.idField] ?? r.id);
        const h = hashString(ref);
        const dateField = spec.columns.find((c) => c.type === "date")?.key;
        return {
          id: String(r.id),
          ref,
          type: String(r.docType ?? DOC_TYPES[h % DOC_TYPES.length]),
          ext: EXT[h % EXT.length],
          size: `${((h % 4800) / 1000 + 0.2).toFixed(1)} MB`,
          uploaded: dateField ? String(r[dateField] ?? "") : "",
          status: String(r[spec.statusField ?? "status"] ?? "Draft"),
          iconIndex: h % ICONS.length,
        };
      }),
    [rows, spec],
  );

  const simulateUpload = () => {
    setUploading(true);
    toast.promise(
      new Promise<void>((resolve) => window.setTimeout(() => { setUploading(false); resolve(); }, 1100)),
      {
        loading: "Uploading to the document vault…",
        success: "Document uploaded and linked to this record",
        error: "Upload failed — check the file size",
      },
    );
  };

  return (
    <Card>
      <CardHeader
        title="Document vault"
        hint="Attachments linked to the records in this register. Files are indexed by reference and version."
        icon={<Paperclip className="size-4" />}
        actions={
          <Button size="sm" variant="primary" icon={<Upload className="size-3.5" />} loading={uploading} onClick={simulateUpload}>
            Upload
          </Button>
        }
      />
      <CardBody>
        <button
          type="button"
          onClick={simulateUpload}
          className="focus-brand mb-4 flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
        >
          <Upload className="size-5 text-brand-500" aria-hidden />
          <span className="text-[13px] font-medium text-ink-700">Drop files here or click to browse</span>
          <span className="text-[11.5px] text-ink-400">PDF, XLSX, DOCX, JPG · up to 25 MB per file</span>
        </button>

        {docs.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ink-400">No documents are linked to this register yet.</p>
        ) : (
          <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {docs.map((d) => {
              const Icon = ICONS[d.iconIndex];
              return (
                <li
                  key={d.id}
                  className="group flex flex-col gap-2 rounded-xl border border-ink-200/80 bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-lg",
                        d.ext === "pdf"
                          ? "bg-red-50 text-red-600"
                          : d.ext === "xlsx"
                            ? "bg-emerald-50 text-emerald-600"
                            : d.ext === "jpg"
                              ? "bg-sky-50 text-sky-600"
                              : "bg-brand-50 text-brand-600",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[12px] font-semibold text-ink-900">
                        {d.ref}.{d.ext}
                      </p>
                      <p className="truncate text-[11.5px] text-ink-500">{d.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-ink-400">
                    <span>{d.size}</span>
                    {d.uploaded && <span>{dateShort(d.uploaded)}</span>}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-ink-100 pt-2">
                    <StatusPill value={d.status} />
                    <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        aria-label={`Preview ${d.ref}`}
                        onClick={() => toast(`Previewing ${d.ref}.${d.ext}`, { icon: "👁️" })}
                        className="focus-brand grid size-6 place-items-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        aria-label={`Download ${d.ref}`}
                        onClick={() => toast.success(`${d.ref}.${d.ext} queued for download`)}
                        className="focus-brand grid size-6 place-items-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <Download className="size-3.5" />
                      </button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
