import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioSoundType } from '../types/sql';

export function useSqlAudio() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('sql_audio_muted');
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Proactively unlock and resume AudioContext on user interaction
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, [getAudioContext]);

  // 1. Syntax Scanner Sound: High-frequency soft blip/tick (~920Hz -> 1250Hz, 45ms)
  const playScanSound = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(1250, now + 0.045);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext]);

  // 2. Filter / Elimination Sound: Tactile low-mid descending whoosh & drop
  const playFilterSound = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Layer 1: Filtered Sawtooth Whoosh (540Hz -> 140Hz)
      const osc = ctx.createOscillator();
      const biquad = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);

      biquad.type = 'lowpass';
      biquad.frequency.setValueAtTime(1400, now);
      biquad.frequency.exponentialRampToValueAtTime(220, now + 0.28);
      biquad.Q.setValueAtTime(2.5, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(biquad);
      biquad.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.29);

      // Layer 2: Sub-bass "Thump" drop body (220Hz -> 75Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(220, now + 0.03);
      subOsc.frequency.exponentialRampToValueAtTime(75, now + 0.26);

      subGain.gain.setValueAtTime(0.18, now + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(now + 0.03);
      subOsc.stop(now + 0.27);
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext]);

  // 3. Merge / Grouping Sound: Snapping tight harmonic chord (C5 + E5 + G5 + C6)
  const playMergeSound = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major Triad + Octave
      const now = ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const start = now + idx * 0.018;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.33);
      });
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext]);

  // 4. Sort / Reorder Sound: Rapid ascending 4-note arpeggio (440Hz -> 554Hz -> 659Hz -> 880Hz)
  const playSortSound = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880];
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const start = now + idx * 0.04;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext]);

  // 5. Final Result Ping: Shimmering dual bell chime (E5 -> A5 -> C#6)
  const playSuccessSound = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const chimes = [659.25, 880, 1108.73];
      const now = ctx.currentTime;

      chimes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const start = now + idx * 0.07;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.46);
      });
    } catch {
      // ignore
    }
  }, [isMuted, getAudioContext]);

  // Toggle Mute with auditory feedback
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sql_audio_muted', JSON.stringify(next));
      } catch {
        // ignore
      }
      if (!next) {
        // Just unmuted: play quick confirmation chime
        setTimeout(() => playScanSound(), 50);
      }
      return next;
    });
  }, [playScanSound]);

  // Dispatcher for any sound type
  const playSound = useCallback((soundType: AudioSoundType) => {
    switch (soundType) {
      case 'scan':
        playScanSound();
        break;
      case 'filter':
        playFilterSound();
        break;
      case 'merge':
        playMergeSound();
        break;
      case 'sort':
        playSortSound();
        break;
      case 'success':
        playSuccessSound();
        break;
    }
  }, [playScanSound, playFilterSound, playMergeSound, playSortSound, playSuccessSound]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isMuted,
    toggleMute,
    playSound,
    playScanSound,
    playFilterSound,
    playMergeSound,
    playSortSound,
    playSuccessSound,
  };
}
