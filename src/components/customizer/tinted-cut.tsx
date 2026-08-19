import { useEffect, useState } from "react";

const cutCache = new Map<string, HTMLImageElement>();
const tintCache = new Map<string, string>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = cutCache.get(src);
  if (hit && hit.complete) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      cutCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

async function tintCut(src: string, hex: string): Promise<string> {
  const key = `${src}|${hex}`;
  const cached = tintCache.get(key);
  if (cached) return cached;
  const img = await loadImage(src);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const [tr, tg, tb] = hexToRgb(hex);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    if (a < 8) continue;
    px[i] = (px[i] * tr) / 255;
    px[i + 1] = (px[i + 1] * tg) / 255;
    px[i + 2] = (px[i + 2] * tb) / 255;
  }
  ctx.putImageData(data, 0, 0);
  const url = canvas.toDataURL("image/png");
  tintCache.set(key, url);
  return url;
}

export function TintedCut({
  src,
  hex,
  className,
}: {
  src: string;
  hex: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    tintCut(src, hex)
      .then((u) => {
        if (live) setUrl(u);
      })
      .catch(() => {
        if (live) setUrl(src);
      });
    return () => {
      live = false;
    };
  }, [src, hex]);

  if (!url) return null;
  return (
    <img src={url} alt="" className={className} draggable={false} />
  );
}
