import { describe, expect, it } from "vitest";
import * as BrandedBytecode from "./index.js";

describe("toAbi", () => {
	// Simple contract with 2 functions:
	// - transfer(address,uint256) selector: 0xa9059cbb
	// - balanceOf(address) selector: 0x70a08231
	const simpleERC20Bytecode =
		"0x608060405234801561001057600080fd5b506004361061002b5760003560e01c806370a0823114610030578063a9059cbb1461005f575b600080fd5b61004a600480360381019061004591906100c7565b61008b565b60405161005691906100ff565b60405180910390f35b61007960048036038101906100749190610150565b6100a3565b60405161008291906101ab565b60405180910390f35b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60008115159050919050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061010d826100e2565b9050919050565b61011d81610102565b811461012857600080fd5b50565b60008135905061013a81610114565b92915050565b6000819050919050565b61015381610140565b811461015e57600080fd5b50565b6000813590506101708161014a565b92915050565b6000806040838503121561018d5761018c6100dd565b5b600061019b8582860161012b565b92505060206101ac85828601610161565b9150509250929050565b6101bf816100c0565b82525050565b60006020820190506101da60008301846101b6565b92915050565b60006020828403121561016f5761016e6100dd565b5b600061017d8482850161012b565b91505092915050565b61018f81610140565b82525050565b60006020820190506101aa6000830184610186565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b838110156101ea5780820151818401526020810190506101cf565b838111156101f9576000848401525b50505050565b6000601f19601f8301169050919050565b600061021b826101b0565b61022581856101bb565b93506102358185602086016101cc565b61023e816101ff565b840191505092915050565b6000602082019050818103600083015261026381846102105600a26469706673582212206f4d8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f64736f6c63430008090033";

	// Contract with Transfer event
	// Transfer(address,address,uint256) hash: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
	const contractWithEvent =
		"0x608060405234801561001057600080fd5b50610200806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c80637c0dcb5f14610030575b600080fd5b61004a60048036038101906100459190610150565b61004c565b005b8173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516100a991906100ff565b60405180910390a35050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006100e5826100ba565b9050919050565b6100f5816100da565b811461010057600080fd5b50565b600081359050610112816100ec565b92915050565b6000819050919050565b61012b81610118565b811461013657600080fd5b50565b60008135905061014881610122565b92915050565b600080600060608486031215610167576101666100b5565b5b600061017586828701610103565b935050602061018686828701610103565b925050604061019786828701610139565b9150509250925092565b6101aa81610118565b82525050565b60006020820190506101c560008301846101a1565b9291505056fea2646970667358221220";

	it("extracts function selectors from bytecode", () => {
		const bytecode = BrandedBytecode.from(simpleERC20Bytecode);
		const abi = BrandedBytecode.toAbi(bytecode);

		expect(Array.isArray(abi)).toBe(true);
		expect(abi.length).toBeGreaterThan(0);

		const functions = abi.filter((item) => item.type === "function");
		expect(functions.length).toBeGreaterThan(0);

		// Check for specific selectors
		const selectors = functions.map((f) => f.selector);
		expect(selectors).toContain("0xa9059cbb"); // transfer
		expect(selectors).toContain("0x70a08231"); // balanceOf
	});

	it("extracts events from bytecode", () => {
		const bytecode = BrandedBytecode.from(contractWithEvent);
		const abi = BrandedBytecode.toAbi(bytecode);

		const events = abi.filter((item) => item.type === "event");
		expect(events.length).toBeGreaterThan(0);

		// Check for Transfer event hash
		const hashes = events.map((e) => e.hash);
		expect(hashes).toContain(
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		);
	});

	it("sets stateMutability for functions", () => {
		const bytecode = BrandedBytecode.from(simpleERC20Bytecode);
		const abi = BrandedBytecode.toAbi(bytecode);

		const functions = abi.filter((item) => item.type === "function");

		for (const func of functions) {
			expect(func.stateMutability).toBeDefined();
			expect(["pure", "view", "nonpayable", "payable"]).toContain(
				func.stateMutability,
			);
		}
	});

	it("sets payable flag for functions", () => {
		const bytecode = BrandedBytecode.from(simpleERC20Bytecode);
		const abi = BrandedBytecode.toAbi(bytecode);

		const functions = abi.filter((item) => item.type === "function");

		for (const func of functions) {
			expect(typeof func.payable).toBe("boolean");
		}
	});

	it("returns branded ABI type", () => {
		const bytecode = BrandedBytecode.from(simpleERC20Bytecode);
		const abi = BrandedBytecode.toAbi(bytecode);

		// Type should have __tag property
		expect((abi as any).__tag).toBe("Abi");
	});

	it("handles empty bytecode", () => {
		const bytecode = BrandedBytecode.from("0x");
		const abi = BrandedBytecode.toAbi(bytecode);

		expect(Array.isArray(abi)).toBe(true);
		expect((abi as any).__tag).toBe("Abi");
	});

	it("handles minimal bytecode", () => {
		// Just STOP opcode
		const bytecode = BrandedBytecode.from("0x00");
		const abi = BrandedBytecode.toAbi(bytecode);

		expect(Array.isArray(abi)).toBe(true);
		expect((abi as any).__tag).toBe("Abi");
	});

	it("returns readonly array", () => {
		const bytecode = BrandedBytecode.from(simpleERC20Bytecode);
		const abi = BrandedBytecode.toAbi(bytecode);

		// Should be frozen/readonly
		expect(() => {
			(abi as any).push({ type: "function", selector: "0x00000000" });
		}).toThrow();
	});
});
