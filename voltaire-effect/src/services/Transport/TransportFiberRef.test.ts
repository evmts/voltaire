import * as HttpClient from "@effect/platform/HttpClient";
import type * as HttpClientRequest from "@effect/platform/HttpClientRequest";
import type * as HttpClientResponse from "@effect/platform/HttpClientResponse";
import { describe, expect, it, vi } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
	DeduplicatedTransport,
	HttpTransport,
	TransportService,
	withoutCache,
	withRetries,
	withTimeout,
} from "./index.js";

const createMockHttpClientLayer = (
	fetchMock: ReturnType<typeof vi.fn>,
): Layer.Layer<HttpClient.HttpClient> =>
	Layer.succeed(
		HttpClient.HttpClient,
		HttpClient.make((request: HttpClientRequest.HttpClientRequest) => {
			return Effect.gen(function* () {
				const result = fetchMock(request);
				const resolved =
					result instanceof Promise
						? yield* Effect.promise(() => result)
						: result;

				return {
					status: resolved.ok ? 200 : (resolved.status ?? 500),
					headers: {},
					cookies: {} as HttpClientResponse.HttpClientResponse["cookies"],
					formData: Effect.succeed(new FormData()),
					json: Effect.promise(() => resolved.json()),
					text: Effect.succeed(""),
					urlParamsBody: Effect.succeed({} as never),
					arrayBuffer: Effect.succeed(new ArrayBuffer(0)),
					stream: null as never,
					request,
					remoteAddress: { _tag: "None" } as never,
					[Symbol.for("effect/Inspectable")]: {},
					toJSON: () => ({}),
					toString: () => "",
				} as unknown as HttpClientResponse.HttpClientResponse;
			});
		}),
	);

const createMockHttpTransport = (
	fetchMock: ReturnType<typeof vi.fn>,
	options: Parameters<typeof HttpTransport>[0],
): Layer.Layer<TransportService> =>
	Layer.provide(HttpTransport(options), createMockHttpClientLayer(fetchMock));

describe("Transport FiberRef overrides", () => {
	it("scopes timeout overrides per request", async () => {
		const fetchMock = vi.fn(async () => {
			await new Promise((resolve) => setTimeout(resolve, 20));
			return {
				ok: true,
				json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x1" }),
			};
		});

		const program = Effect.gen(function* () {
			const transport = yield* TransportService;
			const [defaultResult, overrideResult] = yield* Effect.all(
				[
					transport.request<string>("eth_chainId", []).pipe(Effect.either),
					transport
						.request<string>("eth_chainId", [])
						.pipe(withTimeout(50), Effect.either),
				],
				{ concurrency: "unbounded" },
			);
			return { defaultResult, overrideResult };
		}).pipe(
			Effect.provide(
				createMockHttpTransport(fetchMock, {
					url: "https://eth.example.com",
					timeout: 5,
					retries: 0,
				}),
			),
		);

		const { defaultResult, overrideResult } = await Effect.runPromise(program);
		expect(defaultResult._tag).toBe("Left");
		expect(overrideResult._tag).toBe("Right");
	});

	it("overrides retry count per request", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					jsonrpc: "2.0",
					id: 1,
					error: { code: -32603, message: "boom" },
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ jsonrpc: "2.0", id: 2, result: "0x1" }),
			});

		const program = Effect.gen(function* () {
			const transport = yield* TransportService;
			return yield* transport.request<string>("eth_chainId", []);
		}).pipe(
			withRetries(1),
			Effect.provide(
				createMockHttpTransport(fetchMock, {
					url: "https://eth.example.com",
					retries: 0,
				}),
			),
		);

		const result = await Effect.runPromise(program);
		expect(result).toBe("0x1");
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("scopes cache disable without leaking to other fibers", async () => {
		let callCount = 0;
		const baseTransport = Layer.succeed(TransportService, {
			request: () =>
				Effect.sync(() => {
					callCount += 1;
					return "0x1";
				}),
		});

		const transport = DeduplicatedTransport(baseTransport, { ttl: 1000 });

		const program = Effect.gen(function* () {
			const svc = yield* TransportService;
			yield* Effect.all(
				[
					svc.request<string>("eth_chainId").pipe(withoutCache),
					svc.request<string>("eth_chainId"),
					svc.request<string>("eth_chainId"),
				],
				{ concurrency: "unbounded" },
			);
			return callCount;
		}).pipe(Effect.provide(transport), Effect.scoped);

		const count = await Effect.runPromise(program);
		expect(count).toBe(2);
	});
});
