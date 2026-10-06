export async function readAttachment(file: File, imageOnly = false): Promise<string> {
  if (!(imageOnly ? ['image/png', 'image/jpeg', 'image/webp'] : ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']).includes(file.type)) throw new Error('Selecciona un archivo PDF, PNG, JPG o WebP válido.');
  if (file.size > 1500000) throw new Error('El archivo debe pesar como máximo 1.5 MB.');
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('No se pudo leer el archivo.')); reader.readAsDataURL(file); });
}
