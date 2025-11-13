// @ts-nocheck
export * from "./BrandedEvent.js";

// Import crypto dependencies
import { keccak256 as keccak256Impl } from "../../../Hash/BrandedHash/keccak256.js";
import { keccak256String as keccak256StringImpl } from "../../../Hash/BrandedHash/keccak256String.js";

import { decodeLog } from "./decodeLog.js";
import { EncodeTopics } from "./encodeTopics.js";
import { GetSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";

// Factory exports (tree-shakeable)
export { GetSelector, EncodeTopics };

// Wrapper exports (convenient, backward compat)
export const getSelector = GetSelector({
	keccak256String: keccak256StringImpl,
});
export const encodeTopics = EncodeTopics({
	keccak256: keccak256Impl,
	keccak256String: keccak256StringImpl,
});

// Export individual functions
export { getSignature, decodeLog };

// Namespace export
export const BrandedEvent = {
	getSignature,
	getSelector,
	encodeTopics,
	decodeLog,
	// Factories
	GetSelector,
	EncodeTopics,
};
