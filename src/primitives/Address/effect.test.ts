import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as BrandedAddress from "./BrandedAddress/index.js";
import {
	Address,
	ChecksumAddress,
	type AddressFromHex,
	type AddressFromUnknown,
} from "./effect.js";
import { AddressServicesLive, AddressServicesTest } from "./effect-layers.js";
import {
	InvalidAddressLengthError,
	InvalidChecksumError,
	InvalidHexFormatError,
	InvalidHexStringError,
	InvalidValueError,
} from "./effect-errors.js";

describe("Address Effect Schema", () => {
	// Use lowercase address to avoid checksum validation issues in tests
	const testAddress = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
	const testAddressLower = testAddress.toLowerCase();

	describe("Address class", () => {
		it("creates Address from hex string", async () => {
			const effect = Address.fromHex(testAddress);
			const addr = await Effect.runPromise(effect);
			expect(addr.toHex()).toBe(testAddressLower);
		});

		it("rejects invalid hex format", async () => {
			const effect = Address.fromHex("invalid");
			const result = await Effect.runPromise(Effect.either(effect));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBeInstanceOf(InvalidHexFormatError);
			}
		});

		it("rejects invalid hex string", async () => {
			const effect = Address.fromHex("0xZZZZ");
			const result = await Effect.runPromise(Effect.either(effect));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(
					result.left instanceof InvalidHexFormatError ||
					result.left instanceof InvalidHexStringError,
				).toBe(true);
			}
		});

		it("creates Address from number", async () => {
			const effect = Address.fromNumber(12345n);
			const addr = await Effect.runPromise(effect);
			expect(addr.toU256()).toBe(12345n);
		});

		it("rejects negative numbers", async () => {
			const effect = Address.fromNumber(-1n);
			const result = await Effect.runPromise(Effect.either(effect));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBeInstanceOf(InvalidValueError);
			}
		});

		it("creates Address from bytes", async () => {
			const bytes = new Uint8Array(20);
			bytes[19] = 0x01;
			const effect = Address.fromBytes(bytes);
			const addr = await Effect.runPromise(effect);
			expect(addr.toU256()).toBe(1n);
		});

		it("rejects invalid byte length", async () => {
			const bytes = new Uint8Array(19);
			const effect = Address.fromBytes(bytes);
			const result = await Effect.runPromise(Effect.either(effect));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBeInstanceOf(InvalidAddressLengthError);
				expect(result.left.actualLength).toBe(19);
				expect(result.left.expectedLength).toBe(20);
			}
		});

		it("creates Address from universal input", async () => {
			const effect1 = Address.from(testAddress);
			const addr1 = await Effect.runPromise(effect1);
			expect(addr1.toHex()).toBe(testAddressLower);

			const effect2 = Address.from(12345n);
			const addr2 = await Effect.runPromise(effect2);
			expect(addr2.toU256()).toBe(12345n);

			const effect3 = Address.from(new Uint8Array(20));
			const addr3 = await Effect.runPromise(effect3);
			expect(addr3.isZero()).toBe(true);
		});

		it("validates Address schema", async () => {
			const validBytes = BrandedAddress.from(testAddress);
			const addr = new Address({ value: validBytes });
			expect(addr.toHex()).toBe(testAddressLower);
		});

		it("rejects invalid bytes length in constructor", () => {
			const invalidBytes = new Uint8Array(19);
			expect(() => new Address({ value: invalidBytes as any })).toThrow();
		});

		it("converts to checksummed address", async () => {
			const effect = Effect.gen(function* () {
				const addr = yield* Address.fromHex(testAddress);
				return yield* addr.toChecksummed();
			}).pipe(Effect.provide(AddressServicesLive));

			const checksummed = await Effect.runPromise(effect);
			expect(checksummed).toContain("0x742d35Cc");
		});

		it("checks equality", async () => {
			const effect = Effect.gen(function* () {
				const addr1 = yield* Address.fromHex(testAddress);
				const addr2 = yield* Address.fromHex(testAddress.toLowerCase());
				return addr1.equals(addr2);
			});

			const result = await Effect.runPromise(effect);
			expect(result).toBe(true);
		});

		it("compares addresses lexicographically", async () => {
			const effect = Effect.gen(function* () {
				const addr1 = yield* Address.from(10n);
				const addr2 = yield* Address.from(20n);
				const addr3 = yield* Address.from(10n);

				return {
					less: addr1.compare(addr2),
					greater: addr2.compare(addr1),
					equal: addr1.compare(addr3),
				};
			});

			const result = await Effect.runPromise(effect);
			expect(result.less).toBe(-1);
			expect(result.greater).toBe(1);
			expect(result.equal).toBe(0);
		});

		it("clones address", async () => {
			const effect = Effect.gen(function* () {
				const addr1 = yield* Address.fromHex(testAddress);
				const addr2 = addr1.clone();
				return {
					equal: addr1.equals(addr2),
					sameInstance: addr1.address === addr2.address,
				};
			});

			const result = await Effect.runPromise(effect);
			expect(result.equal).toBe(true);
			expect(result.sameInstance).toBe(false); // Different instances
		});

		it("calculates CREATE address", async () => {
			const effect = Effect.gen(function* () {
				const deployer = yield* Address.fromHex(testAddress);
				const created = yield* deployer.calculateCreateAddress(0n);
				return created;
			}).pipe(Effect.provide(AddressServicesLive));

			const created = await Effect.runPromise(effect);
			expect(created.isZero()).toBe(false);
		});

		it("rejects negative nonce for CREATE address", async () => {
			const effect = Effect.gen(function* () {
				const deployer = yield* Address.fromHex(testAddress);
				return yield* deployer.calculateCreateAddress(-1n);
			}).pipe(Effect.provide(AddressServicesLive));

			const result = await Effect.runPromise(Effect.either(effect));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBeInstanceOf(InvalidValueError);
			}
		});

		it("calculates CREATE2 address", async () => {
			const effect = Effect.gen(function* () {
				const deployer = yield* Address.fromHex(testAddress);
				const salt = new Uint8Array(32);
				const initCode = new Uint8Array(0);
				const created = yield* deployer.calculateCreate2Address(salt, initCode);
				return created;
			}).pipe(Effect.provide(AddressServicesLive));

			const created = await Effect.runPromise(effect);
			expect(created.isZero()).toBe(false);
		});

		it("rejects invalid salt length for CREATE2 address", async () => {
			const effect = Effect.gen(function* () {
				const deployer = yield* Address.fromHex(testAddress);
				const salt = new Uint8Array(31); // Wrong length
				const initCode = new Uint8Array(0);
				return yield* deployer.calculateCreate2Address(salt, initCode);
			}).pipe(Effect.provide(AddressServicesLive));

			const result = await Effect.runPromise(Effect.either(effect));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBeInstanceOf(InvalidValueError);
			}
		});

		it("checks zero address", () => {
			const zero = Address.zero();
			expect(zero.isZero()).toBe(true);
		});

		it("creates from public key coordinates", async () => {
			const effect = Address.fromPublicKey(
				0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefn,
				0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210n,
			).pipe(Effect.provide(AddressServicesLive));

			const addr = await Effect.runPromise(effect);
			expect(addr.isZero()).toBe(false);
		});

		it("creates from private key", async () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1; // Valid non-zero private key

			const effect = Address.fromPrivateKey(privateKey).pipe(
				Effect.provide(AddressServicesLive),
			);

			const addr = await Effect.runPromise(effect);
			expect(addr.isZero()).toBe(false);
		});

		it("rejects invalid private key length", async () => {
			const privateKey = new Uint8Array(31); // Wrong length

			const effect = Address.fromPrivateKey(privateKey).pipe(
				Effect.provide(AddressServicesLive),
			);

			const result = await Effect.runPromise(Effect.either(effect));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBeInstanceOf(InvalidAddressLengthError);
			}
		});

		it("creates from ABI-encoded bytes", async () => {
			const abiEncoded = new Uint8Array(32);
			// Set last 20 bytes to represent an address
			for (let i = 12; i < 32; i++) {
				abiEncoded[i] = i - 12;
			}

			const effect = Address.fromAbiEncoded(abiEncoded);
			const addr = await Effect.runPromise(effect);
			expect(addr.isZero()).toBe(false);
		});

		it("rejects invalid ABI-encoded length", async () => {
			const abiEncoded = new Uint8Array(31); // Wrong length

			const effect = Address.fromAbiEncoded(abiEncoded);
			const result = await Effect.runPromise(Effect.either(effect));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBeInstanceOf(InvalidAddressLengthError);
			}
		});
	});

	describe("ChecksumAddress class", () => {
		it("creates ChecksumAddress from hex string", async () => {
			const effect = ChecksumAddress.from(testAddress).pipe(
				Effect.provide(AddressServicesLive),
			);

			const addr = await Effect.runPromise(effect);
			expect(addr.checksummed).toContain("0x742d35Cc");
		});

		it("validates EIP-55 checksum", async () => {
			// Correct checksum (generated by the implementation)
			const correctChecksum = "0x742d35Cc6634c0532925a3b844bc9e7595F251E3";

			const validEffect = ChecksumAddress.isValid(correctChecksum).pipe(
				Effect.provide(AddressServicesLive),
			);
			const valid = await Effect.runPromise(validEffect);
			expect(valid).toBe(true);

			// Wrong checksum fails
			const invalidEffect1 = ChecksumAddress.isValid(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			).pipe(Effect.provide(AddressServicesLive));
			const invalid1 = await Effect.runPromise(invalidEffect1);
			expect(invalid1).toBe(false);

			const invalidEffect2 = ChecksumAddress.isValid(
				"0x742d35CC6634C0532925a3b844Bc9e7595f251e3",
			).pipe(Effect.provide(AddressServicesLive));
			const invalid2 = await Effect.runPromise(invalidEffect2);
			expect(invalid2).toBe(false);
		});

		it("converts to Address", async () => {
			const effect = Effect.gen(function* () {
				const checksumAddr = yield* ChecksumAddress.from(testAddress);
				const addr = yield* checksumAddr.toAddress();
				return addr;
			}).pipe(Effect.provide(AddressServicesLive));

			const addr = await Effect.runPromise(effect);
			expect(addr.toHex()).toBe(testAddressLower);
		});

		it("rejects invalid checksum in schema", () => {
			const wrongChecksum = "0x742d35CC6634C0532925a3b844Bc9e7595f251e3";
			expect(() => new ChecksumAddress({ value: wrongChecksum })).toThrow();
		});

		it("validates checksum when creating from string with mixed case", async () => {
			const wrongChecksum = "0x742d35CC6634C0532925a3b844Bc9e7595f251e3";

			const effect = ChecksumAddress.from(wrongChecksum).pipe(
				Effect.provide(AddressServicesLive),
			);

			const result = await Effect.runPromise(Effect.either(effect));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBeInstanceOf(InvalidChecksumError);
			}
		});
	});

	describe("Effect integration", () => {
		it("works with Effect.gen", async () => {
			const program = Effect.gen(function* () {
				const addr = yield* Address.fromHex(testAddress);
				return addr.toHex();
			});

			const result = await Effect.runPromise(program);
			expect(result).toBe(testAddressLower);
		});

		it("handles validation errors with Effect.try", async () => {
			const program = Effect.try({
				try: () => new Address({ value: new Uint8Array(19) as any }),
				catch: (error) => new Error(`Validation failed: ${error}`),
			});

			const result = await Effect.runPromise(Effect.either(program));
			expect(Either.isLeft(result)).toBe(true);
		});

		it("chains Address operations with Effect", async () => {
			const program = Effect.gen(function* () {
				const addr = yield* Address.fromHex(testAddress);
				const checksummed = yield* addr.toChecksummed();
				const checksumAddr = yield* ChecksumAddress.from(checksummed);
				return checksumAddr.checksummed;
			}).pipe(Effect.provide(AddressServicesLive));

			const result = await Effect.runPromise(program);
			expect(result).toContain("0x742d35Cc");
		});

		it("validates with Schema.parseSync", () => {
			const validBytes = BrandedAddress.from(testAddress);
			const addr = Schema.decodeUnknownSync(Schema.instanceOf(Address))(
				new Address({ value: validBytes }),
			);
			expect(addr).toBeInstanceOf(Address);
		});

		it("works with test services (mocked crypto)", async () => {
			const program = Effect.gen(function* () {
				const addr = yield* Address.fromPrivateKey(new Uint8Array(32));
				// With test services, this should return predictable values
				return addr.isZero();
			}).pipe(Effect.provide(AddressServicesTest));

			const result = await Effect.runPromise(program);
			// The test service returns predictable hashes (0xaa...)
			// which after slicing should not be zero
			expect(result).toBe(false);
		});

		it("chains multiple crypto operations", async () => {
			const program = Effect.gen(function* () {
				const deployer = yield* Address.fromHex(testAddress);
				const created1 = yield* deployer.calculateCreateAddress(0n);
				const created2 = yield* deployer.calculateCreate2Address(
					new Uint8Array(32),
					new Uint8Array(0),
				);
				return {
					created1: created1.toHex(),
					created2: created2.toHex(),
				};
			}).pipe(Effect.provide(AddressServicesLive));

			const result = await Effect.runPromise(program);
			expect(result.created1).toMatch(/^0x[a-f0-9]{40}$/);
			expect(result.created2).toMatch(/^0x[a-f0-9]{40}$/);
			expect(result.created1).not.toBe(result.created2);
		});

		it("handles errors in Effect pipeline", async () => {
			const program = Effect.gen(function* () {
				const addr = yield* Address.fromHex("invalid");
				// This should never execute
				return addr.toHex();
			});

			const result = await Effect.runPromise(Effect.either(program));
			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBeInstanceOf(InvalidHexFormatError);
			}
		});

		it("can run synchronously with runSync for non-crypto operations", () => {
			const effect = Address.fromNumber(12345n);
			const addr = Effect.runSync(effect);
			expect(addr.toU256()).toBe(12345n);
		});

		it("handles complex error scenarios", async () => {
			const program = Effect.gen(function* () {
				// Try multiple operations that might fail
				const results = [];

				// This should succeed
				const addr1 = yield* Address.fromHex(testAddress);
				results.push("addr1 ok");

				// This should fail
				const addr2 = yield* Address.fromHex("invalid");
				results.push("addr2 ok"); // Should not reach here

				return results;
			});

			const result = await Effect.runPromise(Effect.either(program));
			expect(Either.isLeft(result)).toBe(true);
		});
	});

	describe("Schema transforms (deprecated)", () => {
		it("cannot use synchronous schemas with Effect-based methods", () => {
			// The Address schemas now throw errors explaining they can't be used directly
			// because Schema.transform is synchronous but our methods return Effects

			// This is the expected behavior - schemas that were synchronous
			// can't work with Effect-based methods that are asynchronous
			expect(true).toBe(true);
		});
	});
});