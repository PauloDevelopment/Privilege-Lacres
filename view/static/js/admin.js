document.addEventListener("DOMContentLoaded", async () => {
    await requireAdmin();
    listarUsuarios();
});

// TOAST
function showToast(message, type = "success") {
    const toast = document.getElementById("liveToast");
    const messageBox = document.getElementById("toast-message");

    messageBox.innerText = message;
    toast.className = `toast align-items-center text-bg-${type} border-0`;

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// LISTAR USUÁRIOS
async function listarUsuarios() {
    try {
        const response = await fetchAuth("/usuarios");

        if (!response) return;

        const usuarios = await response.json();
        const tbody = document.getElementById("tabela-usuarios");

        tbody.innerHTML = "";

        usuarios.forEach(user => {
            const badgeRole =
                user.role === "admin"
                    ? "bg-danger"
                    : "bg-secondary";

            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold">${user.id_usuario}</td>

                    <td>${user.name}</td>

                    <td>${user.email}</td>

                    <td>
                        <span class="badge ${badgeRole}">
                            ${user.role}
                        </span>
                    </td>

                    <td class="text-center">

                        <button class="btn btn-link text-success text-decoration-none small"
                                onclick="editarUsuario(${user.id_usuario})">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="btn btn-link text-danger text-decoration-none small"
                                onclick="deletarUsuario(${user.id_usuario})">
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        showToast("Erro ao carregar usuários.", "danger");
    }
}

// NOVO USUÁRIO
function novoUsuario() {
    document.getElementById("formUsuario").reset();
    document.getElementById("usuario_id").value = "";
}

// EDITAR USUÁRIO
async function editarUsuario(id) {
    try {
        const response = await fetchAuth(`/usuarios/${id}`);

        if (!response) return;

        const data = await response.json();
        const user = data.usuario;

        document.getElementById("usuario_id").value = user.id_usuario;
        document.getElementById("nome").value = user.name;
        document.getElementById("email").value = user.email;
        document.getElementById("role").value = user.role;
        document.getElementById("senha").value = "";

        new bootstrap.Modal(
            document.getElementById("modalUsuario")
        ).show();

    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        showToast("Erro ao carregar usuário.", "danger");
    }
}

// SALVAR USUÁRIO
async function salvarUsuario() {
    const id = document.getElementById("usuario_id").value;

    const payload = {
        name: document.getElementById("nome").value,
        email: document.getElementById("email").value,
        password: document.getElementById("senha").value,
        role: document.getElementById("role").value
    };

    const url = id ? `/usuarios/${id}` : "/usuarios";
    const method = id ? "PUT" : "POST";

    try {
        const response = await fetchAuth(url, {
            method: method,
            body: JSON.stringify(payload)
        });

        if (!response) return;

        if (response.ok) {
            bootstrap.Modal
                .getInstance(document.getElementById("modalUsuario"))
                .hide();

            showToast("Usuário salvo com sucesso!", "success");
            listarUsuarios();

        } else {
            const data = await response.json();
            showToast(data.error || "Erro ao salvar usuário.", "danger");
        }

    } catch (error) {
        console.error("Erro ao salvar usuário:", error);
        showToast("Erro interno ao salvar.", "danger");
    }
}

// DELETAR USUÁRIO
let usuarioParaDeletar = null;

function deletarUsuario(id) {
    usuarioParaDeletar = id;

    const modalEl = document.getElementById("confirmModalUsuario");
    const modal = new bootstrap.Modal(modalEl);

    modal.show();

    const btn = document.getElementById("confirm-delete-usuario-btn");

    btn.replaceWith(btn.cloneNode(true));

    const novoBtn = document.getElementById("confirm-delete-usuario-btn");

    novoBtn.addEventListener("click", async () => {
        try {
            const response = await fetchAuth(
                `/usuarios/${usuarioParaDeletar}`,
                {
                    method: "DELETE"
                }
            );

            if (!response) return;

            if (response.ok) {
                modal.hide();
                showToast("Usuário excluído com sucesso!", "success");
                listarUsuarios();

            } else {
                const data = await response.json();
                showToast(data.error || "Erro ao excluir.", "danger");
            }

        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            showToast("Erro interno ao excluir.", "danger");
        }
    });
}