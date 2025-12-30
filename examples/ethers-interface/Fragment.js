// @ts-check
/**
 * Fragment classes for ethers Interface abstraction
 * Wraps Voltaire ABI primitives with ethers-compatible API
 */

/** @import { Parameter } from "../../src/primitives/Abi/Parameter.js" */

import { hash, hashString } from "../../src/crypto/Keccak256/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import { InvalidFragmentError } from "./errors.js";

/**
 * Format a parameter type for signature
 * @param {Parameter} param
 * @returns {string}
 */
function formatParamType(param) {
	if (param.type === "tuple" && param.components) {
		const inner = param.components.map(formatParamType).join(",");
		return `(${inner})`;
	}
	return param.type;
}

/**
 * Format parameter for different output formats
 * @param {Parameter} param
 * @param {"sighash" | "minimal" | "full" | "json"} format
 * @returns {string}
 */
function formatParam(param, format) {
	if (format === "json") {
		/** @type {Record<string, unknown>} */
		const result = { type: param.type, name: param.name || "" };
		if (param.indexed !== undefined) {
			result.indexed = param.indexed;
		}
		if (param.components) {
			result.components = param.components.map((c) =>
				JSON.parse(formatParam(c, "json")),
			);
		}
		return JSON.stringify(result);
	}

	let result = formatParamType(param);

	if (format !== "sighash") {
		if (param.indexed) {
			result += " indexed";
		}
		if (format === "full" && param.name) {
			result += ` ${param.name}`;
		}
	}

	return result;
}

/**
 * Join parameters for formatting
 * @param {readonly Parameter[]} params
 * @param {"sighash" | "minimal" | "full" | "json"} format
 * @returns {string}
 */
function joinParams(params, format) {
	const sep = format === "full" ? ", " : ",";
	return `(${params.map((p) => formatParam(p, format)).join(sep)})`;
}

/**
 * Compute function selector (4 bytes)
 * @param {string} signature
 * @returns {string}
 */
function computeSelector(signature) {
	const h = hashString(signature);
	return Hex.fromBytes(h.slice(0, 4));
}

/**
 * Compute event topic hash (32 bytes)
 * @param {string} signature
 * @returns {string}
 */
function computeTopicHash(signature) {
	const h = hashString(signature);
	return Hex.fromBytes(h);
}

// =============================================================================
// ParamType
// =============================================================================

/**
 * Represents a parameter type in the ABI
 */
export class ParamType {
	/** @type {string} */
	name;
	/** @type {string} */
	type;
	/** @type {string} */
	baseType;
	/** @type {boolean | null} */
	indexed;
	/** @type {readonly ParamType[] | null} */
	components;
	/** @type {number | null} */
	arrayLength;
	/** @type {ParamType | null} */
	arrayChildren;

	/**
	 * @param {string} name
	 * @param {string} type
	 * @param {string} baseType
	 * @param {boolean | null} indexed
	 * @param {readonly ParamType[] | null} components
	 * @param {number | null} arrayLength
	 * @param {ParamType | null} arrayChildren
	 */
	constructor(
		name,
		type,
		baseType,
		indexed,
		components,
		arrayLength,
		arrayChildren,
	) {
		this.name = name;
		this.type = type;
		this.baseType = baseType;
		this.indexed = indexed;
		this.components = components ? Object.freeze(components.slice()) : null;
		this.arrayLength = arrayLength;
		this.arrayChildren = arrayChildren;
		Object.freeze(this);
	}

	/**
	 * Format as JSON representation
	 * @returns {string}
	 */
	#formatAsJson() {
		/** @type {Record<string, unknown>} */
		const result = { type: this.type, name: this.name || "" };
		if (this.indexed !== null) {
			result.indexed = this.indexed;
		}
		if (this.components) {
			result.components = this.components.map((c) =>
				JSON.parse(c.format("json")),
			);
		}
		return JSON.stringify(result);
	}

	/**
	 * Format base type (array, tuple, or simple)
	 * @param {"sighash" | "minimal" | "full"} format
	 * @returns {string}
	 */
	#formatBaseType(format) {
		if (this.isArray()) {
			const children = this.arrayChildren?.format(format) ?? "";
			const length = this.arrayLength === -1 ? "" : String(this.arrayLength);
			return `${children}[${length}]`;
		}
		if (this.isTuple()) {
			const sep = format === "full" ? ", " : ",";
			const inner =
				this.components?.map((c) => c.format(format)).join(sep) ?? "";
			return `(${inner})`;
		}
		return this.type;
	}

	/**
	 * Format suffix (indexed, name)
	 * @param {"sighash" | "minimal" | "full"} format
	 * @returns {string}
	 */
	#formatSuffix(format) {
		let suffix = "";
		if (format !== "sighash" && this.indexed === true) {
			suffix += " indexed";
		}
		if (format === "full" && this.name) {
			suffix += ` ${this.name}`;
		}
		return suffix;
	}

	/**
	 * Format the parameter type
	 * @param {"sighash" | "minimal" | "full" | "json"} [format]
	 * @returns {string}
	 */
	format(format = "sighash") {
		if (format === "json") {
			return this.#formatAsJson();
		}
		return this.#formatBaseType(format) + this.#formatSuffix(format);
	}

	/** @returns {boolean} */
	isArray() {
		return this.baseType === "array";
	}

	/** @returns {boolean} */
	isTuple() {
		return this.baseType === "tuple";
	}

	/** @returns {boolean} */
	isIndexable() {
		return this.indexed !== null;
	}

	/**
	 * Create ParamType for dynamic array type
	 * @param {string} name
	 * @param {string} type
	 * @param {boolean | null} indexed
	 * @param {Parameter["components"]} components
	 * @returns {ParamType}
	 */
	static #fromDynamicArray(name, type, indexed, components) {
		const elementType = type.slice(0, -2);
		const arrayChildren = ParamType.from(
			{ type: elementType, name: "", components },
			false,
		);
		return new ParamType(name, type, "array", indexed, null, -1, arrayChildren);
	}

	/**
	 * Create ParamType for fixed array type
	 * @param {string} name
	 * @param {string} type
	 * @param {boolean | null} indexed
	 * @param {RegExpMatchArray} match
	 * @param {Parameter["components"]} components
	 * @returns {ParamType}
	 */
	static #fromFixedArray(name, type, indexed, match, components) {
		const elementType = match[1];
		const arrayLength = Number.parseInt(match[2], 10);
		const arrayChildren = ParamType.from(
			{ type: elementType, name: "", components },
			false,
		);
		return new ParamType(
			name,
			type,
			"array",
			indexed,
			null,
			arrayLength,
			arrayChildren,
		);
	}

	/**
	 * Create ParamType for tuple type
	 * @param {string} name
	 * @param {string} type
	 * @param {boolean | null} indexed
	 * @param {Parameter["components"]} components
	 * @returns {ParamType}
	 */
	static #fromTuple(name, type, indexed, components) {
		const parsedComponents = components.map((c) => ParamType.from(c, false));
		return new ParamType(
			name,
			type,
			"tuple",
			indexed,
			parsedComponents,
			null,
			null,
		);
	}

	/**
	 * Create ParamType from various inputs
	 * @param {Parameter | string | ParamType} obj
	 * @param {boolean} [allowIndexed]
	 * @returns {ParamType}
	 */
	static from(obj, allowIndexed = false) {
		if (obj instanceof ParamType) {
			return obj;
		}

		if (typeof obj === "string") {
			return ParamType.from({ type: obj, name: "" }, allowIndexed);
		}

		const param = /** @type {Parameter} */ (obj);
		const type = param.type;
		const name = param.name || "";
		const indexed = allowIndexed && param.indexed ? true : null;

		// Check for dynamic array
		if (type.endsWith("[]")) {
			return ParamType.#fromDynamicArray(name, type, indexed, param.components);
		}

		// Check for fixed array
		const fixedMatch = type.match(/^(.+)\[(\d+)\]$/);
		if (fixedMatch) {
			return ParamType.#fromFixedArray(
				name,
				type,
				indexed,
				fixedMatch,
				param.components,
			);
		}

		// Check for tuple
		if (type === "tuple" && param.components) {
			return ParamType.#fromTuple(name, type, indexed, param.components);
		}

		// Basic type
		return new ParamType(name, type, type, indexed, null, null, null);
	}

	/**
	 * Type guard
	 * @param {unknown} value
	 * @returns {value is ParamType}
	 */
	static isParamType(value) {
		return value instanceof ParamType;
	}
}

// =============================================================================
// Fragment Classes
// =============================================================================

/**
 * Base fragment class
 */
export class Fragment {
	/** @type {"constructor" | "function" | "event" | "error" | "fallback" | "receive"} */
	type;
	/** @type {readonly ParamType[]} */
	inputs;

	/**
	 * @param {"constructor" | "function" | "event" | "error" | "fallback" | "receive"} type
	 * @param {readonly ParamType[]} inputs
	 */
	constructor(type, inputs) {
		this.type = type;
		this.inputs = Object.freeze(inputs.slice());
	}

	/**
	 * Create Fragment from ABI item
	 * @param {unknown} obj
	 * @returns {Fragment}
	 */
	static from(obj) {
		if (obj instanceof Fragment) return obj;

		const item = /** @type {Record<string, unknown>} */ (obj);
		const type = item.type;

		switch (type) {
			case "constructor":
				return ConstructorFragment.from(obj);
			case "function":
				return FunctionFragment.from(obj);
			case "event":
				return EventFragment.from(obj);
			case "error":
				return ErrorFragment.from(obj);
			case "fallback":
			case "receive":
				return FallbackFragment.from(obj);
			default:
				throw new InvalidFragmentError(
					`unsupported fragment type: ${type}`,
					obj,
				);
		}
	}

	/** @param {unknown} value */
	static isConstructor(value) {
		return value instanceof ConstructorFragment;
	}
	/** @param {unknown} value */
	static isFunction(value) {
		return value instanceof FunctionFragment;
	}
	/** @param {unknown} value */
	static isEvent(value) {
		return value instanceof EventFragment;
	}
	/** @param {unknown} value */
	static isError(value) {
		return value instanceof ErrorFragment;
	}
}

/**
 * Named fragment (has name property)
 */
export class NamedFragment extends Fragment {
	/** @type {string} */
	name;

	/**
	 * @param {"function" | "event" | "error"} type
	 * @param {string} name
	 * @param {readonly ParamType[]} inputs
	 */
	constructor(type, name, inputs) {
		super(type, inputs);
		this.name = name;
	}
}

/**
 * Function fragment
 */
export class FunctionFragment extends NamedFragment {
	/** @type {boolean} */
	constant;
	/** @type {readonly ParamType[]} */
	outputs;
	/** @type {"pure" | "view" | "nonpayable" | "payable"} */
	stateMutability;
	/** @type {boolean} */
	payable;
	/** @type {bigint | null} */
	gas;
	/** @type {string} */
	selector;

	/**
	 * @param {string} name
	 * @param {"pure" | "view" | "nonpayable" | "payable"} stateMutability
	 * @param {readonly ParamType[]} inputs
	 * @param {readonly ParamType[]} outputs
	 * @param {bigint | null} gas
	 */
	constructor(name, stateMutability, inputs, outputs, gas) {
		super("function", name, inputs);
		this.outputs = Object.freeze(outputs.slice());
		this.stateMutability = stateMutability;
		this.constant = stateMutability === "view" || stateMutability === "pure";
		this.payable = stateMutability === "payable";
		this.gas = gas;
		this.selector = computeSelector(this.format("sighash"));
		Object.freeze(this);
	}

	/**
	 * Format function signature
	 * @param {"sighash" | "minimal" | "full" | "json"} [format]
	 * @returns {string}
	 */
	format(format = "sighash") {
		if (format === "json") {
			return JSON.stringify({
				type: "function",
				name: this.name,
				constant: this.constant,
				stateMutability:
					this.stateMutability !== "nonpayable"
						? this.stateMutability
						: undefined,
				payable: this.payable,
				gas: this.gas !== null ? this.gas.toString() : undefined,
				inputs: this.inputs.map((i) => JSON.parse(i.format("json"))),
				outputs: this.outputs.map((o) => JSON.parse(o.format("json"))),
			});
		}

		const params = this.inputs
			.map((p) => p.format(format))
			.join(format === "full" ? ", " : ",");
		let result = "";

		if (format !== "sighash") {
			result += "function ";
		}

		result += `${this.name}(${params})`;

		if (format !== "sighash") {
			if (this.stateMutability !== "nonpayable") {
				result += ` ${this.stateMutability}`;
			}
			if (this.outputs.length > 0) {
				const outs = this.outputs
					.map((p) => p.format(format))
					.join(format === "full" ? ", " : ",");
				result += ` returns (${outs})`;
			}
		}

		return result;
	}

	/**
	 * Create FunctionFragment from ABI item
	 * @param {unknown} obj
	 * @returns {FunctionFragment}
	 */
	static from(obj) {
		if (obj instanceof FunctionFragment) return obj;

		const item = /** @type {Record<string, unknown>} */ (obj);
		const name = /** @type {string} */ (item.name);
		const inputs = /** @type {Parameter[]} */ (item.inputs || []).map((p) =>
			ParamType.from(p),
		);
		const outputs = /** @type {Parameter[]} */ (item.outputs || []).map((p) =>
			ParamType.from(p),
		);

		// Determine state mutability
		let stateMutability =
			/** @type {"pure" | "view" | "nonpayable" | "payable"} */ (
				item.stateMutability ?? "nonpayable"
			);
		if (!item.stateMutability) {
			if (item.constant === true) {
				stateMutability = "view";
			} else if (item.payable === true) {
				stateMutability = "payable";
			}
		}

		const gas = item.gas
			? BigInt(/** @type {string | number} */ (item.gas))
			: null;

		return new FunctionFragment(name, stateMutability, inputs, outputs, gas);
	}

	/**
	 * Compute selector for function
	 * @param {string} name
	 * @param {readonly (Parameter | string)[]} [params]
	 * @returns {string}
	 */
	static getSelector(name, params = []) {
		const inputs = params.map((p) =>
			typeof p === "string" ? p : formatParamType(p),
		);
		const signature = `${name}(${inputs.join(",")})`;
		return computeSelector(signature);
	}

	/**
	 * @param {unknown} value
	 * @returns {value is FunctionFragment}
	 */
	static isFragment(value) {
		return value instanceof FunctionFragment;
	}
}

/**
 * Event fragment
 */
export class EventFragment extends NamedFragment {
	/** @type {boolean} */
	anonymous;
	/** @type {string} */
	topicHash;

	/**
	 * @param {string} name
	 * @param {readonly ParamType[]} inputs
	 * @param {boolean} anonymous
	 */
	constructor(name, inputs, anonymous) {
		super("event", name, inputs);
		this.anonymous = anonymous;
		this.topicHash = computeTopicHash(this.format("sighash"));
		Object.freeze(this);
	}

	/**
	 * Format event signature
	 * @param {"sighash" | "minimal" | "full" | "json"} [format]
	 * @returns {string}
	 */
	format(format = "sighash") {
		if (format === "json") {
			return JSON.stringify({
				type: "event",
				anonymous: this.anonymous,
				name: this.name,
				inputs: this.inputs.map((i) => JSON.parse(i.format("json"))),
			});
		}

		const params = this.inputs
			.map((p) => p.format(format))
			.join(format === "full" ? ", " : ",");
		let result = "";

		if (format !== "sighash") {
			result += "event ";
		}

		result += `${this.name}(${params})`;

		if (format !== "sighash" && this.anonymous) {
			result += " anonymous";
		}

		return result;
	}

	/**
	 * Create EventFragment from ABI item
	 * @param {unknown} obj
	 * @returns {EventFragment}
	 */
	static from(obj) {
		if (obj instanceof EventFragment) return obj;

		const item = /** @type {Record<string, unknown>} */ (obj);
		const name = /** @type {string} */ (item.name);
		const inputs = /** @type {Parameter[]} */ (item.inputs || []).map((p) =>
			ParamType.from(p, true),
		);
		const anonymous = /** @type {boolean} */ (item.anonymous ?? false);

		return new EventFragment(name, inputs, anonymous);
	}

	/**
	 * Compute topic hash for event
	 * @param {string} name
	 * @param {readonly (Parameter | string)[]} [params]
	 * @returns {string}
	 */
	static getTopicHash(name, params = []) {
		const inputs = params.map((p) =>
			typeof p === "string" ? p : formatParamType(p),
		);
		const signature = `${name}(${inputs.join(",")})`;
		return computeTopicHash(signature);
	}

	/**
	 * @param {unknown} value
	 * @returns {value is EventFragment}
	 */
	static isFragment(value) {
		return value instanceof EventFragment;
	}
}

/**
 * Error fragment
 */
export class ErrorFragment extends NamedFragment {
	/** @type {string} */
	selector;

	/**
	 * @param {string} name
	 * @param {readonly ParamType[]} inputs
	 */
	constructor(name, inputs) {
		super("error", name, inputs);
		this.selector = computeSelector(this.format("sighash"));
		Object.freeze(this);
	}

	/**
	 * Format error signature
	 * @param {"sighash" | "minimal" | "full" | "json"} [format]
	 * @returns {string}
	 */
	format(format = "sighash") {
		if (format === "json") {
			return JSON.stringify({
				type: "error",
				name: this.name,
				inputs: this.inputs.map((i) => JSON.parse(i.format("json"))),
			});
		}

		const params = this.inputs
			.map((p) => p.format(format))
			.join(format === "full" ? ", " : ",");
		let result = "";

		if (format !== "sighash") {
			result += "error ";
		}

		result += `${this.name}(${params})`;

		return result;
	}

	/**
	 * Create ErrorFragment from ABI item
	 * @param {unknown} obj
	 * @returns {ErrorFragment}
	 */
	static from(obj) {
		if (obj instanceof ErrorFragment) return obj;

		// Handle human-readable format
		if (typeof obj === "string") {
			// Parse "error Name(type1,type2)" format
			const match = obj.match(/^(?:error\s+)?(\w+)\((.*)\)$/);
			if (match) {
				const name = match[1];
				const paramsStr = match[2];
				const inputs = paramsStr
					? paramsStr
							.split(",")
							.map((t) => ParamType.from({ type: t.trim(), name: "" }))
					: [];
				return new ErrorFragment(name, inputs);
			}
			throw new InvalidFragmentError(`invalid error fragment: ${obj}`, obj);
		}

		const item = /** @type {Record<string, unknown>} */ (obj);
		const name = /** @type {string} */ (item.name);
		const inputs = /** @type {Parameter[]} */ (item.inputs || []).map((p) =>
			ParamType.from(p),
		);

		return new ErrorFragment(name, inputs);
	}

	/**
	 * @param {unknown} value
	 * @returns {value is ErrorFragment}
	 */
	static isFragment(value) {
		return value instanceof ErrorFragment;
	}
}

/**
 * Constructor fragment
 */
export class ConstructorFragment extends Fragment {
	/** @type {boolean} */
	payable;
	/** @type {bigint | null} */
	gas;

	/**
	 * @param {readonly ParamType[]} inputs
	 * @param {boolean} payable
	 * @param {bigint | null} gas
	 */
	constructor(inputs, payable, gas) {
		super("constructor", inputs);
		this.payable = payable;
		this.gas = gas;
		Object.freeze(this);
	}

	/**
	 * Format constructor
	 * @param {"sighash" | "minimal" | "full" | "json"} [format]
	 * @returns {string}
	 */
	format(format = "full") {
		if (format === "sighash") {
			throw new Error("cannot format constructor for sighash");
		}

		if (format === "json") {
			return JSON.stringify({
				type: "constructor",
				stateMutability: this.payable ? "payable" : "nonpayable",
				payable: this.payable,
				gas: this.gas !== null ? this.gas.toString() : undefined,
				inputs: this.inputs.map((i) => JSON.parse(i.format("json"))),
			});
		}

		const params = this.inputs
			.map((p) => p.format(format))
			.join(format === "full" ? ", " : ",");
		let result = `constructor(${params})`;

		if (this.payable) {
			result += " payable";
		}

		return result;
	}

	/**
	 * Create ConstructorFragment from ABI item
	 * @param {unknown} obj
	 * @returns {ConstructorFragment}
	 */
	static from(obj) {
		if (obj instanceof ConstructorFragment) return obj;

		// Handle human-readable format
		if (typeof obj === "string") {
			// Parse "constructor(type1,type2)" format
			const match = obj.match(/^constructor\((.*)\)(?:\s+payable)?$/);
			if (match) {
				const paramsStr = match[1];
				const inputs = paramsStr
					? paramsStr
							.split(",")
							.map((t) => ParamType.from({ type: t.trim(), name: "" }))
					: [];
				const payable = obj.includes("payable");
				return new ConstructorFragment(inputs, payable, null);
			}
			throw new InvalidFragmentError(
				`invalid constructor fragment: ${obj}`,
				obj,
			);
		}

		const item = /** @type {Record<string, unknown>} */ (obj);
		const inputs = /** @type {Parameter[]} */ (item.inputs || []).map((p) =>
			ParamType.from(p),
		);
		const payable = item.stateMutability === "payable" || item.payable === true;
		const gas = item.gas
			? BigInt(/** @type {string | number} */ (item.gas))
			: null;

		return new ConstructorFragment(inputs, payable, gas);
	}

	/**
	 * @param {unknown} value
	 * @returns {value is ConstructorFragment}
	 */
	static isFragment(value) {
		return value instanceof ConstructorFragment;
	}
}

/**
 * Fallback/Receive fragment
 */
export class FallbackFragment extends Fragment {
	/** @type {boolean} */
	payable;

	/**
	 * @param {readonly ParamType[]} inputs
	 * @param {boolean} payable
	 */
	constructor(inputs, payable) {
		super(inputs.length === 0 ? "receive" : "fallback", inputs);
		this.payable = payable;
		Object.freeze(this);
	}

	/**
	 * Format fallback/receive
	 * @param {"sighash" | "minimal" | "full" | "json"} [format]
	 * @returns {string}
	 */
	format(format = "full") {
		const type = this.inputs.length === 0 ? "receive" : "fallback";

		if (format === "json") {
			return JSON.stringify({
				type,
				stateMutability: this.payable ? "payable" : "nonpayable",
			});
		}

		return `${type}()${this.payable ? " payable" : ""}`;
	}

	/**
	 * Create FallbackFragment from ABI item
	 * @param {unknown} obj
	 * @returns {FallbackFragment}
	 */
	static from(obj) {
		if (obj instanceof FallbackFragment) return obj;

		const item = /** @type {Record<string, unknown>} */ (obj);
		const type = item.type;

		if (type === "receive") {
			return new FallbackFragment([], true);
		}

		// Fallback
		const inputs = [ParamType.from({ type: "bytes", name: "" })];
		const payable = item.stateMutability === "payable";
		return new FallbackFragment(inputs, payable);
	}

	/**
	 * @param {unknown} value
	 * @returns {value is FallbackFragment}
	 */
	static isFragment(value) {
		return value instanceof FallbackFragment;
	}
}

// =============================================================================
// Description Classes
// =============================================================================

/**
 * Result of parsing a log
 */
export class LogDescription {
	/** @type {EventFragment} */
	fragment;
	/** @type {string} */
	name;
	/** @type {string} */
	signature;
	/** @type {string} */
	topic;
	/** @type {readonly unknown[]} */
	args;

	/**
	 * @param {EventFragment} fragment
	 * @param {string} topic
	 * @param {readonly unknown[]} args
	 */
	constructor(fragment, topic, args) {
		this.fragment = fragment;
		this.name = fragment.name;
		this.signature = fragment.format();
		this.topic = topic;
		this.args = args;
		Object.freeze(this);
	}
}

/**
 * Result of parsing a transaction
 */
export class TransactionDescription {
	/** @type {FunctionFragment} */
	fragment;
	/** @type {string} */
	name;
	/** @type {readonly unknown[]} */
	args;
	/** @type {string} */
	signature;
	/** @type {string} */
	selector;
	/** @type {bigint} */
	value;

	/**
	 * @param {FunctionFragment} fragment
	 * @param {string} selector
	 * @param {readonly unknown[]} args
	 * @param {bigint} value
	 */
	constructor(fragment, selector, args, value) {
		this.fragment = fragment;
		this.name = fragment.name;
		this.args = args;
		this.signature = fragment.format();
		this.selector = selector;
		this.value = value;
		Object.freeze(this);
	}
}

/**
 * Result of parsing an error
 */
export class ErrorDescription {
	/** @type {ErrorFragment} */
	fragment;
	/** @type {string} */
	name;
	/** @type {readonly unknown[]} */
	args;
	/** @type {string} */
	signature;
	/** @type {string} */
	selector;

	/**
	 * @param {ErrorFragment} fragment
	 * @param {string} selector
	 * @param {readonly unknown[]} args
	 */
	constructor(fragment, selector, args) {
		this.fragment = fragment;
		this.name = fragment.name;
		this.args = args;
		this.signature = fragment.format();
		this.selector = selector;
		Object.freeze(this);
	}
}

/**
 * Represents an indexed value that was hashed
 */
export class Indexed {
	/** @type {string | null} */
	hash;
	/** @type {true} */
	_isIndexed;

	/**
	 * @param {string | null} hash
	 */
	constructor(hash) {
		this.hash = hash;
		this._isIndexed = true;
		Object.freeze(this);
	}

	/**
	 * @param {unknown} value
	 * @returns {value is Indexed}
	 */
	static isIndexed(value) {
		return !!(value && /** @type {Indexed} */ (value)._isIndexed);
	}
}
