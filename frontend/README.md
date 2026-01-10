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

## 🚀 Desarrollo Local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 3. Build para producción

```bash
npm run build
```

Los archivos estáticos se generarán en la carpeta `dist/`.

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

## 🤝 Guías de Estilo

- Usamos **TailwindCSS** para todo el estilizado.
- Componentes funcionales con **Hooks**.
- **Mobile-First**: Siempre verifica el diseño en resoluciones móviles.
