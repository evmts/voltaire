export { GOERLI, HOLESKY, MAINNET, SEPOLIA } from "./constants.js";
export type { NetworkIdType } from "./NetworkIdType.js";
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toNumber as _toNumber } from "./toNumber.js";
export { from };
export declare function toNumber(networkId: number): number;
export declare function equals(networkId1: number, networkId2: number): boolean;
export { _toNumber, _equals };
export declare const NetworkId: {
    from: typeof from;
    toNumber: typeof toNumber;
    equals: typeof equals;
};
//# sourceMappingURL=index.d.ts.map