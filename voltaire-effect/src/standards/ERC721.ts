import { ERC721 as ERC721Impl } from "@tevm/voltaire";
import type { BrandedAddress, BrandedUint } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { StandardsError } from "./errors.js";

type AddressType = BrandedAddress.AddressType;
type Uint256Type = BrandedUint.Uint256Type;

export const SELECTORS = ERC721Impl.SELECTORS;
export const EVENTS = ERC721Impl.EVENTS;

export const encodeTransferFrom = (
	from: AddressType,
	to: AddressType,
	tokenId: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC721Impl.encodeTransferFrom(from, to, tokenId),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeTransferFrom",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeSafeTransferFrom = (
	from: AddressType,
	to: AddressType,
	tokenId: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC721Impl.encodeSafeTransferFrom(from, to, tokenId),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeSafeTransferFrom",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeApprove = (
	to: AddressType,
	tokenId: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC721Impl.encodeApprove(to, tokenId),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeApprove",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeSetApprovalForAll = (
	operator: AddressType,
	approved: boolean,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC721Impl.encodeSetApprovalForAll(operator, approved),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeSetApprovalForAll",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeOwnerOf = (
	tokenId: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC721Impl.encodeOwnerOf(tokenId),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeOwnerOf",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeTokenURI = (
	tokenId: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC721Impl.encodeTokenURI(tokenId),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeTokenURI",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeTransferEvent = (log: {
	topics: string[];
	data: string;
}): Effect.Effect<
	{ from: string; to: string; tokenId: Uint256Type },
	StandardsError
> =>
	Effect.try({
		try: () => ERC721Impl.decodeTransferEvent(log),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.decodeTransferEvent",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeApprovalEvent = (log: {
	topics: string[];
	data: string;
}): Effect.Effect<
	{ owner: string; approved: string; tokenId: Uint256Type },
	StandardsError
> =>
	Effect.try({
		try: () => ERC721Impl.decodeApprovalEvent(log),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.decodeApprovalEvent",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeApprovalForAllEvent = (log: {
	topics: string[];
	data: string;
}): Effect.Effect<
	{ owner: string; operator: string; approved: boolean },
	StandardsError
> =>
	Effect.try({
		try: () => ERC721Impl.decodeApprovalForAllEvent(log),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.decodeApprovalForAllEvent",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});
