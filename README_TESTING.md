# Testing en Virtual Pet - Depósito

Este proyecto utiliza **Vitest** junto con **React Testing Library** para asegurar la calidad del código y la estabilidad de las funcionalidades del depósito.

## 🚀 Cómo ejecutar los tests

### 1. Ejecutar todos los tests (Modo Watch)
Ideal para el desarrollo diario. Los tests se vuelven a ejecutar automáticamente cuando guardas un archivo.
```bash
npm test
```

### 2. Ejecutar una sola vez
Útil para entornos de CI/CD o verificaciones rápidas.
```bash
npm test -- --run
```

### 3. Ver reporte de cobertura (Coverage)
Para ver qué porcentaje del código está cubierto por tests.
```bash
npm test -- --coverage
```
*(Nota: La primera vez te pedirá instalar `@vitest/coverage-v8`)*

---

## 🏗️ Estructura de Tests

Los archivos de test se encuentran junto a los archivos de código fuente, siguiendo la convención `.test.js` o `.test.jsx`.

### Áreas cubiertas actualmente:
- **Componentes (`src/components/`)**: Pruebas de renderizado y eventos de usuario (ej: `OrderCard`).
- **Hooks (`src/hooks/`)**: Lógica de negocio y efectos (ej: `useOrderBoard`, `useCourierSimulation`).
- **Stores (`src/store/`)**: Estado global y persistencia (ej: `authStore`).
- **Páginas (`src/pages/`)**: Flujos completos de usuario (ej: `Login`).

---

## 🛠️ Herramientas utilizadas

- **[Vitest](https://vitest.dev/)**: Framework de testing nativo para Vite.
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)**: Para testear componentes desde la perspectiva del usuario.
- **[jsdom](https://github.com/jsdom/jsdom)**: Simulación del navegador en Node.js.

---

## 💡 Buenas Prácticas al agregar nuevos tests

1. **Nombre del archivo**: Si tu archivo es `MiComponente.jsx`, crea `MiComponente.test.jsx`.
2. **Mocks de API**: Utiliza el mock global de `src/services/api` para evitar llamadas reales al servidor.
3. **Mocks de DnD**: Para componentes que usan `@hello-pangea/dnd`, utiliza el helper `renderWithDnD` (puedes verlo de ejemplo en `OrderCard.test.jsx`).
4. **Timers**: Si el código usa `setTimeout` o `setInterval`, usa `vi.useFakeTimers()` como se muestra en `useCourierSimulation.test.js`.
