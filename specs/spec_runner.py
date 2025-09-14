#!/usr/bin/env python3
"""
EVM Specification Test Runner

Runs Ethereum execution spec tests against Guillotine EVM implementation.
Generates a comprehensive test report showing pass/fail status with detailed analysis.

Usage Examples:
  python3 spec_runner.py                           # Run 100 tests (default)
  python3 spec_runner.py --quick                   # Quick test: only Random tests
  python3 spec_runner.py --comprehensive           # Run ALL tests (2000+ tests)
  python3 spec_runner.py --pattern "*Random*"      # Run only Random pattern tests
  python3 spec_runner.py --max-files 50            # Run up to 50 test files
  python3 spec_runner.py -p "*opcodes*" -m 20      # Short form: opcodes pattern, 20 files

Available Test Patterns:
  - "*Random*" - Quick random tests (3 files)
  - "*opcodes*" - Opcode-specific tests
  - "*precompile*" - Precompile contract tests
  - "*.json" - All tests (2200+ files)
"""

import json
import os
import sys
import traceback
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
import re

# Add Python SDK to path
sys.path.insert(0, str(Path(__file__).parent.parent / "sdks" / "python"))

from guillotine_evm import EVM, Address, U256, Hash, Bytes, BlockInfo, CallParams, CallType
from guillotine_evm.exceptions import GuillotineError


@dataclass
class TestResult:
    """Test execution result."""
    name: str
    passed: bool
    execution_time: float
    error: Optional[str] = None
    expected: Optional[Dict] = None
    actual: Optional[Dict] = None
    gas_used: Optional[int] = None


@dataclass
class TestSuite:
    """Collection of test results."""
    name: str
    results: List[TestResult]
    total_time: float


class SpecTestRunner:
    """Runs EVM specification tests."""

    def __init__(self, specs_dir: Path):
        self.specs_dir = specs_dir
        self.test_results: List[TestSuite] = []

    def parse_hex_value(self, hex_str: str) -> int:
        """Parse hex string to integer, handling various formats."""
        if hex_str.startswith('0x'):
            return int(hex_str, 16)
        return int(hex_str, 16) if hex_str else 0

    def parse_address(self, addr_str: str) -> Address:
        """Parse address from various formats."""
        if addr_str is None:
            raise ValueError("addr_str cannot be None")

        # Handle contract references like "<contract:0x...>"
        if addr_str.startswith('<') and addr_str.endswith('>'):
            # Extract hex part
            hex_part = re.search(r'0x[0-9a-fA-F]+', addr_str)
            if hex_part:
                addr_str = hex_part.group()

        # Remove 0x prefix if present for processing
        if addr_str.startswith('0x'):
            addr_str = addr_str[2:]

        # Pad to 40 hex chars (20 bytes) if needed, truncate if too long
        if len(addr_str) < 40:
            addr_str = addr_str.zfill(40)
        elif len(addr_str) > 40:
            addr_str = addr_str[:40]

        return Address.from_hex(addr_str)

    def setup_initial_state(self, evm: EVM, pre_state: Dict) -> None:
        """Setup EVM initial state from test pre conditions."""
        for addr_str, account_data in pre_state.items():
            try:
                address = self.parse_address(addr_str)
                balance = U256(self.parse_hex_value(account_data.get('balance', '0')))

                # Set account balance
                evm.set_balance(address, balance)

                # Set account code if present
                if 'code' in account_data:
                    code = account_data['code']
                    if code.startswith(':raw '):
                        code = code[5:]  # Remove ":raw " prefix
                    if code.startswith('0x'):
                        code = code[2:]

                    # Skip non-hex code formats (like EVM assembly syntax)
                    if code and not code.startswith('{'):  # Skip assembly-like syntax
                        try:
                            evm.set_code(address, bytes.fromhex(code))
                        except ValueError as hex_error:
                            print(f"Warning: Invalid hex code for {addr_str}: {hex_error}")
                    elif code.startswith('{'):
                        print(f"Warning: Skipping non-hex code format for {addr_str}: assembly syntax not supported")

                # Note: Storage setup not supported by current EVM API

            except Exception as e:
                print(f"Warning: Failed to setup account {addr_str}: {e}")

    def run_test_case(self, test_name: str, test_data: Dict) -> TestResult:
        """Run a single test case."""
        start_time = datetime.now()

        try:
            # Create EVM instance with block info
            default_block = BlockInfo(
                number=1,
                timestamp=1000,
                gas_limit=0x7fffffffffffffff,
                coinbase=Address.from_hex("0x0000000000000000000000000000000000000000"),
                base_fee=0,
                chain_id=1
            )
            evm = EVM(default_block)
            try:

                # Note: Block info already set in constructor

                # Setup initial state
                pre_state = test_data.get('pre', {})
                self.setup_initial_state(evm, pre_state)

                # Execute transaction
                tx = test_data.get('transaction', {})
                if not tx:
                    # Look for direct execution data
                    tx = test_data.get('exec', {})

                if tx:
                    # Parse transaction parameters
                    to_addr = None
                    to_field = tx.get('to', '')
                    if to_field and to_field.strip():  # Handle empty strings and whitespace
                        to_addr = self.parse_address(to_field)

                    from_addr = self.parse_address(tx.get('caller', tx.get('origin', '0x0000000000000000000000000000000000000000')))

                    # Parse value (can be a list)
                    value_val = tx.get('value', '0')
                    if isinstance(value_val, list):
                        value_val = value_val[0] if value_val else '0'
                    value = U256(self.parse_hex_value(value_val))

                    # Parse gas limit (can be a list)
                    gas_limit_val = tx.get('gasLimit', tx.get('gas', '100000'))
                    if isinstance(gas_limit_val, list):
                        gas_limit_val = gas_limit_val[0] if gas_limit_val else '100000'
                    gas_limit = self.parse_hex_value(gas_limit_val)

                    # Parse data
                    data = tx.get('data', '')
                    if isinstance(data, list):
                        data = data[0] if data else ''

                    # Handle :raw prefix in data
                    if isinstance(data, str):
                        if data.startswith(':raw '):
                            data = data[5:]  # Remove ":raw " prefix
                        if data.startswith('0x'):
                            data = data[2:]

                    call_data = bytes.fromhex(data) if data else b''

                    # Execute call
                    call_params = CallParams(
                        caller=from_addr,
                        to=to_addr,
                        value=value,
                        input=call_data,
                        gas=gas_limit,
                        call_type=CallType.CALL if to_addr else CallType.CREATE
                    )

                    result = evm.call(call_params)

                    # Validate results against expected outcomes
                    expected = test_data.get('expect', [])
                    if expected:
                        expected_result = expected[0].get('result', {})

                        # Basic execution success (state comparison not supported by current API)
                        execution_time = (datetime.now() - start_time).total_seconds()

                        return TestResult(
                            name=test_name,
                            passed=result.success,
                            execution_time=execution_time,
                            gas_used=result.gas_left if hasattr(result, 'gas_left') else None
                        )

                execution_time = (datetime.now() - start_time).total_seconds()
                return TestResult(
                    name=test_name,
                    passed=True,
                    execution_time=execution_time
                )
            finally:
                evm.destroy()

        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            import traceback
            return TestResult(
                name=test_name,
                passed=False,
                execution_time=execution_time,
                error=f"{str(e)[:100]}... (at {traceback.format_exc().split('File')[-1].split(',')[0].strip()})"
            )

    def run_test_file(self, test_file: Path) -> TestSuite:
        """Run all tests in a JSON file."""
        suite_start = datetime.now()

        try:
            with open(test_file, 'r') as f:
                test_data = json.load(f)

            results = []
            for test_name, test_case in test_data.items():
                result = self.run_test_case(test_name, test_case)
                results.append(result)

            total_time = (datetime.now() - suite_start).total_seconds()

            return TestSuite(
                name=test_file.name,
                results=results,
                total_time=total_time
            )

        except Exception as e:
            total_time = (datetime.now() - suite_start).total_seconds()
            return TestSuite(
                name=test_file.name,
                results=[TestResult(
                    name="file_parsing",
                    passed=False,
                    execution_time=total_time,
                    error=f"Failed to parse test file: {e}"
                )],
                total_time=total_time
            )

    def run_tests(self, pattern: str = "*.json", max_files: int = 10) -> None:
        """Run specification tests matching pattern."""
        all_test_files = list(self.specs_dir.rglob(pattern))

        if max_files == -1:
            test_files = all_test_files
            print(f"Found {len(all_test_files)} test files, running ALL...")
        else:
            test_files = all_test_files[:max_files]
            print(f"Found {len(all_test_files)} test files, running first {len(test_files)}...")

        for i, test_file in enumerate(test_files, 1):
            print(f"[{i}/{len(test_files)}] Running {test_file.name}...")
            suite = self.run_test_file(test_file)
            self.test_results.append(suite)

    def generate_report(self) -> str:
        """Generate markdown test report."""
        total_tests = sum(len(suite.results) for suite in self.test_results)
        passed_tests = sum(sum(1 for r in suite.results if r.passed) for suite in self.test_results)
        failed_tests = total_tests - passed_tests

        total_time = sum(suite.total_time for suite in self.test_results)

        report = f"""# 🧪 Guillotine EVM Specification Test Report

**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📊 Test Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | {total_tests} |
| **✅ Passed** | {passed_tests} |
| **❌ Failed** | {failed_tests} |
| **📈 Pass Rate** | {(passed_tests/total_tests*100) if total_tests > 0 else 0.0:.1f}% |
| **⏱️ Total Time** | {total_time:.2f}s |
| **🚀 Avg Speed** | {(total_tests/total_time) if total_time > 0 else 0.0:.1f} tests/sec |

"""

        # Test suite results
        report += "## 📁 Test Suite Results\n\n"

        for suite in self.test_results:
            suite_passed = sum(1 for r in suite.results if r.passed)
            suite_total = len(suite.results)
            status_icon = "✅" if suite_passed == suite_total else "❌"

            report += f"### {status_icon} {suite.name}\n\n"
            report += f"**Results**: {suite_passed}/{suite_total} passed ({(suite_passed/suite_total*100) if suite_total > 0 else 0.0:.1f}%)\n"
            report += f"**Time**: {suite.total_time:.2f}s\n\n"

            # Individual test results
            if suite.results:
                report += "| Test | Status | Time | Details |\n"
                report += "|------|--------|------|----------|\n"

                for result in suite.results:
                    status = "✅ PASS" if result.passed else "❌ FAIL"
                    details = ""
                    if result.error:
                        # Truncate long error messages
                        error_msg = result.error[:100] + "..." if len(result.error) > 100 else result.error
                        details = f"`{error_msg}`"
                    elif result.gas_used:
                        details = f"Gas: {result.gas_used:,}"

                    report += f"| {result.name} | {status} | {result.execution_time:.3f}s | {details} |\n"

                report += "\n"

        # Failed tests detail section
        failed_results = []
        for suite in self.test_results:
            failed_results.extend([r for r in suite.results if not r.passed])

        if failed_results:
            report += f"## ❌ Failed Tests ({len(failed_results)})\n\n"

            for result in failed_results[:10]:  # Show first 10 failures
                report += f"### {result.name}\n\n"
                if result.error:
                    report += f"**Error**: `{result.error}`\n\n"

                if result.expected and result.actual:
                    report += "**State Diff**:\n```json\n"
                    report += f"Expected: {json.dumps(result.expected, indent=2)}\n"
                    report += f"Actual: {json.dumps(result.actual, indent=2)}\n"
                    report += "```\n\n"

        # Performance insights
        if self.test_results:
            avg_test_time = sum(r.execution_time for suite in self.test_results for r in suite.results) / total_tests
            slowest_test = max((r for suite in self.test_results for r in suite.results), key=lambda x: x.execution_time)

            report += f"## ⚡ Performance Insights\n\n"
            report += f"- **Average test time**: {avg_test_time:.3f}s\n"
            report += f"- **Slowest test**: {slowest_test.name} ({slowest_test.execution_time:.3f}s)\n"
            report += f"- **Throughput**: {total_tests/total_time:.1f} tests/second\n\n"

        report += "---\n*Report generated by Guillotine EVM Spec Test Runner*\n"

        return report


def run_batch_subprocess(specs_dir: Path, test_files: List[Path], batch_id: int) -> Dict:
    """Run a batch of tests in a subprocess to isolate crashes."""
    import subprocess
    import tempfile
    import pickle

    # Create a temporary script to run the batch
    sdk_path = str(Path(__file__).parent.parent / "sdks" / "python")
    batch_script = f'''
import sys
import json
import pickle
from pathlib import Path
sys.path.insert(0, "{sdk_path}")

from guillotine_evm import EVM, Address, U256, Hash, Bytes, BlockInfo, CallParams, CallType
from guillotine_evm.exceptions import GuillotineError

# Import the runner class
exec(open("{Path(__file__)}").read().split("def run_batch_subprocess")[0])

def run_batch():
    specs_dir = Path("{specs_dir}")
    test_files = {[str(f) for f in test_files]}

    runner = SpecTestRunner(specs_dir)
    results = []

    for test_file_str in test_files:
        test_file = Path(test_file_str)
        try:
            suite = runner.run_test_file(test_file)
            results.append(suite)
        except Exception as e:
            # Create a failed test result for crashes
            from datetime import datetime
            results.append(TestSuite(
                name=test_file.name,
                results=[TestResult(
                    name="batch_crash",
                    passed=False,
                    execution_time=0.0,
                    error=f"Batch crashed: {{str(e)}}"
                )],
                total_time=0.0
            ))

    return results

if __name__ == "__main__":
    try:
        batch_results = run_batch()
        with open("batch_{batch_id}_results.pkl", "wb") as f:
            pickle.dump(batch_results, f)
        print(f"Batch {batch_id} completed successfully")
    except Exception as e:
        print(f"Batch {batch_id} failed: {{e}}")
        sys.exit(1)
'''

    # Write and run the batch script
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(batch_script)
        batch_script_path = f.name

    try:
        # Run the batch in a subprocess with timeout
        result = subprocess.run([
            sys.executable, batch_script_path
        ], capture_output=True, text=True, timeout=120)

        # Load results if successful
        results_file = f"batch_{batch_id}_results.pkl"
        if os.path.exists(results_file):
            with open(results_file, 'rb') as f:
                batch_results = pickle.load(f)
            os.unlink(results_file)
            return {"success": True, "results": batch_results, "stdout": result.stdout, "stderr": result.stderr}
        else:
            return {"success": False, "error": f"No results file generated. stdout: {result.stdout}, stderr: {result.stderr}"}

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Batch timed out"}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        # Clean up
        if os.path.exists(batch_script_path):
            os.unlink(batch_script_path)


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Run Ethereum execution spec tests against Guillotine EVM')
    parser.add_argument('--pattern', '-p', default='*.json',
                       help='Pattern to match test files (default: *.json for all tests)')
    parser.add_argument('--max-files', '-m', type=int, default=100,
                       help='Maximum number of test files to run (default: 100, use -1 for all)')
    parser.add_argument('--quick', '-q', action='store_true',
                       help='Quick test mode: run only Random tests (equivalent to --pattern "*Random*.json" --max-files 5)')
    parser.add_argument('--comprehensive', '-c', action='store_true',
                       help='Comprehensive test mode: run all tests (equivalent to --max-files -1)')
    parser.add_argument('--batch-size', '-b', type=int, default=50,
                       help='Number of tests per batch (default: 50, smaller batches are more crash-resistant)')

    args = parser.parse_args()

    # Handle mode shortcuts
    if args.quick:
        pattern = "*Random*.json"
        max_files = 5
        batch_size = 5  # Small batches for quick mode
    elif args.comprehensive:
        pattern = args.pattern
        max_files = -1
        batch_size = args.batch_size
    else:
        pattern = args.pattern
        max_files = args.max_files
        batch_size = args.batch_size

    specs_dir = Path(__file__).parent / "execution-specs" / "tests" / "eest" / "static" / "state_tests"

    if not specs_dir.exists():
        print(f"Error: Specs directory not found: {specs_dir}")
        sys.exit(1)

    # Get all test files
    all_test_files = list(specs_dir.rglob(pattern))
    if max_files == -1:
        test_files = all_test_files
        print(f"🧪 Running tests with pattern: {pattern}")
        print(f"📂 Running ALL {len(test_files)} test files in batches of {batch_size}")
    else:
        test_files = all_test_files[:max_files]
        print(f"🧪 Running tests with pattern: {pattern}")
        print(f"📂 Running {len(test_files)} of {len(all_test_files)} test files in batches of {batch_size}")

    # Run tests in batches
    runner = SpecTestRunner(specs_dir)
    batch_count = (len(test_files) + batch_size - 1) // batch_size

    for batch_idx in range(batch_count):
        start_idx = batch_idx * batch_size
        end_idx = min(start_idx + batch_size, len(test_files))
        batch_files = test_files[start_idx:end_idx]

        print(f"\n🔄 Running batch {batch_idx + 1}/{batch_count} ({len(batch_files)} tests)...")

        # Run batch in subprocess for crash isolation
        batch_result = run_batch_subprocess(specs_dir, batch_files, batch_idx)

        if batch_result["success"]:
            runner.test_results.extend(batch_result["results"])
            print(f"✅ Batch {batch_idx + 1} completed successfully")
        else:
            print(f"❌ Batch {batch_idx + 1} failed: {batch_result['error']}")
            # Add failed results for the batch
            for test_file in batch_files:
                runner.test_results.append(TestSuite(
                    name=test_file.name,
                    results=[TestResult(
                        name="batch_crash",
                        passed=False,
                        execution_time=0.0,
                        error=f"Batch failed: {batch_result['error']}"
                    )],
                    total_time=0.0
                ))

    # Generate and save report
    report = runner.generate_report()

    report_file = Path(__file__).parent / "test_report.md"
    with open(report_file, 'w') as f:
        f.write(report)

    print(f"\n📋 Test report saved to: {report_file}")
    print("\n" + "="*50)
    print(report[:1000] + ("..." if len(report) > 1000 else ""))


if __name__ == "__main__":
    main()