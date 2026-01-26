import type { BrandedAddress } from "@tevm/voltaire";
import { ERC721 as ERC721Impl } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { StandardsError } from "./errors.js";

type AddressType = BrandedAddress.AddressType;
type Uint256Type = bigint;

const toHex = (bytes: Uint8Array) =>
	Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const encodeAddress = (address: AddressType) =>
	toHex(address).padStart(64, "0");
const encodeUint256 = (value: Uint256Type) =>
	value.toString(16).padStart(64, "0");
const encodeBytes = (data: Uint8Array) =>
	toHex(data).padEnd(Math.ceil(data.length / 32) * 64, "0");
const normalizeHex = (data: string) =>
	data.startsWith("0x") ? data : `0x${data}`;

export const SELECTORS = ERC721Impl.SELECTORS;
export const EVENTS = ERC721Impl.EVENTS;

export const encodeTransferFrom = (
	from: AddressType,
	to: AddressType,
	tokenId: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC721Impl.encodeTransferFrom(from, to, tokenId as never),
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
		try: () => ERC721Impl.encodeSafeTransferFrom(from, to, tokenId as never),
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
			const impl = (
				ERC721Impl as {
					encodeSafeTransferFromWithData?: (
						from: AddressType,
						to: AddressType,
						tokenId: Uint256Type,
						data: Uint8Array,
					) => string;
				}
			).encodeSafeTransferFromWithData;
			if (impl) {
				return impl(from, to, tokenId, data);
			}
			const dataOffset = (4 * 32).toString(16).padStart(64, "0");
			const dataLength = data.length.toString(16).padStart(64, "0");
			return `${ERC721Impl.SELECTORS.safeTransferFromWithData}${encodeAddress(from)}${encodeAddress(to)}${encodeUint256(tokenId)}${dataOffset}${dataLength}${encodeBytes(data)}`;
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
		try: () => ERC721Impl.encodeApprove(to, tokenId as never),
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
			const impl = (
				ERC721Impl as {
					encodeBalanceOf?: (owner: AddressType) => string;
				}
			).encodeBalanceOf;
			return impl
				? impl(owner)
				: `${ERC721Impl.SELECTORS.balanceOf}${encodeAddress(owner)}`;
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
		try: () => ERC721Impl.encodeOwnerOf(tokenId as never),
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
			const impl = (
				ERC721Impl as {
					encodeGetApproved?: (tokenId: Uint256Type) => string;
				}
			).encodeGetApproved;
			return impl
				? impl(tokenId)
				: `${ERC721Impl.SELECTORS.getApproved}${encodeUint256(tokenId)}`;
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
			const impl = (
				ERC721Impl as {
					encodeIsApprovedForAll?: (
						owner: AddressType,
						operator: AddressType,
					) => string;
				}
			).encodeIsApprovedForAll;
			return impl
				? impl(owner, operator)
				: `${ERC721Impl.SELECTORS.isApprovedForAll}${encodeAddress(owner)}${encodeAddress(operator)}`;
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
		try: () => ERC721Impl.encodeTokenURI(tokenId as never),
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
		try: () => {
			const impl = (
				ERC721Impl as { decodeBalanceOfResult?: (data: string) => Uint256Type }
			).decodeBalanceOfResult;
			return impl ? impl(data) : (BigInt(normalizeHex(data)) as Uint256Type);
		},
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
		try: () => {
			const impl = (
				ERC721Impl as { decodeGetApprovedResult?: (data: string) => string }
			).decodeGetApprovedResult;
			if (impl) {
				return impl(data);
			}
			const hex = data.startsWith("0x") ? data.slice(2) : data;
			return `0x${hex.slice(-40)}`;
		},
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
		try: () => {
			const impl = (
				ERC721Impl as {
					decodeIsApprovedForAllResult?: (data: string) => boolean;
				}
			).decodeIsApprovedForAllResult;
			return impl ? impl(data) : BigInt(normalizeHex(data)) !== 0n;
		},
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
