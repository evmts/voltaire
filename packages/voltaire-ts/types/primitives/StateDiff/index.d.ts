export type { AccountDiff, BalanceChange, CodeChange, NonceChange, StateDiffType, } from "./StateDiffType.js";
import { from as _from } from "./from.js";
import { getAccount as _getAccount } from "./getAccount.js";
import { getAddresses as _getAddresses } from "./getAddresses.js";
import { isEmpty as _isEmpty } from "./isEmpty.js";
export { from } from "./from.js";
export declare function getAccount(diff: import("./StateDiffType.js").StateDiffType | Map<import("../Address/AddressType.js").AddressType, import("./StateDiffType.js").AccountDiff>, address: import("../Address/AddressType.js").AddressType): import("./StateDiffType.js").AccountDiff | undefined;
export declare function getAddresses(diff: import("./StateDiffType.js").StateDiffType | Map<import("../Address/AddressType.js").AddressType, import("./StateDiffType.js").AccountDiff>): Array<import("../Address/AddressType.js").AddressType>;
export declare function isEmpty(diff: import("./StateDiffType.js").StateDiffType | Map<import("../Address/AddressType.js").AddressType, import("./StateDiffType.js").AccountDiff>): boolean;
export { _getAccount, _getAddresses, _isEmpty };
export declare const StateDiff: {
    from: typeof _from;
    getAccount: typeof getAccount;
    getAddresses: typeof getAddresses;
    isEmpty: typeof isEmpty;
};
//# sourceMappingURL=index.d.ts.map