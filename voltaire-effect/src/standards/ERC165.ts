import { ERC165 as ERC165Impl } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { StandardsError } from "./errors.js";
import { ProviderService } from "../services/Provider/index.js";

export const SELECTOR = ERC165Impl.SELECTOR;
export const INTERFACE_IDS = ERC165Impl.INTERFACE_IDS;

export const encodeSupportsInterface = (
	interfaceId: string,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC165Impl.encodeSupportsInterface(interfaceId),
		catch: (e) =>
			new StandardsError({
				operation: "ERC165.encodeSupportsInterface",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeSupportsInterface = (
	data: string,
): Effect.Effect<boolean, StandardsError> =>
	Effect.try({
		try: () => ERC165Impl.decodeSupportsInterface(data),
		catch: (e) =>
			new StandardsError({
				operation: "ERC165.decodeSupportsInterface",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const supportsInterface = (
	contract: string,
	interfaceId: string,
): Effect.Effect<boolean, StandardsError, ProviderService> =>
	Effect.gen(function* () {
		const provider = yield* ProviderService;
		const data = yield* encodeSupportsInterface(interfaceId);

		const result = yield* provider
			.call({ to: contract as `0x${string}`, data: data as `0x${string}` })
			.pipe(
				Effect.map((res) => {
					if (!res || res === "0x") return false;
					return ERC165Impl.decodeSupportsInterface(res);
				}),
				Effect.catchAll(() => Effect.succeed(false)),
			);

		return result;
	});

export const detectInterfaces = (
	contract: string,
): Effect.Effect<string[], StandardsError, ProviderService> =>
	Effect.gen(function* () {
		const supportsERC165 = yield* supportsInterface(
			contract,
			INTERFACE_IDS.ERC165,
		);

		if (!supportsERC165) {
			return [];
		}

		const supported: string[] = ["ERC165"];

		const entries = Object.entries(INTERFACE_IDS).filter(
			([name]) => name !== "ERC165",
		);

		const checks = yield* Effect.all(
			entries.map(([name, id]) =>
				supportsInterface(contract, id).pipe(
					Effect.map((supports) => (supports ? name : null)),
				),
			),
			{ concurrency: "unbounded" },
		);

		supported.push(...checks.filter((name): name is string => name !== null));

		return supported;
	});
