// @ts-nocheck
export class Secp256k1Error extends Error {
	constructor(message) {
		super(message);
		this.name = "Secp256k1Error";
	}
}

export class InvalidSignatureError extends Secp256k1Error {
	constructor(message) {
		super(message);
		this.name = "InvalidSignatureError";
	}
}

export class InvalidPublicKeyError extends Secp256k1Error {
	constructor(message) {
		super(message);
		this.name = "InvalidPublicKeyError";
	}
}

export class InvalidPrivateKeyError extends Secp256k1Error {
	constructor(message) {
		super(message);
		this.name = "InvalidPrivateKeyError";
	}
}
