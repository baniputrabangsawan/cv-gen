import type { BackupPayload, CVDocument } from "@/types/cv";
import { DEFAULT_DESIGN, DEFAULT_SECTION_ORDER, DEFAULT_SECTION_TITLES } from "./defaults";

const DB_NAME = "cvkita-db";
const STORE = "documents";
const DB_VERSION = 1;

function normalizePhone(value: string) {
  return value.startsWith("+") ? `+${value.slice(1).replace(/\D/g, "")}` : value;
}

function normalizeDesign(design: Partial<CVDocument["design"]> | undefined): CVDocument["design"] {
  const next = { ...DEFAULT_DESIGN, ...design };
  if (next.fontFamily === "Arial") next.fontFamily = "Helvetica";
  if (next.fontFamily === "Times New Roman") next.fontFamily = "Times-Roman";
  return next;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    const timer = window.setTimeout(() => { if (!settled) { settled = true; reject(new Error("STORAGE_TIMEOUT")); } }, 1800);
    request.onsuccess = () => { if (!settled) { settled = true; window.clearTimeout(timer); resolve(request.result); } else { request.result.close(); } };
    request.onerror = () => { if (!settled) { settled = true; window.clearTimeout(timer); reject(request.error); } };
  });
}

export async function listDocuments(): Promise<CVDocument[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as unknown[]).map(migrateDocument).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    req.onerror = () => reject(req.error);
  });
}

export async function putDocument(document: CVDocument): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(document);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function removeDocument(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function validateBackup(input: unknown): BackupPayload {
  if (!input || typeof input !== "object") throw new Error("INVALID_BACKUP");
  const data = input as Partial<BackupPayload>;
  if (data.app !== "CVKita" || !Array.isArray(data.documents)) throw new Error("INVALID_BACKUP");
  let documents: CVDocument[];
  try { documents = data.documents.map((document) => migrateDocument(document)); }
  catch { throw new Error("INVALID_BACKUP"); }
  return { app: "CVKita", schemaVersion: 2, exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : new Date().toISOString(), documents };
}

export function migrateDocument(input: unknown): CVDocument {
  if (!input || typeof input !== "object") throw new Error("INVALID_DOCUMENT");
  const source = input as Record<string, unknown>;
  const content = source.content as Record<string, unknown> | undefined;
  if (!source.id || !content || !content.personal) throw new Error("INVALID_DOCUMENT");
  if (source.schemaVersion === 2) {
    const document = source as unknown as CVDocument;
    return {
      ...document,
      design: normalizeDesign(document.design),
      sectionOrder: [...document.sectionOrder, ...DEFAULT_SECTION_ORDER.filter((id) => !document.sectionOrder.includes(id))],
      hiddenSections: document.hiddenSections ?? [],
      sectionTitles: { ...DEFAULT_SECTION_TITLES, ...document.sectionTitles },
      content: { ...document.content, personal: { ...document.content.personal, phone: normalizePhone(document.content.personal.phone) }, awards: document.content.awards ?? [], volunteer: document.content.volunteer ?? [] },
    };
  }
  const oldSkills = Array.isArray(content.skills) ? content.skills as Array<{ id?: string; name?: string; level?: string }> : [];
  const oldCertifications = Array.isArray(content.certifications) ? content.certifications as Array<Record<string, string>> : [];
  const oldContent = content as unknown as CVDocument["content"];
  const sectionOrder = Array.isArray(source.sectionOrder) ? source.sectionOrder.filter((id): id is CVDocument["sectionOrder"][number] => typeof id === "string" && DEFAULT_SECTION_ORDER.includes(id as CVDocument["sectionOrder"][number])) : [];
  return {
    ...(source as unknown as CVDocument),
    schemaVersion: 2,
    design: normalizeDesign(source.design as Partial<CVDocument["design"]> | undefined),
    sectionOrder: [...sectionOrder, ...DEFAULT_SECTION_ORDER.filter((id) => !sectionOrder.includes(id))],
    hiddenSections: Array.isArray(source.hiddenSections) ? source.hiddenSections as CVDocument["hiddenSections"] : [],
    sectionTitles: { ...DEFAULT_SECTION_TITLES },
    content: {
      ...oldContent,
      personal: { ...oldContent.personal, phone: normalizePhone(oldContent.personal.phone) },
      skills: oldSkills.length ? [{ id: crypto.randomUUID(), name: "Skills", items: oldSkills.filter((skill) => skill.name).map((skill) => skill.level ? `${skill.name} (${skill.level})` : skill.name!) }] : [],
      awards: [],
      certifications: oldCertifications.map((item) => ({ id: item.id || crypto.randomUUID(), name: item.name || "", issuer: item.issuer || "", date: item.date || item.year || "", expiryDate: item.expiryDate || "", credentialId: item.credentialId || "", url: item.url || "" })),
      volunteer: [],
    },
  };
}

export function validateDocument(input: unknown): CVDocument {
  return migrateDocument(input);
}

export function safeFileName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9À-ž]+/g, "-").replace(/^-|-$/g, "") || "CV";
}
