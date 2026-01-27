import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";

export function hashEquals(a: HashType, b: HashType): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

export function addressEquals(a: AddressType, b: AddressType): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
