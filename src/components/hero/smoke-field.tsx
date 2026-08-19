import { useEffect, useRef } from "react";

/** Soft dust / smoke canvas behind the hero shoe — matches concept-lab mood. */
export function SmokeField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Particle = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      a: number;
      life: number;
      max: number;
    };
    const particles: Particle[] = [];

    function resize() {
      const parent = canvas!.parentElement;
      w = parent?.clientWidth ?? window.innerWidth;
      h = parent?.clientHeight ?? window.innerHeight;
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(n = 1) {
      for (let i = 0; i < n; i++) {
        particles.push({
          x: w * (0.35 + Math.random() * 0.3),
          y: h * (0.55 + Math.random() * 0.35),
          r: 20 + Math.random() * 80,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -0.15 - Math.random() * 0.35,
          a: 0.02 + Math.random() * 0.06,
          life: 0,
          max: 180 + Math.random() * 220,
        });
      }
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h);
      if (particles.length < 48) spawn(2);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.r *= 1.002;
        const t = p.life / p.max;
        const alpha = p.a * (t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8);
        if (p.life >= p.max || alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(200,200,210,${alpha})`);
        g.addColorStop(0.45, `rgba(140,140,150,${alpha * 0.35})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    spawn(24);
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden
    />
  );
}
