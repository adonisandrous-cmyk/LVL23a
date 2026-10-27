/**
 * Level 23 Model Voice Assignment Registry & Service
 * Enables assigning authentic ElevenLabs female voices (or Studio female voices)
 * to specific legal AI models and document automation pipeline agents.
 * 
 * Strict Enforcement: Only Female voices are supported per enterprise directives.
 * Official ElevenLabs Female Roster: Lilly • Sarah • Jessica • Michelle • Maya • Misa
 */

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female';
  provider: 'ElevenLabs' | 'Studio';
  tone: string;
  accent?: string;
  previewUrl?: string | null;
  featured?: boolean;
}

export interface ModelProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  defaultVoiceId: string;
  defaultVoiceName: string;
  defaultProvider: 'ElevenLabs' | 'Studio';
  samplePhrase: string;
}

// Strictly Female ElevenLabs Roster: Lilly, Sarah, Jessica, Michelle, Maya, Misa, Laura
// Guarantees 100% distinct voice IDs and unique preview audio URLs for every single name
export const FEMALE_ELEVENLABS_VOICES: VoiceOption[] = [
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lilly',
    gender: 'Female',
    provider: 'ElevenLabs',
    tone: 'Velvety, poised mediator and arbitral narrator',
    accent: 'British / Poised (Legal Narrator)',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/89b68b35-b3dd-4348-a84a-a3c13a3c2b30.mp3',
    featured: true
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    gender: 'Female',
    provider: 'ElevenLabs',
    tone: 'Mature, reassuring, confident litigation paralegal & intake lead',
    accent: 'American (Natural & Reassuring)',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3',
    featured: true
  },
  {
    id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    gender: 'Female',
    provider: 'ElevenLabs',
    tone: 'Articulate, confident trial consultant & diagnostic specialist',
    accent: 'American (Crisp & Articulate)',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3',
    featured: true
  },
  {
    id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Maya',
    gender: 'Female',
    provider: 'ElevenLabs',
    tone: 'Clear, smooth, engaging legal strategist & case file reviewer',
    accent: 'British / Global (Engaging Strategist)',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/d10f7534-11f6-41fe-a012-2de1e482d336.mp3',
    featured: true
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Michelle',
    gender: 'Female',
    provider: 'ElevenLabs',
    tone: 'Knowledgeable, authoritative managing partner & senior legal counsel',
    accent: 'American (Knowledgeable & Professional)',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/b930e18d-6b4d-466e-bab2-0ae97c6d8535.mp3',
    featured: true
  },
  {
    id: 'hpp4J3VqNfWAUOO0d1Us',
    name: 'Misa',
    gender: 'Female',
    provider: 'ElevenLabs',
    tone: 'Gentle, bright, serene legal advisor & architectural auditor',
    accent: 'American (Serene & Precise)',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/hpp4J3VqNfWAUOO0d1Us/dab0f5ba-3aa4-48a8-9fad-f138fea1126d.mp3',
    featured: true
  },
  {
    id: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    gender: 'Female',
    provider: 'ElevenLabs',
    tone: 'Enthusiast, vibrant litigation support and client communicator',
    accent: 'American (Dynamic & Reassuring)',
    previewUrl: 'https://api.us.elevenlabs.io/v1/voices/FGY2WhTYpPnrIDTdsKH5/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJwcmVtYWRlIiwiZmlsZW5hbWUiOiI2NzM0MTc1OS1hZDA4LTQxYTUtYmU2ZS1kZTEyZmU0NDg2MTgubXAzIiwidGltZXN0YW1wIjoxNzkxNjI2NDAwMDAwMDAwfQ%3D%3D',
    featured: true
  }
];

// Strictly Female Studio / Prebuilt Models
export const FEMALE_STUDIO_VOICES: VoiceOption[] = [
  {
    id: 'Aoede',
    name: 'Aoede',
    gender: 'Female',
    provider: 'Studio',
    tone: 'Distinguished British / UK senior counsel accent',
    accent: 'British (UK Female)'
  },
  {
    id: 'Eve',
    name: 'Eve',
    gender: 'Female',
    provider: 'Studio',
    tone: 'Professional US legal operations & client coordinator',
    accent: 'American (US Female)'
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    provider: 'Studio',
    tone: 'Modern West Coast legal research associate',
    accent: 'American (West Coast)'
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    provider: 'Studio',
    tone: 'Mid-Atlantic academic and technical compliance officer',
    accent: 'Mid-Atlantic (Academic)'
  }
];

export const ALL_FEMALE_VOICES: VoiceOption[] = [
  ...FEMALE_ELEVENLABS_VOICES,
  ...FEMALE_STUDIO_VOICES
];

// Core AI Models assigned across the official ElevenLabs female roster
export const FIRM_AI_MODELS: ModelProfile[] = [
  {
    id: 'ap-1',
    name: 'Phoenix',
    role: 'Senior Managing Partner & Litigation Lead',
    avatar: '👩‍⚖️',
    defaultVoiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lilly (ElevenLabs - Lilly Distinct Voice)
    defaultVoiceName: 'Lilly',
    defaultProvider: 'ElevenLabs',
    samplePhrase: 'Pursuant to California Family Code Section 2330, dissolution petitions mandate strict thirty-day discovery timelines.'
  },
  {
    id: 'ap-4',
    name: 'EVE',
    role: 'Office Manager & Client Intake Lead',
    avatar: '🤖',
    defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah (ElevenLabs - Sarah Distinct Voice)
    defaultVoiceName: 'Sarah',
    defaultProvider: 'ElevenLabs',
    samplePhrase: 'Client intake form FL-120 has been verified with Sacramento County Superior Court requirements.'
  },
  {
    id: 'ap-3',
    name: 'Alure',
    role: 'Legal Research Associate & Case File Reviewer',
    avatar: '💼',
    defaultVoiceId: 'cgSgspJ2msm6clMCkdW9', // Jessica (ElevenLabs - Jessica Distinct Voice)
    defaultVoiceName: 'Jessica',
    defaultProvider: 'ElevenLabs',
    samplePhrase: 'I have cross-referenced the property disclosures against community asset schedules in the master file.'
  },
  {
    id: 'ap-2',
    name: 'Sentry',
    role: 'Systems Security & Diagnostic Specialist',
    avatar: '🛡️',
    defaultVoiceId: 'Xb7hH8MSUJpSbSDYk0k2', // Maya (ElevenLabs - Maya Distinct Voice)
    defaultVoiceName: 'Maya',
    defaultProvider: 'ElevenLabs',
    samplePhrase: 'System diagnostics complete. All automated XFDF pipelines and court filing connections are nominal.'
  },
  {
    id: 'ap-5',
    name: 'Sentinel',
    role: 'Code Quality & Architectural Auditor',
    avatar: '🔬',
    defaultVoiceId: 'hpp4J3VqNfWAUOO0d1Us', // Misa (ElevenLabs - Misa Distinct Voice)
    defaultVoiceName: 'Misa',
    defaultProvider: 'ElevenLabs',
    samplePhrase: 'Zero-loop validation confirmed. Component boundaries and data pipelines adhere to enterprise standards.'
  },
  {
    id: 'ap-6',
    name: 'Veritas',
    role: 'Feature Effectiveness & Benchmark Engine',
    avatar: '⚖️',
    defaultVoiceId: 'XrExE9yKIg1WjnnlVkGX', // Michelle (ElevenLabs - Michelle Distinct Voice)
    defaultVoiceName: 'Michelle',
    defaultProvider: 'ElevenLabs',
    samplePhrase: 'Benchmark metrics verify 100 percent field-fill accuracy on all Judicial Council PDF export bundles.'
  },
  {
    id: 'mod-hearing',
    name: 'Court Hearing Reader',
    role: 'Official Court Audio & Hearing Digest Narrator',
    avatar: '🏛️',
    defaultVoiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lilly (ElevenLabs)
    defaultVoiceName: 'Lilly',
    defaultProvider: 'ElevenLabs',
    samplePhrase: 'Courtroom calendar notice: The evidentiary hearing is scheduled in Department 42 at 9:00 AM.'
  },
  {
    id: 'mod-intake',
    name: 'Client Questionnaire Vocalizer',
    role: 'Interactive Intake & Questionnaire Guide',
    avatar: '📋',
    defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah (ElevenLabs)
    defaultVoiceName: 'Sarah',
    defaultProvider: 'ElevenLabs',
    samplePhrase: 'Welcome to Level 23 Legal. Please confirm your primary county of residence to begin filing.'
  }
];

export interface ModelVoiceAssignment {
  voiceId: string;
  voiceName: string;
  provider: 'ElevenLabs' | 'Studio';
  gender: 'Female';
}

const STORAGE_KEY = 'level23_model_voice_assignments_v3';

export function getModelVoiceAssignments(): Record<string, ModelVoiceAssignment> {
  const defaults: Record<string, ModelVoiceAssignment> = {};
  for (const model of FIRM_AI_MODELS) {
    defaults[model.id] = {
      voiceId: model.defaultVoiceId,
      voiceName: model.defaultVoiceName,
      provider: model.defaultProvider,
      gender: 'Female'
    };
  }

  if (typeof window === 'undefined') return defaults;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    // Sanitize any deprecated voices (Alice, Rachel, Matilda, Bella, Laura) to new official roster
    const validVoiceNames = new Set(FEMALE_ELEVENLABS_VOICES.map(v => v.name.toLowerCase()));
    for (const [k, v] of Object.entries(parsed as Record<string, ModelVoiceAssignment>)) {
      if (v?.provider === 'ElevenLabs' && !validVoiceNames.has((v.voiceName || '').toLowerCase())) {
        parsed[k] = defaults[k] || v;
      }
    }
    // Ensure official distinct staff bindings are strictly honored
    if (parsed['ap-1']) {
      parsed['ap-1'].voiceId = 'pFZP5JQG7iQjIQuC4Bku';
      parsed['ap-1'].voiceName = 'Lilly';
      parsed['ap-1'].provider = 'ElevenLabs';
    }
    if (parsed['ap-4']) {
      parsed['ap-4'].voiceId = 'EXAVITQu4vr4xnSDxMaL';
      parsed['ap-4'].voiceName = 'Sarah';
      parsed['ap-4'].provider = 'ElevenLabs';
    }
    if (parsed['ap-3']) {
      parsed['ap-3'].voiceId = 'cgSgspJ2msm6clMCkdW9';
      parsed['ap-3'].voiceName = 'Jessica';
      parsed['ap-3'].provider = 'ElevenLabs';
    }
    return { ...defaults, ...parsed };
  } catch (e) {
    return defaults;
  }
}

export function saveModelVoiceAssignment(
  modelId: string,
  voiceId: string,
  voiceName: string,
  provider: 'ElevenLabs' | 'Studio'
): Record<string, ModelVoiceAssignment> {
  const current = getModelVoiceAssignments();
  current[modelId] = {
    voiceId,
    voiceName,
    provider,
    gender: 'Female'
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('level23_voice_assignment_changed', {
        detail: { modelId, assignment: current[modelId], allAssignments: current }
      }));
    } catch (e) {
      console.warn('Could not persist model voice assignment:', e);
    }
  }

  return current;
}

export function resetModelVoiceAssignments(): Record<string, ModelVoiceAssignment> {
  const defaults: Record<string, ModelVoiceAssignment> = {};
  for (const model of FIRM_AI_MODELS) {
    defaults[model.id] = {
      voiceId: model.defaultVoiceId,
      voiceName: model.defaultVoiceName,
      provider: model.defaultProvider,
      gender: 'Female'
    };
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      window.dispatchEvent(new CustomEvent('level23_voice_assignment_changed', {
        detail: { allAssignments: defaults }
      }));
    } catch (e) {}
  }

  return defaults;
}

/**
 * 1-Click Preset activating the user-specified official ElevenLabs roster:
 * - Phoenix -> Lilly (Senior Managing Partner)
 * - EVE -> Sarah (Office Manager & Intake Lead)
 * - Alure -> Jessica (Legal Research Associate)
 * - Sentry -> Maya (Systems Diagnostic & Security)
 * - Sentinel -> Misa (Code Quality Auditor)
 * - Veritas -> Michelle (Benchmark & Feature Verification)
 * - Court Hearing Reader -> Lilly
 * - Client Questionnaire Vocalizer -> Sarah
 */
export function applyElevenLabsCorePreset(): Record<string, ModelVoiceAssignment> {
  const preset: Record<string, ModelVoiceAssignment> = {
    'ap-1': { voiceId: 'pFZP5JQG7iQjIQuC4Bku', voiceName: 'Lilly', provider: 'ElevenLabs', gender: 'Female' },
    'ap-4': { voiceId: 'EXAVITQu4vr4xnSDxMaL', voiceName: 'Sarah', provider: 'ElevenLabs', gender: 'Female' },
    'ap-3': { voiceId: 'cgSgspJ2msm6clMCkdW9', voiceName: 'Jessica', provider: 'ElevenLabs', gender: 'Female' },
    'ap-2': { voiceId: 'Xb7hH8MSUJpSbSDYk0k2', voiceName: 'Maya', provider: 'ElevenLabs', gender: 'Female' },
    'ap-5': { voiceId: 'hpp4J3VqNfWAUOO0d1Us', voiceName: 'Misa', provider: 'ElevenLabs', gender: 'Female' },
    'ap-6': { voiceId: 'XrExE9yKIg1WjnnlVkGX', voiceName: 'Michelle', provider: 'ElevenLabs', gender: 'Female' },
    'mod-hearing': { voiceId: 'pFZP5JQG7iQjIQuC4Bku', voiceName: 'Lilly', provider: 'ElevenLabs', gender: 'Female' },
    'mod-intake': { voiceId: 'EXAVITQu4vr4xnSDxMaL', voiceName: 'Sarah', provider: 'ElevenLabs', gender: 'Female' }
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
      window.dispatchEvent(new CustomEvent('level23_voice_assignment_changed', {
        detail: { allAssignments: preset }
      }));
    } catch (e) {}
  }

  return preset;
}

export function applyAliceSarahRachelTrioPreset(): Record<string, ModelVoiceAssignment> {
  return applyElevenLabsCorePreset();
}

export function applyAllElevenLabsElitePreset(): Record<string, ModelVoiceAssignment> {
  return applyElevenLabsCorePreset();
}
