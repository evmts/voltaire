import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import {
	TransportService,
	type TransportShape,
} from "../../Transport/TransportService.js";
import { TransportError } from "../../Transport/TransportError.js";
import { getPermissions, type Permission } from "./getPermissions.js";

const mockPermissions: Permission[] = [
	{
		date: 1609459200000,
		invoker: "https://example.com",
		parentCapability: "eth_accounts",
		caveats: [
			{
				type: "restrictReturnedAccounts",
				value: ["0x1234567890123456789012345678901234567890"],
			},
		],
	},
];

describe("getPermissions", () => {
	it("sends wallet_getPermissions request", async () => {
		let capturedMethod: string | undefined;

		const mockTransport: TransportShape = {
			request: <T>(method: string): Effect.Effect<T, never> => {
				capturedMethod = method;
				return Effect.succeed(mockPermissions as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(getPermissions(), TestLayer),
		);

		expect(capturedMethod).toBe("wallet_getPermissions");
		expect(result).toEqual(mockPermissions);
	});

	it("returns empty array when no permissions granted", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> => Effect.succeed([] as T),
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(getPermissions(), TestLayer),
		);

		expect(result).toEqual([]);
	});

	it("returns multiple permissions", async () => {
		const multiplePermissions: Permission[] = [
			{
				date: 1609459200000,
				invoker: "https://example.com",
				parentCapability: "eth_accounts",
			},
			{
				date: 1609459200000,
				invoker: "https://example.com",
				parentCapability: "eth_chainId",
			},
		];

		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.succeed(multiplePermissions as T),
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(getPermissions(), TestLayer),
		);

		expect(result).toHaveLength(2);
		expect(result[0]?.parentCapability).toBe("eth_accounts");
		expect(result[1]?.parentCapability).toBe("eth_chainId");
	});

	it("handles permissions with caveats", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.succeed(mockPermissions as T),
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromise(
			Effect.provide(getPermissions(), TestLayer),
		);

		expect(result[0]?.caveats).toBeDefined();
		expect(result[0]?.caveats?.[0]?.type).toBe("restrictReturnedAccounts");
	});

	it("handles transport errors", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError("Method not supported", { code: -32601 }),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromiseExit(
			Effect.provide(getPermissions(), TestLayer),
		);

		expect(result._tag).toBe("Failure");
		if (result._tag === "Failure") {
			expect(String(result.cause)).toContain("Failed to get permissions");
		}
	});
});
