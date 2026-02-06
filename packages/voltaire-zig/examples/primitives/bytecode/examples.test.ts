import { describe, test } from "vitest";

describe("Bytecode Primitive Examples", () => {
	test("basic-usage example works", async () => {
		await import("./basic-usage.js");
	});

	test("bytecode-analysis example works", async () => {
		await import("./bytecode-analysis.js");
	});

	test("contract-deployment example works", async () => {
		await import("./contract-deployment.js");
	});

	test("disassembly example works", async () => {
		await import("./disassembly.js");
	});

	test("metadata-handling example works", async () => {
		await import("./metadata-handling.js");
	});

	test("opcode-reference example works", async () => {
		await import("./opcode-reference.js");
	});

	test("validation example works", async () => {
		await import("./validation.js");
	});
});
