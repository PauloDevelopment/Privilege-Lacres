let produtoEditando = null;
let produtoParaDeletar = null;

document.addEventListener("DOMContentLoaded", async () => {
    await requireAuth();
    carregarProdutos();

    const form = document.getElementById("produto-form");
    if (form) form.addEventListener("submit", salvarProduto);
});

function showToast(message, type = "success") {
    const toast = document.getElementById("liveToast");
    const messageBox = document.getElementById("toast-message");

    if (!toast || !messageBox) return;

    messageBox.innerText = message;
    toast.className = `toast align-items-center text-bg-${type} border-0`;

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

async function carregarProdutos(termo = '') {
    try {
        const url = termo
            ? `/produtos/buscar?q=${encodeURIComponent(termo)}`
            : '/produtos';

        const response = await fetchAuth(url);
        if (!response) return;

        const produtos = await response.json();
        const container = document.getElementById("produto-list");
        container.innerHTML = "";

        if (!response.ok) {
            showToast(produtos.error || "Erro ao carregar produtos.", "danger");
            return;
        }

        if (produtos.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="fa-solid fa-box-open fa-2x mb-3 d-block"></i>
                    Nenhum produto encontrado${termo ? ` para "<strong>${termo}</strong>"` : ''}.
                </div>`;
            return;
        }

        produtos.forEach(produto => {
            const valor = Number(produto.valor_milheiro || 0)
                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            container.innerHTML += `
                <div class="col-md-6 col-lg-4">
                    <div class="card p-3 border-0 shadow-sm h-100">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fa-solid fa-box text-primary me-2"></i>
                            <span class="fw-bold text-primary">${produto.nome}</span>
                        </div>

                        <div class="small text-muted mb-3 flex-grow-1">
                            <p class="mb-1"><strong>ID Produto:</strong> ${produto.id_produto}</p>
                            <p class="mb-1"><strong>Valor do Milheiro:</strong> ${valor}</p>
                            <p class="mb-1"><strong>Data de Cadastro:</strong> ${produto.data_cadastro || '-'}</p>
                            ${produto.descricao ? `
                                <hr class="my-2">
                                <p class="mb-1 fw-bold text-dark">
                                    <i class="fa-solid fa-note-sticky me-1 text-primary"></i>Descrição
                                </p>
                                <p class="mb-0">${produto.descricao}</p>
                            ` : ''}
                        </div>

                        <div class="d-flex border-top pt-3 justify-content-around">
                            <button onclick="editarProduto(${produto.id_produto})"
                                    class="btn btn-link text-success text-decoration-none small">
                                <i class="fa-solid fa-pen me-1"></i> Editar
                            </button>

                            <button onclick="deletarProduto(${produto.id_produto})"
                                    class="btn btn-link text-danger text-decoration-none small">
                                <i class="fa-solid fa-trash me-1"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>`;
        });

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        showToast("Erro ao carregar produtos.", "danger");
    }
}

async function salvarProduto(event) {
    event.preventDefault();

    const data = {
        nome: document.getElementById("nome_produto").value.trim(),
        valor_milheiro: parseFloat(document.getElementById("valor_milheiro").value),
        descricao: document.getElementById("descricao_produto").value.trim()
    };

    let url = "/produtos";
    let method = "POST";

    if (produtoEditando) {
        url = `/produtos/${produtoEditando}`;
        method = "PUT";
    }

    try {
        const response = await fetchAuth(url, {
            method,
            body: JSON.stringify(data)
        });
        if (!response) return;

        const result = await response.json();

        if (!response.ok || result.error) {
            showToast(result.error || "Erro ao salvar produto.", "danger");
            return;
        }

        showToast(result.message, "success");
        produtoEditando = null;
        showProdutoList();
        carregarProdutos();

    } catch (error) {
        console.error("Erro ao salvar produto:", error);
        showToast("Erro interno ao salvar produto.", "danger");
    }
}

async function editarProduto(id) {
    try {
        const response = await fetchAuth(`/produtos/${id}`);
        if (!response) return;

        const data = await response.json();
        if (!response.ok) {
            showToast(data.error || "Erro ao carregar produto.", "danger");
            return;
        }

        produtoEditando = id;
        document.getElementById("nome_produto").value = data.produto.nome;
        document.getElementById("valor_milheiro").value = data.produto.valor_milheiro;
        document.getElementById("descricao_produto").value = data.produto.descricao || '';

        showProdutoForm("editar");

    } catch (error) {
        console.error("Erro ao editar produto:", error);
        showToast("Erro ao carregar produto.", "danger");
    }
}

function showProdutoForm(modo) {
    const list = document.getElementById('section-list');
    const formSection = document.getElementById('section-form');
    const title = document.getElementById('produto-form-title');
    const btn = document.getElementById('btn-submit-produto');
    const form = document.getElementById('produto-form');

    list.style.display = 'none';
    formSection.style.display = 'block';

    if (modo === 'editar') {
        title.innerText = 'Editar Produto';
        btn.innerHTML = '<i class="fa-solid fa-check me-2"></i>Atualizar Produto';
    } else {
        title.innerText = 'Novo Produto';
        btn.innerHTML = '<i class="fa-solid fa-plus me-2"></i>Salvar Produto';
        form.reset();
        produtoEditando = null;
    }
}

function showProdutoList() {
    document.getElementById('section-list').style.display = 'block';
    document.getElementById('section-form').style.display = 'none';
}

async function deletarProduto(id) {
    produtoParaDeletar = id;

    const modalEl = document.getElementById("confirmModalProduto");
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    const btnConfirm = document.getElementById("confirm-delete-produto-btn");
    btnConfirm.replaceWith(btnConfirm.cloneNode(true));
    const newBtn = document.getElementById("confirm-delete-produto-btn");

    newBtn.addEventListener("click", async () => {
        try {
            const response = await fetchAuth(`/produtos/${produtoParaDeletar}`, {
                method: "DELETE"
            });
            if (!response) return;

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, "success");
                bsModal.hide();
                carregarProdutos();
            } else {
                showToast(result.error || "Erro ao excluir produto.", "danger");
            }

        } catch (error) {
            console.error("Erro ao excluir produto:", error);
            showToast("Erro interno ao excluir produto.", "danger");
        }
    });
}

let buscaProdutoTimer = null;
function buscarProdutos() {
    const termo = document.getElementById('input-busca-produto').value.trim();
    clearTimeout(buscaProdutoTimer);
    buscaProdutoTimer = setTimeout(() => carregarProdutos(termo), 300);
}

window.showProdutoForm = showProdutoForm;
window.showProdutoList = showProdutoList;
window.editarProduto = editarProduto;
window.deletarProduto = deletarProduto;
window.buscarProdutos = buscarProdutos;
