# 🎨 Finanzas Pro - Frontend

> **Interfaz moderna y responsiva** construida con React, TypeScript y TailwindCSS.

Esta carpeta contiene el código fuente del cliente web (SPA).

## 🛠️ Stack Tecnológico

- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [TailwindCSS v4](https://tailwindcss.com/)
- **Estado/Data**: [TanStack Query](https://tanstack.com/query/latest)
- **Routing**: [React Router](https://reactrouter.com/)

---

## 🔐 Variables de Entorno

> 📘 **Documentación completa en [README principal](../README.md#-variables-de-entorno)**

### Configuración Rápida

```bash
# Copiar plantilla (valores de desarrollo listos para usar)
cp .env.example .env
```

| Variable                    | Desarrollo                  | Producción |
| :-------------------------- | :-------------------------- | :--------- |
| `VITE_API_URL`              | `http://localhost:4000/api` | `/api`     |
| `VITE_GOOGLE_GENAI_API_KEY` | (opcional)                  | (opcional) |

---

## 🚀 Desarrollo Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 4. Build para producción

```bash
npm run build
```

Los archivos estáticos se generarán en la carpeta `dist/`.

---

## 🔧 Comandos Útiles

| Comando           | Descripción                           |
| :---------------- | :------------------------------------ |
| `npm run dev`     | Servidor de desarrollo con hot-reload |
| `npm run build`   | Build de producción                   |
| `npm run preview` | Previsualiza el build de producción   |
| `npm run lint`    | Ejecuta ESLint                        |

---

## 📂 Estructura de Directorios

```
src/
├── assets/       # Imágenes, fuentes y estilos globales
├── components/   # Componentes reutilizables (Botones, Inputs, Modales)
├── hooks/        # Custom Hooks (Lógica reutilizable)
├── layouts/      # Estructuras de página (Layout Principal, Auth)
├── pages/        # Vistas principales (Dashboard, Login, Perfil)
├── services/     # Llamadas a la API (Axios/Fetch)
├── types/        # Definiciones de tipos TypeScript
└── utils/        # Funciones de utilidad y helpers
```

---

## 🎨 Guías de Estilo

- Usamos **TailwindCSS** para todo el estilizado.
- Componentes funcionales con **Hooks**.
- **Mobile-First**: Siempre verifica el diseño en resoluciones móviles.

---

## 🔗 Ver También

- [📖 README Principal](../README.md) - Documentación completa del proyecto
- [🔐 Variables de Entorno](../README.md#-variables-de-entorno) - Configuración detallada
- [🐳 Docker Compose](../README.md#-opciones-de-docker-compose) - Opciones de despliegue
