p = r"C:\DubMate AI\frontend\app\(app)\studio\page.tsx"
src = open(p, encoding="utf-8").read().splitlines()
# Find the Formality label context
for i, line in enumerate(src):
    if "Formality" in line and "Label" in line:
        print(f"=== Formality label at line {i+1} ===")
        for j in range(max(0, i-3), min(len(src), i+40)):
            print(f"{j+1}: {src[j]}")
        print()
        break
