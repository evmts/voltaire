export * from "./errors.js";
export type { LogIndexType } from "./LogIndexType.js";

import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { toNumber as _toNumber } from "./toNumber.js";

export const from = _from;
export const toNumber = _toNumber;
export const equals = _equals;
