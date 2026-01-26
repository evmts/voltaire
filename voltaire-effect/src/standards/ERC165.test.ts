import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { ProviderService } from "../services/Provider/index.js";
import * as ERC165 from "./ERC165.js";

const mockProvider = {
	call: vi.fn(),
	getLogs: vi.fn(),
	getBlockNumber: vi.fn(),
	getBalance: vi.fn(),
	getBlock: vi.fn(),
	getTransaction: vi.fn(),
	getTransactionReceipt: vi.fn(),
	getTransactionCount: vi.fn(),
	getCode: vi.fn(),
	getStorageAt: vi.fn(),
	estimateGas: vi.fn(),
	getChainId: vi.fn(),
	getGasPrice: vi.fn(),
};

const MockProviderLayer = Layer.succeed(ProviderService, mockProvider as any);

describe("ERC165", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("SELECTOR", () => {
		it("exports correct supportsInterface selector", () => {
			expect(ERC165.SELECTOR).toBe("0x01ffc9a7");
		});
	});

	describe("INTERFACE_IDS", () => {
		it("exports correct interface IDs", () => {
			expect(ERC165.INTERFACE_IDS.ERC165).toBe("0x01ffc9a7");
			expect(ERC165.INTERFACE_IDS.ERC20).toBe("0x36372b07");
			expect(ERC165.INTERFACE_IDS.ERC721).toBe("0x80ac58cd");
			expect(ERC165.INTERFACE_IDS.ERC721Metadata).toBe("0x5b5e139f");
			expect(ERC165.INTERFACE_IDS.ERC721Enumerable).toBe("0x780e9d63");
			expect(ERC165.INTERFACE_IDS.ERC1155).toBe("0xd9b67a26");
			expect(ERC165.INTERFACE_IDS.ERC1155MetadataURI).toBe("0x0e89341c");
			expect(ERC165.INTERFACE_IDS.ERC2981).toBe("0x2a55205a");
			expect(ERC165.INTERFACE_IDS.ERC4906).toBe("0x49064906");
		});
	});

	describe("encodeSupportsInterface", () => {
		it("encodes supportsInterface calldata", async () => {
			const result = await Effect.runPromise(
				ERC165.encodeSupportsInterface(ERC165.INTERFACE_IDS.ERC721),
			);
			expect(result).toMatch(/^0x01ffc9a7/);
		});

		it("handles interface ID with 0x prefix", async () => {
			const result = await Effect.runPromise(
				ERC165.encodeSupportsInterface("0x80ac58cd"),
			);
			expect(result).toMatch(/^0x01ffc9a7/);
		});

		it("handles interface ID without 0x prefix", async () => {
			const result = await Effect.runPromise(
				ERC165.encodeSupportsInterface("80ac58cd"),
			);
			expect(result).toMatch(/^0x01ffc9a7/);
		});
	});

	describe("decodeSupportsInterface", () => {
		it("decodes true response", async () => {
			const data =
				"0x0000000000000000000000000000000000000000000000000000000000000001";
			const result = await Effect.runPromise(ERC165.decodeSupportsInterface(data));
			expect(result).toBe(true);
		});

		it("decodes false response", async () => {
			const data =
				"0x0000000000000000000000000000000000000000000000000000000000000000";
			const result = await Effect.runPromise(ERC165.decodeSupportsInterface(data));
			expect(result).toBe(false);
		});
	});

	describe("supportsInterface", () => {
		it("returns true when contract supports interface", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				),
			);

			const result = await Effect.runPromise(
				ERC165.supportsInterface(
					"0x1234567890123456789012345678901234567890",
					ERC165.INTERFACE_IDS.ERC721,
				).pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBe(true);
			expect(mockProvider.call).toHaveBeenCalled();
		});

		it("returns false when contract does not support interface", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				),
			);

			const result = await Effect.runPromise(
				ERC165.supportsInterface(
					"0x1234567890123456789012345678901234567890",
					ERC165.INTERFACE_IDS.ERC721,
				).pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBe(false);
		});

		it("returns false on empty response", async () => {
			mockProvider.call.mockReturnValue(Effect.succeed("0x"));

			const result = await Effect.runPromise(
				ERC165.supportsInterface(
					"0x1234567890123456789012345678901234567890",
					ERC165.INTERFACE_IDS.ERC721,
				).pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBe(false);
		});

		it("returns false on call failure", async () => {
			mockProvider.call.mockReturnValue(
				Effect.fail(new Error("execution reverted")),
			);

			const result = await Effect.runPromise(
				ERC165.supportsInterface(
					"0x1234567890123456789012345678901234567890",
					ERC165.INTERFACE_IDS.ERC721,
				).pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toBe(false);
		});
	});

	describe("detectInterfaces", () => {
		it("returns empty array when contract does not support ERC165", async () => {
			mockProvider.call.mockReturnValue(
				Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				),
			);

			const result = await Effect.runPromise(
				ERC165.detectInterfaces(
					"0x1234567890123456789012345678901234567890",
				).pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toEqual([]);
		});

		it("returns detected interfaces when contract supports ERC165", async () => {
			mockProvider.call.mockImplementation(({ data }: { data: string }) => {
				const encodedERC165 = "01ffc9a7";
				const encodedERC721 = "80ac58cd";
				const encodedERC721Metadata = "5b5e139f";

				if (data.includes(encodedERC165)) {
					return Effect.succeed(
						"0x0000000000000000000000000000000000000000000000000000000000000001",
					);
				}
				if (data.includes(encodedERC721)) {
					return Effect.succeed(
						"0x0000000000000000000000000000000000000000000000000000000000000001",
					);
				}
				if (data.includes(encodedERC721Metadata)) {
					return Effect.succeed(
						"0x0000000000000000000000000000000000000000000000000000000000000001",
					);
				}
				return Effect.succeed(
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				);
			});

			const result = await Effect.runPromise(
				ERC165.detectInterfaces(
					"0x1234567890123456789012345678901234567890",
				).pipe(Effect.provide(MockProviderLayer)),
			);

			expect(result).toContain("ERC165");
			expect(result).toContain("ERC721");
			expect(result).toContain("ERC721Metadata");
		});
	});
});
