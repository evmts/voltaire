import { ERC1155 as ERC1155Impl } from "@tevm/voltaire";
import type { BrandedAddress, BrandedUint } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { StandardsError } from "./errors.js";

type AddressType = BrandedAddress.AddressType;
type Uint256Type = BrandedUint.Uint256Type;

export const SELECTORS = ERC1155Impl.SELECTORS;
export const EVENTS = ERC1155Impl.EVENTS;

export const encodeBalanceOf = (
	account: AddressType,
	id: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC1155Impl.encodeBalanceOf(account, id),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeBalanceOf",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeSetApprovalForAll = (
	operator: AddressType,
	approved: boolean,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC1155Impl.encodeSetApprovalForAll(operator, approved),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeSetApprovalForAll",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeSafeTransferFrom = (
	from: AddressType,
	to: AddressType,
	id: Uint256Type,
	amount: Uint256Type,
	data?: Uint8Array,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC1155Impl.encodeSafeTransferFrom(from, to, id, amount, data),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeSafeTransferFrom",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeIsApprovedForAll = (
	account: AddressType,
	operator: AddressType,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC1155Impl.encodeIsApprovedForAll(account, operator),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeIsApprovedForAll",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeURI = (
	id: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC1155Impl.encodeURI(id),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeURI",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeTransferSingleEvent = (log: {
	topics: string[];
	data: string;
}): Effect.Effect<
	{
		operator: string;
		from: string;
		to: string;
		id: Uint256Type;
		value: Uint256Type;
	},
	StandardsError
> =>
	Effect.try({
		try: () => ERC1155Impl.decodeTransferSingleEvent(log),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.decodeTransferSingleEvent",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeApprovalForAllEvent = (log: {
	topics: string[];
	data: string;
}): Effect.Effect<
	{ account: string; operator: string; approved: boolean },
	StandardsError
> =>
	Effect.try({
		try: () => ERC1155Impl.decodeApprovalForAllEvent(log),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.decodeApprovalForAllEvent",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});
