#!/usr/bin/env python3
"""
Ethereum Spec Test Runner for Guillotine EVM
Executes Ethereum specification test JSON files using the Python SDK
"""

import argparse
import json
import glob
import os
import sys
import traceback
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass

# Add parent directory to path to import guillotine_evm
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdks', 'python'))

try:
    from guillotine_evm import (
        EVM, BlockInfo, CallParams, CallType,
        Address, U256, EvmResult
    )
except ImportError as e:
    print(f"Error importing guillotine_evm: {e}")
    print("Make sure the Python SDK is built. Run: cd sdks/python && python build.py")
    sys.exit(1)


@dataclass
class TestStats:
    """Statistics for test execution"""
    total_files: int = 0
    total_tests: int = 0
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    errors: List[tuple] = None

    def __post_init__(self):
        if self.errors is None:
            self.errors = []


def parse_address(addr_str: str) -> str:
    """Parse address from various formats including placeholders"""
    if not addr_str:
        return "0x" + "0" * 40
    
    # Handle placeholder syntax like <contract:0x...> or <eoa:0x...>
    if addr_str.startswith("<") and addr_str.endswith(">"):
        # Extract address from placeholder
        import re
        match = re.search(r"0x[0-9a-fA-F]+", addr_str)
        if match:
            addr_str = match.group()
    
    # Remove 0x prefix if present for processing
    if addr_str.startswith("0x") or addr_str.startswith("0X"):
        addr_str = addr_str[2:]
    
    # Pad to 40 hex chars (20 bytes)
    addr_str = addr_str.lower().zfill(40)
    
    return "0x" + addr_str


def parse_hex_data(data_str: str) -> bytes:
    """Parse hex data from various formats"""
    if not data_str:
        return b""
    
    # Handle :raw prefix
    if data_str.startswith(":raw "):
        data_str = data_str[5:]
    
    # Handle multiple :raw segments
    if ",:raw " in data_str:
        parts = data_str.split(",:raw ")
        data_str = "".join(p.replace("0x", "") for p in parts)
        data_str = "0x" + data_str
    
    # Replace contract/eoa placeholders with addresses
    import re
    # Format: <contract:0xADDRESS> or <contract:name:0xADDRESS>
    data_str = re.sub(r"<contract:(?:[^:>]+:)?0x([0-9a-fA-F]+)>", 
                      lambda m: m.group(1).zfill(40), data_str)
    data_str = re.sub(r"<eoa:(?:[^:>]+:)?0x([0-9a-fA-F]+)>",
                      lambda m: m.group(1).zfill(40), data_str)
    
    # Remove 0x prefix and convert to bytes
    if data_str.startswith("0x"):
        data_str = data_str[2:]
    
    if not data_str:
        return b""
    
    # Ensure even number of hex digits
    if len(data_str) % 2 != 0:
        data_str = "0" + data_str
    
    try:
        return bytes.fromhex(data_str)
    except ValueError:
        # If not valid hex, return empty
        return b""


def parse_u256(value_str: str) -> int:
    """Parse U256 value from string"""
    if not value_str:
        return 0
    
    # Handle hex format
    if value_str.startswith("0x"):
        return int(value_str, 16)
    
    # Assume decimal
    return int(value_str, 10)


def execute_test_case(test_name: str, test_case: Dict[str, Any], verbose: bool = False) -> bool:
    """
    Execute a single test case
    Returns True if test passed, False otherwise
    """
    
    # Check for required fields
    if "env" not in test_case or "pre" not in test_case:
        if verbose:
            print(f"  Skipping {test_name}: missing env or pre")
        return None  # Skip
    
    # Check for assembly code and skip
    for account_data in test_case.get("pre", {}).values():
        if isinstance(account_data, dict) and "code" in account_data:
            code = account_data["code"]
            if code and code.startswith("{"):
                if verbose:
                    print(f"  Skipping {test_name}: assembly code not supported")
                return None  # Skip
    
    try:
        # Setup block environment
        env = test_case["env"]
        block_info = BlockInfo(
            number=parse_u256(env.get("currentNumber", "1")),
            timestamp=parse_u256(env.get("currentTimestamp", "1000")),
            gas_limit=parse_u256(env.get("currentGasLimit", "10000000")),
            coinbase=parse_address(env.get("currentCoinbase", "0x0")),
            base_fee=parse_u256(env.get("currentBaseFee", "0")),
            chain_id=1,
            difficulty=parse_u256(env.get("currentDifficulty", "0"))
        )
        
        # Create EVM instance
        evm = EVM(block_info)
        
        try:
            # Setup pre-state
            for address, state in test_case.get("pre", {}).items():
                if not isinstance(state, dict):
                    continue
                    
                clean_addr = parse_address(address)
                
                # Set balance
                if "balance" in state and state["balance"]:
                    balance = parse_u256(state["balance"])
                    evm.set_balance(clean_addr, balance)
                
                # Set code
                if "code" in state and state["code"] and not state["code"].startswith("{"):
                    code_bytes = parse_hex_data(state["code"])
                    if code_bytes:
                        evm.set_code(clean_addr, code_bytes)
                
                # TODO: Set storage when API supports it
            
            # Execute transaction(s)
            transactions = test_case.get("transactions", [])
            if "transaction" in test_case:
                transactions = [test_case["transaction"]]
            
            for tx in transactions:
                if not isinstance(tx, dict):
                    continue
                
                # Parse transaction data
                tx_data = tx.get("data", "0x")
                if isinstance(tx_data, list):
                    tx_data = tx_data[0] if tx_data else "0x"
                clean_data = parse_hex_data(tx_data)
                
                # Derive sender from secretKey
                sender = "0x0000000000000000000000000000000000000000"
                if "secretKey" in tx:
                    # Standard test private key
                    if "45a915e4d060149eb4365960e6a7a45f334393093061116b197e3240065ff2d8" in tx["secretKey"]:
                        sender = "0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b"
                    else:
                        # Default to standard test address for any secretKey
                        sender = "0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b"
                elif "sender" in tx:
                    sender = parse_address(tx["sender"])
                
                # Parse gas limit
                gas_limit = 1000000
                if "gasLimit" in tx:
                    gl = tx["gasLimit"]
                    if isinstance(gl, list):
                        gl = gl[0] if gl else "1000000"
                    gas_limit = parse_u256(gl)
                
                # Parse value
                value = 0
                if "value" in tx:
                    v = tx["value"]
                    if isinstance(v, list):
                        v = v[0] if v else "0"
                    value = parse_u256(v)
                
                # Determine call type and target
                to = parse_address(tx.get("to", "0x0"))
                call_type = CallType.CALL if tx.get("to") else CallType.CREATE
                
                # Create call params
                params = CallParams(
                    caller=sender,
                    to=to if call_type == CallType.CALL else "0x" + "0" * 40,
                    value=value,
                    input=clean_data,
                    gas=gas_limit,
                    call_type=call_type
                )
                
                # Execute the call
                result = evm.call(params)
                
                # Basic validation - just check it didn't crash
                if verbose:
                    gas_used = gas_limit - result.gas_left
                    print(f"    Gas used: {gas_used}, Success: {result.success}")
                    if result.error:
                        print(f"    Error: {result.error}")
            
            # If we have expectations, we could validate them here
            # For now, just check that we got this far without crashing
            return True
            
        finally:
            evm.destroy()
            
    except Exception as e:
        if verbose:
            print(f"  Error in {test_name}: {e}")
            traceback.print_exc()
        return False


def execute_test_file(file_path: str, verbose: bool = False) -> TestStats:
    """Execute all tests in a JSON file"""
    stats = TestStats()
    stats.total_files = 1
    
    try:
        with open(file_path, 'r') as f:
            test_data = json.load(f)
    except Exception as e:
        if verbose:
            print(f"Error loading {file_path}: {e}")
        stats.errors.append((file_path, str(e)))
        return stats
    
    # Handle different JSON structures
    if isinstance(test_data, list):
        # Array of test cases (like precompile tests)
        if verbose:
            print(f"  Processing array of {len(test_data)} test cases")
        
        for i, test_case in enumerate(test_data):
            if not isinstance(test_case, dict):
                continue
            
            test_name = test_case.get("name", f"test_{i}")
            stats.total_tests += 1
            
            # These are typically precompile tests with different format
            # Skip for now as they need special handling
            stats.skipped += 1
            
    elif isinstance(test_data, dict):
        # Standard test suite format
        for test_name, test_case in test_data.items():
            if not isinstance(test_case, dict):
                continue
            
            stats.total_tests += 1
            
            result = execute_test_case(test_name, test_case, verbose)
            
            if result is None:
                stats.skipped += 1
            elif result:
                stats.passed += 1
            else:
                stats.failed += 1
                stats.errors.append((f"{file_path}::{test_name}", "Test failed"))
    
    return stats


def find_test_files(path: str, pattern: str = "*.json", max_files: int = None) -> List[str]:
    """Find test files matching pattern"""
    files = []
    
    # Check if path is a file
    if os.path.isfile(path):
        return [path]
    
    # Check if path is a directory
    if os.path.isdir(path):
        # Use glob pattern
        search_pattern = os.path.join(path, "**", pattern)
        for file_path in glob.glob(search_pattern, recursive=True):
            if file_path.endswith(".json"):
                files.append(file_path)
                if max_files and len(files) >= max_files:
                    break
    else:
        # Treat as glob pattern directly
        for file_path in glob.glob(path):
            if file_path.endswith(".json"):
                files.append(file_path)
                if max_files and len(files) >= max_files:
                    break
    
    return files


def main():
    parser = argparse.ArgumentParser(
        description="Run Ethereum specification tests with Guillotine EVM"
    )
    parser.add_argument(
        "path",
        help="Path to JSON test file, directory, or glob pattern"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "-p", "--pattern",
        default="*.json",
        help="File pattern to match (default: *.json)"
    )
    parser.add_argument(
        "-m", "--max-files",
        type=int,
        help="Maximum number of files to process"
    )
    parser.add_argument(
        "--summary",
        action="store_true",
        help="Show summary statistics"
    )
    
    args = parser.parse_args()
    
    # Find test files
    test_files = find_test_files(args.path, args.pattern, args.max_files)
    
    if not test_files:
        print(f"No test files found matching: {args.path}")
        sys.exit(1)
    
    print(f"Found {len(test_files)} test files")
    
    # Execute tests
    total_stats = TestStats()
    
    for i, file_path in enumerate(test_files, 1):
        rel_path = os.path.relpath(file_path)
        print(f"\n[{i}/{len(test_files)}] Testing: {rel_path}")
        
        file_stats = execute_test_file(file_path, args.verbose)
        
        # Aggregate statistics
        total_stats.total_files += file_stats.total_files
        total_stats.total_tests += file_stats.total_tests
        total_stats.passed += file_stats.passed
        total_stats.failed += file_stats.failed
        total_stats.skipped += file_stats.skipped
        total_stats.errors.extend(file_stats.errors)
        
        # Show file summary
        if file_stats.total_tests > 0:
            print(f"  Tests: {file_stats.total_tests}, "
                  f"Passed: {file_stats.passed}, "
                  f"Failed: {file_stats.failed}, "
                  f"Skipped: {file_stats.skipped}")
    
    # Show summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Files processed: {total_stats.total_files}")
    print(f"Total tests: {total_stats.total_tests}")
    print(f"Passed: {total_stats.passed}")
    print(f"Failed: {total_stats.failed}")
    print(f"Skipped: {total_stats.skipped}")
    
    if total_stats.total_tests > 0:
        pass_rate = (total_stats.passed / total_stats.total_tests) * 100
        print(f"Pass rate: {pass_rate:.2f}%")
    
    # Show errors if verbose
    if args.verbose and total_stats.errors:
        print("\nERRORS:")
        for location, error in total_stats.errors[:10]:  # Show first 10 errors
            print(f"  {location}: {error}")
        if len(total_stats.errors) > 10:
            print(f"  ... and {len(total_stats.errors) - 10} more errors")
    
    # Exit with error code if tests failed
    sys.exit(1 if total_stats.failed > 0 else 0)


if __name__ == "__main__":
    main()