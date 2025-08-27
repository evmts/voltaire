#!/usr/bin/env python3
"""
EVM Bytecode Block Analysis

Analyzes bytecode from benchmark cases to identify blocks and generate statistics.
A block is defined as code between branch points (jump destinations to jumpi/jump instructions).

Focuses on real contracts: ten-thousand-hashes, snailtracer, and ERC20 benchmarks.
"""

import os
import re
from collections import defaultdict, Counter
from typing import List, Dict, Tuple


# EVM opcodes that end blocks (branching instructions)
BLOCK_ENDING_OPCODES = {
    0x56: 'JUMP',
    0x57: 'JUMPI', 
    0x00: 'STOP',
    0xf3: 'RETURN',
    0xfd: 'REVERT',
    0xff: 'SELFDESTRUCT'
}

# JUMPDEST opcode (starts new blocks)
JUMPDEST = 0x5b

# PUSH opcodes (1-32 bytes)
PUSH_OPCODES = {i: f'PUSH{i-0x5f}' for i in range(0x60, 0x80)}

def parse_hex_bytecode(hex_string: str) -> bytes:
    """Parse hex string to bytes, handling 0x prefix and whitespace."""
    hex_string = hex_string.strip()
    if hex_string.startswith('0x'):
        hex_string = hex_string[2:]
    
    # Remove any whitespace
    hex_string = re.sub(r'\s+', '', hex_string)
    
    if len(hex_string) % 2 != 0:
        hex_string = '0' + hex_string
        
    return bytes.fromhex(hex_string)

def find_jump_destinations(bytecode: bytes) -> set:
    """Find all JUMPDEST positions in bytecode."""
    jump_dests = set()
    i = 0
    
    while i < len(bytecode):
        opcode = bytecode[i]
        
        if opcode == JUMPDEST:
            jump_dests.add(i)
            i += 1
        elif opcode in PUSH_OPCODES:
            # Skip the pushed data
            push_size = opcode - 0x5f
            i += 1 + push_size
        else:
            i += 1
            
    return jump_dests

def count_opcodes_in_range(bytecode: bytes, start_pc: int, end_pc: int) -> int:
    """Count the number of opcodes (dispatches) in a bytecode range, excluding PUSH data."""
    count = 0
    i = start_pc
    
    while i < end_pc and i < len(bytecode):
        opcode = bytecode[i]
        count += 1  # Each opcode is one dispatch
        
        if opcode in PUSH_OPCODES:
            # Skip pushed data, but we already counted the PUSH opcode
            i += 1 + (opcode - 0x5f)
        else:
            i += 1
            
    return count

def get_opcode_name(opcode: int) -> str:
    """Get human-readable name for an opcode."""
    opcode_names = {
        0x00: "STOP",
        0x01: "ADD",
        0x02: "MUL", 
        0x03: "SUB",
        0x04: "DIV",
        0x05: "SDIV",
        0x06: "MOD",
        0x07: "SMOD",
        0x08: "ADDMOD",
        0x09: "MULMOD",
        0x0a: "EXP",
        0x0b: "SIGNEXTEND",
        0x10: "LT",
        0x11: "GT", 
        0x12: "SLT",
        0x13: "SGT",
        0x14: "EQ",
        0x15: "ISZERO",
        0x16: "AND",
        0x17: "OR",
        0x18: "XOR",
        0x19: "NOT",
        0x1a: "BYTE",
        0x1b: "SHL",
        0x1c: "SHR",
        0x1d: "SAR",
        0x20: "KECCAK256",
        0x30: "ADDRESS",
        0x31: "BALANCE",
        0x32: "ORIGIN",
        0x33: "CALLER",
        0x34: "CALLVALUE",
        0x35: "CALLDATALOAD",
        0x36: "CALLDATASIZE",
        0x37: "CALLDATACOPY",
        0x38: "CODESIZE",
        0x39: "CODECOPY",
        0x3a: "GASPRICE",
        0x3b: "EXTCODESIZE",
        0x3c: "EXTCODECOPY",
        0x3d: "RETURNDATASIZE",
        0x3e: "RETURNDATACOPY",
        0x3f: "EXTCODEHASH",
        0x40: "BLOCKHASH",
        0x41: "COINBASE",
        0x42: "TIMESTAMP",
        0x43: "NUMBER",
        0x44: "DIFFICULTY",
        0x45: "GASLIMIT",
        0x46: "CHAINID",
        0x47: "SELFBALANCE",
        0x48: "BASEFEE",
        0x50: "POP",
        0x51: "MLOAD",
        0x52: "MSTORE",
        0x53: "MSTORE8",
        0x54: "SLOAD",
        0x55: "SSTORE",
        0x56: "JUMP",
        0x57: "JUMPI",
        0x58: "PC",
        0x59: "MSIZE",
        0x5a: "GAS",
        0x5b: "JUMPDEST",
        0xf0: "CREATE",
        0xf1: "CALL",
        0xf2: "CALLCODE", 
        0xf3: "RETURN",
        0xf4: "DELEGATECALL",
        0xf5: "CREATE2",
        0xfa: "STATICCALL",
        0xfd: "REVERT",
        0xff: "SELFDESTRUCT"
    }
    
    if opcode in opcode_names:
        return opcode_names[opcode]
    elif 0x60 <= opcode <= 0x7f:
        return f"PUSH{opcode - 0x5f}"
    elif 0x80 <= opcode <= 0x8f:
        return f"DUP{opcode - 0x7f}"
    elif 0x90 <= opcode <= 0x9f:
        return f"SWAP{opcode - 0x8f}"
    elif 0xa0 <= opcode <= 0xa4:
        return f"LOG{opcode - 0xa0}"
    else:
        return f"0x{opcode:02x}"

def analyze_blocks_with_opcodes(bytecode: bytes) -> List[Tuple[int, int, List[str]]]:
    """
    Analyze bytecode and return list of (start_pc, opcode_count, opcodes) for each block.
    A block runs from a jump destination (or start) to a jump/jumpi/stop/return.
    The opcode_count excludes PUSH data - it's the number of dispatches.
    """
    if not bytecode:
        return []
        
    jump_dests = find_jump_destinations(bytecode)
    blocks = []
    
    # Find all block boundaries
    block_ends = set()
    i = 0
    
    while i < len(bytecode):
        opcode = bytecode[i]
        
        if opcode in BLOCK_ENDING_OPCODES:
            block_ends.add(i)
            
        if opcode in PUSH_OPCODES:
            # Skip pushed data
            i += 1 + (opcode - 0x5f)
        else:
            i += 1
    
    # Create sorted list of all boundaries
    boundaries = sorted(jump_dests | {0} | block_ends)
    
    # Create blocks between boundaries
    for i in range(len(boundaries)):
        start = boundaries[i]
        
        # Find the end of this block
        if start in block_ends:
            # Block is just this ending instruction
            end = start + 1
        else:
            # Find next boundary that's a block end or JUMPDEST
            end = len(bytecode)
            for j in range(i + 1, len(boundaries)):
                candidate = boundaries[j]
                if candidate in block_ends:
                    end = candidate + 1  # Include the ending instruction
                    break
                elif candidate in jump_dests:
                    end = candidate  # Don't include JUMPDEST in previous block
                    break
        
        if end > start:
            # Extract opcodes in this block
            opcodes = []
            pc = start
            while pc < end and pc < len(bytecode):
                opcode = bytecode[pc]
                opcodes.append(get_opcode_name(opcode))
                
                if opcode in PUSH_OPCODES:
                    pc += 1 + (opcode - 0x5f)
                else:
                    pc += 1
            
            opcode_count = len(opcodes)
            blocks.append((start, opcode_count, opcodes))
    
    # Filter out zero-length blocks and sort by start address
    blocks = [(start, length, opcodes) for start, length, opcodes in blocks if length > 0]
    blocks.sort()
    
    return blocks

def analyze_blocks(bytecode: bytes) -> List[Tuple[int, int]]:
    """
    Analyze bytecode and return list of (start_pc, opcode_count) for each block.
    A block runs from a jump destination (or start) to a jump/jumpi/stop/return.
    The opcode_count excludes PUSH data - it's the number of dispatches.
    """
    blocks_with_opcodes = analyze_blocks_with_opcodes(bytecode)
    return [(start, length) for start, length, _ in blocks_with_opcodes]

def get_contract_stats(name: str, bytecode_path: str) -> Dict:
    """Analyze a single contract and return block statistics."""
    try:
        with open(bytecode_path, 'r') as f:
            hex_code = f.read().strip()
        
        bytecode = parse_hex_bytecode(hex_code)
        blocks = analyze_blocks(bytecode)
        
        if not blocks:
            return {
                'name': name,
                'total_bytecode_size': len(bytecode),
                'total_blocks': 0,
                'block_lengths': [],
                'block_length_distribution': {},
                'avg_block_length': 0,
                'max_block_length': 0,
                'min_block_length': 0
            }
        
        block_lengths = [length for _, length in blocks]
        length_counter = Counter(block_lengths)
        
        return {
            'name': name,
            'total_bytecode_size': len(bytecode),
            'total_blocks': len(blocks),
            'block_lengths': block_lengths,
            'block_length_distribution': dict(length_counter),
            'avg_block_length': sum(block_lengths) / len(block_lengths),
            'max_block_length': max(block_lengths),
            'min_block_length': min(block_lengths)
        }
        
    except Exception as e:
        print(f"Error analyzing {name}: {e}")
        return {
            'name': name,
            'error': str(e),
            'total_blocks': 0,
            'block_lengths': []
        }

def print_granular_data(all_stats):
    """Print granular block length data for each contract."""
    print("\n" + "=" * 80)
    print("GRANULAR BLOCK LENGTH DATA (OPCODE COUNTS)")
    print("=" * 80)
    
    # Find the maximum block length across all contracts to determine range
    max_length = 0
    for stats in all_stats:
        if 'error' not in stats and stats['block_lengths']:
            max_length = max(max_length, max(stats['block_lengths']))
    
    # Print data for each contract
    for stats in all_stats:
        if 'error' in stats:
            continue
            
        print(f"\n{stats['name'].upper()}:")
        print(f"Total blocks: {stats['total_blocks']}, Average length: {stats['avg_block_length']:.1f}")
        
        distribution = stats['block_length_distribution']
        
        # Print blocks of each length from 1 to reasonable max
        for length in range(1, min(max_length + 1, 101)):  # Cap at 100 for readability
            count = distribution.get(length, 0)
            if count > 0:
                print(f"  {count:3d} blocks of length {length:2d}")
        
        # Show any blocks longer than 100
        long_blocks = {k: v for k, v in distribution.items() if k > 100}
        if long_blocks:
            print("  Long blocks:")
            for length in sorted(long_blocks.keys()):
                count = long_blocks[length]
                print(f"    {count:3d} blocks of length {length}")

def analyze_single_opcode_blocks():
    """Analyze what the single-opcode blocks contain."""
    print(f"\n" + "=" * 80)
    print("ANALYSIS OF SINGLE-OPCODE BLOCKS")
    print("=" * 80)
    
    bench_dir = "/Users/williamcory/Guillotine/bench/cases"
    real_contracts = [
        'erc20-transfer',
        'erc20-mint',
        'erc20-approval-transfer'
    ]
    
    all_single_opcodes = Counter()
    
    for contract in real_contracts:
        contract_dir = os.path.join(bench_dir, contract)
        bytecode_path = os.path.join(contract_dir, 'bytecode.txt')
        
        if not os.path.exists(bytecode_path):
            continue
            
        try:
            with open(bytecode_path, 'r') as f:
                hex_code = f.read().strip()
            
            bytecode = parse_hex_bytecode(hex_code)
            blocks = analyze_blocks_with_opcodes(bytecode)
            
            single_opcodes = Counter()
            for start, length, opcodes in blocks:
                if length == 1:
                    single_opcodes[opcodes[0]] += 1
                    all_single_opcodes[opcodes[0]] += 1
            
            print(f"\n{contract.upper()}:")
            print(f"  {sum(1 for _, length, _ in blocks if length == 1)} single-opcode blocks out of {len(blocks)} total blocks")
            
            if single_opcodes:
                print("  Single-opcode block breakdown:")
                for opcode in sorted(single_opcodes.keys()):
                    count = single_opcodes[opcode]
                    print(f"    {count:3d} blocks of just {opcode}")
        except Exception as e:
            print(f"  Error analyzing {contract}: {e}")
    
    print(f"\nOVERALL SINGLE-OPCODE BLOCK SUMMARY:")
    print(f"Total single-opcode blocks across all contracts: {sum(all_single_opcodes.values())}")
    print("Breakdown by opcode:")
    for opcode in sorted(all_single_opcodes.keys()):
        count = all_single_opcodes[opcode]
        percentage = (count / sum(all_single_opcodes.values())) * 100
        print(f"  {count:3d} blocks of just {opcode} ({percentage:5.1f}%)")

def analyze_opcode_sequences():
    """Analyze common opcode sequences for fusion candidates."""
    print(f"\n" + "=" * 80)
    print("OPCODE SEQUENCE ANALYSIS - FUSION CANDIDATES")
    print("=" * 80)
    
    bench_dir = "/Users/williamcory/Guillotine/bench/cases"
    real_contracts = [
        'erc20-transfer',
        'erc20-mint',
        'erc20-approval-transfer'
    ]
    
    # Counters for sequences of different lengths
    sequences = {
        2: Counter(),
        3: Counter(),
        4: Counter(),
        5: Counter(),
        6: Counter(),
        7: Counter(),
        8: Counter(),
        9: Counter(),
        10: Counter()
    }
    
    # Per-contract counters for detailed breakdown
    contract_sequences = {}
    
    print("Analyzing opcode sequences across all contracts...")
    
    for contract in real_contracts:
        contract_dir = os.path.join(bench_dir, contract)
        bytecode_path = os.path.join(contract_dir, 'bytecode.txt')
        
        if not os.path.exists(bytecode_path):
            continue
        
        # Initialize per-contract counters
        contract_sequences[contract] = {
            2: Counter(), 3: Counter(), 4: Counter(), 5: Counter(), 6: Counter(),
            7: Counter(), 8: Counter(), 9: Counter(), 10: Counter()
        }
            
        try:
            with open(bytecode_path, 'r') as f:
                hex_code = f.read().strip()
            
            bytecode = parse_hex_bytecode(hex_code)
            blocks = analyze_blocks_with_opcodes(bytecode)
            
            # For each block, extract sequences
            for start, length, opcodes in blocks:
                if length >= 2:  # Only analyze blocks with 2+ opcodes
                    # Extract sequences of length 2-10
                    for seq_len in range(2, min(length + 1, 11)):  # Up to length 10
                        for i in range(length - seq_len + 1):
                            sequence = tuple(opcodes[i:i + seq_len])
                            sequences[seq_len][sequence] += 1
                            contract_sequences[contract][seq_len][sequence] += 1
                            
        except Exception as e:
            print(f"Error analyzing {contract}: {e}")
    
    # Print top sequences for each length
    for seq_len in range(2, 11):
        print(f"\n{'='*80}")
        print(f"TOP 10 MOST COMMON {seq_len}-OPCODE SEQUENCES")
        print(f"{'='*80}")
        
        if not sequences[seq_len]:
            print(f"No {seq_len}-opcode sequences found")
            continue
            
        top_sequences = sequences[seq_len].most_common(10)
        
        for i, (sequence, count) in enumerate(top_sequences, 1):
            print(f"\n#{i}. {' -> '.join(sequence)}")
            print(f"    Total occurrences: {count}")
            
            # Show per-contract breakdown
            print(f"    Per-contract breakdown:")
            for contract in real_contracts:
                if contract in contract_sequences:
                    contract_count = contract_sequences[contract][seq_len][sequence]
                    if contract_count > 0:
                        print(f"      {contract:25s}: {contract_count:3d} times")
            
            # Provide analysis of what this sequence likely represents
            analysis = analyze_sequence_meaning(sequence)
            if analysis:
                print(f"    Analysis: {analysis}")

def analyze_sequence_meaning(sequence):
    """Provide high-level analysis of what an opcode sequence likely represents."""
    seq_str = ' -> '.join(sequence)
    
    # Stack manipulation patterns
    if sequence == ('DUP1', 'DUP1'):
        return "Stack duplication pattern - likely preparing multiple copies of same value"
    elif sequence == ('PUSH1', 'ADD'):
        return "Increment by constant - common in loops/counters"
    elif sequence == ('PUSH1', 'SUB'):
        return "Decrement by constant - common in loops/bounds checking"
    elif sequence == ('PUSH1', 'MSTORE'):
        return "Store constant to memory - initialization or constant assignment"
    elif sequence == ('MLOAD', 'DUP1'):
        return "Load from memory and duplicate - reading value for multiple uses"
    elif sequence == ('PUSH2', 'JUMP'):
        return "Unconditional jump to specific address - function call or control flow"
    elif sequence == ('PUSH2', 'JUMPI'):
        return "Conditional jump to specific address - if-then branching"
    elif sequence == ('ISZERO', 'PUSH2', 'JUMPI'):
        return "Boolean negation with conditional jump - if-not pattern"
    elif sequence == ('DUP1', 'ISZERO', 'PUSH2', 'JUMPI'):
        return "Check if zero and branch - null/empty checks"
    elif sequence == ('PUSH1', 'PUSH1', 'REVERT'):
        return "Revert with error data - custom error handling"
    elif sequence == ('PUSH1', 'DUP1', 'REVERT'):
        return "Revert with duplicated error code - error propagation"
    elif 'SLOAD' in sequence and 'SSTORE' in sequence:
        return "Storage read-modify-write pattern - state variable updates"
    elif sequence[0].startswith('PUSH') and sequence[1] in ['ADD', 'SUB', 'MUL', 'DIV']:
        return f"Arithmetic with constant - {sequence[1].lower()} by {sequence[0]}"
    elif sequence[0].startswith('DUP') and sequence[1] in ['ADD', 'SUB', 'MUL', 'DIV']:
        return f"Arithmetic with duplicated value - {sequence[1].lower()} operation"
    elif 'PUSH' in sequence[0] and 'DUP' in sequence[1]:
        return "Push constant then duplicate - preparing multiple copies"
    elif sequence[0] in ['MLOAD', 'SLOAD'] and 'PUSH' in sequence[1]:
        return "Load data then push constant - comparison or arithmetic setup"
    elif len(sequence) >= 3 and all(op.startswith('PUSH') for op in sequence):
        return "Multiple constant pushes - function call preparation or struct initialization"
    elif 'SWAP' in seq_str:
        return "Stack reordering - preparing operands for subsequent operations"
    elif sequence[0].startswith('PUSH') and sequence[-1] in ['JUMP', 'JUMPI']:
        return "Push address then jump - control flow transfer"
    elif sequence[0] in ['LT', 'GT', 'EQ'] and sequence[1] in ['PUSH2', 'PUSH1'] and sequence[2] == 'JUMPI':
        return "Comparison with conditional jump - if-then logic with comparison"
    elif 'CALLDATALOAD' in sequence:
        return "Function parameter processing - reading call data"
    elif 'RETURN' in sequence or 'REVERT' in sequence:
        return "Function exit pattern - return value or error handling"
    
    # Generic patterns based on categories
    arithmetic_ops = ['ADD', 'SUB', 'MUL', 'DIV', 'MOD']
    comparison_ops = ['LT', 'GT', 'EQ', 'ISZERO']
    memory_ops = ['MLOAD', 'MSTORE', 'MSTORE8']
    storage_ops = ['SLOAD', 'SSTORE']
    
    if any(op in sequence for op in arithmetic_ops):
        return "Arithmetic computation pattern"
    elif any(op in sequence for op in comparison_ops):
        return "Comparison/conditional logic pattern"
    elif any(op in sequence for op in memory_ops):
        return "Memory access pattern"
    elif any(op in sequence for op in storage_ops):
        return "Storage access pattern"
    
    return "Custom sequence - manual analysis needed"

def main():
    """Main analysis function."""
    bench_dir = "/Users/williamcory/Guillotine/bench/cases"
    
    # Real contracts - focusing on ERC20 only
    real_contracts = [
        'erc20-transfer',
        'erc20-mint',
        'erc20-approval-transfer'
    ]
    
    print("EVM Bytecode Block Analysis - Opcode Count (Dispatches)")
    print("=" * 60)
    print(f"Analyzing contracts in: {bench_dir}")
    print(f"Block definition: From jump destination to jump/jumpi/stop/return")
    print(f"Block length = number of opcodes/dispatches (excludes PUSH data)\n")
    
    all_stats = []
    
    for contract in real_contracts:
        contract_dir = os.path.join(bench_dir, contract)
        bytecode_path = os.path.join(contract_dir, 'bytecode.txt')
        
        if not os.path.exists(bytecode_path):
            print(f"Warning: {contract} bytecode not found at {bytecode_path}")
            continue
            
        stats = get_contract_stats(contract, bytecode_path)
        all_stats.append(stats)
    
    # Print summary first
    print("SUMMARY:")
    for stats in all_stats:
        if 'error' in stats:
            print(f"{stats['name']}: ERROR - {stats['error']}")
        else:
            print(f"{stats['name']:25s}: {stats['total_blocks']:3d} blocks, avg {stats['avg_block_length']:4.1f}, range {stats['min_block_length']}-{stats['max_block_length']}")
    
    # Analyze single-opcode blocks
    analyze_single_opcode_blocks()
    
    # Analyze opcode sequences for fusion candidates
    analyze_opcode_sequences()
    
    # Print granular data
    print_granular_data(all_stats)
    
    # Summary statistics across all contracts
    if all_stats:
        print(f"\n" + "=" * 80)
        print("OVERALL SUMMARY")
        print("=" * 80)
        
        total_blocks = sum(s['total_blocks'] for s in all_stats if 'error' not in s)
        total_bytecode = sum(s['total_bytecode_size'] for s in all_stats if 'error' not in s)
        
        # Combine all block lengths
        all_block_lengths = []
        for stats in all_stats:
            if 'error' not in stats:
                all_block_lengths.extend(stats['block_lengths'])
        
        if all_block_lengths:
            combined_distribution = Counter(all_block_lengths)
            
            print(f"Total contracts analyzed: {len([s for s in all_stats if 'error' not in s])}")
            print(f"Total bytecode size: {total_bytecode:,} bytes")
            print(f"Total blocks: {total_blocks:,}")
            print(f"Overall average block length: {sum(all_block_lengths) / len(all_block_lengths):.1f}")
            print(f"Overall block length range: {min(all_block_lengths) - max(all_block_lengths)}")
            
            print(f"\nCOMBINED DISTRIBUTION (top 30):")
            for i, length in enumerate(sorted(combined_distribution.keys())[:30]):
                count = combined_distribution[length]
                percentage = (count / total_blocks) * 100
                print(f"  {count:4d} blocks of length {length:2d} ({percentage:5.1f}%)")
                
            if len(combined_distribution) > 30:
                remaining = len(combined_distribution) - 30
                remaining_count = sum(combined_distribution[k] for k in sorted(combined_distribution.keys())[30:])
                print(f"  ... and {remaining_count:4d} more blocks in {remaining} other lengths")

if __name__ == "__main__":
    main()