require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Database connection with fallback
let pool;

try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('✅ Database connection configured');
} catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('🔄 Using mock data mode');

    // Mock data for testing without database
    pool = null;
}

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        req.user = user;
        next();
    });
};

// Utility function to generate daily order number
const generateDailyOrderNumber = async (fecha) => {
    const result = await pool.query(
        'SELECT COALESCE(MAX(numero_pedido::INTEGER), 0) as max_num FROM pedidos WHERE fecha = $1',
        [fecha]
    );
    const nextNumber = result.rows[0].max_num + 1;
    return nextNumber.toString().padStart(4, '0');
};

// AUTHENTICATION ROUTES
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        }

        // Mock user for testing without database
        if (!pool) {
            if (username === 'admin' && password === 'admin123') {
                const token = jwt.sign(
                    { userId: 1, username: 'admin', rol: 'admin' },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
                );

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: 1,
                        username: 'admin',
                        rol: 'admin'
                    }
                });
            } else {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }
        }

        // Database authentication
        const userResult = await pool.query(
            'SELECT * FROM usuarios WHERE username = $1 AND activo = true',
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = userResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
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
app.get('/api/orders/active', authenticateToken, async (req, res) => {
    try {
        // Mock data for testing without database
        if (!pool) {
            const mockOrders = [
                {
                    id: 1,
                    numero_pedido: '0001',
                    estado: 'en_preparacion',
                    creado_at: new Date(Date.now() - 5 * 60000).toISOString(),
                    total: 7000,
                    detalles: [
                        {
                            producto: 'Sushi 24 unidades',
                            cantidad: 1,
                            preferencias: { proteina: 'Pollo', vegetal: 'Palta', envoltura: 'Nori' },
                            subtotal: 7000
                        }
                    ]
                },
                {
                    id: 2,
                    numero_pedido: '0002',
                    estado: 'en_preparacion',
                    creado_at: new Date(Date.now() - 2 * 60000).toISOString(),
                    total: 3500,
                    detalles: [
                        {
                            producto: 'Handroll Camarón',
                            cantidad: 1,
                            preferencias: { proteina: 'Camarón', vegetal: 'Cebollín' },
                            subtotal: 3500
                        }
                    ]
                }
            ];
            return res.json({ success: true, orders: mockOrders });
        }

        const result = await pool.query(`
            SELECT
                p.id,
                p.numero_pedido,
                p.estado,
                p.creado_at,
                p.total,
                json_agg(
                    json_build_object(
                        'producto', pr.nombre,
                        'cantidad', dp.cantidad,
                        'preferencias', dp.preferencias,
                        'subtotal', dp.subtotal
                    )
                ) as detalles
            FROM pedidos p
            LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
            LEFT JOIN productos pr ON dp.producto_id = pr.id
            WHERE p.fecha = CURRENT_DATE AND p.estado NOT IN ('entregado', 'cancelado')
            GROUP BY p.id, p.numero_pedido, p.estado, p.creado_at, p.total
            ORDER BY p.creado_at ASC
        `);

        res.json({ success: true, orders: result.rows });
    } catch (error) {
        console.error('Error getting active orders:', error);
        res.status(500).json({ error: 'Error al obtener órdenes activas' });
    }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { items } = req.body;
        const fecha = new Date().toISOString().split('T')[0];
        const numeroPedido = await generateDailyOrderNumber(fecha);

        // Calculate total
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);

        // Insert order
        const orderResult = await client.query(
            'INSERT INTO pedidos (numero_pedido, fecha, total, estado) VALUES ($1, $2, $3, $4) RETURNING id',
            [numeroPedido, fecha, total, 'en_preparacion']
        );

        const pedidoId = orderResult.rows[0].id;

        // Insert order details
        for (const item of items) {
            await client.query(
                'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, preferencias, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [pedidoId, item.producto_id, item.cantidad, JSON.stringify(item.preferencias), item.subtotal]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            order: {
                id: pedidoId,
                numero_pedido: numeroPedido,
                total,
                estado: 'en_preparacion'
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Error al crear el pedido' });
    } finally {
        client.release();
    }
});

app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const validStates = ['en_preparacion', 'completado', 'entregado', 'cancelado'];
        if (!validStates.includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const result = await pool.query(
            'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
            [estado, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({ success: true, order: result.rows[0] });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Error al actualizar estado del pedido' });
    }
});

app.get('/api/orders/history', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;
        const queryDate = date || new Date().toISOString().split('T')[0];

        const result = await pool.query(`
            SELECT
                p.id,
                p.numero_pedido,
                p.estado,
                p.fecha,
                p.total,
                p.creado_at,
                json_agg(
                    json_build_object(
                        'producto', pr.nombre,
                        'cantidad', dp.cantidad,
                        'preferencias', dp.preferencias,
                        'subtotal', dp.subtotal
                    )
                ) as detalles
            FROM pedidos p
            LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
            LEFT JOIN productos pr ON dp.producto_id = pr.id
            WHERE p.fecha = $1
            GROUP BY p.id, p.numero_pedido, p.estado, p.fecha, p.total, p.creado_at
            ORDER BY p.creado_at DESC
        `, [queryDate]);

        res.json({ success: true, orders: result.rows });
    } catch (error) {
        console.error('Error getting order history:', error);
        res.status(500).json({ error: 'Error al obtener historial de pedidos' });
    }
});

// PRODUCTS ROUTES
app.get('/api/products', authenticateToken, async (req, res) => {
    try {
        const { categoria } = req.query;
        let query = 'SELECT * FROM productos WHERE activo = true';
        const params = [];

        if (categoria) {
            query += ' AND categoria = $1';
            params.push(categoria);
        }

        query += ' ORDER BY categoria, nombre';

        const result = await pool.query(query, params);
        res.json({ success: true, products: result.rows });
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// STOCK ROUTES
app.get('/api/stock', authenticateToken, async (req, res) => {
    try {
        // Mock data for testing without database
        if (!pool) {
            const mockStock = {
                'Proteínas': [
                    { id: 1, ingrediente: 'Pollo', categoria: 'Proteínas', cantidad_disponible: 5000, unidad: 'gr', minimo_alerta: 500 },
                    { id: 2, ingrediente: 'Camarón', categoria: 'Proteínas', cantidad_disponible: 2000, unidad: 'gr', minimo_alerta: 250 },
                    { id: 3, ingrediente: 'Salmón', categoria: 'Proteínas', cantidad_disponible: 2500, unidad: 'gr', minimo_alerta: 300 },
                    { id: 4, ingrediente: 'Vacuno', categoria: 'Proteínas', cantidad_disponible: 4000, unidad: 'gr', minimo_alerta: 500 },
                    { id: 5, ingrediente: 'Lomo', categoria: 'Proteínas', cantidad_disponible: 3000, unidad: 'gr', minimo_alerta: 400 }
                ],
                'Vegetales': [
                    { id: 6, ingrediente: 'Cebollín', categoria: 'Vegetales', cantidad_disponible: 1000, unidad: 'gr', minimo_alerta: 100 },
                    { id: 7, ingrediente: 'Palta', categoria: 'Vegetales', cantidad_disponible: 200, unidad: 'un', minimo_alerta: 20 },
                    { id: 8, ingrediente: 'Champiñón', categoria: 'Vegetales', cantidad_disponible: 1200, unidad: 'gr', minimo_alerta: 120 },
                    { id: 9, ingrediente: 'Choclo', categoria: 'Vegetales', cantidad_disponible: 1500, unidad: 'gr', minimo_alerta: 150 }
                ],
                'Otros': [
                    { id: 10, ingrediente: 'Tempura', categoria: 'Otros', cantidad_disponible: 2000, unidad: 'gr', minimo_alerta: 200 },
                    { id: 11, ingrediente: 'Nori', categoria: 'Otros', cantidad_disponible: 500, unidad: 'un', minimo_alerta: 50 },
                    { id: 12, ingrediente: 'Queso', categoria: 'Otros', cantidad_disponible: 2000, unidad: 'gr', minimo_alerta: 200 }
                ],
                'Extras': [
                    { id: 13, ingrediente: 'Mayo Industrial', categoria: 'Extras', cantidad_disponible: 3000, unidad: 'ml', minimo_alerta: 300 },
                    { id: 14, ingrediente: 'Coca-Cola Lata 350cc', categoria: 'Extras', cantidad_disponible: 50, unidad: 'un', minimo_alerta: 10 },
                    { id: 15, ingrediente: 'Fanta Lata 350cc', categoria: 'Extras', cantidad_disponible: 40, unidad: 'un', minimo_alerta: 8 }
                ]
            };
            return res.json({ success: true, stock: mockStock });
        }

        const result = await pool.query(`
            SELECT * FROM stock
            ORDER BY categoria, ingrediente
        `);

        const stockByCategory = result.rows.reduce((acc, item) => {
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

app.put('/api/stock/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad_disponible } = req.body;

        if (cantidad_disponible < 0) {
            return res.status(400).json({ error: 'La cantidad no puede ser negativa' });
        }

        const result = await pool.query(
            'UPDATE stock SET cantidad_disponible = $1 WHERE id = $2 RETURNING *',
            [cantidad_disponible, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Item de stock no encontrado' });
        }

        res.json({ success: true, stock: result.rows[0] });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Error al actualizar stock' });
    }
});

app.get('/api/stock/alerts', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM stock
            WHERE cantidad_disponible <= minimo_alerta
            ORDER BY cantidad_disponible ASC
        `);

        res.json({ success: true, alerts: result.rows });
    } catch (error) {
        console.error('Error getting stock alerts:', error);
        res.status(500).json({ error: 'Error al obtener alertas de stock' });
    }
});

// REPORTS ROUTES
app.get('/api/reports/list', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM reportes_diarios
            ORDER BY fecha DESC
            LIMIT 30
        `);

        res.json({ success: true, reports: result.rows });
    } catch (error) {
        console.error('Error getting reports list:', error);
        res.status(500).json({ error: 'Error al obtener lista de reportes' });
    }
});

app.get('/api/reports/daily/:date', authenticateToken, async (req, res) => {
    try {
        const { date } = req.params;

        // Try to get existing report
        let reportResult = await pool.query(
            'SELECT * FROM reportes_diarios WHERE fecha = $1',
            [date]
        );

        if (reportResult.rows.length === 0) {
            // Generate report if it doesn't exist
            const ordersResult = await pool.query(`
                SELECT
                    COUNT(*) as total_pedidos,
                    COALESCE(SUM(total), 0) as total_ventas,
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'numero_pedido', p.numero_pedido,
                            'total', p.total,
                            'detalles', (
                                SELECT json_agg(
                                    json_build_object(
                                        'producto', pr.nombre,
                                        'cantidad', dp.cantidad,
                                        'subtotal', dp.subtotal
                                    )
                                )
                                FROM detalle_pedidos dp
                                LEFT JOIN productos pr ON dp.producto_id = pr.id
                                WHERE dp.pedido_id = p.id
                            )
                        )
                    ) as pedidos
                FROM pedidos p
                WHERE p.fecha = $1
            `, [date]);

            const reportData = ordersResult.rows[0];

            // Insert new report
            await pool.query(
                'INSERT INTO reportes_diarios (fecha, total_pedidos, total_ventas, productos_vendidos) VALUES ($1, $2, $3, $4)',
                [date, reportData.total_pedidos, reportData.total_ventas, JSON.stringify(reportData.pedidos)]
            );

            // Get the newly created report
            reportResult = await pool.query(
                'SELECT * FROM reportes_diarios WHERE fecha = $1',
                [date]
            );
        }

        res.json({ success: true, report: reportResult.rows[0] });
    } catch (error) {
        console.error('Error getting daily report:', error);
        res.status(500).json({ error: 'Error al obtener reporte diario' });
    }
});

app.post('/api/reports/generate/:date', authenticateToken, async (req, res) => {
    try {
        const { date } = req.params;

        // Generate report data
        const ordersResult = await pool.query(`
            SELECT
                COUNT(*) as total_pedidos,
                COALESCE(SUM(total), 0) as total_ventas,
                json_agg(
                    json_build_object(
                        'id', p.id,
                        'numero_pedido', p.numero_pedido,
                        'total', p.total,
                        'estado', p.estado,
                        'detalles', (
                            SELECT json_agg(
                                json_build_object(
                                    'producto', pr.nombre,
                                    'cantidad', dp.cantidad,
                                    'subtotal', dp.subtotal
                                )
                            )
                            FROM detalle_pedidos dp
                            LEFT JOIN productos pr ON dp.producto_id = pr.id
                            WHERE dp.pedido_id = p.id
                        )
                    )
                ) as pedidos
            FROM pedidos p
            WHERE p.fecha = $1
        `, [date]);

        const reportData = ordersResult.rows[0];

        // Upsert report
        const result = await pool.query(`
            INSERT INTO reportes_diarios (fecha, total_pedidos, total_ventas, productos_vendidos, tipo_generacion)
            VALUES ($1, $2, $3, $4, 'manual')
            ON CONFLICT (fecha)
            DO UPDATE SET
                total_pedidos = EXCLUDED.total_pedidos,
                total_ventas = EXCLUDED.total_ventas,
                productos_vendidos = EXCLUDED.productos_vendidos,
                tipo_generacion = 'manual',
                generado_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [date, reportData.total_pedidos, reportData.total_ventas, JSON.stringify(reportData.pedidos)]);

        res.json({ success: true, report: result.rows[0] });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Error al generar reporte' });
    }
});

app.get('/api/reports/download/:date', authenticateToken, async (req, res) => {
    try {
        const { date } = req.params;
        const { format } = req.query;

        const reportResult = await pool.query(
            'SELECT * FROM reportes_diarios WHERE fecha = $1',
            [date]
        );

        if (reportResult.rows.length === 0) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        const report = reportResult.rows[0];
        const filename = `reporte_${date}`;

        if (format === 'csv') {
            // Simple CSV format
            let csv = 'Fecha,Total Pedidos,Total Ventas\n';
            csv += `${report.fecha},${report.total_pedidos},${report.total_ventas}\n`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csv);
        } else {
            // JSON format (default)
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.json(report);
        }
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({ error: 'Error al descargar reporte' });
    }
});

// Legacy endpoint for compatibility
app.get('/api/datos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM personal');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🍣 Sushi POS API running on port ${PORT}`);
    console.log(`📊 Database connected: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    console.log(`🔑 JWT configured: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);
});