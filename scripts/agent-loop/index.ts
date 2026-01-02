#!/usr/bin/env bun
/**
 * Generalized Agent Loop Framework
 *
 * A reusable framework for running Claude Code in automated cycles
 * to fix issues, reduce errors, or complete tasks iteratively.
 *
 * Usage:
 *   bun run scripts/agent-loop/index.ts <task-name> [options]
 *
 * Example:
 *   bun run scripts/agent-loop/index.ts fix-typescript-errors --max-cycles=10
 *   bun run scripts/agent-loop/index.ts fix-test-failures --max-cycles=15
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ============================================================================
// Types
// ============================================================================

export interface TaskConfig {
	/** Unique task identifier */
	id: string;
	/** Human-readable task name */
	name: string;
	/** Directory for reports */
	reportsDir: string;
	/** Max budget per cycle in USD */
	maxBudgetPerCycle: number;
	/** Target value (e.g., 0 errors) */
	targetValue: number;
	/** Check current state, returns numeric value (e.g., error count) */
	checkState: () => Promise<TaskState>;
	/** Generate the handoff prompt for Claude */
	generatePrompt: (state: SessionState) => string;
	/** Optional: get additional context for reports */
	getContext?: () => Promise<Record<string, unknown>>;
}

export interface TaskState {
	/** Current numeric value (e.g., error count, test failures) */
	value: number;
	/** Human-readable status */
	status: string;
	/** Additional details */
	details?: string[];
}

export interface CycleReport {
	cycle: number;
	startTime: string;
	endTime: string;
	valueBefore: number;
	valueAfter: number;
	delta: number;
	percentReduction: number;
	status: "success" | "error" | "partial" | "no_progress";
	output: string;
}

export interface SessionState {
	taskId: string;
	taskName: string;
	totalCycles: number;
	initialValue: number;
	currentValue: number;
	totalDelta: number;
	totalPercentReduction: number;
	reports: CycleReport[];
	lastHandoff: string;
}

// ============================================================================
// Core Agent Loop
// ============================================================================

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: agent loop logic
export async function runAgentLoop(
	config: TaskConfig,
	options: { maxCycles?: number; maxBudget?: number } = {},
): Promise<SessionState> {
	const maxCycles = options.maxCycles ?? 15;
	const maxBudgetPerCycle = options.maxBudget ?? config.maxBudgetPerCycle;

	// Initialize state
	const initialState = await config.checkState();

	if (initialState.value === config.targetValue) {
		return createInitialSessionState(config, initialState.value);
	}

	const state: SessionState = createInitialSessionState(
		config,
		initialState.value,
	);

	// Ensure reports directory exists
	const reportsDir = join(process.cwd(), config.reportsDir);
	if (!existsSync(reportsDir)) {
		mkdirSync(reportsDir, { recursive: true });
	}

	// Main loop
	for (let cycle = 1; cycle <= maxCycles; cycle++) {
		const cycleStart = new Date();
		const stateBefore = await config.checkState();

		// Generate prompt
		const prompt = config.generatePrompt(state);
		state.lastHandoff = prompt;

		// Run Claude Code
		const result = await runClaudeCodeCycle(
			prompt,
			cycle,
			config.id,
			maxBudgetPerCycle,
		);

		// Check results
		const stateAfter = await config.checkState();
		const delta = stateBefore.value - stateAfter.value;

		// Create cycle report
		const report: CycleReport = {
			cycle,
			startTime: cycleStart.toISOString(),
			endTime: new Date().toISOString(),
			valueBefore: stateBefore.value,
			valueAfter: stateAfter.value,
			delta,
			percentReduction:
				stateBefore.value > 0 ? (delta / stateBefore.value) * 100 : 0,
			status: result.success
				? delta > 0
					? "success"
					: "no_progress"
				: "error",
			output: result.output.slice(0, 2000), // Truncate for storage
		};

		state.reports.push(report);
		state.currentValue = stateAfter.value;
		state.totalCycles = cycle;
		state.totalDelta = state.initialValue - stateAfter.value;
		state.totalPercentReduction =
			state.initialValue > 0
				? ((state.initialValue - stateAfter.value) / state.initialValue) * 100
				: 0;

		// Save report
		saveReport(config, state);

		// Commit progress
		await commitProgress(
			`📊 chore: ${config.name} report (cycle ${cycle}, ${stateAfter.value} remaining)`,
		);

		// Check if done
		if (stateAfter.value === config.targetValue) {
			break;
		}

		// Check for stuck cycles
		if (delta === 0 && cycle > 1) {
			const lastTwo = state.reports.slice(-2);
			if (lastTwo.length === 2 && lastTwo.every((r) => r.delta === 0)) {
			}
		}

		// Small delay between cycles
		if (cycle < maxCycles) {
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}

	// Final summary
	printFinalSummary(config, state);

	return state;
}

// ============================================================================
// Helper Functions
// ============================================================================

function createInitialSessionState(
	config: TaskConfig,
	initialValue: number,
): SessionState {
	return {
		taskId: config.id,
		taskName: config.name,
		totalCycles: 0,
		initialValue,
		currentValue: initialValue,
		totalDelta: 0,
		totalPercentReduction: 0,
		reports: [],
		lastHandoff: "",
	};
}

async function runClaudeCodeCycle(
	prompt: string,
	cycleNum: number,
	taskId: string,
	maxBudget: number,
): Promise<{ success: boolean; output: string }> {
	const promptFile = `/tmp/claude-prompt-${taskId}-${cycleNum}.txt`;
	writeFileSync(promptFile, prompt);

	try {
		const proc = Bun.spawn(
			[
				"sh",
				"-c",
				`cat "${promptFile}" | claude --print --dangerously-skip-permissions --permission-mode acceptEdits --output-format text --max-budget-usd ${maxBudget}`,
			],
			{
				cwd: process.cwd(),
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const timeoutMs = 900000; // 15 minutes
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => {
				proc.kill();
				reject(new Error(`Timeout after ${timeoutMs}ms`));
			}, timeoutMs);
		});

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

function saveReport(config: TaskConfig, state: SessionState): void {
	const reportsDir = join(process.cwd(), config.reportsDir);
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const reportPath = join(reportsDir, `session-${timestamp}.json`);
	const summaryPath = join(reportsDir, "LATEST.md");

	// Save JSON
	writeFileSync(reportPath, JSON.stringify(state, null, 2));

	// Save markdown summary
	const summary = `# ${config.name} Progress

**Last Updated:** ${new Date().toISOString()}

## Summary
- **Initial:** ${state.initialValue}
- **Current:** ${state.currentValue}
- **Total Fixed:** ${state.totalDelta} (${state.totalPercentReduction.toFixed(1)}%)
- **Cycles:** ${state.totalCycles}

## Recent Cycles
${state.reports
	.slice(-10)
	.map(
		(r) => `
### Cycle ${r.cycle}
- Value: ${r.valueBefore} → ${r.valueAfter} (${r.delta >= 0 ? "-" : "+"}${Math.abs(r.delta)})
- Status: ${r.status}
`,
	)
	.join("\n")}
`;

	writeFileSync(summaryPath, summary);
}

async function commitProgress(message: string): Promise<string | null> {
	try {
		const proc = Bun.spawn(["git", "status", "--porcelain"], {
			stdout: "pipe",
		});
		const status = await new Response(proc.stdout).text();

		if (!status.trim()) {
			return null;
		}

		await Bun.spawn(["git", "add", "-A"]).exited;
		await Bun.spawn(["git", "commit", "-m", message]).exited;

		const hashProc = Bun.spawn(["git", "rev-parse", "--short", "HEAD"], {
			stdout: "pipe",
		});
		const hash = await new Response(hashProc.stdout).text();
		return hash.trim();
	} catch {
		return null;
	}
}

function printFinalSummary(_config: TaskConfig, _state: SessionState): void {}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
	const args = process.argv.slice(2);
	const taskName = args.find((a) => !a.startsWith("--"));

	if (!taskName) {
		process.exit(1);
	}

	const maxCycles = Number.parseInt(
		args.find((a) => a.startsWith("--max-cycles="))?.split("=")[1] ?? "15",
		10,
	);
	const maxBudget = Number.parseFloat(
		args.find((a) => a.startsWith("--max-budget="))?.split("=")[1] ?? "2.0",
	);

	// Dynamic import of task config
	let config: TaskConfig;
	try {
		const module = await import(`./tasks/${taskName}.ts`);
		config = module.default;
	} catch (_e) {
		process.exit(1);
	}

	await runAgentLoop(config, { maxCycles, maxBudget });
}

main().catch(console.error);
