import * as Brand from "effect/Brand";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type { BrandedAddress } from "./BrandedAddress/BrandedAddress.js";
import type { Checksummed } from "./BrandedAddress/ChecksumAddress.js";
import * as ChecksumAddressImpl from "./BrandedAddress/ChecksumAddress.js";
import * as BrandedAddressImpl from "./BrandedAddress/index.js";
import {
	type CalculateCreate2AddressErrors,
	type CalculateCreateAddressErrors,
	type ChecksumAddressFromErrors,
	CryptoOperationError,
	type FromAbiEncodedErrors,
	type FromBytesErrors,
	type FromErrors,
	type FromHexErrors,
	type FromNumberErrors,
	type FromPrivateKeyErrors,
	type FromPublicKeyErrors,
	InvalidAddressLengthError,
	InvalidChecksumError,
	InvalidHexFormatError,
	InvalidHexStringError,
	InvalidPrivateKeyError,
	InvalidValueError,
	RlpEncodingError,
	type ToChecksummedErrors,
} from "./effect-errors.js";
import {
	Keccak256Service,
	RlpEncoderService,
	Secp256k1Service,
} from "./effect-services.js";

/**
 * Effect Brand for Address - refined brand that validates 20-byte Uint8Array
 */
export type AddressBrand = Uint8Array & Brand.Brand<"Address">;

/**
 * Effect Brand constructor with validation
 */
export const AddressBrand = Brand.refined<AddressBrand>(
	(bytes): bytes is Uint8Array & Brand.Brand<"Address"> =>
		bytes instanceof Uint8Array && bytes.length === 20,
	(bytes) =>
		Brand.error(
			`Expected 20-byte Uint8Array, got ${bytes instanceof Uint8Array ? `${bytes.length} bytes` : typeof bytes}`,
		),
);

/**
 * Effect Brand for ChecksumAddress - nominal brand for checksummed string
 */
export type ChecksumAddressBrand = string & Brand.Brand<"ChecksumAddress">;

/**
 * Effect Brand constructor (nominal - validation happens separately via keccak)
 */
export const ChecksumAddressBrand = Brand.nominal<ChecksumAddressBrand>();

/**
 * Schema for Address from various input types
 * Uses Effect Brand validation for type safety
 */
export class AddressSchema extends Schema.Class<AddressSchema>("Address")({
	value: Schema.Uint8ArrayFromSelf.pipe(
		Schema.filter(
			(bytes): bytes is Uint8Array => {
				return bytes.length === 20;
			},
			{
				message: () => "Invalid address: must be 20 bytes",
			},
		),
	),
}) {
	/**
	 * Get the underlying BrandedAddress (internal Voltaire type)
	 */
	get address(): BrandedAddress {
		return this.value as BrandedAddress;
	}

	/**
	 * Get as Effect branded AddressBrand
	 */
	get branded(): AddressBrand {
		return this.value as AddressBrand;
	}

	/**
	 * Create from Effect branded AddressBrand (zero-cost, no validation)
	 */
	static fromBranded(brand: AddressBrand): AddressSchema {
		return new AddressSchema({ value: brand });
	}

	/**
	 * Create from universal input (number, bigint, hex string, Uint8Array)
	 * @returns Effect that may fail with various input validation errors
	 */
	static from(
		value: number | bigint | string | Uint8Array,
	): Effect.Effect<AddressSchema, FromErrors> {
		return Effect.try({
			try: () => {
				const addr = BrandedAddressImpl.from(value);
				return new AddressSchema({ value: addr });
			},
			catch: (error) => {
				// Map native errors to Effect errors
				if (error instanceof Error) {
					const msg = error.message;
					if (msg.includes("hex")) {
						if (msg.includes("format")) {
							return new InvalidHexFormatError({
								value,
								expected: "0x-prefixed hex string",
							});
						}
						return new InvalidHexStringError({
							value: String(value),
							reason: msg,
						});
					}
					if (msg.includes("length") || msg.includes("bytes")) {
						return new InvalidAddressLengthError({
							value,
							actualLength: value instanceof Uint8Array ? value.length : 0,
							expectedLength: 20,
						});
					}
					return new InvalidValueError({
						value,
						expected: "valid address input",
						context: { error: msg },
					});
				}
				return new InvalidValueError({
					value,
					expected: "valid address input",
				});
			},
		});
	}

	/**
	 * Create from hex string
	 * @returns Effect that may fail with hex format errors
	 */
	static fromHex(value: string): Effect.Effect<AddressSchema, FromHexErrors> {
		return Effect.try({
			try: () => {
				const addr = BrandedAddressImpl.fromHex(value);
				return new AddressSchema({ value: addr });
			},
			catch: (error) => {
				if (error instanceof Error) {
					const msg = error.message;
					if (msg.includes("format") || msg.includes("0x")) {
						return new InvalidHexFormatError({
							value,
							expected: "0x-prefixed hex string",
						});
					}
					if (msg.includes("hex") || msg.includes("character")) {
						return new InvalidHexStringError({
							value,
							reason: msg,
						});
					}
					if (msg.includes("length") || msg.includes("bytes")) {
						return new InvalidAddressLengthError({
							value,
							actualLength: (value.length - 2) / 2, // hex chars to bytes
							expectedLength: 20,
						});
					}
				}
				return new InvalidHexFormatError({
					value,
					expected: "valid hex string",
				});
			},
		});
	}

	/**
	 * Create from bytes
	 * @returns Effect that may fail with length errors
	 */
	static fromBytes(
		value: Uint8Array,
	): Effect.Effect<AddressSchema, FromBytesErrors> {
		return Effect.try({
			try: () => {
				const addr = BrandedAddressImpl.fromBytes(value);
				return new AddressSchema({ value: addr });
			},
			catch: (error) => {
				return new InvalidAddressLengthError({
					value,
					actualLength: value.length,
					expectedLength: 20,
				});
			},
		});
	}

	/**
	 * Create from number or bigint
	 * @returns Effect that may fail with value errors
	 */
	static fromNumber(
		value: number | bigint,
	): Effect.Effect<AddressSchema, FromNumberErrors> {
		return Effect.try({
			try: () => {
				const addr = BrandedAddressImpl.fromNumber(value);
				return new AddressSchema({ value: addr });
			},
			catch: (error) => {
				return new InvalidValueError({
					value,
					expected: "non-negative number",
					context: {
						error: error instanceof Error ? error.message : undefined,
					},
				});
			},
		});
	}

	/**
	 * Create from public key coordinates
	 * @returns Effect that uses Keccak256Service
	 */
	static fromPublicKey(
		x: bigint,
		y: bigint,
	): Effect.Effect<AddressSchema, FromPublicKeyErrors, Keccak256Service> {
		return Effect.gen(function* () {
			const keccak = yield* Keccak256Service;

			// Convert coordinates to bytes
			const xBytes = new Uint8Array(32);
			const yBytes = new Uint8Array(32);

			// Convert bigints to bytes (big-endian)
			let xTemp = x;
			let yTemp = y;
			for (let i = 31; i >= 0; i--) {
				xBytes[i] = Number(xTemp & 0xffn);
				yBytes[i] = Number(yTemp & 0xffn);
				xTemp >>= 8n;
				yTemp >>= 8n;
			}

			// Concatenate x and y
			const publicKey = new Uint8Array(64);
			publicKey.set(xBytes, 0);
			publicKey.set(yBytes, 32);

			// Hash the public key
			const hash = yield* keccak.hash(publicKey);

			// Take last 20 bytes as address
			const addr = hash.slice(12, 32) as BrandedAddress;
			return new AddressSchema({ value: addr });
		});
	}

	/**
	 * Create from private key
	 * @returns Effect that uses Secp256k1Service and Keccak256Service
	 */
	static fromPrivateKey(
		value: Uint8Array,
	): Effect.Effect<
		AddressSchema,
		FromPrivateKeyErrors,
		Secp256k1Service | Keccak256Service
	> {
		return Effect.gen(function* () {
			// Validate private key length
			if (value.length !== 32) {
				return yield* Effect.fail(
					new InvalidAddressLengthError({
						value,
						actualLength: value.length,
						expectedLength: 32,
					}),
				);
			}

			const secp = yield* Secp256k1Service;
			const keccak = yield* Keccak256Service;

			// Derive public key from private key
			const publicKey = yield* secp.derivePublicKey(value).pipe(
				Effect.mapError((e) => {
					if (e._tag === "CryptoOperationError") {
						return new InvalidPrivateKeyError({
							message: e.message,
							cause: e.cause,
						});
					}
					return e;
				}),
			);

			// Hash the public key
			const hash = yield* keccak.hash(publicKey);

			// Take last 20 bytes as address
			const addr = hash.slice(12, 32) as BrandedAddress;
			return new AddressSchema({ value: addr });
		});
	}

	/**
	 * Create from ABI-encoded bytes
	 * @returns Effect that may fail with validation errors
	 */
	static fromAbiEncoded(
		value: Uint8Array,
	): Effect.Effect<AddressSchema, FromAbiEncodedErrors> {
		return Effect.try({
			try: () => {
				const addr = BrandedAddressImpl.fromAbiEncoded(value);
				return new AddressSchema({ value: addr });
			},
			catch: (error) => {
				if (value.length !== 32) {
					return new InvalidAddressLengthError({
						value,
						actualLength: value.length,
						expectedLength: 32,
					});
				}
				return new InvalidValueError({
					value,
					expected: "32-byte ABI-encoded address",
					context: {
						error: error instanceof Error ? error.message : undefined,
					},
				});
			},
		});
	}

	/**
	 * Create zero address (safe, no errors)
	 */
	static zero(): AddressSchema {
		const addr = BrandedAddressImpl.zero();
		return new AddressSchema({ value: addr });
	}

	/**
	 * Convert to hex string (safe, no errors)
	 */
	toHex(): string {
		return BrandedAddressImpl.toHex(this.address);
	}

	/**
	 * Convert to checksummed hex string (EIP-55)
	 * @returns Effect that uses Keccak256Service
	 */
	toChecksummed(): Effect.Effect<
		Checksummed,
		ToChecksummedErrors,
		Keccak256Service
	> {
		const self = this;
		return Effect.gen(function* () {
			const keccak = yield* Keccak256Service;

			// Get lowercase hex without 0x
			const hex = self.toHex().slice(2);

			// Hash the lowercase address
			const hashBytes = yield* keccak.hash(new TextEncoder().encode(hex));

			// Convert hash to hex string
			let hashHex = "";
			for (const byte of hashBytes) {
				hashHex += byte.toString(16).padStart(2, "0");
			}

			// Apply checksum
			let result = "0x";
			for (let i = 0; i < hex.length; i++) {
				const char = hex[i];
				const hashNibble = Number.parseInt(hashHex[i], 16);
				if (hashNibble >= 8) {
					result += char.toUpperCase();
				} else {
					result += char.toLowerCase();
				}
			}

			return result as Checksummed;
		});
	}

	/**
	 * Convert to lowercase hex string (safe, no errors)
	 */
	toLowercase(): string {
		return BrandedAddressImpl.toLowercase(this.address);
	}

	/**
	 * Convert to uppercase hex string (safe, no errors)
	 */
	toUppercase(): string {
		return BrandedAddressImpl.toUppercase(this.address);
	}

	/**
	 * Convert to U256 bigint (safe, no errors)
	 */
	toU256(): bigint {
		return BrandedAddressImpl.toU256(this.address);
	}

	/**
	 * Convert to ABI-encoded bytes (32 bytes, left-padded) (safe, no errors)
	 */
	toAbiEncoded(): Uint8Array {
		return BrandedAddressImpl.toAbiEncoded(this.address);
	}

	/**
	 * Convert to short hex (removes leading zeros) (safe, no errors)
	 */
	toShortHex(): string {
		return BrandedAddressImpl.toShortHex(this.address);
	}

	/**
	 * Check if address is zero (safe, no errors)
	 */
	isZero(): boolean {
		return BrandedAddressImpl.isZero(this.address);
	}

	/**
	 * Compare with another address for equality (safe, no errors)
	 */
	equals(other: AddressSchema | BrandedAddress): boolean {
		const otherAddr =
			other instanceof AddressSchema
				? other.address
				: (other as BrandedAddress);
		return BrandedAddressImpl.equals(this.address, otherAddr);
	}

	/**
	 * Compare with another address lexicographically (safe, no errors)
	 * Returns -1 if this < other, 0 if equal, 1 if this > other
	 */
	compare(other: AddressSchema | BrandedAddress): number {
		const otherAddr =
			other instanceof AddressSchema
				? other.address
				: (other as BrandedAddress);
		return BrandedAddressImpl.compare(this.address, otherAddr);
	}

	/**
	 * Clone the address (safe, no errors)
	 */
	clone(): AddressSchema {
		const cloned = BrandedAddressImpl.clone(this.address);
		return new AddressSchema({ value: cloned });
	}

	/**
	 * Calculate CREATE address
	 * @returns Effect that uses Keccak256Service and RlpEncoderService
	 */
	calculateCreateAddress(
		nonce: bigint,
	): Effect.Effect<
		AddressSchema,
		CalculateCreateAddressErrors,
		Keccak256Service | RlpEncoderService
	> {
		const self = this;
		return Effect.gen(function* () {
			// Validate nonce
			if (nonce < 0n) {
				return yield* Effect.fail(
					new InvalidValueError({
						value: nonce,
						expected: "non-negative nonce",
					}),
				);
			}

			const keccak = yield* Keccak256Service;
			const rlp = yield* RlpEncoderService;

			// Encode nonce as minimal bytes (no leading zeros)
			const nonceBytes =
				nonce === 0n
					? new Uint8Array(0)
					: (() => {
							let n = nonce;
							let byteCount = 0;
							while (n > 0n) {
								byteCount++;
								n >>= 8n;
							}

							const bytes = new Uint8Array(byteCount);
							n = nonce;
							for (let i = byteCount - 1; i >= 0; i--) {
								bytes[i] = Number(n & 0xffn);
								n >>= 8n;
							}
							return bytes;
						})();

			// RLP encode [address, nonce]
			const encoded = yield* rlp.encode([self.address, nonceBytes]);

			// Hash the encoded data
			const hash = yield* keccak.hash(encoded);

			// Take last 20 bytes as address
			const result = hash.slice(12, 32) as BrandedAddress;
			return new AddressSchema({ value: result });
		});
	}

	/**
	 * Calculate CREATE2 address
	 * @returns Effect that uses Keccak256Service
	 */
	calculateCreate2Address(
		salt: Uint8Array,
		initCode: Uint8Array,
	): Effect.Effect<
		AddressSchema,
		CalculateCreate2AddressErrors,
		Keccak256Service
	> {
		const self = this;
		return Effect.gen(function* () {
			// Validate salt
			if (salt.length !== 32) {
				return yield* Effect.fail(
					new InvalidValueError({
						value: salt,
						expected: "32-byte salt",
						context: { actualLength: salt.length },
					}),
				);
			}

			const keccak = yield* Keccak256Service;

			// Hash init code
			const initCodeHash = yield* keccak.hash(initCode);

			// Build the payload: 0xff ++ address ++ salt ++ keccak256(init_code)
			const payload = new Uint8Array(1 + 20 + 32 + 32);
			payload[0] = 0xff;
			payload.set(self.address, 1);
			payload.set(salt, 21);
			payload.set(initCodeHash, 53);

			// Hash the payload
			const hash = yield* keccak.hash(payload);

			// Take last 20 bytes as address
			const result = hash.slice(12, 32) as BrandedAddress;
			return new AddressSchema({ value: result });
		});
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
	 * Get the underlying Checksummed string (internal Voltaire type)
	 */
	get checksummed(): Checksummed {
		return this.value as Checksummed;
	}

	/**
	 * Get as Effect branded ChecksumAddressBrand
	 */
	get branded(): ChecksumAddressBrand {
		return ChecksumAddressBrand(this.value);
	}

	/**
	 * Create from Effect branded ChecksumAddressBrand (zero-cost, no validation)
	 */
	static fromBranded(brand: ChecksumAddressBrand): ChecksumAddress {
		return new ChecksumAddress({ value: brand });
	}

	/**
	 * Create from universal input (validates checksum)
	 * @returns Effect that uses Keccak256Service
	 */
	static from(
		value: number | bigint | string | Uint8Array,
	): Effect.Effect<
		ChecksumAddress,
		ChecksumAddressFromErrors,
		Keccak256Service
	> {
		return Effect.gen(function* () {
			// First convert to AddressSchema
			const addr = yield* AddressSchema.from(value);

			// Get checksummed version
			const checksummed = yield* addr.toChecksummed();

			// If input was a string, validate checksum matches
			if (typeof value === "string" && value.startsWith("0x")) {
				const hasUpperCase = /[A-F]/.test(value);
				const hasLowerCase = /[a-f]/.test(value.slice(2));

				if (hasUpperCase && hasLowerCase && value !== checksummed) {
					return yield* Effect.fail(
						new InvalidChecksumError({
							address: value,
							expected: checksummed,
							actual: value,
						}),
					);
				}
			}

			return new ChecksumAddress({ value: checksummed });
		});
	}

	/**
	 * Validate a string has valid EIP-55 checksum (uses crypto)
	 * @returns Effect that uses Keccak256Service
	 */
	static isValid(str: string): Effect.Effect<boolean, never, Keccak256Service> {
		return Effect.gen(function* () {
			if (!str.startsWith("0x") || str.length !== 42) {
				return false;
			}

			// Check if it has mixed case (potential checksum)
			const hasUpperCase = /[A-F]/.test(str);
			const hasLowerCase = /[a-f]/.test(str.slice(2));

			if (!hasUpperCase || !hasLowerCase) {
				// All uppercase or all lowercase - not checksummed
				return false;
			}

			const keccak = yield* Keccak256Service;

			// Get lowercase hex without 0x
			const hex = str.slice(2).toLowerCase();

			// Hash the lowercase address
			const hashBytes = yield* keccak.hash(new TextEncoder().encode(hex));

			// Convert hash to hex string
			let hashHex = "";
			for (const byte of hashBytes) {
				hashHex += byte.toString(16).padStart(2, "0");
			}

			// Check each character
			for (let i = 0; i < hex.length; i++) {
				const char = hex[i];
				const actualChar = str[i + 2]; // skip 0x
				const hashNibble = Number.parseInt(hashHex[i], 16);

				if (hashNibble >= 8) {
					if (actualChar !== char.toUpperCase()) return false;
				} else {
					if (actualChar !== char.toLowerCase()) return false;
				}
			}

			return true;
		});
	}

	/**
	 * Convert to AddressSchema instance
	 * @returns Effect that may fail with hex format errors
	 */
	toAddress(): Effect.Effect<AddressSchema, FromHexErrors> {
		return AddressSchema.fromHex(this.value);
	}
}

/**
 * Schema for validating hex string addresses (with automatic normalization)
 * Note: These schemas need to be used within an Effect context with services provided
 */
export const AddressFromHex = Schema.transform(
	Schema.String,
	Schema.instanceOf(AddressSchema),
	{
		decode: (hex) => {
			// This is problematic because Schema transforms are synchronous
			// but our method returns Effect now
			// We'll need to use a different approach
			throw new Error(
				"AddressFromHex schema cannot be used directly with Effect-based methods. " +
					"Use AddressSchema.fromHex() directly within Effect.gen",
			);
		},
		encode: (addr) => addr.toHex(),
	},
);

/**
 * Schema for validating and creating checksummed addresses
 * Note: These schemas need to be used within an Effect context with services provided
 */
export const AddressFromChecksummed = Schema.transform(
	Schema.String,
	Schema.instanceOf(ChecksumAddress),
	{
		decode: (str) => {
			// This is problematic because Schema transforms are synchronous
			// but our method returns Effect now
			throw new Error(
				"AddressFromChecksummed schema cannot be used directly with Effect-based methods. " +
					"Use ChecksumAddress.from() directly within Effect.gen",
			);
		},
		encode: (addr) => addr.checksummed,
	},
);

/**
 * Schema for universal AddressSchema input (number, bigint, hex, bytes)
 * Note: These schemas need to be used within an Effect context with services provided
 */
export const AddressFromUnknown = Schema.transform(
	Schema.Union(
		Schema.Number,
		Schema.BigIntFromSelf,
		Schema.String,
		Schema.Uint8ArrayFromSelf,
	),
	Schema.instanceOf(AddressSchema),
	{
		decode: (value) => {
			// This is problematic because Schema transforms are synchronous
			// but our method returns Effect now
			throw new Error(
				"AddressFromUnknown schema cannot be used directly with Effect-based methods. " +
					"Use AddressSchema.from() directly within Effect.gen",
			);
		},
		encode: (addr) => addr.address,
	},
);
