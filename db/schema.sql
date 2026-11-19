-- Esquema de la base de datos del catálogo (PostgreSQL 14+).
-- Se puede ejecutar varias veces: solo crea lo que no existe.

CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL CHECK (length(trim(nombre)) > 0),
  correo         VARCHAR(255) NOT NULL UNIQUE,          -- se guarda en minúsculas
  password_hash  VARCHAR(255) NOT NULL,
  rol            VARCHAR(20)  NOT NULL DEFAULT 'usuario'
                 CHECK (rol IN ('usuario', 'admin')),
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(120)  NOT NULL CHECK (length(trim(nombre)) > 0),
  descripcion     VARCHAR(1000) NOT NULL CHECK (length(trim(descripcion)) > 0),
  categoria       VARCHAR(60)   NOT NULL CHECK (length(trim(categoria)) > 0),
  precio          NUMERIC(10,2) NOT NULL CHECK (precio > 0),
  creado_en       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (lower(categoria));

-- Un usuario no puede tener el mismo producto dos veces (PRIMARY KEY compuesta).
-- ON DELETE CASCADE: si se elimina un producto (o un usuario), sus favoritos
-- se eliminan automáticamente, así nunca quedan favoritos apuntando a nada.
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id   INTEGER     NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  producto_id  INTEGER     NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, producto_id)
);
