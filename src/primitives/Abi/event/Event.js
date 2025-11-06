// @ts-nocheck
import * as BrandedEvent from "./BrandedEvent/index.ts";

/**
 * Factory function for creating Event instances
 * Note: Event is a plain object, not a class instance
 * This namespace provides convenient methods for working with events
 */

// Static utility methods
export const Event = {
	getSignature: BrandedEvent.getSignature,
	getSelector: BrandedEvent.getSelector,
	encodeTopics: BrandedEvent.encodeTopics,
	decodeLog: BrandedEvent.decodeLog,
};
