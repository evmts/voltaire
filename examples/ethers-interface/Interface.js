// @ts-check
/**
 * Interface class - ethers v6 compatible ABI abstraction
 * Uses Voltaire Abi primitive as underlying engine
 */

/** @import { AbiItem, InterfaceAbi, Log, TransactionLike } from "./EthersInterfaceTypes.js" */
/** @import { Parameter } from "@tevm/voltaire" */

import {
	ConstructorFragment,
	ErrorDescription,
	ErrorFragment,
	EventFragment,
	FallbackFragment,
	Fragment,
	FunctionFragment,
	Indexed,
	LogDescription,
	ParamType,
	TransactionDescription,
} from "./Fragment.js";

import {
	AmbiguousFragmentError,
	DecodingError,
	FragmentNotFoundError,
	SignatureMismatchError,
	getPanicReason,
} from "./errors.js";

import { Keccak256, Abi, Hex } from "@tevm/voltaire";
const { hashString, hash: keccak256 } = Keccak256;
const { decodeParameters, encodeParameters } = Abi;

/**
 * Built-in error definitions
 */
const BuiltinErrors = {
	"0x08c379a0": {
		signature: "Error(string)",
		name: "Error",
		inputs: [{ type: "string", name: "message" }],
	},
	"0x4e487b71": {
		signature: "Panic(uint256)",
		name: "Panic",
		inputs: [{ type: "uint256", name: "code" }],
	},
};

/**
 * Check if a string looks like a hex selector (0x + 8 hex chars for function, 0x + 64 for event)
 * @param {string} key
 * @returns {boolean}
 */
function isHexString(key) {
	return /^0x[0-9a-fA-F]+$/.test(key);
}

/**
 * Convert ParamType array to Parameter array for encoding
 * @param {readonly ParamType[]} paramTypes
 * @returns {Parameter[]}
 */
function toParameters(paramTypes) {
	return paramTypes.map((p) => ({
		type: /** @type {Parameter["type"]} */ (p.type),
		name: p.name,
		components: p.components ? toParameters(p.components) : undefined,
		indexed: p.indexed ?? undefined,
	}));
}

/**
 * Interface class for encoding/decoding Ethereum ABI
 */
export class Interface {
	/** @type {readonly Fragment[]} */
	fragments;

	/** @type {ConstructorFragment} */
	deploy;

	/** @type {FallbackFragment | null} */
	fallback;

	/** @type {boolean} */
	receive;

	/** @type {Map<string, FunctionFragment>} */
	#functions;

	/** @type {Map<string, EventFragment>} */
	#events;

	/** @type {Map<string, ErrorFragment>} */
	#errors;

	/**
	 * Create Interface from ABI
	 * @param {InterfaceAbi} fragments
	 */
	constructor(fragments) {
		/** @type {AbiItem[]} */
		let abi;

		if (typeof fragments === "string") {
			abi = JSON.parse(fragments);
		} else {
			abi = /** @type {AbiItem[]} */ ([...fragments]);
		}

		this.#functions = new Map();
		this.#events = new Map();
		this.#errors = new Map();

		/** @type {Fragment[]} */
		const frags = [];

		/** @type {ConstructorFragment | null} */
		let deploy = null;

		/** @type {FallbackFragment | null} */
		let fallback = null;

		let receive = false;

		for (const item of abi) {
			try {
				const fragment = Fragment.from(item);
				frags.push(fragment);

				switch (fragment.type) {
					case "constructor":
						if (!deploy) {
							deploy = /** @type {ConstructorFragment} */ (fragment);
						}
						break;

					case "fallback":
						fallback = /** @type {FallbackFragment} */ (fragment);
						receive = fallback.payable;
						break;

					case "receive":
						receive = true;
						break;

					case "function": {
						const fn = /** @type {FunctionFragment} */ (fragment);
						const sig = fn.format("sighash");
						if (!this.#functions.has(sig)) {
							this.#functions.set(sig, fn);
						}
						break;
					}

					case "event": {
						const ev = /** @type {EventFragment} */ (fragment);
						const sig = ev.format("sighash");
						if (!this.#events.has(sig)) {
							this.#events.set(sig, ev);
						}
						break;
					}

					case "error": {
						const err = /** @type {ErrorFragment} */ (fragment);
						const sig = err.format("sighash");
						if (!this.#errors.has(sig)) {
							this.#errors.set(sig, err);
						}
						break;
					}
				}
			} catch (error) {}
		}

		// Default constructor if none provided
		if (!deploy) {
			deploy = ConstructorFragment.from({ type: "constructor", inputs: [] });
		}

		this.fragments = Object.freeze(frags);
		this.deploy = deploy;
		this.fallback = fallback;
		this.receive = receive;
	}

	// ===========================================================================
	// Format Methods
	// ===========================================================================

	/**
	 * Get human-readable ABI
	 * @param {boolean} [minimal]
	 * @returns {string[]}
	 */
	format(minimal = false) {
		const format = minimal ? "minimal" : "full";
		return this.fragments.map((f) => {
			if (f.type === "constructor") {
				return /** @type {ConstructorFragment} */ (f).format(format);
			}
			if (f.type === "fallback" || f.type === "receive") {
				return /** @type {FallbackFragment} */ (f).format(format);
			}
			if (f.type === "function") {
				return /** @type {FunctionFragment} */ (f).format(format);
			}
			if (f.type === "event") {
				return /** @type {EventFragment} */ (f).format(format);
			}
			if (f.type === "error") {
				return /** @type {ErrorFragment} */ (f).format(format);
			}
			return "";
		});
	}

	/**
	 * Get JSON-encoded ABI
	 * @returns {string}
	 */
	formatJson() {
		const items = this.fragments
			.map((f) => {
				if (f.type === "constructor") {
					return JSON.parse(
						/** @type {ConstructorFragment} */ (f).format("json"),
					);
				}
				if (f.type === "fallback" || f.type === "receive") {
					return JSON.parse(/** @type {FallbackFragment} */ (f).format("json"));
				}
				if (f.type === "function") {
					return JSON.parse(/** @type {FunctionFragment} */ (f).format("json"));
				}
				if (f.type === "event") {
					return JSON.parse(/** @type {EventFragment} */ (f).format("json"));
				}
				if (f.type === "error") {
					return JSON.parse(/** @type {ErrorFragment} */ (f).format("json"));
				}
				return null;
			})
			.filter(Boolean);
		return JSON.stringify(items);
	}

	// ===========================================================================
	// Function Methods
	// ===========================================================================

	/**
	 * Get function by key (name, selector, or signature)
	 * @param {string} key
	 * @param {readonly unknown[]} [values]
	 * @returns {FunctionFragment | null}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ethers compatibility
	getFunction(key, values) {
		// By selector
		if (isHexString(key) && key.length === 10) {
			const selector = key.toLowerCase();
			for (const fragment of this.#functions.values()) {
				if (fragment.selector.toLowerCase() === selector) {
					return fragment;
				}
			}
			return null;
		}

		// By name (no parentheses)
		if (!key.includes("(")) {
			const matching = [];
			for (const [sig, fragment] of this.#functions) {
				if (sig.split("(")[0] === key) {
					matching.push(fragment);
				}
			}

			// Filter by argument count if values provided
			if (values && matching.length > 1) {
				const filtered = matching.filter(
					(f) =>
						f.inputs.length === values.length ||
						f.inputs.length === values.length - 1, // Allow overrides object
				);
				if (filtered.length === 1) return filtered[0];
				if (filtered.length > 1) {
					throw new AmbiguousFragmentError(
						key,
						filtered.map((f) => f.format()),
					);
				}
			}

			if (matching.length === 0) return null;
			if (matching.length === 1) return matching[0];

			throw new AmbiguousFragmentError(
				key,
				matching.map((f) => f.format()),
			);
		}

		// By full signature
		const fragment = FunctionFragment.from({
			type: "function",
			name: key.split("(")[0],
			inputs: [],
		});
		const normalized = fragment.format("sighash");
		// Try to find by parsing the signature
		for (const [sig, frag] of this.#functions) {
			if (sig === key || this.#normalizeSig(key) === sig) {
				return frag;
			}
		}

		return this.#functions.get(normalized) ?? null;
	}

	/**
	 * Normalize a signature string
	 * @param {string} sig
	 * @returns {string}
	 */
	#normalizeSig(sig) {
		// Remove spaces and "function " prefix
		return sig.replace(/^function\s+/, "").replace(/\s+/g, "");
	}

	/**
	 * Get function name by key
	 * @param {string} key
	 * @returns {string}
	 */
	getFunctionName(key) {
		const fragment = this.getFunction(key);
		if (!fragment) {
			throw new FragmentNotFoundError(key, "function");
		}
		return fragment.name;
	}

	/**
	 * Check if function exists
	 * @param {string} key
	 * @returns {boolean}
	 */
	hasFunction(key) {
		try {
			return this.getFunction(key) !== null;
		} catch {
			return false;
		}
	}

	/**
	 * Iterate over functions
	 * @param {(fragment: FunctionFragment, index: number) => void} callback
	 */
	forEachFunction(callback) {
		const names = Array.from(this.#functions.keys()).sort((a, b) =>
			a.localeCompare(b),
		);
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			const fragment = this.#functions.get(name);
			if (fragment) {
				callback(fragment, i);
			}
		}
	}

	// ===========================================================================
	// Event Methods
	// ===========================================================================

	/**
	 * Get event by key (name, topic hash, or signature)
	 * @param {string} key
	 * @param {readonly unknown[]} [values]
	 * @returns {EventFragment | null}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ethers compatibility
	getEvent(key, values) {
		// By topic hash
		if (isHexString(key) && key.length === 66) {
			const topic = key.toLowerCase();
			for (const fragment of this.#events.values()) {
				if (fragment.topicHash.toLowerCase() === topic) {
					return fragment;
				}
			}
			return null;
		}

		// By name (no parentheses)
		if (!key.includes("(")) {
			const matching = [];
			for (const [sig, fragment] of this.#events) {
				if (sig.split("(")[0] === key) {
					matching.push(fragment);
				}
			}

			if (matching.length === 0) return null;
			if (matching.length === 1) return matching[0];

			throw new AmbiguousFragmentError(
				key,
				matching.map((f) => f.format()),
			);
		}

		// By full signature
		for (const [sig, frag] of this.#events) {
			if (sig === key || this.#normalizeSig(key) === sig) {
				return frag;
			}
		}

		return null;
	}

	/**
	 * Get event name by key
	 * @param {string} key
	 * @returns {string}
	 */
	getEventName(key) {
		const fragment = this.getEvent(key);
		if (!fragment) {
			throw new FragmentNotFoundError(key, "event");
		}
		return fragment.name;
	}

	/**
	 * Check if event exists
	 * @param {string} key
	 * @returns {boolean}
	 */
	hasEvent(key) {
		try {
			return this.getEvent(key) !== null;
		} catch {
			return false;
		}
	}

	/**
	 * Iterate over events
	 * @param {(fragment: EventFragment, index: number) => void} callback
	 */
	forEachEvent(callback) {
		const names = Array.from(this.#events.keys()).sort((a, b) =>
			a.localeCompare(b),
		);
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			const fragment = this.#events.get(name);
			if (fragment) {
				callback(fragment, i);
			}
		}
	}

	// ===========================================================================
	// Error Methods
	// ===========================================================================

	/**
	 * Get error by key (name, selector, or signature)
	 * @param {string} key
	 * @param {readonly unknown[]} [values]
	 * @returns {ErrorFragment | null}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ethers compatibility
	getError(key, values) {
		// Check built-in errors first
		if (isHexString(key) && key.length === 10) {
			const selector = key.toLowerCase();
			const builtin =
				BuiltinErrors[/** @type {keyof typeof BuiltinErrors} */ (selector)];
			if (builtin) {
				return ErrorFragment.from({
					type: "error",
					name: builtin.name,
					inputs: builtin.inputs,
				});
			}

			for (const fragment of this.#errors.values()) {
				if (fragment.selector.toLowerCase() === selector) {
					return fragment;
				}
			}
			return null;
		}

		// Special built-in error names
		if (key === "Error") {
			return ErrorFragment.from({
				type: "error",
				name: "Error",
				inputs: [{ type: "string", name: "message" }],
			});
		}
		if (key === "Panic") {
			return ErrorFragment.from({
				type: "error",
				name: "Panic",
				inputs: [{ type: "uint256", name: "code" }],
			});
		}

		// By name (no parentheses)
		if (!key.includes("(")) {
			const matching = [];
			for (const [sig, fragment] of this.#errors) {
				if (sig.split("(")[0] === key) {
					matching.push(fragment);
				}
			}

			if (matching.length === 0) return null;
			if (matching.length === 1) return matching[0];

			throw new AmbiguousFragmentError(
				key,
				matching.map((f) => f.format()),
			);
		}

		// By full signature
		for (const [sig, frag] of this.#errors) {
			if (sig === key || this.#normalizeSig(key) === sig) {
				return frag;
			}
		}

		return null;
	}

	/**
	 * Iterate over errors
	 * @param {(fragment: ErrorFragment, index: number) => void} callback
	 */
	forEachError(callback) {
		const names = Array.from(this.#errors.keys()).sort((a, b) =>
			a.localeCompare(b),
		);
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			const fragment = this.#errors.get(name);
			if (fragment) {
				callback(fragment, i);
			}
		}
	}

	// ===========================================================================
	// Function Encoding/Decoding
	// ===========================================================================

	/**
	 * Encode function call data
	 * @param {string | FunctionFragment} fragment
	 * @param {readonly unknown[]} [values]
	 * @returns {string}
	 */
	encodeFunctionData(fragment, values = []) {
		const fn =
			typeof fragment === "string" ? this.getFunction(fragment) : fragment;
		if (!fn) {
			throw new FragmentNotFoundError(String(fragment), "function");
		}

		const params = toParameters(fn.inputs);
		const encoded = encodeParameters(params, /** @type {any} */ (values));
		const selector = Hex.toBytes(fn.selector);

		const result = new Uint8Array(selector.length + encoded.length);
		result.set(selector, 0);
		result.set(encoded, selector.length);

		return Hex.fromBytes(result);
	}

	/**
	 * Decode function call data (input params)
	 * @param {string | FunctionFragment} fragment
	 * @param {string} data
	 * @returns {readonly unknown[]}
	 */
	decodeFunctionData(fragment, data) {
		const fn =
			typeof fragment === "string" ? this.getFunction(fragment) : fragment;
		if (!fn) {
			throw new FragmentNotFoundError(String(fragment), "function");
		}

		const bytes = Hex.toBytes(data);
		const selector = Hex.fromBytes(bytes.slice(0, 4));

		if (selector.toLowerCase() !== fn.selector.toLowerCase()) {
			throw new SignatureMismatchError(fn.name, fn.selector, selector);
		}

		const params = toParameters(fn.inputs);
		return decodeParameters(params, bytes.slice(4));
	}

	/**
	 * Decode function result data (output params)
	 * @param {string | FunctionFragment} fragment
	 * @param {string} data
	 * @returns {readonly unknown[]}
	 */
	decodeFunctionResult(fragment, data) {
		const fn =
			typeof fragment === "string" ? this.getFunction(fragment) : fragment;
		if (!fn) {
			throw new FragmentNotFoundError(String(fragment), "function");
		}

		const bytes = Hex.toBytes(data);
		const params = toParameters(fn.outputs);
		return decodeParameters(params, bytes);
	}

	/**
	 * Encode function result data (for mocking)
	 * @param {string | FunctionFragment} fragment
	 * @param {readonly unknown[]} [values]
	 * @returns {string}
	 */
	encodeFunctionResult(fragment, values = []) {
		const fn =
			typeof fragment === "string" ? this.getFunction(fragment) : fragment;
		if (!fn) {
			throw new FragmentNotFoundError(String(fragment), "function");
		}

		const params = toParameters(fn.outputs);
		const encoded = encodeParameters(params, /** @type {any} */ (values));
		return Hex.fromBytes(encoded);
	}

	// ===========================================================================
	// Event Encoding/Decoding
	// ===========================================================================

	/**
	 * Encode event log
	 * @param {string | EventFragment} fragment
	 * @param {readonly unknown[]} values
	 * @returns {{ data: string; topics: string[] }}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ethers compatibility
	encodeEventLog(fragment, values) {
		const ev =
			typeof fragment === "string" ? this.getEvent(fragment) : fragment;
		if (!ev) {
			throw new FragmentNotFoundError(String(fragment), "event");
		}

		/** @type {string[]} */
		const topics = [];
		/** @type {Parameter[]} */
		const dataTypes = [];
		/** @type {unknown[]} */
		const dataValues = [];

		if (!ev.anonymous) {
			topics.push(ev.topicHash);
		}

		for (let i = 0; i < ev.inputs.length; i++) {
			const param = ev.inputs[i];
			const value = values[i];

			if (param.indexed) {
				// Indexed parameters go to topics
				if (param.type === "string") {
					const h = hashString(/** @type {string} */ (value));
					topics.push(Hex.fromBytes(h));
				} else if (param.type === "bytes") {
					const bytes =
						typeof value === "string"
							? Hex.toBytes(/** @type {any} */ (value))
							: /** @type {Uint8Array} */ (value);
					const hash = keccak256(bytes);
					topics.push(Hex.fromBytes(hash));
				} else {
					// Encode as 32-byte value
					const params = [{ type: param.type, name: "" }];
					const encoded = encodeParameters(/** @type {any} */ (params), [
						value,
					]);
					topics.push(Hex.fromBytes(encoded));
				}
			} else {
				// Non-indexed go to data
				dataTypes.push({
					type: /** @type {Parameter["type"]} */ (param.type),
					name: param.name,
					components: param.components
						? toParameters(param.components)
						: undefined,
				});
				dataValues.push(value);
			}
		}

		const data =
			dataTypes.length > 0
				? Hex.fromBytes(
						encodeParameters(dataTypes, /** @type {any} */ (dataValues)),
					)
				: "0x";

		return { data, topics };
	}

	/**
	 * Decode event log
	 * @param {string | EventFragment} fragment
	 * @param {string} data
	 * @param {readonly string[]} [topics]
	 * @returns {readonly unknown[]}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ethers compatibility
	decodeEventLog(fragment, data, topics = []) {
		const ev =
			typeof fragment === "string" ? this.getEvent(fragment) : fragment;
		if (!ev) {
			throw new FragmentNotFoundError(String(fragment), "event");
		}

		let topicIndex = 0;

		// Verify topic0 for non-anonymous events
		if (!ev.anonymous && topics.length > 0) {
			const topic0 = topics[0].toLowerCase();
			if (topic0 !== ev.topicHash.toLowerCase()) {
				throw new SignatureMismatchError(ev.name, ev.topicHash, topic0);
			}
			topicIndex = 1;
		}

		/** @type {unknown[]} */
		const result = [];
		/** @type {Parameter[]} */
		const nonIndexedParams = [];
		/** @type {number[]} */
		const nonIndexedIndices = [];

		for (let i = 0; i < ev.inputs.length; i++) {
			const param = ev.inputs[i];

			if (param.indexed) {
				if (topicIndex >= topics.length) {
					result.push(new Indexed(null));
				} else {
					const topic = topics[topicIndex++];
					// Dynamic types are hashed
					if (
						param.type === "string" ||
						param.type === "bytes" ||
						param.baseType === "tuple" ||
						param.baseType === "array"
					) {
						result.push(new Indexed(topic));
					} else {
						// Decode static type from topic
						const bytes = Hex.toBytes(topic);
						const params = [
							{ type: /** @type {Parameter["type"]} */ (param.type), name: "" },
						];
						const decoded = decodeParameters(params, bytes);
						result.push(decoded[0]);
					}
				}
			} else {
				nonIndexedParams.push({
					type: /** @type {Parameter["type"]} */ (param.type),
					name: param.name,
					components: param.components
						? toParameters(param.components)
						: undefined,
				});
				nonIndexedIndices.push(i);
				result.push(null); // Placeholder
			}
		}

		// Decode non-indexed data
		if (nonIndexedParams.length > 0 && data !== "0x") {
			const bytes = Hex.toBytes(data);
			const decoded = decodeParameters(nonIndexedParams, bytes);
			for (let i = 0; i < nonIndexedIndices.length; i++) {
				result[nonIndexedIndices[i]] = decoded[i];
			}
		}

		return result;
	}

	/**
	 * Encode filter topics
	 * @param {string | EventFragment} fragment
	 * @param {readonly unknown[]} values
	 * @returns {Array<string | null | Array<string | null>>}
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ethers compatibility
	encodeFilterTopics(fragment, values) {
		const ev =
			typeof fragment === "string" ? this.getEvent(fragment) : fragment;
		if (!ev) {
			throw new FragmentNotFoundError(String(fragment), "event");
		}

		/** @type {Array<string | null | Array<string | null>>} */
		const topics = [];

		if (!ev.anonymous) {
			topics.push(ev.topicHash);
		}

		for (let i = 0; i < values.length; i++) {
			const param = ev.inputs[i];
			const value = values[i];

			if (!param.indexed) {
				if (value != null) {
					throw new Error(`cannot filter non-indexed parameter: ${param.name}`);
				}
				continue;
			}

			if (value == null) {
				topics.push(null);
			} else if (Array.isArray(value)) {
				// Multiple possible values for this topic
				topics.push(value.map((v) => this.#encodeTopicValue(param, v)));
			} else {
				topics.push(this.#encodeTopicValue(param, value));
			}
		}

		// Trim trailing nulls
		while (topics.length > 0 && topics[topics.length - 1] === null) {
			topics.pop();
		}

		return topics;
	}

	/**
	 * Encode single topic value
	 * @param {ParamType} param
	 * @param {unknown} value
	 * @returns {string}
	 */
	#encodeTopicValue(param, value) {
		if (param.type === "string") {
			const h = hashString(/** @type {string} */ (value));
			return Hex.fromBytes(h);
		}
		if (param.type === "bytes") {
			const bytes =
				typeof value === "string"
					? Hex.toBytes(/** @type {any} */ (value))
					: /** @type {Uint8Array} */ (value);
			const hash = keccak256(bytes);
			return Hex.fromBytes(hash);
		}
		// Static types
		const params = [
			{ type: /** @type {Parameter["type"]} */ (param.type), name: "" },
		];
		const encoded = encodeParameters(/** @type {any} */ (params), [value]);
		return Hex.fromBytes(encoded);
	}

	// ===========================================================================
	// Error Encoding/Decoding
	// ===========================================================================

	/**
	 * Encode error result
	 * @param {string | ErrorFragment} fragment
	 * @param {readonly unknown[]} [values]
	 * @returns {string}
	 */
	encodeErrorResult(fragment, values = []) {
		const err =
			typeof fragment === "string" ? this.getError(fragment) : fragment;
		if (!err) {
			throw new FragmentNotFoundError(String(fragment), "error");
		}

		const params = toParameters(err.inputs);
		const encoded = encodeParameters(params, /** @type {any} */ (values));
		const selector = Hex.toBytes(err.selector);

		const result = new Uint8Array(selector.length + encoded.length);
		result.set(selector, 0);
		result.set(encoded, selector.length);

		return Hex.fromBytes(result);
	}

	/**
	 * Decode error result
	 * @param {string | ErrorFragment} fragment
	 * @param {string} data
	 * @returns {readonly unknown[]}
	 */
	decodeErrorResult(fragment, data) {
		const err =
			typeof fragment === "string" ? this.getError(fragment) : fragment;
		if (!err) {
			throw new FragmentNotFoundError(String(fragment), "error");
		}

		const bytes = Hex.toBytes(data);
		const selector = Hex.fromBytes(bytes.slice(0, 4));

		if (selector.toLowerCase() !== err.selector.toLowerCase()) {
			throw new SignatureMismatchError(err.name, err.selector, selector);
		}

		const params = toParameters(err.inputs);
		return decodeParameters(params, bytes.slice(4));
	}

	// ===========================================================================
	// Constructor Encoding
	// ===========================================================================

	/**
	 * Encode constructor arguments
	 * @param {readonly unknown[]} [values]
	 * @returns {string}
	 */
	encodeDeploy(values = []) {
		const params = toParameters(this.deploy.inputs);
		const encoded = encodeParameters(params, /** @type {any} */ (values));
		return Hex.fromBytes(encoded);
	}

	// ===========================================================================
	// Parsing Methods
	// ===========================================================================

	/**
	 * Parse transaction data
	 * @param {TransactionLike} tx
	 * @returns {TransactionDescription | null}
	 */
	parseTransaction(tx) {
		const bytes = Hex.toBytes(tx.data);
		if (bytes.length < 4) return null;

		const selector = Hex.fromBytes(bytes.slice(0, 4));
		const fragment = this.getFunction(selector);
		if (!fragment) return null;

		const params = toParameters(fragment.inputs);
		const args = decodeParameters(params, bytes.slice(4));

		const value =
			tx.value != null
				? typeof tx.value === "bigint"
					? tx.value
					: BigInt(tx.value)
				: 0n;

		return new TransactionDescription(fragment, selector, args, value);
	}

	/**
	 * Parse log
	 * @param {Log} log
	 * @returns {LogDescription | null}
	 */
	parseLog(log) {
		if (log.topics.length === 0) return null;

		const topic0 = log.topics[0];
		const fragment = this.getEvent(topic0);
		if (!fragment || fragment.anonymous) return null;

		const args = this.decodeEventLog(fragment, log.data, log.topics);
		return new LogDescription(fragment, topic0, args);
	}

	/**
	 * Parse error data
	 * @param {string} data
	 * @returns {ErrorDescription | null}
	 */
	parseError(data) {
		const bytes = Hex.toBytes(data);
		if (bytes.length < 4) return null;

		const selector = Hex.fromBytes(bytes.slice(0, 4));
		const fragment = this.getError(selector);
		if (!fragment) return null;

		const params = toParameters(fragment.inputs);
		const args = decodeParameters(params, bytes.slice(4));

		return new ErrorDescription(fragment, selector, args);
	}

	// ===========================================================================
	// Static Factory
	// ===========================================================================

	/**
	 * Create Interface from various inputs
	 * @param {Interface | InterfaceAbi} value
	 * @returns {Interface}
	 */
	static from(value) {
		if (value instanceof Interface) {
			return value;
		}

		if (typeof value === "string") {
			return new Interface(JSON.parse(value));
		}

		// Check if it has formatJson method (another Interface instance)
		if (
			typeof value === "object" &&
			value !== null &&
			"formatJson" in value &&
			typeof value.formatJson === "function"
		) {
			return new Interface(/** @type {Interface} */ (value).formatJson());
		}

		return new Interface(value);
	}
}
