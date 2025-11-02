import * as Uint from "../Uint/Uint.js";

const gweiSymbol = Symbol("Gwei");

export type Type = Uint.Type & { __brand: typeof gweiSymbol };

const WEI_PER_GWEI = 1_000_000_000n;
const GWEI_PER_ETHER = 1_000_000_000n;

export function from(value: bigint | number | string): Type {
	return Uint.from(value) as Type;
}

export function fromWei(wei: import("./Wei.js").Type): Type {
	const gwei = Uint.dividedBy(wei, Uint.from(WEI_PER_GWEI));
	return gwei as Type;
}

export function fromEther(ether: import("./Ether.js").Type): Type {
	const gwei = Uint.times(ether, Uint.from(GWEI_PER_ETHER));
	return gwei as Type;
}

export function toWei(gwei: Type): import("./Wei.js").Type {
	const wei = Uint.times(gwei, Uint.from(WEI_PER_GWEI));
	return wei as import("./Wei.js").Type;
}

export function toEther(gwei: Type): import("./Ether.js").Type {
	const ether = Uint.dividedBy(gwei, Uint.from(GWEI_PER_ETHER));
	return ether as import("./Ether.js").Type;
}

export function toU256(gwei: Type): Uint.Type {
	return gwei as Uint.Type;
}
