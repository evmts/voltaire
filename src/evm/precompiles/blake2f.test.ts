import { describe, expect, it } from "vitest";
import { blake2f as evmBlake2f } from "./precompiles.js";

describe("Blake2f precompile (0x09) - EIP-152", () => {
	describe("Input validation", () => {
		it("rejects empty input", () => {
			const input = new Uint8Array(0);
			const res = evmBlake2f(input, 100n);
			expect(res.success).toBe(false);
			expect(res.error).toBe("Invalid input length");
		});

		it("rejects input shorter than 213 bytes", () => {
			const input = new Uint8Array(212);
			const res = evmBlake2f(input, 100n);
			expect(res.success).toBe(false);
			expect(res.error).toBe("Invalid input length");
		});

		it("rejects input longer than 213 bytes", () => {
			const input = new Uint8Array(214);
			const res = evmBlake2f(input, 100n);
			expect(res.success).toBe(false);
			expect(res.error).toBe("Invalid input length");
		});

		it("rejects exactly 213 bytes input", () => {
			const input = new Uint8Array(213);
			const res = evmBlake2f(input, 0n);
			expect(res.success).toBe(true);
			expect(res.output.length).toBe(64);
		});

		it("rejects input with invalid final flag (2)", () => {
			// EIP-152 test vector 3: malformed final block indicator flag
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000002",
			);
			const res = evmBlake2f(input, 100n);
			expect(res.success).toBe(false);
			expect(res.error).toBe("Invalid input length");
		});

		it("accepts final flag value 0 (false)", () => {
			// EIP-152 test vector 6: f = 0
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000",
			);
			const res = evmBlake2f(input, 12n);
			expect(res.success).toBe(true);
			expect(res.output.length).toBe(64);
		});

		it("accepts final flag value 1 (true)", () => {
			// EIP-152 test vector 5: f = 1
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res = evmBlake2f(input, 12n);
			expect(res.success).toBe(true);
			expect(res.output.length).toBe(64);
		});
	});

	describe("Gas calculation and out of gas", () => {
		it("calculates gas as rounds * 1", () => {
			// 0 rounds
			const input0 = hexToBytes(
				"0000000048c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res0 = evmBlake2f(input0, 0n);
			expect(res0.success).toBe(true);
			expect(res0.gasUsed).toBe(0n);

			// 1 round
			const input1 = hexToBytes(
				"0000000148c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res1 = evmBlake2f(input1, 1n);
			expect(res1.success).toBe(true);
			expect(res1.gasUsed).toBe(1n);

			// 12 rounds
			const input12 = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res12 = evmBlake2f(input12, 12n);
			expect(res12.success).toBe(true);
			expect(res12.gasUsed).toBe(12n);
		});

		it("handles maximum rounds (2^32-1)", () => {
			// 0xFFFFFFFF rounds
			const input = hexToBytes(
				"ffffffff48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res = evmBlake2f(input, 4294967295n);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(4294967295n);
		});

		it("returns out of gas when gasLimit is insufficient", () => {
			// 12 rounds, but only 11 gas
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res = evmBlake2f(input, 11n);
			expect(res.success).toBe(false);
			expect(res.error).toBe("Out of gas");
			expect(res.gasUsed).toBe(12n);
		});

		it("succeeds when gasLimit exactly matches required gas", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res = evmBlake2f(input, 12n);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(12n);
		});
	});

	describe("Rounds parameter parsing", () => {
		it("parses rounds as big-endian uint32", () => {
			// 0x00000000 = 0 rounds
			const input0 = new Uint8Array(213);
			input0[0] = 0x00;
			input0[1] = 0x00;
			input0[2] = 0x00;
			input0[3] = 0x00;
			input0[212] = 0x01; // valid final flag
			const res0 = evmBlake2f(input0, 0n);
			expect(res0.success).toBe(true);
			expect(res0.gasUsed).toBe(0n);

			// 0x00000001 = 1 round
			const input1 = new Uint8Array(213);
			input1[0] = 0x00;
			input1[1] = 0x00;
			input1[2] = 0x00;
			input1[3] = 0x01;
			input1[212] = 0x01;
			const res1 = evmBlake2f(input1, 1n);
			expect(res1.success).toBe(true);
			expect(res1.gasUsed).toBe(1n);

			// 0x00000100 = 256 rounds
			const input256 = new Uint8Array(213);
			input256[0] = 0x00;
			input256[1] = 0x00;
			input256[2] = 0x01;
			input256[3] = 0x00;
			input256[212] = 0x01;
			const res256 = evmBlake2f(input256, 256n);
			expect(res256.success).toBe(true);
			expect(res256.gasUsed).toBe(256n);
		});

		it("handles zero rounds (special case)", () => {
			// EIP-152 test vector 4: 0 rounds
			const input = hexToBytes(
				"0000000048c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const res = evmBlake2f(input, 0n);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(0n);
			expect(res.output.length).toBe(64);
			// When rounds=0, output should be predictable (IV for BLAKE2b)
			const expected = hexToBytes(
				"08c9bcf367e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d282e6ad7f520e511f6c3e2b8c68059b9442be0454267ce079217e1319cde05b",
			);
			expect(bytesToHex(res.output)).toBe(bytesToHex(expected));
		});
	});

	describe("Input format and structure", () => {
		it("accepts valid 213-byte input structure", () => {
			// [4 bytes rounds][64 bytes h][128 bytes m][8 bytes t_0][8 bytes t_1][1 byte f]
			const input = new Uint8Array(213);
			// rounds = 1
			input[3] = 0x01;
			// h = 64 bytes of state (example values)
			for (let i = 4; i < 68; i++) {
				input[i] = i % 256;
			}
			// m = 128 bytes of message block
			for (let i = 68; i < 196; i++) {
				input[i] = i % 256;
			}
			// t_0 and t_1 = 16 bytes of offsets
			for (let i = 196; i < 212; i++) {
				input[i] = 0;
			}
			// f = 1 byte final flag
			input[212] = 0x01;

			const res = evmBlake2f(input, 1n);
			expect(res.success).toBe(true);
			expect(res.output.length).toBe(64);
		});

		it("processes hash state (64 bytes at offset 4)", () => {
			// Verify the h parameter is at bytes 4-67
			const input = new Uint8Array(213);
			input[3] = 0x01; // 1 round
			// Set h to specific pattern
			for (let i = 4; i < 68; i++) {
				input[i] = 0xff;
			}
			input[212] = 0x01;

			const res = evmBlake2f(input, 1n);
			expect(res.success).toBe(true);
			// Output depends on hash computation, just verify structure
			expect(res.output.length).toBe(64);
		});

		it("processes message block (128 bytes at offset 68)", () => {
			// Verify the m parameter is at bytes 68-195
			const input = new Uint8Array(213);
			input[3] = 0x01; // 1 round
			// Set m to specific pattern
			for (let i = 68; i < 196; i++) {
				input[i] = 0xaa;
			}
			input[212] = 0x01;

			const res = evmBlake2f(input, 1n);
			expect(res.success).toBe(true);
			expect(res.output.length).toBe(64);
		});

		it("processes offset counters (16 bytes at offset 196)", () => {
			// Verify t_0 and t_1 parameters at bytes 196-211
			const input = new Uint8Array(213);
			input[3] = 0x01; // 1 round
			// Set t_0 (8 bytes)
			for (let i = 196; i < 204; i++) {
				input[i] = 0x03;
			}
			// Set t_1 (8 bytes)
			for (let i = 204; i < 212; i++) {
				input[i] = 0x00;
			}
			input[212] = 0x01;

			const res = evmBlake2f(input, 1n);
			expect(res.success).toBe(true);
			expect(res.output.length).toBe(64);
		});
	});

	describe("EIP-152 official test vectors", () => {
		it("vector 4: 0 rounds, f=1", () => {
			const input = hexToBytes(
				"0000000048c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const expected = hexToBytes(
				"08c9bcf367e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d282e6ad7f520e511f6c3e2b8c68059b9442be0454267ce079217e1319cde05b",
			);
			const res = evmBlake2f(input, 0n);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(0n);
			expect(bytesToHex(res.output)).toBe(bytesToHex(expected));
		});

		it("vector 5: 12 rounds, f=1", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const expected = hexToBytes(
				"ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
			);
			const res = evmBlake2f(input, 12n);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(12n);
			expect(bytesToHex(res.output)).toBe(bytesToHex(expected));
		});

		it("vector 6: 12 rounds, f=0", () => {
			const input = hexToBytes(
				"0000000c48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000",
			);
			const expected = hexToBytes(
				"75ab69d3190a562c51aef8d88f1c2775876944407270c42c9844252c26d2875298743e7f6d5ea2f2d3e8d226039cd31b4e426ac4f2d3d666a610c2116fde4735",
			);
			const res = evmBlake2f(input, 12n);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(12n);
			expect(bytesToHex(res.output)).toBe(bytesToHex(expected));
		});

		it("vector 7: 1 round, f=1", () => {
			const input = hexToBytes(
				"0000000148c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const expected = hexToBytes(
				"b63a380cb2897d521994a85234ee2c181b5f844d2c624c002677e9703449d2fba551b3a8333bcdf5f2f7e08993d53923de3d64fcc68c034e717b9293fed7a421",
			);
			const res = evmBlake2f(input, 1n);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(1n);
			expect(bytesToHex(res.output)).toBe(bytesToHex(expected));
		});

		it("vector 8: 8000000 rounds (0x007A1200), f=1", () => {
			const input = hexToBytes(
				"007A120048c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b61626300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000001",
			);
			const expected = hexToBytes(
				"6d2ce9e534d50e18ff866ae92d70cceba79bbcd14c63819fe48752c8aca87a4bb7dcc230d22a4047f0486cfcfb50a17b24b2899eb8fca370f22240adb5170189",
			);
			const res = evmBlake2f(input, 8000000n);
			expect(res.success).toBe(true);
			expect(res.gasUsed).toBe(8000000n);
			expect(bytesToHex(res.output)).toBe(bytesToHex(expected));
		});
	});

	describe("Edge cases", () => {
		it("returns 64-byte output for all valid inputs", () => {
			const input = new Uint8Array(213);
			input[3] = 0x01;
			input[212] = 0x01;

			const res = evmBlake2f(input, 1n);
			expect(res.success).toBe(true);
			expect(res.output.length).toBe(64);
		});

		it("handles all-zero input (except valid final flag)", () => {
			const input = new Uint8Array(213);
			input[212] = 0x01; // Only set valid final flag
			const res = evmBlake2f(input, 0n);
			expect(res.success).toBe(true);
			expect(res.output.length).toBe(64);
		});

		it("handles all-max input (with valid rounds and flag)", () => {
			const input = new Uint8Array(213);
			input.fill(0xff);
			// Set valid final flag
			input[212] = 0x01;
			// rounds = 0xFFFFFFFF
			const res = evmBlake2f(input, 4294967295n);
			expect(res.success).toBe(true);
			expect(res.output.length).toBe(64);
		});
	});
});

function hexToBytes(hex: string): Uint8Array {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(clean.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
