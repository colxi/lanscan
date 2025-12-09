import { sleep } from '../sleep'

// Internal symbol to identify timeout (not exposed to user)
const TIMEOUT_SYMBOL = Symbol('promiseTimeout');

export const callAsyncMethodWithTimeout = async <
  PROMISE_RETURN extends unknown,
  TIMEOUT_RETURN extends unknown
>( 
  asyncFn: () => Promise<PROMISE_RETURN>, 
  timeoutInMillis: number, 
  timeoutReturn: TIMEOUT_RETURN,
  { retry= 0, delay= 0 }: Partial<{  retry: number, delay: number }> = {}
): Promise<PROMISE_RETURN | TIMEOUT_RETURN> => {
  const maxAttempts = retry + 1; // retries + initial attempt
  let currentAttempt = 0;

  while (currentAttempt < maxAttempts) {
    const promise = asyncFn()
    let timeoutId: NodeJS.Timeout
    
    const timeoutPromise = new Promise<typeof TIMEOUT_SYMBOL>((resolve) => {
      timeoutId = setTimeout(() => resolve(TIMEOUT_SYMBOL), timeoutInMillis);
    })

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      
      // Check if result is the internal timeout symbol, and If we have more attempts,
      // continue the loop, otherwise return the user's timeout value
      if (result === TIMEOUT_SYMBOL) {
        currentAttempt++
        if (currentAttempt < maxAttempts) {
          if(delay) await sleep(delay)
          continue
        }
        return timeoutReturn
      }
      
      // Promise resolved successfully
      return result as PROMISE_RETURN;
    } catch (error) {
      // If promise rejects, throw immediately (don't retry rejections)
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  throw new Error('[promiseWithTimeout]: Something went wrong')
}





