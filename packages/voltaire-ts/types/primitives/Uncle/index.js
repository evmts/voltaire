// Import internal functions
import { from as _from } from "./from.js";
// Export internal functions (tree-shakeable)
export { _from };
// Export public functions
export function from(params) {
    return _from(params);
}
// Namespace export
export const Uncle = {
    from,
};
