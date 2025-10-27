/**
 * Contract utilities
 * Event log parsing, error handling
 */

export type Hex = `0x${string}`;

/**
 * Parsed event log
 */
export class EventLog {
	readonly address: Hex;
	readonly topics: Hex[];
	readonly data: Hex;
	readonly name: string;
	readonly signature: string;
	readonly args: Record<string, unknown>;

	constructor(
		address: Hex,
		topics: Hex[],
		data: Hex,
		name: string,
		signature: string,
		args: Record<string, unknown>,
	) {
		this.address = address;
		this.topics = topics;
		this.data = data;
		this.name = name;
		this.signature = signature;
		this.args = args;
	}
}

/**
 * Undecoded event log (decode failure)
 */
export class UndecodedEventLog {
	readonly address: Hex;
	readonly topics: Hex[];
	readonly data: Hex;
	readonly error: Error;

	constructor(address: Hex, topics: Hex[], data: Hex, error: Error) {
		this.address = address;
		this.topics = topics;
		this.data = data;
		this.error = error;
	}
}

/**
 * Contract method metadata
 */
export interface BaseContractMethod {
	name: string;
	fragment: {
		type: string;
		name: string;
		inputs: unknown[];
		outputs: unknown[];
	};
}

/**
 * Contract event metadata
 */
export interface ContractEvent {
	name: string;
	fragment: {
		type: string;
		name: string;
		inputs: unknown[];
	};
}
