p = r"C:\DubMate AI\frontend\app\(app)\studio\page.tsx"
src = open(p, encoding="utf-8").read().splitlines()
print("=== lines 250-340 (/phase1 fetch assembly) ===")
for i in range(249, 340):
    if i < len(src):
        print(f"{i+1}: {src[i]}")
