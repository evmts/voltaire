import { describe, expect, test } from "vitest";
import * as Address from "../Address/internal-index.js";
import { Bytes } from "../Bytes/index.js";
import * as Hex from "../Hex/index.js";
import { InvalidTransactionUrlError } from "./errors.js";
import { format } from "./format.js";
import { from } from "./from.js";
import { parse } from "./parse.js";

describe("ERC-681 Transaction URLs", () => {
	// Test address (valid Ethereum address)
	const testAddress = Address.from(
		"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
	);
	const recipientAddress = Address.from(
		"0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
	);

	describe("parse", () => {
		test("parse simple address", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			expect(Address.equals(parsed.target, testAddress)).toBe(true);
			expect(parsed.chainId).toBeUndefined();
			expect(parsed.value).toBeUndefined();
		});

		test("parse with chain ID", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@1",
			);
			expect(Address.equals(parsed.target, testAddress)).toBe(true);
			expect(parsed.chainId).toBe(1n);
		});

		test("parse with different chain IDs", () => {
			const parsed1 = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@137",
			);
			expect(parsed1.chainId).toBe(137n);

			const parsed2 = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@42161",
			);
			expect(parsed2.chainId).toBe(42161n);
		});

		test("parse with value (decimal)", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?value=1000000000000000000",
			);
			expect(parsed.value).toBe(1000000000000000000n);
		});

		test("parse with value (hex)", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?value=0xde0b6b3a7640000",
			);
			expect(parsed.value).toBe(1000000000000000000n);
		});

		test("parse with gas", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?gas=21000",
			);
			expect(parsed.gas).toBe(21000n);
		});

		test("parse with gasPrice", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?gasPrice=50000000000",
			);
			expect(parsed.gasPrice).toBe(50000000000n);
		});

		test("parse with multiple parameters", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@1?value=1000000000000000000&gas=21000&gasPrice=50000000000",
			);
			expect(parsed.chainId).toBe(1n);
			expect(parsed.value).toBe(1000000000000000000n);
			expect(parsed.gas).toBe(21000n);
			expect(parsed.gasPrice).toBe(50000000000n);
		});

		test("parse with data parameter", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?data=0x1234abcd",
			);
			expect(parsed.data).toBeDefined();
			// biome-ignore lint/style/noNonNullAssertion: data is checked above
			expect(Hex.fromBytes(parsed.data!)).toBe("0x1234abcd");
		});

		test("parse with function name", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3/transfer",
			);
			expect(parsed.functionName).toBe("transfer");
		});

		test("parse ERC-20 transfer", () => {
			const url =
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@1/transfer?address=0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed&uint256=100";
			const parsed = parse(url);
			expect(parsed.chainId).toBe(1n);
			expect(parsed.functionName).toBe("transfer");
			expect(parsed.functionParams?.address).toBe(
				"0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
			);
			expect(parsed.functionParams?.uint256).toBe("100");
		});

		test("parse with URL-encoded function name", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3/transfer%20tokens",
			);
			expect(parsed.functionName).toBe("transfer tokens");
		});

		test("parse with URL-encoded parameters", () => {
			const parsed = parse(
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?custom%20param=hello%20world",
			);
			expect(parsed.functionParams?.["custom param"]).toBe("hello world");
		});

		test("parse case-insensitive address", () => {
			const parsed1 = parse(
				"ethereum:0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const parsed2 = parse(
				"ethereum:0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			expect(Address.equals(parsed1.target, parsed2.target)).toBe(true);
		});
	});

	describe("format", () => {
		test("format simple address", () => {
			const url = format({ target: testAddress });
			expect(url).toBe("ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});

		test("format with chain ID", () => {
			const url = format({
				target: testAddress,
				chainId: 1n,
			});
			expect(url).toBe("ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3@1");
		});

		test("format with value", () => {
			const url = format({
				target: testAddress,
				value: 1000000000000000000n,
			});
			expect(url).toBe(
				"ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3?value=1000000000000000000",
			);
		});

		test("format with multiple parameters", () => {
			const url = format({
				target: testAddress,
				chainId: 1n,
				value: 1000000000000000000n,
				gas: 21000n,
				gasPrice: 50000000000n,
			});
			expect(url).toBe(
				"ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3@1?value=1000000000000000000&gas=21000&gasPrice=50000000000",
			);
		});

		test("format with data", () => {
			const data = Bytes.from(Hex.toBytes("0x1234abcd"));
			const url = format({
				target: testAddress,
				data,
			});
			expect(url).toBe(
				"ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3?data=0x1234abcd",
			);
		});

		test("format with function name", () => {
			const url = format({
				target: testAddress,
				functionName: "transfer",
			});
			expect(url).toBe(
				"ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3/transfer",
			);
		});

		test("format ERC-20 transfer", () => {
			const url = format({
				target: testAddress,
				chainId: 1n,
				functionName: "transfer",
				functionParams: {
					address: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
					uint256: "100",
				},
			});
			expect(url).toBe(
				"ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3@1/transfer?address=0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed&uint256=100",
			);
		});

		test("format URL-encodes special characters", () => {
			const url = format({
				target: testAddress,
				functionName: "transfer tokens",
			});
			expect(url).toBe(
				"ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3/transfer%20tokens",
			);
		});

		test("format produces checksummed address", () => {
			const url = format({ target: testAddress });
			expect(url).toContain("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});
	});

	describe("from", () => {
		test("create branded URL from valid string", () => {
			const url = from("ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
			expect(url).toBe("ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
		});

		test("throw on invalid URL", () => {
			expect(() => from("http://example.com")).toThrow(
				InvalidTransactionUrlError,
			);
		});
	});

	describe("round-trip", () => {
		test("format and parse round-trip simple", () => {
			const original = {
				target: testAddress,
				chainId: 1n,
				value: 1000000000000000000n,
			};
			const url = format(original);
			const parsed = parse(url);
			expect(Address.equals(parsed.target, original.target)).toBe(true);
			expect(parsed.chainId).toBe(original.chainId);
			expect(parsed.value).toBe(original.value);
		});

		test("format and parse round-trip with all parameters", () => {
			const original = {
				target: testAddress,
				chainId: 137n,
				value: 5000000000000000000n,
				gas: 100000n,
				gasPrice: 25000000000n,
			};
			const url = format(original);
			const parsed = parse(url);
			expect(Address.equals(parsed.target, original.target)).toBe(true);
			expect(parsed.chainId).toBe(original.chainId);
			expect(parsed.value).toBe(original.value);
			expect(parsed.gas).toBe(original.gas);
			expect(parsed.gasPrice).toBe(original.gasPrice);
		});

		test("format and parse round-trip with function", () => {
			const original = {
				target: testAddress,
				chainId: 1n,
				functionName: "transfer",
				functionParams: {
					address: Address.toChecksummed(recipientAddress),
					uint256: "1000",
				},
			};
			const url = format(original);
			const parsed = parse(url);
			expect(Address.equals(parsed.target, original.target)).toBe(true);
			expect(parsed.chainId).toBe(original.chainId);
			expect(parsed.functionName).toBe(original.functionName);
			expect(parsed.functionParams).toEqual(original.functionParams);
		});

		test("format and parse round-trip with data", () => {
			const data = Bytes.from(Hex.toBytes("0xdeadbeef"));
			const original = {
				target: testAddress,
				data,
			};
			const url = format(original);
			const parsed = parse(url);
			expect(Address.equals(parsed.target, original.target)).toBe(true);
			// biome-ignore lint/style/noNonNullAssertion: data is expected from format/parse round-trip
			expect(Hex.fromBytes(parsed.data!)).toBe(Hex.fromBytes(data));
		});
	});

	describe("error cases", () => {
		test("invalid scheme", () => {
			expect(() => parse("http://example.com")).toThrow(
				InvalidTransactionUrlError,
			);
			expect(() => parse("bitcoin:0x1234")).toThrow(InvalidTransactionUrlError);
		});

		test("invalid address", () => {
			expect(() => parse("ethereum:0xinvalid")).toThrow(
				InvalidTransactionUrlError,
			);
			expect(() => parse("ethereum:notanaddress")).toThrow(
				InvalidTransactionUrlError,
			);
		});

		test("invalid chain ID", () => {
			expect(() =>
				parse("ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@abc"),
			).toThrow(InvalidTransactionUrlError);
			expect(() =>
				parse("ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@-1"),
			).toThrow(InvalidTransactionUrlError);
		});

		test("invalid value parameter", () => {
			expect(() =>
				parse(
					"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?value=notanumber",
				),
			).toThrow(InvalidTransactionUrlError);
		});

		test("invalid gas parameter", () => {
			expect(() =>
				parse(
					"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?gas=invalid",
				),
			).toThrow(InvalidTransactionUrlError);
		});

		test("invalid gasPrice parameter", () => {
			expect(() =>
				parse(
					"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?gasPrice=xyz",
				),
			).toThrow(InvalidTransactionUrlError);
		});

		test("invalid data parameter", () => {
			expect(() =>
				parse(
					"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3?data=nothex",
				),
			).toThrow(InvalidTransactionUrlError);
		});

		test("error includes context", () => {
			try {
				parse("http://example.com");
			} catch (error) {
				if (error instanceof InvalidTransactionUrlError) {
					expect(error.details?.url).toBe("http://example.com");
					expect(error.details?.scheme).toBe("http");
				} else {
					throw error;
				}
			}
		});
	});

	describe("real-world examples", () => {
		test("simple ETH transfer", () => {
			const url =
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@1?value=2500000000000000000";
			const parsed = parse(url);
			expect(Address.equals(parsed.target, testAddress)).toBe(true);
			expect(parsed.chainId).toBe(1n);
			expect(parsed.value).toBe(2500000000000000000n); // 2.5 ETH
		});

		test("ERC-20 token transfer", () => {
			const url =
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@1/transfer?address=0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed&uint256=1000000000000000000";
			const parsed = parse(url);
			expect(parsed.functionName).toBe("transfer");
			expect(parsed.functionParams?.address).toBe(
				"0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
			);
			expect(parsed.functionParams?.uint256).toBe("1000000000000000000");
		});

		test("contract interaction with data", () => {
			const url =
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@1?data=0xa9059cbb0000000000000000000000005aaeb6053f3e94c9b9a09f33669435e7ef1beaed0000000000000000000000000000000000000000000000000de0b6b3a7640000";
			const parsed = parse(url);
			expect(parsed.data).toBeDefined();
			// biome-ignore lint/style/noNonNullAssertion: data is checked above
			expect(Hex.fromBytes(parsed.data!)).toContain("0xa9059cbb"); // transfer(address,uint256) selector
		});

		test("payment request on Polygon", () => {
			const url =
				"ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f251e3@137?value=10000000000000000000";
			const parsed = parse(url);
			expect(parsed.chainId).toBe(137n); // Polygon
			expect(parsed.value).toBe(10000000000000000000n); // 10 MATIC
		});
	});
});
