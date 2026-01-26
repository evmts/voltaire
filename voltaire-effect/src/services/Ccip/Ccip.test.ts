import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it, vi, beforeEach, afterEach } from "@effect/vitest";
import { CcipService, CcipError } from "./CcipService.js";
import { DefaultCcip } from "./DefaultCcip.js";
import { NoopCcip } from "./NoopCcip.js";

const createMockResponse = (options: {
	ok?: boolean;
	status?: number;
	statusText?: string;
	contentType?: string;
	body?: unknown;
	textBody?: string;
	jsonThrows?: boolean;
	textThrows?: boolean;
}): Response => {
	const {
		ok = true,
		status = 200,
		statusText = "OK",
		contentType = "application/json",
		body = { data: "0xabcd" },
		textBody,
		jsonThrows = false,
		textThrows = false,
	} = options;

	return {
		ok,
		status,
		statusText,
		headers: {
			get: (name: string) => (name === "Content-Type" ? contentType : null),
		},
		json: jsonThrows
			? () => Promise.reject(new Error("JSON parse error"))
			: () => Promise.resolve(body),
		text: textThrows
			? () => Promise.reject(new Error("Text read error"))
			: () => Promise.resolve(textBody ?? JSON.stringify(body)),
	} as unknown as Response;
};

const baseRequest = {
	sender: "0x1234567890123456789012345678901234567890" as const,
	callData: "0xdeadbeef" as const,
	callbackSelector: "0x12345678" as const,
	extraData: "0x" as const,
};

describe("DefaultCcip", () => {
	let originalFetch: typeof globalThis.fetch;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	describe("GET vs POST selection", () => {
		it("uses GET when URL contains {data}", async () => {
			const fetchMock = vi.fn().mockResolvedValue(createMockResponse({}));
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			await Effect.runPromise(program);

			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining("0xdeadbeef"),
				expect.objectContaining({ method: "GET" }),
			);
		});

		it("uses POST when URL does not contain {data}", async () => {
			const fetchMock = vi.fn().mockResolvedValue(createMockResponse({}));
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			await Effect.runPromise(program);

			expect(fetchMock).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						sender: baseRequest.sender,
						data: baseRequest.callData,
					}),
					headers: { "Content-Type": "application/json" },
				}),
			);
		});
	});

	describe("URL templating", () => {
		it("replaces {sender} with lowercase address", async () => {
			const fetchMock = vi.fn().mockResolvedValue(createMockResponse({}));
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					sender: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			await Effect.runPromise(program);

			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining("0xabcdef1234567890abcdef1234567890abcdef12"),
				expect.any(Object),
			);
		});

		it("replaces {data} with callData", async () => {
			const fetchMock = vi.fn().mockResolvedValue(createMockResponse({}));
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					callData: "0xcafebabe",
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			await Effect.runPromise(program);

			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining("0xcafebabe"),
				expect.any(Object),
			);
		});
	});

	describe("multi-URL fallback", () => {
		it("tries second URL when first fails", async () => {
			let callCount = 0;
			const fetchMock = vi.fn().mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return Promise.resolve(
						createMockResponse({ ok: false, status: 500, statusText: "Internal Server Error", textBody: "Server Error" }),
					);
				}
				return Promise.resolve(createMockResponse({ contentType: "application/json", body: { data: "0x5ccce55" } }));
			});
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: [
						"https://first.example.com/{sender}/{data}",
						"https://second.example.com/{sender}/{data}",
					],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const result = await Effect.runPromise(program);

			expect(result).toBe("0x5ccce55");
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it("returns first successful result", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({ contentType: "application/json", body: { data: "0xf1257" } }),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: [
						"https://first.example.com/{sender}/{data}",
						"https://second.example.com/{sender}/{data}",
					],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const result = await Effect.runPromise(program);

			expect(result).toBe("0xf1257");
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("error handling", () => {
		it("fails with CcipError when URL list is empty", async () => {
			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: [],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const exit = await Effect.runPromiseExit(program);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(CcipError);
				expect((error as CcipError).message).toBe("No URLs provided for CCIP lookup");
			}
		});

		it("includes HTTP status in error message", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({
					ok: false,
					status: 404,
					statusText: "Not Found",
					textBody: "Resource not found",
				}),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const exit = await Effect.runPromiseExit(program);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(CcipError);
				expect((error as CcipError).message).toContain("404");
			}
		});

		it("handles fetch rejection", async () => {
			const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const exit = await Effect.runPromiseExit(program);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(CcipError);
				expect((error as CcipError).message).toContain("Fetch failed");
				expect((error as CcipError).message).toContain("Network error");
			}
		});

		it("handles JSON parse error", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({
					contentType: "application/json",
					jsonThrows: true,
				}),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const exit = await Effect.runPromiseExit(program);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(CcipError);
				expect((error as CcipError).message).toContain("JSON parse failed");
			}
		});

		it("handles text read error", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({
					contentType: "text/plain",
					textThrows: true,
				}),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const exit = await Effect.runPromiseExit(program);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(CcipError);
				expect((error as CcipError).message).toContain("Text read failed");
			}
		});
	});

	describe("Content-Type parsing", () => {
		it("parses JSON response when Content-Type is application/json", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({
					contentType: "application/json",
					body: { data: "0xaabbccdd" },
				}),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0xaabbccdd");
		});

		it("reads text response when Content-Type is not application/json", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({
					contentType: "text/plain",
					textBody: "0x11223344",
				}),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x11223344");
		});
	});

	describe("hex validation", () => {
		it("succeeds with valid hex response", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({ body: { data: "0xABCDEF123456" } }),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0xABCDEF123456");
		});

		it("fails when response is not valid hex", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({ body: { data: "not-hex" } }),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const exit = await Effect.runPromiseExit(program);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(CcipError);
				expect((error as CcipError).message).toContain("not valid hex");
			}
		});

		it("fails when response is missing 0x prefix", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({ body: { data: "abcdef" } }),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const exit = await Effect.runPromiseExit(program);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(CcipError);
				expect((error as CcipError).message).toContain("not valid hex");
			}
		});

		it("fails when response contains non-hex characters", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({ body: { data: "0xZZZZ" } }),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const exit = await Effect.runPromiseExit(program);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
				expect(error).toBeInstanceOf(CcipError);
				expect((error as CcipError).message).toContain("not valid hex");
			}
		});

		it("accepts empty hex 0x", async () => {
			const fetchMock = vi.fn().mockResolvedValue(
				createMockResponse({ body: { data: "0x" } }),
			);
			globalThis.fetch = fetchMock;

			const program = Effect.gen(function* () {
				const ccip = yield* CcipService;
				return yield* ccip.request({
					...baseRequest,
					urls: ["https://gateway.example.com/{sender}/{data}"],
				});
			}).pipe(Effect.provide(DefaultCcip));

			const result = await Effect.runPromise(program);
			expect(result).toBe("0x");
		});
	});
});

describe("NoopCcip", () => {
	it("always fails with CcipError", async () => {
		const program = Effect.gen(function* () {
			const ccip = yield* CcipService;
			return yield* ccip.request({
				...baseRequest,
				urls: ["https://gateway.example.com/{sender}/{data}"],
			});
		}).pipe(Effect.provide(NoopCcip));

		const exit = await Effect.runPromiseExit(program);

		expect(Exit.isFailure(exit)).toBe(true);
		if (Exit.isFailure(exit)) {
			const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
			expect(error).toBeInstanceOf(CcipError);
			expect((error as CcipError).message).toBe("CCIP disabled");
		}
	});

	it("preserves URLs in error", async () => {
		const urls = [
			"https://first.example.com/{sender}/{data}",
			"https://second.example.com/{sender}/{data}",
		];

		const program = Effect.gen(function* () {
			const ccip = yield* CcipService;
			return yield* ccip.request({
				...baseRequest,
				urls,
			});
		}).pipe(Effect.provide(NoopCcip));

		const exit = await Effect.runPromiseExit(program);

		expect(Exit.isFailure(exit)).toBe(true);
		if (Exit.isFailure(exit)) {
			const error = exit.cause._tag === "Fail" ? exit.cause.error : null;
			expect(error).toBeInstanceOf(CcipError);
			expect((error as CcipError).urls).toEqual(urls);
		}
	});
});
