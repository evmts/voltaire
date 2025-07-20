#!/usr/bin/env python3
"""
WASM Size Analysis Tool for Guillotine EVM Implementation

This script analyzes the size of WASM builds, breaking down sections,
functions, and providing optimization insights. It also tracks bundle sizes
against targets for CI/CD integration.

Usage:
    python3 scripts/wasm-analyze.py           # Build WASM first, then analyze (default)
    python3 scripts/wasm-analyze.py --no-build # Analyze existing WASM files without building
    python3 scripts/wasm-analyze.py -n        # Same as --no-build
    python3 scripts/wasm-analyze.py -u        # Update benchmark file with current sizes
    python3 scripts/wasm-analyze.py --update  # Same as -u
    python3 scripts/wasm-analyze.py --check   # Check sizes against targets (exit 1 if over)
"""

import subprocess
import os
import sys
import re
import json
import argparse
from datetime import datetime
from pathlib import Path

def get_file_size(filepath):
    """Get file size in bytes."""
    try:
        return os.path.getsize(filepath)
    except FileNotFoundError:
        return None

def run_command(cmd):
    """Run a command and return output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        print(f"Error running command '{cmd}': {e}")
        return ""

def analyze_wasm_sections(wasm_path):
    """Analyze WASM sections using wasm-objdump."""
    output = run_command(f"wasm-objdump -h {wasm_path}")
    
    sections = {}
    total_size = 0
    debug_size = 0
    code_data_size = 0
    
    for line in output.split('\n'):
        match = re.search(r'(\S+)\s+start=.*size=0x([0-9a-f]+)', line)
        if match:
            section = match.group(1)
            size = int(match.group(2), 16)
            
            sections[section] = size
            total_size += size
            
            if section == 'Code':
                code_data_size += size
            elif section == 'Data':
                code_data_size += size
            elif section == 'Custom':
                debug_size += size
    
    return sections, total_size, code_data_size, debug_size

def analyze_functions(wasm_path):
    """Analyze functions in WASM using wasm-objdump."""
    output = run_command(f"wasm-objdump -x {wasm_path}")
    
    functions = []
    for line in output.split('\n'):
        if 'func[' in line:
            # Handle both named and unnamed functions
            if '<' in line and '>' in line:
                match = line.split('<')[1].split('>')[0]
                functions.append(match)
            else:
                # Unnamed function
                functions.append(f"func_{len(functions)}")
    
    # Group by module
    modules = {}
    for func in functions:
        if '.' in func:
            module = func.split('.')[0]
            modules[module] = modules.get(module, 0) + 1
        else:
            modules['core'] = modules.get('core', 0) + 1
    
    return functions, modules

def format_bytes(bytes_val):
    """Format bytes into human-readable format."""
    kb = bytes_val / 1024
    mb = kb / 1024
    
    if mb >= 1:
        return f"{bytes_val:,} bytes ({mb:.2f} MB)"
    else:
        return f"{bytes_val:,} bytes ({kb:.2f} KB)"

def load_benchmark_data(benchmark_path):
    """Load benchmark data from JSON file."""
    try:
        with open(benchmark_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Create default benchmark structure if file doesn't exist
        default_data = {
            "targets": {
                "releaseSmall": {
                    "withPrecompiles": 150,
                    "withoutPrecompiles": 100
                },
                "releaseFast": {
                    "withPrecompiles": 2500,
                    "withoutPrecompiles": 2000
                }
            },
            "current": {
                "releaseSmall": {
                    "withPrecompiles": None,
                    "withoutPrecompiles": None
                },
                "releaseFast": {
                    "withPrecompiles": None,
                    "withoutPrecompiles": None
                }
            },
            "lastUpdated": None
        }
        return default_data

def save_benchmark_data(benchmark_path, data):
    """Save benchmark data to JSON file."""
    data["lastUpdated"] = datetime.now().isoformat() + "Z"
    with open(benchmark_path, 'w') as f:
        json.dump(data, f, indent=2)

def build_wasm_variant(variant_name, optimize_mode, no_precompiles=False):
    """Build a specific WASM variant."""
    print(f"Building {variant_name}...")
    
    cmd = ['zig', 'build', 'wasm', f'-Doptimize={optimize_mode}']
    if no_precompiles:
        cmd.append('-Dno_precompiles=true')
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error building {variant_name}: {result.stderr}")
        return False
    
    return True

def kb_size(bytes_val):
    """Convert bytes to KB (rounded)."""
    return round(bytes_val / 1024)

def check_size_targets(current_sizes, targets):
    """Check if current sizes exceed targets. Returns (passed, failures)."""
    failures = []
    
    for optimize_mode in ['releaseSmall', 'releaseFast']:
        for variant in ['withPrecompiles', 'withoutPrecompiles']:
            current = current_sizes.get(optimize_mode, {}).get(variant)
            target = targets.get(optimize_mode, {}).get(variant)
            
            if current is not None and target is not None:
                current_kb = kb_size(current)
                if current_kb > target:
                    failures.append({
                        'mode': optimize_mode,
                        'variant': variant,
                        'current': current_kb,
                        'target': target,
                        'excess': current_kb - target
                    })
    
    return len(failures) == 0, failures

def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--no-build', '-n', action='store_true', 
                        help='Analyze existing WASM files without building')
    parser.add_argument('--update', '-u', action='store_true',
                        help='Update benchmark file with current sizes')
    parser.add_argument('--check', action='store_true',
                        help='Check sizes against targets (exit 1 if over)')
    
    args = parser.parse_args()
    
    # Paths
    project_root = Path(__file__).parent.parent
    benchmark_path = project_root / "benchmark" / "wasm-bundle-size.json"
    
    # Load benchmark data
    benchmark_data = load_benchmark_data(benchmark_path)
    
    # Change to project root
    os.chdir(project_root)
    
    # Build variants if not skipping build
    if not args.no_build:
        print("=== Building WASM Variants ===\n")
        
        variants = [
            ('ReleaseSmall with precompiles', 'ReleaseSmall', False),
            ('ReleaseSmall without precompiles', 'ReleaseSmall', True),
            ('ReleaseFast with precompiles', 'ReleaseFast', False),
            ('ReleaseFast without precompiles', 'ReleaseFast', True),
        ]
        
        for variant_name, optimize_mode, no_precompiles in variants:
            if not build_wasm_variant(variant_name, optimize_mode, no_precompiles):
                sys.exit(1)
            
            # Rename the output to include variant info
            source_path = project_root / "zig-out" / "bin" / "guillotine.wasm"
            suffix = "no-precompiles" if no_precompiles else "with-precompiles"
            target_path = project_root / "zig-out" / "bin" / f"guillotine-{optimize_mode.lower()}-{suffix}.wasm"
            
            if source_path.exists():
                run_command(f"mv {source_path} {target_path}")
        
        print("Build complete!\n")
    else:
        print("=== Analyzing existing WASM files (skipping build) ===\n")
    
    # Find WASM files
    wasm_files = {}
    for optimize in ['releasesmall', 'releasefast']:
        for variant in ['with-precompiles', 'no-precompiles']:
            key = f"{optimize}_{variant.replace('-', '_')}"
            path = project_root / "zig-out" / "bin" / f"guillotine-{optimize}-{variant}.wasm"
            if path.exists():
                wasm_files[key] = path
    
    print("=== WASM Bundle Size Analysis ===\n")
    
    # Analyze each WASM file
    results = {}
    current_sizes = {}
    
    for build_key, wasm_path in wasm_files.items():
        if not wasm_path.exists():
            print(f"Warning: {build_key} build not found at {wasm_path}")
            continue
        
        size = get_file_size(wasm_path)
        sections, total, code_data, debug = analyze_wasm_sections(wasm_path)
        functions, modules = analyze_functions(wasm_path)
        
        results[build_key] = {
            'path': wasm_path,
            'size': size,
            'sections': sections,
            'total_sections': total,
            'code_data_size': code_data,
            'debug_size': debug,
            'functions': functions,
            'modules': modules
        }
        
        # Map to benchmark structure
        if 'releasesmall' in build_key:
            mode = 'releaseSmall'
        else:
            mode = 'releaseFast'
        
        if 'no_precompiles' in build_key:
            variant = 'withoutPrecompiles'
        else:
            variant = 'withPrecompiles'
        
        if mode not in current_sizes:
            current_sizes[mode] = {}
        current_sizes[mode][variant] = size
    
    # Display size comparison table
    print("## Bundle Size Report\n")
    print(f"{'Build Mode':<15} {'Variant':<20} {'Current':<15} {'Target':<15} {'Status':<10}")
    print("-" * 80)
    
    all_passed = True
    
    for mode in ['releaseSmall', 'releaseFast']:
        for variant in ['withPrecompiles', 'withoutPrecompiles']:
            current = current_sizes.get(mode, {}).get(variant)
            target = benchmark_data['targets'].get(mode, {}).get(variant)
            
            if current is not None:
                current_kb = kb_size(current)
                current_str = f"{current_kb}K"
                
                if target is not None:
                    target_str = f"{target}K"
                    if current_kb > target:
                        status = "❌ FAIL"
                        all_passed = False
                    else:
                        status = "✅ PASS"
                else:
                    target_str = "No target"
                    status = "⚠️  N/A"
                
                variant_display = "without precompiles" if variant == "withoutPrecompiles" else "with precompiles"
                print(f"{mode:<15} {variant_display:<20} {current_str:<15} {target_str:<15} {status:<10}")
            else:
                variant_display = "without precompiles" if variant == "withoutPrecompiles" else "with precompiles"
                print(f"{mode:<15} {variant_display:<20} {'Not built':<15} {'N/A':<15} {'⚠️  N/A':<10}")
    
    print()
    
    # Check against targets
    passed, failures = check_size_targets(current_sizes, benchmark_data['targets'])
    
    if failures:
        print("## ❌ Size Target Violations\n")
        for failure in failures:
            variant_display = "without precompiles" if failure['variant'] == "withoutPrecompiles" else "with precompiles"
            print(f"- {failure['mode']} {variant_display}: {failure['current']}K > {failure['target']}K "
                  f"(+{failure['excess']}K over target)")
        print()
    
    # Update benchmark file if requested
    if args.update:
        benchmark_data['current'] = current_sizes
        save_benchmark_data(benchmark_path, benchmark_data)
        print(f"📝 Updated benchmark file: {benchmark_path}\n")
    
    # Exit with error if checking and failures exist
    if args.check and not passed:
        print("❌ Size check FAILED - bundle sizes exceed targets")
        sys.exit(1)
    elif args.check:
        print("✅ Size check PASSED - all bundle sizes within targets")
    
    # If we have results, show detailed analysis for the main build
    if results:
        # Find the smallest ReleaseSmall build for detailed analysis
        main_build_key = None
        for key in results.keys():
            if 'releasesmall' in key and 'no_precompiles' in key:
                main_build_key = key
                break
        
        if not main_build_key:
            # Fallback to any ReleaseSmall build
            for key in results.keys():
                if 'releasesmall' in key:
                    main_build_key = key
                    break
        
        if main_build_key:
            print("## Detailed Analysis (ReleaseSmall without precompiles)\n")
            
            data = results[main_build_key]
            
            # Section breakdown
            print("### Section Breakdown\n")
            sections = data['sections']
            
            # Sort sections by size
            sorted_sections = sorted(sections.items(), key=lambda x: x[1], reverse=True)
            
            for section, size in sorted_sections[:10]:  # Top 10 sections
                percentage = (size / data['size']) * 100 if data['size'] > 0 else 0
                print(f"{section:<20} {format_bytes(size):<30} ({percentage:5.1f}%)")
            
            print(f"\n{'Total:':<20} {format_bytes(data['total_sections'])}")
            
            # Code vs Debug breakdown
            if data['code_data_size'] > 0:
                print(f"\nCode + Data:  {format_bytes(data['code_data_size'])} ({data['code_data_size']/data['size']*100:.1f}%)")
            if data['debug_size'] > 0:
                print(f"Debug info:   {format_bytes(data['debug_size'])} ({data['debug_size']/data['size']*100:.1f}%)")
            
            # Function analysis
            print(f"\n### Function Analysis\n")
            print(f"Total functions: {len(data['functions'])}")
            
            # Top modules by function count
            print("\nTop modules by function count:")
            sorted_modules = sorted(data['modules'].items(), key=lambda x: x[1], reverse=True)
            
            for module, count in sorted_modules[:15]:
                percentage = (count / len(data['functions'])) * 100
                print(f"  {module:<30} {count:>4} functions ({percentage:5.1f}%)")
    
    print("\n## Optimization Recommendations\n")
    
    # Critical size check for 100K target
    releasesmall_no_precompiles = current_sizes.get('releaseSmall', {}).get('withoutPrecompiles')
    if releasesmall_no_precompiles:
        current_kb = kb_size(releasesmall_no_precompiles)
        target_kb = 100
        
        if current_kb > target_kb:
            excess_kb = current_kb - target_kb
            print(f"🚨 CRITICAL: ReleaseSmall without precompiles is {current_kb}K (target: {target_kb}K)")
            print(f"   Need to reduce size by {excess_kb}K ({excess_kb/current_kb*100:.1f}%)")
            print("\n   Recommended actions:")
            print("   1. Remove unused opcode implementations")
            print("   2. Use more compact data structures")
            print("   3. Apply dead code elimination")
            print("   4. Consider wasm-opt -Oz optimization")
        else:
            print(f"✅ ReleaseSmall without precompiles: {current_kb}K (within {target_kb}K target)")
    
    print("\n## Additional Tools\n")
    print("1. wasm-opt -Oz input.wasm -o output.wasm  # Binaryen size optimization")
    print("2. twiggy top input.wasm                   # Show largest code sections")
    print("3. wasm-decompile input.wasm               # Analyze generated code")

if __name__ == "__main__":
    main()