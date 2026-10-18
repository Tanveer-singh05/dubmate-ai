path = r"C:\DubMate AI\frontend\app\(app)\studio\page.tsx"
src = open(path, encoding="utf-8").read()

# Anchor: the closing </div> of the Formality block, followed by the
# FEATURE 5 comment. We insert between them.
old_block = '''          <p className="text-[10px] text-muted mt-1">
            {(char.assigned_formality ?? "auto") === "auto" &&
            globalFormality !== "auto"
              ? `Using default: ${globalFormality}`
              : "How this character addresses others"}
          </p>
        </div>

        {/* FEATURE 5: Live Translation Preview */}'''

new_block = '''          <p className="text-[10px] text-muted mt-1">
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
            Shift the character's voice up or down in semitones
          </p>
        </div>

        {/* FEATURE 5: Live Translation Preview */}'''

if "PHASE 5: Pitch offset" in src:
    print("Edit 3 already applied")
elif old_block not in src:
    print("FATAL: Formality block anchor not found")
    import sys; sys.exit(1)
else:
    src = src.replace(old_block, new_block, 1)
    open(path, "w", encoding="utf-8", newline="\n").write(src)
    print("Edit 3 applied: pitch slider added to CharacterCard")
