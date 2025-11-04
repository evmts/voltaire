// @ts-nocheck
export * from "./BrandedEvent.js";

import { decodeLog } from "./decodeLog.js";
import { encodeTopics } from "./encodeTopics.js";
import { getSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";

// Export individual functions
export { getSignature, getSelector, encodeTopics, decodeLog };

/**
 * @typedef {import('./BrandedEvent.js').Event} Event
 * @typedef {import('./EventConstructor.js').EventConstructor} EventConstructor
 */

/**
 * Event utility namespace
 *
 * @type {EventConstructor}
 */
export const Event = {
	getSignature,
	getSelector,
	encodeTopics,
	decodeLog,
};

Event.getSignature = getSignature;
Event.getSelector = getSelector;
Event.encodeTopics = encodeTopics;
Event.decodeLog = decodeLog;
