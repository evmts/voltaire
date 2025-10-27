/**
 * Enhanced ABI utilities
 * Interface class and Fragment types for comprehensive ABI parsing
 */

export type Hex = `0x${string}`;

/**
 * Function fragment
 */
export interface FunctionFragment {
	type: "function";
	name: string;
	inputs: AbiParameter[];
	outputs: AbiParameter[];
	stateMutability: "pure" | "view" | "nonpayable" | "payable";
}

/**
 * Event fragment
 */
export interface EventFragment {
	type: "event";
	name: string;
	inputs: AbiParameter[];
	anonymous: boolean;
}

/**
 * Error fragment
 */
export interface ErrorFragment {
	type: "error";
	name: string;
	inputs: AbiParameter[];
}

/**
 * Constructor fragment
 */
export interface ConstructorFragment {
	type: "constructor";
	inputs: AbiParameter[];
	stateMutability: "nonpayable" | "payable";
}

/**
 * Fallback fragment
 */
export interface FallbackFragment {
	type: "fallback" | "receive";
	stateMutability: "nonpayable" | "payable";
}

export type Fragment =
	| FunctionFragment
	| EventFragment
	| ErrorFragment
	| ConstructorFragment
	| FallbackFragment;

export interface AbiParameter {
	type: string;
	name?: string;
	components?: AbiParameter[];
	indexed?: boolean;
}

/**
 * Transaction description
 */
export interface TransactionDescription {
	name: string;
	signature: string;
	selector: Hex;
	args: unknown[];
	fragment: FunctionFragment;
}

/**
 * Log description
 */
export interface LogDescription {
	name: string;
	signature: string;
	topic: Hex;
	args: unknown[];
	fragment: EventFragment;
}

/**
 * Error description
 */
export interface ErrorDescription {
	name: string;
	signature: string;
	selector: Hex;
	args: unknown[];
	fragment: ErrorFragment;
}

/**
 * Result array with named access
 */
export class Result extends Array<unknown> {
	constructor(values: unknown[]) {
		super(...values);
	}

	/**
	 * Convert to plain array
	 */
	toArray(): unknown[] {
		throw new Error("not implemented");
	}

	/**
	 * Convert to object with named properties
	 */
	toObject(): Record<string, unknown> {
		throw new Error("not implemented");
	}

	/**
	 * Get value by name
	 */
	getValue(name: string): unknown {
		throw new Error("not implemented");
	}
}

/**
 * Value with explicit type information
 */
export class Typed {
	readonly type: string;
	readonly value: unknown;

	constructor(type: string, value: unknown) {
		this.type = type;
		this.value = value;
	}

	static uint8(value: number): Typed {
		throw new Error("not implemented");
	}

	static uint256(value: bigint): Typed {
		throw new Error("not implemented");
	}

	static address(value: Hex): Typed {
		throw new Error("not implemented");
	}

	static bytes(value: Uint8Array): Typed {
		throw new Error("not implemented");
	}

	static string(value: string): Typed {
		throw new Error("not implemented");
	}

	static bool(value: boolean): Typed {
		throw new Error("not implemented");
	}
}

/**
 * Indexed event parameter marker
 */
export class Indexed {
	readonly hash: Hex;

	constructor(hash: Hex) {
		this.hash = hash;
	}

	static isIndexed(value: unknown): value is Indexed {
		throw new Error("not implemented");
	}
}

/**
 * Contract interface for ABI operations
 */
export class Interface {
	readonly fragments: Fragment[];

	constructor(abi: string | Fragment[]) {
		throw new Error("not implemented");
	}

	/**
	 * Parse transaction data
	 */
	parseTransaction(data: { data: Hex; value?: bigint }): TransactionDescription {
		throw new Error("not implemented");
	}

	/**
	 * Parse event log
	 */
	parseLog(log: {
		topics: Hex[];
		data: Hex;
	}): LogDescription | null {
		throw new Error("not implemented");
	}

	/**
	 * Parse error data
	 */
	parseError(data: Hex): ErrorDescription | null {
		throw new Error("not implemented");
	}

	/**
	 * Parse call result
	 */
	parseCallResult(data: Hex): Result {
		throw new Error("not implemented");
	}

	/**
	 * Get function by name or selector
	 */
	getFunction(key: string): FunctionFragment {
		throw new Error("not implemented");
	}

	/**
	 * Get event by name or topic
	 */
	getEvent(key: string): EventFragment {
		throw new Error("not implemented");
	}

	/**
	 * Get error by name or selector
	 */
	getError(key: string): ErrorFragment {
		throw new Error("not implemented");
	}

	/**
	 * Check if function exists
	 */
	hasFunction(key: string): boolean {
		throw new Error("not implemented");
	}

	/**
	 * Check if event exists
	 */
	hasEvent(key: string): boolean {
		throw new Error("not implemented");
	}

	/**
	 * Iterate over functions
	 */
	forEachFunction(callback: (fragment: FunctionFragment) => void): void {
		throw new Error("not implemented");
	}

	/**
	 * Iterate over events
	 */
	forEachEvent(callback: (fragment: EventFragment) => void): void {
		throw new Error("not implemented");
	}

	/**
	 * Iterate over errors
	 */
	forEachError(callback: (fragment: ErrorFragment) => void): void {
		throw new Error("not implemented");
	}

	/**
	 * Check for result errors
	 */
	static checkResultErrors(result: Result): void {
		throw new Error("not implemented");
	}
}

/**
 * Encode bytes32 string
 */
export function encodeBytes32String(text: string): Hex {
	throw new Error("not implemented");
}

/**
 * Decode bytes32 string
 */
export function decodeBytes32String(data: Hex): string {
	throw new Error("not implemented");
}
