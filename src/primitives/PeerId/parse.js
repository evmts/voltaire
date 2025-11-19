import { InvalidFormatError } from "../errors/ValidationError.js";

/**
 * Parse enode URL into components
 *
 * @this {import('./PeerIdType.js').PeerIdType}
 * @returns {import('./PeerIdType.js').EnodeComponents} Parsed enode components
 * @throws {InvalidFormatError} If not a valid enode URL
 *
 * @example
 * ```javascript
 * import * as PeerId from './primitives/PeerId/index.js';
 * const peerId = PeerId.from("enode://pubkey@192.168.1.1:30303?discport=30301");
 * const parsed = PeerId._parse.call(peerId);
 * console.log(parsed.ip);    // "192.168.1.1"
 * console.log(parsed.port);  // 30303
 * console.log(parsed.discoveryPort); // 30301
 * ```
 */
export function parse() {
	const enodeUrl = this;

	// Check for enode:// prefix
	if (!enodeUrl.startsWith("enode://")) {
		throw new InvalidFormatError(
			"Peer ID must start with 'enode://' to be parsed as enode URL",
			{
				value: enodeUrl,
				expected: "enode:// prefix",
				code: "PEER_ID_INVALID_ENODE_PREFIX",
				docsPath: "/primitives/peer-id/parse#error-handling",
			},
		);
	}

	// Remove enode:// prefix
	const withoutPrefix = enodeUrl.slice(8);

	// Split on @ to separate pubkey from address
	const atIndex = withoutPrefix.indexOf("@");
	if (atIndex === -1) {
		throw new InvalidFormatError("Enode URL must contain '@' separator", {
			value: enodeUrl,
			expected: "enode://PUBKEY@IP:PORT format",
			code: "PEER_ID_MISSING_AT_SEPARATOR",
			docsPath: "/primitives/peer-id/parse#error-handling",
		});
	}

	const publicKey = withoutPrefix.slice(0, atIndex);
	const addressPart = withoutPrefix.slice(atIndex + 1);

	// Validate public key (should be 128 hex chars)
	if (!/^[0-9a-fA-F]{128}$/.test(publicKey)) {
		throw new InvalidFormatError(
			"Enode public key must be 128 hex characters",
			{
				value: publicKey,
				expected: "128 hex characters",
				code: "PEER_ID_INVALID_PUBKEY",
				docsPath: "/primitives/peer-id/parse#error-handling",
			},
		);
	}

	// Split address part into IP:PORT and query string
	const queryIndex = addressPart.indexOf("?");
	const ipPortPart =
		queryIndex === -1 ? addressPart : addressPart.slice(0, queryIndex);
	const queryPart = queryIndex === -1 ? "" : addressPart.slice(queryIndex + 1);

	// Handle IPv6 addresses [ip]:port
	let ip;
	let port;

	if (ipPortPart.startsWith("[")) {
		// IPv6 format: [ip]:port
		const closeBracket = ipPortPart.indexOf("]");
		if (closeBracket === -1) {
			throw new InvalidFormatError("Invalid IPv6 format in enode URL", {
				value: ipPortPart,
				expected: "[IPv6]:PORT format",
				code: "PEER_ID_INVALID_IPV6",
				docsPath: "/primitives/peer-id/parse#error-handling",
			});
		}
		ip = ipPortPart.slice(1, closeBracket);
		const portPart = ipPortPart.slice(closeBracket + 2); // Skip ]:
		port = Number.parseInt(portPart, 10);
	} else {
		// IPv4 format: ip:port
		const lastColon = ipPortPart.lastIndexOf(":");
		if (lastColon === -1) {
			throw new InvalidFormatError("Enode URL must contain port number", {
				value: ipPortPart,
				expected: "IP:PORT format",
				code: "PEER_ID_MISSING_PORT",
				docsPath: "/primitives/peer-id/parse#error-handling",
			});
		}
		ip = ipPortPart.slice(0, lastColon);
		port = Number.parseInt(ipPortPart.slice(lastColon + 1), 10);
	}

	// Validate port
	if (Number.isNaN(port) || port < 0 || port > 65535) {
		throw new InvalidFormatError("Invalid port number in enode URL", {
			value: port,
			expected: "Port between 0 and 65535",
			code: "PEER_ID_INVALID_PORT",
			docsPath: "/primitives/peer-id/parse#error-handling",
		});
	}

	// Parse query string for discovery port
	let discoveryPort;
	if (queryPart) {
		const params = new URLSearchParams(queryPart);
		const discportStr = params.get("discport");
		if (discportStr) {
			discoveryPort = Number.parseInt(discportStr, 10);
			if (
				Number.isNaN(discoveryPort) ||
				discoveryPort < 0 ||
				discoveryPort > 65535
			) {
				throw new InvalidFormatError(
					"Invalid discovery port number in enode URL",
					{
						value: discoveryPort,
						expected: "Port between 0 and 65535",
						code: "PEER_ID_INVALID_DISCPORT",
						docsPath: "/primitives/peer-id/parse#error-handling",
					},
				);
			}
		}
	}

	return {
		publicKey,
		ip,
		port,
		...(discoveryPort !== undefined && { discoveryPort }),
	};
}
