import * as HttpClient from "@effect/platform/HttpClient";
import type * as HttpClientRequest from "@effect/platform/HttpClientRequest";
import type * as HttpClientResponse from "@effect/platform/HttpClientResponse";
import { describe, expect, it, vi } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";
import { createBatchScheduler } from "./BatchScheduler.js";
import { HttpTransport } from "./HttpTransport.js";
import { type TransportError, TransportService } from "./TransportService.js";

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

const parseRequestId = (
	request: HttpClientRequest.HttpClientRequest,
): number => {
	const body = request.body as { _tag: string; body: Uint8Array };
	const parsed = JSON.parse(new TextDecoder().decode(body.body)) as {
		id: number;
	};
	return parsed.id;
};

describe("IdGenerator", () => {
	it("avoids ID collisions across transports and batch calls", async () => {
		const httpIds: number[] = [];
		const batchIds: number[] = [];

		const fetchMock = vi.fn((request: HttpClientRequest.HttpClientRequest) => {
			const id = parseRequestId(request);
			httpIds.push(id);
			return Promise.resolve({
				ok: true,
				json: async () => ({ jsonrpc: "2.0", id, result: "0x1" }),
			});
		});

		const sendBatch = (requests: Array<{ id: number; method: string }>) => {
			batchIds.push(...requests.map((req) => req.id));
			return Effect.succeed(
				requests.map((req) => ({ id: req.id, result: req.method })),
			);
		};

		const program = Effect.gen(function* () {
			const scheduler = yield* createBatchScheduler(sendBatch, { wait: 0 });
			const transport = yield* TransportService;

			const httpRequests = Array.from({ length: 5 }, () =>
				transport.request<string>("eth_chainId", []),
			);
			const batchRequests = Array.from({ length: 5 }, (_, idx) =>
				scheduler.schedule<string>(`m${idx}`),
			);

			yield* Effect.all([...httpRequests, ...batchRequests], {
				concurrency: "unbounded",
			});

			return { httpIds, batchIds };
		}).pipe(
			Effect.provide(
				createMockHttpTransport(fetchMock, {
					url: "https://eth.example.com",
					retrySchedule: Schedule.recurs(0) as Schedule.Schedule<
						unknown,
						TransportError
					>,
				}),
			),
			Effect.scoped,
		);

		const { httpIds: collectedHttpIds, batchIds: collectedBatchIds } =
			await Effect.runPromise(program);
		const combined = [...collectedHttpIds, ...collectedBatchIds];

		expect(new Set(combined).size).toBe(combined.length);
	});
});
