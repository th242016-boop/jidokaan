import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { PartColors, PartId } from "@/lib/simulator-config";
import { SIM_PARTS } from "@/lib/simulator-config";

/**
 * Interactive 3D boxing boot with A–K recolorable groups.
 * Approximate silhouette — product-accurate mesh requires a GLB with named materials.
 */
export function Boot3DViewer({
  colors,
  className,
  autoRotate = false,
}: {
  colors: PartColors;
  className?: string;
  autoRotate?: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0a0e");

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(2.35, 1.35, 2.85);
    camera.lookAt(0, 0.25, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      touchAction: "none",
    });

    // Lights — product plate vibe
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(3.2, 5.5, 2.8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d0e8, 0.75);
    fill.position.set(-3.5, 2, 1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.1);
    rim.position.set(0.2, 2.5, -3.5);
    scene.add(rim);
    const spot = new THREE.SpotLight(0xffffff, 18, 20, 0.45, 0.6, 1);
    spot.position.set(0, 6, 2);
    spot.target.position.set(0, 0, 0);
    scene.add(spot);
    scene.add(spot.target);

    // Ground disc
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(3.4, 64),
      new THREE.MeshStandardMaterial({
        color: "#121218",
        roughness: 0.92,
        metalness: 0,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.72;
    scene.add(ground);

    const mats: Record<PartId, THREE.MeshStandardMaterial> = {} as never;
    for (const p of SIM_PARTS) {
      mats[p.id] = new THREE.MeshStandardMaterial({
        color: colorsRef.current[p.id],
        roughness: 0.55,
        metalness: 0.08,
      });
    }

    function applyMaterialStyle(id: PartId, hex: string) {
      const m = mats[id];
      m.color.set(hex);
      const nameHint = hex.toLowerCase();
      // rough metal heuristic for vivid / gold-like accents
      const isBrightMetal =
        nameHint === "#d4af37" ||
        nameHint === "#c0c0c0" ||
        nameHint === "#ff0088" ||
        nameHint === "#ff0000" ||
        nameHint === "#00ff00" ||
        nameHint === "#bf00ff" ||
        nameHint === "#2b55e5" ||
        nameHint === "#ff4400";
      if (isBrightMetal) {
        m.metalness = 0.88;
        m.roughness = 0.22;
      } else if (id === "k") {
        m.metalness = 0.05;
        m.roughness = 0.55;
      } else if (id === "a") {
        m.metalness = 0.04;
        m.roughness = 0.72;
      } else {
        m.metalness = 0.12;
        m.roughness = 0.45;
      }
      m.needsUpdate = true;
    }

    const boot = new THREE.Group();
    boot.position.set(0, -0.05, 0);
    boot.rotation.set(0.18, -0.85, 0.04);
    boot.scale.setScalar(1.05);

    const add = (
      geo: THREE.BufferGeometry,
      part: PartId,
      pos: [number, number, number],
      rot?: [number, number, number],
      scale?: [number, number, number],
    ) => {
      const mesh = new THREE.Mesh(geo, mats[part]);
      mesh.position.set(...pos);
      if (rot) mesh.rotation.set(...rot);
      if (scale) mesh.scale.set(...scale);
      mesh.castShadow = true;
      boot.add(mesh);
    };

    // K — outsole
    add(new THREE.BoxGeometry(1.95, 0.14, 0.82), "k", [0.12, -0.55, 0]);
    add(new THREE.BoxGeometry(0.55, 0.12, 0.72), "k", [0.88, -0.5, 0]);
    add(new THREE.BoxGeometry(1.85, 0.08, 0.74), "k", [0.1, -0.42, 0]);

    // A — main canvas body
    add(new THREE.BoxGeometry(1.35, 0.95, 0.7), "a", [0, 0.05, 0]);
    add(new THREE.BoxGeometry(0.55, 0.55, 0.66), "a", [0.72, -0.12, 0]);

    // G — tongue
    add(new THREE.BoxGeometry(0.42, 0.75, 0.34), "g", [0.05, 0.48, 0.02]);

    // F — high collar / ankle
    add(new THREE.BoxGeometry(0.7, 0.95, 0.68), "f", [-0.52, 0.72, 0]);

    // B — side panels (patent-like)
    add(new THREE.BoxGeometry(1.05, 0.5, 0.08), "b", [0.15, 0.02, 0.38]);
    add(new THREE.BoxGeometry(1.05, 0.5, 0.08), "b", [0.15, 0.02, -0.38]);

    // C — heel counter
    add(new THREE.BoxGeometry(0.18, 0.85, 0.64), "c", [-0.78, 0.2, 0]);

    // D — toe box
    add(new THREE.BoxGeometry(0.28, 0.42, 0.66), "d", [0.98, -0.18, 0]);
    add(new THREE.BoxGeometry(0.35, 0.2, 0.62), "d", [0.85, -0.32, 0]);

    // E — stripe / lightning flashes
    add(
      new THREE.BoxGeometry(0.55, 0.16, 0.06),
      "e",
      [0.38, -0.02, 0.4],
      [0, 0, -0.15],
    );
    add(
      new THREE.BoxGeometry(0.55, 0.16, 0.06),
      "e",
      [0.38, -0.02, -0.4],
      [0, 0, 0.15],
    );
    add(
      new THREE.BoxGeometry(0.22, 0.45, 0.05),
      "e",
      [0.55, 0.12, 0.4],
      [0, 0, 0.35],
    );
    add(
      new THREE.BoxGeometry(0.22, 0.45, 0.05),
      "e",
      [0.55, 0.12, -0.4],
      [0, 0, -0.35],
    );

    // H — heel tab / collar top band
    add(new THREE.BoxGeometry(0.62, 0.28, 0.72), "h", [-0.55, 1.12, 0]);

    // I — accent panels mid
    add(new THREE.BoxGeometry(0.35, 0.22, 0.06), "i", [0.2, 0.28, 0.39]);
    add(new THREE.BoxGeometry(0.35, 0.22, 0.06), "i", [0.2, 0.28, -0.39]);

    // J — detail lines / laces-ish
    for (const y of [0.05, 0.22, 0.4, 0.58]) {
      add(new THREE.BoxGeometry(0.12, 0.04, 0.48), "j", [0.08, y, 0]);
    }
    add(new THREE.BoxGeometry(0.05, 0.65, 0.04), "j", [0.08, 0.32, 0.22]);
    add(new THREE.BoxGeometry(0.05, 0.65, 0.04), "j", [0.08, 0.32, -0.22]);

    scene.add(boot);

    // Init material styles
    for (const p of SIM_PARTS) {
      applyMaterialStyle(p.id, colorsRef.current[p.id]);
    }

    // Orbit
    let dragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotY = boot.rotation.y;
    let rotX = boot.rotation.x;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      rotY += dx * 0.01;
      rotX = Math.max(-0.25, Math.min(0.7, rotX + dy * 0.007));
      boot.rotation.y = rotY;
      boot.rotation.x = rotX;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);

    let raf = 0;
    const tick = () => {
      const c = colorsRef.current;
      for (const p of SIM_PARTS) {
        applyMaterialStyle(p.id, c[p.id]);
      }
      if (autoRotate && !dragging) {
        rotY += 0.006;
        boot.rotation.y = rotY;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const resize = () => {
      const w = Math.max(mount.clientWidth, 2);
      const h = Math.max(mount.clientHeight, 2);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    requestAnimationFrame(resize);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [autoRotate]);

  return (
    <div
      ref={mountRef}
      className={className ?? "h-full w-full min-h-[50dvh]"}
    />
  );
}
