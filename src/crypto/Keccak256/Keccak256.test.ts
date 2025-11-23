import { describe, expect, it } from "vitest";
import * as Keccak256Module from "./Keccak256.js";
import { hash } from "./hash.js";
import { hashString } from "./hashString.js";
import { hashHex } from "./hashHex.js";

describe("Keccak256 namespace", () => {
	describe("exports", () => {
		it("exports constants", () => {
			expect(Keccak256Module.DIGEST_SIZE).toBeDefined();
			expect(Keccak256Module.RATE).toBeDefined();
			expect(Keccak256Module.STATE_SIZE).toBeDefined();
		});

		it("exports core functions", () => {
			expect(Keccak256Module.from).toBeDefined();
			expect(Keccak256Module.hash).toBeDefined();
			expect(Keccak256Module.hashString).toBeDefined();
			expect(Keccak256Module.hashHex).toBeDefined();
			expect(Keccak256Module.hashMultiple).toBeDefined();
		});

		it("exports Ethereum-specific functions", () => {
			expect(Keccak256Module.selector).toBeDefined();
			expect(Keccak256Module.topic).toBeDefined();
			expect(Keccak256Module.contractAddress).toBeDefined();
			expect(Keccak256Module.create2Address).toBeDefined();
		});

		it("exports Keccak256Hash namespace", () => {
			expect(Keccak256Module.Keccak256Hash).toBeDefined();
		});

		it("exports Keccak256 alias", () => {
			expect(Keccak256Module.Keccak256).toBeDefined();
		});
	});

	describe("Keccak256Hash namespace", () => {
		const { Keccak256Hash } = Keccak256Module;

		it("is callable as function (from)", () => {
			const result = Keccak256Hash(new Uint8Array([1, 2, 3]));
			expect(result.length).toBe(32);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("has from method", () => {
			expect(typeof Keccak256Hash.from).toBe("function");
			const result = Keccak256Hash.from(new Uint8Array([1, 2, 3]));
			expect(result.length).toBe(32);
		});

		it("has fromString method", () => {
			expect(typeof Keccak256Hash.fromString).toBe("function");
			const result = Keccak256Hash.fromString("hello");
			expect(result.length).toBe(32);
		});

		it("has fromHex method", () => {
			expect(typeof Keccak256Hash.fromHex).toBe("function");
			const result = Keccak256Hash.fromHex("0x1234");
			expect(result.length).toBe(32);
		});

		it("has fromTopic method", () => {
			expect(typeof Keccak256Hash.fromTopic).toBe("function");
			const result = Keccak256Hash.fromTopic(
				"Transfer(address,address,uint256)",
			);
			expect(result.length).toBe(32);
		});

		it("has hash method", () => {
			expect(typeof Keccak256Hash.hash).toBe("function");
			const result = Keccak256Hash.hash(new Uint8Array([1, 2, 3]));
			expect(result.length).toBe(32);
		});

		it("has hashString method", () => {
			expect(typeof Keccak256Hash.hashString).toBe("function");
			const result = Keccak256Hash.hashString("test");
			expect(result.length).toBe(32);
		});

		it("has hashHex method", () => {
			expect(typeof Keccak256Hash.hashHex).toBe("function");
			const result = Keccak256Hash.hashHex("0xabcd");
			expect(result.length).toBe(32);
		});

		it("has hashMultiple method", () => {
			expect(typeof Keccak256Hash.hashMultiple).toBe("function");
			const result = Keccak256Hash.hashMultiple([new Uint8Array([1, 2])]);
			expect(result.length).toBe(32);
		});

		it("has selector method", () => {
			expect(typeof Keccak256Hash.selector).toBe("function");
			const result = Keccak256Hash.selector("transfer(address,uint256)");
			expect(result.length).toBe(4);
		});

		it("has topic method", () => {
			expect(typeof Keccak256Hash.topic).toBe("function");
			const result = Keccak256Hash.topic("Transfer(address,address,uint256)");
			expect(result.length).toBe(32);
		});

		it("has contractAddress method", () => {
			expect(typeof Keccak256Hash.contractAddress).toBe("function");
			const result = Keccak256Hash.contractAddress(new Uint8Array(20), 0n);
			expect(result.length).toBe(20);
		});

		it("has create2Address method", () => {
			expect(typeof Keccak256Hash.create2Address).toBe("function");
			const result = Keccak256Hash.create2Address(
				new Uint8Array(20),
				new Uint8Array(32),
				new Uint8Array(32),
			);
			expect(result.length).toBe(20);
		});

		it("has DIGEST_SIZE constant", () => {
			expect(Keccak256Hash.DIGEST_SIZE).toBe(32);
		});

		it("has RATE constant", () => {
			expect(Keccak256Hash.RATE).toBe(136);
		});

		it("has STATE_SIZE constant", () => {
			expect(Keccak256Hash.STATE_SIZE).toBe(25);
		});
	});

	describe("Keccak256 alias", () => {
		it("is same as Keccak256Hash", () => {
			expect(Keccak256Module.Keccak256).toBe(Keccak256Module.Keccak256Hash);
		});

		it("has all same methods", () => {
			const { Keccak256 } = Keccak256Module;
			expect(Keccak256.from).toBeDefined();
			expect(Keccak256.fromString).toBeDefined();
			expect(Keccak256.fromHex).toBeDefined();
			expect(Keccak256.hash).toBeDefined();
			expect(Keccak256.selector).toBeDefined();
			expect(Keccak256.topic).toBeDefined();
		});
	});

	describe("API consistency", () => {
		const { Keccak256Hash } = Keccak256Module;

		it("from and hash produce same result for Uint8Array", () => {
			const data = new Uint8Array([1, 2, 3, 4, 5]);
			const fromResult = Keccak256Hash.from(data);
			const hashResult = Keccak256Hash.hash(data);

			expect(fromResult).toEqual(hashResult);
		});

		it("fromString and hashString produce same result", () => {
			const str = "hello world";
			const fromResult = Keccak256Hash.fromString(str);
			const hashResult = Keccak256Hash.hashString(str);

			expect(fromResult).toEqual(hashResult);
		});

		it("fromHex and hashHex produce same result", () => {
			const hex = "0x1234abcd";
			const fromResult = Keccak256Hash.fromHex(hex);
			const hashResult = Keccak256Hash.hashHex(hex);

			expect(fromResult).toEqual(hashResult);
		});

		it("fromTopic and topic produce same result", () => {
			const sig = "Transfer(address,address,uint256)";
			const fromResult = Keccak256Hash.fromTopic(sig);
			const topicResult = Keccak256Hash.topic(sig);

			expect(fromResult).toEqual(topicResult);
		});
	});

	describe("function callable", () => {
		const { Keccak256Hash } = Keccak256Module;

		it("can be called directly with Uint8Array", () => {
			const result = Keccak256Hash(new Uint8Array([1, 2, 3]));
			expect(result.length).toBe(32);
		});

		it("can be called directly with hex string", () => {
			const result = Keccak256Hash("0x1234");
			expect(result.length).toBe(32);
		});

		it("can be called directly with plain string", () => {
			const result = Keccak256Hash("hello");
			expect(result.length).toBe(32);
		});

		it("direct call matches from()", () => {
			const data = new Uint8Array([1, 2, 3]);
			const direct = Keccak256Hash(data);
			const fromCall = Keccak256Hash.from(data);

			expect(direct).toEqual(fromCall);
		});
	});

	describe("comprehensive usage", () => {
		const { Keccak256Hash } = Keccak256Module;

		it("hash Uint8Array data", () => {
			const data = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const result = Keccak256Hash.hash(data);

			expect(result.length).toBe(32);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("hash UTF-8 string", () => {
			const result = Keccak256Hash.hashString("Hello, Voltaire!");

			expect(result.length).toBe(32);
		});

		it("hash hex-encoded data", () => {
			const result = Keccak256Hash.hashHex("0xdeadbeef");

			expect(result.length).toBe(32);
		});

		it("hash multiple chunks", () => {
			const chunks = [
				new Uint8Array([1, 2]),
				new Uint8Array([3, 4]),
				new Uint8Array([5, 6]),
			];
			const result = Keccak256Hash.hashMultiple(chunks);

			expect(result.length).toBe(32);
		});

		it("compute function selector", () => {
			const result = Keccak256Hash.selector("transfer(address,uint256)");

			expect(result.length).toBe(4);
			expect(result[0]).toBe(0xa9);
			expect(result[1]).toBe(0x05);
			expect(result[2]).toBe(0x9c);
			expect(result[3]).toBe(0xbb);
		});

		it("compute event topic", () => {
			const result = Keccak256Hash.topic("Transfer(address,address,uint256)");

			expect(result.length).toBe(32);
			expect(result[0]).toBe(0xdd);
			expect(result[1]).toBe(0xf2);
			expect(result[2]).toBe(0x52);
			expect(result[3]).toBe(0xad);
		});

		it("derive CREATE contract address", () => {
			const sender = new Uint8Array(20).fill(0x12);
			const nonce = 5n;
			const result = Keccak256Hash.contractAddress(sender, nonce);

			expect(result.length).toBe(20);
		});

		it("derive CREATE2 contract address", () => {
			const deployer = new Uint8Array(20).fill(0xaa);
			const salt = new Uint8Array(32).fill(0xbb);
			const initCodeHash = new Uint8Array(32).fill(0xcc);
			const result = Keccak256Hash.create2Address(deployer, salt, initCodeHash);

			expect(result.length).toBe(20);
		});
	});

	describe("constants accessibility", () => {
		const { Keccak256Hash } = Keccak256Module;

		it("DIGEST_SIZE is 32", () => {
			expect(Keccak256Hash.DIGEST_SIZE).toBe(32);
		});

		it("RATE is 136", () => {
			expect(Keccak256Hash.RATE).toBe(136);
		});

		it("STATE_SIZE is 25", () => {
			expect(Keccak256Hash.STATE_SIZE).toBe(25);
		});

		it("constants match module exports", () => {
			expect(Keccak256Hash.DIGEST_SIZE).toBe(Keccak256Module.DIGEST_SIZE);
			expect(Keccak256Hash.RATE).toBe(Keccak256Module.RATE);
			expect(Keccak256Hash.STATE_SIZE).toBe(Keccak256Module.STATE_SIZE);
		});
	});

	describe("cross-validation with individual imports", () => {
		const { Keccak256Hash } = Keccak256Module;

		it("hash matches direct import", () => {
			const data = new Uint8Array([1, 2, 3]);
			const namespaceResult = Keccak256Hash.hash(data);
			const directResult = hash(data);

			expect(namespaceResult).toEqual(directResult);
		});

		it("hashString matches direct import", () => {
			const str = "test";
			const namespaceResult = Keccak256Hash.hashString(str);
			const directResult = hashString(str);

			expect(namespaceResult).toEqual(directResult);
		});

		it("hashHex matches direct import", () => {
			const hex = "0x1234";
			const namespaceResult = Keccak256Hash.hashHex(hex);
			const directResult = hashHex(hex);

			expect(namespaceResult).toEqual(directResult);
		});
	});

	describe("type safety", () => {
		it("all hash functions return Uint8Array", () => {
			const { Keccak256Hash } = Keccak256Module;

			const hash1 = Keccak256Hash.hash(new Uint8Array([1]));
			const hash2 = Keccak256Hash.hashString("test");
			const hash3 = Keccak256Hash.hashHex("0x12");
			const hash4 = Keccak256Hash.hashMultiple([new Uint8Array([1])]);
			const topic1 = Keccak256Hash.topic("Event()");

			expect(hash1).toBeInstanceOf(Uint8Array);
			expect(hash2).toBeInstanceOf(Uint8Array);
			expect(hash3).toBeInstanceOf(Uint8Array);
			expect(hash4).toBeInstanceOf(Uint8Array);
			expect(topic1).toBeInstanceOf(Uint8Array);
		});

		it("selector returns 4-byte Uint8Array", () => {
			const { Keccak256Hash } = Keccak256Module;
			const sel = Keccak256Hash.selector("func()");

			expect(sel).toBeInstanceOf(Uint8Array);
			expect(sel.length).toBe(4);
		});

		it("address functions return 20-byte Uint8Array", () => {
			const { Keccak256Hash } = Keccak256Module;

			const addr1 = Keccak256Hash.contractAddress(new Uint8Array(20), 0n);
			const addr2 = Keccak256Hash.create2Address(
				new Uint8Array(20),
				new Uint8Array(32),
				new Uint8Array(32),
			);

			expect(addr1).toBeInstanceOf(Uint8Array);
			expect(addr1.length).toBe(20);
			expect(addr2).toBeInstanceOf(Uint8Array);
			expect(addr2.length).toBe(20);
		});
	});

	describe("Ethereum workflow", () => {
		const { Keccak256Hash } = Keccak256Module;

		it("supports full contract deployment flow", () => {
			const deployer = new Uint8Array(20).fill(0x42);
			const nonce = 0n;
			const contractAddr = Keccak256Hash.contractAddress(deployer, nonce);

			expect(contractAddr.length).toBe(20);
		});

		it("supports CREATE2 factory pattern", () => {
			const factory = new Uint8Array(20).fill(0xfa);
			const salt = new Uint8Array(32).fill(0x00);
			const bytecode = new TextEncoder().encode("contract code");
			const initCodeHash = Keccak256Hash.hash(bytecode);
			const predictedAddr = Keccak256Hash.create2Address(
				factory,
				salt,
				initCodeHash,
			);

			expect(predictedAddr.length).toBe(20);
		});

		it("supports event filtering workflow", () => {
			const transferTopic = Keccak256Hash.topic(
				"Transfer(address,address,uint256)",
			);
			const approvalTopic = Keccak256Hash.topic(
				"Approval(address,address,uint256)",
			);

			expect(transferTopic.length).toBe(32);
			expect(approvalTopic.length).toBe(32);
			expect(transferTopic).not.toEqual(approvalTopic);
		});

		it("supports transaction encoding workflow", () => {
			const functionSig = "transfer(address,uint256)";
			const selector = Keccak256Hash.selector(functionSig);

			expect(selector.length).toBe(4);
			expect(selector[0]).toBe(0xa9);
		});
	});

	describe("immutability", () => {
		it("namespace object can be modified (not frozen)", () => {
			const { Keccak256Hash } = Keccak256Module;

			// Object.assign creates a mutable object
			expect(() => {
				// @ts-expect-error - adding property to object
				Keccak256Hash.newMethod = () => {};
			}).not.toThrow();
		});
	});

	describe("backward compatibility", () => {
		it("Keccak256 alias works identically", () => {
			const { Keccak256, Keccak256Hash } = Keccak256Module;

			const data = new Uint8Array([1, 2, 3]);

			expect(Keccak256(data)).toEqual(Keccak256Hash(data));
			expect(Keccak256.hash(data)).toEqual(Keccak256Hash.hash(data));
			expect(Keccak256.hashString("test")).toEqual(
				Keccak256Hash.hashString("test"),
			);
		});
	});

	describe("edge cases", () => {
		const { Keccak256Hash } = Keccak256Module;

		it("handles empty input", () => {
			const result = Keccak256Hash.hash(new Uint8Array(0));
			expect(result.length).toBe(32);
		});

		it("handles large input", () => {
			const large = new Uint8Array(10000).fill(0xaa);
			const result = Keccak256Hash.hash(large);
			expect(result.length).toBe(32);
		});

		it("handles unicode strings", () => {
			const result = Keccak256Hash.hashString("Hello 世界 🌍");
			expect(result.length).toBe(32);
		});

		it("handles zero address", () => {
			const zero = new Uint8Array(20);
			const result = Keccak256Hash.contractAddress(zero, 0n);
			expect(result.length).toBe(20);
		});
	});
});
