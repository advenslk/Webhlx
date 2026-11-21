import { useEffect, useRef } from 'react';

export function ThreeCoreBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);
    let mouseX = 0;
    let mouseY = 0;
    let rafId = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };

    const handlePointer = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 0.5;
      mouseY = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 0.5;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handlePointer, { passive: true });

    // Generate spherical 3D lattice points
    const points: { x: number; y: number; z: number }[] = [];
    const latSteps = 8;
    const lonSteps = 14;
    for (let i = 1; i < latSteps; i++) {
      const phi = (Math.PI * i) / latSteps;
      for (let j = 0; j < lonSteps; j++) {
        const theta = (2 * Math.PI * j) / lonSteps;
        points.push({
          x: Math.sin(phi) * Math.cos(theta),
          y: Math.cos(phi),
          z: Math.sin(phi) * Math.sin(theta),
        });
      }
    }

    let angle = 0;

    const renderFrame = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.45;
      const radius = Math.min(width, height) * 0.34;
      const rotY = angle + mouseX * 0.8;
      const rotX = 0.35 + mouseY * 0.6;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = points.map((p) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;
        const scale = 2.4 / (2.4 - z2);
        return {
          sx: cx + x1 * radius * scale,
          sy: cy + y2 * radius * scale,
          depth: z2,
        };
      });

      // Draw orbital connections
      ctx.lineWidth = Math.max(1, window.devicePixelRatio * 0.75);
      for (let i = 0; i < projected.length; i++) {
        const a = projected[i];
        const nextIdx = (i + 1) % projected.length;
        const b = projected[nextIdx];
        const dist = Math.hypot(a.sx - b.sx, a.sy - b.sy);
        if (dist < radius * 0.65) {
          const alpha = Math.max(0.05, Math.min(0.26, (a.depth + 1.2) * 0.12));
          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }

      // Draw luminous nodes
      for (const pt of projected) {
        const alpha = Math.max(0.15, Math.min(0.85, (pt.depth + 1.1) * 0.38));
        ctx.fillStyle = pt.depth > 0.2 ? `rgba(34, 211, 238, ${alpha})` : `rgba(167, 139, 250, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, Math.max(1.4, window.devicePixelRatio * 1.5), 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReduced) {
        angle += 0.0024;
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full opacity-55"
    />
  );
}
