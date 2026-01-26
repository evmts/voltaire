import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
import {
	TransportService,
	type TransportShape,
} from "../../Transport/TransportService.js";
import { TransportError } from "../../Transport/TransportError.js";
import {
	requestPermissions,
	type Permission,
	type PermissionRequest,
} from "./requestPermissions.js";

const mockGrantedPermissions: Permission[] = [
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

describe("requestPermissions", () => {
	it("sends wallet_requestPermissions with correct params", async () => {
		let capturedMethod: string | undefined;
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(method: string, params?: unknown[]): Effect.Effect<T, never> => {
				capturedMethod = method;
				capturedParams = params;
				return Effect.succeed(mockGrantedPermissions as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const permissionRequest: PermissionRequest = {
			eth_accounts: {},
		};

		const result = await Effect.runPromise(
			Effect.provide(requestPermissions(permissionRequest), TestLayer),
		);

		expect(capturedMethod).toBe("wallet_requestPermissions");
		expect(capturedParams).toEqual([{ eth_accounts: {} }]);
		expect(result).toEqual(mockGrantedPermissions);
	});

	it("requests multiple permissions", async () => {
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(_method: string, params?: unknown[]): Effect.Effect<T, never> => {
				capturedParams = params;
				return Effect.succeed([] as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const permissionRequest: PermissionRequest = {
			eth_accounts: {},
			eth_chainId: {},
		};

		await Effect.runPromise(
			Effect.provide(requestPermissions(permissionRequest), TestLayer),
		);

		expect(capturedParams).toEqual([
			{
				eth_accounts: {},
				eth_chainId: {},
			},
		]);
	});

	it("requests permissions with parameters", async () => {
		let capturedParams: unknown[] | undefined;

		const mockTransport: TransportShape = {
			request: <T>(_method: string, params?: unknown[]): Effect.Effect<T, never> => {
				capturedParams = params;
				return Effect.succeed([] as T);
			},
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const permissionRequest: PermissionRequest = {
			eth_accounts: {
				requiredMethods: ["signMessage"],
			},
		};

		await Effect.runPromise(
			Effect.provide(requestPermissions(permissionRequest), TestLayer),
		);

		expect(capturedParams).toEqual([
			{
				eth_accounts: {
					requiredMethods: ["signMessage"],
				},
			},
		]);
	});

	it("handles user rejection", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError("User rejected the request", { code: 4001 }),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromiseExit(
			Effect.provide(requestPermissions({ eth_accounts: {} }), TestLayer),
		);

		expect(result._tag).toBe("Failure");
		if (result._tag === "Failure") {
			expect(String(result.cause)).toContain("Failed to request permissions");
		}
	});

	it("handles method not supported", async () => {
		const mockTransport: TransportShape = {
			request: <T>(): Effect.Effect<T, never> =>
				Effect.fail(
					new TransportError("Method not supported", { code: -32601 }),
				) as never,
		};

		const TestLayer = Layer.succeed(TransportService, mockTransport);

		const result = await Effect.runPromiseExit(
			Effect.provide(requestPermissions({ eth_accounts: {} }), TestLayer),
		);

		expect(result._tag).toBe("Failure");
	});
});
