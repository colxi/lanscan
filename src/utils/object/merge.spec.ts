import { mergeObjects } from './merge'

describe('object utilities', () => {
  describe('mergeObjects', () => {
    it('should merge two objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { c: 3, d: 4 }
      const result = mergeObjects(obj1, obj2)
      
      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 })
      
      // Type inference test (TypeScript will catch if this is wrong)
      const _a: number = result.a
      const _b: number = result.b
      const _c: number = result.c
      const _d: number = result.d
    })

    it('should merge three objects', () => {
      const obj1 = { a: 1 }
      const obj2 = { b: 2 }
      const obj3 = { c: 3 }
      const result = mergeObjects(obj1, obj2, obj3)
      
      expect(result).toEqual({ a: 1, b: 2, c: 3 })
      
      // Type inference test
      const _a: number = result.a
      const _b: number = result.b
      const _c: number = result.c
    })

    it('should merge many objects', () => {
      const result = mergeObjects(
        { a: 1 },
        { b: 2 },
        { c: 3 },
        { d: 4 },
        { e: 5 }
      )
      
      expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4, e: 5 })
      
      // Type inference test
      const _a: number = result.a
      const _e: number = result.e
    })

    it('should override properties with later objects taking priority', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { b: 20, c: 3 }
      const obj3 = { c: 30, d: 4 }
      const result = mergeObjects(obj1, obj2, obj3)
      
      expect(result).toEqual({ a: 1, b: 20, c: 30, d: 4 })
      
      // Type inference - all keys should be available
      const _a: number = result.a
      const _b: number = result.b
      const _c: number = result.c
      const _d: number = result.d
    })

    it('should handle single object', () => {
      const obj = { a: 1, b: 2 }
      const result = mergeObjects(obj)
      
      expect(result).toEqual({ a: 1, b: 2 })
      
      // Type inference
      const _a: number = result.a
      const _b: number = result.b
    })

    it('should handle empty objects', () => {
      const result = mergeObjects({}, { a: 1 }, {})
      
      expect(result).toEqual({ a: 1 })
      
      // Type inference
      const _a: number = result.a
    })

    it('should merge all empty objects', () => {
      const result = mergeObjects({}, {}, {})
      
      expect(result).toEqual({})
    })

    it('should preserve last value when same key in multiple objects', () => {
      const result = mergeObjects(
        { name: 'first' },
        { name: 'second' },
        { name: 'third' }
      )
      
      expect(result).toEqual({ name: 'third' })
      
      // Type inference
      const _name: string = result.name
    })

    it('should handle complex nested objects', () => {
      const result = mergeObjects(
        { a: 1, nested: { x: 1 } },
        { b: 2, nested: { y: 2 } },
        { c: 3 }
      )
      
      // Deep merge - nested objects are merged, not replaced
      expect(result).toEqual({ a: 1, b: 2, c: 3, nested: { x: 1, y: 2 } })
      
      // Type inference
      const _a: number = result.a
      const _b: number = result.b
      const _c: number = result.c
    })

    it('should deeply merge nested objects multiple levels', () => {
      const result = mergeObjects(
        { 
          level1: { 
            level2: { 
              a: 1, 
              b: 2 
            } 
          } 
        },
        { 
          level1: { 
            level2: { 
              b: 20, 
              c: 3 
            },
            other: 'value'
          } 
        }
      )
      
      expect(result).toEqual({
        level1: {
          level2: { a: 1, b: 20, c: 3 },
          other: 'value'
        }
      })
    })

    it('should override primitive values in nested objects', () => {
      const result = mergeObjects(
        { config: { port: 3000, host: 'localhost' } },
        { config: { port: 8080 } }
      )
      
      expect(result).toEqual({
        config: { port: 8080, host: 'localhost' }
      })
    })

    it('should handle arrays as values (replace, not merge)', () => {
      const result = mergeObjects(
        { arr: [1, 2, 3] },
        { arr: [4, 5] }
      )
      
      // Arrays are replaced, not merged
      expect(result).toEqual({ arr: [4, 5] })
    })

    it('should deeply merge with three or more objects', () => {
      const result = mergeObjects(
        { a: 1, nested: { x: 1 } },
        { b: 2, nested: { y: 2 } },
        { c: 3, nested: { z: 3 } }
      )
      
      expect(result).toEqual({
        a: 1,
        b: 2,
        c: 3,
        nested: { x: 1, y: 2, z: 3 }
      })
    })

    it('should handle null and undefined values', () => {
      const result = mergeObjects(
        { a: 1, b: null, c: undefined },
        { b: 2, d: null }
      )
      
      expect(result).toEqual({ a: 1, b: 2, c: undefined, d: null })
    })

    it('should deeply merge complex real-world scenario', () => {
      const defaults = {
        server: {
          host: 'localhost',
          port: 3000,
          ssl: {
            enabled: false,
            cert: 'default.crt'
          }
        },
        database: {
          host: 'localhost',
          port: 5432
        }
      }
      
      const userConfig = {
        server: {
          port: 8080,
          ssl: {
            enabled: true
          }
        }
      }
      
      const result = mergeObjects(defaults, userConfig)
      
      expect(result).toEqual({
        server: {
          host: 'localhost',
          port: 8080,
          ssl: {
            enabled: true,
            cert: 'default.crt'
          }
        },
        database: {
          host: 'localhost',
          port: 5432
        }
      })
    })

    it('should infer mixed types correctly', () => {
      const result = mergeObjects(
        { num: 42 },
        { str: 'hello' },
        { bool: true },
        { arr: [1, 2, 3] }
      )
      
      expect(result).toEqual({ num: 42, str: 'hello', bool: true, arr: [1, 2, 3] })
      
      // Type inference for different types
      const _num: number = result.num
      const _str: string = result.str
      const _bool: boolean = result.bool
      const _arr: number[] = result.arr
    })
  })
})

