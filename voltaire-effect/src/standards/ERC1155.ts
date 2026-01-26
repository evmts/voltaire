import { ERC1155 as ERC1155Impl } from "@tevm/voltaire";
import type { BrandedAddress } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import { StandardsError } from "./errors.js";

type AddressType = BrandedAddress.AddressType;
type Uint256Type = bigint;

const padTo32 = (hex: string) => hex.padStart(64, "0");
const toHex = (bytes: Uint8Array) =>
	Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const encodeAddress = (address: AddressType) => toHex(address).padStart(64, "0");
const encodeUint256 = (value: Uint256Type) => value.toString(16).padStart(64, "0");
const encodeUint256Array = (values: readonly Uint256Type[]) => {
	const lengthHex = padTo32(values.length.toString(16));
	const valuesHex = values.map(encodeUint256).join("");
	return {
		data: `${lengthHex}${valuesHex}`,
		byteLength: 32 + values.length * 32,
	};
};
const encodeAddressArray = (values: readonly AddressType[]) => {
	const lengthHex = padTo32(values.length.toString(16));
	const valuesHex = values.map(encodeAddress).join("");
	return {
		data: `${lengthHex}${valuesHex}`,
		byteLength: 32 + values.length * 32,
	};
};
const decodeUint256Array = (dataHex: string, offset: number) => {
	const start = offset * 2;
	const lengthHex = dataHex.slice(start, start + 64);
	const length = Number.parseInt(lengthHex || "0", 16);
	const values: Uint256Type[] = [];
	for (let i = 0; i < length; i += 1) {
		const valueStart = start + 64 + i * 64;
		const valueHex = dataHex.slice(valueStart, valueStart + 64);
		values.push(BigInt(`0x${valueHex}`) as Uint256Type);
	}
	return values;
};
const decodeString = (dataHex: string, offset: number) => {
	const start = offset * 2;
	const lengthHex = dataHex.slice(start, start + 64);
	const length = Number.parseInt(lengthHex || "0", 16);
	const valueStart = start + 64;
	const valueHex = dataHex.slice(valueStart, valueStart + length * 2);
	if (valueHex.length === 0) {
		return "";
	}
	const bytes = valueHex
		.match(/.{1,2}/g)
		?.map((byte) => Number.parseInt(byte, 16));
	return new TextDecoder().decode(Uint8Array.from(bytes ?? []));
};

export const SELECTORS = ERC1155Impl.SELECTORS;
export const EVENTS = ERC1155Impl.EVENTS;

export const encodeBalanceOf = (
	account: AddressType,
	id: Uint256Type,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => ERC1155Impl.encodeBalanceOf(account, id as never),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeBalanceOf",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeBalanceOfBatch = (
	accounts: readonly AddressType[],
	ids: readonly Uint256Type[],
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => {
			const accountsEncoded = encodeAddressArray(accounts);
			const idsEncoded = encodeUint256Array(ids);
			const accountsOffset = padTo32((2 * 32).toString(16));
			const idsOffset = padTo32(
				(2 * 32 + accountsEncoded.byteLength).toString(16),
			);
			return `${ERC1155Impl.SELECTORS.balanceOfBatch}${accountsOffset}${idsOffset}${accountsEncoded.data}${idsEncoded.data}`;
		},
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeBalanceOfBatch",
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
		try: () => ERC1155Impl.encodeSafeTransferFrom(from, to, id as never, amount as never, data),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeSafeTransferFrom",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const encodeSafeBatchTransferFrom = (
	from: AddressType,
	to: AddressType,
	ids: readonly Uint256Type[],
	amounts: readonly Uint256Type[],
	data?: Uint8Array,
): Effect.Effect<string, StandardsError> =>
	Effect.try({
		try: () => {
			const dataBytes = data ?? new Uint8Array(0);
			const idsEncoded = encodeUint256Array(ids);
			const amountsEncoded = encodeUint256Array(amounts);
			const dataHex = toHex(dataBytes).padEnd(
				Math.ceil(dataBytes.length / 32) * 64,
				"0",
			);
			const dataLengthHex = padTo32(dataBytes.length.toString(16));
			const headSize = 5 * 32;
			const idsOffset = padTo32(headSize.toString(16));
			const amountsOffset = padTo32(
				(headSize + idsEncoded.byteLength).toString(16),
			);
			const dataOffset = padTo32(
				(headSize + idsEncoded.byteLength + amountsEncoded.byteLength).toString(
					16,
				),
			);
			return `${ERC1155Impl.SELECTORS.safeBatchTransferFrom}${encodeAddress(from)}${encodeAddress(to)}${idsOffset}${amountsOffset}${dataOffset}${idsEncoded.data}${amountsEncoded.data}${dataLengthHex}${dataHex}`;
		},
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeSafeBatchTransferFrom",
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
		try: () => ERC1155Impl.encodeURI(id as never),
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.encodeURI",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});

export const decodeBalanceOfBatchResult = (
	data: string,
): Effect.Effect<readonly Uint256Type[], StandardsError> =>
	Effect.try({
		try: () => {
			const dataHex = data.startsWith("0x") ? data.slice(2) : data;
			const offsetHex = dataHex.slice(0, 64);
			const offset = Number.parseInt(offsetHex || "0", 16);
			return decodeUint256Array(dataHex, offset);
		},
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.decodeBalanceOfBatchResult",
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

export const decodeTransferBatchEvent = (log: {
	topics: string[];
	data: string;
}): Effect.Effect<
	{
		operator: string;
		from: string;
		to: string;
		ids: readonly Uint256Type[];
		values: readonly Uint256Type[];
	},
	StandardsError
> =>
	Effect.try({
		try: () => {
			if (log.topics[0] !== ERC1155Impl.EVENTS.TransferBatch) {
				throw new Error("Not a TransferBatch event");
			}

			const operatorTopic = log.topics[1];
			const fromTopic = log.topics[2];
			const toTopic = log.topics[3];
			if (!operatorTopic || !fromTopic || !toTopic) {
				throw new Error("Missing TransferBatch event topics");
			}
			const operator = `0x${operatorTopic.slice(26)}`;
			const from = `0x${fromTopic.slice(26)}`;
			const to = `0x${toTopic.slice(26)}`;

			const dataHex = log.data.startsWith("0x") ? log.data.slice(2) : log.data;
			const idsOffset = Number.parseInt(dataHex.slice(0, 64) || "0", 16);
			const valuesOffset = Number.parseInt(dataHex.slice(64, 128) || "0", 16);
			const ids = decodeUint256Array(dataHex, idsOffset);
			const values = decodeUint256Array(dataHex, valuesOffset);

			return { operator, from, to, ids, values };
		},
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.decodeTransferBatchEvent",
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

export const decodeURIEvent = (log: {
	topics: string[];
	data: string;
}): Effect.Effect<{ value: string; id: Uint256Type }, StandardsError> =>
	Effect.try({
		try: () => {
			if (log.topics[0] !== ERC1155Impl.EVENTS.URI) {
				throw new Error("Not a URI event");
			}
			const idTopic = log.topics[1];
			if (!idTopic) {
				throw new Error("Missing URI event topic");
			}
			const id = BigInt(idTopic) as Uint256Type;
			const dataHex = log.data.startsWith("0x") ? log.data.slice(2) : log.data;
			const offset = Number.parseInt(dataHex.slice(0, 64) || "0", 16);
			const value = decodeString(dataHex, offset);
			return { value, id };
		},
		catch: (e) =>
			new StandardsError({
				operation: "ERC1155.decodeURIEvent",
				message: e instanceof Error ? e.message : String(e),
				cause: e,
			}),
	});
