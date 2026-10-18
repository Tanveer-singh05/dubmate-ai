"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listPresets, createPreset, deletePreset, markPresetUsed,
  type Preset,
} from "@/lib/presets";
import { toast } from "@/components/ui/toast";
import { Save, Trash2, Sparkles } from "lucide-react";

export type DubSettings = {
  targetLang: string;
  sourceLang: string;
  emotionIntensity: string;
  lipsyncQuality: string;
  speakingRate: string;
  asrNoiseFilter: string;
};

export function PresetSelector({
  apiUrl,
  token,
  current,
  onApply,
}: {
  apiUrl: string;
  token: string | null;
  current: DubSettings;
  onApply: (settings: Partial<DubSettings>) => void;
}) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");

  const loadPresets = async () => {
    try {
      const list = await listPresets(apiUrl, token);
      setPresets(list);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load presets";
      toast(message, "error");
    }
  };

  useEffect(() => {
    loadPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = presets.find((p) => p.id === selectedId);

  const applyPreset = async (preset: Preset) => {
    setSelectedId(preset.id);
    onApply({
      targetLang: preset.target_lang,
      sourceLang: preset.source_lang,
      emotionIntensity: preset.emotion_intensity,
      lipsyncQuality: preset.lipsync_quality,
      speakingRate: preset.speaking_rate,
      asrNoiseFilter: preset.asr_noise_filter,
    });
    try {
      await markPresetUsed(apiUrl, token, preset.id);
    } catch {
      // non-fatal
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const created = await createPreset(apiUrl, token, {
        name: saveName.trim(),
        description: saveDesc.trim() || undefined,
        target_lang: current.targetLang,
        source_lang: current.sourceLang,
        emotion_intensity: current.emotionIntensity,
        lipsync_quality: current.lipsyncQuality,
        speaking_rate: current.speakingRate,
        asr_noise_filter: current.asrNoiseFilter,
      });
      toast("Preset saved", "success");
      setShowSave(false);
      setSaveName("");
      setSaveDesc("");
      await loadPresets();
      setSelectedId(created.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save preset";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.is_builtin) return;
    if (!confirm(`Delete preset "${selected.name}"?`)) return;
    try {
      await deletePreset(apiUrl, token, selected.id);
      toast("Preset deleted", "success");
      setSelectedId("");
      await loadPresets();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete preset";
      toast(message, "error");
    }
  };

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-primary" />
        <Label className="text-xs font-medium">Presets</Label>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={selectedId}
          onChange={(e) => {
            const p = presets.find((x) => x.id === e.target.value);
            if (p) applyPreset(p);
            else setSelectedId("");
          }}
          className="flex h-9 rounded-lg border border-border bg-card px-3 py-1.5 text-sm min-w-[220px]"
        >
          <option value="">— Choose a preset —</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.is_builtin ? "★ " : ""}
              {p.name}
            </option>
          ))}
        </select>

        <Button size="sm" variant="outline" onClick={() => setShowSave(true)}>
          <Save size={14} /> Save current
        </Button>

        {selected && !selected.is_builtin && (
          <Button size="sm" variant="ghost" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </Button>
        )}
      </div>

      {selected?.description && (
        <p className="text-[11px] text-muted">{selected.description}</p>
      )}

      {showSave && (
        <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
          <div>
            <Label className="text-xs">Preset name</Label>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. My Hindi Broadcast"
              maxLength={120}
            />
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Input
              value={saveDesc}
              onChange={(e) => setSaveDesc(e.target.value)}
              placeholder="What this preset is for"
              maxLength={500}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !saveName.trim()}>
              {saving ? "Saving..." : "Save preset"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSave(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}