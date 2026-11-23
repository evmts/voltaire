import { describe, expect, it } from "vitest";
import * as Opcode from "./index.js";

describe("EIP-7939 CLZ metadata", () => {
	it("exports Osaka's opcode and exact gas/stack contract", () => {
		expect(Opcode.CLZ).toBe(0x1e);
		expect(Opcode.info(Opcode.CLZ)).toMatchObject({
			name: "CLZ",
			gasCost: 5,
			stackInputs: 1,
			stackOutputs: 1,
		});
		expect(Opcode.isValid(0x1e)).toBe(true);
		expect(Opcode.isValid(0x1f)).toBe(false);
		expect(Opcode.getCategory(Opcode.CLZ)).toBe("logic");
		expect(Opcode.getDescription(Opcode.CLZ)).toContain("leading zero");
	});

	it("disassembles and formats CLZ without treating it as invalid", () => {
		const instructions = Opcode.parse(new Uint8Array([0x60, 0, 0x1e, 0]));
		expect(
			instructions.map((instruction) => Opcode.name(instruction.opcode)),
		).toEqual(["PUSH1", "CLZ", "STOP"]);
		const clz = instructions[1];
		if (!clz) throw new Error("Expected a decoded CLZ instruction");
		expect(Opcode.format(clz)).toBe("0x0002: CLZ");
	});
});
