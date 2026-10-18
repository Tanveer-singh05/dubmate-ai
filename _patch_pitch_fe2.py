# --- studio-store.ts ---
path = r"C:\DubMate AI\frontend\lib\studio-store.ts"
src = open(path, encoding="utf-8").read()

old = '''  // Session 1: per-character voice + formality
  assigned_voice_id?: string | null;
  assigned_formality?: "auto" | "formal" | "informal" | "intimate";'''

new = '''  // Session 1: per-character voice + formality
  assigned_voice_id?: string | null;
  assigned_formality?: "auto" | "formal" | "informal" | "intimate";
  // Phase 5: per-character pitch offset (semitones, -6..+6, 0 = natural)
  pitchOffset?: number;'''

if "pitchOffset" in src:
    print("studio-store.ts: pitchOffset already present")
elif old not in src:
    print("FATAL: studio-store.ts anchor not found")
    import sys; sys.exit(1)
else:
    src = src.replace(old, new, 1)
    open(path, "w", encoding="utf-8", newline="\n").write(src)
    print("studio-store.ts: pitchOffset added")

# --- page.tsx local type ---
path2 = r"C:\DubMate AI\frontend\app\(app)\studio\page.tsx"
src2 = open(path2, encoding="utf-8").read()

old2 = '''  voice_style_override?: string;
};

type AnalysisResult = {'''

new2 = '''  voice_style_override?: string;
  // Phase 5: per-character pitch offset (semitones, -6..+6, 0 = natural)
  pitchOffset?: number;
};

type AnalysisResult = {'''

if "pitchOffset?: number" in src2 and "Phase 5" in src2:
    print("page.tsx local type: pitchOffset already present")
elif old2 not in src2:
    print("WARN: page.tsx local CharacterProfile anchor not found (may not have this type)")
else:
    src2 = src2.replace(old2, new2, 1)
    open(path2, "w", encoding="utf-8", newline="\n").write(src2)
    print("page.tsx local type: pitchOffset added")
