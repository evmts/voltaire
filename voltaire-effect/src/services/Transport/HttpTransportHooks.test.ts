import { FetchHttpClient } from "@effect/platform";
import * as HttpClient from "@effect/platform/HttpClient";
import type * as HttpClientRequest from "@effect/platform/HttpClientRequest";
import type * as HttpClientResponse from "@effect/platform/HttpClientResponse";
import { describe, expect, it, vi } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { HttpTransportConfig } from "./HttpTransport.js";
import {
	HttpTransport,
	TransportService,
	withRequestInterceptor,
	withResponseInterceptor,
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
	options: HttpTransportConfig | string,
): Layer.Layer<TransportService> =>
	Layer.provide(HttpTransport(options), createMockHttpClientLayer(fetchMock));

describe("HttpTransport hooks", () => {
	it("applies request/response hooks with FiberRef overrides", async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x1" }),
		});

		let configRequest: { method: string; params: readonly unknown[] } | null =
			null;
		let overrideRequest: { method: string; params: readonly unknown[] } | null =
			null;
		let configResponse: { result: unknown } | null = null;
		let overrideResponse: { result: unknown } | null = null;

		const program = Effect.gen(function* () {
			const transport = yield* TransportService;
			return yield* transport.request<string>("eth_blockNumber", []);
		}).pipe(
			Effect.provide(
				createMockHttpTransport(fetchMock, {
					url: "https://eth.example.com",
					onRequest: (req) =>
						Effect.sync(() => {
							configRequest = req;
							return { ...req, method: "eth_chainId", params: ["0x1"] };
						}),
					onResponse: (res) =>
						Effect.sync(() => {
							configResponse = res;
							return { ...res, result: "0x2" };
						}),
				}),
			),
			withRequestInterceptor((req) =>
				Effect.sync(() => {
					overrideRequest = req;
					return { ...req, method: "eth_gasPrice", params: [] };
				}),
			),
			withResponseInterceptor((res) =>
				Effect.sync(() => {
					overrideResponse = res;
					return { ...res, result: "0x3" };
				}),
			),
		);

		const result = await Effect.runPromise(program);
		expect(result).toBe("0x3");
		expect(configRequest?.method).toBe("eth_blockNumber");
		expect(overrideRequest?.method).toBe("eth_chainId");
		expect(configResponse?.result).toBe("0x1");
		expect(overrideResponse?.result).toBe("0x2");

		const request = fetchMock.mock.calls[0][0] as {
			body: { _tag: string; body: Uint8Array };
		};
		const parsed = JSON.parse(new TextDecoder().decode(request.body.body)) as {
			method: string;
			params: unknown[];
		};
		expect(parsed.method).toBe("eth_gasPrice");
		expect(parsed.params).toEqual([]);
	});

	it("passes fetchOptions and custom fetch", async () => {
		const customFetch = vi.fn(
			async (_url: string, _init?: RequestInit) =>
				new Response(
					JSON.stringify({
						jsonrpc: "2.0",
						id: 1,
						result: "0x1",
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				),
		);

		const program = Effect.gen(function* () {
			const transport = yield* TransportService;
			return yield* transport.request<string>("eth_chainId", []);
		}).pipe(
			Effect.provide(
				HttpTransport({
					url: "https://eth.example.com",
					headers: { "X-Request": "request-header" },
					fetch: customFetch,
					fetchOptions: {
						credentials: "include",
						headers: { "X-Options": "option-header" },
					},
				}),
			),
			Effect.provide(FetchHttpClient.layer),
		);

		const result = await Effect.runPromise(program);
		expect(result).toBe("0x1");
		expect(customFetch).toHaveBeenCalledTimes(1);

		const init = customFetch.mock.calls[0][1] as RequestInit;
		expect(init.credentials).toBe("include");
		const headers = new Headers(init.headers as HeadersInit);
		expect(headers.get("x-options")).toBe("option-header");
		expect(headers.get("x-request")).toBe("request-header");
		expect(headers.get("content-type")).toBe("application/json");
	});
});
