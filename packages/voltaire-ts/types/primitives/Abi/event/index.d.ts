export { Event } from "./Event.js";
export * from "./EventType.js";
export const getSelector: (event: any) => import("../../Hash/HashType.js").HashType;
export const encodeTopics: (event: any, args: any) => (import("../../Hash/HashType.js").HashType | null)[];
import { EncodeTopics } from "./encodeTopics.js";
import { GetSelector } from "./getSelector.js";
import { decodeLog } from "./decodeLog.js";
import { getSignature } from "./getSignature.js";
export { EncodeTopics, GetSelector, decodeLog, decodeLog as DecodeLog, getSignature, getSignature as Signature };
//# sourceMappingURL=index.d.ts.map