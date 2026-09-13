/**
 * Level 23 Audio Playback & Hardware Synchronization Service
 * 
 * Provides resilient audio playback for tablet (iPadOS Safari, Android Chrome)
 * and desktop environments, bypassing mobile browser autoplay restrictions
 * via user gesture priming, HTML5 Audio element caching, and multi-tier
 * fallback (Gemini 24kHz Studio TTS -> Web Audio API -> SpeechSynthesis).
 */

class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private reusableAudioElement: HTMLAudioElement | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private currentPlayToken: number = 0;
  private isUnlocked: boolean = false;
  private listenersAttached: boolean = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private speechKeepAliveInterval: any = null;
  private speechWatchdogTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.attachUnlockListeners();
    }
  }

  /**
   * Automatically listens for first user tap/touch/click to unlock tablet audio hardware.
   */
  public attachUnlockListeners() {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;

    const unlockHandler = () => {
      this.unlockAudioSystem().catch(() => {});
      // Remove listeners once unlocked
      window.removeEventListener('touchstart', unlockHandler, true);
      window.removeEventListener('touchend', unlockHandler, true);
      window.removeEventListener('click', unlockHandler, true);
      window.removeEventListener('keydown', unlockHandler, true);
    };

    window.addEventListener('touchstart', unlockHandler, { capture: true, passive: true });
    window.addEventListener('touchend', unlockHandler, { capture: true, passive: true });
    window.addEventListener('click', unlockHandler, { capture: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { capture: true, passive: true });
  }

  /**
   * Initializes or returns the singleton AudioContext
   */
  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.audioContext = new AudioCtx();
        } catch (e) {
          console.warn('[AudioService] Could not initialize AudioContext:', e);
        }
      }
    }
    return this.audioContext;
  }

  /**
   * Returns a primed HTMLAudioElement for mobile/tablet playback
   */
  public getAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.reusableAudioElement) {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        // Essential mobile WebKit flags
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        this.reusableAudioElement = audio;
      } catch (e) {
        console.warn('[AudioService] Could not create HTMLAudioElement:', e);
      }
    }
    return this.reusableAudioElement;
  }

  /**
   * Unlocks audio on tablet/mobile devices during a user gesture
   */
  public async unlockAudioSystem(): Promise<{ unlocked: boolean; state: string }> {
    if (typeof window === 'undefined') return { unlocked: false, state: 'ssr' };

    let state = 'unsupported';
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        state = ctx.state;

        // Play 1ms silent buffer to prime the hardware DAC
        try {
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
        } catch {}
      }

      // Prime HTML5 Audio element with a silent wav data-uri
      const audio = this.getAudioElement();
      if (audio) {
        audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
        audio.play().catch(() => {});
      }

      // Prime SpeechSynthesis on iOS WebKit
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
          const primeUtterance = new SpeechSynthesisUtterance('');
          primeUtterance.volume = 0;
          window.speechSynthesis.speak(primeUtterance);
        } catch {}
      }

      this.isUnlocked = true;
      return { unlocked: true, state };
    } catch (err: any) {
      console.warn('[AudioService] Audio unlock notice:', err);
      return { unlocked: false, state: err?.message || 'error' };
    }
  }

  /**
   * Immediately stops all audio output (TTS, HTML5 Audio, Web Audio, and SpeechSynthesis)
   */
  public stopAllAudio() {
    this.currentPlayToken++;

    if (this.speechKeepAliveInterval) {
      clearInterval(this.speechKeepAliveInterval);
      this.speechKeepAliveInterval = null;
    }

    if (this.speechWatchdogTimeout) {
      clearTimeout(this.speechWatchdogTimeout);
      this.speechWatchdogTimeout = null;
    }

    this.activeUtterance = null;
    if (typeof window !== 'undefined') {
      (window as any).__activeUtterance = null;
    }

    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {}
      this.activeSource = null;
    }

    if (this.reusableAudioElement) {
      try {
        this.reusableAudioElement.pause();
        this.reusableAudioElement.currentTime = 0;
        this.reusableAudioElement.src = '';
      } catch {}
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Cleans text for natural speech synthesis
   */
  public cleanTextForSpeech(rawText: string): string {
    return rawText
      .replace(/https?:\/\/[^\s]+/g, 'the online link')
      .replace(/[A-Za-z]:\\[^\s]+/g, 'your local files')
      .replace(/1EW-bOXh[^\s]+/g, 'our Google Drive folder')
      .replace(/[*#`_~\[\]{}()<>]/g, ' ')
      .replace(/^\s*[-•*]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Speaks using browser SpeechSynthesis as resilient fallback
   */
  public speakWithBrowserSynthesis(
    cleanText: string,
    voicePreference: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (e: any) => void
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onError?.(new Error('SpeechSynthesis not supported'));
      onEnd?.();
      return;
    }

    try {
      // Clear any prior speech timers
      if (this.speechKeepAliveInterval) {
        clearInterval(this.speechKeepAliveInterval);
        this.speechKeepAliveInterval = null;
      }
      if (this.speechWatchdogTimeout) {
        clearTimeout(this.speechWatchdogTimeout);
        this.speechWatchdogTimeout = null;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const textSnippet = cleanText.slice(0, 1000).trim();
      if (!textSnippet) {
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textSnippet);
      // Retain utterance reference to prevent Chromium V8 garbage collection dropping onend
      this.activeUtterance = utterance;
      (window as any).__activeUtterance = utterance;

      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));

      let matchedVoice: SpeechSynthesisVoice | null = null;
      if (voices.length > 0) {
        if (voicePreference === 'Aoede' || voicePreference.toLowerCase().includes('phoenix') || voicePreference.toLowerCase().includes('uk')) {
          // Phoenix British UK Accent
          const ukVoices = englishVoices.filter(v => {
            const lang = v.lang.toLowerCase();
            const name = v.name.toLowerCase();
            return lang.includes('gb') || lang.includes('uk') || name.includes('british') || name.includes('united kingdom') || name.includes('england');
          });
          matchedVoice = ukVoices.find(v => {
            const name = v.name.toLowerCase();
            return name.includes('natural') || name.includes('online') || name.includes('libby') || name.includes('sonia') || name.includes('serena') || name.includes('google uk english female') || name.includes('kate') || name.includes('fiona');
          }) || ukVoices[0] || null;
        } else {
          // Eve Warm US English
          matchedVoice = englishVoices.find(v => {
            const name = v.name.toLowerCase();
            return (name.includes('natural') || name.includes('online') || name.includes('jenny') || name.includes('samantha') || name.includes('google us') || name.includes('zira')) && !name.includes('david');
          }) || null;
        }

        if (!matchedVoice) {
          const candidates = englishVoices.length > 0 ? englishVoices : voices;
          matchedVoice = candidates.find(v => {
            const name = v.name.toLowerCase();
            return (name.includes('female') || name.includes('natural') || name.includes('enhanced') || name.includes('google')) && !name.includes('david');
          }) || candidates[0] || null;
        }
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.volume = 1.0;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      let hasFinished = false;
      const finishSpeech = () => {
        if (hasFinished) return;
        hasFinished = true;
        if (this.speechKeepAliveInterval) {
          clearInterval(this.speechKeepAliveInterval);
          this.speechKeepAliveInterval = null;
        }
        if (this.speechWatchdogTimeout) {
          clearTimeout(this.speechWatchdogTimeout);
          this.speechWatchdogTimeout = null;
        }
        this.activeUtterance = null;
        (window as any).__activeUtterance = null;
        onEnd?.();
      };

      utterance.onstart = () => {
        onStart?.();
        // Chromium keepalive: resume every 4 seconds so long utterances don't stall
        if (this.speechKeepAliveInterval) clearInterval(this.speechKeepAliveInterval);
        this.speechKeepAliveInterval = setInterval(() => {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            }
          }
        }, 4000);
      };

      utterance.onend = () => {
        finishSpeech();
      };

      utterance.onerror = (e) => {
        console.warn('[AudioService] SpeechSynthesis notice:', e);
        finishSpeech();
      };

      // Watchdog timeout based on length of text (approx 120 words per minute ~ 500ms per word + 3s buffer)
      const wordCount = textSnippet.split(/\s+/).length;
      const estimatedDurationMs = Math.max(3000, Math.min(25000, wordCount * 550 + 3500));
      this.speechWatchdogTimeout = setTimeout(() => {
        if (!hasFinished) {
          console.info('[AudioService] Speech watchdog triggered to release audio state.');
          finishSpeech();
        }
      }, estimatedDurationMs);

      // Brief 10ms micro-pause after cancel before calling speak in Chromium
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (speakErr) {
          console.warn('[AudioService] speak() error:', speakErr);
          finishSpeech();
        }
      }, 20);
    } catch (err) {
      console.warn('[AudioService] SpeechSynthesis exception:', err);
      onError?.(err);
      onEnd?.();
    }
  }

  /**
   * Main speech playback function:
   * 1. Unlocks audio context
   * 2. Calls /api/gemini/tts for Studio 24kHz Audio (Aoede for Phoenix, Kore for Eve)
   * 3. Plays via HTML5 Audio Element or Web Audio API
   * 4. Gracefully falls back to browser SpeechSynthesis
   */
  public async playVoiceAudio(options: {
    text: string;
    voiceName?: string;
    agent?: 'PHOENIX' | 'EVE' | string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }): Promise<{ success: boolean; method: string }> {
    const { text, agent, onStart, onEnd, onError } = options;
    const voiceName = options.voiceName || (agent === 'EVE' ? 'Kore' : 'Aoede');

    this.stopAllAudio();
    const thisToken = ++this.currentPlayToken;

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) {
      onEnd?.();
      return { success: false, method: 'none' };
    }

    // Proactively unlock
    await this.unlockAudioSystem();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for TTS generation

      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voiceName: voiceName
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (thisToken !== this.currentPlayToken) return { success: false, method: 'cancelled' };

      if (response.ok) {
        const data = await response.json();
        if (thisToken !== this.currentPlayToken) return { success: false, method: 'cancelled' };

        if (data.base64Audio) {
          const base64Data = data.base64Audio;
          const dataUrl = `data:audio/wav;base64,${base64Data}`;

          // Strategy 1: HTML5 Audio Element (Highest reliability on iPadOS & Android tablet)
          const audioElement = this.getAudioElement();
          if (audioElement) {
            try {
              audioElement.src = dataUrl;
              audioElement.volume = 1.0;

              const playPromise = audioElement.play();

              if (playPromise !== undefined) {
                await playPromise;
              }

              onStart?.();

              audioElement.onended = () => {
                if (thisToken === this.currentPlayToken) {
                  onEnd?.();
                }
              };

              audioElement.onerror = (e) => {
                console.warn('[AudioService] Audio element playback error, falling back to WebAudio/SpeechSynthesis:', e);
                this.fallbackPlay(cleanText, voiceName, thisToken, onStart, onEnd, onError);
              };

              return { success: true, method: 'gemini_tts_html5' };
            } catch (playErr) {
              console.warn('[AudioService] HTMLAudioElement.play() blocked or failed, attempting Web Audio API:', playErr);
            }
          }

          // Strategy 2: Web Audio API AudioContext
          const ctx = this.getAudioContext();
          if (ctx) {
            try {
              if (ctx.state === 'suspended') await ctx.resume();

              const binaryString = window.atob(base64Data);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              const audioBuffer = await new Promise<AudioBuffer | null>((resolve) => {
                ctx.decodeAudioData(
                  bytes.buffer.slice(0),
                  (decoded) => resolve(decoded),
                  () => resolve(null)
                );
              });

              if (audioBuffer && thisToken === this.currentPlayToken) {
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                this.activeSource = source;

                onStart?.();

                source.onended = () => {
                  if (thisToken === this.currentPlayToken) {
                    this.activeSource = null;
                    onEnd?.();
                  }
                };

                source.start(0);
                return { success: true, method: 'gemini_tts_webaudio' };
              }
            } catch (webAudioErr) {
              console.warn('[AudioService] Web Audio API decode error:', webAudioErr);
            }
          }
        }
      }

      // If TTS API was not ok or returned no base64Audio, fall back
      this.fallbackPlay(cleanText, voiceName, thisToken, onStart, onEnd, onError);
      return { success: true, method: 'speech_synthesis_fallback' };
    } catch (fetchErr) {
      console.warn('[AudioService] TTS API fetch error, falling back to SpeechSynthesis:', fetchErr);
      this.fallbackPlay(cleanText, voiceName, thisToken, onStart, onEnd, onError);
      return { success: true, method: 'speech_synthesis_fallback' };
    }
  }

  private fallbackPlay(
    cleanText: string,
    voiceName: string,
    token: number,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (e: any) => void
  ) {
    if (token !== this.currentPlayToken) return;
    this.speakWithBrowserSynthesis(cleanText, voiceName, onStart, onEnd, onError);
  }

  /**
   * Sound Check diagnostic tool specifically for testing audio on tablets and mobile devices
   */
  public async testPhoenixAudio(agent: 'PHOENIX' | 'EVE' = 'PHOENIX'): Promise<{
    success: boolean;
    method: string;
    contextState: string;
    tabletTips: string[];
  }> {
    const testPhrase = agent === 'PHOENIX'
      ? "Hello Alex, this is Phoenix. Your audio system is online, and sound output is working properly on your tablet."
      : "Hello Alex, this is Eve. Practice audio is verified and working clearly on your tablet.";

    const result = await this.playVoiceAudio({
      text: testPhrase,
      agent: agent,
      voiceName: agent === 'PHOENIX' ? 'Aoede' : 'Kore'
    });

    const ctx = this.getAudioContext();
    const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

    const tabletTips: string[] = [];

    if (isIOS) {
      tabletTips.push("iPad Silent Mode: Swipe down from top-right corner to open Control Center and ensure the Bell icon (Silent Mode) is OFF.");
      tabletTips.push("iPad Volume Buttons: Press the volume up button on the edge of your iPad to raise Media Volume.");
      tabletTips.push("Bluetooth Audio: Check if your iPad is connected to Bluetooth headphones or AirPods in another room.");
    } else if (isAndroid) {
      tabletTips.push("Android Media Volume: Press the physical volume button and expand the slider to verify 'Media Volume' is turned up.");
      tabletTips.push("Do Not Disturb: Ensure 'Do Not Disturb' or Total Silence is not enabled on your tablet.");
    } else {
      tabletTips.push("Check speaker/headphone volume and verify browser tab is not muted.");
    }

    return {
      success: result.success,
      method: result.method,
      contextState: ctx ? ctx.state : 'unsupported',
      tabletTips
    };
  }

  /**
   * Diagnostic summary
   */
  public getDiagnostics() {
    const ctx = this.getAudioContext();
    const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const voices = hasSpeechSynthesis ? window.speechSynthesis.getVoices().length : 0;
    const isTablet = typeof navigator !== 'undefined' && (
      /iPad|Android/i.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );

    return {
      audioContextState: ctx ? ctx.state : 'unavailable',
      speechSynthesisSupported: hasSpeechSynthesis,
      voicesCount: voices,
      isTabletOrMobile: isTablet,
      isUnlocked: this.isUnlocked
    };
  }
}

export const audioService = new AudioPlaybackService();
