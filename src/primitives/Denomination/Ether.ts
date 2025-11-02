import * as Uint from "../Uint/Uint.js";

const etherSymbol = Symbol("Ether");

export type Type = Uint.Type & { __brand: typeof etherSymbol };

const WEI_PER_ETHER = 1_000_000_000_000_000_000n;
const GWEI_PER_ETHER = 1_000_000_000n;

export function from(value: bigint | number | string): Type {
	return Uint.from(value) as Type;
}

export function fromWei(wei: import("./Wei.js").Type): Type {
	const ether = Uint.dividedBy(wei, Uint.from(WEI_PER_ETHER));
	return ether as Type;
}

export function fromGwei(gwei: import("./Gwei.js").Type): Type {
	const ether = Uint.dividedBy(gwei, Uint.from(GWEI_PER_ETHER));
	return ether as Type;
}

export function toWei(ether: Type): import("./Wei.js").Type {
	const wei = Uint.times(ether, Uint.from(WEI_PER_ETHER));
	return wei as import("./Wei.js").Type;
}

export function toGwei(ether: Type): import("./Gwei.js").Type {
	const gwei = Uint.times(ether, Uint.from(GWEI_PER_ETHER));
	return gwei as import("./Gwei.js").Type;
}

export function toU256(ether: Type): Uint.Type {
	return ether as Uint.Type;
}
