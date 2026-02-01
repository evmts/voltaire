import { isLegacy } from "./typeGuards.js";
/**
 * Check if transaction has access list
 */
export function hasAccessList() {
    return !isLegacy(this);
}
