import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Real WebGL backdrop rendered with Three.js.
 *
 * - Iridescent torus core, orbital rings and a drifting particle field
 * - Mouse parallax with eased interpolation (no jitter)
 * - Pauses when off-screen or when the tab is hidden
 * - Honours prefers-reduced-motion with a single static frame
 * - Falls back silently to the CSS aura if WebGL is unavailable
 */
export function ThreeCoreBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // WebGL is not available — the CSS hero aura remains as the fallback.
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    const world = new THREE.Group();
    world.position.y = 0.15;
    scene.add(world);

    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // --- Core: faceted violet torus knot with a fine wireframe shell ---------
    const coreGeometry = track(new THREE.TorusKnotGeometry(1.18, 0.34, 180, 22, 2, 3));
    const coreMaterial = track(
      new THREE.MeshStandardMaterial({
        color: 0x5b21b6,
        emissive: 0x180a38,
        metalness: 0.72,
        roughness: 0.2,
        transparent: true,
        opacity: 0.94,
      }),
    );
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    world.add(core);

    const wireMaterial = track(
      new THREE.MeshBasicMaterial({
        color: 0xc4b5fd,
        wireframe: true,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
      }),
    );
    const wire = new THREE.Mesh(coreGeometry, wireMaterial);
    wire.scale.setScalar(1.012);
    world.add(wire);

    // --- Inner cyan energy core ----------------------------------------------
    const innerGeometry = track(new THREE.IcosahedronGeometry(0.72, 1));
    const innerMaterial = track(
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        wireframe: true,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    world.add(inner);

    // --- Orbital rings --------------------------------------------------------
    const ringMaterial = track(
      new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    const ringGeometry = track(new THREE.TorusGeometry(2.15, 0.006, 3, 180));
    const ringA = new THREE.Mesh(ringGeometry, ringMaterial);
    ringA.rotation.set(1.1, 0.3, 0.2);
    world.add(ringA);

    const ringB = new THREE.Mesh(ringGeometry, ringMaterial);
    ringB.rotation.set(-0.6, 0.9, -0.35);
    ringB.scale.setScalar(1.16);
    world.add(ringB);

    // --- Drifting particle shell ---------------------------------------------
    const particleCount = 320;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.7 + Math.random() * 1.6;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const particleGeometry = track(new THREE.BufferGeometry());
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = track(
      new THREE.PointsMaterial({
        color: 0xa78bfa,
        size: 0.022,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    world.add(particles);

    // --- Lighting -------------------------------------------------------------
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const violetLight = new THREE.PointLight(0xa78bfa, 55, 24);
    violetLight.position.set(-3, 2.4, 4);
    scene.add(violetLight);
    const cyanLight = new THREE.PointLight(0x22d3ee, 42, 24);
    cyanLight.position.set(3.2, -1.6, 3.2);
    scene.add(cyanLight);

    // --- Interaction & lifecycle ---------------------------------------------
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let visible = true;
    let rafId = 0;
    const clock = new THREE.Clock();

    const onPointer = (event: PointerEvent) => {
      targetX = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      targetY = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const draw = () => {
      mouseX += (targetX - mouseX) * 0.045;
      mouseY += (targetY - mouseY) * 0.045;

      const delta = Math.min(clock.getDelta(), 0.05);
      core.rotation.y += delta * 0.16;
      core.rotation.x += delta * 0.07;
      wire.rotation.copy(core.rotation);
      inner.rotation.y -= delta * 0.28;
      inner.rotation.z += delta * 0.1;
      ringA.rotation.z += delta * 0.06;
      ringB.rotation.z -= delta * 0.04;
      particles.rotation.y -= delta * 0.025;

      world.rotation.y = mouseX * 0.16;
      world.rotation.x = mouseY * 0.1;
      camera.position.x += (mouseX * 0.35 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 0.28 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      if (!visible || document.hidden) return;
      draw();
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(host);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    if (reduceMotion) {
      draw();
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      rafId = window.requestAnimationFrame(animate);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointer);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}
