export const INSTITUTION_NAME = 'Hospital Veterinario';
export const WAREHOUSE_NAME = 'Bodega Hospital Veterinario UNA';

// Keep stored location keys stable for existing stock and movements.
export function locationLabel(location: string): string {
  return /^bodega central(?: una)?$/i.test(location.trim()) ? WAREHOUSE_NAME : location;
}
