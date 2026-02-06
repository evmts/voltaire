import { describe, expect, it } from "@effect/vitest";
import { Address } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TransportError } from "../../Transport/TransportError.js";
import {
	TransportService,
	type TransportShape,
} from "../../Transport/TransportService.js";
import { getAddresses } from "./getAddresses.js";

describe("getAddresses", () => {
	it("sends eth_accounts request and returns addresses", async () => {
		let capturedMethod: string | undefined;

		const mockAddresses = [
			"0x1234567890123456789012345678901234567890",
			"0xabababababababababababababababababababab",
		];

		const mockTransport: TransportShape = {
			request: <T>(method: string): Effect.Effect<T, never> => {
				capturedMethod = method;
				return Effect.succeed(mockAddresses as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(getAddresses(), TestLayer),
		);

		expect(capturedMethod).toBe("eth_accounts");
		expect(result).toHaveLength(2);
		expect(result[0]).toBeInstanceOf(Uint8Array);
		expect(result[0]?.length).toBe(20);
	});

	it("returns empty array when no addresses authorized", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> => Effect.succeed([] as T),
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(getAddresses(), TestLayer),
		);

		expect(result).toEqual([]);
	});

	it("converts hex strings to AddressType", async () => {
		const mockAddresses = ["0x1234567890123456789012345678901234567890"];

		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.succeed(mockAddresses as T),
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(getAddresses(), TestLayer),
		);

		expect(result).toHaveLength(1);
		const addressHex = Address.toHex(result[0]!);
		expect(addressHex.toLowerCase()).toBe(
			"0x1234567890123456789012345678901234567890",
		);
	});

	it("handles transport errors", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError({ code: -32000, message: "Not connected" }),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromiseExit(
			Effect.provide(getAddresses(), TestLayer),
		);

		expect(result._tag).toBe("Failure");
		if (result._tag === "Failure") {
			expect(String(result.cause)).toContain("Failed to get addresses");
		}
	});

	it("handles multiple addresses with checksums", async () => {
		const mockAddresses = [
			"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik.eth
			"0xab5801a7d398351b8be11c439e05c5b3259aec9b", // lowercase
		];

		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.succeed(mockAddresses as T),
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(getAddresses(), TestLayer),
		);

		expect(result).toHaveLength(2);
		result.forEach((addr) => {
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});
	});
});
