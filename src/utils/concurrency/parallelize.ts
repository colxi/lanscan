/**
 * Concurrency control utilities
 */

/**
 * Execute tasks with limited concurrency
 */
export async function parallelize<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const promise = Promise.resolve()
      .then(() => fn(item))
      .then((result) => {
        results.push(result);
      })
      .catch((error) => {
        // Log error but don't stop execution
        console.error('Error in parallelLimit task:', error);
        // Push a null result to maintain array size
        results.push(null as any);
      });
    
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      const completedIndex = executing.findIndex((p) => {
        // Find first resolved promise
        return p === promise;
      });
      if (completedIndex !== -1) {
        executing.splice(completedIndex, 1);
      }
    }
  }
  
  await Promise.allSettled(executing);
  return results;
}

