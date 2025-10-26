document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btnLogin");
    const btnRecuperar = document.getElementById("btnRecuperar");
    const mensaje = document.getElementById("mensaje");

    btnLogin.addEventListener("click", () => {
        const usuario = document.getElementById("usuario").value.trim();
        const contrasena = document.getElementById("contrasena").value.trim();

        // Datos de ejemplo
        const userDemo = "admin";
        const passDemo = "1234";

        if (usuario === userDemo && contrasena === passDemo) {
            window.location.href = "main.html"; // Redirigir a la página principal
        } else {
            mensaje.textContent = "Usuario o contraseña incorrectos";
        }
    });

    btnRecuperar.addEventListener("click", () => {
        alert("Función de recuperación aún no implementada.");
    });
});