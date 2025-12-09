export const convertMillisToSeconds = (time: number) =>{
  return (time/ 1000).toFixed(2);
}

export const measureTime = async <CALLBACK extends () => unknown>(
  callback :CALLBACK
): Promise<{elapsedTime: number, result:ReturnType<CALLBACK>}> =>{
  const startTimeInMillis = Date.now();
  const result = await callback()
  const elapsedTime = Date.now() - startTimeInMillis;
  return { elapsedTime, result } as any
}

