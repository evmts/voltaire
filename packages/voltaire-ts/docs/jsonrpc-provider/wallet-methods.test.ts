/**
 * Tests for docs/jsonrpc-provider/wallet-methods.mdx
 *
 * Tests the Wallet RPC Methods documentation for EIP-3326, EIP-747,
 * and EIP-2255 wallet interaction methods.
 */
import { describe, expect, it } from "vitest";

describe("Wallet Methods Documentation", () => {
	describe("Chain Management", () => {
		describe("wallet_switchEthereumChain", () => {
			it("creates request for Ethereum mainnet", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.SwitchEthereumChainRequest("0x1");

				expect(request.method).toBe("wallet_switchEthereumChain");
				expect(request.params?.[0]).toEqual({ chainId: "0x1" });
			});

			it("creates request for Polygon", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.SwitchEthereumChainRequest("0x89");

				expect(request.params?.[0]).toEqual({ chainId: "0x89" });
			});

			it("creates request for Arbitrum", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.SwitchEthereumChainRequest("0xa4b1");

				expect(request.params?.[0]).toEqual({ chainId: "0xa4b1" });
			});
		});

		describe("wallet_addEthereumChain", () => {
			it("creates request with full chain config", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.AddEthereumChainRequest({
					chainId: "0x89",
					chainName: "Polygon Mainnet",
					nativeCurrency: {
						name: "MATIC",
						symbol: "MATIC",
						decimals: 18,
					},
					rpcUrls: ["https://polygon-rpc.com"],
					blockExplorerUrls: ["https://polygonscan.com"],
				});

				expect(request.method).toBe("wallet_addEthereumChain");
				expect(request.params?.[0]).toHaveProperty("chainId", "0x89");
				expect(request.params?.[0]).toHaveProperty(
					"chainName",
					"Polygon Mainnet",
				);
				expect(request.params?.[0]).toHaveProperty("nativeCurrency");
				expect(request.params?.[0]).toHaveProperty("rpcUrls");
			});

			it("creates request for local development chain", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.AddEthereumChainRequest({
					chainId: "0x539", // 1337
					chainName: "Local Development",
					nativeCurrency: {
						name: "Ether",
						symbol: "ETH",
						decimals: 18,
					},
					rpcUrls: ["http://localhost:8545"],
				});

				expect(request.params?.[0]).toHaveProperty("chainId", "0x539");
			});
		});
	});

	describe("Asset Management", () => {
		describe("wallet_watchAsset", () => {
			it("creates request to add ERC20 token", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.WatchAssetRequest({
					type: "ERC20",
					options: {
						address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
						symbol: "DAI",
						decimals: 18,
						image: "https://assets.example.com/dai.png",
					},
				});

				expect(request.method).toBe("wallet_watchAsset");
				expect(request.params).toHaveProperty("type", "ERC20");
				expect(request.params).toHaveProperty("options");
				expect(request.params?.options).toHaveProperty(
					"address",
					"0x6B175474E89094C44Da98b954EedeAC495271d0F",
				);
				expect(request.params?.options).toHaveProperty("symbol", "DAI");
			});

			it("creates request for USDC token", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.WatchAssetRequest({
					type: "ERC20",
					options: {
						address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
						symbol: "USDC",
						decimals: 6,
					},
				});

				expect(request.params?.options).toHaveProperty("decimals", 6);
			});
		});
	});

	describe("Permissions", () => {
		describe("wallet_requestPermissions", () => {
			it("creates request for eth_accounts permission", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.RequestPermissionsRequest({
					eth_accounts: {},
				});

				expect(request.method).toBe("wallet_requestPermissions");
				expect(request.params?.[0]).toHaveProperty("eth_accounts");
			});
		});

		describe("wallet_getPermissions", () => {
			it("creates request with no parameters", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.GetPermissionsRequest();

				expect(request.method).toBe("wallet_getPermissions");
			});
		});

		describe("wallet_revokePermissions", () => {
			it("creates request to revoke eth_accounts permission", async () => {
				const { Rpc } = await import("../../src/jsonrpc/index.js");

				const request = Rpc.Wallet.RevokePermissionsRequest({
					eth_accounts: {},
				});

				expect(request.method).toBe("wallet_revokePermissions");
				expect(request.params?.[0]).toHaveProperty("eth_accounts");
			});
		});
	});

	describe("Error Handling Patterns from Docs", () => {
		it("documents standard wallet error codes", () => {
			// Error codes from EIP-1193 and wallet standards
			const walletErrorCodes = {
				USER_REJECTED: 4001,
				UNAUTHORIZED: 4100,
				UNSUPPORTED_METHOD: 4200,
				DISCONNECTED: 4900,
				CHAIN_DISCONNECTED: 4901,
				UNRECOGNIZED_CHAIN: 4902,
			};

			expect(walletErrorCodes.USER_REJECTED).toBe(4001);
			expect(walletErrorCodes.UNRECOGNIZED_CHAIN).toBe(4902);
		});

		it("demonstrates switch chain with fallback to add pattern", () => {
			// Pattern from docs: try switch, catch 4902, then add chain
			const handleChainSwitch = async (
				chainId: string,
				switchFn: (id: string) => Promise<void>,
				addFn: (config: object) => Promise<void>,
			) => {
				try {
					await switchFn(chainId);
				} catch (error: unknown) {
					if ((error as { code: number }).code === 4902) {
						// Chain not added, try adding it
						await addFn({
							chainId,
							chainName: "Custom Chain",
							nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
							rpcUrls: ["https://rpc.example.com"],
						});
					}
				}
			};

			expect(handleChainSwitch).toBeDefined();
		});
	});

	describe("Usage Patterns from Docs", () => {
		it("demonstrates adding token after successful transfer", async () => {
			const { Rpc } = await import("../../src/jsonrpc/index.js");

			// Pattern from docs: prompt user to track token after interacting with it
			const tokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

			const watchRequest = Rpc.Wallet.WatchAssetRequest({
				type: "ERC20",
				options: {
					address: tokenAddress,
					symbol: "DAI",
					decimals: 18,
				},
			});

			expect(watchRequest.method).toBe("wallet_watchAsset");
		});
	});
});
