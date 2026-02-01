export { Event } from "./Event.js";
export * from "./EventType.js";
export const getSelector: (event: any) => import("../../Hash/HashType.js").HashType;
export const encodeTopics: (event: any, args: any) => (import("../../Hash/HashType.js").HashType | null)[];
import { GetSelector } from "./getSelector.js";
import { EncodeTopics } from "./encodeTopics.js";
import { getSignature } from "./getSignature.js";
import { decodeLog } from "./decodeLog.js";
export { GetSelector, EncodeTopics, getSignature, decodeLog, getSignature as Signature, decodeLog as DecodeLog };
//# sourceMappingURL=index.d.ts.map