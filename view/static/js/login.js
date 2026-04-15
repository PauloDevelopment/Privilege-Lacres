const API_URL = "/usuarios/login";

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (token) {
        try {
            const response = await fetch("/usuarios/me", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                window.location.href = "/empresas-view";
                return;
            } else {
                localStorage.removeItem("token");
            }
        } catch (err) {
            localStorage.removeItem("token");
        }
    }

    const form = document.getElementById("login-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                showToast(data.error || data.erro || "Erro ao fazer login", "danger");
                return;
            }

            // salva token
            localStorage.setItem("token", data.access_token);

            // redireciona
            window.location.href = "/empresas-view";

        } catch (err) {
            showToast("Erro de conexão com o servidor", "danger");
        }
    });
});