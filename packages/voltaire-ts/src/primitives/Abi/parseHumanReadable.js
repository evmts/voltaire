import { AbiParseError } from "./Errors.js";

/**
 * @typedef {{ type: string; name?: string; indexed?: boolean; components?: Param[] }} Param
 * @typedef {Map<string, string>} StructSources
 */

const ELEMENTARY =
	/^(?:address|bool|string|bytes(?:[1-9]|[12][0-9]|3[0-2])?|u?int(?:8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?|function)$/;
const IDENT = /^[a-zA-Z$_][a-zA-Z0-9$_]*$/;
/** Array suffixes; fixed sizes must be positive (`T[0]` is invalid Solidity). */
const ARRAY_SUFFIX = "(?:\\[(?:[1-9]\\d*)?\\])*";
const DATA_LOCATIONS = new Set(["memory", "calldata", "storage"]);
const MUTABILITY = new Set(["pure", "view", "nonpayable", "payable"]);
const VISIBILITY = new Set(["external", "public"]);

/**
 * @param {string} message
 * @param {string} value
 * @param {string} expected
 * @returns {never}
 */
function fail(message, value, expected) {
	throw new AbiParseError(message, { value, expected });
}

/**
 * Collapse whitespace and drop it around punctuation (keep it after `)`).
 * @param {string} s
 */
function normalize(s) {
	return s
		.replace(/\s+/g, " ")
		.replace(/\s*([(,;{}])\s*/g, "$1")
		.replace(/\s+\)/g, ")")
		.trim();
}

/**
 * Split on commas at paren depth 0.
 * @param {string} s
 * @param {string} source
 * @returns {string[]}
 */
function splitTopLevel(s, source) {
	/** @type {string[]} */
	const parts = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		if (c === "(") depth++;
		else if (c === ")") {
			depth--;
			if (depth < 0)
				fail(
					`Unbalanced parentheses in "${source}"`,
					source,
					"balanced parentheses",
				);
		} else if (c === "," && depth === 0) {
			parts.push(s.slice(start, i));
			start = i + 1;
		}
	}
	if (depth !== 0)
		fail(
			`Unbalanced parentheses in "${source}"`,
			source,
			"balanced parentheses",
		);
	const last = s.slice(start);
	if (parts.length > 0 || last.trim() !== "") parts.push(last);
	return parts.map((p) => p.trim());
}

/**
 * Index of the paren that closes the one at `open`.
 * @param {string} s
 * @param {number} open
 * @param {string} source
 */
function matchParen(s, open, source) {
	let depth = 0;
	for (let i = open; i < s.length; i++) {
		if (s[i] === "(") depth++;
		else if (s[i] === ")" && --depth === 0) return i;
	}
	return fail(
		`Unbalanced parentheses in "${source}"`,
		source,
		"balanced parentheses",
	);
}

/**
 * @param {string} type
 */
function canonicalElementary(type) {
	if (type === "uint") return "uint256";
	if (type === "int") return "int256";
	return type;
}

/**
 * Parse one parameter like `uint256 indexed amount` or `(address a, uint b)[] items`.
 * @param {string} raw
 * @param {{ structs: StructSources; resolved: Map<string, Param[]>; stack: Set<string>; source: string; allowIndexed: boolean }} ctx
 * @returns {Param}
 */
function parseParam(raw, ctx) {
	const s = raw.trim();
	if (s === "")
		fail(`Empty parameter in "${ctx.source}"`, ctx.source, "parameter");

	/** @type {Param} */
	let param;
	let rest;
	if (s.startsWith("(") || s.startsWith("tuple(")) {
		const open = s.indexOf("(");
		const close = matchParen(s, open, ctx.source);
		const components = parseParams(s.slice(open + 1, close), {
			...ctx,
			allowIndexed: false,
		});
		const after = s.slice(close + 1);
		const m = new RegExp(`^(${ARRAY_SUFFIX})(.*)$`).exec(after);
		const suffix = m?.[1] ?? "";
		rest = (m?.[2] ?? "").trim();
		if (rest !== "" && after[suffix.length] !== " ") {
			fail(
				`Invalid tuple parameter "${s}" in "${ctx.source}"`,
				ctx.source,
				"tuple followed by array suffix, modifiers, and name",
			);
		}
		param = { type: `tuple${suffix}`, components };
	} else {
		// `address payable` (with any array suffix) has the same ABI as `address`.
		const payable = new RegExp(`^address payable(${ARRAY_SUFFIX})(?= |$)`).exec(
			s,
		);
		const t = payable ? `address${payable[1]}${s.slice(payable[0].length)}` : s;
		const space = t.indexOf(" ");
		const typeText = space === -1 ? t : t.slice(0, space);
		rest = space === -1 ? "" : t.slice(space + 1);
		const m = new RegExp(`^([a-zA-Z$_][a-zA-Z0-9$_]*)(${ARRAY_SUFFIX})$`).exec(
			typeText,
		);
		if (!m)
			fail(
				`Invalid type "${typeText}" in "${ctx.source}"`,
				ctx.source,
				"Solidity type",
			);
		const base = /** @type {string} */ (m[1]);
		const suffix = m[2] ?? "";
		if (ELEMENTARY.test(base)) {
			param = { type: `${canonicalElementary(base)}${suffix}` };
		} else if (base === "tuple") {
			fail(
				`tuple requires components in "${ctx.source}"`,
				ctx.source,
				"tuple(...)",
			);
		} else if (ctx.structs.has(base)) {
			param = { type: `tuple${suffix}`, components: resolveStruct(base, ctx) };
		} else {
			fail(
				`Unknown type "${base}" in "${ctx.source}"`,
				ctx.source,
				"Solidity type or declared struct",
			);
		}
	}

	const words = rest === "" ? [] : rest.split(" ");
	/** @type {string | undefined} */
	let name;
	for (const word of words) {
		if (word === "indexed") {
			if (!ctx.allowIndexed)
				fail(
					`"indexed" is only valid on event parameters in "${ctx.source}"`,
					ctx.source,
					"event parameter",
				);
			param.indexed = true;
		} else if (DATA_LOCATIONS.has(word)) {
			// Data location does not change the ABI.
		} else if (name === undefined && IDENT.test(word)) {
			name = word;
		} else {
			fail(
				`Unexpected "${word}" in parameter "${s}" of "${ctx.source}"`,
				ctx.source,
				"parameter name or modifier",
			);
		}
	}
	if (name !== undefined) param.name = name;
	return param;
}

/**
 * @param {string} list
 * @param {{ structs: StructSources; resolved: Map<string, Param[]>; stack: Set<string>; source: string; allowIndexed: boolean }} ctx
 * @returns {Param[]}
 */
function parseParams(list, ctx) {
	return splitTopLevel(list, ctx.source).map((p) => parseParam(p, ctx));
}

/**
 * @param {string} name
 * @param {{ structs: StructSources; resolved: Map<string, Param[]>; stack: Set<string>; source: string; allowIndexed: boolean }} ctx
 * @returns {Param[]}
 */
function resolveStruct(name, ctx) {
	const cached = ctx.resolved.get(name);
	if (cached) return cached;
	if (ctx.stack.has(name)) {
		fail(
			`Circular struct reference "${name}"`,
			ctx.source,
			"acyclic struct definitions",
		);
	}
	const body = /** @type {string} */ (ctx.structs.get(name));
	ctx.stack.add(name);
	const fields = body
		.split(";")
		.map((f) => f.trim())
		.filter((f) => f !== "");
	if (fields.length === 0)
		fail(`Struct "${name}" has no fields`, ctx.source, "at least one field");
	const components = fields.map((f) => {
		const p = parseParam(f, {
			...ctx,
			allowIndexed: false,
			source: `struct ${name}`,
		});
		if (p.name === undefined)
			fail(
				`Struct "${name}" field "${f}" needs a name`,
				`struct ${name}`,
				"named field",
			);
		return p;
	});
	ctx.stack.delete(name);
	ctx.resolved.set(name, components);
	return components;
}

/**
 * Parse `name(params) modifiers...` into its parts.
 * @param {string} body - signature without the leading keyword
 * @param {string} source
 */
function splitHead(body, source) {
	const open = body.indexOf("(");
	if (open === -1) fail(`Missing "(" in "${source}"`, source, "name(params)");
	const name = body.slice(0, open).trim();
	const close = matchParen(body, open, source);
	return {
		name,
		params: body.slice(open + 1, close),
		tail: body.slice(close + 1).trim(),
	};
}

/**
 * Parse a single human-readable signature.
 * @param {string} source
 * @param {StructSources} structs
 * @param {Map<string, Param[]>} resolved
 * @returns {import('./Item/ItemType.js').ItemType}
 */
function parseSignature(source, structs, resolved) {
	const sig = normalize(source);
	const space = sig.search(/[ (]/);
	const keyword = space === -1 ? sig : sig.slice(0, space);
	const body = space === -1 ? "" : sig.slice(space).trim();
	/** @param {boolean} allowIndexed */
	const ctx = (allowIndexed) => ({
		structs,
		resolved,
		stack: new Set(),
		source,
		allowIndexed,
	});

	switch (keyword) {
		case "function": {
			const { name, params, tail } = splitHead(body, source);
			if (!IDENT.test(name))
				fail(`Invalid function name "${name}"`, source, "identifier");
			let stateMutability = "nonpayable";
			/** @type {Param[]} */
			let outputs = [];
			let rest = tail;
			const ret = rest.search(/(?:^| )returns ?\(/);
			if (ret !== -1) {
				const open = rest.indexOf("(", ret);
				const close = matchParen(rest, open, source);
				if (rest.slice(close + 1).trim() !== "") {
					fail(
						`Unexpected text after returns in "${source}"`,
						source,
						"returns (...) at the end",
					);
				}
				outputs = parseParams(rest.slice(open + 1, close), ctx(false));
				rest = rest.slice(0, ret).trim();
			}
			for (const word of rest === "" ? [] : rest.split(" ")) {
				if (MUTABILITY.has(word)) stateMutability = word;
				else if (!VISIBILITY.has(word)) {
					fail(
						`Unexpected modifier "${word}" in "${source}"`,
						source,
						"external, public, pure, view, payable, returns (...)",
					);
				}
			}
			return /** @type {*} */ ({
				type: "function",
				name,
				stateMutability,
				inputs: parseParams(params, ctx(false)),
				outputs,
			});
		}
		case "event": {
			const { name, params, tail } = splitHead(body, source);
			if (!IDENT.test(name))
				fail(`Invalid event name "${name}"`, source, "identifier");
			if (tail !== "" && tail !== "anonymous") {
				fail(
					`Unexpected "${tail}" in "${source}"`,
					source,
					"anonymous or nothing",
				);
			}
			/** @type {*} */
			const item = {
				type: "event",
				name,
				inputs: parseParams(params, ctx(true)),
			};
			if (tail === "anonymous") item.anonymous = true;
			return item;
		}
		case "error": {
			const { name, params, tail } = splitHead(body, source);
			if (!IDENT.test(name))
				fail(`Invalid error name "${name}"`, source, "identifier");
			if (tail !== "")
				fail(
					`Unexpected "${tail}" in "${source}"`,
					source,
					"nothing after parameters",
				);
			return /** @type {*} */ ({
				type: "error",
				name,
				inputs: parseParams(params, ctx(false)),
			});
		}
		case "constructor": {
			const { name, params, tail } = splitHead(body, source);
			if (name !== "")
				fail(
					`Constructor cannot have a name in "${source}"`,
					source,
					"constructor(params)",
				);
			let stateMutability = "nonpayable";
			for (const word of tail === "" ? [] : tail.split(" ")) {
				if (word === "payable") stateMutability = "payable";
				else if (word !== "public")
					fail(`Unexpected "${word}" in "${source}"`, source, "payable");
			}
			return /** @type {*} */ ({
				type: "constructor",
				stateMutability,
				inputs: parseParams(params, ctx(false)),
			});
		}
		case "fallback":
		case "receive": {
			const { name, params, tail } = splitHead(body, source);
			if (name !== "" || params.trim() !== "") {
				fail(
					`${keyword} takes no name or parameters in "${source}"`,
					source,
					`${keyword}()`,
				);
			}
			let stateMutability = "nonpayable";
			for (const word of tail === "" ? [] : tail.split(" ")) {
				if (word === "payable") stateMutability = "payable";
				else if (word !== "external")
					fail(
						`Unexpected "${word}" in "${source}"`,
						source,
						"external, payable",
					);
			}
			if (keyword === "receive") {
				if (stateMutability !== "payable") {
					fail(
						`receive must be payable in "${source}"`,
						source,
						"receive() external payable",
					);
				}
				return { type: "receive", stateMutability: "payable" };
			}
			return /** @type {*} */ ({ type: "fallback", stateMutability });
		}
		default:
			return fail(
				`Unknown signature kind "${keyword}" in "${source}"`,
				source,
				"function, event, error, constructor, fallback, receive, or struct",
			);
	}
}

/**
 * Parse human-readable Solidity ABI signatures into JSON ABI items.
 *
 * Supports `function`, `event`, `error`, `constructor`, `fallback`, `receive`,
 * and `struct` declarations (referenced by name from other signatures).
 * Parameters accept tuples (`(uint256 a, address b)` or `tuple(...)`), arrays
 * (`[]`, `[N]`, nested), `indexed`, data locations (`memory`, `calldata`,
 * `storage`, ignored), and `address payable`. `uint`/`int` normalize to
 * `uint256`/`int256`. Struct declarations produce no ABI item.
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.1.0
 * JSON ABI item objects may be mixed in; they pass through unchanged.
 *
 * @param {readonly (string | import('./Item/ItemType.js').ItemType)[]} signatures - Human-readable signatures and/or JSON ABI items
 * @returns {import('./Item/ItemType.js').ItemType[]} ABI items in input order (structs omitted)
 * @throws {AbiParseError} If a signature is malformed or references an unknown type
 * @example
 * ```javascript
 * import { parseHumanReadable } from './primitives/Abi/parseHumanReadable.js';
 * const items = parseHumanReadable([
 *   'function transfer(address to, uint256 amount) returns (bool)',
 *   'event Transfer(address indexed from, address indexed to, uint256 value)',
 * ]);
 * ```
 */
export function parseHumanReadable(signatures) {
	/** @type {StructSources} */
	const structs = new Map();
	for (const source of signatures) {
		if (typeof source !== "string") continue;
		const sig = normalize(source);
		if (!/^struct[ {]/.test(sig)) continue;
		const m = /^struct ?([a-zA-Z$_][a-zA-Z0-9$_]*)\{(.*)\}$/.exec(sig);
		if (!m)
			fail(
				`Invalid struct "${source}"`,
				source,
				"struct Name { type name; ... }",
			);
		const name = /** @type {string} */ (m[1]);
		if (ELEMENTARY.test(name) || name === "tuple") {
			fail(
				`Struct name "${name}" shadows a Solidity type`,
				source,
				"struct name",
			);
		}
		if (structs.has(name))
			fail(`Duplicate struct "${name}"`, source, "unique struct name");
		structs.set(name, /** @type {string} */ (m[2]));
	}

	/** @type {Map<string, Param[]>} */
	const resolved = new Map();
	// Validate every struct, even unreferenced ones.
	for (const name of structs.keys()) {
		resolveStruct(name, {
			structs,
			resolved,
			stack: new Set(),
			source: `struct ${name}`,
			allowIndexed: false,
		});
	}

	/** @type {import('./Item/ItemType.js').ItemType[]} */
	const items = [];
	for (const source of signatures) {
		if (typeof source !== "string") {
			if (
				source === null ||
				typeof source !== "object" ||
				!("type" in source)
			) {
				fail(
					"ABI entry must be a signature string or an ABI item object",
					source,
					"string or { type, ... }",
				);
			}
			items.push(source);
			continue;
		}
		if (/^struct[ {]/.test(normalize(source))) continue;
		items.push(parseSignature(source, structs, resolved));
	}
	return items;
}
