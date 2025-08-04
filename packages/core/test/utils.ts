export const delay = async (seconds: number) => {
  const { resolve, promise } = Promise.withResolvers<void>();
  setTimeout(resolve, seconds * 1000);
  await promise;
};
