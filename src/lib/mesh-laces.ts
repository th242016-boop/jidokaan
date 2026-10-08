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
// Native-photo contours for individual lace ribbons. Each closed outline follows
// the complete strand, including its narrow return into the next crossing.
// The original A component still clips all outlines at the outside silhouette.
const lowerLaces = [
  "M 568 580 Q 601 574 639 549 L 649 570 Q 614 592 572 607 Z",
  "M 603 578 Q 647 610 709 601 Q 727 610 715 627 C 676 636 631 621 607 599 Z",
  "M 594 643 Q 636 629 674 607 L 686 632 Q 643 652 598 671 Z",
  "M 616 633 C 642 658 679 664 713 672 Q 729 685 713 698 C 674 705 636 682 620 663 Z",
  "M 597 709 Q 635 696 675 678 L 679 704 Q 641 724 598 737 Z",
  "M 619 646 L 635 653 C 626 686 661 726 706 747 Q 724 759 708 773 C 696 783 657 752 633 727 C 614 706 610 692 619 646 Z",
  "M 572 778 Q 617 765 667 749 L 669 779 Q 616 794 570 810 Z",
  "M 617 719 C 613 748 638 778 670 802 L 689 827 Q 692 834 674 844 C 657 848 621 811 607 789 C 594 769 592 750 605 722 Z",
  "M 541 845 Q 578 838 630 817 L 632 843 Q 591 862 538 875 Z",
  "M 598 781 C 580 806 607 847 651 878 Q 672 900 649 909 C 632 914 598 878 583 852 C 571 833 574 812 585 786 Z",
  "M 530 926 Q 567 916 608 897 L 610 921 Q 573 938 530 949 Z",
  "M 583 843 C 558 868 568 904 599 940 L 612 961 L 593 973 C 576 952 552 924 548 901 Q 545 878 566 847 Z",
  "M 501 901 C 545 915 584 938 608 952 Q 620 966 599 975 C 571 965 536 947 507 945 Z",
] as const;
const highLaces: readonly [string, number][] = [
  ["M 407 417 Q 426 434 460 434", 28],
  ["M 499 384 Q 479 418 451 449", 32],
  ["M 467 447 Q 509 476 555 439", 32],
  ["M 500 491 Q 514 480 528 457", 29],
  ["M 520 489 Q 566 532 614 492", 32],
  ["M 548 536 Q 565 523 586 504", 29],
  ["M 563 536 Q 613 583 668 550", 32],
];
const midLaces: readonly [string, number][] = [
  ["M 523 526 Q 545 543 577 541", 27],
  ["M 614 489 Q 590 518 565 556", 33],
  ["M 597 548 Q 629 576 668 550", 32],
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
    ctx.strokeStyle = "white";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "white";
    ctx.lineWidth = 2;
    for (const path of lowerLaces) {
        const ribbon = new Path2D(path);
        ctx.fill(ribbon);
        ctx.stroke(ribbon);
    }
    for (const [path, strokeWidth] of (model === "high" ? highLaces : midLaces)) {
        ctx.lineWidth = strokeWidth;
        ctx.stroke(new Path2D(path));
    }
    const ribbons = ctx.getImageData(0, 0, width, height).data;
    for (let p = 0; p < lace.length; p++)
        if (lace[p]) lace[p] = ribbons[p * 4 + 3];
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
