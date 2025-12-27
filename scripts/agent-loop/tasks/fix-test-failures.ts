/**
 * Task: Fix Test Failures
 *
 * Systematically fix failing tests in the Voltaire codebase.
 * Issue #33: 393 TypeScript Test Failures
 */

import type { TaskConfig, SessionState } from "../index.ts";

async function runCommand(cmd: string): Promise<string> {
	const proc = Bun.spawn(["sh", "-c", cmd], {
		stdout: "pipe",
		stderr: "pipe",
		cwd: process.cwd(),
	});
	await proc.exited;
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	return stdout + stderr;
}

const config: TaskConfig = {
	id: "fix-test-failures",
	name: "Fix Test Failures",
	reportsDir: "reports/test-fixes",
	maxBudgetPerCycle: 3.0, // Tests need more budget (running tests is expensive)
	targetValue: 0,

	async checkState() {
		try {
			// Run tests and extract failure count (no timeout on macOS)
			// Strip ANSI codes for reliable parsing
			const result = await runCommand(
				'bun run test:run 2>&1 | tail -30 | sed "s/\\x1b\\[[0-9;]*m//g" || true',
			);

			// Parse vitest output: "Tests  X failed | Y passed"
			// Handle various spacing from stripped ANSI
			const failMatch = result.match(/Tests\s+(\d+)\s+failed/);
			const failCount = failMatch ? parseInt(failMatch[1]) : 0;

			// Also check for file-level failures
			const fileFailMatch = result.match(/Test Files\s+(\d+)\s+failed/);
			const fileFailCount = fileFailMatch ? parseInt(fileFailMatch[1]) : 0;

			// Get details
			const details: string[] = [];
			if (fileFailCount > 0) details.push(`${fileFailCount} test files failed`);
			if (failCount > 0) details.push(`${failCount} individual tests failed`);

			return {
				value: failCount || fileFailCount,
				status:
					failCount === 0 && fileFailCount === 0
						? "All tests passing"
						: `${failCount} test failures in ${fileFailCount} files`,
				details,
			};
		} catch (e) {
			return {
				value: 999,
				status: "Failed to run tests",
				details: [String(e)],
			};
		}
	},

	generatePrompt(state: SessionState) {
		return `<handoff>
  <metadata>
    <task>Fix Test Failures (Issue #33)</task>
    <repository>voltaire</repository>
    <working_directory>/Users/williamcory/voltaire</working_directory>
    <date>${new Date().toISOString().split("T")[0]}</date>
    <cycle>${state.totalCycles + 1}</cycle>
  </metadata>

  <progress>
    <initial_failures>${state.initialValue}</initial_failures>
    <current_failures>${state.currentValue}</current_failures>
    <reduction>${state.totalPercentReduction.toFixed(1)}%</reduction>
  </progress>

  <context>
    Voltaire is an Ethereum primitives library (TypeScript + Zig + Rust + C).
    Tests use Vitest. Many failures are due to:
    - Missing dependencies (@ledgerhq/hw-app-eth, @trezor/connect-web)
    - Type mismatches in signature handling
    - Missing exports or files
    - Hardware wallet modules need optional peer deps
  </context>

  <commands>
    <run_tests>bun run test:run 2>&amp;1 | tail -50</run_tests>
    <run_single>bun run test:run -- path/to/file.test.ts</run_single>
    <list_failures>bun run test:run 2>&amp;1 | grep -E "FAIL|Error:|✗"</list_failures>
    <check_deps>bun pm ls</check_deps>
  </commands>

  <known_issues>
    <issue>
      <files>src/wallet/hardware/LedgerWallet.ts, TrezorWallet.ts</files>
      <problem>Missing optional peer dependencies</problem>
      <fix>Add try/catch for dynamic imports, mark as optional</fix>
    </issue>
    <issue>
      <files>src/wallet/hardware/TrezorWallet.ts:179,204</files>
      <problem>Signature.from expects Uint8Array, gets string</problem>
      <fix>Convert hex strings to bytes before creating signature</fix>
    </issue>
    <issue>
      <problem>Missing default export in Hex/index.ts</problem>
      <fix>Add default export or change import pattern</fix>
    </issue>
  </known_issues>

  <strategies>
    <strategy>
      <name>Skip Hardware Wallet Tests</name>
      <when>Hardware wallet deps not installed</when>
      <how>Add conditional skip or exclude from test config</how>
    </strategy>
    <strategy>
      <name>Fix Type Mismatches</name>
      <when>Function expects different type</when>
      <how>Add conversion/parsing at call site</how>
    </strategy>
    <strategy>
      <name>Add Missing Exports</name>
      <when>Module doesn't export expected member</when>
      <how>Add export to index.ts</how>
    </strategy>
    <strategy>
      <name>Mock External Dependencies</name>
      <when>External service not available</when>
      <how>Add vi.mock() for external modules</how>
    </strategy>
  </strategies>

  <instructions>
    1. Run tests to see current failures: bun run test:run 2>&amp;1 | tail -100
    2. Identify the root causes (group by error type)
    3. Fix the most impactful issues first (those causing many failures)
    4. Re-run tests after each fix to verify
    5. Commit progress with descriptive messages
    6. Focus on quick wins: missing exports, type conversions, skipping unavailable deps
    7. DO NOT comment out tests - fix the underlying issues
  </instructions>

  <priorities>
    1. Fix/skip hardware wallet tests (likely biggest source of failures)
    2. Fix missing exports and imports
    3. Fix type mismatches in test assertions
    4. Fix any remaining individual test issues
  </priorities>
</handoff>

Fix test failures systematically. Start by running tests to see current state, identify patterns in failures, then fix root causes. Commit progress after each significant fix.`;
	},
};

export default config;
