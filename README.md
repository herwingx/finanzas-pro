# 💰 Finanzas Pro

Una aplicación moderna de gestión financiera personal construida con React, TypeScript y Vite. Diseñada con las mejores prácticas de desarrollo y una interfaz de usuario premium.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6.svg)

## ✨ Características

- 📊 **Dashboard Interactivo**: Visualiza tu balance total y resumen mensual
- 💸 **Gestión de Transacciones**: Registra ingresos y gastos fácilmente
- 📈 **Reportes Visuales**: Gráficos de pastel y barras para análisis de gastos
- 💰 **Presupuestos**: Establece y monitorea límites de gasto por categoría
- 🏷️ **Categorías Personalizables**: Organiza tus transacciones
- 🤖 **IA Integrada**: Sugerencias automáticas de categorías con Gemini AI
- 💾 **Almacenamiento Local**: Todos tus datos se guardan localmente en tu navegador
- 🎨 **Diseño Moderno**: Interfaz premium con paleta de colores vibrante
- 📱 **Responsive**: Optimizado para móviles y escritorio

## 🎨 Paleta de Colores

La aplicación utiliza una moderna paleta de colores púrpura/azul:

- **Primary**: `hsl(250, 84%, 54%)` - Púrpura vibrante
- **Secondary**: `hsl(200, 98%, 48%)` - Azul brillante
- **Accent**: `hsl(280, 100%, 70%)` - Magenta claro
- **Success**: `hsl(142, 76%, 56%)` - Verde éxito
- **Danger**: `hsl(0, 84%, 60%)` - Rojo peligro
- **Background**: `hsl(240, 18%, 8%)` - Oscuro profundo

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn

### Instalación

1. **Clona el repositorio** (si aún no lo has hecho):
```bash
git clone <tu-repositorio>
cd finanzas-pro
```

2. **Instala las dependencias**:
```bash
npm install
```

3. **Inicia el servidor de desarrollo**:
```bash
npm run dev
```

4. **Abre tu navegador** en `http://localhost:5173`

¡Eso es todo! La aplicación debería estar corriendo.

## 📦 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

## 🏗️ Estructura del Proyecto

```
finanzas-pro/
├── components/          # Componentes reutilizables
│   └── BottomNav.tsx   # Navegación inferior
├── pages/              # Páginas de la aplicación
│   ├── Dashboard.tsx   # Panel principal
│   ├── NewTransaction.tsx
│   ├── Categories.tsx
│   ├── Reports.tsx
│   ├── Budgets.tsx
│   └── History.tsx
├── services/           # Lógica de negocio
│   ├── storageService.ts  # Gestión de localStorage
│   └── geminiService.ts   # Integración con IA
├── App.tsx            # Componente principal
├── index.tsx          # Punto de entrada
├── index.css          # Estilos globales
├── types.ts           # Definiciones de TypeScript
├── constants.ts       # Constantes y datos por defecto
└── index.html         # HTML principal

```

## 🔧 Tecnologías Utilizadas

- **React 19.2.0** - Biblioteca de UI
- **TypeScript 5.8.2** - Tipado estático
- **Vite 6.2.0** - Build tool y dev server
- **React Router DOM 7.9.6** - Enrutamiento
- **Recharts 3.5.1** - Gráficos y visualizaciones
- **Tailwind CSS** - Framework de CSS (vía CDN)
- **Google Gemini AI** - Sugerencias inteligentes
- **LocalStorage API** - Persistencia de datos

## 💾 Gestión de Datos

### LocalStorage

La aplicación utiliza localStorage para persistir datos:

- **Transacciones**: Ingresos y gastos
- **Categorías**: Categorías personalizadas
- **Presupuestos**: Límites de gasto

### Estructura de Datos

```typescript
// Transacción
{
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // ISO string
  type: 'expense' | 'income';
}

// Categoría
{
  id: string;
  name: string;
  icon: string; // Material Icons
  color: string; // HSL color
  type: 'expense' | 'income';
}

// Presupuesto
{
  categoryId: string;
  limit: number;
}
```

### Funciones Disponibles

El `StorageService` proporciona:

- `getTransactions()` / `saveTransaction()` / `updateTransaction()` / `deleteTransaction()`
- `getCategories()` / `saveCategory()` / `updateCategory()` / `deleteCategory()`
- `getBudgets()` / `saveBudget()` / `updateBudget()` / `deleteBudget()`
- `exportData()` / `importData()` / `clearAllData()`
- `subscribe()` - Sistema de eventos para actualizaciones reactivas

## 🤖 Integración con IA

La aplicación incluye integración con Google Gemini AI para sugerir categorías automáticamente basándose en la descripción de la transacción.

**Nota**: Para usar esta función, necesitas configurar tu API key en `.env.local`:

```env
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

## 🎯 Mejores Prácticas Implementadas

### Código

- ✅ TypeScript para type safety
- ✅ Componentes funcionales con hooks
- ✅ Separación de concerns (UI, lógica, datos)
- ✅ Manejo de errores en localStorage
- ✅ Sistema de eventos para actualizaciones reactivas

### UI/UX

- ✅ Diseño responsive mobile-first
- ✅ Animaciones suaves y micro-interacciones
- ✅ Feedback visual en todas las acciones
- ✅ Paleta de colores moderna y accesible
- ✅ Iconos Material Design
- ✅ Glassmorphism y gradientes

### Performance

- ✅ Lazy loading de rutas
- ✅ Optimización de re-renders
- ✅ Vite para builds rápidos
- ✅ CSS modular

## 🐛 Solución de Problemas

### La aplicación no inicia

```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Los datos no se guardan

- Verifica que tu navegador permita localStorage
- Revisa la consola del navegador para errores
- Intenta limpiar los datos: abre DevTools → Application → Local Storage

### Errores de TypeScript

```bash
# Reinstala las dependencias de tipos
npm install --save-dev @types/node
```

## 📱 Uso de la Aplicación

### Agregar una Transacción

1. Haz clic en "Gasto" o "Ingreso" en el dashboard
2. Ingresa el monto y descripción
3. Selecciona una categoría (o usa IA para sugerencia)
4. Elige la fecha
5. Guarda la transacción

### Ver Reportes

1. Ve a la pestaña "Reportes"
2. Visualiza gráficos de pastel con distribución de gastos
3. Revisa las categorías principales

### Gestionar Presupuestos

1. Ve a "Presupuestos"
2. Revisa el progreso de cada categoría
3. Los presupuestos se comparan con gastos totales

## 🔐 Privacidad

- ✅ Todos los datos se almacenan localmente en tu navegador
- ✅ No se envía información a servidores externos (excepto IA si está configurada)
- ✅ Tú tienes control total de tus datos

## 🚧 Roadmap

- [ ] Exportar/Importar datos en JSON
- [ ] Múltiples cuentas bancarias
- [ ] Transferencias entre cuentas
- [ ] Modo claro/oscuro
- [ ] PWA (Progressive Web App)
- [ ] Sincronización en la nube (opcional)
- [ ] Notificaciones de presupuesto
- [ ] Filtros avanzados en historial

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 👨‍💻 Autor

Desarrollado con ❤️ por el equipo de Finanzas Pro

---

**¿Preguntas o problemas?** Abre un issue en el repositorio.
