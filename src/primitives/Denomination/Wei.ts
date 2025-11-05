import * as Uint from "../Uint/index.js";

const weiSymbol = Symbol("Wei");

export type Type = Uint.Type & { __brand: typeof weiSymbol };

const WEI_PER_GWEI = 1_000_000_000n;
const WEI_PER_ETHER = 1_000_000_000_000_000_000n;

export function from(value: bigint | number | string): Type {
	return Uint.from(value) as Type;
}

export function fromGwei(gwei: import("./Gwei.js").Type): Type {
	const wei = Uint.times(gwei, Uint.from(WEI_PER_GWEI));
	return wei as Type;
}

export function fromEther(ether: import("./Ether.js").Type): Type {
	const wei = Uint.times(ether, Uint.from(WEI_PER_ETHER));
	return wei as Type;
}

export function toGwei(wei: Type): import("./Gwei.js").Type {
	const gwei = Uint.dividedBy(wei, Uint.from(WEI_PER_GWEI));
	return gwei as import("./Gwei.js").Type;
}

export function toEther(wei: Type): import("./Ether.js").Type {
	const ether = Uint.dividedBy(wei, Uint.from(WEI_PER_ETHER));
	return ether as import("./Ether.js").Type;
}

export function toU256(wei: Type): Uint.Type {
	return wei as Uint.Type;
}
