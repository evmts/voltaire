import * as BlockHash from "../BlockHash/index.js";
import { InvalidFormatError } from "../errors/ValidationError.js";
import * as NetworkId from "../NetworkId/index.js";
import * as PeerId from "../PeerId/index.js";
import * as Uint from "../Uint/index.js";

/**
 * Create NodeInfo from RPC response object
 *
 * @param {any} value - Node info object from admin_nodeInfo
 * @returns {import('./NodeInfoType.js').NodeInfoType} Node information
 * @throws {InvalidFormatError} If value is not a valid node info object
 *
 * @example
 * ```javascript
 * import * as NodeInfo from './primitives/NodeInfo/index.js';
 * const nodeInfo = NodeInfo.from(rpcResponse);
 * console.log(nodeInfo.name);     // "Geth/v1.10.26-stable"
 * console.log(nodeInfo.protocols.eth?.network); // NetworkId
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation requires checking multiple fields
export function from(value) {
	if (!value || typeof value !== "object") {
		throw new InvalidFormatError(
			`Node info must be an object, got ${typeof value}`,
			{
				value,
				expected: "Object with node information",
				code: "NODE_INFO_INVALID_TYPE",
				docsPath: "/primitives/node-info/from#error-handling",
			},
		);
	}

	// Validate required fields
	if (typeof value.enode !== "string") {
		throw new InvalidFormatError("Node info must have 'enode' string field", {
			value,
			expected: "enode field",
			code: "NODE_INFO_MISSING_ENODE",
			docsPath: "/primitives/node-info/from#error-handling",
		});
	}

	if (typeof value.id !== "string") {
		throw new InvalidFormatError("Node info must have 'id' string field", {
			value,
			expected: "id field",
			code: "NODE_INFO_MISSING_ID",
			docsPath: "/primitives/node-info/from#error-handling",
		});
	}

	if (typeof value.ip !== "string") {
		throw new InvalidFormatError("Node info must have 'ip' string field", {
			value,
			expected: "ip field",
			code: "NODE_INFO_MISSING_IP",
			docsPath: "/primitives/node-info/from#error-handling",
		});
	}

	if (typeof value.listenAddr !== "string") {
		throw new InvalidFormatError(
			"Node info must have 'listenAddr' string field",
			{
				value,
				expected: "listenAddr field",
				code: "NODE_INFO_MISSING_LISTEN_ADDR",
				docsPath: "/primitives/node-info/from#error-handling",
			},
		);
	}

	if (typeof value.name !== "string") {
		throw new InvalidFormatError("Node info must have 'name' string field", {
			value,
			expected: "name field",
			code: "NODE_INFO_MISSING_NAME",
			docsPath: "/primitives/node-info/from#error-handling",
		});
	}

	if (!value.ports || typeof value.ports !== "object") {
		throw new InvalidFormatError("Node info must have 'ports' object field", {
			value,
			expected: "ports object",
			code: "NODE_INFO_MISSING_PORTS",
			docsPath: "/primitives/node-info/from#error-handling",
		});
	}

	if (
		typeof value.ports.discovery !== "number" ||
		typeof value.ports.listener !== "number"
	) {
		throw new InvalidFormatError(
			"Node info ports must have 'discovery' and 'listener' number fields",
			{
				value: value.ports,
				expected: "discovery and listener number fields",
				code: "NODE_INFO_INVALID_PORTS",
				docsPath: "/primitives/node-info/from#error-handling",
			},
		);
	}

	if (!value.protocols || typeof value.protocols !== "object") {
		throw new InvalidFormatError(
			"Node info must have 'protocols' object field",
			{
				value,
				expected: "protocols object",
				code: "NODE_INFO_MISSING_PROTOCOLS",
				docsPath: "/primitives/node-info/from#error-handling",
			},
		);
	}

	// Parse protocols
	/** @type {Record<string, unknown>} */
	const protocols = {};

	// Parse eth protocol if present
	if (value.protocols.eth) {
		const eth = value.protocols.eth;
		if (typeof eth !== "object") {
			throw new InvalidFormatError("Node info eth protocol must be an object", {
				value: eth,
				expected: "eth protocol object",
				code: "NODE_INFO_INVALID_ETH_PROTOCOL",
				docsPath: "/primitives/node-info/from#error-handling",
			});
		}

		protocols.eth = {
			network: NetworkId.from(eth.network),
			difficulty: Uint.from(eth.difficulty),
			genesis: BlockHash.from(eth.genesis),
			head: BlockHash.from(eth.head),
			config: eth.config || {},
		};
	}

	// Copy other protocols as-is
	for (const [key, val] of Object.entries(value.protocols)) {
		if (key !== "eth") {
			protocols[key] = val;
		}
	}

	return {
		enode: PeerId.from(value.enode),
		id: value.id,
		ip: value.ip,
		listenAddr: value.listenAddr,
		name: value.name,
		ports: {
			discovery: value.ports.discovery,
			listener: value.ports.listener,
		},
		protocols,
	};
}
