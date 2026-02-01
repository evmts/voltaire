export type { DomainSeparatorType } from "./DomainSeparatorType.js";
export { SIZE } from "./DomainSeparatorType.js";
export { equals as _equals } from "./equals.js";
export * from "./errors.js";
export { from as _from } from "./from.js";
export { fromBytes as _fromBytes } from "./fromBytes.js";
export { fromHex as _fromHex } from "./fromHex.js";
export { toHex as _toHex } from "./toHex.js";
export declare function from(value: string | Uint8Array): import("./DomainSeparatorType.js").DomainSeparatorType;
export declare function fromBytes(bytes: Uint8Array): import("./DomainSeparatorType.js").DomainSeparatorType;
export declare function fromHex(hex: string): import("./DomainSeparatorType.js").DomainSeparatorType;
export declare function toHex(separator: import("./DomainSeparatorType.js").DomainSeparatorType): string;
export declare function equals(a: import("./DomainSeparatorType.js").DomainSeparatorType, b: import("./DomainSeparatorType.js").DomainSeparatorType): boolean;
//# sourceMappingURL=index.d.ts.map