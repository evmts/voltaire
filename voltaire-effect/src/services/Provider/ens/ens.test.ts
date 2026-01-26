import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import { TransportService } from "../../Transport/TransportService.js";
import { Provider } from "../Provider.js";
import { ProviderService } from "../ProviderService.js";
import { EnsError } from "./EnsError.js";
import { getEnsAddress } from "./getEnsAddress.js";
import { getEnsAvatar } from "./getEnsAvatar.js";
import { getEnsName } from "./getEnsName.js";
import { getEnsResolver } from "./getEnsResolver.js";
import { getEnsText } from "./getEnsText.js";

type MockHandler = (params: unknown[]) => unknown;
type MockResponses = Record<string, unknown | MockHandler>;

const mockTransportWithCapture = (responses: MockResponses) =>
	Layer.succeed(TransportService, {
		request: <T>(method: string, params: unknown[] = []) =>
			Effect.gen(function* () {
				if (!(method in responses)) {
					return yield* Effect.fail({
						_tag: "TransportError" as const,
						code: -32601,
						message: `Method not found: ${method}`,
					});
				}
				const response = responses[method];
				if (typeof response === "function") {
					const result = response(params);
					if (result instanceof Error) {
						return yield* Effect.fail({
							_tag: "TransportError" as const,
							code: -32603,
							message: result.message,
						});
					}
					return result as T;
				}
				return response as T;
			}),
	});

describe("ENS Resolution", () => {
	describe("getEnsAddress", () => {
		it("resolves ENS name to address", async () => {
			// Mock response for Universal Resolver resolve()
			// This is a simplified mock - real response is more complex
			const mockResolveResponse =
				"0x" +
				// Offset to first return value (bytes)
				"0000000000000000000000000000000000000000000000000000000000000040" +
				// Resolver address
				"0000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41" +
				// Length of bytes data (32)
				"0000000000000000000000000000000000000000000000000000000000000020" +
				// Address padded to 32 bytes (vitalik.eth address)
				"000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045";

			const transport = mockTransportWithCapture({
				eth_call: mockResolveResponse,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				getEnsAddress({ name: "vitalik.eth" }).pipe(Effect.provide(layer)),
			);

			expect(result).toBe("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
		});

		it("returns null for non-existent name", async () => {
			// Empty response
			const mockResolveResponse =
				"0x" +
				"0000000000000000000000000000000000000000000000000000000000000040" +
				"0000000000000000000000000000000000000000000000000000000000000000" +
				"0000000000000000000000000000000000000000000000000000000000000000";

			const transport = mockTransportWithCapture({
				eth_call: mockResolveResponse,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				getEnsAddress({ name: "nonexistent12345.eth" }).pipe(
					Effect.provide(layer),
				),
			);

			expect(result).toBeNull();
		});

		it("fails with EnsError on RPC error", async () => {
			const transport = mockTransportWithCapture({
				eth_call: () => new Error("execution reverted"),
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				getEnsAddress({ name: "test.eth" }).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("getEnsName", () => {
		it("reverse resolves address to ENS name", async () => {
			// Mock response for Universal Resolver reverse()
			const mockReverseResponse =
				"0x" +
				// Offset to string (name)
				"0000000000000000000000000000000000000000000000000000000000000060" +
				// Resolver address
				"0000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41" +
				// Reverse resolver address
				"000000000000000000000000a2c122be93b0074270ebee7f6b7292c7deb45047" +
				// String length (11 = "vitalik.eth")
				"000000000000000000000000000000000000000000000000000000000000000b" +
				// String data "vitalik.eth" padded
				"766974616c696b2e657468000000000000000000000000000000000000000000";

			const transport = mockTransportWithCapture({
				eth_call: mockReverseResponse,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				getEnsName({
					address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBe("vitalik.eth");
		});

		it("returns null for address without reverse record", async () => {
			const mockReverseResponse =
				"0x" +
				"0000000000000000000000000000000000000000000000000000000000000060" +
				"0000000000000000000000000000000000000000000000000000000000000000" +
				"0000000000000000000000000000000000000000000000000000000000000000" +
				"0000000000000000000000000000000000000000000000000000000000000000";

			const transport = mockTransportWithCapture({
				eth_call: mockReverseResponse,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				getEnsName({
					address: "0x1234567890123456789012345678901234567890",
				}).pipe(Effect.provide(layer)),
			);

			expect(result).toBeNull();
		});
	});

	describe("getEnsResolver", () => {
		it("gets resolver address for ENS name", async () => {
			// Mock resolver() response - just an address
			const mockResolverResponse =
				"0x0000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41";

			const transport = mockTransportWithCapture({
				eth_call: mockResolverResponse,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				getEnsResolver({ name: "vitalik.eth" }).pipe(Effect.provide(layer)),
			);

			expect(result).toBe("0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41");
		});

		it("returns null for name without resolver", async () => {
			const mockResolverResponse =
				"0x0000000000000000000000000000000000000000000000000000000000000000";

			const transport = mockTransportWithCapture({
				eth_call: mockResolverResponse,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				getEnsResolver({ name: "nonexistent.eth" }).pipe(Effect.provide(layer)),
			);

			expect(result).toBeNull();
		});
	});

	describe("getEnsText", () => {
		it("gets text record for ENS name", async () => {
			// Mock resolve() response with text() return data
			const twitterHandle = "VitalikButerin";
			const twitterHex = Buffer.from(twitterHandle).toString("hex");
			const mockTextResponse =
				"0x" +
				// Offset to bytes data
				"0000000000000000000000000000000000000000000000000000000000000040" +
				// Resolver address
				"0000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41" +
				// Length of bytes data (96 = string ABI encoding)
				"0000000000000000000000000000000000000000000000000000000000000060" +
				// String offset (32)
				"0000000000000000000000000000000000000000000000000000000000000020" +
				// String length (14)
				"000000000000000000000000000000000000000000000000000000000000000e" +
				// String data padded
				twitterHex.padEnd(64, "0");

			const transport = mockTransportWithCapture({
				eth_call: mockTextResponse,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				getEnsText({ name: "vitalik.eth", key: "com.twitter" }).pipe(
					Effect.provide(layer),
				),
			);

			expect(result).toBe("VitalikButerin");
		});

		it("returns null for non-existent text record", async () => {
			const mockTextResponse =
				"0x" +
				"0000000000000000000000000000000000000000000000000000000000000040" +
				"0000000000000000000000000000000000000000000000000000000000000000" +
				"0000000000000000000000000000000000000000000000000000000000000000";

			const transport = mockTransportWithCapture({
				eth_call: mockTextResponse,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				getEnsText({ name: "test.eth", key: "nonexistent" }).pipe(
					Effect.provide(layer),
				),
			);

			expect(result).toBeNull();
		});
	});

	describe("getEnsAvatar", () => {
		it("gets avatar for ENS name", async () => {
			const avatarUri = "https://example.com/avatar.png";
			const avatarHex = Buffer.from(avatarUri).toString("hex");
			const mockAvatarResponse =
				"0x" +
				"0000000000000000000000000000000000000000000000000000000000000040" +
				"0000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41" +
				"0000000000000000000000000000000000000000000000000000000000000060" +
				"0000000000000000000000000000000000000000000000000000000000000020" +
				"000000000000000000000000000000000000000000000000000000000000001e" +
				avatarHex.padEnd(64, "0");

			const transport = mockTransportWithCapture({
				eth_call: mockAvatarResponse,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const result = await Effect.runPromise(
				getEnsAvatar({ name: "vitalik.eth" }).pipe(Effect.provide(layer)),
			);

			expect(result).toBe("https://example.com/avatar.png");
		});
	});

	describe("EnsError", () => {
		it("has correct tag", () => {
			const error = new EnsError("test.eth", "Test error");
			expect(error._tag).toBe("EnsError");
		});

		it("preserves input and message", () => {
			const error = new EnsError("test.eth", "Resolution failed");
			expect(error.input).toBe("test.eth");
			expect(error.message).toBe("Resolution failed");
		});

		it("preserves cause", () => {
			const cause = new Error("Underlying error");
			const error = new EnsError("test.eth", "Resolution failed", cause);
			expect(error.cause).toBe(cause);
		});
	});
});
