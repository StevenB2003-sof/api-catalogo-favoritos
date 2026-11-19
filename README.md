# API de Catálogo de Productos y Favoritos

API REST con **Node.js + Express + PostgreSQL** que gestiona un catálogo de productos y la lista de favoritos de cada usuario, con autenticación **JWT** y autorización por **roles** (`usuario` y `admin`).

## Integrantes

| Nombre | Usuario de GitHub | Aportes principales |
|---|---|---|
| _Integrante 1_ | @StevenB2003-sof


## Propósito

- Consultar el catálogo **sin iniciar sesión** y filtrarlo por categoría.
- Permitir que **solo el administrador** cree, actualice y elimine productos.
- Permitir que cada usuario autenticado gestione **sus propios** favoritos, sin acceso a los de otros.

## Elección de base de datos: PostgreSQL

Elegimos PostgreSQL porque los datos son relacionales (usuarios ↔ favoritos ↔ productos) y la propia base de datos garantiza las reglas del enunciado:

| Regla | Cómo la garantiza la BD |
|---|---|
| Correo único | `UNIQUE (correo)` (el correo se guarda en minúsculas) |
| Precio mayor que cero | `CHECK (precio > 0)` y tipo `NUMERIC(10,2)` |
| Rol válido | `CHECK (rol IN ('usuario','admin'))` |
| Favorito sin duplicados | `PRIMARY KEY (usuario_id, producto_id)` |
| Sin referencias inexistentes | `FOREIGN KEY ... REFERENCES productos(id)` |
| Qué pasa con los favoritos al borrar un producto | `ON DELETE CASCADE`: se eliminan automáticamente |

Todas las consultas son **parametrizadas** (`$1, $2...`) para evitar inyección SQL. El esquema está en [`db/schema.sql`](db/schema.sql).

### Modelo de datos

```
usuarios                     favoritos                    productos
─────────────────            ──────────────────           ──────────────────
id (PK)              1───N   usuario_id (PK, FK)   N───1  id (PK)
nombre                       producto_id (PK, FK)         nombre
correo (UNIQUE)              creado_en                    descripcion
password_hash                                             categoria
rol (usuario|admin)                                       precio (> 0)
creado_en                                                 creado_en, actualizado_en
```

**Decisión sobre favoritos al eliminar un producto:** se eliminan en cascada. Así ningún usuario conserva un favorito que apunta a un producto que ya no existe y los datos quedan consistentes sin lógica adicional en Node.js.

## Organización del proyecto

```
├── db/
│   ├── schema.sql              # tablas, restricciones e índices
│   └── seed.sql                # 7 productos ficticios de ejemplo
├── postman/
│   ├── catalogo.postman_collection.json
│   └── catalogo.postman_environment.json   # entorno de ejemplo, sin secretos
├── scripts/
│   ├── initDb.js               # crea tablas y siembra productos
│   ├── crearAdmin.js           # crea el administrador (único camino al rol admin)
│   ├── tokenVencido.js         # genera un JWT vencido para las pruebas
│   └── probarPostman.js        # ejecuta la colección con Newman
└── src/
    ├── config/env.js           # variables de entorno
    ├── db/pool.js              # conexión a PostgreSQL
    ├── repositories/           # ACCESO A DATOS (solo SQL)
    ├── controllers/            # LÓGICA de cada endpoint
    ├── routes/                 # RUTAS y qué middlewares aplican
    ├── middlewares/            # verificarToken, requerirRol, errores
    ├── utils/                  # validaciones y HttpError
    ├── app.js                  # configuración de Express
    └── server.js               # punto de entrada
```

Flujo de una petición: **ruta → middlewares (token / rol) → controlador (valida) → repositorio (SQL) → PostgreSQL → respuesta JSON**.

## Requisitos

- Node.js 20 o superior (probado con Node 22) y npm
- PostgreSQL 14 o superior
- Postman (opcional: las pruebas también corren con `npm run test:postman`)

## Instalación

```bash
git clone https://github.com/StevenB2003-sof/api-catalogo-favoritos.git
cd api-catalogo-favoritos

Crea la base de datos en PostgreSQL (con psql, pgAdmin o similar):

```sql
CREATE DATABASE catalogo;
```

Edita `.env` con tus valores (ver la siguiente sección).

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No (3000) | Puerto HTTP |
| `DATABASE_URL` | **Sí** | `postgresql://usuario:contraseña@localhost:5432/catalogo` |
| `JWT_SECRET` | **Sí** | Secreto para firmar los tokens, mínimo 32 caracteres. Genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | No (`1h`) | Vigencia del token (`15m`, `1h`, `1d`...) |
| `BCRYPT_ROUNDS` | No (10) | Costo del hash de contraseñas |
| `ADMIN_NOMBRE` | Para `crear-admin` | Nombre del administrador |
| `ADMIN_CORREO` | Para `crear-admin` | Correo del administrador |
| `ADMIN_PASSWORD` | Para `crear-admin` | Contraseña del administrador (mín. 8 caracteres) |

`.env` está en `.gitignore`: **nunca se sube al repositorio**.

## Inicialización de datos y del administrador

```bash
npm run db:init       # crea las tablas y los 7 productos de ejemplo (se puede repetir sin duplicar)
npm run crear-admin   # crea o actualiza el admin con ADMIN_CORREO / ADMIN_PASSWORD del .env
```

El registro público **siempre** crea usuarios con rol `usuario` (si el cliente envía `"rol": "admin"`, se ignora). La única forma de tener un administrador es este script local.

Para empezar de cero (borra todo): `npm run db:reset` y luego `npm run crear-admin`.

## Ejecución

```bash
npm start      # producción
npm run dev    # desarrollo, se reinicia al guardar (nodemon)
```

La API queda en `http://localhost:3000/api`. Comprobación rápida: `GET /api/salud`.

## Rutas

Prefijo: `/api`. Las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`.

| Método y ruta | Acceso | Cuerpo | Respuesta exitosa |
|---|---|---|---|
| `POST /auth/registro` | Público | `{ "nombre", "correo", "password" }` | `201` usuario creado (rol `usuario`) |
| `POST /auth/login` | Público | `{ "correo", "password" }` | `200` `{ token, tipo, expiraEn, usuario }` |
| `GET /productos` | Público | — · filtro opcional `?categoria=libros` | `200` `{ data: [...], total }` |
| `GET /productos/:id` | Público | — | `200` producto |
| `POST /productos` | **Admin** | `{ "nombre", "descripcion", "categoria", "precio" }` | `201` producto creado |
| `PUT /productos/:id` | **Admin** | los 4 campos (reemplazo completo) | `200` producto actualizado |
| `DELETE /productos/:id` | **Admin** | — | `204` sin cuerpo (borra sus favoritos en cascada) |
| `GET /favoritos` | Autenticado | — | `200` `{ data: [{ agregadoEn, producto }], total }` |
| `POST /favoritos` | Autenticado | `{ "productoId": 3 }` | `201` `{ usuarioId, productoId, agregadoEn }` |
| `DELETE /favoritos/:productoId` | Autenticado | — | `204` sin cuerpo |

En favoritos el usuario **siempre** se toma del token verificado. Si el cliente envía un `usuarioId` en el cuerpo o en la URL, se ignora.

### Formato de las respuestas

Éxito:

```json
{ "data": { "id": 1, "nombre": "Audífonos Inalámbricos Nova", "descripcion": "...", "categoria": "electronica", "precio": 189900, "creadoEn": "...", "actualizadoEn": "..." } }
```

Error (siempre la misma forma, sin trazas, SQL ni secretos):

```json
{ "error": { "codigo": "VALIDACION", "mensaje": "Los datos enviados no son válidos.",
             "detalles": [ { "campo": "precio", "mensaje": "Debe ser mayor que cero." } ] } }
```

Las respuestas nunca incluyen la contraseña ni su hash.

### Códigos de estado y criterio 400 vs 422

| Código | Cuándo | `codigo` del error |
|---|---|---|
| 200 | Consultas, login y actualizaciones exitosas | — |
| 201 | Registro, creación de producto, creación de favorito | — |
| 204 | Eliminación exitosa (producto o favorito) | — |
| **400** | La petición **está mal formada**: JSON que no se puede leer, `:id` de la URL no numérico, filtro `categoria` vacío | `JSON_INVALIDO`, `ID_INVALIDO`, `FILTRO_INVALIDO` |
| 401 | Sin token, token con firma inválida, token vencido o credenciales incorrectas | `NO_AUTENTICADO`, `TOKEN_INVALIDO`, `TOKEN_VENCIDO`, `CREDENCIALES_INVALIDAS` |
| 403 | Autenticado, pero sin el rol necesario (usuario normal modificando el catálogo) | `PROHIBIDO` |
| 404 | Producto, favorito o ruta inexistente | `PRODUCTO_NO_ENCONTRADO`, `FAVORITO_NO_ENCONTRADO`, `RUTA_NO_ENCONTRADA` |
| 409 | Correo ya registrado o favorito duplicado | `CORREO_DUPLICADO`, `FAVORITO_DUPLICADO` |
| **422** | El JSON se leyó bien, pero **su contenido no cumple las reglas**: campos vacíos, correo inválido, contraseña corta, precio ≤ 0 o no numérico, `productoId` inválido | `VALIDACION` |
| 500 | Error inesperado (el detalle solo se registra en la consola del servidor) | `ERROR_INTERNO` |

Cuando B intenta quitar un favorito de A se responde **404** (no 403), para no revelar qué productos tienen otros usuarios en favoritos.

### Reglas de validación

- **nombre** (usuario): obligatorio, máx. 100 caracteres.
- **correo**: formato válido, se guarda en minúsculas, único.
- **password**: entre 8 y 72 caracteres; se guarda con bcrypt.
- **producto**: `nombre`, `descripcion` y `categoria` obligatorios (no vacíos); `precio` numérico, mayor que 0, máximo 2 decimales. La categoría se guarda en minúsculas y el filtro no distingue mayúsculas.
- **identificadores**: enteros positivos.

## Pruebas con Postman

### Opción A: desde Postman

1. Importa `postman/catalogo.postman_collection.json` y `postman/catalogo.postman_environment.json`.
2. Selecciona el entorno **Catálogo - local (ejemplo)** y en *Current value* completa:
   - `adminPassword`: la misma `ADMIN_PASSWORD` de tu `.env`.
   - `tokenVencido`: el resultado de `npm run -s token:vencido`.
3. Con el servidor encendido, ejecuta las carpetas **01 a 09** en orden (Run collection).
4. Detén el servidor (Ctrl+C), vuelve a iniciarlo con `npm start` y ejecuta la carpeta **10 Persistencia - después de reiniciar**.

### Opción B: desde la terminal (Newman)

```bash
npm start                           # en una terminal
npm run test:postman                # en otra terminal: carpetas 01 a 09
# Ctrl+C en la primera terminal y de nuevo: npm start
npm run test:postman:persistencia   # carpeta 10
```

Las pruebas crean usuarios A y B con correos únicos en cada ejecución, así que se pueden repetir sin reiniciar la base de datos.

### Casos cubiertos

| Carpeta | Qué demuestra |
|---|---|
| 01 Autenticación | Registro y login correctos, rol forzado a `usuario`, correo duplicado (409), datos inválidos (422), credenciales incorrectas (401) |
| 02 Catálogo público | Listar sin token, filtrar por categoría, consultar uno, inexistente (404), id inválido (400) |
| 03 Productos CRUD | Crear (201), consultar, actualizar (200), eliminar (204), consultar eliminado (404) como admin |
| 04 Validaciones | Precio 0, negativo o texto; campos vacíos (422); JSON mal formado (400) |
| 05 Seguridad | Sin token (401), token vencido (401), firma alterada (401), usuario modificando catálogo (403) |
| 06 Favoritos | Agregar (201), duplicado (409), producto inexistente (404), listar, quitar (204) |
| 07 Aislamiento A/B | B no ve ni puede quitar los favoritos de A; enviar `usuarioId` ajeno no sirve; el favorito de A permanece |
| 08 Consistencia | Al eliminar un producto, sus favoritos desaparecen (cascada) |
| 09–10 Persistencia | Los datos creados siguen ahí después de reiniciar Node.js |

## Seguridad

- Contraseñas con **bcrypt**; nunca se devuelven ni la contraseña ni el hash.
- JWT firmado con HS256 y con vencimiento (`exp`); `jwt.verify` comprueba firma y expiración y solo acepta HS256.
- El middleware vuelve a leer al usuario desde la BD, así el rol usado es siempre el actual.
- Login con mensaje genérico para no revelar qué correos existen.
- Secretos solo en `.env` (no versionado); `.env.example` sin valores reales.
- Consultas parametrizadas y lista blanca de campos aceptados.

## Recursos y herramientas de apoyo

- Documentación de [Express 5](https://expressjs.com/), [node-postgres](https://node-postgres.com/), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) y [Newman](https://github.com/postmanlabs/newman).
Se usó Claude (asistente de IA) como apoyo para estructurar el código y las pruebas; todo el código fue revisado y entendido
