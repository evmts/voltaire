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

export const encodeSafeTransferFromWithData = (
	from: AddressType,
	to: AddressType,
	tokenId: Uint256Type,
	data: Uint8Array = new Uint8Array(0),
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => {
			const fromHex = Array.from(from, (b) =>
				b.toString(16).padStart(2, "0"),
			)
				.join("")
				.padStart(64, "0");
			const toHex = Array.from(to, (b) => b.toString(16).padStart(2, "0"))
				.join("")
				.padStart(64, "0");
			const tokenIdHex = tokenId.toString(16).padStart(64, "0");
			const dataOffset = (4 * 32).toString(16).padStart(64, "0");
			const dataLength = data.length.toString(16).padStart(64, "0");
			const dataHex = Array.from(data, (b) =>
				b.toString(16).padStart(2, "0"),
			)
				.join("")
				.padEnd(Math.ceil(data.length / 32) * 64, "0");

			return `${ERC721Impl.SELECTORS.safeTransferFromWithData}${fromHex}${toHex}${tokenIdHex}${dataOffset}${dataLength}${dataHex}`;
		},
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeSafeTransferFromWithData",
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

export const encodeBalanceOf = (
	owner: AddressType,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => {
			const ownerHex = Array.from(owner, (b) =>
				b.toString(16).padStart(2, "0"),
			)
				.join("")
				.padStart(64, "0");
			return `${ERC721Impl.SELECTORS.balanceOf}${ownerHex}`;
		},
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeBalanceOf",
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

export const encodeGetApproved = (
	tokenId: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => {
			const tokenIdHex = tokenId.toString(16).padStart(64, "0");
			return `${ERC721Impl.SELECTORS.getApproved}${tokenIdHex}`;
		},
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeGetApproved",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeIsApprovedForAll = (
	owner: AddressType,
	operator: AddressType,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => {
			const ownerHex = Array.from(owner, (b) =>
				b.toString(16).padStart(2, "0"),
			)
				.join("")
				.padStart(64, "0");
			const operatorHex = Array.from(operator, (b) =>
				b.toString(16).padStart(2, "0"),
			)
				.join("")
				.padStart(64, "0");
			return `${ERC721Impl.SELECTORS.isApprovedForAll}${ownerHex}${operatorHex}`;
		},
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.encodeIsApprovedForAll",
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

export const decodeBalanceOfResult = (
	data: string,
): Effect.Effect<Uint256Type, StandardsError> =>
	Effect.try({
		try: () => BigInt(data),
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.decodeBalanceOfResult",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeGetApprovedResult = (
	data: string,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => `0x${data.slice(-40)}`,
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.decodeGetApprovedResult",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeIsApprovedForAllResult = (
	data: string,
): Effect.Effect<boolean, StandardsError> =>
	Effect.try({
		try: () => BigInt(data) !== 0n,
		catch: (e) =>
			new StandardsError({
				operation: "ERC721.decodeIsApprovedForAllResult",
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
