import { flattenObject } from './flatten'

describe('object utilities', () => {
  describe('flattenObject', () => {
    it('should flatten a simple nested object', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: 3
        }
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: 1,
        'b.c': 2,
        'b.d': 3
      })
    })

    it('should flatten deeply nested objects', () => {
      const obj = {
        a: 1,
        b: {
          c: {
            d: {
              e: 2
            }
          }
        }
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: 1,
        'b.c.d.e': 2
      })
    })

    it('should handle flat objects', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const result = flattenObject(obj)
      
      expect(result).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('should handle empty objects', () => {
      const result = flattenObject({})
      
      expect(result).toEqual({})
    })

    it('should preserve arrays as-is (not flatten them)', () => {
      const obj = {
        a: 1,
        b: [1, 2, 3]
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: 1,
        b: [1, 2, 3]
      })
    })

    it('should preserve arrays of objects as-is', () => {
      const obj = {
        users: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 }
        ]
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        users: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 }
        ]
      })
    })

    it('should handle null values', () => {
      const obj = {
        a: 1,
        b: null,
        c: {
          d: null
        }
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: 1,
        b: null,
        'c.d': null
      })
    })

    it('should handle undefined values', () => {
      const obj = {
        a: 1,
        b: undefined,
        c: {
          d: undefined
        }
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: 1,
        b: undefined,
        'c.d': undefined
      })
    })

    it('should use custom separator', () => {
      const obj = {
        a: 1,
        b: {
          c: 2
        }
      }
      const result = flattenObject(obj, '', '_')
      
      expect(result).toEqual({
        a: 1,
        'b_c': 2
      })
    })

    it('should handle complex real-world scenario', () => {
      const obj = {
        server: {
          host: 'localhost',
          port: 3000,
          ssl: {
            enabled: true,
            cert: 'default.crt'
          }
        },
        database: {
          host: 'localhost',
          port: 5432
        },
        features: ['auth', 'logging']
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        'server.host': 'localhost',
        'server.port': 3000,
        'server.ssl.enabled': true,
        'server.ssl.cert': 'default.crt',
        'database.host': 'localhost',
        'database.port': 5432,
        features: ['auth', 'logging']
      })
    })

    it('should handle mixed data types', () => {
      const obj = {
        str: 'hello',
        num: 42,
        bool: true,
        arr: [1, 2],
        nested: {
          obj: { key: 'value' }
        }
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        str: 'hello',
        num: 42,
        bool: true,
        arr: [1, 2],
        'nested.obj.key': 'value'
      })
    })

    it('should handle empty arrays', () => {
      const obj = {
        a: 1,
        b: []
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: 1,
        b: []
      })
    })

    it('should handle nested empty objects', () => {
      const obj = {
        a: 1,
        b: {
          c: {}
        }
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: 1
      })
    })

    it('should preserve boolean false', () => {
      const obj = {
        a: false,
        b: {
          c: false
        }
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: false,
        'b.c': false
      })
    })

    it('should preserve zero values', () => {
      const obj = {
        a: 0,
        b: {
          c: 0
        }
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: 0,
        'b.c': 0
      })
    })

    it('should preserve empty strings', () => {
      const obj = {
        a: '',
        b: {
          c: ''
        }
      }
      const result = flattenObject(obj)
      
      expect(result).toEqual({
        a: '',
        'b.c': ''
      })
    })
  })
})

