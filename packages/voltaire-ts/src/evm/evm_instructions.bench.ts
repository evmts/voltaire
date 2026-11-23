import { runBenchSuite } from "../bench-harness.js";
import * as Arithmetic from "./arithmetic/index.js";
import * as Bitwise from "./bitwise/index.js";
import * as Comparison from "./comparison/index.js";
import { Frame } from "./Frame/index.js";
import * as Memory from "./memory/index.js";
import { handler_0x50_POP as pop } from "./stack/handlers/0x50_POP.js";
import { handler_0x80_DUP1 as dup1 } from "./stack/handlers/0x80_DUP1.js";
import { handler_0x90_SWAP1 as swap1 } from "./stack/handlers/0x90_SWAP1.js";

const makeFrame = () =>
	Frame({ gas: 10_000_000n, bytecode: new Uint8Array(64) });

await runBenchSuite("voltaire-ts:evm-instructions", [
	{
		name: "Frame.create",
		fn: () => Frame({ gas: 1_000_000n, bytecode: new Uint8Array(32) }),
	},
	{
		name: "Arithmetic.add",
		fn: () => {
			const frame = makeFrame();
			frame.stack.push(123456789n, 987654321n);
			Arithmetic.add(frame);
		},
	},
	{
		name: "Arithmetic.mul",
		fn: () => {
			const frame = makeFrame();
			frame.stack.push(123456789n, 987654321n);
			Arithmetic.mul(frame);
		},
	},
	{
		name: "Arithmetic.exp",
		fn: () => {
			const frame = makeFrame();
			frame.stack.push(10n, 18n);
			Arithmetic.exp(frame);
		},
	},
	{
		name: "Bitwise.SHL",
		fn: () => {
			const frame = makeFrame();
			frame.stack.push(0xdeadbeefn, 32n);
			Bitwise.SHL(frame);
		},
	},
	{
		name: "Comparison.LT",
		fn: () => {
			const frame = makeFrame();
			frame.stack.push(200n, 100n);
			Comparison.LT(frame);
		},
	},
	{
		name: "Memory.mstore+mload",
		fn: () => {
			const frame = makeFrame();
			frame.stack.push(0xdeadbeefn, 0n);
			Memory.mstore(frame);
			frame.stack.push(0n);
			Memory.mload(frame);
		},
	},
	{
		name: "Stack.dup1+swap1+pop",
		fn: () => {
			const frame = makeFrame();
			frame.stack.push(1n, 2n);
			dup1(frame);
			swap1(frame);
			pop(frame);
		},
	},
]);
