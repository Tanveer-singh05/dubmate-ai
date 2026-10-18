p = r"C:\DubMate AI\frontend\app\(app)\studio\page.tsx"
src = open(p, encoding="utf-8").read().splitlines()

# Search for assigned_formality references
for i, line in enumerate(src):
    if "assigned_formality" in line:
        print(f"=== assigned_formality at line {i+1} ===")
        for j in range(max(0, i-15), min(len(src), i+25)):
            print(f"{j+1}: {src[j]}")
        print()
