import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Sculptural 3D Matte-Black Studded Centerpiece (WebGL)
 *
 * - Builds a composite sculptural black organic cluster inspired by studio spatial design:
 *   smooth obsidian dual-lobed sculptural core + sculpted rings + instanced sphere studs
 *   distributed cleanly over the mesh vertices
 * - Uses RoomEnvironment PMREM studio reflections + 3-point warm key / cool cyan rim lighting
 * - Detects software WebGL engines and paces frames cleanly without stalling main thread
 * - Supports interactive cursor parallax & gentle studio levitation
 */
export function ThreeCoreBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.15, 6.2);

    // Procedural studio reflections via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd4d4d8, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    keyLight.position.set(4.5, 6.5, 5.2);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 20;
      keyLight.shadow.camera.left = -3.5;
      keyLight.shadow.camera.right = 3.5;
      keyLight.shadow.camera.top = 3.5;
      keyLight.shadow.camera.bottom = -3.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00e5ff, 1.85);
    cyanRimLight.position.set(-4.2, 2.4, -3.5);
    scene.add(cyanRimLight);

    const backFillLight = new THREE.DirectionalLight(0xe4e4e7, 0.9);
    backFillLight.position.set(2.5, -3.0, -4.0);
    scene.add(backFillLight);

    // Obsidian Matte-Black Sculptural Group (Multi-part Composite Form)
    const sculptureGroup = new THREE.Group();
    scene.add(sculptureGroup);

    const matteBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x131316,
      roughness: 0.42,
      metalness: 0.18,
      clearcoat: 0.28,
      clearcoatRoughness: 0.36,
      sheen: 0.25,
      sheenColor: new THREE.Color(0x27272a),
      envMapIntensity: 1.0,
    });

    const satinAccentMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a0c,
      roughness: 0.22,
      metalness: 0.55,
      clearcoat: 0.7,
      clearcoatRoughness: 0.16,
      envMapIntensity: 1.35,
    });

    const studMat = new THREE.MeshPhysicalMaterial({
      color: 0x1c1c20,
      roughness: 0.3,
      metalness: 0.25,
      clearcoat: 0.45,
      clearcoatRoughness: 0.24,
    });

    // Part 1: Sculpted Organic Knot Core (diagonal dynamic form)
    const knotGeo = new THREE.TorusKnotGeometry(0.92, 0.38, 180, 36, 2, 3);
    const knotMesh = new THREE.Mesh(knotGeo, matteBodyMat);
    knotMesh.scale.set(0.95, 1.18, 0.88);
    knotMesh.rotation.set(0.35, 0.42, -0.32);
    knotMesh.castShadow = !isSoftwareGl;
    knotMesh.receiveShadow = !isSoftwareGl;
    sculptureGroup.add(knotMesh);

    // Part 2: Smooth Capsule Lobe intersecting core (echos bulbous black sculpture silhouettes)
    const lobeGeo = new THREE.CapsuleGeometry(0.46, 1.15, 24, 36);
    const lobeMesh = new THREE.Mesh(lobeGeo, matteBodyMat);
    lobeMesh.position.set(0.18, 0.12, 0.22);
    lobeMesh.rotation.set(0.2, -0.3, -0.58);
    lobeMesh.castShadow = !isSoftwareGl;
    sculptureGroup.add(lobeMesh);

    // Part 3: Secondary Diagonal Balance Lobe
    const balanceGeo = new THREE.CapsuleGeometry(0.42, 0.95, 24, 36);
    const balanceMesh = new THREE.Mesh(balanceGeo, satinAccentMat);
    balanceMesh.position.set(-0.24, -0.22, -0.08);
    balanceMesh.rotation.set(-0.25, 0.35, 0.62);
    balanceMesh.castShadow = !isSoftwareGl;
    sculptureGroup.add(balanceMesh);

    // Part 4: Instanced Tactical Sphere Studs distributed across core & lobes
    const studSphereGeo = new THREE.SphereGeometry(0.056, 10, 10);
    const knotPos = knotGeo.attributes.position;
    const knotNorm = knotGeo.attributes.normal;
    const stride = 26;
    const studCount = Math.floor(knotPos.count / stride);
    const studInstanced = new THREE.InstancedMesh(studSphereGeo, studMat, studCount);
    studInstanced.castShadow = !isSoftwareGl;

    const dummyPos = new THREE.Vector3();
    const dummyNorm = new THREE.Vector3();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3();
    const dummyMat = new THREE.Matrix4();

    let placed = 0;
    for (let i = 0; i < knotPos.count && placed < studCount; i += stride) {
      dummyPos.fromBufferAttribute(knotPos, i);
      dummyNorm.fromBufferAttribute(knotNorm, i).normalize();
      dummyPos.addScaledVector(dummyNorm, 0.015);
      const s = 0.82 + ((placed % 5) * 0.08);
      dummyScale.set(s, s, s);
      dummyMat.compose(dummyPos, dummyQuat, dummyScale);
      studInstanced.setMatrixAt(placed, dummyMat);
      placed++;
    }
    studInstanced.count = placed;
    studInstanced.instanceMatrix.needsUpdate = true;
    studInstanced.computeBoundingSphere();
    knotMesh.add(studInstanced);

    // Part 5: Architectural Orbit Halo Ring (subtle precision metal detail)
    const ringGeo = new THREE.TorusGeometry(1.75, 0.014, 12, 120);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00c8e0,
      roughness: 0.25,
      metalness: 0.85,
      emissive: 0x004a55,
      emissiveIntensity: 0.35,
    });
    const orbitRing = new THREE.Mesh(ringGeo, ringMat);
    orbitRing.rotation.set(Math.PI * 0.38, -Math.PI * 0.14, 0.2);
    sculptureGroup.add(orbitRing);

    // Soft studio radial floor shadow directly beneath sculpture (grounding on white hero surface)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 14, 128, 128, 124);
      grad.addColorStop(0, 'rgba(10, 10, 14, 0.34)');
      grad.addColorStop(0.45, 'rgba(10, 10, 14, 0.14)');
      grad.addColorStop(1, 'rgba(10, 10, 14, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowPlaneGeo = new THREE.PlaneGeometry(4.4, 2.2);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    contactShadow.rotation.x = -Math.PI * 0.5;
    contactShadow.position.set(0, -1.78, 0);
    scene.add(contactShadow);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let visible = true;
    let frameId = 0;
    let elapsed = 0;
    let lastTime = performance.now();
    let disposed = false;

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

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const renderFrame = (now: number) => {
      if (disposed) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (visible && !document.hidden) {
        elapsed += dt;
        currentX = THREE.MathUtils.damp(currentX, targetX, 4.5, dt);
        currentY = THREE.MathUtils.damp(currentY, targetY, 4.5, dt);

        sculptureGroup.rotation.y = elapsed * 0.28 + currentX * 0.42;
        sculptureGroup.rotation.x = Math.sin(elapsed * 0.45) * 0.12 + currentY * 0.24;
        sculptureGroup.position.y = Math.sin(elapsed * 1.15) * 0.09;

        orbitRing.rotation.z = elapsed * 0.2;
        const shadowScale = 1 - sculptureGroup.position.y * 0.14;
        contactShadow.scale.set(shadowScale, shadowScale, 1);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, currentX * 0.35, 3.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.15 - currentY * 0.22, 3.5, dt);
        camera.lookAt(0, -0.08, 0);

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(() => renderFrame(performance.now()));
      } else {
        frameId = window.requestAnimationFrame(renderFrame);
      }
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

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    if (reduceMotion) {
      sculptureGroup.rotation.set(0.12, 0.52, -0.1);
      renderer.render(scene, camera);
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      frameId = window.requestAnimationFrame(renderFrame);
    }

    return () => {
      disposed = true;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(frameId);
      }
      window.removeEventListener('pointermove', onPointer);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      knotGeo.dispose();
      lobeGeo.dispose();
      balanceGeo.dispose();
      studSphereGeo.dispose();
      ringGeo.dispose();
      shadowPlaneGeo.dispose();
      matteBodyMat.dispose();
      satinAccentMat.dispose();
      studMat.dispose();
      ringMat.dispose();
      shadowPlaneMat.dispose();
      shadowTex.dispose();
      envTarget.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="pointer-events-none w-full h-full" />;
}
