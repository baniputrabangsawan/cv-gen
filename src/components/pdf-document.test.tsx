import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { createSampleDocument } from "@/lib/defaults";
import type { TemplateId } from "@/types/cv";
import { CVPdfDocument } from "./pdf-document";

const templates: TemplateId[] = ["ats", "professional", "modern", "minimal", "creative", "academic"];

describe("CV PDF templates", () => {
  for (const templateId of templates) {
    it(`renders ${templateId} as a valid PDF`, async () => {
      const document = createSampleDocument();
      document.templateId = templateId;
      document.content.summary = `${document.content.summary} `.repeat(8);
      const buffer = await renderToBuffer(<CVPdfDocument document={document} locale="en" />);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
      expect(buffer.byteLength).toBeGreaterThan(2_000);
    }, 15_000);
  }
});
