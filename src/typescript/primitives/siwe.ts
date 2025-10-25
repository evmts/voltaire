/**
 * Sign-In with Ethereum (EIP-4361) message handling
 */

export interface SiweMessage {
	domain: string;
	address: string;
	statement?: string;
	uri: string;
	version: string;
	chainId: number;
	nonce: string;
	issuedAt: string;
	expirationTime?: string;
	notBefore?: string;
	requestId?: string;
	resources?: string[];
}

/**
 * Parse a SIWE message from a string
 * @param message - The SIWE message string
 * @returns Parsed SIWE message
 */
export function parseMessage(message: string): SiweMessage {
	const lines = message.split("\n");

	const domainMatch = lines[0]?.match(
		/^(.+) wants you to sign in with your Ethereum account:$/,
	);
	if (!domainMatch) {
		throw new Error("Invalid SIWE message: missing domain");
	}
	const domain = domainMatch[1];

	const address = lines[1];
	if (!address) {
		throw new Error("Invalid SIWE message: missing address");
	}

	const statement =
		lines[2] && !lines[2].startsWith("URI:") ? lines[2] : undefined;

	const currentLine = statement ? 3 : 2;

	const result: Partial<SiweMessage> = {
		domain,
		address,
		statement,
	};

	for (let i = currentLine; i < lines.length; i++) {
		const line = lines[i];
		if (line.startsWith("URI: ")) {
			result.uri = line.slice(5);
		} else if (line.startsWith("Version: ")) {
			result.version = line.slice(9);
		} else if (line.startsWith("Chain ID: ")) {
			result.chainId = Number.parseInt(line.slice(10));
		} else if (line.startsWith("Nonce: ")) {
			result.nonce = line.slice(7);
		} else if (line.startsWith("Issued At: ")) {
			result.issuedAt = line.slice(11);
		} else if (line.startsWith("Expiration Time: ")) {
			result.expirationTime = line.slice(17);
		} else if (line.startsWith("Not Before: ")) {
			result.notBefore = line.slice(12);
		} else if (line.startsWith("Request ID: ")) {
			result.requestId = line.slice(12);
		} else if (line.startsWith("Resources:")) {
			result.resources = [];
			for (let j = i + 1; j < lines.length; j++) {
				if (lines[j].startsWith("- ")) {
					result.resources.push(lines[j].slice(2));
				}
			}
			break;
		}
	}

	if (
		!result.uri ||
		!result.version ||
		result.chainId === undefined ||
		!result.nonce ||
		!result.issuedAt
	) {
		throw new Error("Invalid SIWE message: missing required fields");
	}

	return result as SiweMessage;
}

/**
 * Validate a SIWE message structure
 * @param message - The SIWE message to validate
 * @returns True if valid, false otherwise
 */
export function validateMessage(message: SiweMessage): boolean {
	if (
		!message.domain ||
		!message.address ||
		!message.uri ||
		!message.version ||
		message.chainId === undefined ||
		!message.nonce ||
		!message.issuedAt
	) {
		return false;
	}

	if (message.version !== "1") {
		return false;
	}

	if (!message.address.match(/^0x[a-fA-F0-9]{40}$/)) {
		return false;
	}

	return true;
}

/**
 * Format a SIWE message for signing
 * @param message - The SIWE message object
 * @returns Formatted message string
 */
export function formatMessage(message: SiweMessage): string {
	const parts: string[] = [];

	parts.push(
		`${message.domain} wants you to sign in with your Ethereum account:`,
	);
	parts.push(message.address);
	parts.push("");

	if (message.statement) {
		parts.push(message.statement);
		parts.push("");
	}

	parts.push(`URI: ${message.uri}`);
	parts.push(`Version: ${message.version}`);
	parts.push(`Chain ID: ${message.chainId}`);
	parts.push(`Nonce: ${message.nonce}`);
	parts.push(`Issued At: ${message.issuedAt}`);

	if (message.expirationTime) {
		parts.push(`Expiration Time: ${message.expirationTime}`);
	}

	if (message.notBefore) {
		parts.push(`Not Before: ${message.notBefore}`);
	}

	if (message.requestId) {
		parts.push(`Request ID: ${message.requestId}`);
	}

	if (message.resources && message.resources.length > 0) {
		parts.push("Resources:");
		for (const resource of message.resources) {
			parts.push(`- ${resource}`);
		}
	}

	return parts.join("\n");
}

/**
 * Verify if a message is expired
 * @param message - The SIWE message
 * @param now - Current timestamp (defaults to Date.now())
 * @returns True if expired
 */
export function isExpired(message: SiweMessage, now?: number): boolean {
	if (!message.expirationTime) {
		return false;
	}

	const currentTime = now ?? Date.now();
	const expirationTime = new Date(message.expirationTime).getTime();

	return currentTime >= expirationTime;
}

/**
 * Verify if a message is not yet valid
 * @param message - The SIWE message
 * @param now - Current timestamp (defaults to Date.now())
 * @returns True if not yet valid
 */
export function isNotYetValid(message: SiweMessage, now?: number): boolean {
	if (!message.notBefore) {
		return false;
	}

	const currentTime = now ?? Date.now();
	const notBeforeTime = new Date(message.notBefore).getTime();

	return currentTime < notBeforeTime;
}
