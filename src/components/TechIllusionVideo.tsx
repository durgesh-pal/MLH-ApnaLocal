import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Volume2, VolumeX, LogIn, Sparkles, ShieldCheck, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface TechIllusionVideoProps {
  onVideoEnd?: () => void;
  autoPlay?: boolean;
  durationSeconds?: number;
  showRedirectCountdown?: boolean;
  className?: string;
  isHeroMode?: boolean;
}

export const TechIllusionVideo: React.FC<TechIllusionVideoProps> = ({
  onVideoEnd,
  autoPlay = true,
  durationSeconds = 8,
  showRedirectCountdown = true,
  className = '',
  isHeroMode = false
}) => {
  const navigate = useNavigate();
  const { language, t } = useAppContext();
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [phaseText, setPhaseText] = useState('Initializing 3D Tech Illusion...');

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<any>(null);

  // Procedural futuristic audio pulse on play
  const playTechAudioPulse = (freq: number = 440, type: OscillatorType = 'sine') => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio autoplay restrictions safe
    }
  };

  const startTimeRef = useRef<number>(Date.now());
  const redirectTriggeredRef = useRef<boolean>(false);

  // Video Progress Timer & Auto-redirect
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    startTimeRef.current = Date.now() - currentTime * 1000;
    redirectTriggeredRef.current = false;
    const stepMs = 50;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;

      if (elapsed >= durationSeconds) {
        clearInterval(intervalRef.current);
        setProgress(100);
        setCurrentTime(durationSeconds);
        setIsPlaying(false);
        setPhaseText(language === 'hi' ? 'डैशबोर्ड पेज खोल रहे हैं...' : 'Redirecting to Dashboard...');

        if (!redirectTriggeredRef.current) {
          redirectTriggeredRef.current = true;
          playTechAudioPulse(880, 'triangle');

          setTimeout(() => {
            if (onVideoEnd) {
              onVideoEnd();
            } else {
              navigate('/dashboard');
            }
          }, 120);
        }
      } else {
        const nextPct = Math.min(100, (elapsed / durationSeconds) * 100);
        setProgress(nextPct);
        setCurrentTime(elapsed);

        // Dynamic tech phase telemetry
        if (nextPct < 25) {
          setPhaseText(language === 'hi' ? '3D न्यूरल टेक इल्यूजन सक्रिय हो रहा है...' : 'Synthesizing 3D Chromatic Matrix...');
        } else if (nextPct < 55) {
          setPhaseText(language === 'hi' ? 'होलोग्राफिक स्पाइन व जाइरोस्कोपिक रेंडरिंग...' : 'Holographic Spine & Tech Ring Alignment...');
        } else if (nextPct < 85) {
          setPhaseText(language === 'hi' ? 'डैशबोर्ड इंटरफेस लोड हो रहा है...' : 'Loading Dashboard Interface...');
        } else {
          setPhaseText(language === 'hi' ? 'डैशबोर्ड पेज खोल रहे हैं...' : 'Redirecting to Dashboard...');
        }
      }
    }, stepMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, durationSeconds, onVideoEnd, navigate, language]);

  // Canvas tech visual effects overlay: light sweep, grid scanline, glowing particles
  useEffect(() => {
    const canvas = canvasOverlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let t = 0;

    const resize = () => {
      if (canvas && videoContainerRef.current) {
        canvas.width = videoContainerRef.current.clientWidth || 800;
        canvas.height = videoContainerRef.current.clientHeight || 500;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle nodes
    const particleCount = 40;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 500),
      radius: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: (Math.random() - 0.5) * 0.8,
      alpha: Math.random() * 0.6 + 0.2
    }));

    const render = () => {
      t += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Moving iridescent chromatic light scan line
      const scanX = ((t * 80) % (canvas.width + 200)) - 100;
      const grad = ctx.createLinearGradient(scanX - 80, 0, scanX + 80, canvas.height);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.2)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Wave frequency ripple (mirroring the wave in the image)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < canvas.width; x += 10) {
        const y = canvas.height * 0.35 + Math.sin(x * 0.02 + t * 2) * 20 * Math.sin(x * 0.005);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3. Floating glowing particles
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(125, 211, 252, ${p.alpha * (0.5 + Math.sin(t * 3 + p.x) * 0.5)})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleReplay = () => {
    redirectTriggeredRef.current = false;
    startTimeRef.current = Date.now();
    setCurrentTime(0);
    setProgress(0);
    setIsPlaying(true);
    playTechAudioPulse(520, 'sine');
  };

  const handleSkipToDashboard = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    redirectTriggeredRef.current = true;
    if (onVideoEnd) {
      onVideoEnd();
    } else {
      navigate('/dashboard');
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const remainingSeconds = Math.max(0, Math.ceil(durationSeconds - currentTime));

  return (
    <div 
      ref={videoContainerRef}
      className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 select-none ${className}`}
    >
      {/* Background Illusion Image Layer with Cinematic Ken-Burns Video Motion */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-linear ${
          isPlaying ? 'scale-110 translate-x-2 -translate-y-1' : 'scale-100 translate-x-0 translate-y-0'
        }`}
        style={{
          backgroundImage: `url('/assets/aistudio/Screenshot_2026-10-24_120057_76f19bf9.png')`,
          filter: 'contrast(1.08) saturate(1.15) brightness(0.95)'
        }}
      />

      {/* Iridescent Vignette & Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_30%,#020617_90%] pointer-events-none" />

      {/* Canvas Dynamic Light Effects Overlay */}
      <canvas 
        ref={canvasOverlayRef} 
        className="absolute inset-0 pointer-events-none w-full h-full"
      />

      {/* Cyber Grid Lines Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(56, 189, 248, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Top Header Overlay Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 p-4 md:p-6 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent">
        <div className="flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-full text-xs text-cyan-300 font-mono shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
          <Sparkles size={14} className="text-cyan-400" />
          <span className="font-bold tracking-wider">3D TECH ILLUSION VIDEO</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold">{isPlaying ? 'PLAYING (LIVE 60FPS)' : 'PAUSED'}</span>
        </div>

        {/* Skip to Dashboard Button */}
        <button
          onClick={handleSkipToDashboard}
          className="btn-primary bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xl shadow-cyan-500/20 cursor-pointer transition-all hover:scale-105"
        >
          <ShieldCheck size={15} />
          <span>{language === 'hi' ? 'डैशबोर्ड खोलें' : 'Skip to Dashboard'}</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Center Cinematic Stage Telemetry & Countdown Banner */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[320px] md:min-h-[440px] px-6 text-center">
        {/* Glowing Holographic Badge */}
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-cyan-400/40 text-cyan-300 text-xs shadow-2xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className={language === 'hi' ? 'font-sans font-medium' : 'font-mono'}>{phaseText}</span>
        </div>

        {showRedirectCountdown && (
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-5 py-3 rounded-2xl shadow-2xl max-w-md">
            <div className="text-xs text-slate-400 font-medium mb-1">
              {language === 'hi' 
                ? 'वीडियो समाप्त होते ही सीधे डैशबोर्ड पर पहुंचेंगे:' 
                : 'Auto-transitioning to Dashboard upon video completion:'}
            </div>
            <div className="text-lg md:text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              {remainingSeconds > 0 
                ? `${language === 'hi' ? 'डैशबोर्ड में जा रहे हैं' : 'Opening Dashboard in'} 00:0${remainingSeconds}s`
                : (language === 'hi' ? 'डैशबोर्ड खुल रहा है...' : 'Opening Dashboard...')}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Video Controls & Progress Bar */}
      <div className="relative z-20 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
        {/* Dynamic Video Progress Bar */}
        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden mb-4 border border-slate-700/50 cursor-pointer">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 rounded-full transition-all duration-75 relative"
            style={{ width: `${progress}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-cyan-400" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Play/Pause & Replay Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white transition-all cursor-pointer shadow-md"
              title={isPlaying ? 'Pause Illusion Video' : 'Play Illusion Video'}
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} className="text-cyan-400" />}
            </button>

            <button
              onClick={handleReplay}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow-md"
              title="Replay Video from Start"
            >
              <RotateCcw size={17} />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (!nextMute) playTechAudioPulse(440, 'sine');
              }}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                !isMuted 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                  : 'bg-slate-900/90 border-slate-700 text-slate-400'
              }`}
              title="Toggle Audio Synth"
            >
              {!isMuted ? <Volume2 size={17} /> : <VolumeX size={17} />}
              <span className="hidden sm:inline font-mono text-[11px] font-bold">{!isMuted ? 'FX ON' : 'MUTED'}</span>
            </button>

            {/* Time Stamp */}
            <div className="text-xs font-mono text-slate-400 pl-2">
              00:0{Math.floor(currentTime)} / 00:0{durationSeconds}
            </div>
          </div>

          {/* Right Action: Fullscreen & Open Dashboard Action */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>

            <button
              onClick={handleSkipToDashboard}
              className="btn-primary bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/25"
            >
              <ChevronRight size={15} />
              <span>{language === 'hi' ? 'सीधे डैशबोर्ड जाएं' : 'Go to Dashboard'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechIllusionVideo;
