import type * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { BrandedAddress } from "./BrandedAddress/BrandedAddress.js";
import type { Checksummed } from "./BrandedAddress/ChecksumAddress.js";
import * as ChecksumAddressImpl from "./BrandedAddress/ChecksumAddress.js";
import * as BrandedAddressImpl from "./BrandedAddress/index.js";

/**
 * Effect Brand for Address (wraps existing BrandedAddress)
 */
export type AddressBrand = BrandedAddress & Brand.Brand<"Address">;

/**
 * Effect Brand for ChecksumAddress (wraps existing Checksummed type)
 */
export type ChecksumAddressBrand = Checksummed & Brand.Brand<"ChecksumAddress">;

/**
 * Schema for Address from various input types
 * Validates and brands Uint8Array as Address
 */
export class Address extends Schema.Class<Address>("Address")({
	value: Schema.Uint8ArrayFromSelf.pipe(
		Schema.filter(
			(bytes): bytes is Uint8Array => {
				return BrandedAddressImpl.is(bytes);
			},
			{
				message: () => "Invalid address: must be 20 bytes",
			},
		),
	),
}) {
	/**
	 * Get the underlying BrandedAddress
	 */
	get address(): BrandedAddress {
		return this.value as BrandedAddress;
	}

	/**
	 * Create from universal input (number, bigint, hex string, Uint8Array)
	 */
	static from(value: number | bigint | string | Uint8Array): Address {
		const addr = BrandedAddressImpl.from(value);
		return new Address({ value: addr });
	}

	/**
	 * Create from hex string
	 */
	static fromHex(value: string): Address {
		const addr = BrandedAddressImpl.fromHex(value);
		return new Address({ value: addr });
	}

	/**
	 * Create from bytes
	 */
	static fromBytes(value: Uint8Array): Address {
		const addr = BrandedAddressImpl.fromBytes(value);
		return new Address({ value: addr });
	}

	/**
	 * Create from number or bigint
	 */
	static fromNumber(value: number | bigint): Address {
		const addr = BrandedAddressImpl.fromNumber(value);
		return new Address({ value: addr });
	}

	/**
	 * Create from public key coordinates
	 */
	static fromPublicKey(x: bigint, y: bigint): Address {
		const addr = BrandedAddressImpl.fromPublicKey(x, y);
		return new Address({ value: addr });
	}

	/**
	 * Create from private key
	 */
	static fromPrivateKey(value: Uint8Array): Address {
		const addr = BrandedAddressImpl.fromPrivateKey(value);
		return new Address({ value: addr });
	}

	/**
	 * Create from ABI-encoded bytes
	 */
	static fromAbiEncoded(value: Uint8Array): Address {
		const addr = BrandedAddressImpl.fromAbiEncoded(value);
		return new Address({ value: addr });
	}

	/**
	 * Create zero address
	 */
	static zero(): Address {
		const addr = BrandedAddressImpl.zero();
		return new Address({ value: addr });
	}

	/**
	 * Convert to hex string
	 */
	toHex(): string {
		return BrandedAddressImpl.toHex(this.address);
	}

	/**
	 * Convert to checksummed hex string (EIP-55)
	 */
	toChecksummed(): Checksummed {
		return BrandedAddressImpl.toChecksummed(this.address);
	}

	/**
	 * Convert to lowercase hex string
	 */
	toLowercase(): string {
		return BrandedAddressImpl.toLowercase(this.address);
	}

	/**
	 * Convert to uppercase hex string
	 */
	toUppercase(): string {
		return BrandedAddressImpl.toUppercase(this.address);
	}

	/**
	 * Convert to U256 bigint
	 */
	toU256(): bigint {
		return BrandedAddressImpl.toU256(this.address);
	}

	/**
	 * Convert to ABI-encoded bytes (32 bytes, left-padded)
	 */
	toAbiEncoded(): Uint8Array {
		return BrandedAddressImpl.toAbiEncoded(this.address);
	}

	/**
	 * Convert to short hex (removes leading zeros)
	 */
	toShortHex(): string {
		return BrandedAddressImpl.toShortHex(this.address);
	}

	/**
	 * Check if address is zero
	 */
	isZero(): boolean {
		return BrandedAddressImpl.isZero(this.address);
	}

	/**
	 * Compare with another address for equality
	 */
	equals(other: Address | BrandedAddress): boolean {
		const otherAddr =
			other instanceof Address ? other.address : (other as BrandedAddress);
		return BrandedAddressImpl.equals(this.address, otherAddr);
	}

	/**
	 * Compare with another address lexicographically
	 * Returns -1 if this < other, 0 if equal, 1 if this > other
	 */
	compare(other: Address | BrandedAddress): number {
		const otherAddr =
			other instanceof Address ? other.address : (other as BrandedAddress);
		return BrandedAddressImpl.compare(this.address, otherAddr);
	}

	/**
	 * Clone the address
	 */
	clone(): Address {
		const cloned = BrandedAddressImpl.clone(this.address);
		return new Address({ value: cloned });
	}

	/**
	 * Calculate CREATE address
	 */
	calculateCreateAddress(nonce: bigint): Address {
		const result = BrandedAddressImpl.calculateCreateAddress(
			this.address,
			nonce,
		);
		return new Address({ value: result });
	}

	/**
	 * Calculate CREATE2 address
	 */
	calculateCreate2Address(salt: Uint8Array, initCode: Uint8Array): Address {
		const result = BrandedAddressImpl.calculateCreate2Address(
			this.address,
			salt,
			initCode,
		);
		return new Address({ value: result });
	}
}

/**
 * Schema for ChecksumAddress (EIP-55)
 * Validates checksummed hex string
 */
export class ChecksumAddress extends Schema.Class<ChecksumAddress>(
	"ChecksumAddress",
)({
	value: Schema.String.pipe(
		Schema.filter(
			(str): str is string => {
				return ChecksumAddressImpl.isValid(str);
			},
			{
				message: () =>
					"Invalid checksum address: EIP-55 checksum validation failed",
			},
		),
	),
}) {
	/**
	 * Get the underlying Checksummed string
	 */
	get checksummed(): Checksummed {
		return this.value as Checksummed;
	}

	/**
	 * Create from universal input (validates checksum)
	 */
	static from(value: number | bigint | string | Uint8Array): ChecksumAddress {
		const checksummed = ChecksumAddressImpl.from(value);
		return new ChecksumAddress({ value: checksummed });
	}

	/**
	 * Validate a string has valid EIP-55 checksum
	 */
	static isValid(str: string): boolean {
		return ChecksumAddressImpl.isValid(str);
	}

	/**
	 * Convert to Address schema instance
	 */
	toAddress(): Address {
		const addr = BrandedAddressImpl.fromHex(this.value);
		return new Address({ value: addr });
	}
}

/**
 * Schema for validating hex string addresses (with automatic normalization)
 */
export const AddressFromHex = Schema.transform(
	Schema.String,
	Schema.instanceOf(Address),
	{
		decode: (hex) => Address.fromHex(hex),
		encode: (addr) => addr.toHex(),
	},
);

/**
 * Schema for validating and creating checksummed addresses
 */
export const AddressFromChecksummed = Schema.transform(
	Schema.String,
	Schema.instanceOf(ChecksumAddress),
	{
		decode: (str) => ChecksumAddress.from(str),
		encode: (addr) => addr.checksummed,
	},
);

/**
 * Schema for universal Address input (number, bigint, hex, bytes)
 */
export const AddressFromUnknown = Schema.transform(
	Schema.Union(
		Schema.Number,
		Schema.BigIntFromSelf,
		Schema.String,
		Schema.Uint8ArrayFromSelf,
	),
	Schema.instanceOf(Address),
	{
		decode: (value) => Address.from(value),
		encode: (addr) => addr.address,
	},
);
