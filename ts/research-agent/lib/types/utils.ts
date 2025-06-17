// lib/types/utils.ts
export const isValidDate = (date: Date): boolean => !isNaN(date.getTime());

export const parseDate = (dateString: string): Date | null => {
  const date = new Date(dateString);
  if (isValidDate(date)) return date;
  
  const formats = [
    {
      regex: /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      parser: (match: RegExpMatchArray) =>
        new Date(+match[1], +match[2] - 1, +match[3]),
    },
    {
      regex: /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
      parser: (match: RegExpMatchArray) =>
        new Date(+match[3], +match[1] - 1, +match[2]),
    },
    {
      regex: /(\w+)\s(\d{1,2}),\s(\d{4})/, // Month DD, YYYY
      parser: (match: RegExpMatchArray) =>
        new Date(`${match[1]} ${match[2]}, ${match[3]}`),
    },
  ];
  
  const parsedDate = formats
    .map(({ regex, parser }) => {
      const match = dateString.match(regex);
      if (match) {
        const date = parser(match);
        return isValidDate(date) ? date : null;
      }
      return null;
    })
    .find((date): date is Date => date !== null);
    
  return parsedDate || null;
};

export const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};