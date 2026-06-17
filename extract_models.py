import re

with open('/home/volga/llm-coding-stats/data.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all <tr> elements
rows = re.findall(r'<tr[^>]*>.*?</tr>', html, re.DOTALL)

results = []

for row in rows:
    # Find <a> tag with title attribute (model name)
    a_match = re.search(r'<a[^>]*title="([^"]+)"[^>]*>', row)
    if not a_match:
        continue
    
    model_name = a_match.group(1)
    
    # Find all <td> elements in the row
    cells = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
    if len(cells) < 4:
        continue
    
    # The 4th cell should contain the score
    score_cell = cells[3]
    score_match = re.search(r'<span[^>]*class="text-sm"[^>]*>(\d+)</span>', score_cell)
    if not score_match:
        continue
    
    score = score_match.group(1)
    results.append((model_name, score))

for model, score in results:
    print(f"{model}\t{score}")

print(f"\nTotal models extracted: {len(results)}")
