#!/usr/bin/env python3
import json
import sys

# Read REVM trace
revm_trace = {}
with open('src/revm_wrapper/revm_erc20_trace.json', 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'pc' in data and data['pc'] not in revm_trace:
                revm_trace[data['pc']] = data
        except:
            pass

# Compare specific PCs
pcs_to_check = [0, 2, 4, 5, 6, 7, 8, 11, 15, 16, 17, 19, 20, 21, 23, 24, 26, 27, 28, 30, 31, 32, 34, 35, 45, 47, 48, 49, 50, 51]

print("Checking first 30 PC values for stack divergence:")
print("=" * 80)

for pc in pcs_to_check:
    if pc in revm_trace:
        stack = revm_trace[pc]['stack']
        print(f"PC={pc}: REVM stack (size={len(stack)}): {stack[-5:] if len(stack) > 5 else stack}")