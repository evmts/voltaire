export const hashSymbol = Symbol("Hash")

export type Hash = Uint8Array & { __brand: typeof hashSymbol }

export const HASH_SIZE = 32

export class NotImplementedError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "NotImplementedError"
	}
}

export function Hash(value: string): Hash {
	return fromHex(value)
}

export function fromHex(hex: string): Hash {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex
	if (normalized.length !== HASH_SIZE * 2) {
		throw new Error(
			`Hash hex must be ${HASH_SIZE * 2} characters, got ${normalized.length}`,
		)
	}
	if (!/^[0-9a-fA-F]+$/.test(normalized)) {
		throw new Error("Invalid hex string")
	}
	const bytes = new Uint8Array(HASH_SIZE)
	for (let i = 0; i < HASH_SIZE; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
	}
	return bytes as Hash
}

export function fromBytes(bytes: Uint8Array): Hash {
	if (bytes.length !== HASH_SIZE) {
		throw new Error(`Hash must be ${HASH_SIZE} bytes, got ${bytes.length}`)
	}
	return new Uint8Array(bytes) as Hash
}

export function toHex(hash: Hash): string {
	return `0x${Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("")}`
}

export function equals(a: Hash, b: Hash): boolean {
	if (a.length !== b.length) {
		return false
	}
	let result = 0
	for (let i = 0; i < a.length; i++) {
		result |= a[i] ^ b[i]
	}
	return result === 0
}

export function keccak256(data: Uint8Array): Hash {
	throw new NotImplementedError("keccak256 not yet implemented")
}

export function isHash(value: unknown): value is Hash {
	return value instanceof Uint8Array && value.length === HASH_SIZE
}

export const ZERO_HASH: Hash = new Uint8Array(HASH_SIZE) as Hash
