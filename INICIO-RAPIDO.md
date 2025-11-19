# 🍣 Sistema Punto de Sushi - Inicio Rápido

## 🚀 Arranque Inmediato (Sin Base de Datos)

### Paso 1: Instalar dependencias
```bash
cd backend
npm install
```

### Paso 2: Iniciar el backend
```bash
cd backend
node backend-simple.js
```

### Paso 3: Abrir el frontend
Opción A: Doble click en `login.html`

Opción B: Servidor local
```bash
# En la carpeta principal
python -m http.server 3000
# Luego abrir http://localhost:3000/login.html
```

### Paso 4: Iniciar sesión
- **Usuario**: admin
- **Contraseña**: admin123

## ✅ Características Disponibles

- 🔐 **Login seguro** (admin/admin123)
- 📋 **Pedidos activos** en tiempo real
- ➕ **Crear pedidos** con todos los productos
- 📦 **Control de stock** por categorías
- 🔄 **Gestión de pedidos** con estados
- 📊 **Reportes diarios** y descargas
- 💾 **Persistencia local** (datos se guardan en `data.json`)

## 🎯 Flujo de Uso

1. **Login** → Entra con admin/admin123
2. **Órdenes Activas** → Ve pedidos en cocina
3. **Ingreso de Pedidos** → Crea nuevos pedidos
4. **Control de Pedidos** → Cambia estados (En Preparación → Completado → Entregado)
5. **Control de Stock** → Actualiza inventario
6. **Informes** → Genera y descarga reportes

## 🔧 Si algo no funciona

1. **Revisa que el backend esté corriendo**:
   - Debe mostrar: "Sushi POS API (Local) running on port 3001"

2. **Revisa la consola del navegador**:
   - F12 → Console para ver errores

3. **Verifica que estén los puertos correctos**:
   - Backend: http://localhost:3001
   - Frontend: http://localhost:3000

4. **Reinicia todo**:
   ```bash
   # Cierra el backend (Ctrl+C)
   # Elimina data.json si quieres empezar de cero
   rm backend/data.json
   # Vuelve a iniciar
   node backend-simple.js
   ```

## 📱 Datos de Ejemplo

El sistema incluye:
- **29 productos** con precios exactos
- **18 items de stock** en 4 categorías
- **Pedidos de prueba** que persisten

## 🎉 ¡Listo!

El sistema está funcionando 100% offline con todos los datos locales. ¡Puedes empezar a usarlo!