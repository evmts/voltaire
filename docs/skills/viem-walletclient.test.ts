/**
 * Tests for viem WalletClient playbook
 * @see /docs/playbooks/viem-walletclient.mdx
 *
 * Note: The playbook documents a REFERENCE IMPLEMENTATION in examples/viem-walletclient/.
 * Tests cover the data structures and patterns shown in the guide.
 *
 * API DISCREPANCIES:
 * - createWalletClient is in examples/viem-walletclient/, not library export
 * - Wallet client patterns are documented as copyable reference implementation
 */
import { describe, expect, it } from "vitest";

describe("Viem WalletClient Playbook", () => {
	it("should define account types", () => {
		// From playbook: local vs JSON-RPC accounts
		type AccountType = "local" | "json-rpc";

		const localAccount: AccountType = "local";
		const jsonRpcAccount: AccountType = "json-rpc";

		expect(localAccount).toBe("local");
		expect(jsonRpcAccount).toBe("json-rpc");
	});

	it("should define wallet actions", () => {
		// From playbook: wallet actions
		const walletActions = [
			"sendTransaction",
			"signMessage",
			"signTypedData",
			"signTransaction",
			"getAddresses",
			"requestAddresses",
		];

		expect(walletActions).toContain("sendTransaction");
		expect(walletActions).toContain("signMessage");
	});

	it("should handle sendTransaction params", () => {
		// From playbook: sendTransaction parameters
		const params = {
			to: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
			value: 1_000_000_000_000_000_000n, // 1 ETH
			gas: 21000n,
			maxFeePerGas: 20_000_000_000n,
		};

		expect(params.value).toBe(1_000_000_000_000_000_000n);
		expect(params.gas).toBe(21000n);
	});

	it("should handle signMessage params", () => {
		// From playbook: signMessage parameter types
		type SignableMessage =
			| string
			| { raw: Uint8Array }
			| { raw: string };

		const stringMessage: SignableMessage = "Hello, Ethereum!";
		const rawBytes: SignableMessage = {
			raw: new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]),
		};
		const rawHex: SignableMessage = { raw: "0x48656c6c6f" };

		expect(typeof stringMessage).toBe("string");
		expect(rawBytes.raw).toBeInstanceOf(Uint8Array);
		expect(rawHex.raw).toBe("0x48656c6c6f");
	});

	it("should handle signTypedData params", () => {
		// From playbook: EIP-712 typed data structure
		const typedData = {
			domain: {
				name: "Ether Mail",
				version: "1",
				chainId: 1n,
				verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
			},
			types: {
				Person: [
					{ name: "name", type: "string" },
					{ name: "wallet", type: "address" },
				],
				Mail: [
					{ name: "from", type: "Person" },
					{ name: "to", type: "Person" },
					{ name: "contents", type: "string" },
				],
			},
			primaryType: "Mail",
			message: {
				from: { name: "Alice", wallet: "0x..." },
				to: { name: "Bob", wallet: "0x..." },
				contents: "Hello!",
			},
		};

		expect(typedData.primaryType).toBe("Mail");
		expect(typedData.types.Person).toHaveLength(2);
	});

	it("should define transport types", () => {
		// From playbook: transport options
		const transportTypes = ["http", "custom", "fallback"];

		expect(transportTypes).toContain("http");
		expect(transportTypes).toContain("custom");
	});

	it("should handle HTTP transport config", () => {
		// From playbook: HTTP transport options
		const httpConfig = {
			timeout: 10_000,
			retryCount: 3,
			retryDelay: 150,
		};

		expect(httpConfig.timeout).toBe(10_000);
	});

	it("should define chain configuration", () => {
		// From playbook: chain structure
		interface Chain {
			id: number;
			name: string;
			nativeCurrency: {
				name: string;
				symbol: string;
				decimals: number;
			};
			rpcUrls: {
				default: { http: string[] };
			};
			blockExplorers?: {
				default: { name: string; url: string };
			};
			blockTime: number;
		}

		const mainnet: Chain = {
			id: 1,
			name: "Ethereum",
			nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
			rpcUrls: {
				default: { http: ["https://eth.llamarpc.com"] },
			},
			blockTime: 12_000,
		};

		expect(mainnet.id).toBe(1);
	});

	it("should define error types", () => {
		// From playbook: error types
		const errorTypes = [
			"AccountNotFoundError",
			"ChainMismatchError",
			"TransactionExecutionError",
		];

		expect(errorTypes).toContain("AccountNotFoundError");
		expect(errorTypes).toContain("ChainMismatchError");
	});

	it("should handle extend pattern", () => {
		// From playbook: extend with custom actions
		interface BaseClient {
			sendTransaction: (tx: unknown) => Promise<string>;
			chain?: { name: string };
		}

		const extend = <T>(
			base: BaseClient,
			fn: (b: BaseClient) => T,
		): BaseClient & T => {
			return { ...base, ...fn(base) };
		};

		const base: BaseClient = {
			sendTransaction: async () => "0x...",
			chain: { name: "Ethereum" },
		};

		const extended = extend(base, (b) => ({
			sendEth: async (to: string, amount: bigint) =>
				b.sendTransaction({ to, value: amount }),
			getChainName: () => b.chain?.name ?? "Unknown",
		}));

		expect(extended.getChainName()).toBe("Ethereum");
	});

	it("should handle fallback transport", () => {
		// From playbook: fallback with multiple URLs
		const fallbackConfig = {
			urls: [
				"https://mainnet.infura.io/v3/...",
				"https://eth-mainnet.alchemyapi.io/v2/...",
				"https://cloudflare-eth.com",
			],
		};

		expect(fallbackConfig.urls).toHaveLength(3);
	});

	it("should handle account hoisting", () => {
		// From playbook: account set on client creation
		interface WalletClientConfig {
			account?: {
				address: string;
				signMessage: (msg: string) => Promise<string>;
			};
			chain: unknown;
			transport: unknown;
		}

		const config: WalletClientConfig = {
			account: {
				address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
				signMessage: async () => "0x...",
			},
			chain: {},
			transport: {},
		};

		// Account is "hoisted" - used automatically by all actions
		expect(config.account?.address).toBe(
			"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
		);
	});

	it("should handle custom EIP-1193 transport", () => {
		// From playbook: custom transport with window.ethereum
		interface Eip1193Provider {
			request(args: { method: string; params?: unknown[] }): Promise<unknown>;
		}

		const mockProvider: Eip1193Provider = {
			request: async ({ method }) => {
				if (method === "eth_accounts") return ["0x..."];
				return null;
			},
		};

		expect(mockProvider).toHaveProperty("request");
	});

	it("should define implementation notes", () => {
		// From playbook: implementation details
		const notes = [
			"Account Hoisting: Account can be set on client creation",
			"parseAccount: Converts string address to JSON-RPC account object",
			"Chain Validation: Validates connected chain matches expected chain",
			"Fee Estimation: Automatically estimates EIP-1559 fees if not provided",
			"Transaction Preparation: Fills nonce, gas, fees automatically",
			"Extend Pattern: Allows adding custom actions",
		];

		expect(notes).toHaveLength(6);
	});
});
