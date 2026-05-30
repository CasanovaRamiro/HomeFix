import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { TextDecoder, TextEncoder } from 'node:util'

afterEach(() => {
  cleanup()
})

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
})
