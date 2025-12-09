/**
 * Deep merge multiple objects, with properties from later objects overriding earlier ones
 * Nested objects are merged recursively
 * 
 * @param objects - Objects to merge (later objects take priority)
 * @returns Deeply merged object with proper type inference
 */
export const mergeObjects = <T extends Record<string, any>[]>(
  ...objects: [...T]
): MergeObjects<T> => {
  return deepMerge({}, ...objects) as MergeObjects<T>;
};

/**
 * Helper function to perform deep merge
 */
const deepMerge = (target: any, ...sources: any[]): any => {
  if (!sources.length) return target;
  
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        // If target doesn't have this key, create an empty object
        if (!target[key]) {
          target[key] = {};
        }
        // Recursively merge nested objects
        deepMerge(target[key], source[key]);
      } else {
        // For primitives, arrays, etc., just assign
        target[key] = source[key];
      }
    }
  }
  
  // Continue with remaining sources
  return deepMerge(target, ...sources);
};

/**
 * Check if value is a plain object (not array, null, etc.)
 */
const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Helper type to merge multiple object types
 * Takes an array of object types and returns their intersection
 */
type MergeObjects<T extends readonly any[]> = T extends [infer First, ...infer Rest]
  ? First & MergeObjects<Rest>
  : unknown;

