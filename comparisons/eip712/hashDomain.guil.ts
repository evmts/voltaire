// Using @noble/hashes as fallback for benchmark compatibility
// Note: The native implementation in src/crypto/eip712.ts uses Zig+FFI which is faster
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex as toHex } from "@noble/hashes/utils.js";

type Hex = `0x${string}`;
type Address = `0x${string}`;

interface TypedDataDomain {
	name?: string;
	version?: string;
	chainId?: number;
	verifyingContract?: Address;
	salt?: Hex;
}

interface TypedDataField {
	name: string;
	type: string;
}

function keccak256(data: Uint8Array | string): Hex {
	const bytes = typeof data === "string" ? hexToBytes(data) : data;
	return `0x${toHex(keccak_256(bytes))}`;
}

function hexToBytes(hex: string): Uint8Array {
	const cleaned = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(cleaned.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function encodeType(
	primaryType: string,
	types: Record<string, TypedDataField[]>,
): string {
	const deps = new Set<string>();
	const findDependencies = (type: string): void => {
		if (deps.has(type) || !types[type]) return;
		deps.add(type);
		for (const field of types[type]) {
			const baseType = field.type.replace(/\[\]$/, "");
			if (types[baseType]) {
				findDependencies(baseType);
			}
		}
	};

	findDependencies(primaryType);
	deps.delete(primaryType);

	const sortedDeps = [primaryType, ...Array.from(deps).sort()];

	return sortedDeps
		.map((type) => {
			const fields = types[type]
				.map((field) => `${field.type} ${field.name}`)
				.join(",");
			return `${type}(${fields})`;
		})
		.join("");
}

function hashType(
	primaryType: string,
	types: Record<string, TypedDataField[]>,
): Hex {
	return keccak256(encodeType(primaryType, types));
}

function encodeValue(
	type: string,
	value: unknown,
	types: Record<string, TypedDataField[]>,
): Hex {
	if (type.endsWith("[]")) {
		const baseType = type.slice(0, -2);
		const encodedArray = (value as unknown[])
			.map((item) => encodeValue(baseType, item, types))
			.join("");
		return keccak256(encodedArray);
	}

	if (type === "string") {
		const encoder = new TextEncoder();
		const bytes = encoder.encode(value as string);
		const hexString = `0x${Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`;
		return keccak256(hexString);
	}

	if (type === "bytes") {
		return keccak256(value as string);
	}

	if (type === "bytes32") {
		return value as Hex;
	}

	if (type === "address") {
		const addr = value as string;
		return `0x${"0".repeat(24)}${addr.slice(2)}` as Hex;
	}

	if (type.startsWith("uint") || type.startsWith("int")) {
		const num = BigInt(value as string | number);
		return `0x${num.toString(16).padStart(64, "0")}` as Hex;
	}

	if (type === "bool") {
		return `0x${"0".repeat(63)}${value ? "1" : "0"}` as Hex;
	}

	if (types[type]) {
		return hashStruct(type, value as Record<string, unknown>, types);
	}

	throw new Error(`Unsupported type: ${type}`);
}

function hashStruct(
	primaryType: string,
	data: Record<string, unknown>,
	types: Record<string, TypedDataField[]>,
): Hex {
	const typeHash = hashType(primaryType, types);
	const encodedValues = types[primaryType]
		.map((field) => encodeValue(field.type, data[field.name], types))
		.map((hex) => hex.slice(2))
		.join("");

	return keccak256(`${typeHash}${encodedValues}`);
}

function hashDomain(domain: TypedDataDomain): Hex {
	const types: Record<string, TypedDataField[]> = {
		EIP712Domain: [],
	};

	const domainData: Record<string, unknown> = {};

	if (domain.name !== undefined) {
		types.EIP712Domain.push({ name: "name", type: "string" });
		domainData.name = domain.name;
	}
	if (domain.version !== undefined) {
		types.EIP712Domain.push({ name: "version", type: "string" });
		domainData.version = domain.version;
	}
	if (domain.chainId !== undefined) {
		types.EIP712Domain.push({ name: "chainId", type: "uint256" });
		domainData.chainId = domain.chainId;
	}
	if (domain.verifyingContract !== undefined) {
		types.EIP712Domain.push({ name: "verifyingContract", type: "address" });
		domainData.verifyingContract = domain.verifyingContract;
	}
	if (domain.salt !== undefined) {
		types.EIP712Domain.push({ name: "salt", type: "bytes32" });
		domainData.salt = domain.salt;
	}

	return hashStruct("EIP712Domain", domainData, types);
}

const domain: TypedDataDomain = {
	name: "Test",
	version: "1",
	chainId: 1,
	verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as const,
};

export function main(): void {
	hashDomain(domain);
}
