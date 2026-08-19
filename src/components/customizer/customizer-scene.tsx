import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { BootColors } from "@/components/customizer/boxing-boot-3d";

type Props = {
  colors: BootColors;
  interactive?: boolean;
  className?: string;
};

/** Imperative three.js product viewer — drag to orbit, live recolor. */
export function CustomizerScene({
  colors,
  interactive = true,
  className,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const colorsRef = useRef(colors);
  colorsRef.current = colors;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = Math.max(mount.clientWidth, 320);
    const height = Math.max(mount.clientHeight, 320);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0e0e12");

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(1.85, 1.05, 2.45);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      touchAction: "none",
    });

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(3.5, 5.5, 3.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff2e0, 1.15);
    fill.position.set(-3.5, 2.5, 1.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.85);
    rim.position.set(0.5, 2.5, -3.5);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 64),
      new THREE.MeshStandardMaterial({ color: "#18181e", roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.92;
    scene.add(ground);

    const mats = {
      upper: new THREE.MeshStandardMaterial({
        color: colorsRef.current.upper,
        roughness: 0.62,
        metalness: 0.04,
      }),
      patent: new THREE.MeshStandardMaterial({
        color: colorsRef.current.patent,
        roughness: 0.12,
        metalness: 0.72,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: colorsRef.current.accent,
        roughness: 0.2,
        metalness: 0.95,
      }),
      sole: new THREE.MeshStandardMaterial({
        color: colorsRef.current.sole,
        roughness: 0.42,
        metalness: 0.05,
      }),
      lace: new THREE.MeshStandardMaterial({
        color: colorsRef.current.lace,
        roughness: 0.78,
        metalness: 0,
      }),
    };

    const boot = new THREE.Group();
    boot.scale.setScalar(1.25);
    boot.rotation.set(0.22, -0.75, 0.04);
    boot.position.set(0, -0.05, 0);

    const add = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      pos: [number, number, number],
      rot?: [number, number, number],
    ) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...pos);
      if (rot) m.rotation.set(...rot);
      boot.add(m);
    };

    add(new THREE.BoxGeometry(1.9, 0.16, 0.8), mats.sole, [0.12, -0.52, 0]);
    add(new THREE.BoxGeometry(0.62, 0.14, 0.72), mats.sole, [0.78, -0.48, 0]);
    add(new THREE.BoxGeometry(1.4, 0.9, 0.68), mats.upper, [0, 0.02, 0]);
    add(new THREE.BoxGeometry(0.55, 0.5, 0.64), mats.upper, [0.72, -0.15, 0]);
    add(new THREE.BoxGeometry(0.72, 1.0, 0.64), mats.upper, [-0.52, 0.7, 0]);
    add(new THREE.BoxGeometry(0.42, 0.7, 0.36), mats.upper, [0.02, 0.45, 0]);
    add(new THREE.BoxGeometry(0.55, 0.35, 0.7), mats.patent, [-0.58, 1.05, 0]);
    add(new THREE.BoxGeometry(1.1, 0.48, 0.07), mats.patent, [0.12, -0.02, 0.36]);
    add(new THREE.BoxGeometry(1.1, 0.48, 0.07), mats.patent, [0.12, -0.02, -0.36]);
    add(new THREE.BoxGeometry(0.14, 0.7, 0.62), mats.patent, [-0.78, 0.12, 0]);
    add(new THREE.BoxGeometry(0.16, 0.35, 0.62), mats.patent, [0.95, -0.2, 0]);
    add(new THREE.BoxGeometry(0.48, 0.15, 0.05), mats.accent, [0.35, -0.08, 0.38]);
    add(new THREE.BoxGeometry(0.48, 0.15, 0.05), mats.accent, [0.35, -0.08, -0.38]);
    add(
      new THREE.BoxGeometry(0.32, 0.1, 0.55),
      mats.accent,
      [0.55, -0.25, 0],
      [0, 0, -0.4],
    );
    for (const y of [-0.02, 0.14, 0.3, 0.46]) {
      add(new THREE.BoxGeometry(0.12, 0.04, 0.42), mats.lace, [0.08, y, 0]);
    }
    scene.add(boot);

    let dragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotY = boot.rotation.y;
    let rotX = boot.rotation.x;

    const onDown = (e: PointerEvent) => {
      if (!interactive) return;
      dragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || !interactive) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      rotY += dx * 0.01;
      rotX = Math.max(-0.35, Math.min(0.75, rotX + dy * 0.007));
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
    const auto = !interactive;
    const tick = () => {
      const c = colorsRef.current;
      mats.upper.color.set(c.upper);
      mats.patent.color.set(c.patent);
      mats.accent.color.set(c.accent);
      mats.sole.color.set(c.sole);
      mats.lace.color.set(c.lace);
      if (auto && !dragging) {
        rotY += 0.007;
        boot.rotation.y = rotY;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      const w = Math.max(mount.clientWidth, 320);
      const h = Math.max(mount.clientHeight, 320);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    // initial layout settle
    requestAnimationFrame(onResize);

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
  }, [interactive]);

  return (
    <div
      ref={mountRef}
      className={className ?? "h-full w-full min-h-[50dvh]"}
    />
  );
}
