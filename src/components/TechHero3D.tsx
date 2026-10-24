import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Play, Pause, RotateCw, Sparkles, Volume2, VolumeX, Eye, Maximize2, Minimize2, Cpu, Activity, Globe } from 'lucide-react';

interface TechHero3DProps {
  className?: string;
  onExploreClick?: () => void;
}

export const TechHero3D: React.FC<TechHero3DProps> = ({ className = '', onExploreClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [colorMode, setColorMode] = useState<'cyan' | 'emerald' | 'violet'>('cyan');
  const [isCinematic, setIsCinematic] = useState(true);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [activeTelemetry, setActiveTelemetry] = useState({
    rotDeg: 0,
    coreLoad: 94.2,
    nodesOnline: 48,
    frequency: '4.8 GHz',
    status: 'OPTIMAL (AI SYNC)'
  });

  // Audio Synth via procedural Web Audio API (zero external assets)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const toggleAudio = () => {
    if (!isAudioActive) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, ctx.currentTime); // Deep subtle ambient hum

        // Low volume ambient drone
        gain.gain.setValueAtTime(0.015, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        audioCtxRef.current = ctx;
        oscRef.current = osc;
        gainRef.current = gain;
        setIsAudioActive(true);
      } catch (err) {
        console.warn('Audio not available', err);
      }
    } else {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
      oscRef.current = null;
      setIsAudioActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
        } catch (e) {}
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Three.js Scene Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Detect software WebGL per Three.js guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.035);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 6.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Studio Reflection Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0e1726, 1.8);
    scene.add(ambientLight);

    const primaryLight = new THREE.PointLight(0x00f2fe, 80, 15);
    primaryLight.position.set(0, 0, 0);
    scene.add(primaryLight);

    const rimLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5);
    rimLight1.position.set(5, 5, 4);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0x818cf8, 2);
    rimLight2.position.set(-5, -3, -4);
    scene.add(rimLight2);

    // 4. Color Palette configuration
    const getPalette = (mode: string) => {
      switch (mode) {
        case 'emerald':
          return {
            primary: 0x10b981,
            secondary: 0x34d399,
            glow: 0x059669,
            particle: 0x6ee7b7
          };
        case 'violet':
          return {
            primary: 0x8b5cf6,
            secondary: 0xc084fc,
            glow: 0x6366f1,
            particle: 0xd8b4fe
          };
        case 'cyan':
        default:
          return {
            primary: 0x00f0ff,
            secondary: 0x38bdf8,
            glow: 0x0284c7,
            particle: 0x7dd3fc
          };
      }
    };

    let palette = getPalette(colorMode);

    // 5. Procedural Tech Objects Group
    const techRoot = new THREE.Group();
    scene.add(techRoot);

    // A. Central Glowing Core Sphere
    const coreSphereGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const coreSphereMat = new THREE.MeshStandardMaterial({
      color: 0x050b14,
      emissive: palette.glow,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: false
    });
    const coreSphere = new THREE.Mesh(coreSphereGeo, coreSphereMat);
    techRoot.add(coreSphere);

    // B. Inner Quantum Wireframe Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(1.05, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: palette.primary,
      wireframe: true,
      emissive: palette.primary,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75
    });
    const innerWireframe = new THREE.Mesh(icoGeo, icoMat);
    techRoot.add(innerWireframe);

    // C. Concentric Circling Gyro Tech Rings ("सर्कलिंग ऑल द थिंग्स")
    // Ring 1: Equatorial Cyber Ticks Ring
    const ring1Geo = new THREE.TorusGeometry(1.5, 0.022, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: palette.primary,
      emissive: palette.primary,
      emissiveIntensity: 0.7,
      metalness: 0.8,
      roughness: 0.2
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2;
    techRoot.add(ring1);

    // Dotted marker nodes on Ring 1
    const ring1NodeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const ring1NodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ring1NodeGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const node = new THREE.Mesh(ring1NodeGeo, ring1NodeMat);
      node.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
      ring1NodeGroup.add(node);
    }
    techRoot.add(ring1NodeGroup);

    // Ring 2: Inclined Gyroscopic Telemetry Ring (45 deg)
    const ring2Geo = new THREE.TorusGeometry(1.95, 0.026, 16, 120);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: palette.secondary,
      emissive: palette.secondary,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.15
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3.5;
    ring2.rotation.y = Math.PI / 6;
    techRoot.add(ring2);

    // Ring 3: Counter-inclined Gyroscopic Circuit Ring (-55 deg)
    const ring3Geo = new THREE.TorusGeometry(2.35, 0.028, 16, 120);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: palette.glow,
      emissive: palette.glow,
      emissiveIntensity: 0.6,
      metalness: 0.95,
      roughness: 0.1
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.x = -Math.PI / 3;
    ring3.rotation.z = Math.PI / 4;
    techRoot.add(ring3);

    // Ring 4: Outer Broad Scanner Ring with radar tick teeth
    const scannerGeo = new THREE.RingGeometry(2.7, 2.76, 64);
    const scannerMat = new THREE.MeshBasicMaterial({
      color: palette.primary,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const scannerRing = new THREE.Mesh(scannerGeo, scannerMat);
    scannerRing.rotation.x = Math.PI / 2.3;
    techRoot.add(scannerRing);

    // D. Orbiting 3D Tech Satellites / Nodes (Multi-part procedural models per skill directives)
    const satellitesGroup = new THREE.Group();
    techRoot.add(satellitesGroup);

    interface SatelliteData {
      group: THREE.Group;
      radius: number;
      speed: number;
      inclination: number;
      phase: number;
      meshCore: THREE.Mesh;
    }

    const satellites: SatelliteData[] = [];
    const satCount = 4;
    const satTitles = ['AI MATCH', 'GEO GRID', 'VERIFIED TECH', 'RAPID DISPATCH'];

    for (let i = 0; i < satCount; i++) {
      const satGroup = new THREE.Group();
      
      // Part 1: Core Octahedron
      const sCoreGeo = new THREE.OctahedronGeometry(0.12);
      const sCoreMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: palette.primary,
        emissiveIntensity: 0.9,
        metalness: 0.9,
        roughness: 0.2
      });
      const sCore = new THREE.Mesh(sCoreGeo, sCoreMat);
      satGroup.add(sCore);

      // Part 2: Antenna / Panels
      const sPanelGeo = new THREE.BoxGeometry(0.36, 0.02, 0.08);
      const sPanelMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.95,
        roughness: 0.3
      });
      const sPanel = new THREE.Mesh(sPanelGeo, sPanelMat);
      satGroup.add(sPanel);

      // Part 3: Glowing Sensor Beacon
      const sBeaconGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const sBeaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const sBeacon = new THREE.Mesh(sBeaconGeo, sBeaconMat);
      sBeacon.position.set(0, 0.14, 0);
      satGroup.add(sBeacon);

      satellitesGroup.add(satGroup);

      satellites.push({
        group: satGroup,
        radius: 2.1 + i * 0.45,
        speed: (0.45 + i * 0.18) * (i % 2 === 0 ? 1 : -1),
        inclination: (i * Math.PI) / 4.5,
        phase: (i * Math.PI) / 2,
        meshCore: sCore
      });
    }

    // E. Circling Swarm of Cybernetic Tech Particles (1,200 points in toroidal vortex)
    const particleCount = isSoftwareGl ? 400 : 1200;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { radius: number; angle: number; speed: number; y: number; ySpeed: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 2.4;
      const y = (Math.random() - 0.5) * 2.2;
      
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

      particleVelocities.push({
        radius,
        angle,
        speed: (0.2 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1),
        y,
        ySpeed: (Math.random() - 0.5) * 0.15
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: palette.particle,
      size: isSoftwareGl ? 0.04 : 0.032,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    techRoot.add(particleSystem);

    // F. Laser Scanner Radar Cone / Line
    const radarGeo = new THREE.BufferGeometry();
    const radarPoints = new Float32Array([0, 0, 0, 0, 0, 2.7]);
    radarGeo.setAttribute('position', new THREE.BufferAttribute(radarPoints, 3));
    const radarMat = new THREE.LineBasicMaterial({
      color: palette.primary,
      transparent: true,
      opacity: 0.7
    });
    const radarLine = new THREE.Line(radarGeo, radarMat);
    techRoot.add(radarLine);

    // 6. Interaction: Mouse Tilt & Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const rect = container.getBoundingClientRect();
      const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);

      if (isDragging) {
        const deltaX = clientX - prevPointerX;
        const deltaY = clientY - prevPointerY;
        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;
      } else {
        mouseX = normX;
        mouseY = normY;
      }

      prevPointerX = clientX;
      prevPointerY = clientY;
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevPointerX = clientX;
      prevPointerY = clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);

    container.addEventListener('touchmove', handlePointerMove, { passive: true });
    container.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // 7. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // 8. Animation Loop
    let animationFrameId = 0;
    let clock = new THREE.Clock();
    let accumulatedTime = 0;
    let lastTelemetryUpdate = 0;

    const tick = () => {
      const delta = clock.getDelta();
      if (isPlaying) {
        accumulatedTime += delta * speedMultiplier;
      }

      const t = accumulatedTime;

      // Concentric Circling Rotations ("सर्कलिंग ऑल द थिंग्स")
      ring1.rotation.z = t * 0.45;
      ring1NodeGroup.rotation.y = t * 0.45;

      ring2.rotation.z = -t * 0.55;
      ring2.rotation.x = Math.PI / 3.5 + Math.sin(t * 0.3) * 0.15;

      ring3.rotation.y = t * 0.65;
      ring3.rotation.z = Math.PI / 4 + Math.cos(t * 0.25) * 0.18;

      scannerRing.rotation.z = t * 0.35;
      radarLine.rotation.y = t * 1.4;

      innerWireframe.rotation.x = t * 0.25;
      innerWireframe.rotation.y = t * 0.35;

      // Pulsing central core
      const pulse = 1 + Math.sin(t * 3.5) * 0.06;
      coreSphere.scale.set(pulse, pulse, pulse);
      coreSphereMat.emissiveIntensity = 0.75 + Math.sin(t * 4.0) * 0.35;

      // Orbiting tech satellites
      satellites.forEach((sat, idx) => {
        const satAngle = t * sat.speed + sat.phase;
        const x = Math.cos(satAngle) * sat.radius;
        const z = Math.sin(satAngle) * sat.radius;
        const y = Math.sin(satAngle * 1.5 + sat.inclination) * 0.5;

        sat.group.position.set(x, y, z);
        sat.group.rotation.y = -satAngle;
        sat.group.rotation.x = Math.sin(t * 2 + idx) * 0.2;
      });

      // Circling particle vortex animation
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const vel = particleVelocities[i];
        vel.angle += vel.speed * delta * speedMultiplier;
        vel.y += vel.ySpeed * delta * speedMultiplier;

        if (vel.y > 1.2) vel.y = -1.2;
        if (vel.y < -1.2) vel.y = 1.2;

        posArray[i * 3] = Math.cos(vel.angle) * vel.radius;
        posArray[i * 3 + 1] = vel.y + Math.sin(vel.angle * 2 + t) * 0.1;
        posArray[i * 3 + 2] = Math.sin(vel.angle) * vel.radius;
      }
      posAttr.needsUpdate = true;

      // Camera motion: Cinematic automated circling vs interactive mouse tilt
      if (isCinematic) {
        const camOrbitRadius = 6.0;
        const camOrbitAngle = t * 0.22;
        const camHeight = 1.4 + Math.sin(t * 0.3) * 0.8;
        camera.position.x = Math.sin(camOrbitAngle) * camOrbitRadius + mouseX * 0.5;
        camera.position.z = Math.cos(camOrbitAngle) * camOrbitRadius;
        camera.position.y = camHeight + mouseY * 0.5;
        camera.lookAt(0, 0.1, 0);
      } else {
        // Direct pointer-driven orbit with damping
        targetRotY += mouseX * 0.01;
        targetRotX += mouseY * 0.01;

        techRoot.rotation.y += (targetRotY - techRoot.rotation.y) * 0.06;
        techRoot.rotation.x += (targetRotX - techRoot.rotation.x) * 0.06;
        camera.position.set(0, 1.4, 6.0);
        camera.lookAt(0, 0, 0);
      }

      // Live Telemetry throttle update (every 100ms)
      if (Date.now() - lastTelemetryUpdate > 120) {
        lastTelemetryUpdate = Date.now();
        setActiveTelemetry({
          rotDeg: Math.round(((t * 30) % 360)),
          coreLoad: Number((91 + Math.sin(t * 1.5) * 5.8).toFixed(1)),
          nodesOnline: 48 + (Math.floor(t) % 4),
          frequency: `${(4.8 + Math.sin(t * 2) * 0.3).toFixed(2)} GHz`,
          status: isPlaying ? 'ACTIVE CIRCLING (3D SYNC)' : 'PAUSED (STANDBY)'
        });
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // Cleanup per Three.js guidelines
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('touchmove', handlePointerMove);
      container.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchend', handlePointerUp);

      // Dispose geometries, materials, renderer
      coreSphereGeo.dispose();
      coreSphereMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring1NodeGeo.dispose();
      ring1NodeMat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      scannerGeo.dispose();
      scannerMat.dispose();
      radarGeo.dispose();
      radarMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, [isPlaying, speedMultiplier, colorMode, isCinematic]);

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 ${className}`}>
      {/* Background AI Tech Visual Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('/src/assets/images/ai_tech_hero_bg_1792822793267.jpg')` }}
      />
      
      {/* Radial Gradient Vignette for Depth */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_20%,#020617_90%] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

      {/* Cyber Grid Lines Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(6, 182, 212, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* 3D Three.js Interactive Canvas Container */}
      <div 
        ref={containerRef} 
        className="relative w-full h-[480px] md:h-[580px] cursor-grab active:cursor-grabbing flex items-center justify-center"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top Floating Cyber Telemetry HUD */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
          <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-full text-xs text-cyan-300 font-mono shadow-lg shadow-cyan-950/40">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            <Cpu size={14} className="text-cyan-400" />
            <span className="font-bold tracking-wider">AI DIAGNOSTIC CORE</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-bold">{activeTelemetry.status}</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-4 py-1.5 rounded-full text-xs font-mono text-slate-300 shadow-lg">
            <div className="flex items-center gap-1.5">
              <Activity size={13} className="text-indigo-400" />
              <span>LOAD: <strong className="text-white">{activeTelemetry.coreLoad}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={13} className="text-emerald-400" />
              <span>NODES: <strong className="text-emerald-300">{activeTelemetry.nodesOnline}</strong></span>
            </div>
            <div className="text-cyan-400 font-bold">
              ORBIT: {activeTelemetry.rotDeg}°
            </div>
          </div>
        </div>

        {/* Circling 3D Tech Nodes Floating Badges */}
        <div className="absolute top-20 left-6 hidden lg:flex flex-col gap-2 pointer-events-none z-10 max-w-xs">
          <div className="bg-slate-900/85 backdrop-blur-md border-l-2 border-cyan-400 p-2.5 rounded-r-xl shadow-lg border-y border-r border-slate-800 text-xs">
            <div className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">Autonomous Matching</div>
            <div className="text-white font-semibold">Real-Time Jaunpur Service Grid</div>
            <div className="text-slate-400 text-[11px] mt-0.5">3D Circling Neural Orbital Routing</div>
          </div>

          <div className="bg-slate-900/85 backdrop-blur-md border-l-2 border-emerald-400 p-2.5 rounded-r-xl shadow-lg border-y border-r border-slate-800 text-xs">
            <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Verified Dispatch</div>
            <div className="text-white font-semibold">100% Certified Technicians</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Instant GPS Locality Proximity</div>
          </div>
        </div>

        <div className="absolute bottom-20 right-6 hidden lg:flex flex-col gap-2 pointer-events-none z-10 max-w-xs text-right">
          <div className="bg-slate-900/85 backdrop-blur-md border-r-2 border-indigo-400 p-2.5 rounded-l-xl shadow-lg border-y border-l border-slate-800 text-xs">
            <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">Holographic Telemetry</div>
            <div className="text-white font-semibold">60 FPS Hardware Accelerated</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Interactive Multi-Axis Gyro Rings</div>
          </div>
        </div>

        {/* Bottom Interactive HUD Control Bar */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-auto z-20">
          {/* Mode & Speed Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
              title={isPlaying ? 'Pause 3D Orbit' : 'Play 3D Orbit'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="text-cyan-400" />}
            </button>

            {/* Cinematic Camera Toggle */}
            <button
              onClick={() => setIsCinematic(!isCinematic)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                isCinematic 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Eye size={13} />
              <span>{isCinematic ? 'Cinematic Circling' : 'Manual Orbit'}</span>
            </button>

            {/* Orbit Speed Multiplier */}
            <button
              onClick={() => {
                const nextSpeed = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 0.5 : 1;
                setSpeedMultiplier(nextSpeed);
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
              title="Change circling speed"
            >
              {speedMultiplier}x
            </button>

            {/* Color Palette Presets */}
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <div className="flex items-center gap-1 px-1">
              <button
                onClick={() => setColorMode('cyan')}
                className={`w-4 h-4 rounded-full bg-cyan-400 transition-all cursor-pointer ${
                  colorMode === 'cyan' ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                title="Cyan Quantum Core"
              />
              <button
                onClick={() => setColorMode('emerald')}
                className={`w-4 h-4 rounded-full bg-emerald-400 transition-all cursor-pointer ${
                  colorMode === 'emerald' ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                title="Emerald Hyperlocal Matrix"
              />
              <button
                onClick={() => setColorMode('violet')}
                className={`w-4 h-4 rounded-full bg-purple-400 transition-all cursor-pointer ${
                  colorMode === 'violet' ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                title="Violet Neural Lattice"
              />
            </div>
          </div>

          {/* Audio Hum FX & Help text */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isAudioActive
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle sci-fi ambient core audio synth"
            >
              {isAudioActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="hidden sm:inline font-mono">{isAudioActive ? 'SYNTH ON' : 'SYNTH FX'}</span>
            </button>

            {onExploreClick && (
              <button
                onClick={onExploreClick}
                className="btn-primary bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Explore Services</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechHero3D;
