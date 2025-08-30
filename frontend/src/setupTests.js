// frontend/src/setupTests.js

// This extends Vitest's expect with jest-dom matchers automatically.
import '@testing-library/jest-dom/vitest'

import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Clean up the DOM after each test
afterEach(() => cleanup())

// Polyfill ResizeObserver (Recharts needs it; JSDOM doesn't have it)
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = RO

// Make confirm predictable in tests
window.confirm = () => true