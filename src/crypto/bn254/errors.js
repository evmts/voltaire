/**
 * BN254 Error Types
 */

export class Bn254Error extends Error {
	constructor(message) {
		super(message);
		this.name = "Bn254Error";
	}
}

export class Bn254InvalidPointError extends Bn254Error {
	constructor(message) {
		super(message);
		this.name = "Bn254InvalidPointError";
	}
}

export class Bn254SubgroupCheckError extends Bn254Error {
	constructor(message) {
		super(message);
		this.name = "Bn254SubgroupCheckError";
	}
}
