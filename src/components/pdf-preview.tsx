"use client";

import { pdf } from "@react-pdf/renderer";
import { Document as CanvasDocument, Page as CanvasPage, pdfjs } from "react-pdf";
import { useEffect, useMemo, useRef, useState } from "react";
import { CVPdfDocument } from "./pdf-document";
import type { CVDocument, Locale } from "@/types/cv";

type FrameIndex = 0 | 1;
type PdfFrame = { id: number; blob: Blob };

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

function CanvasPdfFrame({ frame, width, onReady }: { frame: PdfFrame; width: number; onReady: () => void }) {
  const [hasPage, setHasPage] = useState(false);
  const file = useMemo(() => frame.blob, [frame.blob]);

  return (
    <CanvasDocument
      className="pdf-canvas-document"
      file={file}
      loading={null}
      error={null}
      onLoadSuccess={({ numPages: count }) => setHasPage(count > 0)}
      onLoadError={() => {
        setHasPage(false);
      }}
    >
      {hasPage ? (
        <CanvasPage
          pageNumber={1}
          width={width}
          devicePixelRatio={1.5}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          onRenderSuccess={onReady}
        />
      ) : null}
    </CanvasDocument>
  );
}

export default function PdfPreview({ document, locale }: { document: CVDocument; locale: Locale }) {
  const [frames, setFrames] = useState<[PdfFrame | null, PdfFrame | null]>([null, null]);
  const [activeFrame, setActiveFrame] = useState<FrameIndex | null>(null);
  const activeFrameRef = useRef<FrameIndex | null>(null);
  const pendingFrameRef = useRef<FrameIndex | null>(null);
  const framesRef = useRef<[PdfFrame | null, PdfFrame | null]>([null, null]);
  const nextFrameId = useRef(0);
  const shellRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(640);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const observer = new ResizeObserver(([entry]) => {
      setPageWidth(Math.max(280, Math.min(760, entry.contentRect.width - 18)));
    });
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const blob = await pdf(<CVPdfDocument document={document} locale={locale} preview />).toBlob();
      if (cancelled) return;

      const nextPdfFrame = { id: nextFrameId.current++, blob };
      const nextFrame: FrameIndex = activeFrameRef.current === 0 ? 1 : 0;
      const nextFrames: [PdfFrame | null, PdfFrame | null] = [...framesRef.current];

      nextFrames[nextFrame] = nextPdfFrame;
      framesRef.current = nextFrames;
      pendingFrameRef.current = nextFrame;
      setFrames(nextFrames);
    })();

    return () => { cancelled = true; };
  }, [document, locale]);

  const showFrame = (frame: FrameIndex, id: number) => {
    if (pendingFrameRef.current !== frame || framesRef.current[frame]?.id !== id) return;
    pendingFrameRef.current = null;
    activeFrameRef.current = frame;
    setActiveFrame(frame);
  };

  return (
    <div
      className="pdf-viewer-shell"
      ref={shellRef}
      role="region"
      aria-label={locale === "id" ? "Dokumen CV yang dapat digulir" : "Scrollable CV document"}
      tabIndex={0}
    >
      {frames.map((frame, index) => frame ? (
        <div
          className={`pdf-canvas-frame ${activeFrame === index ? "active" : ""}`}
          key={index}
          aria-hidden={activeFrame !== index}
        >
          <CanvasPdfFrame key={frame.id} frame={frame} width={pageWidth} onReady={() => showFrame(index as FrameIndex, frame.id)} />
        </div>
      ) : null)}
      {activeFrame === null ? <div className="preview-skeleton embedded" aria-label="Loading PDF preview"><div className="skeleton-line wide" /><div className="skeleton-line mid" /><div className="skeleton-block" /></div> : null}
    </div>
  );
}
