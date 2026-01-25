/**
 * @fileoverview Tests for standardized error shapes across voltaire-effect services.
 *
 * All service errors should have a consistent interface:
 * - _tag: discriminant for Effect error handling
 * - input: the original input that caused the error
 * - message: human-readable error message
 * - cause: optional underlying error
 */
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { AccountError } from "./Account/AccountService.js";
import {
	ContractCallError,
	ContractError,
	ContractEventError,
	ContractWriteError,
} from "./Contract/ContractTypes.js";
import { ProviderError } from "./Provider/ProviderService.js";
import { TransportError } from "./Transport/TransportError.js";
import { SignerError } from "./Signer/SignerService.js";
import { TransportService } from "./Transport/TransportService.js";
import { Provider } from "./Provider/Provider.js";
import { ProviderService } from "./Provider/ProviderService.js";

describe("Error constructor standardization", () => {
	describe("All errors have consistent shape", () => {
		it("TransportError has _tag, input, message, cause", () => {
			const input = {
				code: -32603,
				message: "Internal error",
				data: { extra: "info" },
			};
			const cause = new Error("underlying");
			const error = new TransportError(input, "Transport failed", { cause });

			expect(error._tag).toBe("TransportError");
			expect(error.name).toBe("TransportError");
			expect(error.input).toEqual(input);
			expect(error.message).toContain("Transport failed");
			expect(error.cause).toBe(cause);
		});

		it("TransportError preserves code and data from input", () => {
			const input = {
				code: -32601,
				message: "Method not found",
				data: "0x1234",
			};
			const error = new TransportError(input, "RPC error");

			expect(error.code).toBe(-32601);
			expect(error.data).toBe("0x1234");
		});

		it("ProviderError has _tag, input, message, cause", () => {
			const input = { method: "eth_getBalance", params: ["0x123"] };
			const cause = new Error("network timeout");
			const error = new ProviderError(input, "Failed to get balance", {
				cause,
			});

			expect(error._tag).toBe("ProviderError");
			expect(error.name).toBe("ProviderError");
			expect(error.input).toEqual(input);
			expect(error.message).toContain("Failed to get balance");
			expect(error.cause).toBe(cause);
		});

		it("AccountError has _tag, input, message, cause", () => {
			const input = { message: "0x1234abcd" };
			const cause = new Error("signing failed");
			const error = new AccountError(input, "Failed to sign message", {
				cause,
			});

			expect(error._tag).toBe("AccountError");
			expect(error.name).toBe("AccountError");
			expect(error.input).toEqual(input);
			expect(error.message).toContain("Failed to sign message");
			expect(error.cause).toBe(cause);
		});

		it("SignerError has _tag, input, message, cause", () => {
			const input = { to: "0x123", value: 1000n };
			const cause = new Error("insufficient funds");
			const error = new SignerError(input, "Transaction failed", {
				cause,
			});

			expect(error._tag).toBe("SignerError");
			expect(error.name).toBe("SignerError");
			expect(error.input).toEqual(input);
			expect(error.message).toContain("Transaction failed");
			expect(error.cause).toBe(cause);
		});

		it("ContractError has _tag, input, message, cause", () => {
			const input = { address: "0x123", method: "transfer" };
			const cause = new Error("execution reverted");
			const error = new ContractError(input, "Contract call failed", { cause });

			expect(error._tag).toBe("ContractError");
			expect(error.name).toBe("ContractError");
			expect(error.input).toEqual(input);
			expect(error.message).toContain("Contract call failed");
			expect(error.cause).toBe(cause);
		});

		it("ContractCallError has _tag, input, message, cause", () => {
			const input = { address: "0x123", method: "balanceOf", args: ["0x456"] };
			const cause = new Error("view failed");
			const error = new ContractCallError(input, "Read failed", { cause });

			expect(error._tag).toBe("ContractCallError");
			expect(error.name).toBe("ContractCallError");
			expect(error.input).toEqual(input);
			expect(error.message).toContain("Read failed");
			expect(error.cause).toBe(cause);
		});

		it("ContractWriteError has _tag, input, message, cause", () => {
			const input = {
				address: "0x123",
				method: "transfer",
				args: ["0x456", 100n],
			};
			const cause = new Error("gas estimation failed");
			const error = new ContractWriteError(input, "Write failed", { cause });

			expect(error._tag).toBe("ContractWriteError");
			expect(error.name).toBe("ContractWriteError");
			expect(error.input).toEqual(input);
			expect(error.message).toContain("Write failed");
			expect(error.cause).toBe(cause);
		});

		it("ContractEventError has _tag, input, message, cause", () => {
			const input = { address: "0x123", event: "Transfer", fromBlock: 1000n };
			const cause = new Error("getLogs failed");
			const error = new ContractEventError(input, "Event query failed", {
				cause,
			});

			expect(error._tag).toBe("ContractEventError");
			expect(error.name).toBe("ContractEventError");
			expect(error.input).toEqual(input);
			expect(error.message).toContain("Event query failed");
			expect(error.cause).toBe(cause);
		});
	});

	describe("Error without cause", () => {
		it("TransportError works without cause", () => {
			const input = { code: -32600, message: "Invalid request" };
			const error = new TransportError(input, "Bad request");

			expect(error.input).toEqual(input);
			expect(error.message).toBe("Bad request");
			expect(error.cause).toBeUndefined();
		});

		it("ProviderError works without cause", () => {
			const error = new ProviderError("0xhash", "Transaction timeout");

			expect(error.input).toBe("0xhash");
			expect(error.message).toBe("Transaction timeout");
			expect(error.cause).toBeUndefined();
		});

		it("AccountError works without cause", () => {
			const error = new AccountError(
				{ action: "signMessage" },
				"Signing rejected",
			);

			expect(error.input).toEqual({ action: "signMessage" });
			expect(error.message).toBe("Signing rejected");
			expect(error.cause).toBeUndefined();
		});

		it("SignerError works without cause", () => {
			const error = new SignerError(
				{ action: "sendTransaction" },
				"User rejected",
			);

			expect(error.input).toEqual({ action: "sendTransaction" });
			expect(error.message).toBe("User rejected");
			expect(error.cause).toBeUndefined();
		});
	});

	describe("Error instanceof checks", () => {
		it("all errors extend Error", () => {
			expect(new TransportError({ code: 1, message: "x" }, "x")).toBeInstanceOf(
				Error,
			);
			expect(new ProviderError({}, "x")).toBeInstanceOf(Error);
			expect(new AccountError({}, "x")).toBeInstanceOf(Error);
			expect(new SignerError({}, "x")).toBeInstanceOf(Error);
			expect(new ContractError({}, "x")).toBeInstanceOf(Error);
			expect(new ContractCallError({}, "x")).toBeInstanceOf(Error);
			expect(new ContractWriteError({}, "x")).toBeInstanceOf(Error);
			expect(new ContractEventError({}, "x")).toBeInstanceOf(Error);
		});

		it("contract sub-errors extend ContractError", () => {
			expect(new ContractCallError({}, "x")).toBeInstanceOf(ContractError);
			expect(new ContractWriteError({}, "x")).toBeInstanceOf(ContractError);
			expect(new ContractEventError({}, "x")).toBeInstanceOf(ContractError);
		});
	});

	describe("Error message defaults", () => {
		it("TransportError uses input.message as fallback", () => {
			const input = { code: -32603, message: "Internal error" };
			const error = new TransportError(input);

			expect(error.message).toBe("Internal error");
		});

		it("errors can derive message from cause", () => {
			const cause = new Error("Original error");
			const error = new ProviderError({ method: "eth_call" }, undefined, {
				cause,
			});

			expect(error.message).toContain("Original error");
		});
	});

	describe("Error code propagation", () => {
		it("ProviderError preserves TransportError code", async () => {
			const transport = Layer.succeed(TransportService, {
				request: <T>(_method: string, _params?: unknown[]) =>
					Effect.fail(
						new TransportError({ code: -32603, message: "Internal error" }),
					) as Effect.Effect<T, TransportError>,
			});
			const layer = Provider.pipe(Layer.provide(transport));

			const exit = await Effect.runPromiseExit(
				Effect.gen(function* () {
					const provider = yield* ProviderService;
					return yield* provider.getBlockNumber();
				}).pipe(Effect.provide(layer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const cause = exit.cause;
				if (cause._tag === "Fail") {
					const error = cause.error as ProviderError;
					expect(error._tag).toBe("ProviderError");
					expect(error.cause).toBeInstanceOf(TransportError);
					expect((error.cause as TransportError).code).toBe(-32603);
				}
			}
		});

		it("SignerError preserves ProviderError code", () => {
			const providerError = new ProviderError(
				{ method: "eth_estimateGas" },
				"Execution reverted",
				{ code: -32000 },
			);
			const signerError = new SignerError(
				{ to: "0x123", value: 1000n },
				"Transaction failed",
				{ cause: providerError },
			);

			expect(signerError._tag).toBe("SignerError");
			expect(signerError.cause).toBe(providerError);
			expect((signerError.cause as ProviderError).code).toBe(-32000);
		});

		it("TransportError code is accessible on wrapped errors", () => {
			const transportError = new TransportError({
				code: -32601,
				message: "Method not found",
			});
			const providerError = new ProviderError(
				{ method: "unknown_method" },
				"RPC call failed",
				{ cause: transportError },
			);
			const signerError = new SignerError(
				{ action: "sendTransaction" },
				"Send failed",
				{ cause: providerError },
			);

			expect(signerError.cause).toBe(providerError);
			expect((signerError.cause as ProviderError).cause).toBe(transportError);
			expect(
				((signerError.cause as ProviderError).cause as TransportError).code,
			).toBe(-32601);
		});
	});
});
