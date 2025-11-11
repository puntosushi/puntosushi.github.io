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
