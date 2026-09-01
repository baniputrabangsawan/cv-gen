"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, X } from "lucide-react";

async function cropImage(source: string, area: Area): Promise<string> {
  const image = new Image();
  image.src = source;
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; });
  const size = 720;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export function PhotoCropper({ source, onCancel, onSave }: { source: string; onCancel: () => void; onSave: (image: string) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const complete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Crop photo">
      <div className="crop-dialog">
        <div className="modal-head"><strong>Atur Foto</strong><button className="icon-button" onClick={onCancel} aria-label="Tutup"><X size={18} /></button></div>
        <div className="crop-area"><Cropper image={source} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={complete} /></div>
        <label className="zoom-control">Zoom<input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
        <div className="modal-actions"><button className="secondary-button" onClick={onCancel}>Batal</button><button className="primary-button" disabled={!area || busy} onClick={async () => { if (!area) return; setBusy(true); onSave(await cropImage(source, area)); }}><Check size={16} /> Gunakan Foto</button></div>
      </div>
    </div>
  );
}
