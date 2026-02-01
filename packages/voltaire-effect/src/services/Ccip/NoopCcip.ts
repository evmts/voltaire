/**
 * @fileoverview No-op CCIP implementation that always fails.
 *
 * @module NoopCcip
 * @since 0.0.1
 *
 * @description
 * A CCIP implementation that always returns an error. Use this when offchain
 * lookups should be disabled (e.g., in sandboxed environments, testing, or
 * when external network access is restricted).
 *
 * @see {@link CcipService} - The service interface
 * @see {@link DefaultCcip} - Working HTTP implementation
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { CcipError, CcipService } from "./CcipService.js";

/**
 * No-op CCIP layer that always fails.
 *
 * @description
 * Provides CcipService with an implementation that immediately fails
 * with "CCIP disabled". Use when offchain lookups should not be performed.
 *
 * @since 0.0.1
 *
 * @example Disable CCIP in tests
 * ```typescript
 * import { Effect } from 'effect'
 * import { CcipService, NoopCcip } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const ccip = yield* CcipService
 *   // This will always fail with "CCIP disabled"
 *   return yield* ccip.request({ ... })
 * }).pipe(Effect.provide(NoopCcip))
 * ```
 */
export const NoopCcip: Layer.Layer<CcipService> = Layer.succeed(
	CcipService,
	CcipService.of({
		request: (params) =>
			Effect.fail(
				new CcipError({
					urls: [...params.urls],
					message: "CCIP disabled",
				}),
			),
	}),
);
