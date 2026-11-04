export const cellValue = <Row extends object,>(row: Row, id: string): unknown => row[id as keyof Row];
export const cellText = (value: unknown): string | number => value == null ? '' : typeof value === 'number' ? value : Array.isArray(value) ? value.join(', ') : String(value);

export const filterTableData = <Row extends object,>(data: Row[], filters: Record<string, string[]>): Row[] => data.filter(row => Object.entries(filters).every(([key, selected]) => selected.includes(String(cellText(cellValue(row, key))))));

