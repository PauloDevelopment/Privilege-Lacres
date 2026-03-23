let empresaEditando = null;
let empresaParaDeletar = null;

// Toast
function showToast(message, type="success") {
    const toast = document.getElementById("liveToast");
    const messageBox = document.getElementById("toast-message");

    messageBox.innerText = message;
    toast.className = `toast align-items-center text-bg-${type} border-0`;

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    carregarEmpresas();

    const form = document.getElementById("empresa-form");
    if (form) form.addEventListener("submit", salvarEmpresa);
});

// Listar empresas
async function carregarEmpresas() {
    const response = await fetch("/empresas");
    const empresas = await response.json();

    const container = document.getElementById("empresa-list");
    container.innerHTML = "";

    empresas.forEach(e => {
        container.innerHTML += `
        <div class="col-md-6 col-lg-4">
            <div class="card p-3 border-0 shadow-sm">

                <div class="d-flex align-items-center mb-3">
                    <i class="fa-solid fa-building text-primary me-2"></i>
                    <span class="fw-bold">${e.razao_social}</span>
                </div>

                <div class="small text-muted mb-3">
                    <p class="mb-1"><strong>ID Empresa:</strong> ${e.id_empresa}</p>
                    <p class="mb-1"><strong>Nome Comprador:</strong> ${e.nome_comprador}</p>
                    <p class="mb-1"><strong>CNPJ:</strong> ${e.cnpj}</p>
                    <p class="mb-1"><strong>Inscrição Estadual:</strong> ${e.ie}</p>
                    <p class="mb-1"><strong>Telefone:</strong> ${e.telefone}</p>
                    <p class="mb-1"><strong>E-mail:</strong> ${e.email}</p>
                    <p class="mb-1"><strong>Data de Cadastro:</strong> ${e.data_cadastro}</p>
                </div>

                <div class="d-flex border-top pt-3 justify-content-around">
                    <button onclick="editarEmpresa(${e.id_empresa})"
                        class="btn btn-link text-success text-decoration-none small">
                        <i class="fa-solid fa-pen me-1"></i> Editar
                    </button>

                    <button onclick="deletarEmpresa(${e.id_empresa})"
                        class="btn btn-link text-danger text-decoration-none small">
                        <i class="fa-solid fa-trash me-1"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
        `;
    });
}

// Criar ou editar empresas
async function salvarEmpresa(event) {
    event.preventDefault();

    const data = {
        razao_social: document.getElementById("razao_social").value,
        nome_comprador: document.getElementById("nome_comprador").value,
        telefone: document.getElementById("telefone").value.replace(/\D/g,""),
        email: document.getElementById("email").value,
        cnpj: document.getElementById("cnpj").value.replace(/\D/g,""),
        ie: document.getElementById("ie").value
    };

    let url="/empresas";
    let method="POST";

    if(empresaEditando){
        url=`/empresas/${empresaEditando}`;
        method="PUT";
    }

    const response = await fetch(url, {
        method: method,
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if(result.error){
        showToast(result.error,"danger");
        return;
    }

    showToast(result.message,"success");
    empresaEditando = null;
    showList();
    carregarEmpresas();
}

// Carrega dados para edição
async function editarEmpresa(id){
    const response = await fetch(`/empresas/${id}`);
    const data = await response.json();
    const empresa = data.empresa;

    empresaEditando = id;

    document.getElementById("razao_social").value = empresa.razao_social;
    document.getElementById("nome_comprador").value = empresa.nome_comprador;
    document.getElementById("cnpj").value = empresa.cnpj;
    document.getElementById("telefone").value = empresa.telefone;
    document.getElementById("email").value = empresa.email;
    document.getElementById("ie").value = empresa.ie;

    showForm("editar");
}

// Deletar empresa com modal
async function deletarEmpresa(id) {
    empresaParaDeletar = id;

    // Abre o modal
    const modalEl = document.getElementById("confirmModal");
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    // Remove listener antigo para evitar duplicidade
    const btnConfirm = document.getElementById("confirm-delete-btn");
    btnConfirm.replaceWith(btnConfirm.cloneNode(true));
    const newBtn = document.getElementById("confirm-delete-btn");

    newBtn.addEventListener("click", async () => {
        const response = await fetch(`/empresas/${empresaParaDeletar}`, { method: "DELETE" });
        const result = await response.json();

        showToast(result.message, "success");
        bsModal.hide();
        carregarEmpresas();
    });
}

window.showForm = showForm;
window.showList = showList;
window.editarEmpresa = editarEmpresa;
window.deletarEmpresa = deletarEmpresa;
