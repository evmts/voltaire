import { ERC20 as ERC20Impl } from "@tevm/voltaire";
import type { BrandedAddress, BrandedUint } from "@tevm/voltaire";

type AddressType = BrandedAddress.AddressType;
type Uint256Type = BrandedUint.Uint256Type;
import * as Effect from "effect/Effect";
import { StandardsError } from "./errors.js";

export const SELECTORS = ERC20Impl.SELECTORS;
export const EVENTS = ERC20Impl.EVENTS;

export const encodeTransfer = (
	to: AddressType,
	amount: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC20Impl.encodeTransfer(to, amount),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.encodeTransfer",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeApprove = (
	spender: AddressType,
	amount: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC20Impl.encodeApprove(spender, amount),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.encodeApprove",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeTransferFrom = (
	from: AddressType,
	to: AddressType,
	amount: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC20Impl.encodeTransferFrom(from, to, amount),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.encodeTransferFrom",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeBalanceOf = (
	account: AddressType,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC20Impl.encodeBalanceOf(account),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.encodeBalanceOf",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeAllowance = (
	owner: AddressType,
	spender: AddressType,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC20Impl.encodeAllowance(owner, spender),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.encodeAllowance",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeTransferEvent = (log: {
	topics: string[];
	data: string;
}): Effect.Effect<
	{ from: string; to: string; value: Uint256Type },
	StandardsError
> =>
	Effect.try({
		try: () => ERC20Impl.decodeTransferEvent(log),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.decodeTransferEvent",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeApprovalEvent = (log: {
	topics: string[];
	data: string;
}): Effect.Effect<
	{ owner: string; spender: string; value: Uint256Type },
	StandardsError
> =>
	Effect.try({
		try: () => ERC20Impl.decodeApprovalEvent(log),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.decodeApprovalEvent",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeUint256 = (
	data: string,
): Effect.Effect<Uint256Type, StandardsError> =>
	Effect.try({
		try: () => ERC20Impl.decodeUint256(data),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.decodeUint256",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeAddress = (
	data: string,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC20Impl.decodeAddress(data),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.decodeAddress",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeBool = (
	data: string,
): Effect.Effect<boolean, StandardsError> =>
	Effect.try({
		try: () => ERC20Impl.decodeBool(data),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.decodeBool",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeString = (
	data: string,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC20Impl.decodeString(data),
		catch: (e) =>
			new StandardsError({
				operation: "ERC20.decodeString",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});
