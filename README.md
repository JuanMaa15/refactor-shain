# 🚀 SHAIN API - NestJS + PostgreSQL

Sistema de Gestión Financiera profesional construido con las últimas tecnologías.

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Testing](#testing)
- [Deployment](#deployment)
- [Arquitectura](#arquitectura)

## 🛠 Stack Tecnológico

- **Framework**: NestJS 11.x
- **Base de Datos**: PostgreSQL 16+
- **ORM**: Prisma 6.x
- **Autenticación**: JWT + Passport
- **Validación**: class-validator
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest
- **TypeScript**: 5.7+

## 📦 Requisitos

- Node.js >= 20.x
- PostgreSQL >= 16.x
- npm >= 10.x

## 🚀 Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd shain-nestjs

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Configurar variables de entorno (ver sección Configuración)
nano .env
```

## ⚙️ Configuración

### 1. Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb shain

# Actualizar DATABASE_URL en .env
DATABASE_URL="postgresql://user:password@localhost:5432/shain"
```

### 2. Prisma

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio
npm run prisma:studio
```

### 3. Variables de Entorno

Ver `.env.example` para todas las variables requeridas.

**Variables Críticas:**
- `DATABASE_URL` - Conexión a PostgreSQL
- `JWT_SECRET` - Secret para tokens JWT
- `ALLOWED_FRONTEND_URL` - URL del frontend

## 💻 Desarrollo

```bash
# Modo desarrollo (hot reload)
npm run start:dev

# Modo debug
npm run start:debug
```

La API estará disponible en:
- **API**: http://localhost:3000/api
- **Documentación**: http://localhost:3000/api/docs

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:cov

# Tests E2E
npm run test:e2e
```

## 📁 Arquitectura

```
src/
├── common/              # Código compartido
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Exception filters
│   ├── guards/         # Guards de autorización
│   ├── interceptors/   # Interceptores
│   └── pipes/          # Pipes de validación
│
├── config/             # Configuración
│   ├── app.config.ts
│   ├── database.config.ts
│   └── jwt.config.ts
│
├── modules/            # Módulos de negocio
│   ├── auth/
│   ├── users/
│   ├── business/
│   ├── movements/
│   ├── bookings/
│   └── time-slots/
│
├── database/           # Prisma
│   └── prisma/
│       └── prisma.service.ts
│
├── app.module.ts
└── main.ts
```

### Principios Arquitectónicos

- **Separation of Concerns**: Cada módulo es independiente
- **Dependency Injection**: Todas las dependencias inyectadas
- **SOLID Principles**: Código mantenible y escalable
- **Repository Pattern**: Abstracción de base de datos
- **DTO Pattern**: Validación y transformación de datos

## 📚 Documentación API

La documentación completa de la API está disponible en Swagger:

```
http://localhost:3000/api/docs
```

## 🔒 Seguridad

- ✅ Helmet para headers de seguridad
- ✅ Rate limiting por IP
- ✅ Validación exhaustiva de inputs
- ✅ JWT con refresh tokens
- ✅ Bcrypt para passwords
- ✅ CORS configurado
- ✅ SQL Injection protection (Prisma)
- ✅ Audit logs

## 🚀 Deployment

### Docker (Recomendado)

```bash
# Build
docker build -t shain-api .

# Run
docker run -p 3000:3000 --env-file .env shain-api
```

### Manual

```bash
# Build
npm run build

# Start
npm run start:prod
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start` | Inicia en modo producción |
| `npm run start:dev` | Desarrollo con hot reload |
| `npm run start:debug` | Desarrollo con debugger |
| `npm run build` | Compila TypeScript |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea código con Prettier |
| `npm run test` | Tests unitarios |
| `npm run test:e2e` | Tests end-to-end |
| `npm run prisma:generate` | Genera cliente Prisma |
| `npm run prisma:migrate` | Ejecuta migraciones |
| `npm run prisma:studio` | Abre Prisma Studio |

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

UNLICENSED - Uso privado

## 👤 Autor

Juan Manuel Henao

---

**Versión**: 2.0.0  
**Última actualización**: Febrero 2026
