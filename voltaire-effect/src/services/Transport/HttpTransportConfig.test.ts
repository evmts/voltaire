import * as ConfigProvider from "effect/ConfigProvider";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as HashMap from "effect/HashMap";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { describe, expect, it } from "vitest";
import { HttpTransportConfigSchema } from "./HttpTransportConfig.js";

describe("HttpTransportConfigSchema", () => {
	it("reads config from Map provider", async () => {
		const configProvider = ConfigProvider.fromMap(
			new Map([
				["http.url", "https://mainnet.infura.io/v3/KEY"],
				["http.timeout", "60 seconds"],
				["http.retryBaseDelay", "2 seconds"],
				["http.retryMaxAttempts", "5"],
			]),
		);

		const result = await Effect.runPromise(
			HttpTransportConfigSchema.pipe(
				Effect.provide(Layer.setConfigProvider(configProvider)),
			),
		);

		expect(result.url).toBe("https://mainnet.infura.io/v3/KEY");
		expect(Duration.toMillis(result.timeout)).toBe(60000);
		expect(Duration.toMillis(result.retryBaseDelay)).toBe(2000);
		expect(result.retryMaxAttempts).toBe(5);
		expect(HashMap.size(result.headers)).toBe(0);
		expect(Option.isNone(result.apiKey)).toBe(true);
	});

	it("uses defaults when optional values not provided", async () => {
		const configProvider = ConfigProvider.fromMap(
			new Map([["http.url", "https://eth.llamarpc.com"]]),
		);

		const result = await Effect.runPromise(
			HttpTransportConfigSchema.pipe(
				Effect.provide(Layer.setConfigProvider(configProvider)),
			),
		);

		expect(result.url).toBe("https://eth.llamarpc.com");
		expect(Duration.toMillis(result.timeout)).toBe(30000);
		expect(result.retryMaxAttempts).toBe(3);
		expect(Duration.toMillis(result.retryBaseDelay)).toBe(1000);
	});

	it("validates URL must start with http:// or https://", async () => {
		const configProvider = ConfigProvider.fromMap(
			new Map([["http.url", "invalid-url"]]),
		);

		const result = await Effect.runPromiseExit(
			HttpTransportConfigSchema.pipe(
				Effect.provide(Layer.setConfigProvider(configProvider)),
			),
		);

		expect(result._tag).toBe("Failure");
	});

	it("accepts http:// URLs", async () => {
		const configProvider = ConfigProvider.fromMap(
			new Map([["http.url", "http://localhost:8545"]]),
		);

		const result = await Effect.runPromise(
			HttpTransportConfigSchema.pipe(
				Effect.provide(Layer.setConfigProvider(configProvider)),
			),
		);

		expect(result.url).toBe("http://localhost:8545");
	});

	it("reads headers from nested config", async () => {
		const configProvider = ConfigProvider.fromMap(
			new Map([
				["http.url", "https://eth.llamarpc.com"],
				["http.headers.X-API-Key", "my-api-key"],
				["http.headers.X-Custom", "custom-value"],
			]),
		);

		const result = await Effect.runPromise(
			HttpTransportConfigSchema.pipe(
				Effect.provide(Layer.setConfigProvider(configProvider)),
			),
		);

		expect(HashMap.size(result.headers)).toBe(2);
		expect(HashMap.get(result.headers, "X-API-Key")).toEqual(
			Option.some("my-api-key"),
		);
		expect(HashMap.get(result.headers, "X-Custom")).toEqual(
			Option.some("custom-value"),
		);
	});

	it("reads apiKey as secret", async () => {
		const configProvider = ConfigProvider.fromMap(
			new Map([
				["http.url", "https://eth.llamarpc.com"],
				["http.apiKey", "secret-api-key"],
			]),
		);

		const result = await Effect.runPromise(
			HttpTransportConfigSchema.pipe(
				Effect.provide(Layer.setConfigProvider(configProvider)),
			),
		);

		expect(Option.isSome(result.apiKey)).toBe(true);
		// Secret.value() would return the actual value
		// But we don't test the actual value to demonstrate redaction
	});

	it("fails when required url is missing", async () => {
		const configProvider = ConfigProvider.fromMap(new Map());

		const result = await Effect.runPromiseExit(
			HttpTransportConfigSchema.pipe(
				Effect.provide(Layer.setConfigProvider(configProvider)),
			),
		);

		expect(result._tag).toBe("Failure");
	});

	it("parses duration formats correctly", async () => {
		const configProvider = ConfigProvider.fromMap(
			new Map([
				["http.url", "https://eth.llamarpc.com"],
				["http.timeout", "1 minute"],
				["http.retryBaseDelay", "500 millis"],
			]),
		);

		const result = await Effect.runPromise(
			HttpTransportConfigSchema.pipe(
				Effect.provide(Layer.setConfigProvider(configProvider)),
			),
		);

		expect(Duration.toMillis(result.timeout)).toBe(60000);
		expect(Duration.toMillis(result.retryBaseDelay)).toBe(500);
	});
});
