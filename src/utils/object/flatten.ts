
export const flattenObject = (
  obj: Record<string, any>,
  parentKey: string = '',
  separator: string = '.'
): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const newKey = parentKey ? `${parentKey}${separator}${key}` : key;
    const value = obj[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(result, flattenObject(value, newKey, separator));
    } else {
      // For primitives, arrays, null, undefined, etc. - keep as-is
      result[newKey] = value;
    }
  }

  return result;
};