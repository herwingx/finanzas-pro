# 🤝 Guía de Contribución

> **Construyamos Juntos** — Estándares y procesos para colaborar efectivamente en el proyecto.

¡Gracias por tu interés en contribuir a Finanzas Pro! Este documento explica cómo puedes ayudar a mejorar el proyecto.

---

## 📋 Tabla de Contenidos

- [Código de Conducta](#-código-de-conducta)
- [¿Cómo puedo contribuir?](#-cómo-puedo-contribuir)
- [Configuración del entorno](#-configuración-del-entorno)
- [Flujo de trabajo](#-flujo-de-trabajo)
- [Guía de estilo](#-guía-de-estilo)
- [Pull Requests](#-pull-requests)

---

## 📜 Código de Conducta

Este proyecto sigue un código de conducta inclusivo y respetuoso. Por favor:

- Sé respetuoso con otros contribuidores
- Acepta críticas constructivas
- Enfócate en lo mejor para la comunidad
- Muestra empatía hacia otros miembros

---

## 🎯 ¿Cómo puedo contribuir?

### 🐛 Reportar Bugs

1. Verifica que el bug no haya sido reportado antes en [Issues](https://github.com/herwingx/finanzas-pro/issues)
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducirlo
   - Comportamiento esperado vs actual
   - Capturas de pantalla (si aplica)
   - Versión del navegador/sistema

### 💡 Sugerir Funcionalidades

1. Abre un issue con la etiqueta `enhancement`
2. Describe la funcionalidad y por qué sería útil
3. Incluye mockups o ejemplos si es posible

### 🔧 Contribuir Código

1. Busca issues etiquetados como `good first issue` para comenzar
2. Comenta en el issue que quieres trabajar en él
3. Sigue el flujo de trabajo descrito abajo

---

## 🛠️ Configuración del entorno

### Requisitos

- Node.js 18+
- Docker y Docker Compose
- Git

### Paso 1: Fork y clonar

```bash
# Fork el repositorio en GitHub, luego:
git clone https://github.com/TU_USUARIO/finanzas-pro.git
cd finanzas-pro
```

### Paso 2: Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
```

Edita `backend/.env`:
```env
DATABASE_URL="postgresql://finanzas:finanzas123@localhost:5432/finanzas_pro"
JWT_SECRET="desarrollo-local-secret"
PORT=4000
```

### Paso 3: Iniciar base de datos

```bash
docker run -d --name finanzas-db \
  -e POSTGRES_USER=finanzas \
  -e POSTGRES_PASSWORD=finanzas123 \
  -e POSTGRES_DB=finanzas_pro \
  -p 5432:5432 \
  postgres:16-alpine
```

### Paso 4: Instalar dependencias

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### Paso 5: Iniciar en modo desarrollo

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Accede a http://localhost:5173

---

## 🔄 Flujo de trabajo

### 1. Sincronizar con el repositorio original

```bash
# Agregar upstream (solo la primera vez)
git remote add upstream https://github.com/herwingx/finanzas-pro.git

# Sincronizar
git checkout main
git fetch upstream
git merge upstream/main
```

### 2. Crear una rama

```bash
# Nomenclatura de ramas
git checkout -b feat/nombre-feature    # Nueva funcionalidad
git checkout -b fix/nombre-bug         # Corrección de bug
git checkout -b docs/nombre-doc        # Documentación
git checkout -b refactor/nombre        # Refactorización
```

### 3. Hacer cambios

- Escribe código limpio y legible
- Agrega comentarios donde sea necesario
- Sigue la guía de estilo del proyecto

### 4. Commits

Usamos **Conventional Commits**:

```bash
# Formato
type(scope): descripción breve

# Ejemplos
feat(auth): agregar login con Google
fix(dashboard): corregir cálculo de balance
docs(readme): actualizar instrucciones de instalación
refactor(api): simplificar validación de usuarios
```

**Tipos permitidos:**
| Tipo       | Descripción                          |
| ---------- | ------------------------------------ |
| `feat`     | Nueva funcionalidad                  |
| `fix`      | Corrección de bug                    |
| `docs`     | Solo documentación                   |
| `style`    | Formato (sin cambios de lógica)      |
| `refactor` | Cambio de código sin nuevas features |
| `test`     | Agregar o corregir tests             |
| `chore`    | Tareas de build, dependencias        |

### 5. Push y Pull Request

```bash
git push origin feat/mi-feature
```

Luego crea un Pull Request en GitHub.

---

## 🎨 Guía de estilo

### TypeScript/JavaScript

- **Nombrado**: camelCase para variables/funciones, PascalCase para clases/componentes
- **Idioma del código**: Inglés
- **Indentación**: 2 espacios
- **Comillas**: Simples para strings
- **Punto y coma**: Sí

```typescript
// ✅ Correcto
const userName = 'John';
const getUserById = (id: string) => { ... };

// ❌ Incorrecto
const user_name = "John";
function GetUserById(id) { ... }
```

### React/Componentes

- Componentes funcionales con hooks
- Props tipadas con interfaces
- Archivos `.tsx` para componentes

```tsx
// ✅ Correcto
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button = ({ label, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{label}</button>;
};
```

### CSS/Tailwind

- Usar clases de Tailwind
- Para estilos complejos, crear componentes reutilizables
- Mantener consistencia con el diseño existente

### Backend/Express

- Controladores separados de rutas
- Validación de entrada
- Manejo de errores consistente

---

## 📝 Pull Requests

### Antes de enviar

- [ ] El código compila sin errores
- [ ] Sin `console.log` ni código de debug
- [ ] Documentación actualizada (si aplica)
- [ ] Commits siguen Conventional Commits

### Título del PR

```
feat(scope): descripción breve
```

### Descripción del PR

```markdown
## Descripción
Breve descripción de los cambios.

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo probarlo?
1. Paso 1
2. Paso 2

## Screenshots (si aplica)

## Checklist
- [ ] Mi código sigue las guías de estilo
- [ ] He probado mis cambios localmente
- [ ] He actualizado la documentación
```

---

## ❓ ¿Preguntas?

Si tienes dudas:
1. Revisa la [documentación](./docs/)
2. Busca en issues existentes
3. Abre un nuevo issue con la etiqueta `question`

---

¡Gracias por contribuir! 🎉
