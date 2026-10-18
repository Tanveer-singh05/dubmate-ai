"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Loader2, Film, Sparkles, Check,
  Mic2, ArrowRight, X, Play, Pause, Wand2, Volume2, Download,
  Plus, Trash2
} from "lucide-react";
import { useAuthStore} from "@/lib/auth-store";
import { useRuntimeMode, useHardwareInfo } from "@/lib/runtime-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { PresetSelector } from "@/components/preset-selector";
import {
  useStudioStore,
  CharacterProfile,
  AnalysisResult,
  VoiceLibraryItem,
  FormalityLevel,
  DubResult,
  SegmentRecord,
} from "@/lib/studio-store";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Voice library audio_url values are backend-relative paths like
// "/outputs/voice_library/2/xyz.wav". The browser must hit the backend
// origin, not the Next.js origin. Prepend API_URL when the path is
// relative.
function resolveAudioUrl(url: string, apiUrl: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${apiUrl}${url}`;
  return `${apiUrl}/${url}`;
}
const LANGUAGES = [
  "English", "Hindi", "Punjabi", "Spanish", "French", "German",
  "Italian", "Portuguese", "Russian", "Arabic", "Dutch", "Swedish",
  "Norwegian", "Danish", "Finnish", "Polish", "Greek", "Turkish",
  "Hebrew", "Korean", "Japanese", "Chinese", "Malay", "Swahili",
];
const DUB_PHASES = [
  "Separating vocals and music…",
  "Reading the audio…",
  "Identifying speakers…",
  "Translating the dialogue…",
  "Generating character voices…",
  "Matching the timing…",
  "Mixing the final audio…",
  "Applying lip-sync… (this is the slow step)",
  "Finishing up…",
];
function pickFinalVideoUrl(result: DubResult | null, apiUrl: string): string | null {
  if (!result) return null;

  const ls = result.output_package?.visual_lipsync_result;
  if (ls && ls.status === "completed" && ls.output_url) {
    return `${apiUrl}${ls.output_url}`;
  }

  if (result.dubbed_video) {
    const name = result.dubbed_video.split("/").pop();
    return name ? `${apiUrl}/outputs/${name}` : null;
  }
  return null;
}

function hasLipSyncResult(result: DubResult | null): boolean {
  const ls = result?.output_package?.visual_lipsync_result;
  if (!ls) return false;
  if (ls.status !== "completed") return false;
  if (ls.error || ls.failed) return false;
  return true;
}

export default function StudioPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const {
    step, setStep,
    file, setFile,
    analysis, setAnalysis,
    editedChars, setEditedChars,
    targetLang, setTargetLang,
    emotionIntensity, setEmotionIntensity,
    lipsyncQuality, setLipsyncQuality,
    sourceLang, setSourceLang,
    asrNoiseFilter, setAsrNoiseFilter,
    result, setResult,
    globalFormality, setGlobalFormality,
    voiceLibrary, setVoiceLibrary,
    reset: resetStudio,
  } = useStudioStore();
  const isDubbing = step === "dubbing";
  
  // Session 2: collapsible Dub Settings
  const [dubSettingsExpanded, setDubSettingsExpanded] = useState(false);

  const [dubPhaseIdx, setDubPhaseIdx] = useState(0);
  
  const [dubProgress, setDubProgress] = useState<{
    percent: number;
    phase: string;
    detail: string;
  }>({ percent: 0, phase: "starting", detail: "" });

  // FEATURE 8: per-segment text overrides keyed by raw_segments index
  const [segmentEdits, setSegmentEdits] = useState<Record<number, string>>({});

  // FEATURE 9 + 15: preview TTS state per segment
  const [segmentPreview, setSegmentPreview] = useState<
    Record<number, { loading: boolean; url?: string; error?: string }>
  >({});
    // FEATURE 21: bump to force VoiceLibraryPanel to refetch
  const [libraryRefreshToken, setLibraryRefreshToken] = useState(0);

  // FEATURE 4: suggestions for the character name autocomplete
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  // Phase 2: 402 handling — shown when /phase1 fails with insufficient_credits
  const [insufficientCredits, setInsufficientCredits] = useState<{
    requested: number;
    available: number;
    message: string;
  } | null>(null);
  
  // Pull suggestions from the voice library + current characters
  useEffect(() => {
    const fromChars = editedChars.map((c) => c.character_name).filter(Boolean);
    setNameSuggestions((prev) => {
      const merged = new Set([...prev, ...fromChars]);
      return Array.from(merged);
    });
  }, [editedChars]);

  useEffect(() => {
    if (step !== "review") return;
    api
      .listVoiceLibrary()
      .then((rows) => {
        setNameSuggestions((prev) => {
          const merged = new Set([...prev, ...rows.map((r) => r.name)]);
          return Array.from(merged);
        });
      })
      .catch(() => {});
  }, [step, libraryRefreshToken]);
  useEffect(() => {
    if (step !== "dubbing") {
      setDubPhaseIdx(0);
      return;
    }
    const t = setInterval(() => {
      setDubPhaseIdx((i) => Math.min(i + 1, DUB_PHASES.length - 1));
    }, 25000);
    return () => clearInterval(t);
  }, [step]);

useEffect(() => {
  if (step !== "dubbing") {
    setDubProgress({ percent: 0, phase: "queued", detail: "" });
    return;
  }
  let cancelled = false;
  const tick = async () => {
    try {
      const s = await api.latestRunningJob();
      if (cancelled) return;
      const nextPct = Math.max(0, Math.min(100, s.percent || 0));
      setDubProgress((prev) => ({
        // Backend now enforces monotonic, but guard here too in case
        // an in-flight request returns a stale lower value.
        percent: Math.max(prev.percent, nextPct),
        phase: s.phase || "working",
        detail: s.detail || "",
      }));
    } catch {
      /* network hiccup during dub — ignore and try again */
    }
  };
  tick();
  const t = setInterval(tick, 1000);
  return () => {
    cancelled = true;
    clearInterval(t);
  };
}, [step]);

  // ==================== Upload + Analyze ====================
  const handleAnalyze = async () => {
    if (!file) return;

    setStep("analyzing");

    const fd = new FormData();
    fd.append("video", file);
    fd.append("source_language", "auto");

    try {
      const res = await fetch(`${API_URL}/analyze/characters`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Analysis failed");
      }

      const data: AnalysisResult = await res.json();
      setAnalysis(data);
      setEditedChars(data.characters);
      setStep("review");
      toast(`Found ${data.characters.length} characters`, "success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast(message, "error");
      setStep("upload");
    }
  };
  
  // ==================== Dub ====================
    const handleDub = async () => {
    if (!file || !analysis) return;
    setStep("dubbing");
    qc.invalidateQueries({ queryKey: ["keys"] });
    const formData = new FormData();
    formData.append("video", file);
    formData.append("source_language", "auto");
    formData.append("target_language", targetLang);
    formData.append("emotion_intensity", emotionIntensity);
    formData.append("lipsync_quality", lipsyncQuality);
    formData.append(
      "content_type",
      analysis?.content_type ?? "unknown"
    );
    // Pass speaker -> character map
    const speakerMap = Object.fromEntries(
      editedChars.map((c) => [c.speaker_id, c.character_name])
    );
    formData.append("speaker_character_map", JSON.stringify(speakerMap));

    // FEATURE 1: Pass user-confirmed gender overrides
    const genderOverrides = Object.fromEntries(
      editedChars
        .filter((c) => c.gender && c.gender !== "unknown")
        .map((c) => [c.speaker_id, c.gender])
    );
    formData.append("speaker_gender_overrides", JSON.stringify(genderOverrides));
    // FEATURE 4: Pass per-character voice style overrides
    const voiceStyleOverrides = Object.fromEntries(
      editedChars
        .filter(
          (c) =>
            c.speaker_id &&
            c.voice_style_override &&
            c.voice_style_override !== "auto"
        )
        .map((c) => [c.speaker_id, c.voice_style_override])
    );
    formData.append(
      "speaker_voice_style_overrides",
      JSON.stringify(voiceStyleOverrides)
    );
    formData.append("asr_noise_filter", asrNoiseFilter);
    formData.append("segment_text_overrides", JSON.stringify(segmentEdits));

    // SESSION 1: per-character voice assignments
    const voiceAssignments = Object.fromEntries(
      editedChars
        .filter((c) => c.speaker_id && c.assigned_voice_id)
        .map((c) => [c.speaker_id!, c.assigned_voice_id!])
    );
    formData.append(
      "character_voice_assignments",
      JSON.stringify(voiceAssignments)
    );

    // SESSION 1: per-character formality overrides
    const formalityOverrides = Object.fromEntries(
      editedChars
        .filter(
          (c) =>
            c.speaker_id &&
            (c.assigned_formality ?? "auto") !== "auto"
        )
        .map((c) => [c.speaker_id!, c.assigned_formality!])
    );
    formData.append(
      "character_formality",
      JSON.stringify(formalityOverrides)
    );
    formData.append("global_formality", globalFormality);

    // PHASE 5: per-character pitch offsets (semitones, -6 to +6)
    const pitchOffsets = Object.fromEntries(
      editedChars
        .filter(
          (c) =>
            c.speaker_id &&
            typeof c.pitchOffset === "number" &&
            Math.abs(c.pitchOffset) >= 0.5
        )
        .map((c) => [c.speaker_id!, c.pitchOffset!])
    );
    formData.append(
      "character_pitch_offsets",
      JSON.stringify(pitchOffsets)
    );
    
    try {
      const res = await fetch(`${API_URL}/phase1`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // 402 = insufficient credits. Open a dedicated dialog so the user
        // sees exactly what they need and can jump to pricing.
        if (
          res.status === 402 &&
          body?.detail?.error === "insufficient_credits"
        ) {
          setInsufficientCredits({
            requested: body.detail.requested ?? 0,
            available: body.detail.available ?? 0,
            message:
              body.detail.message ||
              "You don't have enough credits for this job.",
          });
          setStep("review");
          return;
        }
        const msg =
          typeof body.detail === "string" ? body.detail : "Dubbing failed";
        throw new Error(msg);
      }

      const data = await res.json();
      setResult(data);
      qc.invalidateQueries({ queryKey: ["keys"] });
      setStep("done");
      toast("Dubbing complete!", "success");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Dubbing failed";
      toast(message, "error");
      setStep("review");
    }
  };

  // ==================== Render ====================
  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 space-y-5 sm:space-y-6">
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight">Studio</h1>
        <p className="text-sm sm:text-base text-muted">
          Upload → auto-detect characters → review → dub
        </p>
        <HardwareBanner />
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-sm overflow-x-auto pb-1 -mb-1">
        {["Upload", "Analyze", "Review", "Dub"].map((label, i) => {
          const stepOrder = { upload: 0, analyzing: 1, review: 2, dubbing: 3, done: 3 };
          const current = stepOrder[step];
          const done = i < current;
          const active = i === current;
          return (
            <div key={label} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  done ? "bg-emerald-500 text-white" :
                  active ? "bg-primary text-primary-fg ring-4 ring-primary/15" :
                  "bg-card border border-border text-muted"
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap",
                  active || done ? "font-medium" : "text-muted",
                  active ? "inline" : "hidden sm:inline"
                )}
              >
                {label}
              </span>
              {i < 3 && <ArrowRight size={14} className="text-muted/60 shrink-0" />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ============ STEP 1: UPLOAD ============ */}
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Upload Video</CardTitle>
                <CardDescription>
                  MP4, MOV, or WebM — we&apos;ll automatically detect characters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/40 transition block">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div>
                      <Film className="mx-auto mb-3 text-primary" size={40} />
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted mt-1">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto mb-3 text-muted" size={40} />
                      <p className="font-medium">Click to upload</p>
                      <p className="text-sm text-muted mt-1">or drag and drop</p>
                    </div>
                  )}
                </label>

                {file && (
                  <div className="flex justify-center mt-6">
                    <Button size="lg" onClick={handleAnalyze} className="gap-2">
                      <Sparkles size={16} /> Analyze Characters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ============ STEP 2: ANALYZING ============ */}
        {step === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                <p className="font-medium mb-2">Analyzing video...</p>
                <p className="text-sm text-muted">
                  Extracting speech, detecting speakers, and identifying characters
                </p>
                <div className="max-w-xs mx-auto mt-6 space-y-2 text-xs text-left text-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={12} /> Transcribing audio
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={12} /> Running speaker diarization
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={12} /> Identifying characters with AI
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={12} /> Extracting faces and voice clips
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ============ STEP 3: REVIEW CHARACTERS ============ */}
        {step === "review" && analysis && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5 sm:space-y-6 pb-32 sm:pb-40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold">Detected Characters</h2>
                <p className="text-xs sm:text-sm text-muted">
                  Review and edit names before dubbing
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetStudio} className="shrink-0">
                <X size={14} /> Start over
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {editedChars.map((char, idx) => (
                <CharacterCard
                  key={idx}
                  char={char}
                  apiUrl={API_URL}
                  targetLang={targetLang}
                  voiceLibrary={voiceLibrary}
                  globalFormality={globalFormality}
                  onUpdate={(updates) => {
                    const next = [...editedChars];
                    next[idx] = { ...next[idx], ...updates };
                    setEditedChars(next);
                  }}
                  allSegments={analysis?.raw_segments ?? []}
                  segmentEdits={segmentEdits}
                  onSegmentEdit={(segIdx, newText) => {
                    setSegmentEdits((prev) => ({
                      ...prev,
                      [segIdx]: newText,
                    }));
                  }}
                  segmentPreview={segmentPreview}
                  fileId={analysis?.file_id ?? ""}
                  nameSuggestions={nameSuggestions}
                  onVoiceSavedToLibrary={() =>
                    setLibraryRefreshToken((v) => v + 1)
                  }
                  onSegmentPreview={async (segIdx, segText) => {
                    if (!char.voice_clip_url) return;
                    setSegmentPreview((prev) => ({
                      ...prev,
                      [segIdx]: { loading: true },
                    }));
                    try {
                      const res = await api.previewTTS({
                        text: segText,
                        reference_path: char.voice_clip_url!,
                        language: targetLang,
                        character_name: char.character_name,
                        character_gender: char.gender,
                        emotion:
                          char.voice_style_override &&
                          char.voice_style_override !== "auto"
                            ? char.voice_style_override
                            : "neutral",
                        speaking_style: char.speaking_style || "natural",
                        speaker_id: char.speaker_id || "",
                      });
                      setSegmentPreview((prev) => ({
                        ...prev,
                        [segIdx]: { loading: false, url: res.url },
                      }));
                      const audio = new Audio(`${API_URL}${res.url}`);
                      audio.play();
                    } catch (error: unknown) {
                      const message = error instanceof Error ? error.message : "Preview failed";
                      setSegmentPreview((prev) => ({
                        ...prev,
                        [segIdx]: { loading: false, error: message },
                      }));
                    }
                  }}
                />
              ))}
            </div>
            {analysis?.raw_segments && analysis.raw_segments.length > 0 && (
              <TimingTimeline
                segments={analysis.raw_segments}
                characters={editedChars}
              />
            )}

            <MultiFaceWarning characters={editedChars} />

            {/* ============ Session 2: Collapsible Dub Settings ============ */}
            <Card>
              <button
                type="button"
                onClick={() => setDubSettingsExpanded((v) => !v)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-accent/5 transition-colors rounded-t-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <div className="flex items-center gap-2 shrink-0">
                    <Sparkles size={16} className="text-primary" />
                    <span className="font-semibold text-sm">Dub Settings</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted flex-wrap min-w-0">
                    <span className="px-2 py-0.5 rounded-full bg-card border border-border">
                      {targetLang}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-card border border-border">
                      {emotionIntensity === "auto" ? "Auto emotion" : `${emotionIntensity} emotion`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-card border border-border">
                      {lipsyncQuality === "enhanced" ? "Enhanced lipsync" : `${lipsyncQuality} lipsync`}
                    </span>
                    {globalFormality !== "auto" && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {globalFormality} formality
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-primary shrink-0">
                  {dubSettingsExpanded ? "Hide" : "Edit"}
                </span>
              </button>

              {dubSettingsExpanded && (
                <CardContent className="space-y-4 pt-2 border-t border-border">
                  <PresetSelector
                    apiUrl={API_URL}
                    token={token}
                    current={{
                      targetLang,
                      sourceLang,
                      emotionIntensity,
                      lipsyncQuality,
                      speakingRate: "medium",
                      asrNoiseFilter,
                    }}
                    onApply={(s) => {
                      if (s.targetLang !== undefined) setTargetLang(s.targetLang);
                      if (s.sourceLang !== undefined) setSourceLang(s.sourceLang);
                      if (s.emotionIntensity !== undefined) setEmotionIntensity(s.emotionIntensity);
                      if (s.lipsyncQuality !== undefined) setLipsyncQuality(s.lipsyncQuality);
                      if (s.asrNoiseFilter !== undefined) setAsrNoiseFilter(s.asrNoiseFilter);
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <Label>Target Language</Label>
                      <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                        {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label>Emotion Intensity</Label>
                      <select value={emotionIntensity} onChange={(e) => setEmotionIntensity(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                        <option value="auto">Auto</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <Label>Lip-Sync Quality</Label>
                      <select value={lipsyncQuality} onChange={(e) => setLipsyncQuality(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                        <option value="fast">Fast</option>
                        <option value="enhanced">Enhanced</option>
                        <option value="broadcast">Broadcast</option>
                      </select>
                    </div>
                    <div>
                      <Label>Default Formality</Label>
                      <select
                        value={globalFormality}
                        onChange={(e) =>
                          setGlobalFormality(e.target.value as FormalityLevel)
                        }
                        className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <option value="auto">Auto</option>
                        <option value="formal">Formal</option>
                        <option value="informal">Informal</option>
                        <option value="intimate">Intimate</option>
                      </select>
                      <p className="text-[10px] text-muted mt-1">
                        Characters with &quot;Auto&quot; inherit this
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>


            <VoiceLibraryPanel
              refreshToken={libraryRefreshToken}
              onVoiceLibraryLoaded={setVoiceLibrary}
            />

            {/* Pre-Flight Check + Dub button — floating sticky card */}
            <div
              className="sticky bottom-4 sm:bottom-6 z-30 shadow-2xl shadow-black/40 rounded-xl overflow-hidden"
              style={{ backgroundColor: "#0B1020" }}
            >
              <PreFlightCheck
                characters={editedChars}
                onDub={handleDub}
                isDubbing={isDubbing}
              />
            </div>
          </motion.div>
        )}

        {/* ============ STEP 4: DUBBING ============ */}
        {step === "dubbing" && (
          <motion.div key="dubbing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="py-12 sm:py-16 px-4 text-center">
                <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                <p className="font-medium mb-2">Dubbing in progress…</p>

                <p className="text-sm text-muted min-h-[1.5rem]">
                  {dubProgress.phase || DUB_PHASES[dubPhaseIdx]}
                </p>
                {dubProgress.detail && (
                  <p className="text-xs text-muted mt-1">{dubProgress.detail}</p>
                )}

                <p className="text-4xl font-bold text-primary mt-6 tabular-nums">
                  {dubProgress.percent}%
                </p>

                <div className="mt-3 h-2 bg-border rounded-full overflow-hidden max-w-md mx-auto">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${dubProgress.percent}%` }}
                  />
                </div>

                <p className="text-[11px] text-muted mt-3">
                  Real progress from the pipeline · updates live
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ============ STEP 5: DONE ============ */}
        {step === "done" && result && (
          <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check size={18} className="text-emerald-500" /> Dubbing Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const finalUrl = pickFinalVideoUrl(result, API_URL);
                  const isLipSynced = hasLipSyncResult(result);
                  if (!finalUrl) return null;
                  return (
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Label>{isLipSynced ? "Final Video (Lip-Synced)" : "Dubbed Video"}</Label>
                        {isLipSynced && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-medium">
                            Wav2Lip synced
                          </span>
                        )}
                        {!isLipSynced && (
                          <p className="text-xs text-amber-500 mt-1">
                            Lip-sync was skipped for this video (no persistent face detected).
                            Audio dub is applied.
                          </p>
                        )}
                      </div>
                      <video
                        controls
                        className="w-full rounded-lg border border-border mt-2"
                        src={finalUrl}
                      />
                      <ComparePlayer originalFile={file} dubbedUrl={finalUrl} />
                      {isLipSynced && result.output_package?.visual_lipsync_result && (
                        <p className="text-xs text-muted mt-2">
                          Lip-sync engine: {result.output_package.visual_lipsync_result.engine || "unknown"}
                          {" · "}
                          {Math.round(result.output_package.visual_lipsync_result.duration_sec ?? 0)}s processing
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={async () => {
                            const finalUrl = pickFinalVideoUrl(result, API_URL);
                            if (!finalUrl) return;
                            const r = await fetch(finalUrl);
                            const blob = await r.blob();
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = `${result.output_package?.summary?.file_id || "dubmate"}_final.mp4`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(a.href);
                          }}
                          className="gap-2"
                        >
                          <Download size={16} /> Download Video
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            const url = pickFinalVideoUrl(result, API_URL);
                            if (!url) return;
                            navigator.clipboard.writeText(url);
                            toast("Link copied", "success");
                          }}
                          className="gap-2"
                        >
                          <ArrowRight size={16} /> Copy Link
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            const fid = result.output_package?.summary?.file_id;
                            if (!fid) return;
                            const a = document.createElement("a");
                            a.href = `${API_URL}/outputs/${fid}_dubbed_subtitles.srt`;
                            a.download = `${fid}_subtitles.srt`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          }}
                          className="gap-2"
                        >
                          <Download size={16} /> Subtitles (.srt)
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            const fid = result.output_package?.summary?.file_id;
                            if (!fid) return;
                            const a = document.createElement("a");
                            a.href = `${API_URL}/generated_audio/${fid}_final_mixed.wav`;
                            a.download = `${fid}_audio.wav`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          }}
                          className="gap-2"
                        >
                          <Download size={16} /> Audio (.wav)
                        </Button>

                        <Button variant="outline" onClick={resetStudio}>
                          New Project
                        </Button>
                      </div>
                    </div>
                  );
                })()}
                
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Insufficient credits dialog — shown when /phase1 returns 402 */}
      <Dialog
        open={!!insufficientCredits}
        onClose={() => setInsufficientCredits(null)}
      >
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Not enough credits</h3>
            <p className="text-sm text-muted mt-1">
              {insufficientCredits?.message}
            </p>
          </div>

          {insufficientCredits && (
            <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Credits needed</span>
                <span className="font-medium">
                  {insufficientCredits.requested}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Your balance</span>
                <span className="font-medium">
                  {insufficientCredits.available}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted">Short by</span>
                <span className="font-semibold text-amber-600">
                  {Math.max(
                    0,
                    insufficientCredits.requested -
                      insufficientCredits.available
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => setInsufficientCredits(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setInsufficientCredits(null);
                router.push("/#pricing");
              }}
            >
              View pricing
            </Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
}

// ============================================================
// FEATURE 7: Timing Preview Timeline
// ============================================================
const TIMELINE_PALETTE = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#ef4444", "#06b6d4", "#84cc16",
];

function TimingTimeline({
  segments,
  characters,
}: {
  segments: Array<{ start: number; end: number; text: string; speaker: string; character?: string }>;
  characters: CharacterProfile[];
}) {
  if (!segments || segments.length === 0) return null;

  const charColors: Record<string, string> = {};
  characters.forEach((c, i) => {
    charColors[c.character_name] = TIMELINE_PALETTE[i % TIMELINE_PALETTE.length];
  });

  const totalDuration = Math.max(...segments.map((s) => s.end), 1);
  const midPoint = totalDuration / 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timing Preview</CardTitle>
        <CardDescription>
          {segments.length} dialogue segments · {totalDuration.toFixed(1)}s total ·{" "}
          {characters.length} speaker{characters.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative w-full h-14 bg-card/40 rounded-lg border border-border overflow-hidden">
          {segments.map((seg, i) => {
            const charName = seg.character || seg.speaker || "UNKNOWN";
            const leftPct = (seg.start / totalDuration) * 100;
            const widthPct = ((seg.end - seg.start) / totalDuration) * 100;
            return (
              <div
                key={i}
                className="absolute top-1.5 bottom-1.5 rounded transition-opacity hover:opacity-100"
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 0.25)}%`,
                  background: charColors[charName] || "#94a3b8",
                  opacity: 0.85,
                }}
                title={`${charName}: ${seg.text.slice(0, 80)} (${seg.start.toFixed(1)}s – ${seg.end.toFixed(1)}s)`}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] text-muted">
          <span>0s</span>
          <span>{midPoint.toFixed(1)}s</span>
          <span>{totalDuration.toFixed(1)}s</span>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          {characters.map((c) => (
            <div key={c.character_name} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-3 h-3 rounded"
                style={{ background: charColors[c.character_name] || "#94a3b8" }}
              />
              <span className="text-muted">{c.character_name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// FEATURE 10: Multi-Face Overlap Warning
// ============================================================
function detectMultiFaceOverlaps(characters: CharacterProfile[]): number[] {
  const byTimestamp: Record<number, Set<string>> = {};

  characters.forEach((c) => {
    (c.face_candidates || []).forEach((f) => {
      if (f.timestamp_sec == null) return;
      const key = Math.round(f.timestamp_sec * 2) / 2; // bucket to 0.5s
      if (!byTimestamp[key]) byTimestamp[key] = new Set();
      byTimestamp[key].add(c.character_name);
    });
  });

  return Object.entries(byTimestamp)
    .filter(([, chars]) => chars.size > 1)
    .map(([t]) => parseFloat(t))
    .sort((a, b) => a - b);
}

function MultiFaceWarning({ characters }: { characters: CharacterProfile[] }) {
  const overlaps = detectMultiFaceOverlaps(characters);
  if (overlaps.length === 0) return null;

  const shown = overlaps.slice(0, 8);
  const more = overlaps.length - shown.length;

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-amber-500 text-lg">⚠</span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-500">
              Faces overlap in {overlaps.length} frame{overlaps.length === 1 ? "" : "s"}
            </p>
            <p className="text-sm text-muted">
              Detection may have mixed identities across speakers.
            </p>
          </div>
        </div>
        <div className="text-xs text-muted sm:pl-[3.25rem]">
          Timestamps:{" "}
          {shown.map((t) => `${t.toFixed(1)}s`).join(", ")}
          {more > 0 && ` … and ${more} more`}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// FEATURE 20: Compare with Original (side-by-side player)
// ============================================================
function ComparePlayer({
  originalFile,
  dubbedUrl,
}: {
  originalFile: File | null;
  dubbedUrl: string | null;
}) {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!originalFile) {
      setOriginalUrl(null);
      return;
    }
    const url = URL.createObjectURL(originalFile);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalFile]);

  if (!originalUrl || !dubbedUrl) return null;

  return (
    <div>
      <Label>Compare with Original</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        <div>
          <p className="text-xs text-muted mb-1">Original</p>
          <video
            controls
            className="w-full rounded-lg border border-border"
            src={originalUrl}
          />
        </div>
        <div>
          <p className="text-xs text-muted mb-1">Dubbed</p>
          <video
            controls
            className="w-full rounded-lg border border-border"
            src={dubbedUrl}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FEATURE 3: Pre-Flight Quality Check
// ============================================================
type IssueSeverity = "critical" | "warning";

type PreFlightIssue = {
  severity: IssueSeverity;
  character: string;
  message: string;
};

function buildPreFlightIssues(
  characters: CharacterProfile[]
): PreFlightIssue[] {
  const issues: PreFlightIssue[] = [];

  if (characters.length === 0) {
    issues.push({
      severity: "critical",
      character: "-",
      message: "No characters detected in the video.",
    });
    return issues;
  }

  const totalNoVoice = characters.filter((c) => !c.voice_clip_url).length;
  const totalNoGender = characters.filter(
    (c) => c.gender !== "male" && c.gender !== "female"
  ).length;

  // Critical: EVERY character has no voice
  if (totalNoVoice === characters.length) {
    issues.push({
      severity: "critical",
      character: "-",
      message:
        "All characters are missing voice clips. Dub cannot proceed without voice references.",
    });
  }

  // Critical: EVERY character has no gender
  if (totalNoGender === characters.length) {
    issues.push({
      severity: "critical",
      character: "-",
      message:
        "No character has a confirmed gender. Set gender for at least one character to proceed.",
    });
  }

  // Per-character warnings
  for (const c of characters) {
    const name = c.character_name || "Unknown";

    // Warning: no face
    const hasFace =
      (c.face_candidates?.length ?? 0) > 0 || !!c.custom_face_url;
    if (!hasFace) {
      issues.push({
        severity: "warning",
        character: name,
        message: "No face detected — consider uploading a custom image.",
      });
    }

    // Warning: no voice (when not all are missing)
    if (!c.voice_clip_url && totalNoVoice < characters.length) {
      issues.push({
        severity: "warning",
        character: name,
        message: "No voice clip extracted.",
      });
    }

    // Warning: gender unknown (when not all are unknown)
    if (
      (c.gender !== "male" && c.gender !== "female") &&
      totalNoGender < characters.length
    ) {
      issues.push({
        severity: "warning",
        character: name,
        message: "Gender is unknown — Hindi grammar may default to neutral.",
      });
    }

    // Warning: voice clip short
    if (c.voice_clip_url && (c.total_duration_sec || 0) < 2.0) {
      issues.push({
        severity: "warning",
        character: name,
        message: `Voice clip is very short (${c.total_duration_sec}s). Ideal is 3s+.`,
      });
    }

    // Warning: generic name
    if (/^Character_\d+$/i.test(c.character_name || "")) {
      issues.push({
        severity: "warning",
        character: name,
        message: "Name is auto-generated — rename for clarity.",
      });
    }
  }

  return issues;
}

function PreFlightCheck({
  characters,
  onDub,
  isDubbing,
}: {
  characters: CharacterProfile[];
  onDub: () => void;
  isDubbing: boolean;
}) {
  const issues = buildPreFlightIssues(characters);

  const criticalIssues = issues.filter((i) => i.severity === "critical");
  const warningIssues = issues.filter((i) => i.severity === "warning");

  const hasCritical = criticalIssues.length > 0;
  const hasWarnings = warningIssues.length > 0;

  // Success state: everything is fine
  if (!hasCritical && !hasWarnings) {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Check size={20} className="text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-emerald-500">Ready to Dub</p>
              <p className="text-xs sm:text-sm text-muted">
                All {characters.length} character
                {characters.length === 1 ? "" : "s"} passed quality checks.
              </p>
            </div>
            <Button
              size="lg"
              onClick={onDub}
              disabled={isDubbing}
              className="gap-2 w-full sm:w-auto shrink-0"
            >
              <Wand2 size={16} /> Start Dubbing
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Critical state: block dub
  if (hasCritical) {
    return (
      <Card className="border-red-500/40 bg-red-500/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <X size={20} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-red-500">
                Can&apos;t dub yet — {criticalIssues.length} critical issue
                {criticalIssues.length === 1 ? "" : "s"}
              </p>
              <p className="text-xs sm:text-sm text-muted">
                Fix these before starting the dub.
              </p>
            </div>
            <Button size="lg" disabled className="gap-2 w-full sm:w-auto shrink-0">
              <Wand2 size={16} /> Start Dubbing
            </Button>
          </div>

          <div className="space-y-1.5 pl-13">
            {criticalIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-red-500 shrink-0 mt-0.5">●</span>
                <span className="text-muted">{issue.message}</span>
              </div>
            ))}
          </div>

          {/* Still show warnings below */}
          {hasWarnings && (
            <div className="border-t border-border pt-3 space-y-1.5">
              <p className="text-xs font-medium text-muted">
                Additional warnings:
              </p>
              {warningIssues.slice(0, 5).map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-yellow-500 shrink-0 mt-0.5">●</span>
                  <span className="text-muted">
                    <span className="font-medium">{issue.character}:</span>{" "}
                    {issue.message}
                  </span>
                </div>
              ))}
              {warningIssues.length > 5 && (
                <p className="text-xs text-muted pl-3">
                  ... and {warningIssues.length - 5} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Warning state: allow dub but flag issues
  return (
    <Card className="border-yellow-500/40 bg-yellow-500/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <span className="text-yellow-500 text-lg">⚠</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-yellow-500">
              {warningIssues.length} warning
              {warningIssues.length === 1 ? "" : "s"}
            </p>
            <p className="text-xs sm:text-sm text-muted">
              You can still dub, but quality may be reduced.
            </p>
          </div>
          <Button
            size="lg"
            onClick={onDub}
            disabled={isDubbing}
            variant="outline"
            className="gap-2 w-full sm:w-auto shrink-0"
          >
            <Wand2 size={16} /> Dub Anyway
          </Button>
        </div>

        <div className="space-y-1.5 pl-13">
          {warningIssues.slice(0, 6).map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-yellow-500 shrink-0 mt-0.5">●</span>
              <span className="text-muted">
                <span className="font-medium">{issue.character}:</span>{" "}
                {issue.message}
              </span>
            </div>
          ))}
          {warningIssues.length > 6 && (
            <p className="text-xs text-muted pl-3">
              ... and {warningIssues.length - 6} more
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
// ============================================================
// FEATURE 2: Ready Checklist Component
// ============================================================
type ChecklistItem = {
  label: string;
  status: "pass" | "warn" | "fail";
  detail?: string;
};

function ReadyChecklist({ items }: { items: ChecklistItem[] }) {
  const [expanded, setExpanded] = useState(true);

  const passCount = items.filter((i) => i.status === "pass").length;
  const failCount = items.filter((i) => i.status === "fail").length;
  const warnCount = items.filter((i) => i.status === "warn").length;

  // If everything passes, show minimal collapsed version
  const allGood = passCount === items.length;

  return (
    <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-xs font-medium"
      >
        <span className="flex items-center gap-1.5">
          {allGood ? (
            <>
              <span className="text-emerald-500">✓</span>
              Ready to dub
            </>
          ) : failCount > 0 ? (
            <>
              <span className="text-red-500">✗</span>
              {failCount} issue{failCount > 1 ? "s" : ""} to fix
            </>
          ) : (
            <>
              <span className="text-yellow-500">⚠</span>
              {warnCount} warning{warnCount > 1 ? "s" : ""}
            </>
          )}
        </span>
        <span className="text-muted">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="space-y-1 pt-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 mt-0.5">
                {item.status === "pass" && (
                  <span className="text-emerald-500">✓</span>
                )}
                {item.status === "warn" && (
                  <span className="text-yellow-500">⚠</span>
                )}
                {item.status === "fail" && (
                  <span className="text-red-500">✗</span>
                )}
              </span>
              <div className="flex-1">
                <span
                  className={cn(
                    item.status === "pass" && "text-muted",
                    item.status === "warn" && "text-yellow-500",
                    item.status === "fail" && "text-red-500"
                  )}
                >
                  {item.label}
                </span>
                {item.detail && (
                  <span className="text-muted ml-1">({item.detail})</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Character Card Component
// ============================================================
function CharacterCard({
  char,
  apiUrl,
  targetLang,
  onUpdate,
  allSegments,
  segmentEdits,
  onSegmentEdit,
  segmentPreview,
  onSegmentPreview,
  fileId,
  nameSuggestions,
  onVoiceSavedToLibrary,
  voiceLibrary,
  globalFormality,
}: {
  char: CharacterProfile;
  apiUrl: string;
  targetLang: string;
  onUpdate: (updates: Partial<CharacterProfile>) => void;
  allSegments: SegmentRecord[];
  segmentEdits: Record<number, string>;
  onSegmentEdit: (segIdx: number, newText: string) => void;
  segmentPreview: Record<
    number,
    { loading: boolean; url?: string; error?: string }
  >;
  onSegmentPreview: (segIdx: number, segText: string) => void;
  fileId: string;
  nameSuggestions: string[];
  onVoiceSavedToLibrary: () => void;
  voiceLibrary: VoiceLibraryItem[];
  globalFormality: FormalityLevel;
}) {
  const [showSegments, setShowSegments] = useState(false);

  const mySegments = allSegments
    .map((s, idx) => ({ ...s, _idx: idx }))
    .filter(
      (s) =>
        s.character === char.character_name ||
        (!s.character && s.speaker === char.speaker_id),
    );
  const [playing, setPlaying] = useState(false);
  const safeName = char.character_name || "?";
  const initials = safeName.slice(0, 2).toUpperCase();
  const playVoice = () => {
    if (!char.voice_clip_url) return;
    const audio = new Audio(`${apiUrl}${char.voice_clip_url}`);
    audio.play();
    setPlaying(true);
    audio.onended = () => setPlaying(false);
  };

  return (
    <Card className="overflow-hidden">
      <div
        className="relative w-full aspect-[4/5] overflow-hidden"
        style={{
          background: char.face?.dominant_color
            ? `linear-gradient(135deg, ${char.face.dominant_color}, #000)`
            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
        }}
      >
        {char.face?.image_url ? (
          <Image
            src={`${apiUrl}${char.face.image_url}`}
            alt={char.character_name || "Character portrait"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30">
              {initials}
            </div>
          </div>
        )}

        {/* soft bottom gradient so the name overlay reads clearly */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        {/* character name overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
          <div className="min-w-0">
            <p className="text-white font-semibold text-base sm:text-lg leading-tight truncate drop-shadow-md">
              {char.character_name || "Unknown"}
            </p>
            {char.gender && char.gender !== "unknown" && (
              <p className="text-white/70 text-[11px] leading-tight capitalize drop-shadow-md">
                {char.gender}
              </p>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <Label className="text-xs">Character Name</Label>
          {/* FEATURE 2: Ready Checklist */}
          {(() => {
            const hasFace =
              (char.face_candidates?.length ?? 0) > 0 || !!char.custom_face_url;
            const hasVoice = !!char.voice_clip_url;
            const genderSet =
              char.gender === "male" || char.gender === "female";
            const nameConfirmed = !/^Character_\d+$/i.test(
              char.character_name || ""
            ) && (char.character_name || "").trim().length > 0;

            // Check voice clip duration if we can estimate it from total_duration_sec
            // (approximation — backend generates ~4s reference clips)
            const estimatedClipSec = Math.min(char.total_duration_sec || 0, 4);

            const items: ChecklistItem[] = [
              hasFace
                ? {
                    label: "Face detected",
                    status: "pass",
                    detail: char.custom_face_url
                      ? "custom uploaded"
                      : `${char.face_candidates?.length ?? 0} candidates`,
                  }
                : {
                    label: "No face detected",
                    status: "fail",
                    detail: "upload one below",
                  },
              hasVoice
                ? estimatedClipSec >= 3
                  ? {
                      label: "Voice clip extracted",
                      status: "pass",
                      detail: `${char.total_duration_sec}s`,
                    }
                  : {
                      label: "Voice clip short",
                      status: "warn",
                      detail: `${char.total_duration_sec}s (rec. 3s+)`,
                    }
                : {
                    label: "No voice clip",
                    status: "fail",
                  },
              genderSet
                ? {
                    label: "Gender set",
                    status: "pass",
                    detail: char.gender,
                  }
                : {
                    label: "Gender unknown",
                    status: "fail",
                    detail: "set below",
                  },
              nameConfirmed
                ? {
                    label: "Name confirmed",
                    status: "pass",
                    detail: char.character_name,
                  }
                : {
                    label: "Name is generic",
                    status: "warn",
                    detail: "rename for consistency",
                  },
            ];

            return <ReadyChecklist items={items} />;
          })()}
          <CharacterNameAutocomplete
            value={char.character_name || ""}
            suggestions={nameSuggestions}
            onChange={(next) => onUpdate({ character_name: next })}
            placeholder="Character name"
          />
        </div>

                {/* FEATURE 1: Gender dropdown */}
        <div>
          <Label className="text-xs">Gender</Label>
          <select
            value={char.gender || "unknown"}
            onChange={(e) => onUpdate({ gender: e.target.value })}
            className="flex h-9 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm mt-1"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unknown">Unknown</option>
          </select>
          <p className="text-[10px] text-muted mt-1">
            Affects Hindi verb endings and voice prosody
          </p>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {char.age_range && (
            <span className="px-2 py-0.5 rounded-full bg-card border border-border">
              {char.age_range}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-card border border-border">
            {char.total_segments} lines
          </span>
          <span className="px-2 py-0.5 rounded-full bg-card border border-border">
            {char.total_duration_sec}s
          </span>
        </div>

        {(char.personality_traits?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1">
            {char.personality_traits.slice(0, 4).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* FEATURE 4: Voice Style Selector */}
        <div>
          <Label className="text-xs">Voice Style</Label>
          <select
            value={char.voice_style_override || "auto"}
            onChange={(e) =>
              onUpdate({ voice_style_override: e.target.value })
            }
            className="flex h-9 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm mt-1"
          >
            <option value="auto">
              Auto{char.speaking_style ? ` (${char.speaking_style.slice(0, 30)})` : ""}
            </option>
            <option value="neutral">Neutral</option>
            <option value="angry">Angry</option>
            <option value="sad">Sad</option>
            <option value="excited">Excited</option>
            <option value="whispered">Whispered</option>
            <option value="sarcastic">Sarcastic</option>
            <option value="screaming">Screaming</option>
            <option value="affectionate">Affectionate</option>
          </select>
          <p className="text-[10px] text-muted mt-1">
            {char.speaking_style
              ? `Detected: "${char.speaking_style}"`
              : "Overrides the auto-detected style for all lines"}
          </p>
        </div>

        {/* SESSION 1: Character Voice assignment */}
        <div>
          <Label className="text-xs">Character Voice</Label>
          <select
            value={char.assigned_voice_id ?? ""}
            onChange={(e) =>
              onUpdate({
                assigned_voice_id: e.target.value || null,
              })
            }
            className="flex h-9 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm mt-1"
          >
            <option value="">Auto (use voice from video)</option>
            {voiceLibrary.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.gender ? ` (${v.gender}` : ""}
                {v.speaking_style ? ` · ${v.speaking_style})` : v.gender ? ")" : ""}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted mt-1">
            {char.assigned_voice_id
              ? "Using saved voice from library"
              : "Extracted from this video"}
          </p>
        </div>

        {/* SESSION 1: Formality (translation register) */}
        <div>
          <Label className="text-xs">Formality</Label>
          <select
            value={char.assigned_formality ?? "auto"}
            onChange={(e) =>
              onUpdate({
                assigned_formality: e.target.value as
                  | "auto"
                  | "formal"
                  | "informal"
                  | "intimate",
              })
            }
            className="flex h-9 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm mt-1"
          >
            <option value="auto">Auto (match context)</option>
            <option value="formal">Formal — respectful</option>
            <option value="informal">Informal — casual</option>
            <option value="intimate">Intimate — close</option>
          </select>
          <p className="text-[10px] text-muted mt-1">
            {(char.assigned_formality ?? "auto") === "auto" &&
            globalFormality !== "auto"
              ? `Using default: ${globalFormality}`
              : "How this character addresses others"}
          </p>
        </div>

        {/* PHASE 5: Pitch offset (semitones) */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Pitch</Label>
            <span className="text-[10px] text-muted font-mono">
              {(() => {
                const v = char.pitchOffset ?? 0;
                if (Math.abs(v) < 0.5) return "Natural";
                if (v > 0) return `Higher +${v}`;
                return `Deeper ${v}`;
              })()}
            </span>
          </div>
          <input
            type="range"
            min={-6}
            max={6}
            step={1}
            value={char.pitchOffset ?? 0}
            onChange={(e) =>
              onUpdate({ pitchOffset: Number(e.target.value) })
            }
            className="w-full mt-2 accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted mt-0.5">
            <span>Deeper</span>
            <span>Natural</span>
            <span>Higher</span>
          </div>
          <p className="text-[10px] text-muted mt-1">
            Shift the character&apos;s voice up or down in semitones
          </p>
        </div>

        {/* FEATURE 5: Live Translation Preview */}
        <PreviewTranslation
          character={char}
          apiUrl={apiUrl}
          targetLang={targetLang}
        />

        {Object.keys(char.relationships || {}).length > 0 && (
          <div className="text-xs text-muted">
            {Object.entries(char.relationships).slice(0, 2).map(([name, rel]) => (
              <div key={name}>→ {name}: {rel}</div>
            ))}
          </div>
        )}

        {char.voice_clip_url && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={playVoice}
              className="flex items-center justify-center gap-2 text-xs py-2 rounded-lg border border-border hover:bg-accent/5"
            >
              {playing ? (
                <Volume2 size={14} className="text-primary animate-pulse" />
              ) : (
                <Play size={14} />
              )}
              {playing ? "Playing…" : "Original"}
            </button>
            <ClonePreviewButton
              char={char}
              apiUrl={apiUrl}
              targetLang={targetLang}
            />
          </div>
        )}
        
        {/* FEATURE 3: record a replacement reference */}
        <VoiceRecorderButton
          char={char}
          fileId={fileId}
          onSaved={(url) =>
            onUpdate({
              voice_clip_url: url,
            })
          }
          onAutoSavedToLibrary={onVoiceSavedToLibrary}
        />
        
        {/* FEATURE 21: save this character's voice to the library */}
        <SaveToLibraryButton
          char={char}
          onSaved={() => {
            // Parent bumps the refresh token through a callback prop
          }}
          notifyParent={onVoiceSavedToLibrary}
        />

        {(char.sample_lines?.length ?? 0) > 0 && (
          <div className="text-xs text-muted border-l-2 border-border pl-2">
            &ldquo;{(char.sample_lines[0] || "").slice(0, 80)}...&rdquo;
          </div>
        )}
        {/* FEATURE 8 + 15: per-segment editing and preview */}
        {mySegments.length > 0 && (
          <div className="border-t border-border pt-3">
            <button
              onClick={() => setShowSegments((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-medium"
            >
              <span>
                {showSegments ? "Hide" : "Edit"} {mySegments.length} line
                {mySegments.length === 1 ? "" : "s"}
              </span>
              <span className="text-muted">{showSegments ? "▲" : "▼"}</span>
            </button>

            {showSegments && (
              <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                {mySegments.map((seg) => {
                  const current = segmentEdits[seg._idx] ?? seg.text;
                  const isEdited = current !== seg.text;
                  const pv = segmentPreview[seg._idx];
                  return (
                    <div
                      key={seg._idx}
                      className="rounded-lg border border-border bg-card/40 p-2 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-muted">
                        <span>
                          {seg.start.toFixed(1)}s – {seg.end.toFixed(1)}s
                        </span>
                        {isEdited && (
                          <span className="text-primary">edited</span>
                        )}
                      </div>
                      <Input
                        value={current}
                        onChange={(e) =>
                          onSegmentEdit(seg._idx, e.target.value)
                        }
                        className="text-xs h-8"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!char.voice_clip_url || pv?.loading}
                          onClick={() => onSegmentPreview(seg._idx, current)}
                          className="gap-1 h-7 text-[11px]"
                        >
                          {pv?.loading ? "Generating…" : "▶ Preview"}
                        </Button>
                        {isEdited && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSegmentEdit(seg._idx, seg.text)}
                            className="h-7 text-[11px]"
                          >
                            Reset
                          </Button>
                        )}
                        {pv?.error && (
                          <span className="text-[10px] text-red-500 truncate">
                            {pv.error}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// ============================================================
// FEATURE 4: Character name input with autocomplete from library
// ============================================================
function CharacterNameAutocomplete({
  value,
  suggestions,
  onChange,
  placeholder = "Character name",
}: {
  value: string;
  suggestions: string[];
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const query = value.trim().toLowerCase();
  const filtered = suggestions
    .filter((s) => s.toLowerCase() !== query)
    .filter((s) => (query ? s.toLowerCase().includes(query) : true))
    .slice(0, 8);

  return (
    <div ref={wrapRef} className="relative mt-1">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
      />
      {focused && filtered.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange(s);
                setFocused(false);
              }}
              className="w-full text-left text-xs px-3 py-2 hover:bg-accent/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Custom inline audio player — replaces the native <audio controls>
// so the Voice Library doesn't render browser-default players.
// ============================================================
function InlineAudioPlayer({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    setErrored(false);
    setCurrent(0);
    setDuration(0);
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnded = () => {
      setPlaying(false);
      el.currentTime = 0;
      setCurrent(0);
    };
    const onErr = () => setErrored(true);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onErr);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onErr);
    };
  }, [src]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setErrored(true));
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * duration;
    setCurrent(el.currentTime);
  };

  const fmt = (s: number) => {
    if (!isFinite(s) || s <= 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  if (errored) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 text-xs text-red-500/80 bg-red-500/5 border border-red-500/20 rounded-full px-3 h-9",
          className
        )}
      >
        <Volume2 size={14} />
        Audio unavailable
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className={cn(
          "w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-all",
          playing
            ? "bg-primary text-primary-fg shadow-md shadow-primary/30"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        )}
      >
        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div
          onClick={seek}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="flex-1 min-w-[60px] h-1.5 rounded-full bg-border/70 cursor-pointer relative group"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        <span className="text-[10px] sm:text-[11px] text-muted tabular-nums shrink-0 font-mono">
          {fmt(current)} / {fmt(duration)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// FEATURE 21: Voice Library panel
// ============================================================
function VoiceLibraryPanel({
  refreshToken,
  onVoiceLibraryLoaded,
}: {
  refreshToken: number;
  onVoiceLibraryLoaded: (items: VoiceLibraryItem[]) => void;
}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["voiceLibrary"],
    queryFn: api.listVoiceLibrary,
    refetchOnMount: "always",
    staleTime: 0,
  });

  useEffect(() => {
    if (refreshToken > 0) refetch();
  }, [refreshToken, refetch]);

  useEffect(() => {
    if (data) onVoiceLibraryLoaded(data as VoiceLibraryItem[]);
  }, [data, onVoiceLibraryLoaded]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-xs text-muted">Loading library…</CardContent>
      </Card>
    );
  }

  const items = data ?? [];
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Mic2 size={16} className="text-primary" />
              Voice Library
            </CardTitle>
            <CardDescription className="mt-1">
              {items.length} saved voice{items.length === 1 ? "" : "s"} — reusable across projects
            </CardDescription>
          </div>
          <span className="hidden sm:inline text-[10px] text-muted whitespace-nowrap shrink-0">
            Assign from a character card →
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map((it) => {
          const initials = (it.name || "?").slice(0, 2).toUpperCase();
          const genderLabel =
            it.gender === "male" ? "Male"
            : it.gender === "female" ? "Female"
            : it.gender === "unknown" ? null
            : it.gender;
          return (
            <div
              key={it.id}
              className="group relative rounded-xl border border-border bg-card/40 hover:bg-card/70 hover:border-primary/30 transition-colors p-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                {/* Avatar + meta */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold text-white shadow-sm",
                      it.gender === "male"
                        ? "bg-gradient-to-br from-sky-500 to-indigo-600"
                        : it.gender === "female"
                        ? "bg-gradient-to-br from-pink-500 to-rose-600"
                        : "bg-gradient-to-br from-slate-500 to-slate-700"
                    )}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold truncate">{it.name}</p>
                      {genderLabel && (
                        <span
                          className={cn(
                            "text-[9px] font-medium px-1.5 py-0.5 rounded-full border shrink-0 uppercase tracking-wide",
                            it.gender === "male"
                              ? "border-sky-500/40 text-sky-400 bg-sky-500/10"
                              : "border-pink-500/40 text-pink-400 bg-pink-500/10"
                          )}
                        >
                          {genderLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted truncate mt-0.5">
                      {[
                        it.speaking_style,
                        it.source_character_name ? `from ${it.source_character_name}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No metadata"}
                    </p>
                  </div>
                </div>

                {/* Player */}
                <InlineAudioPlayer
                  src={resolveAudioUrl(it.audio_url, API_URL)}
                  className="w-full lg:w-72 shrink-0"
                />

                {/* Delete */}
                <button
                  type="button"
                  aria-label="Delete voice"
                  title="Delete this saved voice"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!confirm(`Delete voice "${it.name}"? This cannot be undone.`)) return;
                    try {
                      await api.deleteVoiceLibraryItem(it.id);
                      toast(`Deleted "${it.name}"`, "success");
                      refetch();
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Delete failed";
                      toast(msg, "error");
                    }
                  }}
                  className="self-end lg:self-auto p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================================
// FEATURE 21: Save character voice to library
// ============================================================
function SaveToLibraryButton({
  char,
  onSaved,
  notifyParent,
}: {
  char: CharacterProfile;
  onSaved: () => void;
  notifyParent: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const run = async () => {
    if (!char.voice_clip_url) return;
    if (char.voice_clip_url.includes("/custom_refs/")) {
      toast("Recorded voices are saved to the library automatically.", "info");
      return;
    }

    const suggested = (char.character_name || "").trim() || "Saved Voice";
    const name = window.prompt(
      "Name this voice in your library:",
      suggested
    );
    if (!name || !name.trim()) return;

    setSaving(true);
    try {
      await api.saveToVoiceLibrary({
        name: name.trim(),
        audio_path: char.voice_clip_url,
        gender: char.gender,
        speaking_style: char.speaking_style,
        archetype: char.archetype,
        sample_line: char.sample_lines?.[0],
        personality_traits: char.personality_traits,
        source_character_name: char.character_name,
      });
      toast(`Saved "${name.trim()}" to library`, "success");
      onSaved();
      notifyParent();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Save failed";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={run}
      disabled={saving || !char.voice_clip_url || char.voice_clip_url.includes("/custom_refs/")}
      className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg border border-border hover:bg-accent/5 disabled:opacity-50"
      title="Save this character's voice for reuse in other projects"
    >
      <Plus size={14} />
      {saving ? "Saving…" : "Save to Library"}
    </button>
  );
}

// ============================================================
// FEATURE 3: Custom voice recording (mic)
// ============================================================
function VoiceRecorderButton({
  char,
  fileId,
  onSaved,
  onAutoSavedToLibrary,
}: {
  char: CharacterProfile;
  fileId: string;
  onSaved: (url: string) => void;
  onAutoSavedToLibrary?: () => void;
}) {
  type Phase = "idle" | "countdown" | "recording" | "uploading" | "error";
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const RECORD_MS = 8000;
  const COUNTDOWN_FROM = 3;

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const start = async () => {
    setError(null);
    setPhase("countdown");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      for (let i = COUNTDOWN_FROM; i > 0; i--) {
        setCountdown(i);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(0);

      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stopStream();
        try {
          setPhase("uploading");
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
          const res = await api.uploadVoiceReference({
            blob,
            file_id: fileId,
            character_name: char.character_name,
          });
          onSaved(res.url);

          // Auto-save recorded voice to library
          try {
            const autoName = `${char.character_name || "Recorded"} — ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
            await api.saveToVoiceLibrary({
              name: autoName,
              audio_path: res.url,
              gender: char.gender || "unknown",
              speaking_style: char.speaking_style,
              archetype: char.archetype,
              sample_line: char.sample_lines?.[0],
              personality_traits: char.personality_traits,
              source_character_name: char.character_name,
            });
            onAutoSavedToLibrary?.();
          } catch (libErr: unknown) {
            const libMessage = libErr instanceof Error ? libErr.message : "Auto-save to library failed";
            console.warn("Auto-save to library failed:", libMessage);
          }

          setPhase("idle");
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Upload failed";
          setError(message);
          setPhase("error");
        }
      };

      mr.start();
      setPhase("recording");
      setElapsed(0);

      const startedAt = Date.now();
      const tick = setInterval(() => {
        setElapsed(Date.now() - startedAt);
      }, 100);

      setTimeout(() => {
        clearInterval(tick);
        if (mr.state !== "inactive") mr.stop();
      }, RECORD_MS);
    } catch (error: unknown) {
      stopStream();
      const message = error instanceof Error ? error.message : "Microphone access denied";
      setError(message);
      setPhase("error");
    }
  };

  const cancel = () => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      try {
        mediaRef.current.stop();
      } catch {}
    }
    stopStream();
    setPhase("idle");
    setElapsed(0);
    setCountdown(0);
  };

  const label =
    phase === "idle"
      ? "Record"
      : phase === "countdown"
      ? `Starting in ${countdown}…`
      : phase === "recording"
      ? `Recording ${(elapsed / 1000).toFixed(1)}s`
      : phase === "uploading"
      ? "Saving…"
      : "Retry";

  const busy = phase === "countdown" || phase === "recording" || phase === "uploading";

  return (
    <div className="space-y-1">
      <button
        onClick={busy ? cancel : start}
        disabled={phase === "uploading" || !fileId}
        className={`w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg border transition ${
          phase === "recording"
            ? "border-red-500 bg-red-500/10 text-red-500"
            : "border-border hover:bg-accent/5"
        } disabled:opacity-50`}
        title={
          fileId
            ? "Record 8 seconds of clean voice for this character"
            : "Re-analyze the video first"
        }
      >
        <Mic2 size={14} className={phase === "recording" ? "animate-pulse" : ""} />
        {label}
      </button>
      {error && (
        <p className="text-[10px] text-red-500 leading-tight">{error}</p>
      )}
    </div>
  );
}

// ============================================================
// FEATURE 9: Voice A/B Comparison — Chatterbox clone preview
// ============================================================
function ClonePreviewButton({
  char,
  apiUrl,
  targetLang,
}: {
  char: CharacterProfile;
  apiUrl: string;
  targetLang: string;
}) {
  const [loading, setLoading] = useState(false);

  const sampleLine =
    (char.sample_lines?.[0] || "").trim() || "This is a short preview line.";

  const run = async () => {
    if (!char.voice_clip_url) return;
    setLoading(true);
    try {
      const res = await api.previewTTS({
        text: sampleLine,
        reference_path: char.voice_clip_url,
        language: targetLang,
        character_name: char.character_name,
        character_gender: char.gender,
        emotion:
          char.voice_style_override && char.voice_style_override !== "auto"
            ? char.voice_style_override
            : "neutral",
        speaking_style: char.speaking_style || "natural",
        speaker_id: char.speaker_id || "",
      });
      const audio = new Audio(`${apiUrl}${res.url}`);
      await audio.play();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Preview failed";
      console.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={run}
      disabled={loading}
      className="flex items-center justify-center gap-2 text-xs py-2 rounded-lg border border-border hover:bg-accent/5 disabled:opacity-50"
      title={sampleLine}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin text-primary" />
      ) : (
        <Play size={14} />
      )}
      {loading ? "Generating…" : "Clone"}
    </button>
  );
}

// ============================================================
// FEATURE 5: Live Translation Preview Component
// ============================================================
function PreviewTranslation({
  character,
  apiUrl,
  targetLang,
}: {
  character: CharacterProfile;
  apiUrl: string;
  targetLang: string;
}) {
  const [sampleLine, setSampleLine] = useState(
    character.sample_lines?.[0] || ""
  );
  const [preview, setPreview] = useState<{
    target_text: string;
    translated_text?: string;
    selected_variant?: string;
    candidates?: Array<{ variant: string; short_text: string }>;
    provider?: string;
    cache_hit?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const callPreview = async (bypassCache: boolean) => {
    if (!sampleLine.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("text", sampleLine);
      fd.append("target_language", targetLang);
      fd.append("character_name", character.character_name || "");
      fd.append("character_gender", character.gender || "unknown");
      fd.append(
        "speaking_style",
        character.voice_style_override &&
          character.voice_style_override !== "auto"
          ? character.voice_style_override
          : character.speaking_style || "natural"
      );
      fd.append("emotion", character.voice_style_override || "neutral");
      fd.append("speaker_id", character.speaker_id || "");
      fd.append("bypass_cache", bypassCache ? "true" : "false");

      const res = await fetch(`${apiUrl}/preview/translate`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Preview failed");
      }
      const data = await res.json();
      setPreview(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Preview failed";
      console.error("Preview failed:", message);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <Label className="text-xs">Live Translation Preview</Label>
      <Input
        value={sampleLine}
        onChange={(e) => setSampleLine(e.target.value)}
        placeholder="Type a sample line to preview..."
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !sampleLine.trim()}
          onClick={() => callPreview(false)}
        >
          {loading ? "Translating..." : "Preview Translation"}
        </Button>
        {preview && (
          <Button
            size="sm"
            variant="ghost"
            disabled={loading}
            onClick={() => callPreview(true)}
          >
            Regenerate
          </Button>
        )}
      </div>

      {preview && (
        <div className="rounded-lg border border-border bg-card/40 p-2 space-y-1">
          <p className="text-sm">{preview.target_text}</p>
          {preview.translated_text &&
            preview.translated_text !== preview.target_text && (
              <p className="text-xs text-muted">
                Fuller: {preview.translated_text}
              </p>
            )}
          <div className="flex items-center gap-2 text-[10px] text-muted">
            {preview.selected_variant && (
              <span>variant: {preview.selected_variant}</span>
            )}
            {preview.provider && <span>via: {preview.provider}</span>}
            {preview.cache_hit && <span className="text-emerald-500">cached</span>}
          </div>

          {preview.candidates && preview.candidates.length > 1 && (
            <button
              onClick={() => setShowAlternatives((v) => !v)}
              className="text-[10px] text-primary hover:underline"
            >
              {showAlternatives ? "Hide alternatives" : "See alternatives"}
            </button>
          )}

          {showAlternatives && preview.candidates && (
            <div className="space-y-1 pt-1">
              {preview.candidates
                .filter((c) => c.short_text !== preview.target_text)
                .map((c, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted border-l-2 border-border pl-2"
                  >
                    <span className="font-medium">{c.variant}:</span>{" "}
                    {c.short_text}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Local-mode hardware recommendation banner
// ============================================================
function HardwareBanner() {
  const hw = useHardwareInfo();
  const { features } = useRuntimeMode();
  if (!hw || !hw.gpu_name) return null;
  const isLocal = features ? features.local_free_dubbing : false;
  if (!isLocal) return null;
  return (
    <div className="rounded-lg border border-border bg-card/60 px-3 py-2 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-medium">{String(hw.gpu_name)}</span>
      <span className="text-muted">· {hw.gpu_vram_mb ?? 0} MB VRAM</span>
      <span className="text-muted">· max clip ~{hw.recommended_max_video_seconds ?? 0}s</span>
      <span className="text-muted">· {hw.recommended_quality ?? "standard"} quality</span>
      {hw.tier === "low_vram" && (
        <span className="text-amber-500">· low VRAM: short clips only</span>
      )}
    </div>
  );
}