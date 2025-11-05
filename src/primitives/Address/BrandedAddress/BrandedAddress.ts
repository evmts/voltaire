export type BrandedAddress = Uint8Array & {
	readonly __tag: "Address";
	toChecksummed(): string;
	toLowercase(): string;
	toUppercase(): string;
	toHex(): string;
	toU256(): bigint;
	toAbiEncoded(): string;
	toShortHex(): string;
	format(): string;
	isZero(): boolean;
	equals(other: BrandedAddress): boolean;
	compare(other: BrandedAddress): number;
	lessThan(other: BrandedAddress): boolean;
	greaterThan(other: BrandedAddress): boolean;
	calculateCreateAddress(nonce: bigint | number): BrandedAddress;
	calculateCreate2Address(salt: Uint8Array, initCode: Uint8Array): BrandedAddress;
};

