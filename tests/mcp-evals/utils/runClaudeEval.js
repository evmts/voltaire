// Minimal eval runner using the Claude Agent SDK CLI
// Spawns the CLI with an HTTP MCP server and captures the final output.

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @typedef {Object} RunEvalOptions
 * @property {string} prompt - The user prompt/challenge text.
 * @property {string} mcpServerUrl - Full MCP HTTP URL (e.g., https://voltaire.tevm.sh/mcp).
 * @property {string} [rpcUrl] - Ethereum RPC URL to include in context.
 * @property {number} [maxTurns] - Not directly supported by CLI; left for parity.
 * @property {number} [timeoutMs] - Max runtime for the eval process.
 */

/**
 * Runs an eval by invoking the Claude Agent SDK CLI in print mode with
 * a strict MCP config and a strong system prompt that enforces the
 * ANSWER: <value> output format.
 *
 * @param {RunEvalOptions} opts
 */
export async function runClaudeEval(opts) {
	const { prompt, mcpServerUrl, rpcUrl, timeoutMs = 5 * 60 * 1000 } = opts;

	// Find the Claude Agent SDK CLI entry
	const cliPath = resolve(
		process.cwd(),
		"node_modules/.pnpm/@anthropic-ai+claude-agent-sdk@0.1.76_zod@3.25.76/node_modules/@anthropic-ai/claude-agent-sdk/cli.js",
	);

	// Build a strict MCP config so only the provided server is used
	const mcpConfig = {
		mcpServers: {
			tevm: {
				type: "http",
				url: mcpServerUrl,
			},
		},
	};

	// Strong system prompt to constrain output and pass context
	const systemPrompt = [
		"You are solving a deterministic evaluation question using the Voltaire MCP server.",
		'Output MUST end with a single line: "ANSWER: <value>" with no extra text after it.',
		"Prefer exact values, not prose. Do not include explanations in the final line.",
		"When a block number is provided, perform all contract calls and state queries at that exact historical block.",
		"Prefer direct on-chain contract functions over heuristics from logs or off-chain indexes.",
		"For NFT ownership queries: call ERC-721 ownerOf(tokenId) at the specified blockNumber using eth_call/readContract with the blockNumber parameter. Do NOT infer from current state or marketplace data. Return the exact address.",
		'Example: viem readContract({ address: CONTRACT, abi: ["function ownerOf(uint256) view returns (address)"], functionName: "ownerOf", args: [TOKEN_ID], blockNumber: BIGINT_BLOCK }).',
		"For contract deployment discovery tasks: binary search for the earliest block where eth_getCode(address, block) returns non-empty code; then fetch that block's hash.",
		rpcUrl
			? `If needing Ethereum data, use this RPC URL: ${rpcUrl}`
			: undefined,
	]
		.filter(Boolean)
		.join("\n");

	// Spawn the CLI in print+json mode to capture a single response
	const args = [
		"--print",
		"--output-format",
		"text",
		"--mcp-config",
		JSON.stringify(mcpConfig),
		"--strict-mcp-config",
		"--permission-mode",
		"bypassPermissions",
		"--system-prompt",
		systemPrompt,
		prompt,
	];

	// Ensure we have an API key or the user’s environment has system creds
	const env = { ...process.env };

	return new Promise((resolvePromise) => {
		const child = spawn(process.execPath, [cliPath, ...args], {
			cwd: process.cwd(),
			env,
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		const timer = setTimeout(() => {
			child.kill("SIGKILL");
		}, timeoutMs);

		child.stdout.on("data", (d) => {
			stdout += String(d);
		});
		child.stderr.on("data", (d) => {
			stderr += String(d);
		});

		child.on("exit", (code) => {
			clearTimeout(timer);
			const answerMatch = stdout.match(/ANSWER:\s*(.+)$/im);
			const scriptOutput = answerMatch ? answerMatch[1].trim() : undefined;
			const success = Boolean(code === 0 && scriptOutput);
			resolvePromise({
				success,
				scriptOutput,
				error: success
					? undefined
					: `Eval failed${code !== 0 ? ` (exit ${code})` : ""}. StdErr: ${stderr}`,
				messages: stdout,
			});
		});
	});
}
