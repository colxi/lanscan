export const createArrayFromObjectKey = <
  ARRAY extends Record<PropertyKey, unknown>[], 
  KEY extends keyof ARRAY[number]
>(
  array: ARRAY, 
  key: KEY
) : Array<ARRAY[number][KEY]> =>{
  const items = []
  for(const item of array){
    items.push(item[key])
  }
  return items as any
}
