import { describe, expect, it } from "vitest";
import { createBlankDocument, createSampleDocument } from "./defaults";
import { safeFileName, validateBackup } from "./storage";

describe("CVKita document model", () => {
  it("creates independent, schema-versioned documents", () => {
    const first = createBlankDocument();
    const second = createBlankDocument();
    expect(first.schemaVersion).toBe(2);
    expect(first.id).not.toBe(second.id);
    expect(first.sectionOrder).toHaveLength(9);
    expect(first.design.fontFamily).toBe("Helvetica");
    expect(first.design.titleSize).toBe(15);
    expect(first.design.bodySize).toBe(12);
  });

  it("creates a useful first-run sample", () => {
    const sample = createSampleDocument();
    expect(sample.content.personal.fullName).toBeTruthy();
    expect(sample.content.personal.phone).toBe("+6281234567890");
    expect(sample.content.experience.length).toBeGreaterThan(0);
    expect(sample.templateId).toBe("modern");
  });
});

describe("backup validation", () => {
  it("accepts a CVKita v1 backup", () => {
    const documents = [createBlankDocument()];
    const legacy = { ...documents[0], design: { accentColor: "#0f766e", fontFamily: "Helvetica", fontScale: 100, marginPreset: 16, density: "normal", showPhoto: true } };
    const backup = validateBackup({ app: "CVKita", schemaVersion: 1, exportedAt: new Date().toISOString(), documents: [legacy] });
    expect(backup.documents[0].id).toBe(documents[0].id);
    expect(backup.documents[0].design.textColor).toBe("#182321");
    expect(backup.documents[0].design.borderColor).toBe("#dfe5e2");
    expect(backup.documents[0].design.titleSize).toBe(15);
    expect(backup.documents[0].design.bodySize).toBe(12);
  });

  it("normalizes spaced E.164 phone numbers from imports", () => {
    const document = createSampleDocument();
    document.content.personal.phone = "+62 812 3456 7890";
    const backup = validateBackup({ app: "CVKita", schemaVersion: 2, documents: [document] });
    expect(backup.documents[0].content.personal.phone).toBe("+6281234567890");
  });

  it("rejects foreign and malformed files", () => {
    expect(() => validateBackup({ app: "Other", schemaVersion: 1, documents: [] })).toThrow("INVALID_BACKUP");
    expect(() => validateBackup({ app: "CVKita", schemaVersion: 1, documents: [{ id: "broken" }] })).toThrow("INVALID_BACKUP");
  });
});

describe("safeFileName", () => {
  it("turns a name into a portable PDF file stem", () => {
    expect(safeFileName("  Nadia / Pratama  ")).toBe("Nadia-Pratama");
    expect(safeFileName("***")).toBe("CV");
  });
});
