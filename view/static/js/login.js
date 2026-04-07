const API_URL = "/usuarios/login";

document.addEventListener("DOMContentLoaded", () => {
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
                document.getElementById("login-message").innerText =
                    data.error || "Erro ao fazer login";
                return;
            }

            // salva token
            localStorage.setItem("token", data.access_token);

            // redireciona
            window.location.href = "/";

        } catch (err) {
            document.getElementById("login-message").innerText =
                "Erro de conexão com o servidor";
        }
    });
});