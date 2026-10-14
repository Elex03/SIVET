# SIVET

Frontend del Sistema de Inventario Veterinario: React, TypeScript, Vite y Axios.

## Desarrollo con API

Inicia el backend en `http://localhost:3000`. Configura `.env.local` con:

```env
VITE_API_URL=/api/v1
```

Ejecuta:

```sh
npm install
npm run dev -- --host 127.0.0.1
```

Abre `http://127.0.0.1:5173` y usa una cuenta real del backend. El servidor determina el rol al iniciar sesión. El proxy de Vite conecta `/api` con el backend local.

Para usar los JSON de muestra, deja `VITE_API_URL=` vacía y reinicia Vite. Las cuentas y datos de ese modo son independientes de la API.

## Verificación

```sh
npm test
npm run build
```

Los tests incluyen dominio local, contratos del adaptador y renovación de sesión. Las escrituras del adaptador se prueban con transporte simulado.

## Documentación

- [Integración API, recursos y límites de verificación](docs/INTEGRACION-API.md).
- [Contrato OpenAPI 1.3 utilizado](docs/api-openapi-integracion-1.3.json).
- [Revisión y prompt de backend anterior a la versión 1.3](docs/PROMPT-BACKEND-INTEGRACION.md).

En producción utiliza un reverse proxy `/api` o configura una URL absoluta de API con CORS autorizado. El proxy de Vite pertenece al entorno de desarrollo/preview.
