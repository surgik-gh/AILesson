/**
 * Basic test to verify Jest and fast-check are properly configured
 */
import * as fc from 'fast-check'

describe('Testing Setup', () => {
  it('should run basic Jest tests', () => {
    expect(true).toBe(true)
  })

  it('should run property-based tests with fast-check', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n
      })
    )
  })

  it('should handle TypeScript types correctly', () => {
    const testObject: { name: string; value: number } = {
      name: 'test',
      value: 42,
    }
    expect(testObject.name).toBe('test')
    expect(testObject.value).toBe(42)
  })
})
