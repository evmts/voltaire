export type { BrandedEther, EtherType } from "./EtherType.js";
export { GWEI_PER_ETHER, WEI_PER_ETHER } from "./ether-constants.js";
import { from } from "./ether-from.js";
import { fromGwei } from "./ether-fromGwei.js";
import { fromWei } from "./ether-fromWei.js";
import { toGwei } from "./ether-toGwei.js";
import { toU256 } from "./ether-toU256.js";
import { toWei } from "./ether-toWei.js";
export { from, fromWei, fromGwei, toWei, toGwei, toU256 };
export declare const Ether: {
    from: typeof from;
    fromWei: typeof fromWei;
    fromGwei: typeof fromGwei;
    toWei: typeof toWei;
    toGwei: typeof toGwei;
    toU256: typeof toU256;
};
//# sourceMappingURL=ether-index.d.ts.map