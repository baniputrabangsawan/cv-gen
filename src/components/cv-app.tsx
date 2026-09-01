"use client";

import dynamic from "next/dynamic";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, FileJson, FilePlus2, FileText, Languages, LoaderCircle, Moon, MoreHorizontal, Pencil, Settings2, Sparkles, Sun, Trash2, Upload } from "lucide-react";
import { createBlankDocument, createSampleDocument } from "@/lib/defaults";
import { documentToMarkdown, downloadText } from "@/lib/exporters";
import { copy } from "@/lib/i18n";
import { listDocuments, putDocument, removeDocument, safeFileName, validateBackup, validateDocument } from "@/lib/storage";
import type { BackupPayload, CVDocument, Locale, TemplateId } from "@/types/cv";
import { EditorPanel, templates } from "./editor-panel";
import { CVPdfDocument } from "./pdf-document";

const PdfPreview = dynamic(() => import("./pdf-preview"), { ssr: false, loading: () => <PreviewSkeleton /> });
type SaveStatus = "saving" | "saved" | "error";

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(value), delay); return () => window.clearTimeout(timer); }, [value, delay]);
  return debounced;
}

function PreviewSkeleton() {
  return <div className="preview-skeleton" aria-label="Loading PDF preview"><div className="skeleton-line wide" /><div className="skeleton-line mid" /><div className="skeleton-block" /></div>;
}

export function CVApp() {
  const [documents, setDocuments] = useState<CVDocument[]>([]);
  const [activeId, setActiveId] = useState("");
  const [locale, setLocale] = useState<Locale>("id");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [editorMode, setEditorMode] = useState<"content" | "design">("content");
  const importInput = useRef<HTMLInputElement>(null);
  const active = documents.find((document) => document.id === activeId) ?? documents[0];
  const previewDocument = useDebouncedValue(active, 250);
  const t = copy[locale];

  useEffect(() => {
    void (async () => {
      try {
        let stored = await listDocuments();
        if (!stored.length) { const sample = createSampleDocument(); await putDocument(sample); stored = [sample]; }
        const remembered = localStorage.getItem("cvkita-active");
        const savedLocale = localStorage.getItem("cvkita-locale") as Locale | null;
        const savedTheme = localStorage.getItem("cvkita-theme");
        const nextTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        setDocuments(stored); setActiveId(stored.some((document) => document.id === remembered) ? remembered! : stored[0].id);
        if (savedLocale === "id" || savedLocale === "en") setLocale(savedLocale);
        setTheme(nextTheme); document.documentElement.dataset.theme = nextTheme;
      } catch {
        const fallback = createSampleDocument(); setDocuments([fallback]); setActiveId(fallback.id); setSaveStatus("error");
      } finally { setHydrated(true); }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated || !active) return;
    const timer = window.setTimeout(async () => { try { await putDocument(active); setSaveStatus("saved"); } catch { setSaveStatus("error"); } }, 500);
    return () => window.clearTimeout(timer);
  }, [active, hydrated]);

  const updateActive = (next: CVDocument) => { setSaveStatus("saving"); setDocuments((current) => current.map((document) => document.id === next.id ? next : document)); };
  const selectDocument = (id: string) => { setActiveId(id); localStorage.setItem("cvkita-active", id); };
  const addDocument = () => { const document = createBlankDocument(locale === "id" ? "CV Baru" : "New CV"); setDocuments((items) => [document, ...items]); selectDocument(document.id); };
  const duplicate = () => { if (!active) return; const now = new Date().toISOString(); const document = { ...structuredClone(active), id: crypto.randomUUID(), title: `${active.title} — Copy`, createdAt: now, updatedAt: now }; setDocuments((items) => [document, ...items]); selectDocument(document.id); };
  const rename = () => { if (!active) return; const title = window.prompt(locale === "id" ? "Nama dokumen" : "Document name", active.title)?.trim(); if (title) updateActive({ ...active, title, updatedAt: new Date().toISOString() }); };
  const deleteActive = async () => { if (!active || !window.confirm(t.confirmDelete)) return; await removeDocument(active.id); const remaining = documents.filter((document) => document.id !== active.id); if (remaining.length) { setDocuments(remaining); selectDocument(remaining[0].id); } else { const blank = createBlankDocument(); setDocuments([blank]); selectDocument(blank.id); } };
  const prefill = () => { if (!active) return; const sample = createSampleDocument(active.title); updateActive({ ...sample, id: active.id, title: active.title, createdAt: active.createdAt }); };
  const clearContent = () => { if (!active || !window.confirm(locale === "id" ? "Hapus seluruh isi CV ini?" : "Clear all content in this CV?")) return; const blank = createBlankDocument(active.title); updateActive({ ...active, content: blank.content, sectionOrder: blank.sectionOrder, hiddenSections: [], sectionTitles: blank.sectionTitles, updatedAt: new Date().toISOString() }); };
  const changeLocale = () => { const next = locale === "id" ? "en" : "id"; setLocale(next); localStorage.setItem("cvkita-locale", next); document.documentElement.lang = next; };
  const changeTheme = () => { const next = theme === "light" ? "dark" : "light"; setTheme(next); localStorage.setItem("cvkita-theme", next); document.documentElement.dataset.theme = next; };
  const backup = () => { const payload: BackupPayload = { app: "CVKita", schemaVersion: 2, exportedAt: new Date().toISOString(), documents }; downloadText(JSON.stringify(payload, null, 2), `CVKita-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json"); };
  const importJson = async (file: File) => {
    try {
      const json = JSON.parse(await file.text());
      if (json?.app === "CVKita" && Array.isArray(json.documents)) {
        const payload = validateBackup(json); for (const document of payload.documents) await putDocument(document); const merged = await listDocuments(); setDocuments(merged); selectDocument(payload.documents[0]?.id || merged[0].id);
      } else {
        const imported = validateDocument(json); const id = documents.some((document) => document.id === imported.id) ? crypto.randomUUID() : imported.id; const document = { ...imported, id, title: imported.title || file.name.replace(/\.json$/i, "") }; await putDocument(document); setDocuments((items) => [document, ...items]); selectDocument(document.id);
      }
    } catch { alert(t.invalidBackup); }
  };
  const setTemplate = (templateId: TemplateId) => { if (active) updateActive({ ...active, templateId, updatedAt: new Date().toISOString() }); };
  const baseName = safeFileName(active?.content.personal.fullName || active?.title || "CV");
  const statusNode = useMemo(() => saveStatus === "saving" ? <LoaderCircle className="spin" size={12} /> : saveStatus === "error" ? <span>!</span> : <Check size={12} />, [saveStatus]);

  if (!hydrated || !active) return <main className="loading-screen"><div className="brand-mark">CV</div><p>Menyiapkan studio Anda…</p></main>;

  return <main className="app-shell">
    <nav className="mobile-switch" aria-label="View"><button className={mobileView === "editor" ? "active" : ""} onClick={() => setMobileView("editor")}>{t.editor}</button><button className={mobileView === "preview" ? "active" : ""} onClick={() => setMobileView("preview")}>{t.preview}</button></nav>
    <div className="workspace">
      <section className={`editor-pane ${mobileView !== "editor" ? "mobile-hidden" : ""}`} aria-label={t.editor}>
        <header className="pane-toolbar editor-toolbar"><div className="document-picker"><span className="brand-mark">CV</span><select aria-label={t.documents} value={active.id} onChange={(event) => selectDocument(event.target.value)}>{documents.map((document) => <option value={document.id} key={document.id}>{document.title}</option>)}</select><span className={`save-dot ${saveStatus}`} title={saveStatus}>{statusNode}</span></div><div className="toolbar-actions">
          <button className="toolbar-button icon-only has-tooltip" data-tooltip={locale === "id" ? "Impor CV dari file JSON" : "Import a CV from JSON"} onClick={() => importInput.current?.click()} aria-label="Import JSON"><Upload size={15} /></button><input ref={importInput} hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importJson(file); event.currentTarget.value = ""; }} />
          <button className="toolbar-button icon-only has-tooltip" data-tooltip={locale === "id" ? "Isi CV dengan contoh" : "Fill the CV with sample content"} onClick={prefill} aria-label={locale === "id" ? "Isi contoh" : "Pre-fill example"}><Sparkles size={15} /></button><button className="toolbar-button icon-only danger-hover has-tooltip" data-tooltip={locale === "id" ? "Hapus semua isi CV" : "Clear all CV content"} onClick={clearContent} aria-label={locale === "id" ? "Hapus semua" : "Clear all"}><Trash2 size={15} /></button><button className="toolbar-button icon-only has-tooltip" data-tooltip={locale === "id" ? "Ganti tema terang atau gelap" : "Switch light or dark theme"} onClick={changeTheme} aria-label="Toggle theme">{theme === "light" ? <Moon size={15} /> : <Sun size={15} />}</button><button className="language-toggle has-tooltip" data-tooltip={locale === "id" ? "Ganti bahasa tampilan" : "Switch interface language"} onClick={changeLocale}><Languages size={14} />{locale.toUpperCase()}</button>
          <details className="action-menu has-tooltip" data-tooltip={locale === "id" ? "Kelola dokumen CV" : "Manage CV documents"}><summary className="toolbar-button icon-only" aria-label="Document actions"><MoreHorizontal size={16} /></summary><div className="menu-popover"><button onClick={addDocument}><FilePlus2 size={15} />{t.newCv}</button><button onClick={duplicate}><Copy size={15} />{t.duplicate}</button><button onClick={rename}><Pencil size={15} />{t.rename}</button><hr /><button onClick={backup}><FileJson size={15} />{t.backup}</button><button className="danger" onClick={deleteActive}><Trash2 size={15} />{t.delete}</button></div></details>
        </div></header>
        <EditorPanel document={active} locale={locale} mode={editorMode} onChange={updateActive} onCloseSettings={() => setEditorMode("content")} />
      </section>
      <section className={`preview-pane ${mobileView !== "preview" ? "mobile-hidden" : ""}`} aria-label={t.preview}>
        <header className="pane-toolbar preview-toolbar"><div className="template-switcher" aria-label={t.template}>{templates.map((template) => <button key={template.id} className={active.templateId === template.id ? "active" : ""} onClick={() => setTemplate(template.id)}>{template.name}</button>)}</div><div className="toolbar-actions"><button className={`toolbar-button icon-only has-tooltip ${editorMode === "design" ? "active" : ""}`} data-tooltip={locale === "id" ? "Atur template dan tampilan CV" : "Adjust CV template and appearance"} onClick={() => { setEditorMode(editorMode === "design" ? "content" : "design"); setMobileView("editor"); }} aria-label={t.design}><Settings2 size={15} /></button><details className="download-menu action-menu has-tooltip" data-tooltip={locale === "id" ? "Unduh CV dalam beberapa format" : "Download the CV in multiple formats"}><summary className="download-trigger"><Download size={14} />{t.download}<ChevronDown size={13} /></summary><div className="menu-popover"><PDFDownloadLink document={<CVPdfDocument document={active} locale={locale} />} fileName={`${baseName}_CV.pdf`}><Download size={15} />PDF</PDFDownloadLink><button onClick={() => downloadText(documentToMarkdown(active, locale), `${baseName}_CV.md`, "text/markdown")}><FileText size={15} />Markdown</button><button onClick={() => downloadText(JSON.stringify(active, null, 2), `${baseName}_CV.json`, "application/json")}><FileJson size={15} />JSON</button></div></details></div></header>
        <div className="pdf-stage">{previewDocument ? <PdfPreview document={previewDocument} locale={locale} /> : <PreviewSkeleton />}</div>
      </section>
    </div>
    <details className="mobile-download action-menu"><summary aria-label={t.download}><Download size={17} /></summary><div className="menu-popover"><PDFDownloadLink document={<CVPdfDocument document={active} locale={locale} />} fileName={`${baseName}_CV.pdf`}>PDF</PDFDownloadLink><button onClick={() => downloadText(documentToMarkdown(active, locale), `${baseName}_CV.md`, "text/markdown")}>Markdown</button><button onClick={() => downloadText(JSON.stringify(active, null, 2), `${baseName}_CV.json`, "application/json")}>JSON</button></div></details>
  </main>;
}
