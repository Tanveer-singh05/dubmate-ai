export type Preset = {
  id: string;
  name: string;
  description: string | null;
  target_lang: string;
  source_lang: string;
  emotion_intensity: string;
  lipsync_quality: string;
  speaking_rate: string;
  asr_noise_filter: string;
  voice_style_defaults: Record<string, unknown>;
  advanced: Record<string, unknown>;
  is_builtin: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type PresetPreferences = {
  last_used_preset_id: string | null;
  auto_load_last_preset: boolean;
};

export async function listPresets(
  apiUrl: string,
  token: string | null
): Promise<Preset[]> {
  const res = await fetch(`${apiUrl}/presets`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to load presets");
  return res.json();
}

export async function createPreset(
  apiUrl: string,
  token: string | null,
  body: Partial<Preset> & { name: string; target_lang: string }
): Promise<Preset> {
  const res = await fetch(`${apiUrl}/presets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save preset");
  }
  return res.json();
}

export async function deletePreset(
  apiUrl: string,
  token: string | null,
  presetId: string
): Promise<void> {
  const res = await fetch(`${apiUrl}/presets/${presetId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok && res.status !== 204) {
    throw new Error("Failed to delete preset");
  }
}

export async function markPresetUsed(
  apiUrl: string,
  token: string | null,
  presetId: string
): Promise<PresetPreferences> {
  const res = await fetch(`${apiUrl}/presets/${presetId}/mark-used`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to mark preset used");
  return res.json();
}

export async function getPreferences(
  apiUrl: string,
  token: string | null
): Promise<PresetPreferences> {
  const res = await fetch(`${apiUrl}/presets/preferences`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to load preferences");
  return res.json();
}