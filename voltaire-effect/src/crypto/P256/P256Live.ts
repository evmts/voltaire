import * as Layer from 'effect/Layer'
import { P256Service } from './P256Service.js'
import { sign } from './sign.js'
import { verify } from './verify.js'

/**
 * Production layer for P256Service using native P-256 implementation.
 * @since 0.0.1
 */
export const P256Live = Layer.succeed(
  P256Service,
  {
    sign,
    verify
  }
)
