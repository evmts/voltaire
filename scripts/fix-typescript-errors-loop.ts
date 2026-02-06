#!/usr/bin/env bun
/**
 * Automated TypeScript Error Fixing Loop
 *
 * This script automates the process of:
 * 1. Running Claude Code to fix TypeScript errors
 * 2. Generating handoff reports
 * 3. Committing progress
 * 4. Restarting with updated context
 *
 * Usage: bun run scripts/fix-typescript-errors-loop.ts [--max-cycles N] [--max-budget N]
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

// Configuration
const CONFIG = {
	maxCycles: Number.parseInt(
		process.argv.find((a) => a.startsWith("--max-cycles="))?.split("=")[1] ??
			"10",
		10,
	),
	maxBudgetPerCycle: Number.parseFloat(
		process.argv.find((a) => a.startsWith("--max-budget="))?.split("=")[1] ??
			"2.0",
	),
	reportsDir: "reports/typescript-fixes",
	targetErrors: 0,
	maxTurnsPerCycle: 50,
};

// Types
interface CycleReport {
	cycle: number;
	startTime: string;
	endTime: string;
	errorsBefore: number;
	errorsAfter: number;
	errorsFixed: number;
	percentReduction: number;
	filesFixed: string[];
	commits: string[];
	status: "success" | "error" | "partial";
	notes: string;
}

interface SessionState {
	totalCycles: number;
	initialErrors: number;
	currentErrors: number;
	totalErrorsFixed: number;
	totalPercentReduction: number;
	reports: CycleReport[];
	lastHandoff: string;
}

// Utility functions
async function getErrorCount(): Promise<number> {
	try {
		const result =
			await $`bun run tsc --noEmit 2>&1 | grep -c "error TS"`.quiet();
		return Number.parseInt(result.stdout.toString().trim(), 10) || 0;
	} catch {
		// grep returns exit code 1 if no matches, which throws
		return 0;
	}
}

async function getTopErrorFiles(limit = 20): Promise<string[]> {
	try {
		const result =
			await $`bun run tsc --noEmit 2>&1 | grep -E "\\.js\\([0-9]+,[0-9]+\\)|\\.ts\\([0-9]+,[0-9]+\\)" | sed 's/([0-9]*,[0-9]*).*//' | sort | uniq -c | sort -rn | head -${limit}`.quiet();
		return result.stdout.toString().trim().split("\n").filter(Boolean);
	} catch {
		return [];
	}
}

async function getRecentCommits(limit = 5): Promise<string[]> {
	try {
		const result = await $`git log --oneline -${limit}`.quiet();
		return result.stdout.toString().trim().split("\n").filter(Boolean);
	} catch {
		return [];
	}
}

function generateHandoffPrompt(state: SessionState): string {
	const _topFiles =
		state.reports.length > 0
			? "See error distribution below"
			: "Run error count first";

	return `<handoff>
  <metadata>
    <issue>GitHub Issue #33 - Fix TypeScript Errors</issue>
    <repository>voltaire</repository>
    <working_directory>/Users/williamcory/voltaire</working_directory>
    <date>${new Date().toISOString().split("T")[0]}</date>
    <session>${state.totalCycles + 1}</session>
  </metadata>

  <progress_summary>
    <initial_errors>${state.initialErrors}</initial_errors>
    <current_errors>${state.currentErrors}</current_errors>
    <total_reduction>${state.totalPercentReduction.toFixed(1)}%</total_reduction>
    <cycles_completed>${state.totalCycles}</cycles_completed>
  </progress_summary>

  <project_context>
    <description>
      Voltaire is an Ethereum primitives library with multi-language support (TypeScript + Zig + Rust + C).
      Uses branded types pattern: \`type X = base &amp; { readonly [brand]: "X" }\`
      JSDoc types in .js files, TypeScript for .ts files.
    </description>
  </project_context>

  <commands>
    <check_errors>bun run tsc --noEmit 2>&amp;1 | grep -c "error TS"</check_errors>
    <list_errors>bun run tsc --noEmit 2>&amp;1 | grep "error TS"</list_errors>
    <errors_by_file>bun run tsc --noEmit 2>&amp;1 | grep -E "\\.js\\([0-9]+,[0-9]+\\)|\\.ts\\([0-9]+,[0-9]+\\)" | sed 's/([0-9]*,[0-9]*).*//' | sort | uniq -c | sort -rn | head -30</errors_by_file>
  </commands>

  <proven_patterns>
    <pattern name="array_access_undefined">
      <description>Array indexing returns T | undefined in strict mode</description>
      <fix>const item = /** @type {*} */ (arr[0]);</fix>
    </pattern>

    <pattern name="branded_type_conversion">
      <description>Converting between branded types or from primitives</description>
      <fix>return /** @type {WeiType} */ (/** @type {unknown} */ (value));</fix>
    </pattern>

    <pattern name="readonly_assignment">
      <description>Cannot assign to readonly properties - use spread</description>
      <fix>result = { ...result, prop: value };</fix>
    </pattern>

    <pattern name="parameter_implicit_any">
      <description>Function parameters need JSDoc types</description>
      <fix>/** @param {string} a */ function foo(a) { ... }</fix>
    </pattern>

    <pattern name="object_indexing">
      <description>Object indexing with string needs Record type</description>
      <fix>/** @type {Record&lt;string, T&gt;} */ const obj = {};</fix>
    </pattern>
  </proven_patterns>

  <anti_patterns>
    <anti name="non_null_assertion_in_js">
      <description>The ! operator does NOT work in .js files</description>
      <wrong>const val = arr[0]!;</wrong>
      <correct>const val = /** @type {*} */ (arr[0]);</correct>
    </anti>

    <anti name="ts_ignore">
      <description>Avoid @ts-ignore - fix the actual type issue</description>
    </anti>
  </anti_patterns>

  <instructions>
    1. Run error count: bun run tsc --noEmit 2>&1 | grep -c "error TS"
    2. Get files by error count to prioritize high-impact fixes
    3. Fix files in batches, committing every 20-40 errors fixed
    4. Use proven patterns above - most errors follow these categories
    5. Target: Get to 0 errors so tests can run cleanly
    6. IMPORTANT: Commit frequently with descriptive messages showing error reduction
    7. When you've fixed ~50 errors or hit context limits, summarize progress and stop
  </instructions>

  <notes>
    <note>This is a WIP library - no breaking changes concern, refactor freely</note>
    <note>Never disable or comment out tests - fix the types instead</note>
    <note>The codebase uses namespace pattern: import * as Foo, then Foo.method()</note>
  </notes>
</handoff>

Continue fixing TypeScript errors. Start by checking the current error count and top error files, then systematically fix them using the proven patterns. Commit progress regularly.`;
}

async function runClaudeCodeCycle(
	prompt: string,
	cycleNum: number,
): Promise<{ success: boolean; output: string }> {
	// Write prompt to temp file to avoid shell escaping issues
	const promptFile = `/tmp/claude-prompt-${cycleNum}.txt`;
	writeFileSync(promptFile, prompt);

	try {
		// Run claude with the prompt
		// --print: non-interactive mode
		// --dangerously-skip-permissions: for automation (use in trusted env only!)
		// --permission-mode acceptEdits: auto-accept file edits
		// --output-format text: get readable output
		// --max-budget-usd: limit cost per cycle
		const proc = Bun.spawn(
			[
				"sh",
				"-c",
				`cat "${promptFile}" | claude --print --dangerously-skip-permissions --permission-mode acceptEdits --output-format text --max-budget-usd ${CONFIG.maxBudgetPerCycle}`,
			],
			{
				cwd: process.cwd(),
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		// Set up a timeout
		const timeoutMs = 900000; // 15 minutes
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => {
				proc.kill();
				reject(new Error(`Timeout after ${timeoutMs}ms`));
			}, timeoutMs);
		});

		// Wait for completion or timeout
		const exitCode = await Promise.race([proc.exited, timeoutPromise]);
		const stdout = await new Response(proc.stdout).text();
		const stderr = await new Response(proc.stderr).text();

		if (exitCode !== 0) {
		}

		return {
			success: exitCode === 0,
			output: stdout || stderr,
		};
	} catch (error) {
		return {
			success: false,
			output: error instanceof Error ? error.message : String(error),
		};
	}
}

async function commitProgress(message: string): Promise<string | null> {
	try {
		// Check if there are changes to commit
		const status = await $`git status --porcelain`.quiet();
		if (!status.stdout.toString().trim()) {
			return null; // No changes
		}

		await $`git add -A`.quiet();
		const _result = await $`git commit -m "${message}"`.quiet();
		const hash = await $`git rev-parse --short HEAD`.quiet();
		return hash.stdout.toString().trim();
	} catch {
		return null;
	}
}

function saveReport(state: SessionState): void {
	const reportsDir = join(process.cwd(), CONFIG.reportsDir);
	if (!existsSync(reportsDir)) {
		mkdirSync(reportsDir, { recursive: true });
	}

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const reportPath = join(reportsDir, `session-${timestamp}.json`);
	const summaryPath = join(reportsDir, "LATEST.md");

	// Save JSON report
	writeFileSync(reportPath, JSON.stringify(state, null, 2));

	// Save markdown summary
	const summary = `# TypeScript Error Fixing Progress

**Last Updated:** ${new Date().toISOString()}

## Summary
- **Initial Errors:** ${state.initialErrors}
- **Current Errors:** ${state.currentErrors}
- **Total Fixed:** ${state.totalErrorsFixed} (${state.totalPercentReduction.toFixed(1)}%)
- **Cycles Completed:** ${state.totalCycles}

## Recent Cycles
${state.reports
	.slice(-5)
	.map(
		(r) => `
### Cycle ${r.cycle} (${r.startTime})
- Errors: ${r.errorsBefore} → ${r.errorsAfter} (-${r.errorsFixed})
- Status: ${r.status}
- Files: ${r.filesFixed.slice(0, 5).join(", ")}${r.filesFixed.length > 5 ? "..." : ""}
`,
	)
	.join("\n")}

## Handoff Prompt
\`\`\`
${state.lastHandoff}
\`\`\`
`;

	writeFileSync(summaryPath, summary);
}

async function main() {
	// Initialize state
	const initialErrors = await getErrorCount();

	if (initialErrors === 0) {
		return;
	}

	const state: SessionState = {
		totalCycles: 0,
		initialErrors,
		currentErrors: initialErrors,
		totalErrorsFixed: 0,
		totalPercentReduction: 0,
		reports: [],
		lastHandoff: "",
	};

	// Main loop
	for (let cycle = 1; cycle <= CONFIG.maxCycles; cycle++) {
		const cycleStart = new Date();
		const errorsBefore = await getErrorCount();

		// Generate handoff prompt
		const prompt = generateHandoffPrompt(state);
		state.lastHandoff = prompt;

		// Run Claude Code
		const result = await runClaudeCodeCycle(prompt, cycle);

		// Get results
		const errorsAfter = await getErrorCount();
		const topFiles = await getTopErrorFiles(10);
		const commits = await getRecentCommits(3);

		// Create cycle report
		const report: CycleReport = {
			cycle,
			startTime: cycleStart.toISOString(),
			endTime: new Date().toISOString(),
			errorsBefore,
			errorsAfter,
			errorsFixed: errorsBefore - errorsAfter,
			percentReduction: ((errorsBefore - errorsAfter) / errorsBefore) * 100,
			filesFixed: topFiles.slice(0, 10),
			commits,
			status: result.success
				? errorsAfter < errorsBefore
					? "success"
					: "partial"
				: "error",
			notes: result.success ? "" : result.output.slice(0, 500),
		};

		state.reports.push(report);
		state.currentErrors = errorsAfter;
		state.totalCycles = cycle;
		state.totalErrorsFixed = state.initialErrors - errorsAfter;
		state.totalPercentReduction =
			((state.initialErrors - errorsAfter) / state.initialErrors) * 100;

		// Save report
		saveReport(state);

		// Commit progress report
		await commitProgress(
			`📊 chore: TypeScript error fix report (cycle ${cycle}, ${errorsAfter} errors remaining)`,
		);

		// Check if we're done
		if (errorsAfter === 0) {
			break;
		}

		// Check if we're making progress
		if (report.errorsFixed <= 0 && cycle > 1) {
			// Continue anyway - might just need a different approach
		}
		await new Promise((resolve) => setTimeout(resolve, 5000));
	}
}

// Run
main().catch(console.error);
