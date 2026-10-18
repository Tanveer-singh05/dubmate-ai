"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, KeyRound, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { APIKeyCard, ProviderGuide } from "@/components/api-key-card";

const PROVIDERS = [
  { value: "gemini", label: "Google Gemini" },
  { value: "groq", label: "Groq" },
  { value: "openrouter", label: "OpenRouter" },
];

export default function KeysPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["keys"],
    queryFn: api.listKeys,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const [provider, setProvider] = useState("gemini");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setLabel(""); setApiKey(""); setIsDefault(false); setProvider("gemini");
  };

  const addMutation = useMutation({
    mutationFn: () => api.addKey({ provider, label, api_key: apiKey, is_default: isDefault }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["keys"] });
      toast(
        data.last_validation_ok ? "API key added and validated"
          : `Key added, but validation failed: ${data.last_validation_error}`,
        data.last_validation_ok ? "success" : "error"
      );
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast(e instanceof ApiError ? e.message : "Failed to add key", "error"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">API Keys</h1>
          <p className="text-muted">
            Bring your own Gemini / Groq / OpenRouter keys — encrypted at rest
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} /> Add Key
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : !keys || keys.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <KeyRound size={40} className="mx-auto text-muted mb-3 opacity-40" />
            <p className="font-medium mb-1">No API keys yet</p>
            <p className="text-sm text-muted mb-4">Add a Gemini, Groq, or OpenRouter key to start</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus size={14} /> Add your first key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => <APIKeyCard key={k.id} apiKey={k} />)}
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetForm(); }}>
        <div className="p-6 space-y-4">
          <div className="pr-8">
            <h2 className="font-semibold text-lg">Add API Key</h2>
            <p className="text-xs text-muted mt-0.5">
              Your key is encrypted and never logged in plaintext
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
            <div>
              <Label>Provider</Label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <ProviderGuide provider={provider} />

            <div>
              <Label>Label (optional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. My Personal Gemini" />
            </div>

            <div>
              <Label>API Key</Label>
              <Input type="password" value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy… or gsk_… or sk-or-…" required />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-border" />
              Set as default for this provider
            </label>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline"
                onClick={() => { setDialogOpen(false); resetForm(); }} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending || !apiKey} className="flex-1 gap-2">
                {addMutation.isPending ? (
                  <><Loader2 className="animate-spin" size={16} /> Validating…</>
                ) : "Add Key"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}