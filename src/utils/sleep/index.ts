export const sleep = async (timeInMIllis: number) => {
  await new Promise(resolve => setTimeout(resolve, timeInMIllis));
}
    