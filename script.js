document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const sidebar = document.getElementById("sidebar");
  const menuItems = document.querySelectorAll("#sidebar li");
  const panels = document.querySelectorAll(".activity_panel");
  const toggleBtn = document.getElementById("toggle-btn");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-target");
      panels.forEach(p => p.classList.remove("active"));
      document.getElementById(target).classList.add("active");

      // Load data for specific panels
      if (target === "orders") {
        loadActiveOrders();
      } else if (target === "stock_man") {
        loadStockData();
      } else if (target === "active_orders") {
        loadOrderManagement();
      } else if (target === "report") {
        loadReports();
      }
    });
  });

  // Mostrar el primero al iniciar
  document.getElementById("orders").classList.add("active");

  // Load initial data
  loadActiveOrders();
});

// API Configuration
const API_BASE = 'http://localhost:3001/api';

// Utility function to get auth token
function getAuthToken() {
  return localStorage.getItem('token');
}

// Utility function to make authenticated API calls
async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
      return;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call error:', error);
    alert('Error de conexión. Intenta nuevamente.');
    return null;
  }
}

// Load and display active orders
async function loadActiveOrders() {
  try {
    const data = await apiCall('/orders/active');
    if (data && data.success) {
      displayOrders(data.orders);
    }
  } catch (error) {
    console.error('Error loading active orders:', error);
  }
}

// Display orders in the UI
function displayOrders(orders) {
  const orderList = document.querySelector('.order_list');
  if (!orderList) return;

  orderList.innerHTML = '';

  if (orders.length === 0) {
    orderList.innerHTML = '<li class="no-orders">No hay órdenes activas</li>';
    return;
  }

  orders.forEach(order => {
    const li = document.createElement('li');

    // Extract product names and preferences
    let productDetails = '';
    let waitTime = '';

    if (order.detalles && order.detalles.length > 0) {
      const products = order.detalles.map(detail => {
        const prefs = detail.preferencias ? JSON.parse(detail.preferencias) : {};
        let prefText = '';

        if (prefs.proteina) prefText += prefs.proteina + ' - ';
        if (prefs.vegetal) prefText += prefs.vegetal + ' - ';
        if (prefs.envoltura) prefText += prefs.envoltura;

        return detail.producto + (prefText ? ' ' + prefText : '');
      });
      productDetails = products.join(' ');
    }

    // Calculate wait time from creation date
    if (order.creado_at) {
      const createdTime = new Date(order.creado_at);
      const currentTime = new Date();
      const diffMinutes = Math.floor((currentTime - createdTime) / (1000 * 60));
      const diffSeconds = (currentTime - createdTime) % (1000 * 60);
      waitTime = `${diffMinutes}m ${Math.floor(diffSeconds / 1000)}s`;
    }

    // Determine product type for styling
    let productType = 'completo';
    if (productDetails.toLowerCase().includes('sushi')) productType = 'sushi';
    else if (productDetails.toLowerCase().includes('handroll')) productType = 'handroll';
    else if (productDetails.toLowerCase().includes('lomo')) productType = 'lomo';
    else if (productDetails.toLowerCase().includes('churrasco')) productType = 'churrasco';

    li.innerHTML = `
      <span class="order_number">${order.numero_pedido}</span>
      <span class="order_product_type ${productType}">${productType.charAt(0).toUpperCase() + productType.slice(1)}</span>
      <span class="order_product_category">${productDetails}</span>
      <span class="order_wait_time">${waitTime}</span>
    `;

    orderList.appendChild(li);
  });
}

// Load stock data
async function loadStockData() {
  try {
    const data = await apiCall('/stock');
    if (data && data.success) {
      displayStockData(data.stock);
    }
  } catch (error) {
    console.error('Error loading stock data:', error);
  }
}

// Display stock data in the UI
function displayStockData(stockData) {
  const stockPanel = document.getElementById('stock_panel');
  if (!stockPanel) return;

  const categories = ['Proteínas', 'Vegetales', 'Otros', 'Extras'];

  let html = '';
  categories.forEach(category => {
    const items = stockData[category] || [];
    html += `
      <div class="stock_cat">
        <h2>${category}</h2>
        <ul>
    `;

    items.forEach(item => {
      html += `
        <li>
          <span title="${item.ingrediente}">${item.ingrediente}</span>
          <input type="number"
                 class="stock_counter"
                 id="stock_${item.id}"
                 value="${item.cantidad_disponible}"
                 data-id="${item.id}"
                 data-category="${category}">
          <span>${item.unidad}</span>
        </li>
      `;
    });

    html += `
        </ul>
      </div>
    `;
  });

  html += '<button id="confirm_stock_btn">Confirmar cambios</button>';

  stockPanel.innerHTML = html;

  // Add event listeners for stock inputs
  document.querySelectorAll('.stock_counter').forEach(input => {
    input.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const newQuantity = parseFloat(e.target.value);

      if (newQuantity < 0) {
        alert('La cantidad no puede ser negativa');
        e.target.value = e.target.defaultValue;
        return;
      }

      try {
        const data = await apiCall(`/stock/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ cantidad_disponible: newQuantity })
        });

        if (data && data.success) {
          console.log('Stock updated successfully');
        }
      } catch (error) {
        console.error('Error updating stock:', error);
        e.target.value = e.target.defaultValue;
      }
    });
  });

  // Add event listener for confirm button
  const confirmBtn = document.getElementById('confirm_stock_btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      alert('Cambios de stock confirmados');
    });
  }
}

// Load order management data
async function loadOrderManagement() {
  try {
    const data = await apiCall('/orders/history');
    if (data && data.success) {
      displayOrderManagement(data.orders);
    }
  } catch (error) {
    console.error('Error loading order management:', error);
  }
}

// Display order management data
function displayOrderManagement(orders) {
  const orderManagementPanel = document.querySelector('#active_orders ul');
  if (!orderManagementPanel) return;

  orderManagementPanel.innerHTML = '';

  if (orders.length === 0) {
    orderManagementPanel.innerHTML = '<li>No hay pedidos para gestionar</li>';
    return;
  }

  orders.forEach(order => {
    const li = document.createElement('li');

    // Extract product names
    let productNames = '';
    if (order.detalles && order.detalles.length > 0) {
      productNames = order.detalles.map(detail => detail.producto).join(' - ');
    }

    const statusColors = {
      'en_preparacion': '#e74c3c',
      'completado': '#f39c12',
      'entregado': '#27ae60',
      'cancelado': '#95a5a6'
    };

    const statusText = {
      'en_preparacion': 'En Preparación',
      'completado': 'Completado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };

    li.innerHTML = `
      <span>#${order.numero_pedido}</span>
      <span>${productNames}</span>
      <div class="order_status" style="background-color: ${statusColors[order.estado]};"
           data-order-id="${order.id}"
           data-current-status="${order.estado}">
        ${statusText[order.estado]}
      </div>
      <button class="cancel-order-btn" data-order-id="${order.id}">CANCELAR</button>
    `;

    orderManagementPanel.appendChild(li);
  });

  // Add event listeners for status buttons
  document.querySelectorAll('.order_status').forEach(statusBtn => {
    statusBtn.addEventListener('click', async (e) => {
      const orderId = e.target.dataset.orderId;
      const currentStatus = e.target.dataset.currentStatus;

      // Cycle through statuses
      const statusFlow = ['en_preparacion', 'completado', 'entregado'];
      const currentIndex = statusFlow.indexOf(currentStatus);

      if (currentIndex < statusFlow.length - 1) {
        const newStatus = statusFlow[currentIndex + 1];

        try {
          const data = await apiCall(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ estado: newStatus })
          });

          if (data && data.success) {
            // Reload order management
            loadOrderManagement();
          }
        } catch (error) {
          console.error('Error updating order status:', error);
        }
      }
    });
  });

  // Add event listeners for cancel buttons
  document.querySelectorAll('.cancel-order-btn').forEach(cancelBtn => {
    let holdTimer;

    const startHold = () => {
      holdTimer = setTimeout(async () => {
        const orderId = cancelBtn.dataset.orderId;

        try {
          const data = await apiCall(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ estado: 'cancelado' })
          });

          if (data && data.success) {
            loadOrderManagement();
          }
        } catch (error) {
          console.error('Error canceling order:', error);
        }
      }, 1500); // 1.5 seconds hold
    };

    const cancelHold = () => {
      clearTimeout(holdTimer);
    };

    cancelBtn.addEventListener('mousedown', startHold);
    cancelBtn.addEventListener('mouseup', cancelHold);
    cancelBtn.addEventListener('mouseleave', cancelHold);
    cancelBtn.addEventListener('touchstart', startHold);
    cancelBtn.addEventListener('touchend', cancelHold);
  });
}

// Load reports
async function loadReports() {
  try {
    const data = await apiCall('/reports/list');
    if (data && data.success) {
      displayReports(data.reports);
    }
  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

// Display reports in the UI
function displayReports(reports) {
  const reportPanel = document.getElementById('report');
  if (!reportPanel) return;

  let html = '<h1>REPORTE COMBINADO</h1>';

  // Show today's date
  const today = new Date().toISOString().split('T')[0];
  html += `<div>Reporte Hoy: ${today} <button class="generate-report-btn" data-date="${today}">Generar Reporte</button></div>`;

  // Show existing reports
  if (reports && reports.length > 0) {
    reports.forEach(report => {
      const dateStr = new Date(report.fecha).toLocaleDateString('es-CL');
      html += `
        <div>
          Reporte ${dateStr}
          <button class="download-report-btn" data-date="${report.fecha}">Descargar</button>
          <button class="generate-report-btn" data-date="${report.fecha}">Generar Reporte</button>
        </div>
      `;
    });
  } else {
    html += '<div>No hay reportes anteriores</div>';
  }

  reportPanel.innerHTML = html;

  // Add event listeners for report buttons
  document.querySelectorAll('.generate-report-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const date = e.target.dataset.date;

      try {
        const data = await apiCall(`/reports/generate/${date}`, {
          method: 'POST'
        });

        if (data && data.success) {
          alert('Reporte generado exitosamente');
        }
      } catch (error) {
        console.error('Error generating report:', error);
      }
    });
  });

  document.querySelectorAll('.download-report-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const date = e.target.dataset.date;

      // Download as JSON
      window.open(`${API_BASE}/reports/download/${date}?format=json`, '_blank');
    });
  });
}

const PRODUCT_DATA = {
  sushi: [
    { label: "12 Piezas",   price: 3500 },
    { label: "24 Piezas",   price: 7000 },
    { label: "36 Piezas",   price: 10000 },
    { label: "48 Piezas",   price: 12000 },
    { label: "60 Piezas",   price: 14000 },
    { label: "72 Piezas",   price: 17000 },
    { label: "84 Piezas",   price: 19500 },
    { label: "96 Piezas",   price: 22000 },
    { label: "108 Piezas",  price: 24500 },
    { label: "120 Piezas",  price: 27000 }
  ],
  handroll: [
    { label: "x1 Pollo - Kanikama", price: 3000},
    { label: "x2 Pollo - Kanikama", price: 5000},
    { label: "Camarón", price: 3500 },
    { label: "Salmón", price: 3500 },
    { label: "Vacuno", price: 3500 }
  ],
  sushiburger: [
    { label: "x1", price: 6000},
    { label: "x2", price: 11000}
  ],
  vianesa: [
    { label: "Italiana", price: 1000 },
    { label: "Palta Mayo", price: 1200 },
    { label: "Tomate Mayo", price: 1000 },
    { label: "Sólo Vienesa", price: 1000 },
    { label: "Dinámica", price: 1500 }
  ],
  lomo: [
    { label: "Italiano", price: 4000 },
    { label: "Palta Mayo", price: 4000 },
    { label: "Tomate Mayo", price: 4000 },
    { label: "Sólo Carne", price: 3500 },
    { label: "Lomo Luco", price: 4000 },
    { label: "Brasileño", price: 4500 }
  ],
  churrasco: [
    { label: "Italiano", price: 4000 },
    { label: "Palta Mayo", price: 4000 },
    { label: "Tomate Mayo", price: 4000 },
    { label: "Sólo Carne", price: 3500 },
    { label: "Barros Luco", price: 4000 },
    { label: "Brasileño", price: 4500 }
  ],
  snack: [],
  bebestible: [],
  aderezo: [
    { label: "Salsa Teriyaki", price: 500 },
    { label: "Soya", price: 500 }
  ],
};

// Elementos del dialog
const overlay = document.getElementById("product_dialog_overlay");
const dialog = document.getElementById("product_dialog");
const dialogTitle = document.getElementById("dialog_title");
const dialogOptions = document.getElementById("dialog_options");

// Abrir panel
function openProductDialog(productId, productName) {
  const options = PRODUCT_DATA[productId];

  dialogTitle.textContent = productName;

  dialogOptions.innerHTML = "";

  if (!options || options.length === 0) {
    dialogOptions.innerHTML = `<p>Sin productos para mostrar. Mejora tu plan para agregar productos.</p>`;
  } else {
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "dialog_option_btn";

      let text = `${opt.label} - $${opt.price.toLocaleString()}`;
      if (opt.promo) text += ` (${opt.promo})`;

      btn.textContent = text;

      btn.addEventListener("click", () => {
        addToSummary(productName + " " + opt.label, opt.price);
        closeDialog();
      });

      dialogOptions.appendChild(btn);
    });
  }

  overlay.style.display = "flex";
}

// Cerrar al hacer clic afuera
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeDialog();
});

function closeDialog() {
  overlay.style.display = "none";
}


// Activar botones del panel principal
document.querySelectorAll("#products_panel .product_option").forEach(opt => {
  opt.addEventListener("click", () => {
    const id = opt.id;
    const name = opt.querySelector("h3").textContent.trim();
    openProductDialog(id, name);
  });
});

// STEPPER PARA EL PEDIDO
const stepper = document.querySelectorAll("#circle_stepper .step");

function activateStepper(targetId) {
  stepper.forEach(s => {
    s.classList.toggle("active", s.dataset.id === targetId);
  });

  // Lógica que tú conectas para mostrar los paneles correctos:
  onStepChange(targetId);
}

// Evento: clic en cada círculo
stepper.forEach(s => {
  s.addEventListener("click", () => {
    activateStepper(s.dataset.id);
  });
});

// Callback que tú usas para operar los paneles
function onStepChange(step) {

  // Ocultar los 3 paneles
  document.getElementById("products_panel").style.display = "none";
  document.getElementById("preferences_panel").style.display = "none";
  document.getElementById("summary_panel").style.display = "none";

  // Mostrar según el step seleccionado
  if (step === "productos")
    document.getElementById("products_panel").style.display = "grid";

  if (step === "preferencias")
    document.getElementById("preferences_panel").style.display = "block";

  if (step === "resumen")
    document.getElementById("summary_panel").style.display = "block";
}

// Inicializa en productos
activateStepper("productos");


// Order data storage
let orderItems = [];

// Add to summary with real order tracking
function addToSummary(name, price, productId = 1, preferences = {}) {
  const list = document.querySelector("#summary_order_panel ul");
  const li = document.createElement("li");

  // Generate unique ID for this order item
  const orderItemId = Date.now() + Math.random();

  li.innerHTML = `
    <span class="order_product_summary" data-order-item-id="${orderItemId}">${name}</span>
    <span class="order_value">$${price.toLocaleString()}</span>
    <button class="remove-item-btn" data-order-item-id="${orderItemId}">[X]</button>
  `;

  list.appendChild(li);

  // Store order item data
  orderItems.push({
    id: orderItemId,
    name: name,
    price: price,
    producto_id: productId,
    preferencias: preferences,
    cantidad: 1,
    subtotal: price
  });

  updateTotal();

  // Add event listener for remove button
  li.querySelector('.remove-item-btn').addEventListener('click', (e) => {
    const itemId = parseInt(e.target.dataset.orderItemId);
    orderItems = orderItems.filter(item => item.id !== itemId);
    li.remove();
    updateTotal();
  });
}

// Recalculate total
function updateTotal() {
  const values = [...document.querySelectorAll(".order_value")];
  let total = 0;

  values.forEach(v => {
    const num = Number(v.textContent.replace("$", "").replace(".", "").replace(",", ""));
    total += num;
  });

  document.getElementById("order_total_value").textContent =
    "$" + total.toLocaleString();
}

// BOTON DE CONFIRMAR PEDIDO
// Visual de carga
const confirmBtn = document.getElementById("order_confirm");

let holdTimer;

confirmBtn.addEventListener("mousedown", async () => {
  if (orderItems.length === 0) {
    alert('Debes agregar al menos un producto al pedido');
    return;
  }

  confirmBtn.classList.add("loading");

  holdTimer = setTimeout(async () => {
    try {
      // Prepare order data
      const orderData = {
        items: orderItems.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          preferencias: item.preferencias,
          subtotal: item.subtotal
        }))
      };

      // Send order to API
      const data = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      if (data && data.success) {
        alert(`Pedido #${data.order.numero_pedido} creado exitosamente!`);

        // Clear order summary
        orderItems = [];
        document.querySelector("#summary_order_panel ul").innerHTML = '';
        updateTotal();

        // Refresh active orders display
        loadActiveOrders();

        // Reset stepper to products
        activateStepper("productos");
      } else {
        alert('Error al crear el pedido. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error de conexión. Intenta nuevamente.');
    } finally {
      confirmBtn.classList.remove("loading");
    }
  }, 2000);
});

confirmBtn.addEventListener("mouseup", cancelHold);
confirmBtn.addEventListener("mouseleave", cancelHold);
confirmBtn.addEventListener("touchend", cancelHold);

function cancelHold() {
  clearTimeout(holdTimer);
  confirmBtn.classList.remove("loading");
}