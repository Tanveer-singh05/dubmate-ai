# Search for the CharacterProfile type in both files
import os
for path in [
    r"C:\DubMate AI\frontend\lib\studio-store.ts",
    r"C:\DubMate AI\frontend\app\(app)\studio\page.tsx",
]:
    if not os.path.exists(path): continue
    src = open(path, encoding="utf-8").read().splitlines()
    for i, line in enumerate(src):
        if "CharacterProfile" in line and ("type " in line or "interface " in line or "export" in line):
            print(f"=== {os.path.basename(path)}:{i+1} ===")
            for j in range(i, min(i+25, len(src))):
                print(f"{j+1}: {src[j]}")
            print()
