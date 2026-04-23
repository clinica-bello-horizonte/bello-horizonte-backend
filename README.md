# Clínica Bello Horizonte — API REST (Backend)

API REST desarrollada en **NestJS** para la aplicación móvil de la Clínica Privada Bello Horizonte (Piura, Perú).  
Gestiona autenticación, citas médicas, médicos, especialidades e historial clínico de pacientes.

---

## Tecnologías

| Componente | Tecnología |
|-----------|-----------|
| Framework | NestJS 10 |
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 5 |
| Autenticación | JWT (access + refresh tokens) via Passport |
| Cifrado | bcrypt (10 rondas de sal) |
| Validación | class-validator + class-transformer |
| Documentación | Swagger / OpenAPI en `/api/docs` |

---

## Instalación

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/clinica-bello-horizonte/bello-horizonte-backend.git
cd bello-horizonte-backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores correctos:

```env
DATABASE_URL="postgresql://usuario:contrasena@localhost:5432/bello_horizonte"
JWT_SECRET="clave_secreta_jwt"
JWT_REFRESH_SECRET="clave_secreta_refresh"
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
PORT=3000
NODE_ENV=development
```

### 3. Iniciar PostgreSQL con Docker

```bash
docker --context desktop-linux compose up -d
```

> También puedes usar PostgreSQL instalado localmente ajustando `DATABASE_URL` en `.env`.

### 4. Ejecutar migraciones y seed

```bash
npx prisma migrate deploy   # aplica migraciones
npx prisma db seed          # carga datos iniciales
```

El seed crea:
- 12 especialidades médicas
- 15 médicos con nombres peruanos
- 1 usuario demo (rol: USER)
- 1 usuario administrador (rol: ADMIN)
- 3 registros de historial para el usuario demo

### 5. Iniciar el servidor

```bash
npm run start:dev
```

Servidor disponible en: `http://localhost:3000`  
Documentación Swagger en: `http://localhost:3000/api/docs`

---

## Endpoints principales

### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | No | Login con DNI o correo |
| POST | `/api/v1/auth/register` | No | Registro de nuevo paciente |
| POST | `/api/v1/auth/logout` | JWT | Cerrar sesión |
| POST | `/api/v1/auth/refresh` | Refresh JWT | Renovar tokens |
| GET | `/api/v1/auth/me` | JWT | Obtener usuario autenticado |

### Usuarios

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| PATCH | `/api/v1/users/profile` | JWT | Actualizar perfil (nombre, teléfono, fecha de nacimiento) |

### Especialidades

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/v1/specialties` | No | Listar todas las especialidades |
| GET | `/api/v1/specialties/:id` | No | Detalle de especialidad (incluye médicos) |

### Médicos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/v1/doctors` | No | Listar médicos (`?search=nombre&specialtyId=uuid`) |
| GET | `/api/v1/doctors/:id` | No | Detalle de médico |
| PATCH | `/api/v1/doctors/:id` | JWT (ADMIN) | Actualizar datos de médico |

### Citas médicas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/v1/appointments` | JWT | Todas las citas del usuario |
| GET | `/api/v1/appointments/upcoming` | JWT | Próximas citas (PENDING/CONFIRMED) |
| GET | `/api/v1/appointments/booked-slots?doctorId=&date=` | JWT | Slots ocupados para un médico en una fecha |
| GET | `/api/v1/appointments/:id` | JWT | Detalle de una cita |
| POST | `/api/v1/appointments` | JWT | Crear nueva cita |
| PATCH | `/api/v1/appointments/:id/cancel` | JWT | Cancelar cita |
| PATCH | `/api/v1/appointments/:id/reschedule` | JWT | Reprogramar cita |

### Historial médico

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/v1/patient-records` | JWT | Historial del paciente autenticado |
| GET | `/api/v1/patient-records/:id` | JWT | Detalle de un registro clínico |

---

## Formato de respuesta

### Éxito
```json
{
  "success": true,
  "data": { "..." },
  "timestamp": "2026-04-23T10:30:00.000Z"
}
```

### Error
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Descripción del error",
  "timestamp": "2026-04-23T10:30:00.000Z",
  "path": "/api/v1/endpoint"
}
```

---

## Flujo de autenticación

1. `POST /auth/login` → recibe `{ accessToken, refreshToken, user }`
2. Enviar `Authorization: Bearer <accessToken>` en cada petición protegida
3. Al expirar el access token (15 min) → `POST /auth/refresh` con el refresh token como Bearer
4. Se devuelven nuevos tokens (rotación automática)
5. `POST /auth/logout` invalida el refresh token en base de datos

---

## Scripts disponibles

```bash
npm run start:dev      # Servidor en modo desarrollo (hot reload)
npm run build          # Compilar TypeScript
npm run start:prod     # Iniciar versión compilada
npm run db:migrate     # Ejecutar migraciones pendientes
npm run db:generate    # Generar cliente Prisma
npm run db:seed        # Poblar base de datos con datos de prueba
npm run db:studio      # Abrir Prisma Studio (interfaz visual de BD)
npm run db:reset       # Reiniciar BD y re-ejecutar migraciones (DESTRUCTIVO)
```

---

## Credenciales de prueba

| Rol | Correo | DNI | Contraseña |
|-----|--------|-----|-----------|
| Paciente | demo@bellohorizonte.pe | 00000000 | demo123 |
| Administrador | admin@bellohorizonte.pe | 11111111 | admin123 |

---

## Contribución

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para conocer el flujo de trabajo Scrum, convenciones de ramas y formato de commits.
