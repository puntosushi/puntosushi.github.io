const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());

// JWT Secret
const JWT_SECRET = "sushi-pos-local-secret-2024";

// Datos locales simulados
let localData = {
    usuarios: [
        { id: 1, username: 'admin', password: 'admin123', rol: 'admin', activo: true }
    ],
    pedidos: [],
    productos: [
        // Sushi
        { id: 1, nombre: 'Sushi 12 unidades', categoria: 'sushi', precio_base: 3500, activo: true },
        { id: 2, nombre: 'Sushi 24 unidades', categoria: 'sushi', precio_base: 7000, activo: true },
        { id: 3, nombre: 'Sushi 36 unidades', categoria: 'sushi', precio_base: 10000, activo: true },
        { id: 4, nombre: 'Sushi 48 unidades', categoria: 'sushi', precio_base: 12000, activo: true },
        { id: 5, nombre: 'Sushi 60 unidades', categoria: 'sushi', precio_base: 14000, activo: true },
        { id: 6, nombre: 'Sushi 72 unidades', categoria: 'sushi', precio_base: 17000, activo: true },
        { id: 7, nombre: 'Sushi 84 unidades', categoria: 'sushi', precio_base: 19500, activo: true },
        { id: 8, nombre: 'Sushi 96 unidades', categoria: 'sushi', precio_base: 22000, activo: true },
        { id: 9, nombre: 'Sushi 108 unidades', categoria: 'sushi', precio_base: 24500, activo: true },
        { id: 10, nombre: 'Sushi 120 unidades', categoria: 'sushi', precio_base: 27000, activo: true },

        // Handroll
        { id: 11, nombre: 'Handroll Pollo/Kanikama 1x', categoria: 'handroll', precio_base: 3000, activo: true },
        { id: 12, nombre: 'Handroll Pollo/Kanikama 2x', categoria: 'handroll', precio_base: 5000, activo: true },
        { id: 13, nombre: 'Handroll Camarón', categoria: 'handroll', precio_base: 3500, activo: true },
        { id: 14, nombre: 'Handroll Salmón', categoria: 'handroll', precio_base: 3500, activo: true },
        { id: 15, nombre: 'Handroll Vacuno', categoria: 'handroll', precio_base: 3500, activo: true },

        // SushiBurger
        { id: 16, nombre: 'SushiBurger 1x', categoria: 'sushiburger', precio_base: 6500, activo: true },
        { id: 17, nombre: 'SushiBurger 2x', categoria: 'sushiburger', precio_base: 11000, activo: true },

        // Salchichas
        { id: 18, nombre: 'Salchicha Italiana', categoria: 'salchicha', precio_base: 1000, activo: true },
        { id: 19, nombre: 'Salchicha Palta Mayo', categoria: 'salchicha', precio_base: 1200, activo: true },
        { id: 20, nombre: 'Salchicha Tomate Mayo', categoria: 'salchicha', precio_base: 1000, activo: true },
        { id: 21, nombre: 'Salchicha Solo', categoria: 'salchicha', precio_base: 1000, activo: true },
        { id: 22, nombre: 'Salchicha Dinámico', categoria: 'salchicha', precio_base: 1500, activo: true },

        // Lomo
        { id: 23, nombre: 'Lomo Italiano', categoria: 'lomo', precio_base: 3800, activo: true },
        { id: 24, nombre: 'Lomo Palta Mayo', categoria: 'lomo', precio_base: 3800, activo: true },
        { id: 25, nombre: 'Lomo Tomate Mayo', categoria: 'lomo', precio_base: 3800, activo: true },
        { id: 26, nombre: 'Lomo Solo', categoria: 'lomo', precio_base: 3500, activo: true },
        { id: 27, nombre: 'Lomo Luco', categoria: 'lomo', precio_base: 3800, activo: true },
        { id: 28, nombre: 'Lomo Brasileño', categoria: 'lomo', precio_base: 4000, activo: true },

        // Churrasco
        { id: 29, nombre: 'Churrasco Italiano', categoria: 'churrasco', precio_base: 4000, activo: true },
        { id: 30, nombre: 'Churrasco Palta Mayo', categoria: 'churrasco', precio_base: 4000, activo: true },
        { id: 31, nombre: 'Churrasco Tomate Mayo', categoria: 'churrasco', precio_base: 4000, activo: true },
        { id: 32, nombre: 'Churrasco Solo Carne', categoria: 'churrasco', precio_base: 3500, activo: true },
        { id: 33, nombre: 'Churrasco Luco', categoria: 'churrasco', precio_base: 3500, activo: true },
        { id: 34, nombre: 'Churrasco Brasileño', categoria: 'churrasco', precio_base: 4500, activo: true }
    ],
    stock: [
        // Proteínas
        { id: 1, ingrediente: 'Pollo', categoria: 'Proteínas', cantidad_disponible: 5000, unidad: 'gr', minimo_alerta: 500 },
        { id: 2, ingrediente: 'Pollo Teriyaki', categoria: 'Proteínas', cantidad_disponible: 2000, unidad: 'gr', minimo_alerta: 300 },
        { id: 3, ingrediente: 'Camarón', categoria: 'Proteínas', cantidad_disponible: 2000, unidad: 'gr', minimo_alerta: 250 },
        { id: 4, ingrediente: 'Salmón', categoria: 'Proteínas', cantidad_disponible: 2500, unidad: 'gr', minimo_alerta: 300 },
        { id: 5, ingrediente: 'Vacuno', categoria: 'Proteínas', cantidad_disponible: 4000, unidad: 'gr', minimo_alerta: 500 },
        { id: 6, ingrediente: 'Lomo', categoria: 'Proteínas', cantidad_disponible: 3000, unidad: 'gr', minimo_alerta: 400 },

        // Vegetales
        { id: 7, ingrediente: 'Cebollín', categoria: 'Vegetales', cantidad_disponible: 1000, unidad: 'gr', minimo_alerta: 100 },
        { id: 8, ingrediente: 'Ciboulette', categoria: 'Vegetales', cantidad_disponible: 800, unidad: 'gr', minimo_alerta: 80 },
        { id: 9, ingrediente: 'Champiñón', categoria: 'Vegetales', cantidad_disponible: 1200, unidad: 'gr', minimo_alerta: 120 },
        { id: 10, ingrediente: 'Choclo', categoria: 'Vegetales', cantidad_disponible: 1500, unidad: 'gr', minimo_alerta: 150 },
        { id: 11, ingrediente: 'Palta', categoria: 'Vegetales', cantidad_disponible: 200, unidad: 'un', minimo_alerta: 20 },

        // Otros
        { id: 12, ingrediente: 'Tempura', categoria: 'Otros', cantidad_disponible: 2000, unidad: 'gr', minimo_alerta: 200 },
        { id: 13, ingrediente: 'Sésamo Negro', categoria: 'Otros', cantidad_disponible: 800, unidad: 'gr', minimo_alerta: 80 },
        { id: 14, ingrediente: 'Nori', categoria: 'Otros', cantidad_disponible: 500, unidad: 'un', minimo_alerta: 50 },
        { id: 15, ingrediente: 'Queso', categoria: 'Otros', cantidad_disponible: 2000, unidad: 'gr', minimo_alerta: 200 },

        // Extras
        { id: 16, ingrediente: 'Mayo Industrial', categoria: 'Extras', cantidad_disponible: 3000, unidad: 'ml', minimo_alerta: 300 },
        { id: 17, ingrediente: 'Coca-Cola Lata 350cc', categoria: 'Extras', cantidad_disponible: 50, unidad: 'un', minimo_alerta: 10 },
        { id: 18, ingrediente: 'Fanta Lata 350cc', categoria: 'Extras', cantidad_disponible: 40, unidad: 'un', minimo_alerta: 8 }
    ],
    reportes: [],
    nextOrderId: 1
};

// Funciones utilitarias para datos locales
function saveData() {
    try {
        fs.writeFileSync('data.json', JSON.stringify(localData, null, 2));
    } catch (error) {
        console.log('No se pudo guardar datos (modo solo memoria)');
    }
}

function loadData() {
    try {
        if (fs.existsSync('data.json')) {
            const data = fs.readFileSync('data.json', 'utf8');
            const loadedData = JSON.parse(data);
            // Merge loaded data with defaults
            localData = {
                ...localData,
                ...loadedData,
                // Keep defaults if not in loaded data
                productos: loadedData.productos || localData.productos,
                stock: loadedData.stock || localData.stock
            };
            console.log('✅ Datos locales cargados desde data.json');
        } else {
            console.log('🔄 Iniciando con datos nuevos');
        }
    } catch (error) {
        console.log('🔄 Iniciando con datos por defecto - Error:', error.message);
    }
}

function generateOrderNumber() {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = localData.pedidos.filter(p => p.fecha === today);
    const nextNumber = todayOrders.length + 1;
    return nextNumber.toString().padStart(4, '0');
}

// Cargar datos al iniciar
loadData();

console.log('✅ Sistema iniciado con base de datos local simulada');

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        req.user = user;
        next();
    });
};

// AUTHENTICATION ROUTES
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        // Buscar usuario en datos locales
        const user = localData.usuarios.find(u => u.username === username && u.activo);

        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// ORDERS ROUTES
app.get('/api/orders/active', authenticateToken, (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const activeOrders = localData.pedidos.filter(
            p => p.fecha === today && !['entregado', 'cancelado'].includes(p.estado)
        );

        res.json({ success: true, orders: activeOrders });
    } catch (error) {
        console.error('Error getting active orders:', error);
        res.status(500).json({ error: 'Error al obtener órdenes activas' });
    }
});

app.post('/api/orders', authenticateToken, (req, res) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El pedido debe tener al menos un item' });
        }

        const today = new Date().toISOString().split('T')[0];
        const numeroPedido = generateOrderNumber();
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);

        const newOrder = {
            id: localData.nextOrderId++,
            numero_pedido: numeroPedido,
            fecha: today,
            estado: 'en_preparacion',
            total: total,
            creado_at: new Date().toISOString(),
            actualizado_at: new Date().toISOString(),
            detalles: items
        };

        localData.pedidos.push(newOrder);
        saveData();

        res.json({
            success: true,
            order: {
                id: newOrder.id,
                numero_pedido: newOrder.numero_pedido,
                total: newOrder.total,
                estado: newOrder.estado
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Error al crear el pedido' });
    }
});

app.put('/api/orders/:id/status', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const validStates = ['en_preparacion', 'completado', 'entregado', 'cancelado'];
        if (!validStates.includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const orderIndex = localData.pedidos.findIndex(p => p.id == id);
        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        localData.pedidos[orderIndex].estado = estado;
        localData.pedidos[orderIndex].actualizado_at = new Date().toISOString();
        saveData();

        res.json({ success: true, order: localData.pedidos[orderIndex] });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error al actualizar estado del pedido' });
    }
});

app.get('/api/orders/history', authenticateToken, (req, res) => {
    try {
        const { date } = req.query;
        const queryDate = date || new Date().toISOString().split('T')[0];

        const dayOrders = localData.pedidos.filter(p => p.fecha === queryDate);

        res.json({ success: true, orders: dayOrders });
    } catch (error) {
        console.error('Error getting order history:', error);
        res.status(500).json({ error: 'Error al obtener historial de pedidos' });
    }
});

// PRODUCTS ROUTES
app.get('/api/products', authenticateToken, (req, res) => {
    try {
        const { categoria } = req.query;
        let products = localData.productos.filter(p => p.activo);

        if (categoria) {
            products = products.filter(p => p.categoria === categoria);
        }

        res.json({ success: true, products });
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// STOCK ROUTES
app.get('/api/stock', authenticateToken, (req, res) => {
    try {
        const stockByCategory = localData.stock.reduce((acc, item) => {
            if (!acc[item.categoria]) {
                acc[item.categoria] = [];
            }
            acc[item.categoria].push(item);
            return acc;
        }, {});

        res.json({ success: true, stock: stockByCategory });
    } catch (error) {
        console.error('Error getting stock:', error);
        res.status(500).json({ error: 'Error al obtener stock' });
    }
});

app.put('/api/stock/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad_disponible } = req.body;

        if (cantidad_disponible < 0) {
            return res.status(400).json({ error: 'La cantidad no puede ser negativa' });
        }

        const stockIndex = localData.stock.findIndex(s => s.id == id);
        if (stockIndex === -1) {
            return res.status(404).json({ error: 'Item de stock no encontrado' });
        }

        localData.stock[stockIndex].cantidad_disponible = cantidad_disponible;
        saveData();

        res.json({ success: true, stock: localData.stock[stockIndex] });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Error al actualizar stock' });
    }
});

app.get('/api/stock/alerts', authenticateToken, (req, res) => {
    try {
        const alerts = localData.stock.filter(
            s => s.cantidad_disponible <= s.minimo_alerta
        );

        res.json({ success: true, alerts });
    } catch (error) {
        console.error('Error getting stock alerts:', error);
        res.status(500).json({ error: 'Error al obtener alertas de stock' });
    }
});

// REPORTS ROUTES
app.get('/api/reports/list', authenticateToken, (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const last30Days = [];

        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayOrders = localData.pedidos.filter(p => p.fecha === dateStr);
            const totalPedidos = dayOrders.length;
            const totalVentas = dayOrders.reduce((sum, p) => sum + p.total, 0);

            last30Days.push({
                id: i + 1,
                fecha: dateStr,
                total_pedidos: totalPedidos,
                total_ventas: totalVentas,
                productos_vendidos: dayOrders,
                generado_at: new Date().toISOString(),
                tipo_generacion: 'automatico'
            });
        }

        res.json({ success: true, reports: last30Days });
    } catch (error) {
        console.error('Error getting reports list:', error);
        res.status(500).json({ error: 'Error al obtener lista de reportes' });
    }
});

app.get('/api/reports/daily/:date', authenticateToken, (req, res) => {
    try {
        const { date } = req.params;

        const dayOrders = localData.pedidos.filter(p => p.fecha === date);
        const totalPedidos = dayOrders.length;
        const totalVentas = dayOrders.reduce((sum, p) => sum + p.total, 0);

        const report = {
            id: 1,
            fecha: date,
            total_pedidos: totalPedidos,
            total_ventas: totalVentas,
            productos_vendidos: dayOrders,
            generado_at: new Date().toISOString(),
            tipo_generacion: 'automatico'
        };

        res.json({ success: true, report });
    } catch (error) {
        console.error('Error getting daily report:', error);
        res.status(500).json({ error: 'Error al obtener reporte diario' });
    }
});

app.post('/api/reports/generate/:date', authenticateToken, (req, res) => {
    try {
        const { date } = req.params;

        const dayOrders = localData.pedidos.filter(p => p.fecha === date);
        const totalPedidos = dayOrders.length;
        const totalVentas = dayOrders.reduce((sum, p) => sum + p.total, 0);

        const report = {
            id: Date.now(),
            fecha: date,
            total_pedidos: totalPedidos,
            total_ventas: totalVentas,
            productos_vendidos: dayOrders,
            generado_at: new Date().toISOString(),
            tipo_generacion: 'manual'
        };

        res.json({ success: true, report });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Error al generar reporte' });
    }
});

app.get('/api/reports/download/:date', authenticateToken, (req, res) => {
    try {
        const { date } = req.params;
        const { format } = req.query;

        const dayOrders = localData.pedidos.filter(p => p.fecha === date);
        const totalPedidos = dayOrders.length;
        const totalVentas = dayOrders.reduce((sum, p) => sum + p.total, 0);

        const filename = `reporte_${date}`;

        if (format === 'csv') {
            let csv = 'Fecha,Número Pedido,Total,Estado\n';
            dayOrders.forEach(order => {
                csv += `${order.fecha},${order.numero_pedido},${order.total},${order.estado}\n`;
            });
            csv += `\nResumen\n`;
            csv += `Total Pedidos,${totalPedidos}\n`;
            csv += `Total Ventas,${totalVentas}\n`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csv);
        } else {
            const report = {
                fecha: date,
                total_pedidos: totalPedidos,
                total_ventas: totalVentas,
                productos_vendidos: dayOrders,
                generado_at: new Date().toISOString()
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.json(report);
        }
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({ error: 'Error al descargar reporte' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🍣 Sushi POS API (Local) running on port ${PORT}`);
    console.log(`📊 Database: Local (File-based persistence)`);
    console.log(`🔑 JWT configured: Yes`);
    console.log(`💾 Data persistence: ${fs.existsSync('data.json') ? 'Loaded from file' : 'Memory only'}`);
    console.log(`🌐 Open http://localhost:3000 for frontend`);
});