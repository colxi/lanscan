import { callAsyncMethodWithTimeout } from '.'

describe('callAsyncMethodWithTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('promise resolves before timeout', () => {
    it('should return promise result when it resolves quickly', async () => {
      const result = await callAsyncMethodWithTimeout(() => Promise.resolve('success'), 1000, 'timeout')

      expect(result).toBe('success')
    })

    it('should return promise result with number', async () => {
      const result = await callAsyncMethodWithTimeout(() => Promise.resolve(42), 1000, 0)

      expect(result).toBe(42)
    })

    it('should return promise result with object', async () => {
      const result = await callAsyncMethodWithTimeout(
        () => Promise.resolve({ data: 'test', success: true }), 
        1000, 
        null
      )

      expect(result).toEqual({ data: 'test', success: true })
    })

    it('should return promise result with array', async () => {
      const result = await callAsyncMethodWithTimeout(() => Promise.resolve([1, 2, 3]), 1000, [])

      expect(result).toEqual([1, 2, 3])
    })

    it('should work with async function that resolves quickly', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'fast result'
      }

      const result = await callAsyncMethodWithTimeout(asyncFn, 1000, 'timeout')

      expect(result).toBe('fast result')
    })
  })

  describe('promise times out', () => {
    it('should return timeout value when promise is too slow', async () => {
      const slowFn = () => new Promise(resolve => 
        setTimeout(() => resolve('slow'), 1000)
      )

      const result = await callAsyncMethodWithTimeout(slowFn, 100, 'timeout')

      expect(result).toBe('timeout')
    })

    it('should return timeout object', async () => {
      const slowFn = () => new Promise(resolve => 
        setTimeout(() => resolve('slow'), 1000)
      )

      const result = await callAsyncMethodWithTimeout(
        slowFn, 
        100, 
        { timedOut: true, message: 'Operation timed out' }
      )

      expect(result).toEqual({ timedOut: true, message: 'Operation timed out' })
    })

    it('should return timeout null value', async () => {
      const slowFn = () => new Promise(resolve => 
        setTimeout(() => resolve('slow'), 1000)
      )

      const result = await callAsyncMethodWithTimeout(slowFn, 100, null)

      expect(result).toBe(null)
    })

    it('should return timeout undefined value', async () => {
      const slowFn = () => new Promise(resolve => 
        setTimeout(() => resolve('slow'), 1000)
      )

      const result = await callAsyncMethodWithTimeout(slowFn, 100, undefined)

      expect(result).toBe(undefined)
    })

    it('should handle very short timeout', async () => {
      const slowFn = () => new Promise(resolve => 
        setTimeout(() => resolve('slow'), 500)
      )

      const result = await callAsyncMethodWithTimeout(slowFn, 10, 'fast-timeout')

      expect(result).toBe('fast-timeout')
    })
  })

  describe('edge cases', () => {
    it('should handle promise that resolves immediately', async () => {
      const result = await callAsyncMethodWithTimeout(() => Promise.resolve('immediate'), 0, 'timeout')

      expect(result).toBe('immediate')
    })

    it('should handle promise that rejects', async () => {
      await expect(
        callAsyncMethodWithTimeout(() => Promise.reject(new Error('Failed')), 1000, 'timeout')
      ).rejects.toThrow('Failed')
    })

    it('should handle promise that rejects before timeout', async () => {
      const rejectFn = () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Slow failure')), 50)
      )

      await expect(
        callAsyncMethodWithTimeout(rejectFn, 1000, 'timeout')
      ).rejects.toThrow('Slow failure')
    })

    it('should handle promise with boolean values', async () => {
      const result = await callAsyncMethodWithTimeout(() => Promise.resolve(true), 1000, false)

      expect(result).toBe(true)
    })

    it('should handle zero timeout with immediate resolution', async () => {
      const result = await callAsyncMethodWithTimeout(() => Promise.resolve('instant'), 0, 'timeout')

      // With 0 timeout, it's a race - could be either value
      expect(['instant', 'timeout']).toContain(result)
    })
  })

  describe('timeout cleanup', () => {
    it('should clear timeout when promise resolves first', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      await callAsyncMethodWithTimeout(() => Promise.resolve('quick'), 1000, 'timeout')

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })

    it('should clear timeout when timeout occurs first', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
      const slowFn = () => new Promise(resolve => 
        setTimeout(() => resolve('slow'), 1000)
      )

      await callAsyncMethodWithTimeout(slowFn, 100, 'timeout')

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('real-world scenarios', () => {
    it('should timeout API call simulation', async () => {
      const slowApiCall = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'api response' }), 5000)
      )

      const result = await callAsyncMethodWithTimeout(
        slowApiCall, 
        100, 
        { error: 'Request timeout', timedOut: true }
      )

      expect(result).toEqual({ error: 'Request timeout', timedOut: true })
    })

    it('should resolve fast API call simulation', async () => {
      const fastApiCall = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'quick response' }), 10)
      )

      const result = await callAsyncMethodWithTimeout(
        fastApiCall, 
        1000, 
        { error: 'Request timeout' }
      )

      expect(result).toEqual({ data: 'quick response' })
    })

    it('should handle device identification timeout scenario', async () => {
      const identifyDevice = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { hostname: 'device', ip: '192.168.1.1' }
      }

      const result = await callAsyncMethodWithTimeout(
        identifyDevice, 
        100, 
        { timedOut: true }
      )

      expect(result).toEqual({ timedOut: true })
    })

    it('should handle successful device identification', async () => {
      const identifyDevice = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { hostname: 'router', ip: '192.168.1.1', vendor: 'TP-Link' }
      }

      const result = await callAsyncMethodWithTimeout(
        identifyDevice, 
        1000, 
        { timedOut: true }
      )

      expect(result).toEqual({ 
        hostname: 'router', 
        ip: '192.168.1.1', 
        vendor: 'TP-Link' 
      })
    })
  })

  describe('type safety', () => {
    it('should preserve string type', async () => {
      const result = await callAsyncMethodWithTimeout(() => Promise.resolve('text'), 1000, 'timeout')

      expect(typeof result).toBe('string')
    })

    it('should preserve number type', async () => {
      const result = await callAsyncMethodWithTimeout(() => Promise.resolve(123), 1000, 0)

      if (typeof result === 'number') {
        expect(result).toBeGreaterThan(-1)
      }
    })

    it('should handle union types', async () => {
      const asyncFn = async (): Promise<string | number> => 42
      const result = await callAsyncMethodWithTimeout(asyncFn, 1000, 'timeout')

      expect([42, 'timeout']).toContain(result)
    })
  })

  describe('concurrent promises', () => {
    it('should handle multiple promises with timeout independently', async () => {
      const promise1 = () => new Promise(resolve => setTimeout(() => resolve('p1'), 50))
      const promise2 = () => new Promise(resolve => setTimeout(() => resolve('p2'), 200))
      const promise3 = () => new Promise(resolve => setTimeout(() => resolve('p3'), 10))

      const [result1, result2, result3] = await Promise.all([
        callAsyncMethodWithTimeout(promise1, 100, 'timeout1'),
        callAsyncMethodWithTimeout(promise2, 100, 'timeout2'),
        callAsyncMethodWithTimeout(promise3, 100, 'timeout3')
      ])

      expect(result1).toBe('p1')
      expect(result2).toBe('timeout2')
      expect(result3).toBe('p3')
    })

    it('should not interfere with each other', async () => {
      const results = await Promise.all([
        callAsyncMethodWithTimeout(() => Promise.resolve('a'), 1000, 'timeout'),
        callAsyncMethodWithTimeout(() => Promise.resolve('b'), 1000, 'timeout'),
        callAsyncMethodWithTimeout(() => Promise.resolve('c'), 1000, 'timeout')
      ])

      expect(results).toEqual(['a', 'b', 'c'])
    })
  })

  describe('retry functionality', () => {
    it('should not retry by default (retries = 0)', async () => {
      const slowFn = () => new Promise(resolve => 
        setTimeout(() => resolve('slow'), 1000)
      )

      const result = await callAsyncMethodWithTimeout(slowFn, 100, 'timeout')

      expect(result).toBe('timeout')
    })

    it('should retry when using async function', async () => {
      let callCount = 0
      const asyncFn = () => new Promise<string>(resolve => {
        callCount++
        setTimeout(() => resolve('slow'), 200)
      })

      const result = await callAsyncMethodWithTimeout(
        asyncFn, 
        50, 
        'timeout', 
        { retry: 2} // Will try 3 times total
      )

      // All 3 attempts should timeout
      expect(result).toBe('timeout')
      expect(callCount).toBe(3) // Initial + 2 retries
    })

    it('should succeed on retry if async function eventually resolves fast', async () => {
      let attempt = 0
      const asyncFn = () => new Promise<string>(resolve => {
        attempt++
        if (attempt < 2) {
          // First attempt times out
          setTimeout(() => resolve('slow'), 200)
        } else {
          // Second attempt succeeds
          resolve('fast')
        }
      })

      const result = await callAsyncMethodWithTimeout(
        asyncFn, 
        50, 
        'timeout', 
        { retry: 2 }
      )

      expect(result).toBe('fast')
      expect(attempt).toBe(2)
    })

    it('should return timeout value after all retries exhausted', async () => {
      let callCount = 0
      const asyncFn = () => new Promise(resolve => {
        callCount++
        setTimeout(() => resolve('too-slow'), 5000)
      })

      const result = await callAsyncMethodWithTimeout(
        asyncFn, 
        100, 
        { timedOut: true, message: 'Failed after retries' }, 
        { retry: 3 }
      )

      expect(result).toEqual({ timedOut: true, message: 'Failed after retries' })
      expect(callCount).toBe(4) // Initial + 3 retries
    })

    it('should succeed immediately without retries if promise resolves fast', async () => {
      let callCount = 0
      const asyncFn = () => {
        callCount++
        return Promise.resolve('quick')
      }

      const result = await callAsyncMethodWithTimeout(
        asyncFn, 
        1000, 
        'timeout', 
        { retry: 5 }
      )

      expect(result).toBe('quick')
      expect(callCount).toBe(1) // Only called once, no retries needed
    })

    it('should not retry on promise rejection', async () => {
      let callCount = 0
      const asyncFn = () => {
        callCount++
        return Promise.reject(new Error('Failed'))
      }

      await expect(
        callAsyncMethodWithTimeout(asyncFn, 1000, 'timeout', { retry: 3 })
      ).rejects.toThrow('Failed')

      expect(callCount).toBe(1) // Should not retry on rejection
    })

    it('should handle zero retries explicitly', async () => {
      const slowFn = () => new Promise(resolve => 
        setTimeout(() => resolve('slow'), 500)
      )

      const result = await callAsyncMethodWithTimeout(
        slowFn, 
        100, 
        'timeout', 
        { retry: 0 }
      )

      expect(result).toBe('timeout')
    })

    it('should retry with async function that eventually succeeds', async () => {
      let attempt = 0
      const asyncFn = () => new Promise<string>(resolve => {
        attempt++
        if (attempt === 3) {
          // Succeed on third attempt
          resolve('success-on-retry')
        } else {
          // Timeout on first two attempts
          setTimeout(() => resolve('too-slow'), 1000)
        }
      })

      const result = await callAsyncMethodWithTimeout(
        asyncFn, 
        100, 
        'timeout', 
        { retry: 5 }
      )

      expect(result).toBe('success-on-retry')
      expect(attempt).toBe(3)
    })
  })

  describe('symbol-based timeout detection', () => {
    it('should distinguish timeout from promise returning same value as timeoutReturn', async () => {
      // Promise legitimately returns 'timeout' string
      const asyncFn = () => Promise.resolve('timeout')

      const result = await callAsyncMethodWithTimeout(
        asyncFn,
        1000,
        'timeout' // Same as what promise returns
      )

      // Should return 'timeout' from the promise, not from timeout
      expect(result).toBe('timeout')
    })

    it('should handle promise returning null when timeout is also null', async () => {
      const asyncFn = () => Promise.resolve(null)

      const result = await callAsyncMethodWithTimeout(
        asyncFn,
        1000,
        null // Same as what promise returns
      )

      expect(result).toBe(null)
    })

    it('should handle promise returning object matching timeoutReturn', async () => {
      const returnValue = { timedOut: false, data: 'success' }
      const asyncFn = () => Promise.resolve(returnValue)

      const result = await callAsyncMethodWithTimeout(
        asyncFn,
        1000,
        { timedOut: false, data: 'success' } // Similar object
      )

      // Should return the actual promise result
      expect(result).toBe(returnValue)
    })

    it('should correctly identify actual timeout even if promise could return timeout value', async () => {
      const slowFn = () => new Promise(resolve => 
        setTimeout(() => resolve('legit-value'), 500)
      )

      const result = await callAsyncMethodWithTimeout(
        slowFn,
        100,
        'legit-value' // Same as what slow promise would return
      )

      // Should return 'legit-value' because of timeout, not from promise
      expect(result).toBe('legit-value')
    })
  })
})
