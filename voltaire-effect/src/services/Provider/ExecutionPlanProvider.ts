/**
 * ExecutionPlan-based provider fallback strategy.
 *
 * @description
 * Provides declarative retry/fallback across different RPC providers using Effect's ExecutionPlan.
 * Define a plan that automatically tries multiple providers with configurable retry strategies.
 *
 * @example Basic usage
 * ```typescript
 * import { Effect, Schedule } from 'effect'
 * import { makeProviderPlan, getBalance } from 'voltaire-effect'
 *
 * const plan = makeProviderPlan([
 *   { url: 'https://primary.example.com', attempts: 2, schedule: Schedule.spaced('1 second') },
 *   { url: 'https://fallback.example.com', attempts: 3 },
 *   { url: 'https://public.llamarpc.com' }  // last resort
 * ])
 *
 * const balance = yield* getBalance(address).pipe(Effect.withExecutionPlan(plan))
 * ```
 *
 * @module ExecutionPlanProvider
 * @since 0.3.0
 * @experimental
 */

import { Effect, ExecutionPlan, Layer, Schedule } from "effect";
import type { DurationInput } from "effect/Duration";
import type { Schedule as ScheduleType } from "effect/Schedule";
import { TransportService } from "../Transport/TransportService.js";
import { HttpTransport } from "../Transport/HttpTransport.js";
import { Provider } from "./Provider.js";

/**
 * Configuration for a single provider step in the fallback chain.
 */
export interface ProviderStepConfig {
	/** RPC URL for this provider */
	readonly url: string;
	/** Number of retry attempts before moving to next provider (default: 1) */
	readonly attempts?: number;
	/** Retry schedule between attempts (default: no delay) */
	readonly schedule?: ScheduleType<unknown, unknown>;
}

/**
 * Creates an ExecutionPlan for multi-provider fallback.
 *
 * @description
 * Each step in the plan represents a different RPC provider. The plan tries each
 * provider in order, with configurable retry attempts and schedules per provider.
 *
 * @example
 * ```typescript
 * import { Effect, Schedule } from 'effect'
 * import { makeProviderPlan, getBlockNumber } from 'voltaire-effect'
 *
 * const plan = makeProviderPlan([
 *   {
 *     url: process.env.INFURA_URL!,
 *     attempts: 2,
 *     schedule: Schedule.spaced('1 second')
 *   },
 *   {
 *     url: process.env.ALCHEMY_URL!,
 *     attempts: 3,
 *     schedule: Schedule.exponential('500 millis')
 *   },
 *   { url: 'https://eth.llamarpc.com' }  // public fallback
 * ])
 *
 * const blockNumber = yield* getBlockNumber().pipe(Effect.withExecutionPlan(plan))
 * ```
 *
 * @since 0.3.0
 * @experimental
 */
export const makeProviderPlan = (
	configs: readonly [ProviderStepConfig, ...ProviderStepConfig[]],
) => {
	const [first, ...rest] = configs;
	const makeStep = (config: ProviderStepConfig): ExecutionPlan.make.Step => {
		const layer = Provider.pipe(Layer.provide(HttpTransport(config.url)));
		return {
			provide: layer,
			attempts: config.attempts,
			schedule: config.schedule,
		};
	};

	const steps: [ExecutionPlan.make.Step, ...ExecutionPlan.make.Step[]] = [
		makeStep(first),
		...rest.map(makeStep),
	];

	return ExecutionPlan.make(...steps);
};

/**
 * Creates a pre-configured resilient provider plan with sensible defaults.
 *
 * @description
 * A convenience function that creates a plan with:
 * - Primary: 3 attempts with exponential backoff + jitter
 * - Fallback: 2 attempts with fixed 500ms delay
 * - Last resort (optional): single attempt
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { makeResilientProviderPlan, getBlockNumber } from 'voltaire-effect'
 *
 * const plan = makeResilientProviderPlan(
 *   process.env.INFURA_URL!,
 *   process.env.ALCHEMY_URL!,
 *   'https://eth.llamarpc.com'
 * )
 *
 * const blockNumber = yield* getBlockNumber().pipe(Effect.withExecutionPlan(plan))
 * ```
 *
 * @since 0.3.0
 * @experimental
 */
export const makeResilientProviderPlan = (
	primaryUrl: string,
	fallbackUrl: string,
	lastResortUrl?: string,
) => {
	const configs: [ProviderStepConfig, ...ProviderStepConfig[]] = [
		{
			url: primaryUrl,
			attempts: 3,
			schedule: Schedule.exponential("200 millis").pipe(
				Schedule.jittered,
				Schedule.intersect(Schedule.recurs(3)),
			),
		},
		{
			url: fallbackUrl,
			attempts: 2,
			schedule: Schedule.spaced("500 millis"),
		},
	];

	if (lastResortUrl) {
		configs.push({ url: lastResortUrl });
	}

	return makeProviderPlan(configs);
};
