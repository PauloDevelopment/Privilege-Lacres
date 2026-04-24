let usuarioLogado = null;

async function carregarUsuarioLogado() {
    try {
        const response = await fetchAuth("/usuarios/me");
        if (!response) return;

        usuarioLogado = await response.json();

        const nomeEl = document.getElementById("user-name");
        if (nomeEl) nomeEl.innerText = usuarioLogado.name || "Usuário";

    } catch (err) {
        console.error("Erro ao carregar usuário:", err);
    }
}

function abrirPerfil() {
    if (!usuarioLogado) {
        showToast("Erro ao carregar perfil", "danger");
        return;
    }

    document.getElementById("perfil_nome").value = usuarioLogado.name || "";
    document.getElementById("perfil_email").value = usuarioLogado.email || "";
    document.getElementById("perfil_senha").value = "";

    new bootstrap.Modal(document.getElementById("modalPerfil")).show();
}

async function salvarPerfil() {
    const senha = document.getElementById("perfil_senha").value;

    const payload = {
        name: document.getElementById("perfil_nome").value,
        email: document.getElementById("perfil_email").value
    };


    if (senha) {
        payload.password = senha;
    }

    try {
        const response = await fetchAuth("/usuarios/me", {
            method: "PUT",
            body: JSON.stringify(payload)
        });

        if (!response) return;

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalPerfil")).hide();

            showToast("Perfil atualizado com sucesso!", "success");

            await carregarUsuarioLogado(); // atualiza nome no header
        } else {
            const data = await response.json();
            showToast(data.error || "Erro ao atualizar perfil", "danger");
        }

    } catch (err) {
        showToast("Erro interno", "danger");
    }
}