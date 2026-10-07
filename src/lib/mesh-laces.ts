import type { BootModel } from "./simulator-config";

export type MeshColor = "WHITE" | "BLACK" | keyof typeof MESH_TINTS;
export type LaceColor = "WHITE" | "BLACK" | "RED" | "BLUE" | "YELLOW";
export type MeshLacePixels = {
  width: number; height: number;
  white: Uint8ClampedArray; black: Uint8ClampedArray; lace: Uint8ClampedArray;
};

// Match the existing studio swatches. Only stocked mesh colors are selectable;
// patent-only gold/silver, mint and sky blue are deliberately excluded.
export const MESH_TINTS = {
    RED: [194, 13, 18],
    ORANGE: [232, 93, 4],
    YELLOW: [240, 204, 0],
    GREEN: [14, 122, 50],
    BLUE: [21, 70, 196],
    NAVY: [10, 24, 88],
    PURPLE: [107, 33, 168],
    PINK: [224, 122, 168],
    GRAY: [122, 125, 132],
} as const;
export const MESH_COLORS: readonly MeshColor[] = ["RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "NAVY", "PURPLE", "PINK", "GRAY", "WHITE", "BLACK"];
export const LACE_COLORS: readonly LaceColor[] = ["RED", "BLUE", "YELLOW", "WHITE", "BLACK"];
// These paths describe only the exposed tongue between the laces. The outer
// silhouette always comes from the supplied A PNG, including its original alpha.
// Coordinates are native photo pixels (1424 x 1392), never display coordinates.
const lowerTongue = [
    "M 632 577 Q 643 590 663 601 Q 635 596 611 585 Z",
    "M 599 599 Q 613 615 651 625 L 614 642 Q 611 619 599 599 Z",
    "M 658 640 Q 665 653 669 672 Q 651 664 638 653 Z",
    "M 630 674 Q 646 685 674 696 L 671 728 Q 647 708 637 692 Z",
    "M 614 672 Q 618 691 626 704 L 613 710 Q 615 690 614 672 Z",
    "M 618 732 Q 635 748 659 764 Q 658 778 654 786 L 638 791 Q 625 778 617 759 Z",
    "M 644 790 L 658 784 Q 655 797 651 809 Z",
    "M 606 741 Q 607 760 610 776 L 599 779 Q 604 757 606 741 Z",
    "M 602 800 Q 618 819 643 839 Q 636 853 631 864 L 614 869 Q 599 850 596 834 Z",
    "M 622 867 L 631 863 L 626 879 Z",
    "M 587 814 Q 588 828 591 840 L 578 843 Z",
    "M 578 872 Q 598 881 623 898 Q 612 914 603 924 L 588 930 Q 578 914 574 895 Z",
    "M 594 927 L 605 922 L 600 938 Z",
    "M 561 891 Q 562 907 569 918 L 556 912 Z",
    "M 542 944 Q 560 950 582 960 Q 565 973 545 964 Q 540 957 542 944 Z",
];
const upperHighTongue = [
    "M 469 460 Q 482 468 499 471 L 485 485 Q 477 473 469 460 Z",
    "M 531 471 Q 543 486 559 498 Q 536 494 520 483 Z",
    "M 505 502 Q 517 513 540 518 L 524 533 Q 514 518 505 502 Z",
    "M 577 525 Q 592 542 610 553 Q 582 548 560 536 Z",
    "M 550 548 Q 565 564 586 576 L 571 584 Q 565 567 550 548 Z",
];
export function meshSourceUrls(model: BootModel) {
    return model === "mid" ? {
        white: "/simulator/mid/a/white.png?v=1",
        black: "/simulator/mid/a/black.png?v=1",
    } : {
        white: "/simulator/photo/base.jpg?v=c6",
        black: "/simulator/photo/tints/a-black.png?v=c1",
    };
}
export async function loadMeshLacePixels(model: BootModel) {
    const src = meshSourceUrls(model);
    const images = await Promise.all([src.white, src.black].map(async (url) => {
        const im = new Image();
        im.src = url;
        await im.decode();
        return im;
    }));
    try {
        return splitMeshLacePixels(images[0], images[1], model);
    }
    finally {
        for (const im of images)
            im.src = "";
    }
}
export function splitMeshLacePixels(white: HTMLImageElement, black: HTMLImageElement, model: BootModel): MeshLacePixels {
    const width = white.naturalWidth, height = white.naturalHeight;
    if (width !== 1424 || height !== 1392 || black.naturalWidth !== width || black.naturalHeight !== height) {
        throw new Error("MESH_SOURCE_SIZE");
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx)
        throw new Error("MESH_CANVAS");
    ctx.drawImage(white, 0, 0);
    const w = ctx.getImageData(0, 0, width, height).data;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(black, 0, 0);
    const b = ctx.getImageData(0, 0, width, height).data;
    // High-cut white is the native photo; use exactly the existing black A alpha.
    if (model === "high")
        for (let p = 3; p < w.length; p += 4)
            w[p] = b[p];
    // A's lace/tongue column is a disconnected component. Flood only its original
    // nontransparent pixels; no threshold, dilation, resize or outer-edge tracing.
    const lace = new Uint8ClampedArray(width * height);
    const queue = new Int32Array(width * height);
    const seed = model === "high" ? 400 * width + 490 : 510 * width + 596;
    if (!w[seed * 4 + 3])
        throw new Error("LACE_SEED_OUTSIDE_SOURCE");
    let head = 0, tail = 1;
    queue[0] = seed;
    lace[seed] = 255;
    while (head < tail) {
        const p = queue[head++];
        for (const next of [p - 1, p + 1, p - width, p + width]) {
            if (next < 0 || next >= lace.length || lace[next] || !w[next * 4 + 3])
                continue;
            if (Math.abs(next - p) === 1 && Math.floor(next / width) !== Math.floor(p / width))
                continue;
            lace[next] = 255;
            queue[tail++] = next;
        }
    }
    if (tail < 25000 || tail > 55000)
        throw new Error("LACE_COMPONENT_CHANGED");
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";
    for (const path of [...lowerTongue, ...(model === "high" ? upperHighTongue : [])])
        ctx.fill(new Path2D(path));
    const gaps = ctx.getImageData(0, 0, width, height).data;
    for (let p = 0; p < lace.length; p++)
        if (lace[p])
            lace[p] = 255 - gaps[p * 4 + 3];
    canvas.width = canvas.height = 0;
    return { width, height, white: w, black: b, lace };
}
/** Partition A internally and compose it ONCE, avoiding double-alpha seams. */
export function renderMeshLaces(source: MeshLacePixels, mesh: MeshColor, laces: LaceColor) {
    if (!MESH_COLORS.includes(mesh) || !LACE_COLORS.includes(laces))
        throw new Error("MESH_COLOR");
    const out = new ImageData(source.width, source.height);
    const { white, black, lace } = source;
    const tint = mesh === "WHITE" || mesh === "BLACK" ? null : MESH_TINTS[mesh];
    const laceTint = laces === "WHITE" || laces === "BLACK" ? null : MESH_TINTS[laces];
    for (let p = 0; p < lace.length; p++) {
        const i = p * 4;
        out.data[i + 3] = white[i + 3];
        if (!white[i + 3])
            continue;
        const l = lace[p] / 255;
        const shade = tint || laceTint ? Math.min(1.12, Math.pow((white[i] * .2126 + white[i + 1] * .7152 + white[i + 2] * .0722) / 235, 1.35)) : 1;
        for (let c = 0; c < 3; c++) {
            const m = tint ? tint[c] * shade : (mesh === "BLACK" ? black : white)[i + c];
            const v = laceTint ? laceTint[c] * shade : (laces === "BLACK" ? black : white)[i + c];
            out.data[i + c] = Math.round(m * (1 - l) + v * l);
        }
    }
    return out;
}
export function meshLaceDataUrl(source: MeshLacePixels, mesh: MeshColor, laces: LaceColor) {
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        throw new Error("MESH_CANVAS");
    ctx.putImageData(renderMeshLaces(source, mesh, laces), 0, 0);
    try {
        return canvas.toDataURL("image/png");
    }
    finally {
        canvas.width = canvas.height = 0;
    }
}
