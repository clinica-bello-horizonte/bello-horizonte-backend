# Guía de Contribución — Clínica Bello Horizonte Backend

Este documento describe cómo trabajar en este proyecto siguiendo la metodología **Scrum** con GitHub.

---

## Metodología Scrum

### Roles del equipo

| Rol | Responsabilidad |
|-----|----------------|
| Product Owner | Define y prioriza el Product Backlog |
| Scrum Master | Facilita ceremonias, elimina impedimentos |
| Equipo de Desarrollo | Implementa endpoints, modelos de datos y lógica de negocio |

### Sprints

Cada sprint dura **2 semanas**. Los sprints están representados como **Milestones** en GitHub:

| Milestone | Fechas | Enfoque |
|-----------|--------|---------|
| Sprint 1 — Arquitectura y Autenticación | 26 abr – 9 may 2026 | JWT auth, registro, login, refresh tokens |
| Sprint 2 — Citas y Médicos | 10 – 23 may 2026 | CRUD citas, reprogramar, cancelar, médicos |
| Sprint 3 — Historial y Perfil | 24 may – 6 jun 2026 | Historial médico, actualización de perfil |
| Sprint 4 — Producción y Mejoras | 7 – 20 jun 2026 | Tests, CI/CD, despliegue en producción |

### Tipos de issues

| Etiqueta | Descripción |
|----------|-------------|
| `epic` | Módulo completo (ej: API de autenticación) |
| `task` | Tarea técnica concreta (ej: implementar endpoint) |
| `bug` | Comportamiento incorrecto de la API |
| `enhancement` | Mejora de un endpoint o funcionalidad existente |

---

## Flujo de trabajo con Git

### Convención de ramas

```
main          ← código estable, desplegado o listo para producción
develop       ← integración de features completas
feature/      ← nuevo endpoint o módulo (desde develop)
fix/          ← corrección de bug
hotfix/       ← corrección urgente en producción
```

**Formato de nombre de rama:**

```
feature/issue-<número>-descripcion-corta
fix/issue-<número>-descripcion-corta

Ejemplos:
feature/issue-7-crear-cita
fix/issue-10-validacion-slot-ocupado
```

### Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<módulo>): <descripción en imperativo>

Ejemplos:
feat(auth): implementar rotación de refresh tokens
fix(appointments): corregir validación de slot duplicado
feat(doctors): agregar filtro por especialidad en GET /doctors
test(auth): agregar tests de integración para login
```

| Tipo | Cuándo usarlo |
|------|--------------|
| `feat` | Nuevo endpoint o funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio de código sin alterar comportamiento externo |
| `test` | Añadir o modificar pruebas |
| `docs` | Solo documentación o Swagger |
| `chore` | Dependencias, configuración, migraciones |

---

## Proceso de desarrollo

### 1. Tomar un issue del sprint activo

- Ve al Milestone del sprint activo en GitHub
- Asígnate el issue antes de empezar
- Mueve el issue a **"In Progress"** en el tablero Scrum

### 2. Crear la rama

```bash
git checkout develop
git pull origin develop
git checkout -b feature/issue-7-crear-cita
```

### 3. Desarrollar con migraciones si corresponde

```bash
# Si cambiaste el schema de Prisma:
npx prisma migrate dev --name nombre_descriptivo
```

### 4. Probar el endpoint manualmente

```bash
npm run start:dev
# Probar en Swagger: http://localhost:3000/api/docs
```

### 5. Abrir Pull Request hacia `develop`

- Usa la plantilla de PR (se carga automáticamente)
- Referencia el issue con `Closes #7`
- Incluye evidencia de prueba (screenshot de Swagger o curl exitoso)
- Solicita revisión de al menos 1 compañero

### 6. Revisión de código (Code Review)

- Verificar validaciones de DTO
- Verificar manejo de errores (400, 401, 403, 404, 409)
- Verificar que las migraciones están incluidas

---

## Ceremonias Scrum

| Ceremonia | Frecuencia | Duración máx. |
|-----------|-----------|---------------|
| Sprint Planning | Inicio de cada sprint | 2 horas |
| Daily Standup | Cada día hábil | 15 minutos |
| Sprint Review | Final de cada sprint | 1 hora |
| Retrospectiva | Final de cada sprint | 1 hora |

---

## Definición de Terminado (DoD)

Un endpoint o tarea se considera **terminado** cuando:

- [ ] El endpoint responde correctamente con el formato `{ success, data, timestamp }`
- [ ] Los errores devuelven el código HTTP apropiado con mensaje descriptivo
- [ ] El endpoint aparece documentado en Swagger (`/api/docs`)
- [ ] Las migraciones de Prisma están incluidas en el commit
- [ ] El PR fue revisado y aprobado por al menos 1 persona
- [ ] El código fue mergeado a `develop`
- [ ] El issue está cerrado
