export const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export const isPositiveNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};
