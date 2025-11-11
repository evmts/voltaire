// @ts-nocheck
import * as Opcode from "../../Opcode/BrandedOpcode/index.js";
import { analyzeBlocks } from "./analyzeBlocks.js";
import { scan } from "./scan.js";

/**
 * Pretty print bytecode disassembly
 *
 * @param {import('./BrandedBytecode.ts').BrandedBytecode} bytecode
 * @param {import('./BrandedBytecode.ts').PrettyPrintOptions} [options]
 * @returns {string}
 *
 * @example
 * ```typescript
 * const code = Bytecode.from("0x6001600201");
 * console.log(Bytecode.prettyPrint(code));
 * // ┌─────────────────────────────────────┐
 * // │   EVM Bytecode Disassembly          │
 * // │   Size: 5 bytes                     │
 * // │   Gas: 9                            │
 * // └─────────────────────────────────────┘
 * //
 * //  PC   Opcode     Value          Gas  Stack
 * // ──────────────────────────────────────────
 * // 000: PUSH1      0x01            3   [→1]
 * // 002: PUSH1      0x02            3   [→1]
 * // 004: ADD                        3   [2→1]
 * //
 * // Summary:
 * //   Total Gas: 9
 * //   Instructions: 3
 * //   Blocks: 1
 * ```
 */
export function prettyPrint(bytecode, options = {}) {
	const {
		colors = true,
		showGas = true,
		showStack = true,
		showBlocks = false,
		showJumpArrows = false,
		showFusions = false,
		lineNumbers = true,
		showSummary = true,
		maxWidth = 80,
		compact = false,
	} = options;

	const c = colors ? getColors() : noColors();
	const lines = [];

	// Header
	if (!compact) {
		lines.push(`${c.cyan}┌─────────────────────────────────────┐${c.reset}`);
		lines.push(`${c.cyan}│   EVM Bytecode Disassembly          │${c.reset}`);
		const sizeText = `Size: ${bytecode.length} bytes`;
		lines.push(`${c.cyan}│   ${sizeText.padEnd(33)} │${c.reset}`);
		lines.push(`${c.cyan}└─────────────────────────────────────┘${c.reset}`);
		lines.push("");
	}

	// Column headers
	if (!compact) {
		const headers = [];
		if (lineNumbers) headers.push(" PC  ");
		headers.push("Opcode    ");
		headers.push("Value         ");
		if (showGas) headers.push("Gas ");
		if (showStack) headers.push("Stack");
		lines.push(headers.join(" "));
		lines.push("─".repeat(Math.min(maxWidth, headers.join(" ").length)));
	}

	// Scan and format instructions
	let totalGas = 0;
	let instructionCount = 0;
	let blocks = null;

	if (showBlocks) {
		blocks = analyzeBlocks(bytecode);
	}

	let currentBlockIndex = 0;

	for (const inst of scan(bytecode, {
		withGas: showGas,
		withStack: showStack,
	})) {
		const name = Opcode.getName(inst.opcode);
		const parts = [];

		// Show block boundaries
		if (showBlocks && blocks) {
			const block = blocks[currentBlockIndex];
			if (block && inst.pc === block.startPc && inst.pc !== 0) {
				lines.push("");
				lines.push(`${c.gray}; Block ${currentBlockIndex}${c.reset}`);
			}
			if (block && inst.pc >= block.endPc) {
				currentBlockIndex++;
			}
		}

		// Line number
		if (lineNumbers) {
			parts.push(`${inst.pc.toString().padStart(3, "0")}:`);
		}

		// Opcode name
		const isJumpDest = inst.opcode === 0x5b;
		const opcodeName = name.padEnd(10);
		parts.push(
			isJumpDest
				? c.magenta + opcodeName + c.reset
				: c.yellow + opcodeName + c.reset,
		);

		// Value (for PUSH instructions)
		if (inst.type === "push") {
			let hexValue = inst.value.toString(16);
			// Pad to even length for proper hex display
			if (hexValue.length % 2 !== 0) {
				hexValue = `0${hexValue}`;
			}
			const value = `0x${hexValue}`;
			parts.push(c.green + value.padEnd(14) + c.reset);
		} else {
			parts.push(" ".repeat(14));
		}

		// Gas cost
		if (showGas && inst.gas !== undefined) {
			parts.push(inst.gas.toString().padEnd(4));
			totalGas += inst.gas;
		}

		// Stack effect
		if (showStack && inst.stackEffect) {
			const effect = formatStackEffect(
				inst.stackEffect.pop,
				inst.stackEffect.push,
			);
			parts.push(effect);
		}

		lines.push(parts.join(" "));
		instructionCount++;
	}

	// Summary
	if (showSummary && !compact) {
		lines.push("");
		lines.push(`${c.cyan}Summary:${c.reset}`);
		if (showGas) {
			lines.push(`  Total Gas: ${totalGas}`);
		}
		lines.push(`  Instructions: ${instructionCount}`);
		if (showBlocks && blocks) {
			lines.push(`  Blocks: ${blocks.length}`);
		}
	}

	return lines.join("\n");
}

/**
 * Format stack effect as [pop→push]
 * For PUSH operations (pop=0, push>0), show only output as [→push]
 * @param {number} pop
 * @param {number} push
 * @returns {string}
 */
function formatStackEffect(pop, push) {
	// Special format for PUSH instructions (0 inputs, 1+ outputs)
	if (pop === 0 && push > 0) {
		return `[→${push}]`;
	}
	return `[${pop}→${push}]`;
}

/**
 * Get ANSI color codes
 * @returns {object}
 */
function getColors() {
	return {
		reset: "\x1b[0m",
		cyan: "\x1b[36m",
		yellow: "\x1b[33m",
		green: "\x1b[32m",
		magenta: "\x1b[35m",
		gray: "\x1b[90m",
	};
}

/**
 * Get empty color codes (no colors)
 * @returns {object}
 */
function noColors() {
	return {
		reset: "",
		cyan: "",
		yellow: "",
		green: "",
		magenta: "",
		gray: "",
	};
}
