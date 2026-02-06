import * as BlockHash from "../BlockHash/index.js";
import { InvalidFormatError } from "../errors/ValidationError.js";
import * as PeerId from "../PeerId/index.js";
import * as ProtocolVersion from "../ProtocolVersion/index.js";
import * as Uint from "../Uint/index.js";
/**
 * Create PeerInfo from RPC response object
 *
 * @param {any} value - Peer info object from admin_peers
 * @returns {import('./PeerInfoType.js').PeerInfoType} Peer information
 * @throws {InvalidFormatError} If value is not a valid peer info object
 *
 * @example
 * ```javascript
 * import * as PeerInfo from './primitives/PeerInfo/index.js';
 * const peers = rpcResponse.map(peer => PeerInfo.from(peer));
 * peers.forEach(peer => {
 *   console.log(peer.name);
 *   console.log(peer.network.inbound);
 * });
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation requires checking multiple fields
export function from(value) {
    if (!value || typeof value !== "object") {
        throw new InvalidFormatError(`Peer info must be an object, got ${typeof value}`, {
            value,
            expected: "Object with peer information",
            code: -32602,
            docsPath: "/primitives/peer-info/from#error-handling",
        });
    }
    // Validate required fields
    if (typeof value.id !== "string") {
        throw new InvalidFormatError("Peer info must have 'id' string field", {
            value,
            expected: "id field",
            code: -32602,
            docsPath: "/primitives/peer-info/from#error-handling",
        });
    }
    if (typeof value.name !== "string") {
        throw new InvalidFormatError("Peer info must have 'name' string field", {
            value,
            expected: "name field",
            code: -32602,
            docsPath: "/primitives/peer-info/from#error-handling",
        });
    }
    if (!Array.isArray(value.caps)) {
        throw new InvalidFormatError("Peer info must have 'caps' array field", {
            value,
            expected: "caps array",
            code: -32602,
            docsPath: "/primitives/peer-info/from#error-handling",
        });
    }
    if (!value.network || typeof value.network !== "object") {
        throw new InvalidFormatError("Peer info must have 'network' object field", {
            value,
            expected: "network object",
            code: -32602,
            docsPath: "/primitives/peer-info/from#error-handling",
        });
    }
    const network = value.network;
    if (typeof network.localAddress !== "string" ||
        typeof network.remoteAddress !== "string" ||
        typeof network.inbound !== "boolean" ||
        typeof network.trusted !== "boolean" ||
        typeof network.static !== "boolean") {
        throw new InvalidFormatError("Peer info network must have required string and boolean fields", {
            value: network,
            expected: "localAddress, remoteAddress (string), inbound, trusted, static (boolean)",
            code: -32602,
            docsPath: "/primitives/peer-info/from#error-handling",
        });
    }
    if (!value.protocols || typeof value.protocols !== "object") {
        throw new InvalidFormatError("Peer info must have 'protocols' object field", {
            value,
            expected: "protocols object",
            code: -32602,
            docsPath: "/primitives/peer-info/from#error-handling",
        });
    }
    // Parse protocols
    /** @type {Record<string, unknown>} */
    const protocols = {};
    // Parse eth protocol if present
    if (value.protocols.eth) {
        const eth = value.protocols.eth;
        if (typeof eth !== "object") {
            throw new InvalidFormatError("Peer info eth protocol must be an object", {
                value: eth,
                expected: "eth protocol object",
                code: -32602,
                docsPath: "/primitives/peer-info/from#error-handling",
            });
        }
        protocols.eth = {
            version: ProtocolVersion.from(eth.version),
            difficulty: Uint.from(eth.difficulty),
            head: BlockHash.from(eth.head),
        };
    }
    // Copy other protocols as-is
    for (const [key, val] of Object.entries(value.protocols)) {
        if (key !== "eth") {
            protocols[key] = val;
        }
    }
    return {
        id: PeerId.from(value.id),
        name: value.name,
        caps: [...value.caps],
        network: {
            localAddress: network.localAddress,
            remoteAddress: network.remoteAddress,
            inbound: network.inbound,
            trusted: network.trusted,
            static: network.static,
        },
        protocols,
    };
}
