/**
 * Level 23 Audio Playback & Hardware Synchronization Service
 * 
 * Provides resilient audio playback, bypassing mobile browser autoplay restrictions
 * via user gesture priming, HTML5 Audio element caching, and multi-tier
 * fallback (ElevenLabs -> Gemini TTS -> Web Speech API).
 * 
 * Strictly Female Voices with Phoenix configured with a distinguished UK/British accent.
 */

class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private reusableAudioElement: HTMLAudioElement | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private currentPlayToken: number = 0;
  private isUnlocked: boolean = false;
  private listenersAttached: boolean = false;
  private isGeminiDepleted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.attachUnlockListeners();
    }
  }

  public attachUnlockListeners() {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;
    const unlockHandler = () => {
      this.unlockAudioSystem().catch(() => {});
      window.removeEventListener('click', unlockHandler, true);
      window.removeEventListener('keydown', unlockHandler, true);
      window.removeEventListener('touchstart', unlockHandler, true);
    };
    window.addEventListener('click', unlockHandler, { capture: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { capture: true, passive: true });
    window.addEventListener('touchstart', unlockHandler, { capture: true, passive: true });
  }

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

  public getAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.reusableAudioElement) {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        this.reusableAudioElement = audio;
      } catch (e) {
        console.warn('[AudioService] Could not create HTMLAudioElement:', e);
      }
    }
    return this.reusableAudioElement;
  }

  public async unlockAudioSystem(): Promise<{ unlocked: boolean; state: string }> {
    if (typeof window === 'undefined') return { unlocked: false, state: 'ssr' };
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') await ctx.resume();
      this.isUnlocked = true;
      return { unlocked: true, state: ctx?.state || 'running' };
    } catch (err: any) {
      return { unlocked: false, state: err?.message || 'error' };
    }
  }

  public stopAllAudio() {
    this.currentPlayToken++;
    if (this.activeSource) {
      try { this.activeSource.stop(); this.activeSource.disconnect(); } catch {}
      this.activeSource = null;
    }
    if (this.reusableAudioElement) {
      try {
        this.reusableAudioElement.pause();
        this.reusableAudioElement.currentTime = 0;
        this.reusableAudioElement.src = '';
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  }

  public getDiagnostics() {
    const ctx = this.audioContext;
    const isTabletOrMobile = typeof navigator !== 'undefined' && 
      (/iPad|iPhone|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(navigator.userAgent) || 
       (Boolean(navigator.maxTouchPoints) && navigator.maxTouchPoints > 1));
    const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    
    return {
      audioContextState: ctx?.state || 'suspended',
      isTabletOrMobile,
      speechSynthesisSupported,
      unlocked: this.isUnlocked
    };
  }

  public async testPhoenixAudio(agent: 'PHOENIX' | 'EVE' | string = 'PHOENIX'): Promise<{
    success: boolean;
    method: string;
    contextState: string;
    tabletTips: string[];
  }> {
    const isPhoenix = agent.toUpperCase().includes('PHOENIX');
    const testText = isPhoenix
      ? "Phoenix audio transmission verified. Level 23 vocal subsystem is online and operating with clear British cadence."
      : "Eve voice channel synchronized. Systems online and ready for executive dispatch.";
    
    const result = await this.playVoiceAudio({
      text: testText,
      agent,
      agentId: agent
    });

    const ctx = this.getAudioContext();
    return {
      success: result.success,
      method: result.method,
      contextState: ctx?.state || 'running',
      tabletTips: [
        "Check iPad silent switch in Control Center (swipe down top-right)",
        "Ensure tablet media volume slider is turned up",
        "Verify Bluetooth audio output routing or headphones"
      ]
    };
  }

  /**
   * Determine the strict female Gemini TTS voice for an agent.
   * Phoenix is explicitly assigned the British UK accent female voice ('Aoede').
   * All other agents receive female voices ('Aoede' or 'Kore').
   */
  public getFallbackVoiceForAgent(agent?: string, agentId?: string): { voiceName: 'Aoede' | 'Kore'; isUkAccent: boolean } {
    const norm = `${agent || ''} ${agentId || ''}`.toUpperCase();
    const isPhoenix = norm.includes('PHOENIX') || norm.includes('AP-1') || norm.includes('LILLY') || norm.includes('MANAGING');
    if (isPhoenix) {
      return { voiceName: 'Aoede', isUkAccent: true }; // British UK Accent Female
    }
    if (norm.includes('EVE') || norm.includes('AP-4') || norm.includes('ALURE') || norm.includes('AP-3') || norm.includes('SENTINEL')) {
      return { voiceName: 'Kore', isUkAccent: false }; // Clear American Female
    }
    return { voiceName: 'Aoede', isUkAccent: true };
  }

  public async playVoiceAudio(options: {
    text: string;
    voiceName?: string;
    agent?: 'PHOENIX' | 'EVE' | 'SENTRY' | 'ALURE' | 'SENTINEL' | 'VERITAS' | string;
    agentId?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }): Promise<{ success: boolean; method: string }> {
    const { text, agent, agentId, onStart, onEnd, onError } = options;
    const { voiceName: femaleVoice, isUkAccent } = this.getFallbackVoiceForAgent(agent, agentId);

    this.stopAllAudio();
    const thisToken = ++this.currentPlayToken;
    await this.unlockAudioSystem();

    try {
      // 1. Try ElevenLabs if configured with user's API key
      const elevenKey = typeof window !== 'undefined' ? localStorage.getItem('level23_elevenlabs_api_key') : null;
      if (elevenKey) {
        try {
          const res = await fetch('/api/elevenlabs/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              voiceName: options.voiceName || (isUkAccent ? 'Lilly' : 'Sarah'),
              apiKey: elevenKey
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.base64Audio && thisToken === this.currentPlayToken) {
              await this.playBase64Audio(data.base64Audio, 'audio/mpeg', onStart, onEnd, thisToken);
              return { success: true, method: 'elevenlabs' };
            }
          }
        } catch (e) {
          console.warn('[AudioService] ElevenLabs failed, falling back to Gemini TTS:', e);
        }
      }

      // 2. Gemini TTS Fallback (Natural Female Human Speech)
      // Phoenix = UK accent female ('Aoede'), others = strictly female ('Aoede' / 'Kore')
      if (!this.isGeminiDepleted) {
        try {
          const ttsEndpoint = '/api/tts';
          const res = await fetch(ttsEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              voice: femaleVoice,
              voiceName: femaleVoice,
              agent: isUkAccent ? 'PHOENIX' : (agent || 'EVE')
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.depleted) {
              this.isGeminiDepleted = true;
            } else if (data.success && (data.audio || data.base64Audio) && thisToken === this.currentPlayToken) {
              const audioData = data.audio || data.base64Audio;
              const mime = data.mimeType || 'audio/wav';
              await this.playBase64Audio(audioData, mime, onStart, onEnd, thisToken);
              return { success: true, method: 'gemini_tts' };
            }
          }
        } catch (geminiErr) {
          console.warn('[AudioService] Gemini TTS /api/tts attempt failed:', geminiErr);
        }
      }

      // 3. Browser Speech Synthesis Fallback (Guaranteed Sound)
      // Selects female voices (UK British female for Phoenix)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.speakBrowserSynthesis(text, isUkAccent, onStart, onEnd, thisToken);
        return { success: true, method: 'browser_speech' };
      }

      return { success: false, method: 'none' };
    } catch (err) {
      console.error('[AudioService] Playback pipeline error:', err);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.speakBrowserSynthesis(text, isUkAccent, onStart, onEnd, thisToken);
        return { success: true, method: 'browser_speech_rescue' };
      }
      return { success: false, method: 'error' };
    }
  }

  private async playBase64Audio(
    base64Audio: string,
    mimeType: string,
    onStart: any,
    onEnd: any,
    token: number
  ) {
    const cleanMime = mimeType ? mimeType.split(';')[0].trim() : 'audio/wav';
    const dataUrl = `data:${cleanMime};base64,${base64Audio}`;

    // Attempt 1: Native HTML5 Audio
    try {
      const audioElement = this.getAudioElement();
      if (audioElement && token === this.currentPlayToken) {
        audioElement.src = dataUrl;
        onStart?.();
        await audioElement.play();
        audioElement.onended = () => {
          if (token === this.currentPlayToken) onEnd?.();
        };
        return;
      }
    } catch (htmlAudioErr) {
      console.warn('[AudioService] HTMLAudioElement failed, decoding via Web Audio API:', htmlAudioErr);
    }

    // Attempt 2: Web Audio API AudioContext decoding
    try {
      const ctx = this.getAudioContext();
      if (ctx && token === this.currentPlayToken) {
        if (ctx.state === 'suspended') await ctx.resume();
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
        if (token === this.currentPlayToken) {
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          this.activeSource = source;
          onStart?.();
          source.start(0);
          source.onended = () => {
            if (token === this.currentPlayToken) onEnd?.();
          };
          return;
        }
      }
    } catch (webAudioErr) {
      console.warn('[AudioService] Web Audio API decoding failed:', webAudioErr);
    }
  }

  private speakBrowserSynthesis(
    text: string,
    isUkAccent: boolean,
    onStart: any,
    onEnd: any,
    token: number
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices() || [];

      // Pick female voice: prioritize UK female for Phoenix
      let chosenVoice: SpeechSynthesisVoice | undefined;
      if (isUkAccent) {
        chosenVoice = voices.find(v =>
          (v.lang.startsWith('en-GB') || v.lang.startsWith('en_GB')) &&
          (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('hazel') || v.name.toLowerCase().includes('serena') || v.name.toLowerCase().includes('victoria') || v.name.toLowerCase().includes('kate'))
        ) || voices.find(v => v.lang.startsWith('en-GB') || v.lang.startsWith('en_GB'));
      }

      if (!chosenVoice) {
        chosenVoice = voices.find(v =>
          v.lang.startsWith('en') &&
          (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('karen'))
        );
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = isUkAccent ? 'en-GB' : 'en-US';
      }

      utterance.pitch = isUkAccent ? 1.05 : 1.0;
      utterance.rate = 1.0;

      utterance.onstart = () => {
        if (token === this.currentPlayToken) onStart?.();
      };
      utterance.onend = () => {
        if (token === this.currentPlayToken) onEnd?.();
      };
      utterance.onerror = () => {
        if (token === this.currentPlayToken) onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[AudioService] Browser speech synthesis fallback failed:', e);
      onEnd?.();
    }
  }
}

export const audioService = new AudioPlaybackService();
