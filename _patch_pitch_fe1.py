path = r"C:\DubMate AI\frontend\app\(app)\studio\page.tsx"
src = open(path, encoding="utf-8").read()

old_block = '''    formData.append("global_formality", globalFormality);'''
new_block = '''    formData.append("global_formality", globalFormality);

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
    );'''

if "character_pitch_offsets" in src:
    print("Edit 1 already applied")
elif old_block not in src:
    print("FATAL: global_formality anchor not found")
    import sys; sys.exit(1)
else:
    src = src.replace(old_block, new_block, 1)
    open(path, "w", encoding="utf-8", newline="\n").write(src)
    print("Edit 1 applied: character_pitch_offsets added to /phase1 fetch")
