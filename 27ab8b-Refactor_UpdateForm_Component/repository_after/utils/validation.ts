export const isValidMongoId = (id: string): boolean => {
  const mongoIdRegex = /^[a-f\d]{24}$/i;
  return mongoIdRegex.test(id);
};

export const trimValue = (value: string): string => {
  return value.trim();
};

export const hasNonEmptyValue = (value: string): boolean => {
  return trimValue(value).length > 0;
};
