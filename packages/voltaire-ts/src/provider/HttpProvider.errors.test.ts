import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpProvider } from "./HttpProvider.js";

const request = { method: "eth_chainId" };

describe("HttpProvider error mapping", () => {
	const provider = new HttpProvider({
		url: "https://rpc.example.test",
		retry: 1,
		retryDelay: 0,
		timeout: 20,
	});

	afterEach(() => vi.unstubAllGlobals());

	it.each([200, 400, 500])(
		"preserves JSON-RPC errors on HTTP %i",
		async (status) => {
			const error = {
				code: -32000,
				message: "Execution reverted",
				data: { reason: "0xdead" },
			};
			const fetch = vi
				.fn()
				.mockResolvedValue(
					Response.json({ jsonrpc: "2.0", id: 1, error }, { status }),
				);
			vi.stubGlobal("fetch", fetch);

			await expect(provider.request(request)).rejects.toEqual(error);
			expect(fetch).toHaveBeenCalledTimes(1);
		},
	);

	it.each([
		[401, "Unauthorized", 4100],
		[429, "Too Many Requests", -32005],
		[503, "Service Unavailable", -32002],
		[500, "Internal Server Error", -32603],
	])(
		"maps HTTP %i and preserves its body",
		async (status, statusText, code) => {
			const body = "Upstream diagnostic";
			const fetch = vi
				.fn()
				.mockResolvedValue(new Response(body, { status, statusText }));
			vi.stubGlobal("fetch", fetch);

			await expect(provider.request(request)).rejects.toEqual({
				code,
				message: `HTTP ${status}: ${statusText}`,
				data: { status, body },
			});
			expect(fetch).toHaveBeenCalledTimes(1);
		},
	);

	it("reports invalid JSON on a successful HTTP response", async () => {
		const fetch = vi.fn().mockResolvedValue(new Response("not JSON"));
		vi.stubGlobal("fetch", fetch);

		await expect(provider.request(request)).rejects.toMatchObject({
			code: -32700,
		});
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("reports a timeout while reading the response body", async () => {
		const fetch = vi.fn(
			async (_url: string, { signal }: RequestInit) =>
				new Response(
					new ReadableStream({
						start(controller) {
							signal?.addEventListener("abort", () =>
								controller.error(signal.reason),
							);
						},
					}),
				),
		);
		vi.stubGlobal("fetch", fetch);

		await expect(provider.request(request)).rejects.toEqual({
			code: -32002,
			message: "Request timeout after 20ms",
		});
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("reports disconnection after exhausting network retries", async () => {
		const fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
		vi.stubGlobal("fetch", fetch);

		await expect(provider.request(request)).rejects.toEqual({
			code: 4900,
			message: "fetch failed",
		});
		expect(fetch).toHaveBeenCalledTimes(2);
	});
});
