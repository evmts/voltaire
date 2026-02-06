/**
 * @fileoverview Formatter service exports.
 *
 * @module Formatter
 * @since 0.0.1
 *
 * @description
 * Re-exports the FormatterService interface, FormatError, and DefaultFormatter layer.
 *
 * @see {@link FormatterService} - The service interface
 * @see {@link FormatError} - Error type for failed formatting
 * @see {@link DefaultFormatter} - Default passthrough implementation
 */

export {
	ArbitrumFormatter,
	OptimismFormatter,
	ZkSyncFormatter,
} from "./chains/index.js";
export { DefaultFormatter } from "./DefaultFormatter.js";
export type { FormatterShape } from "./FormatterService.js";
export { FormatError, FormatterService } from "./FormatterService.js";
