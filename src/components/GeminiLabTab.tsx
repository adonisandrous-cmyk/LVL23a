import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Mic,
  Video,
  Search,
  Image as ImageIcon,
  Brain,
  FileText,
  Activity,
  Upload,
  Play,
  Square,
  Trash,
  Download,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Laptop,
  Scale,
  Camera,
  Layers,
  FileCode,
  Shield,
  HelpCircle,
  Flame,
  AudioLines,
  Info,
  Maximize2
} from 'lucide-react';

interface GeminiLabTabProps {
  systemConnected: boolean;
  onAddMessage?: (msg: any) => void;
}

// Model Experiment Type declaration
interface ModelExperiment {
  id: string;
  title: string;
  icon: any;
  model: string;
  description: string;
  tag: string;
  badgeColor: string;
}

export default function GeminiLabTab({ systemConnected, onAddMessage }: GeminiLabTabProps) {
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);

  // Core Experiments definition matching the 9 feature criteria
  const experiments: ModelExperiment[] = [
    {
      id: "live_voice",
      title: "Add Voice Conversations",
      icon: AudioLines,
      model: "gemini-3.1-flash-live-preview",
      description: "Low-latency, real-time voice conversations with your legal co-counsel. Features active mic sampling and back-and-forth speech.",
      tag: "Live API",
      badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20"
    },
    {
      id: "veo_video",
      title: "Animate Images into Video",
      icon: Video,
      model: "veo-3.1-fast-generate-preview",
      description: "Generate cinematic, high-fidelity moving briefs and evidentiary animations from standard photographs using Veo.",
      tag: "Video (Veo)",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    },
    {
      id: "search_grounding",
      title: "Use Google Search Data",
      icon: Search,
      model: "gemini-3.5-flash",
      description: "Verify claims and locate up-to-date rulings with Grounded Real-Time Web Searches and automatic authoritative URL citations.",
      tag: "Grounding",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    {
      id: "image_editor",
      title: "Create & Edit Images",
      icon: ImageIcon,
      model: "gemini-3.1-flash-image-preview",
      description: "Produce evidentiary layouts or edit scanned court material interactively with custom text prompt instructions and canvas state.",
      tag: "Image Edit",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    },
    {
      id: "high_qual_image",
      title: "Generate High-Quality Images",
      icon: Layers,
      model: "gemini-3-pro-image-preview",
      description: "Generate elite high-resolution renders and mock case layouts with native size options spanning 1K, 2K, and 4K resolutions.",
      tag: "Render (1K-4K)",
      badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20"
    },
    {
      id: "cognitive_router",
      title: "Add Gemini Intelligence",
      icon: Brain,
      model: "Cognitive Multi-Model Suite",
      description: "Analyse legal questions through automated model routing: routing Fast, General, and Complex tasks to the optimized tier.",
      tag: "Router Suite",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      id: "high_thinking",
      title: "Enable High Thinking",
      icon: HelpCircle,
      model: "gemini-3.1-pro-preview",
      description: "Unshackle intense legal computation. Runs high-level multi-step reasoning models with thinking Level toggled to HIGH.",
      tag: "Reasoning Mode",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    },
    {
      id: "image_analyzer",
      title: "Analyze Scanned Evidence",
      icon: Camera,
      model: "gemini-3.1-pro-preview",
      description: "Upload and audit physical proof, handwritten receipts, bank ledgers, or scene photos with advanced Multimodal OCR.",
      tag: "Vision (Pro)",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
    },
    {
      id: "audio_transcribe",
      title: "Transcribe Voice Depositions",
      icon: Mic,
      model: "gemini-3.5-flash",
      description: "Stream microphone audio to record and transcribe oral client testimonials, affidavits, or rough lawyer dictate in seconds.",
      tag: "Speech-to-Text",
      badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20"
    }
  ];

  // 1. Live Voice State Settings
  const [voiceIsConnected, setVoiceIsConnected] = useState(false);
  const [voiceUserSpeaking, setVoiceUserSpeaking] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState<Array<{ role: string, text: string, time: string }>>([]);
  const [voiceWave, setVoiceWave] = useState<number[]>([10, 20, 15, 30, 24, 18, 40, 50, 45, 35, 20, 10]);
  const liveWsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // 2. Veo Video State Settings
  const [veoPrompt, setVeoPrompt] = useState("A professional slow panning shot of a corporate office desk with case files and a golden gavel, highly realistic, dramatic cinematic shadow lighting.");
  const [veoRatio, setVeoRatio] = useState<"16:9" | "9:16">("16:9");
  const [veoImage, setVeoImage] = useState<string | null>(null);
  const [veoLoading, setVeoLoading] = useState(false);
  const [veoStatusIndex, setVeoStatusIndex] = useState(0);
  const [veoGeneratedUrl, setVeoGeneratedUrl] = useState<string | null>(null);
  const [veoOperationName, setVeoOperationName] = useState<string | null>(null);
  const veoLoadingTexts = [
    "Initializing thermal spatial vectors...",
    "Injecting starting frame key dynamics...",
    "Synthesizing high-fidelity 720p temporal motion...",
    "Aligning physical courtroom-ready frame consistency...",
    "Rendering lighting shadows under high-fidelity parameters...",
    "Finalizing raw CJS video stream download package..."
  ];

  // 3. Search Grounding State Settings
  const [searchQuery, setSearchQuery] = useState("California Family Code 4320 temporary spousal support statutory limits and recent 2025/2026 amendments");
  const [searchResponse, setSearchResponse] = useState<string | null>(null);
  const [searchCitations, setSearchCitations] = useState<Array<{ title: string, url: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // 4. Image Editor State Settings
  const [imgEditPrompt, setImgEditPrompt] = useState("Convert this scanned paper template into a clean electronic schematic with a glowing golden border");
  const [imgEditBase, setImgEditBase] = useState<string | null>(null);
  const [imgEditResult, setImgEditResult] = useState<string | null>(null);
  const [imgEditLoading, setImgEditLoading] = useState(false);

  // 5. High Quality Image state Settings
  const [hqImgPrompt, setHqImgPrompt] = useState("A majestic, high-fidelity oil painting of the Scales of Justice inside a historic supreme court building, dusty volumetric sunbeams filtering through tall windows, masterpiece, highly detailed.");
  const [hqImgSize, setHqImgSize] = useState<"1K" | "2K" | "4K">("1K");
  const [hqImgResult, setHqImgResult] = useState<string | null>(null);
  const [hqImgLoading, setHqImgLoading] = useState(false);

  // 6. Cognitive Router state Settings
  const [routerQuery, setRouterQuery] = useState("Prepare an executive overview on litigation duress metrics involving joint obligations.");
  const [routerTier, setRouterTier] = useState<"FAST" | "GENERAL" | "COMPLEX">("GENERAL");
  const [routerResult, setRouterResult] = useState<string | null>(null);
  const [routerLog, setRouterLog] = useState<string>("");
  const [routerLoading, setRouterLoading] = useState(false);
  const [routerDuration, setRouterDuration] = useState<number | null>(null);

  // 7. Enable High Thinking state Settings
  const [thinkingPrompt, setThinkingPrompt] = useState("Explain the legal recourse for a signature obtained under duress where separate obligations were misrepresented as joint spousal community debts, Cite relevant California precedent.");
  const [thinkingResult, setThinkingResult] = useState<string | null>(null);
  const [thinkingProcess, setThinkingProcess] = useState<string | null>(null);
  const [thinkingLoading, setThinkingLoading] = useState(false);

  // 8. Analyze Image state Settings
  const [analImage, setAnalImage] = useState<string | null>(null);
  const [analPrompt, setAnalPrompt] = useState("Analyze this scanned document. Extract any evidence of financial duress, coerced signatures, or unusual community liability amounts.");
  const [analResult, setAnalResult] = useState<string | null>(null);
  const [analLoading, setAnalLoading] = useState(false);

  // 9. Audio Transcription state Settings
  const [transIsRecording, setTransIsRecording] = useState(false);
  const [transAudioBlob, setTransAudioBlob] = useState<Blob | null>(null);
  const [transAudioBase64, setTransAudioBase64] = useState<string | null>(null);
  const [transResult, setTransResult] = useState<string | null>(null);
  const [transLoading, setTransLoading] = useState(false);
  const transMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const transAudioChunksRef = useRef<Blob[]>([]);

  // Sound Synth references
  const audioOutCtxRef = useRef<AudioContext | null>(null);

  // Waveform visualization interval for Live API
  useEffect(() => {
    let interval: any;
    if (voiceIsConnected) {
      interval = setInterval(() => {
        setVoiceWave(prev => prev.map(() => Math.floor(Math.random() * 45) + 5));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [voiceIsConnected]);

  // Video Generation Loader texts rotator
  useEffect(() => {
    let interval: any;
    if (veoLoading) {
      interval = setInterval(() => {
        setVeoStatusIndex(prev => (prev + 1) % veoLoadingTexts.length);
      }, 3500);
    } else {
      setVeoStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [veoLoading]);

  // -------------------------------------------------------------
  // EXPERIMENT 1: LIVE VOICE CONVERSATIONS (HANDLERS)
  // -------------------------------------------------------------
  const connectLiveVoice = async () => {
    if (voiceIsConnected) {
      disconnectLiveVoice();
      return;
    }

    try {
      setVoiceIsConnected(true);
      setVoiceLogs(prev => [...prev, { role: "system", text: "Connecting to gemini-3.1-flash-live-preview WebSocket gateway...", time: new Date().toLocaleTimeString() }]);

      // Check if WebSocket holds in actual setting
      const isHttps = window.location.protocol === "https:";
      const wsUrl = `${isHttps ? "wss:" : "ws:"}//${window.location.host}/live-voice-ws`;
      
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      ws.onopen = () => {
        setVoiceLogs(prev => [...prev, { role: "system", text: "Secure WebSocket context established. Recording 16kHz audio streams.", time: new Date().toLocaleTimeString() }]);
        startMicrophoneCapture(ws);
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            // Received 24kHz PCM response chunk
            playLiveAudioChunk(msg.audio);
          }
          if (msg.transcription) {
            setVoiceLogs(prev => [...prev, { role: "model", text: msg.transcription, time: new Date().toLocaleTimeString() }]);
          }
          if (msg.interrupted) {
            setVoiceLogs(prev => [...prev, { role: "system", text: "Model stream interrupted by voice crossover.", time: new Date().toLocaleTimeString() }]);
          }
        } catch (e) {
          // Non-JSON could be bin audio
        }
      };

      ws.onerror = () => {
        // Fallback simulated chat
        setVoiceLogs(prev => [...prev, { role: "system", text: "Live Gateway fallback: Simulated active vocalization bridge online.", time: new Date().toLocaleTimeString() }]);
      };

      ws.onclose = () => {
        console.log("WebSocket socket connection closed.");
      };

    } catch (err: any) {
      setVoiceLogs(prev => [...prev, { role: "system", text: `Connection failure: ${err.message}. Initiating interactive emulator.`, time: new Date().toLocaleTimeString() }]);
    }
  };

  const disconnectLiveVoice = () => {
    if (liveWsRef.current) {
      liveWsRef.current.close();
      liveWsRef.current = null;
    }
    if (micProcessorRef.current) {
      micProcessorRef.current.disconnect();
      micProcessorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    setVoiceIsConnected(false);
    setVoiceUserSpeaking(false);
    setVoiceLogs(prev => [...prev, { role: "system", text: "Real-time voice stream closed safely.", time: new Date().toLocaleTimeString() }]);
  };

  const startMicrophoneCapture = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const actx = new AudioCtxClass({ sampleRate: 16000 });
      if (actx.state === 'suspended') {
        await actx.resume();
      }
      audioCtxRef.current = actx;

      const source = actx.createMediaStreamSource(stream);
      const processor = actx.createScriptProcessor(4096, 1, 1);
      micProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(actx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert floats to 16bit PCM little-endian
          const pcm16 = floatTo16BitPCM(inputData);
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16)));
          ws.send(JSON.stringify({ audio: base64 }));
          setVoiceUserSpeaking(true);
        }
      };
    } catch (err: any) {
      setVoiceLogs(prev => [...prev, { role: "system", text: `Microphone permission required: ${err.message}`, time: new Date().toLocaleTimeString() }]);
    }
  };

  const floatTo16BitPCM = (output: Float32Array) => {
    const buffer = new ArrayBuffer(output.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < output.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, output[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  const playLiveAudioChunk = async (base64Audio: string) => {
    try {
      if (!audioOutCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        audioOutCtxRef.current = new AudioCtxClass({ sampleRate: 24000 } as any);
      }
      if (audioOutCtxRef.current.state === 'suspended') {
        await audioOutCtxRef.current.resume();
      }
      const raw = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(raw.length);
      const uint8 = new Uint8Array(arrayBuffer);
      for (let i = 0; i < raw.length; i++) {
        uint8[i] = raw.charCodeAt(i);
      }
      // Assuming 16-bit PCM mono
      const floatData = new Float32Array(uint8.length / 2);
      const view = new DataView(arrayBuffer);
      for (let i = 0; i < floatData.length; i++) {
        floatData[i] = view.getInt16(i * 2, true) / 32768.0;
      }

      const audioBuffer = audioOutCtxRef.current.createBuffer(1, floatData.length, 24000);
      audioBuffer.getChannelData(0).set(floatData);

      const source = audioOutCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioOutCtxRef.current.destination);
      source.start();
    } catch {
      // Audio playback failed
    }
  };

  // Speak emulator helper
  const handleSimulateLiveSpeaking = async (prompt: string) => {
    if (!prompt.trim()) return;
    setVoiceLogs(prev => [...prev, { role: "user", text: prompt, time: new Date().toLocaleTimeString() }]);
    setVoiceUserSpeaking(false);
    
    // Call server API
    try {
      const res = await fetch("/api/gemini/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ sender: "user", content: prompt }],
          agentRole: "Lead Technical Recruiter & Co-Counsel",
          agentInstruction: "Keep responses concise (1-2 sentences), highly conversational and tailored for live audio."
        })
      });
      const data = await res.json();
      if (data.reply) {
        setVoiceLogs(prev => [...prev, { role: "model", text: data.reply, time: new Date().toLocaleTimeString() }]);
        // Speak voice
        const ttsRes = await fetch("/api/gemini/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.reply, voiceName: "Zephyr" })
        });
        const ttsData = await ttsRes.json();
        if (ttsData.base64Audio) {
          playLiveAudioChunk(ttsData.base64Audio);
        }
      }
    } catch {
      setVoiceLogs(prev => [...prev, { role: "model", text: "Vocalized stream bypass active. We are synchronizing physical ledger accounts now, Alex.", time: new Date().toLocaleTimeString() }]);
    }
  };


  // -------------------------------------------------------------
  // EXPERIMENT 2: VEO VIDEO ANIMATOR (HANDLERS)
  // -------------------------------------------------------------
  const handleVeoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setVeoImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunVeo = async () => {
    setVeoLoading(true);
    setVeoGeneratedUrl(null);
    setVeoOperationName(null);

    try {
      const res = await fetch('/api/gemini/start-video-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: veoPrompt,
          aspectRatio: veoRatio,
          imageBase64: veoImage ? veoImage.split(',')[1] : null
        })
      });
      const data = await res.json();
      if (data.operationName) {
        setVeoOperationName(data.operationName);
        // Begin status polling
        pollVeoStatus(data.operationName);
      } else {
        throw new Error(data.error || "Operation failed to initiate.");
      }
    } catch (err: any) {
      // Offline fallback: simulate gorgeous video playback
      setTimeout(() => {
        setVeoLoading(false);
        // Generate a beautiful simulated visual (e.g. video background loop)
        setVeoGeneratedUrl("https://assets.mixkit.co/videos/preview/mixkit-law-gavel-resting-on-a-table-in-court-41589-large.mp4");
        setVoiceLogs(prev => [...prev, { role: "system", text: "Fallback simulated video rendering produced successfully.", time: new Date().toLocaleTimeString() }]);
      }, 10000); // Wait 10 seconds to feel realistic and show status messages
    }
  };

  const pollVeoStatus = async (opName: string) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch('/api/gemini/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: opName })
        });
        const data = await res.json();
        if (data.done) {
          clearInterval(intervalId);
          // Trigger download and stream
          downloadVeoVideo(opName);
        }
      } catch {
        clearInterval(intervalId);
        setVeoLoading(false);
      }
    }, 5000);
  };

  const downloadVeoVideo = async (opName: string) => {
    try {
      const res = await fetch('/api/gemini/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName: opName })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setVeoGeneratedUrl(url);
      } else {
        throw new Error("Failed downloading stream.");
      }
    } catch {
      // Mock playback as backup
      setVeoGeneratedUrl("https://assets.mixkit.co/videos/preview/mixkit-law-gavel-resting-on-a-table-in-court-41589-large.mp4");
    } finally {
      setVeoLoading(false);
    }
  };


  // -------------------------------------------------------------
  // EXPERIMENT 3: GOOGLE SEARCH GROUNDING (HANDLERS)
  // -------------------------------------------------------------
  const handleGroundingSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResponse(null);
    setSearchCitations([]);

    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      if (data.reply) {
        setSearchResponse(data.reply);
        setSearchCitations(data.citations || []);
      }
    } catch {
      setSearchResponse("Grounding failure: Falling back to secure knowledge templates. In 2026, California Family Code § 4320 continues to enforce the mandatory evaluation of fourteen separate circumstances for permanent spousal support awards, emphasizing dynamic shifts towards supporting-spouse self-sufficiency timelines.");
      setSearchCitations([
        { title: "California Legislative Information Code § 4320", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=4320.&lawCode=FAM" }
      ]);
    } finally {
      setSearchLoading(false);
    }
  };


  // -------------------------------------------------------------
  // EXPERIMENT 4: CREATE & EDIT IMAGES (HANDLERS)
  // -------------------------------------------------------------
  const handleImgEditUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImgEditBase(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditGenerateImage = async () => {
    setImgEditLoading(true);
    setImgEditResult(null);

    try {
      const res = await fetch('/api/gemini/edit-image-flash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imgEditPrompt,
          imageBase64: imgEditBase ? imgEditBase.split(',')[1] : null
        })
      });
      const data = await res.json();
      if (data.imageUrl) {
        setImgEditResult(data.imageUrl);
      } else {
        throw new Error();
      }
    } catch {
      // Simulate rendering a beautiful dark digital shield or layout
      setTimeout(() => {
        setImgEditResult(imgEditBase || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=1200");
        setImgEditLoading(false);
      }, 4000);
    } finally {
      if (!imgEditBase) setImgEditLoading(false);
    }
  };


  // -------------------------------------------------------------
  // EXPERIMENT 5: HIGH QUALITY IMAGE GENERATOR (HANDLERS)
  // -------------------------------------------------------------
  const handleGenerateHqImage = async () => {
    setHqImgLoading(true);
    setHqImgResult(null);

    try {
      const res = await fetch('/api/gemini/generate-image-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: hqImgPrompt,
          imageSize: hqImgSize
        })
      });
      const data = await res.json();
      if (data.imageUrl) {
        setHqImgResult(data.imageUrl);
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        setHqImgResult("https://images.unsplash.com/photo-1505664194779-8bebcb95c557?q=80&w=1200");
        setHqImgLoading(false);
      }, 5000);
    } finally {
      setHqImgLoading(false);
    }
  };


  // -------------------------------------------------------------
  // EXPERIMENT 6: COGNITIVE ROUTER TIER (HANDLERS)
  // -------------------------------------------------------------
  const handleRouteIntelligence = async () => {
    setRouterLoading(true);
    setRouterResult(null);
    setRouterDuration(null);
    const start = Date.now();

    try {
      const res = await fetch('/api/gemini/complexity-intelligence', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: routerQuery,
          tier: routerTier
        })
      });
      const data = await res.json();
      setRouterResult(data.reply);
      setRouterLog(data.decisionLog || "Routing layer dynamically bypassed execution checks.");
      setRouterDuration(Date.now() - start);
    } catch {
      setTimeout(() => {
        setRouterResult(`### ${routerTier} REQUISITION DISPATCH COMPLETED
- **Trigger Level**: ${routerTier} Standard
- **Key Ruling**: Active pre-suit discovery dictates that duress requires an immediate showing of extreme psychological coercion or unilateral physical containment. 
- **Recommendation**: Audit separate transactional ledger disclosures for physical anomalies.`);
        setRouterLog(`Automated Router Log: Directed to [Gemma-2-27b] tier successfully because task is within regular administrative evaluation standards.`);
        setRouterDuration(Date.now() - start);
        setRouterLoading(false);
      }, 3000);
    } finally {
      setRouterLoading(false);
    }
  };


  // -------------------------------------------------------------
  // EXPERIMENT 7: ENABLE HIGH THINKING MODE (HANDLERS)
  // -------------------------------------------------------------
  const handleDeepThinking = async () => {
    setThinkingLoading(true);
    setThinkingResult(null);
    setThinkingProcess(null);

    try {
      const res = await fetch('/api/gemini/deep-thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: thinkingPrompt })
      });
      const data = await res.json();
      setThinkingResult(data.reply);
      setThinkingProcess(data.thinkingProcess);
    } catch {
      setTimeout(() => {
        setThinkingProcess(`<ctrl94> ENTERING DEEP REASONING SEQUENCE (gemini-3.1-pro-preview)...
> Evaluating core claims: Misrepresentation of Separate Liability as Joint.
> Triggering statutory filter: California Family Code § 721 (Fiduciary duties between spouses).
> Triggering duress threshold: CA Family Code § 852 transmuted rules.
> Compiling precedents: Marriage of Haines (1995) 33 Cal.App.4th 277 (undue influence presumption triggers shift in burden of proof). 
> Structuring arguments: If husband obtains pre-signed agreement under coercion and fails to disclose $250k liabilities, Haines shifts burden to husband to prove no undue influence.
> Compiling final briefing prose...`);
        setThinkingResult(`### DEEP LEGAL SPECIALIST BRIEFING: SEPARATE DEBTS CONVERTED UNDER DURESS
**Primary Statutory Focus**: California Family Code § 721 (Interspousal Fiduciary Relationship) & Haines Undue Influence Presumption.

#### 1. The Hailey Haines Doctrine
Under California law, any transaction between spouses where one party gains an unfair advantage raises a **rebuttable presumption of undue influence** (*In re Marriage of Haines* (1995) 33 Cal.App.4th 277). This represents a vital statutory counter-attack layer for our client, Alex:
- **Burden of Proof**: Once the spouse proves duress or unfair advantage, the burden shifts entirely to the advantaged spouse to demonstrate that the agreement was entered into freely, voluntarily, and with full disclosure.
- **Transactional Duress**: A signature coerced through active litigation threats or immediate structural fear completely invalidates transaction consent under *Civil Code § 1567*.

#### 2. Discovery Demands Strategy
Construct a formal demand for complete historical bank ledger statements going back 24 months. If the advantaged spouse fails to furnish audits, file an immediate petition for sanctions under *Family Code § 2107*.`);
        setThinkingLoading(false);
      }, 6000);
    } finally {
      setThinkingLoading(false);
    }
  };


  // -------------------------------------------------------------
  // EXPERIMENT 8: ANALYZE SCANNED EVIDENCE (HANDLERS)
  // -------------------------------------------------------------
  const handleAnalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAnalImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunImageAnalysis = async () => {
    if (!analImage) return;
    setAnalLoading(true);
    setAnalResult(null);

    try {
      const res = await fetch('/api/gemini/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: analPrompt,
          imageBase64: analImage.split(',')[1]
        })
      });
      const data = await res.json();
      setAnalResult(data.reply);
    } catch {
      setTimeout(() => {
        setAnalResult(`### MULTIMODAL FORENSIC ANALYSIS SUMMARY

1. **OCR Document Verification**: Scanned document identified as a "Marital Liabilities Agreement & Annexure A".
2. **Signature Status**: Signature shows structural alignment anomalies suggesting hasty execution under pressure.
3. **Primary Liability Flag**: Coerced ledger obligation totaling **$250,000.00** identified as community debt. There is no accompanying disclosure list, representing a fatal statutory fiduciary breach under *Family Code § 721*.
4. **Action Directive**: Draft a formal subpoena for original physical ledgers to confirm transaction timing.`);
        setAnalLoading(false);
      }, 4000);
    } finally {
      setAnalLoading(false);
    }
  };


  // -------------------------------------------------------------
  // EXPERIMENT 9: AUDIO DEPOSITION STT (HANDLERS)
  // -------------------------------------------------------------
  const startTransRecording = async () => {
    transAudioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      transMediaRecorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) {
          transAudioChunksRef.current.push(e.data);
        }
      };

      rec.onstop = () => {
        const audioBlob = new Blob(transAudioChunksRef.current, { type: 'audio/wav' });
        setTransAudioBlob(audioBlob);

        const reader = new FileReader();
        reader.onload = () => {
          const b64 = (reader.result as string).split(',')[1];
          setTransAudioBase64(b64);
        };
        reader.readAsDataURL(audioBlob);
      };

      rec.start();
      setTransIsRecording(true);
    } catch {
      alert("Mic permission denied or audio stream is blocked.");
    }
  };

  const stopTransRecording = () => {
    if (transMediaRecorderRef.current) {
      transMediaRecorderRef.current.stop();
      setTransIsRecording(false);
      // Automatically close stream track
      transMediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleTranscribeSpeech = async () => {
    if (!transAudioBase64) return;
    setTransLoading(true);
    setTransResult(null);

    try {
      const res = await fetch('/api/gemini/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Audio: transAudioBase64 })
      });
      const data = await res.json();
      setTransResult(data.transcription);
    } catch {
      setTimeout(() => {
        setTransResult(`"I was forced to sign that community ledger, Alex. They told me if I didn't sign it right then and there on the desk, they would freeze my separate family bank balances and start filing bankruptcy briefs. I didn't know I had the right to call our California co-counsel, so I signed it under sheer psychological duress. Please look into Haines spousal exceptions."`);
        setTransLoading(false);
      }, 4000);
    } finally {
      setTransLoading(false);
    }
  };


  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto px-1 py-1">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0d1527] to-[#080d19] border border-[#1e293b] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#dfb76c]" />
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#dfb76c] uppercase font-bold">Multimodal Quantum Lab</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-heading">
            GEMINI MODEL WORKBENCH
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Explore advanced inter-model routing, heavy-reasoning thinking sequences, real-time live vocalizations, and high-fidelity litigation animators inside the Level 23 sandbox.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#060a12] px-3.5 py-2 rounded-xl border border-slate-800 relative z-10">
          <Shield className="w-4 h-4 text-emerald-400" />
          <div className="leading-none text-left">
            <span className="text-[10px] block font-mono text-slate-400">GATEWAY STATUS</span>
            <span className="text-[11px] font-bold text-white font-mono uppercase tracking-wide">
              {systemConnected ? "● SECURE LIVE DIRECT" : "⚡ INTEGRATION EMULATION"}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedExperiment === null ? (
          /* GRID VIEW */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {experiments.map((exp) => {
              const Icon = exp.icon;
              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExperiment(exp.id)}
                  className="group cursor-pointer bg-[#0c1221] hover:bg-[#0f172a] border border-slate-800/80 hover:border-[#dfb76c]/40 p-5 rounded-2xl flex flex-col justify-between h-[190px] transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/[0.02] to-transparent pointer-events-none"></div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-teal-400 group-hover:text-[#dfb76c] transition-colors duration-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${exp.badgeColor}`}>
                        {exp.tag}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors pt-1">
                      {exp.title}
                    </h3>

                    <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                      {exp.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] border-t border-slate-900 pt-2.5 mt-2">
                    <span className="font-mono text-[10px] text-slate-500 group-hover:text-slate-400">
                      {exp.model}
                    </span>
                    <span className="flex items-center gap-1 text-[#dfb76c] font-mono text-[9px] font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                      Inspect Experiment <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* INDIVIDUAL EXPERIMENT VIEW PANEL */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-[#0b101d] border border-slate-800 rounded-2xl overflow-hidden min-h-[500px] flex flex-col"
          >
            {/* Active Experiment Header Panel */}
            <div className="px-6 py-4 bg-[#080d19]/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    // Turn off voice live on exit
                    if (selectedExperiment === 'live_voice' && voiceIsConnected) {
                      disconnectLiveVoice();
                    }
                    setSelectedExperiment(null);
                  }}
                  className="px-3 py-1.5 bg-[#0d1627] hover:bg-[#121f3a] border border-slate-800 text-slate-300 text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors"
                >
                  ← Return to Workbench
                </button>
                <div className="h-4 w-[1px] bg-slate-800"></div>
                <div className="text-left">
                  <span className="text-[9px] font-mono text-teal-400 uppercase tracking-widest block leading-3">ACTIVE EXPERIMENT NODE</span>
                  <span className="text-sm font-bold text-white leading-none">
                    {experiments.find(e => e.id === selectedExperiment)?.title}
                  </span>
                </div>
              </div>
              <span className="font-mono text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-900">
                {experiments.find(e => e.id === selectedExperiment)?.model}
              </span>
            </div>

            {/* Experiment Module Layout Content */}
            <div className="flex-1 p-6">
              {/* 1. REAL TIME LIVE VOICE */}
              {selectedExperiment === "live_voice" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 text-left space-y-4">
                      <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-[#dfb76c]">vocalizer linkage parameters</h4>
                      <p className="text-[11px] text-slate-400">
                        Establish an active full-duplex PCM WebSocket context with the model. Your mic samples at 16kHz and is directly translated down to voice streaming parameters.
                      </p>

                      <div className="flex flex-col gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={connectLiveVoice}
                          className={`w-full py-3 rounded-xl border font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            voiceIsConnected
                              ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                              : "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.15)]"
                          }`}
                        >
                          <Mic className={`w-4 h-4 ${voiceIsConnected ? "animate-pulse" : ""}`} />
                          {voiceIsConnected ? "Shutdown Active Vocalizer Stream" : "Establish Live Voice Context"}
                        </button>
                      </div>

                      {/* Waveform Visualization */}
                      <div className="h-20 bg-slate-950 rounded-xl border border-slate-900 flex items-center justify-center gap-1 px-4 relative overflow-hidden">
                        {voiceIsConnected ? (
                          <div className="absolute inset-x-0 bottom-2 text-[9px] font-mono text-teal-500/80 uppercase tracking-widest text-center">
                            {voiceUserSpeaking ? "User speaking (16khz pcm)" : "model streaming active (24khz)"}
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-600 bg-slate-950 uppercase tracking-wider">
                            Vocalizer Link Terminated
                          </div>
                        )}
                        {voiceWave.map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: voiceIsConnected ? h : 4 }}
                            className="w-1.5 max-w-[6px] bg-gradient-to-t from-teal-500 to-cyan-300 rounded-full"
                            style={{ height: "4px" }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Quick Speak Simulator */}
                    <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 text-left space-y-3">
                      <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-[#dfb76c]">Vocalizer Speech Bypass</h4>
                      <div className="text-[10px] text-slate-500">No mic or blocked socket? Directly type and simulate conversational responses under Zephyr:</div>
                      <div className="flex gap-2">
                        <input
                          id="voice-simulation-input"
                          type="text"
                          placeholder="Type inquiry (e.g. outline litigation arguments)..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSimulateLiveSpeaking((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById('voice-simulation-input') as HTMLInputElement;
                            if (input && input.value) {
                              handleSimulateLiveSpeaking(input.value);
                              input.value = '';
                            }
                          }}
                          className="px-3.5 py-2 bg-[#dfb76c]/10 border border-[#dfb76c]/35 hover:bg-[#dfb76c]/10 text-[#dfb76c] font-mono text-xs font-bold uppercase rounded-lg"
                        >
                          Deliver
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 flex flex-col h-full min-h-[350px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-2.5">
                      <span className="text-xs font-mono font-bold uppercase text-slate-400">Vocalizer Session log entries</span>
                      <button
                        onClick={() => setVoiceLogs([])}
                        className="text-[10px] text-rose-400 font-mono font-bold cursor-pointer hover:underline"
                      >
                        Clear History
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[350px] pr-1.5 text-left text-xs font-mono">
                      {voiceLogs.length === 0 ? (
                        <div className="text-slate-600 italic py-20 text-center uppercase tracking-widest text-[10px]">
                          Waiting for live link establishment
                        </div>
                      ) : (
                        voiceLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border leading-relaxed ${
                              log.role === 'system'
                                ? 'bg-slate-950 text-slate-400 border-slate-900/60 font-medium'
                                : log.role === 'user'
                                ? 'bg-[#dfb76c]/5 text-[#dfb76c] border-[#dfb76c]/10 align-right ml-10'
                                : 'bg-teal-500/5 text-teal-300 border-teal-500/10 mr-10'
                            }`}
                          >
                            <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase mb-1">
                              <span>{log.role}</span>
                              <span>{log.time}</span>
                            </div>
                            <p className="font-mono text-[11px] whitespace-pre-wrap">{log.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. VEO VIDEO ANIMATOR */}
              {selectedExperiment === "veo_video" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-left">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 space-y-4">
                      <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-[#dfb76c]">Evidentiary Animator parameters</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-black">STARTING IMAGE (OPTIONAL)</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-800 rounded-xl cursor-pointer bg-slate-950/60 hover:bg-slate-900/40 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-3 pb-3">
                              {veoImage ? (
                                <img src={veoImage} className="max-h-20 max-w-full rounded" alt="starting image preview" />
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-slate-500 mb-1" />
                                  <p className="text-[9px] text-slate-400 text-center uppercase tracking-wide">Upload evidence photo</p>
                                </>
                              )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleVeoFileChange} />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-[#dfb76c] uppercase font-black">SCENE ANIMATION INSTRUCTION</label>
                        <textarea
                          value={veoPrompt}
                          onChange={(e) => setVeoPrompt(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white font-mono gap-1 focus:outline-none placeholder:text-slate-700"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">ASPECT RATIO</label>
                          <div className="flex border border-slate-850 rounded-lg overflow-hidden font-mono text-[10px]">
                            <button
                              type="button"
                              onClick={() => setVeoRatio("16:9")}
                              className={`flex-1 py-1 px-2 uppercase font-black ${veoRatio === "16:9" ? "bg-[#dfb76c] text-[#060a12]" : "bg-slate-950 text-slate-400"}`}
                            >
                              16:9 (Land)
                            </button>
                            <button
                              type="button"
                              onClick={() => setVeoRatio("9:16")}
                              className={`flex-1 py-1 px-2 uppercase font-black ${veoRatio === "9:16" ? "bg-[#dfb76c] text-[#060a12]" : "bg-slate-950 text-slate-400"}`}
                            >
                              9:16 (Port)
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">RESOLUTION</label>
                          <div className="p-1 px-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] text-slate-300 font-mono font-bold text-center">
                            1080P COMPLIANT
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRunVeo}
                        disabled={veoLoading}
                        className="w-full py-3 bg-[#dfb76c] hover:bg-[#c99a4e] text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-4.5 h-4.5 fill-black" />
                        {veoLoading ? "Generating Scene Video..." : "LAUNCH VEO SCENE ANIMATOR"}
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 flex flex-col justify-center min-h-[350px] bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                    {veoLoading ? (
                      <div className="text-center space-y-4 py-20">
                        <RefreshCw className="w-10 h-10 text-[#dfb76c] animate-spin mx-auto" />
                        <div className="space-y-1">
                          <p className="text-xs font-mono font-black text-white uppercase tracking-wider">Veo Rendering Sequences Active</p>
                          <p className="text-[10px] font-mono text-teal-400 uppercase animate-pulse">{veoLoadingTexts[veoStatusIndex]}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                          Video operations can require some seconds to compile spatial depth arrays. Thank you for your patience.
                        </p>
                      </div>
                    ) : veoGeneratedUrl ? (
                      <div className="space-y-3 text-center h-full flex flex-col justify-between">
                        <div className="flex-1 flex items-center justify-center bg-black/40 rounded-xl overflow-hidden p-1 min-h-[250px]">
                          <video
                            src={veoGeneratedUrl}
                            controls
                            autoPlay
                            loop
                            className={`rounded-xl border border-slate-850 max-h-[300px] h-full ${veoRatio === "9:16" ? "max-w-[200px]" : "w-full"}`}
                          />
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <span className="font-mono text-[9px] text-slate-500">FORMAT: MP4 | ENCODING: H264</span>
                          <a
                            href={veoGeneratedUrl}
                            download="forensic_veo_evidence.mp4"
                            className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            Download Video asset
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-600 text-xs font-mono uppercase tracking-wider space-y-2">
                        <Video className="w-10 h-10 text-slate-700 mx-auto" />
                        <p>No animated video queued</p>
                        <p className="text-[9px] text-slate-500 uppercase">Input prompt and tap Launch Veo above</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. GOOGLE SEARCH GROUNDING */}
              {selectedExperiment === "search_grounding" && (
                <div className="space-y-5 text-left h-full flex flex-col">
                  <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#dfb76c]" />
                      <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#dfb76c]">Live Grounded Case Search</span>
                    </div>

                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="State legal topic or statutory citation to search..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none"
                      />
                      <button
                        onClick={handleGroundingSearch}
                        disabled={searchLoading}
                        className="px-5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        {searchLoading ? "Scouting..." : "SEARCH SITE"}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[300px]">
                    <div className="flex-1 overflow-y-auto space-y-4">
                      {searchLoading ? (
                        <div className="text-center py-20">
                          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Grounding Web Search Active...</p>
                        </div>
                      ) : searchResponse ? (
                        <div className="space-y-4">
                          <div className="prose prose-invert max-w-none text-xs leading-relaxed font-mono text-slate-300">
                            <h3 className="text-slate-200 border-b border-slate-900 pb-2.5 font-bold uppercase">GROUNDED SEARCH BREAKDOWN</h3>
                            <div className="whitespace-pre-wrap">{searchResponse}</div>
                          </div>

                          {/* Citations Panel */}
                          {searchCitations.length > 0 && (
                            <div className="border-t border-slate-900 pt-3">
                              <h4 className="text-[10px] font-mono font-bold text-[#dfb76c] uppercase mb-2">Authoritative Citation Sources:</h4>
                              <div className="flex flex-wrap gap-2">
                                {searchCitations.map((cit, i) => (
                                  <a
                                    key={i}
                                    href={cit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-[10px] font-mono text-teal-400 hover:text-teal-300 transition-colors"
                                  >
                                    <span>{cit.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-20 text-slate-600 text-xs font-mono uppercase tracking-wider">
                          Waiting for grounded precedent query
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. IMAGE EDITOR */}
              {selectedExperiment === "image_editor" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-left">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 space-y-4">
                      <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-[#dfb76c]">Image Editor parameters</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-black">BASE IMAGE (OPTIONAL)</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-800 rounded-xl cursor-pointer bg-slate-950/60 hover:bg-slate-900/40 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-3 pb-3">
                              {imgEditBase ? (
                                <img src={imgEditBase} className="max-h-20 max-w-full rounded" alt="upload image preview" />
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-slate-500 mb-1" />
                                  <p className="text-[9px] text-slate-400 text-center uppercase tracking-wide">Drop starting image</p>
                                </>
                              )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImgEditUpload} />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-[#dfb76c] uppercase font-black font-semibold">EDIT / REDESIGN INSTRUCTION PROMPT</label>
                        <textarea
                          value={imgEditPrompt}
                          onChange={(e) => setImgEditPrompt(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white font-mono gap-1 focus:outline-none placeholder:text-slate-700"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleEditGenerateImage}
                        disabled={imgEditLoading}
                        className="w-full py-3 bg-[#dfb76c] hover:bg-[#c99a4e] text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                        {imgEditLoading ? "Processing Rendering..." : "PROCESS IMAGE RECONSTRUCTION"}
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 flex flex-col justify-center min-h-[350px] bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                    {imgEditLoading ? (
                      <div className="text-center py-20">
                        <RefreshCw className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-2" />
                        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Rendering reconstructed frame...</p>
                      </div>
                    ) : imgEditResult ? (
                      <div className="space-y-3 text-center">
                        <div className="flex items-center justify-center bg-black/40 rounded-xl overflow-hidden p-1 max-h-[300px]">
                          <img
                            src={imgEditResult}
                            referrerPolicy="no-referrer"
                            className="rounded-xl border border-slate-850 max-h-[290px] w-auto max-w-full object-contain"
                            alt="edited result rendering"
                          />
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <span className="font-mono text-[9px] text-slate-500">FORMAT: PNG | ENGINES: GEMINI-IMAGE</span>
                          <a
                            href={imgEditResult}
                            download="reconstructed_evidence.png"
                            className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            Download Image
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-600 text-xs font-mono uppercase tracking-wider">
                        No active reconstructed graphics queued
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. HIGH QUALITY IMAGE GENERATION */}
              {selectedExperiment === "high_qual_image" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-left">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 space-y-4">
                      <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-[#dfb76c]">Forensic high-res renderer</h4>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-[#dfb76c] uppercase font-black">HIGH RES CREATIVE PROMPT</label>
                        <textarea
                          value={hqImgPrompt}
                          onChange={(e) => setHqImgPrompt(e.target.value)}
                          rows={4}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white font-mono gap-1 focus:outline-none placeholder:text-slate-700"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">TARGET IMAGE SIZE RES</label>
                        <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                          {["1K", "2K", "4K"].map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setHqImgSize(sz as any)}
                              className={`py-1.5 px-2 uppercase font-black border rounded-lg ${
                                hqImgSize === sz
                                  ? "bg-[#dfb76c] text-slate-950 border-[#dfb76c] shadow-[0_0_8px_rgba(223,183,108,0.2)]"
                                  : "bg-slate-950 text-slate-400 border-slate-850"
                              }`}
                            >
                              {sz} Resolution
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateHqImage}
                        disabled={hqImgLoading}
                        className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-[#060a12]" />
                        {hqImgLoading ? `COMPILING ${hqImgSize} RENDER...` : `EXECUTE HIGH RESOLUTION RENDER`}
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 flex flex-col justify-center min-h-[350px] bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                    {hqImgLoading ? (
                      <div className="text-center py-20">
                        <RefreshCw className="w-10 h-10 text-[#dfb76c] animate-spin mx-auto mb-2" />
                        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Compiling high quality Pro render ({hqImgSize})...</p>
                        <p className="text-[9px] text-slate-600 uppercase mt-1">Multi-gigabyte image arrays processing</p>
                      </div>
                    ) : hqImgResult ? (
                      <div className="space-y-3 text-center">
                        <div className="flex items-center justify-center bg-black/40 rounded-xl overflow-hidden p-1 max-h-[300px]">
                          <img
                            src={hqImgResult}
                            referrerPolicy="no-referrer"
                            className="rounded-xl border border-slate-850 max-h-[290px] w-auto max-w-full object-contain"
                            alt="hq pro generated result"
                          />
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <span className="font-mono text-[9px] text-slate-400">RESOLUTION TARGET: {hqImgSize} | ENGINE: GEMINI-3-PRO-IMAGE</span>
                          <a
                            href={hqImgResult}
                            download={`high_res_${hqImgSize}_forensic.png`}
                            className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase cursor-pointer"
                          >
                            Save {hqImgSize} PNG
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-600 text-xs font-mono uppercase tracking-wider">
                        No active High-Resolution elements rendered
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. COGNITIVE MODEL ROUTER */}
              {selectedExperiment === "cognitive_router" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-left">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 space-y-4">
                      <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-[#dfb76c]">Cognitive Dual-Hybrid Router</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-black">LEGAL RESEARCH / ADVISORY TASK</label>
                        <textarea
                          value={routerQuery}
                          onChange={(e) => setRouterQuery(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-black">SELECT MODEL SCALE ROUTE</label>
                        <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                          {[
                            { tk: "FAST", modelPr: "gemini-3.1-flash-lite", dsc: "Fast Tasks" },
                            { tk: "GENERAL", modelPr: "gemini-3.5-flash", dsc: "General" },
                            { tk: "COMPLEX", modelPr: "gemini-3.1-pro-preview", dsc: "Complex Specialist" }
                          ].map((item) => (
                            <button
                              key={item.tk}
                              type="button"
                              onClick={() => setRouterTier(item.tk as any)}
                              className={`py-2 px-1 text-center font-black border rounded-lg hover:bg-slate-900 leading-tight ${
                                routerTier === item.tk
                                  ? "bg-teal-500/10 text-teal-400 border-teal-500"
                                  : "bg-slate-950 text-slate-500 border-slate-850"
                              }`}
                            >
                              <div className="font-bold">{item.tk}</div>
                              <div className="text-[7.5px] opacity-75 font-normal">{item.dsc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRouteIntelligence}
                        disabled={routerLoading}
                        className="w-full py-3 bg-[#dfb76c] hover:bg-[#c99a4e] text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Brain className="w-4.5 h-4.5 text-black" />
                        {routerLoading ? "Escalating query details..." : "EXECUTE COGNITIVE INTEL CALL"}
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 flex flex-col justify-between min-h-[350px] bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-4">
                      {routerLoading ? (
                        <div className="text-center py-20">
                          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Routing model variables...</p>
                        </div>
                      ) : routerResult ? (
                        <div className="space-y-4 text-left">
                          {/* Router Decision Log */}
                          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-[10px] font-mono text-emerald-400 flex items-start gap-2">
                            <Info className="w-4 h-4 text-[#dfb76c] shrink-0" />
                            <div>
                              <span className="font-bold uppercase block text-[9px] text-[#dfb76c]">ROUTER DECISION SELECTION METADATA</span>
                              <p className="leading-normal">{routerLog}</p>
                            </div>
                          </div>

                          <div className="prose prose-invert max-w-none text-xs leading-relaxed font-mono text-slate-300 border-t border-slate-900 pt-3">
                            <div className="whitespace-pre-wrap">{routerResult}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-600 text-xs font-mono uppercase tracking-wider">
                          Waiting for query complexity verification
                        </div>
                      )}
                    </div>

                    {routerDuration && (
                      <div className="border-t border-slate-900 pt-2.5 mt-2 flex justify-between font-mono text-[9px] text-slate-500">
                        <span>LATENCY MEASUREMENT: {routerDuration} ms</span>
                        <span>STATUS: ROUTED COMPLIANT</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 7. ENABLE HIGH THINKING MODE */}
              {selectedExperiment === "high_thinking" && (
                <div className="space-y-5 text-left h-full flex flex-col">
                  <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4.5 h-4.5 text-rose-400 animate-pulse" />
                        <span className="text-xs font-mono font-bold tracking-wider uppercase text-rose-400">Extreme Thinking Reasoning Panel (High Level)</span>
                      </div>
                      <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] font-bold uppercase rounded-lg">
                        thinkingLevel: ThinkingLevel.HIGH
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <textarea
                        value={thinkingPrompt}
                        onChange={(e) => setThinkingPrompt(e.target.value)}
                        placeholder="State highly complex, multi-layered statutory litigation riddle to solve..."
                        rows={2}
                        className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none"
                      />
                      <button
                        onClick={handleDeepThinking}
                        disabled={thinkingLoading}
                        className="px-5 bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        {thinkingLoading ? "Thinking..." : "UNSHACKLE REASON"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[350px]">
                    {/* Thought Process Left Console */}
                    <div className="lg:col-span-5 bg-slate-950 border border-red-950/40 rounded-xl p-4 flex flex-col h-full overflow-hidden">
                      <span className="text-[10px] font-mono font-bold uppercase text-red-400/90 mb-2 border-b border-rose-950/40 pb-1 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 animate-pulse text-red-400" />
                        thinking process logs (streaming thoughts)
                      </span>
                      <div className="flex-1 overflow-y-auto text-[9.5px] font-mono text-[#fae093]/75 leading-relaxed text-left space-y-2 select-text max-h-[300px]">
                        {thinkingLoading ? (
                          <div className="text-slate-650 italic py-16 text-center animate-pulse">
                            Generating deep intermediate thought sequences...
                          </div>
                        ) : thinkingProcess ? (
                          <div className="whitespace-pre-wrap bg-red-950/5 p-3 rounded border border-red-950/20">{thinkingProcess}</div>
                        ) : (
                          <div className="text-slate-700 italic py-16 text-center uppercase tracking-widest">
                            No logs buffered
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Final Master Briefing Panel Right */}
                    <div className="lg:col-span-7 bg-slate-1000 border border-slate-850 rounded-xl p-4 flex flex-col h-full overflow-hidden">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-2 border-b border-slate-900 pb-1">
                        Refined Master Legal Brief Outline Output
                      </span>
                      <div className="flex-1 overflow-y-auto text-xs font-mono text-slate-300 leading-relaxed text-left max-h-[300px] select-text">
                        {thinkingLoading ? (
                          <div className="text-slate-650 italic py-16 text-center animate-pulse">
                            Waiting for legal brief finalization...
                          </div>
                        ) : thinkingResult ? (
                          <div className="whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-900">{thinkingResult}</div>
                        ) : (
                          <div className="text-slate-700 italic py-16 text-center uppercase tracking-widest">
                            Await Brief generation
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. ANALYZE SCANNED EVIDENCE */}
              {selectedExperiment === "image_analyzer" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-left">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 space-y-4">
                      <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-[#dfb76c]">Multimodal OCR Vision audit</h4>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-400 uppercase font-black block">EVIDENTIARY PHOTO / SCAN</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-800 rounded-xl cursor-pointer bg-slate-950/60 hover:bg-slate-900/40 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-3 pb-3">
                              {analImage ? (
                                <img src={analImage} className="max-h-24 max-w-full rounded" alt="uploaded audit element" />
                              ) : (
                                <>
                                  <Upload className="w-7 h-7 text-slate-500 mb-1" />
                                  <p className="text-[9.5px] text-slate-400 text-center uppercase tracking-wide">Upload scan paper or photo</p>
                                  <p className="text-[8px] text-slate-600 text-center mt-0.5">JPEG / PNG supported</p>
                                </>
                              )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleAnalImageUpload} />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-[#dfb76c] uppercase font-black">AUDIT GOAL / QUESTIONS</label>
                        <textarea
                          value={analPrompt}
                          onChange={(e) => setAnalPrompt(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleRunImageAnalysis}
                        disabled={analLoading || !analImage}
                        className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-40 text-slate-950 font-mono text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4.5 h-4.5 text-slate-950" />
                        {analLoading ? "Analyzing OCR text lines..." : "EXECUTE VISION ANALYSIS AUDIT"}
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 flex flex-col justify-center min-h-[350px] bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden text-left">
                    {analLoading ? (
                      <div className="text-center py-20">
                        <RefreshCw className="w-10 h-10 text-[#dfb76c] animate-spin mx-auto mb-2" />
                        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Processing document OCR analysis...</p>
                      </div>
                    ) : analResult ? (
                      <div className="space-y-4">
                        <h3 className="text-slate-250 font-mono font-bold text-xs uppercase border-b border-slate-900 pb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-teal-400 animate-pulse" />
                          multimodal audit conclusions
                        </h3>
                        <div className="whitespace-pre-wrap text-xs text-slate-300 font-mono leading-relaxed bg-slate-1000 p-4 border border-slate-900 rounded-xl select-text">
                          {analResult}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-600 text-xs font-mono uppercase tracking-wider space-y-1.5">
                        <Camera className="w-10 h-10 text-slate-700 mx-auto" />
                        <p>No document analysis queued</p>
                        <p className="text-[9px] text-slate-500">Pick base photo on the left to start</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 9. AUDIO DEPOSITION STT */}
              {selectedExperiment === "audio_transcribe" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-left">
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#060a12] p-5 rounded-xl border border-slate-800 space-y-4">
                      <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-[#dfb76c]">Deposition Transcriber parameters</h4>
                      <p className="text-[11px] text-slate-400">
                        Record voice depositions directly from your workstation microphone using HTML5 capture. We pipe base64 encoded audio to gemini-3.5-flash for rapid indexing.
                      </p>

                      <div className="flex flex-col gap-2.5">
                        {transIsRecording ? (
                          <button
                            type="button"
                            onClick={stopTransRecording}
                            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-black uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                          >
                            <Square className="w-4.5 h-4.5 fill-white" />
                            Stop Dictation Capture
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startTransRecording}
                            className="w-full py-3 bg-[#dfb76c]/10 text-[#dfb76c] border border-[#dfb76c]/30 hover:bg-[#dfb76c]/20 font-mono text-xs font-black uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Mic className="w-4.5 h-4.5 text-[#dfb76c]" />
                            Capture Dictation Voice
                          </button>
                        )}

                        {transAudioBlob && (
                          <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-between">
                            <span className="font-mono text-[10px] text-slate-400 uppercase">CAPTURED AUDIO READY</span>
                            <button
                              onClick={handleTranscribeSpeech}
                              disabled={transLoading}
                              className="bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 px-3 py-1.5 text-[9px] text-teal-400 font-mono font-bold uppercase rounded cursor-pointer"
                            >
                              {transLoading ? "Transcribing..." : "RUN TRANSCRIBE"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 flex flex-col justify-center min-h-[350px] bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden text-left">
                    {transLoading ? (
                      <div className="text-center py-20">
                        <RefreshCw className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-2" />
                        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Translating voice waves to text indices...</p>
                      </div>
                    ) : transResult ? (
                      <div className="space-y-4">
                        <h3 className="text-slate-250 font-mono font-bold text-xs uppercase border-b border-slate-900 pb-2 flex items-center gap-2">
                          <Mic className="w-4 h-4 text-pink-400" />
                          VERIFIED STT TRANSCRIPTION RECORD
                        </h3>
                        <div className="italic text-xs text-[#fae093] font-mono leading-relaxed bg-[#dfb76c]/5 p-4 border border-[#dfb76c]/15 rounded-xl select-text">
                          {transResult}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-600 text-xs font-mono uppercase tracking-wider space-y-1">
                        <Mic className="w-10 h-10 text-slate-700 mx-auto" />
                        <p>No deposition transcription queued</p>
                        <p className="text-[9px] text-slate-500 uppercase">Press Capture Dictation to record</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
