-- Sistema Punto de Sushi - Database Schema
-- Generated for Neon PostgreSQL

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS reportes_diarios CASCADE;
DROP TABLE IF EXISTS detalle_pedidos CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Tabla: usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cocinero' CHECK (rol IN ('admin', 'cocinero', 'cajero')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    precio_base INTEGER NOT NULL,
    ingredientes JSONB,
    activo BOOLEAN DEFAULT true
);

-- Tabla: pedidos
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    numero_pedido VARCHAR(4) NOT NULL,
    fecha DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'en_preparacion' CHECK (estado IN ('en_preparacion', 'completado', 'entregado', 'cancelado')),
    total INTEGER NOT NULL,
    creado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(numero_pedido, fecha)
);

-- Tabla: detalle_pedidos
CREATE TABLE detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    preferencias JSONB,
    subtotal INTEGER NOT NULL
);

-- Tabla: stock
CREATE TABLE stock (
    id SERIAL PRIMARY KEY,
    ingrediente VARCHAR(100) UNIQUE NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    cantidad_disponible NUMERIC(10,2) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    minimo_alerta NUMERIC(10,2) DEFAULT 10,
    actualizado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: reportes_diarios
CREATE TABLE reportes_diarios (
    id SERIAL PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL,
    total_pedidos INTEGER DEFAULT 0,
    total_ventas INTEGER DEFAULT 0,
    productos_vendidos JSONB,
    generado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_generacion VARCHAR(20) DEFAULT 'automatico' CHECK (tipo_generacion IN ('automatico', 'manual'))
);

-- Create indexes for better performance
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_detalle_pedidos_pedido_id ON detalle_pedidos(pedido_id);
CREATE INDEX idx_stock_categoria ON stock(categoria);
CREATE INDEX idx_reportes_diarios_fecha ON reportes_diarios(fecha);

-- Create updated_at trigger for pedidos
CREATE OR REPLACE FUNCTION update_actualizado_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_pedidos_actualizado_at
    BEFORE UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION update_actualizado_at();

-- Create updated_at trigger for stock
CREATE TRIGGER trigger_stock_actualizado_at
    BEFORE UPDATE ON stock
    FOR EACH ROW
    EXECUTE FUNCTION update_actualizado_at();

-- Insert default admin user (password: admin123)
INSERT INTO usuarios (username, password_hash, rol) VALUES
('admin', '$2b$10$rQO8v/H.GvWU8rvpzOHV8.6G0gE1YsJsfp8mLWRGXO2XCPVfoaL.S', 'admin');

-- Insert default products with correct pricing
INSERT INTO productos (nombre, categoria, precio_base, ingredientes) VALUES
-- Sushi options
('Sushi 12 unidades', 'sushi', 3500, '{"cantidad": 12, "unidad": "unidades"}'),
('Sushi 24 unidades', 'sushi', 7000, '{"cantidad": 24, "unidad": "unidades"}'),
('Sushi 36 unidades', 'sushi', 10000, '{"cantidad": 36, "unidad": "unidades"}'),
('Sushi 48 unidades', 'sushi', 12000, '{"cantidad": 48, "unidad": "unidades"}'),
('Sushi 60 unidades', 'sushi', 14000, '{"cantidad": 60, "unidad": "unidades"}'),
('Sushi 72 unidades', 'sushi', 17000, '{"cantidad": 72, "unidad": "unidades"}'),
('Sushi 84 unidades', 'sushi', 19500, '{"cantidad": 84, "unidad": "unidades"}'),
('Sushi 96 unidades', 'sushi', 22000, '{"cantidad": 96, "unidad": "unidades"}'),
('Sushi 108 unidades', 'sushi', 24500, '{"cantidad": 108, "unidad": "unidades"}'),
('Sushi 120 unidades', 'sushi', 27000, '{"cantidad": 120, "unidad": "unidades"}'),

-- Handroll options
('Handroll Pollo/Kanikama', 'handroll', 3000, '{"proteina": ["pollo", "kanikama"], "tipo": "basic"}'),
('Handroll Pollo/Kanikama 2x', 'handroll', 5000, '{"proteina": ["pollo", "kanikama"], "cantidad": 2}'),
('Handroll Camarón/Salmón/Vacuno', 'handroll', 3500, '{"proteina": ["camaron", "salmon", "vacuno"], "tipo": "premium"}'),

-- SushiBurger
('SushiBurger 1x', 'sushiburger', 6500, '{"cantidad": 1}'),
('SushiBurger 2x', 'sushiburger', 11000, '{"cantidad": 2}'),

-- Salchichas
('Salchicha Italiana', 'salchicha', 1000, '{"tipo": "italiana"}'),
('Salchicha Palta Mayo', 'salchicha', 1200, '{"tipo": "palta_mayo"}'),
('Salchicha Tomate Mayo', 'salchicha', 1000, '{"tipo": "tomate_mayo"}'),
('Salchicha Solo', 'salchicha', 1000, '{"tipo": "solo"}'),
('Salchicha Dinámico', 'salchicha', 1500, '{"tipo": "dinamico"}'),

-- Lomo
('Lomo Italiano', 'lomo', 3800, '{"tipo": "italiano"}'),
('Lomo Palta Mayo', 'lomo', 3800, '{"tipo": "palta_mayo"}'),
('Lomo Tomate Mayo', 'lomo', 3800, '{"tipo": "tomate_mayo"}'),
('Lomo Solo', 'lomo', 3500, '{"tipo": "solo"}'),
('Lomo Luco', 'lomo', 3800, '{"tipo": "luco"}'),
('Lomo Brasileño', 'lomo', 4000, '{"tipo": "brasileño"}'),

-- Churrasco
('Churrasco Italiano', 'churrasco', 4000, '{"tipo": "italiano"}'),
('Churrasco Palta Mayo', 'churrasco', 4000, '{"tipo": "palta_mayo"}'),
('Churrasco Tomate Mayo', 'churrasco', 4000, '{"tipo": "tomate_mayo"}'),
('Churrasco Solo Carne', 'churrasco', 3500, '{"tipo": "solo"}'),
('Churrasco Luco', 'churrasco', 3500, '{"tipo": "luco"}'),
('Churrasco Brasileño', 'churrasco', 4500, '{"tipo": "brasileño"}');

-- Insert default stock items
INSERT INTO stock (ingrediente, categoria, cantidad_disponible, unidad, minimo_alerta) VALUES
-- Proteínas
('Pollo', 'Proteínas', 5000, 'gr', 500),
('Pollo Teriyaki', 'Proteínas', 2000, 'gr', 300),
('Pollo Apanado', 'Proteínas', 3000, 'gr', 400),
('Camarón', 'Proteínas', 2000, 'gr', 250),
('Camarón Apanado', 'Proteínas', 1500, 'gr', 200),
('Salmón', 'Proteínas', 2500, 'gr', 300),
('Salmón Apanado', 'Proteínas', 1500, 'gr', 200),
('Vacuno', 'Proteínas', 4000, 'gr', 500),
('Lomo', 'Proteínas', 3000, 'gr', 400),
('Kanikama', 'Proteínas', 2000, 'gr', 250),
('Kanikama Apanado', 'Proteínas', 1500, 'gr', 200),

-- Vegetales
('Cebollín', 'Vegetales', 1000, 'gr', 100),
('Ciboulette', 'Vegetales', 800, 'gr', 80),
('Champiñón', 'Vegetales', 1200, 'gr', 120),
('Choclo', 'Vegetales', 1500, 'gr', 150),
('Palta', 'Vegetales', 200, 'un', 20),
('Aceituna', 'Vegetales', 500, 'gr', 50),
('Palmito', 'Vegetales', 800, 'gr', 80),
('Choclito', 'Vegetales', 600, 'gr', 60),
('Pimentón', 'Vegetales', 1000, 'gr', 100),

-- Otros
('Tempura', 'Otros', 2000, 'gr', 200),
('Tempura Merkén', 'Otros', 1000, 'gr', 100),
('Sésamo Negro', 'Otros', 800, 'gr', 80),
('Sésamo Tostado', 'Otros', 800, 'gr', 80),
('Sésamo Mixto', 'Otros', 600, 'gr', 60),
('Nori', 'Otros', 500, 'un', 50),
('Furay', 'Otros', 1000, 'gr', 100),
('Queso', 'Otros', 2000, 'gr', 200),
('Queso Palta', 'Otros', 1000, 'gr', 100),
('Mango', 'Otros', 800, 'gr', 80),

-- Extras/Aderezos
('Mayo Industrial', 'Extras', 3000, 'ml', 300),
('Mayo Casera', 'Extras', 2000, 'ml', 200),
('Coca-Cola Lata 350cc', 'Extras', 50, 'un', 10),
('Coca-Cola Botella 500ml', 'Extras', 30, 'un', 5),
('Fanta Lata 350cc', 'Extras', 40, 'un', 8);

-- Create function to generate daily order numbers
CREATE OR REPLACE FUNCTION generar_numero_pedido(fecha DATE)
RETURNS TEXT AS $$
DECLARE
    ultimo_numero INTEGER;
    siguiente_numero INTEGER;
BEGIN
    SELECT COALESCE(MAX(numero_pedido::INTEGER), 0)
    INTO ultimo_numero
    FROM pedidos
    WHERE fecha = fecha;

    siguiente_numero := ultimo_numero + 1;

    RETURN LPAD(siguiente_numero::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;