import type { BootModel } from "./simulator-config";
import type { PatternAsset } from "./special-patterns";
import { BLUE_LEOPARD_TILE, blueLeopardRepeatTexture } from "./blue-leopard-material";
import { renderMeshLaces, type LaceColor, type MeshLacePixels } from "./mesh-laces";

export type BlueLeopardMeshPattern = { name: "BLUE LEOPARD"; asset: PatternAsset };

const linear = Array.from({ length: 256 }, (_, value) => {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
});
const display = (value: number) => {
  const clamped = Math.max(0, Math.min(1, value));
  return Math.round(255 * (clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055));
};

/** Existing A provides all geometry and photographed curvature. Only the mesh
 * surface is replaced; the protected material is never used as a new mask. */
export async function loadBlueLeopardMeshSurface(source: MeshLacePixels, model: BootModel, asset: PatternAsset): Promise<ImageData> {
  if (source.width !== 1424 || source.height !== 1392) throw new Error("MESH_SOURCE_SIZE");
  if (!asset.texture) throw new Error("MESH_PATTERN_UNAVAILABLE");
  const image = new Image();
  const textureCanvas = document.createElement("canvas");
  const sourceCanvas = document.createElement("canvas");
  const lightCanvas = document.createElement("canvas");
  try {
    image.src = asset.texture;
    await image.decode();
    const crop = asset.sourceCrop;
    const [cropX, cropY, cropWidth, cropHeight] = crop
      ? [crop[0] * image.naturalWidth, crop[1] * image.naturalHeight, crop[2] * image.naturalWidth, crop[3] * image.naturalHeight]
      : [0, 0, image.naturalWidth, image.naturalHeight];
    if (cropWidth < 2 || cropHeight < 2) throw new Error("MESH_PATTERN_SIZE");
    const scale = Math.min(1, (BLUE_LEOPARD_TILE / 0.94) / cropWidth);
    textureCanvas.width = Math.round(cropWidth * scale);
    textureCanvas.height = Math.round(cropHeight * scale);
    const textureCtx = textureCanvas.getContext("2d", { willReadFrequently: true });
    sourceCanvas.width = lightCanvas.width = source.width;
    sourceCanvas.height = lightCanvas.height = source.height;
    const sourceCtx = sourceCanvas.getContext("2d");
    const lightCtx = lightCanvas.getContext("2d", { willReadFrequently: true });
    if (!textureCtx || !sourceCtx || !lightCtx) throw new Error("MESH_CANVAS");
    textureCtx.imageSmoothingQuality = "high";
    textureCtx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, textureCanvas.width, textureCanvas.height);
    const material = blueLeopardRepeatTexture(textureCtx.getImageData(0, 0, textureCanvas.width, textureCanvas.height));
    sourceCtx.putImageData(new ImageData(new Uint8ClampedArray(source.white), source.width, source.height), 0, 0);
    // Suppress the original coarse mesh weave while retaining its broad curved
    // lighting. Fine photographic detail is retained weakly below for seams.
    lightCtx.filter = "blur(3px)";
    lightCtx.drawImage(sourceCanvas, 0, 0);
    lightCtx.filter = "none";
    const light = lightCtx.getImageData(0, 0, source.width, source.height);
    const result = new ImageData(source.width, source.height);
    // A is independently cut from B/C/D. Fixed offsets keep its motif size and
    // preview/export identical, without mirroring or stretching to the silhouette.
    const offsetX = 157, offsetY = model === "mid" ? 301 : 83;
    for (let p = 0; p < source.lace.length; p++) {
      const i = p * 4, alpha = source.white[i + 3];
      result.data[i + 3] = alpha;
      if (!alpha || source.lace[p] === 255) continue;
      const x = p % source.width, y = Math.floor(p / source.width);
      const tx = Math.floor(((x + offsetX) % BLUE_LEOPARD_TILE) * material.width / BLUE_LEOPARD_TILE);
      const ty = Math.floor(((y + offsetY) % BLUE_LEOPARD_TILE) * material.height / BLUE_LEOPARD_TILE);
      const t = (ty * material.width + tx) * 4;
      const soft = (light.data[i] * 0.2126 + light.data[i + 1] * 0.7152 + light.data[i + 2] * 0.0722) / 235;
      const fine = (source.white[i] * 0.2126 + source.white[i + 1] * 0.7152 + source.white[i + 2] * 0.0722) / 235;
      const detail = Math.max(0.80, Math.min(1.08, 1 + (fine - soft) * 0.18));
      const diffuse = Math.max(0.18, Math.min(1.16, soft ** 1.65)) * detail;
      const sheen = Math.max(0, soft - 0.72) * 0.014;
      for (let c = 0; c < 3; c++) result.data[i + c] = display(linear[material.data[t + c]] * diffuse + sheen);
    }
    return result;
  } finally {
    image.src = "";
    textureCanvas.width = textureCanvas.height = sourceCanvas.width = sourceCanvas.height = lightCanvas.width = lightCanvas.height = 0;
  }
}

/** Compose A once with the existing antialiased lace partition. Every alpha
 * byte and every fully covered lace pixel are unchanged from the solid path. */
export function renderBlueLeopardMesh(source: MeshLacePixels, laces: LaceColor, surface: ImageData): ImageData {
  if (surface.width !== source.width || surface.height !== source.height) throw new Error("MESH_PATTERN_SIZE");
  const result = renderMeshLaces(source, "WHITE", laces);
  for (let p = 0; p < source.lace.length; p++) {
    const i = p * 4;
    if (!source.white[i + 3] || source.lace[p] === 255) continue;
    const meshCoverage = 1 - source.lace[p] / 255;
    for (let c = 0; c < 3; c++) {
      result.data[i + c] = Math.round(result.data[i + c] + (surface.data[i + c] - source.white[i + c]) * meshCoverage);
    }
  }
  return result;
}

export function blueLeopardMeshDataUrl(source: MeshLacePixels, laces: LaceColor, surface: ImageData, decorate?: (result: ImageData) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width; canvas.height = source.height;
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("MESH_CANVAS");
    const result = renderBlueLeopardMesh(source, laces, surface);
    decorate?.(result);
    ctx.putImageData(result, 0, 0);
    return canvas.toDataURL("image/png");
  } finally {
    canvas.width = canvas.height = 0;
  }
}
