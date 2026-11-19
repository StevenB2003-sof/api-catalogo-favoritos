-- Datos ficticios de ejemplo. Solo se insertan si la tabla productos está vacía,
-- así se puede ejecutar varias veces sin duplicar.
INSERT INTO productos (nombre, descripcion, categoria, precio)
SELECT * FROM (VALUES
  ('Audífonos Inalámbricos Nova', 'Audífonos bluetooth con cancelación de ruido y 30 horas de batería.', 'electronica', 189900.00),
  ('Teclado Mecánico Orion',      'Teclado mecánico compacto con switches rojos e iluminación RGB.',     'electronica', 245000.00),
  ('Cafetera Prensa Francesa',    'Cafetera de vidrio borosilicato de 1 litro con filtro de acero.',      'hogar',        79900.00),
  ('Lámpara de Escritorio Luma',  'Lámpara LED con brillo regulable y puerto USB de carga.',              'hogar',        98500.50),
  ('Novela El Faro Lejano',       'Novela de misterio de un autor ficticio, edición de bolsillo.',        'libros',       45000.00),
  ('Guía Práctica de Node.js',    'Libro ficticio de introducción a Node.js y Express.',                  'libros',       62000.00),
  ('Botella Térmica Andes',       'Botella de acero inoxidable de 750 ml que mantiene la temperatura.',   'deportes',     55900.99)
) AS datos(nombre, descripcion, categoria, precio)
WHERE NOT EXISTS (SELECT 1 FROM productos);
