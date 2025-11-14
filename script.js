document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggle-btn");
  const menuItems = document.querySelectorAll("#sidebar li");
  const panels = document.querySelectorAll(".activity_panel");

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-target");
      panels.forEach(p => p.classList.remove("active"));
      document.getElementById(target).classList.add("active");
    });
  });

  // Mostrar el primero al iniciar
  document.getElementById("orders").classList.add("active");
});

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
    { label: "Pollo - Kanikama", price: 3000, promo: "2x$5000" },
    { label: "Camarón", price: 3500 },
    { label: "Salmón", price: 3500 },
    { label: "Vacuno", price: 3500 }
  ],
  sushiburger: [
    { label: "SushiBurger", price: 6000, promo: "2x$11000" }
  ],
  completo: [
    { label: "Italiano", price: 1000 },
    { label: "Palta Mayo", price: 1200 },
    { label: "Tomate Mayo", price: 1000 },
    { label: "Sólo Vienesa", price: 1000 },
    { label: "Dinámico", price: 1500 }
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
    dialogOptions.innerHTML = `<p>No hay productos disponibles.</p>`;
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

// Agregar al resumen
function addToSummary(name, price) {
  const list = document.querySelector("#summary_order_panel ul");
  const li = document.createElement("li");

  li.innerHTML = `
    <span class="order_mult">x1</span>
    <span class="order_product">${name}</span>
    <span class="order_value">$${price.toLocaleString()}</span>
  `;

  list.appendChild(li);

  updateTotal();
}

// Recalcular total
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

// Activar botones del panel principal
document.querySelectorAll("#products_panel .product_option").forEach(opt => {
  opt.addEventListener("click", () => {
    const id = opt.id;
    const name = opt.querySelector("h3").textContent.trim();
    openProductDialog(id, name);
  });
});