import * as Layer from 'effect/Layer'
import { Bls12381Service } from './Bls12381Service.js'
import { sign } from './sign.js'
import { verify } from './verify.js'
import { aggregate } from './aggregate.js'

/**
 * Production layer for Bls12381Service using native BLS12-381 implementation.
 * @since 0.0.1
 */
export const Bls12381Live = Layer.succeed(
  Bls12381Service,
  {
    sign,
    verify,
    aggregate
  }
)
