export function normalizeNumberText(text: string) {
  return text.replace(/^(-?)0+(?=\d)/, '$1');
}
