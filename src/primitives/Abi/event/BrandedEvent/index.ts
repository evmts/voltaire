// @ts-nocheck
export * from "./BrandedEvent.js";

import { decodeLog } from "./decodeLog.js";
import { encodeTopics } from "./encodeTopics.js";
import { getSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";

// Export individual functions
export { getSignature, getSelector, encodeTopics, decodeLog };

// Namespace export
export const BrandedEvent = {
	getSignature,
	getSelector,
	encodeTopics,
	decodeLog,
};
