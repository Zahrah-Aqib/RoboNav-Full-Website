import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight decorative 3D robot built from Three.js primitives.
 * Purely ornamental — navigation and simulation stay 2D. If WebGL is
 * unavailable (or reduced-motion is requested) the parent renders a
 * CSS fallback instead.
 */

interface RobotSceneProps {
  className?: string;
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export default function RobotScene({ className = '' }: RobotSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(detectWebGL());
  }, []);

  useEffect(() => {
    if (!supported) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      if (disposed || !mountRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 1.4, 6.2);

      // Lighting: cool key light + cyan rim.
      const keyLight = new THREE.DirectionalLight(0xbfecff, 1.1);
      keyLight.position.set(3, 5, 4);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(0x22d3ee, 2.4, 20);
      rimLight.position.set(-3, 2, -3);
      scene.add(rimLight);
      const fill = new THREE.AmbientLight(0x334466, 0.7);
      scene.add(fill);

      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x16233f,
        metalness: 0.6,
        roughness: 0.35,
      });
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.7,
        metalness: 0.2,
        roughness: 0.4,
      });
      const eyeMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x67e8f9,
        emissiveIntensity: 1.4,
      });

      const robot = new THREE.Group();

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 0.9), bodyMat);
      robot.add(torso);

      // Chest panel (glowing)
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.08), panelMat);
      chest.position.set(0, 0.15, 0.48);
      robot.add(chest);

      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.85), bodyMat);
      head.position.y = 1.25;
      robot.add(head);

      // Eyes
      const eyeGeo = new THREE.BoxGeometry(0.16, 0.1, 0.06);
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.2, 0.08, 0.44);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.2, 0.08, 0.44);
      head.add(eyeL, eyeR);

      // Antenna
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5), bodyMat);
      antenna.position.set(0, 0.6, 0);
      head.add(antenna);
      const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), panelMat);
      antennaTip.position.set(0, 0.3, 0);
      antenna.add(antennaTip);

      // Arms
      const armGeo = new THREE.CapsuleGeometry(0.16, 0.9, 4, 8);
      const armL = new THREE.Mesh(armGeo, bodyMat);
      armL.position.set(-1.05, 0.1, 0);
      armL.rotation.z = 0.15;
      const armR = new THREE.Mesh(armGeo, bodyMat);
      armR.position.set(1.05, 0.1, 0);
      armR.rotation.z = -0.15;
      robot.add(armL, armR);

      // Shoulder pads (glow)
      const padGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const padL = new THREE.Mesh(padGeo, panelMat);
      padL.position.set(-0.95, 0.62, 0);
      const padR = new THREE.Mesh(padGeo, panelMat);
      padR.position.set(0.95, 0.62, 0);
      robot.add(padL, padR);

      // Base / hover ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.05, 12, 48),
        panelMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.15;
      robot.add(ring);

      scene.add(robot);

      // Floating floor grid
      const gridHelper = new THREE.GridHelper(14, 28, 0x164e63, 0x0e2733);
      gridHelper.position.y = -1.6;
      scene.add(gridHelper);

      let targetRotY = 0;
      const onPointerMove = (e: PointerEvent) => {
        const rect = mountRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        targetRotY = nx * 0.7;
      };
      window.addEventListener('pointermove', onPointerMove);

      let t = 0;
      let raf = 0;
      const animate = () => {
        t += 0.016;
        robot.position.y = Math.sin(t * 1.4) * 0.12;
        robot.rotation.y += (targetRotY - robot.rotation.y) * 0.05;
        ring.rotation.z = t * 0.8;
        antennaTip.scale.setScalar(1 + Math.sin(t * 3) * 0.2);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();

      const onResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => m.dispose());
          }
        });
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [supported]);

  if (supported === false) {
    // CSS fallback robot silhouette.
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-float-y flex flex-col items-center gap-3">
          <div className="w-24 h-20 rounded-2xl bg-navy-700 border border-cyan/40 shadow-glow flex items-center justify-center gap-3">
            <span className="w-3 h-3 rounded-full bg-cyan-soft shadow-glow-sm" />
            <span className="w-3 h-3 rounded-full bg-cyan-soft shadow-glow-sm" />
          </div>
          <div className="w-32 h-32 rounded-3xl bg-navy-800 border border-navy-500 shadow-panel flex items-center justify-center">
            <span className="w-10 h-10 rounded-xl bg-cyan/30 border border-cyan/50 shadow-glow-sm" />
          </div>
          <div className="w-20 h-2 rounded-full bg-cyan/40 shadow-glow-sm" />
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className={className} />;
}
