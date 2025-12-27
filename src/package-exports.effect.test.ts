import { describe, it, expect } from 'vitest'
import fs from 'node:fs'

describe('package exports include Effect modules', () => {
  it('has effect subpath exports', () => {
    const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))
    const exports = Object.keys(pkg.exports)
    const required = [
      './Hash/effect',
      './Hex/effect',
      './Uint/effect',
      './Signature/effect',
      './Bytecode/effect',
      './Base64/effect',
      './Ens/effect',
    ]
    for (const key of required) {
      expect(exports).toContain(key)
    }
  })
})

