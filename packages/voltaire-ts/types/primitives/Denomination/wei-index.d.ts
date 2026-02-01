export type { BrandedWei, WeiType } from "./WeiType.js";
export { WEI_PER_ETHER, WEI_PER_GWEI } from "./wei-constants.js";
import { from } from "./wei-from.js";
import { fromEther } from "./wei-fromEther.js";
import { fromGwei } from "./wei-fromGwei.js";
import { toEther } from "./wei-toEther.js";
import { toGwei } from "./wei-toGwei.js";
import { toU256 } from "./wei-toU256.js";
export { from, fromEther, fromGwei, toEther, toGwei, toU256 };
export declare const Wei: {
    from: typeof from;
    fromEther: typeof fromEther;
    fromGwei: typeof fromGwei;
    toEther: typeof toEther;
    toGwei: typeof toGwei;
    toU256: typeof toU256;
};
//# sourceMappingURL=wei-index.d.ts.map