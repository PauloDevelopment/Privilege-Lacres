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
                <span class="fw-bold text-primary" 
                      style="cursor:pointer;" 
                      onclick="abrirPedidosEmpresa(${e.id_empresa}, '${e.razao_social}')"
                      title="Ver pedidos desta empresa">
                    ${e.razao_social}
                </span>
            </div>

            <div class="small text-muted mb-3">
                <p class="mb-1"><strong>ID Empresa:</strong> ${e.id_empresa}</p>
                <p class="mb-1"><strong>Nome Comprador:</strong> ${e.nome_comprador}</p>
                <p class="mb-1"><strong>CNPJ:</strong> ${formatarCNPJ(e.cnpj)}</p>
                <p class="mb-1"><strong>Inscrição Estadual:</strong> ${e.ie}</p>
                <p class="mb-1"><strong>Telefone:</strong> ${formatarTelefone(e.telefone)}</p>
                <p class="mb-1"><strong>E-mail:</strong> ${e.email}</p>
                <p class="mb-1"><strong>Data de Cadastro:</strong> ${e.data_cadastro}</p>

                ${e.rua || e.cidade || e.estado || e.cep ? `
                <hr class="my-2">
                <p class="mb-1 fw-bold text-dark">
                    <i class="fa-solid fa-location-dot me-1 text-primary"></i>Endereço
                </p>
                ${e.rua    ? `<p class="mb-1"><strong>Rua:</strong> ${e.rua}</p>` : ''}
                ${e.cidade ? `<p class="mb-1"><strong>Cidade:</strong> ${e.cidade}</p>` : ''}
                ${e.estado ? `<p class="mb-1"><strong>Estado:</strong> ${e.estado}</p>` : ''}
                ${e.cep    ? `<p class="mb-1"><strong>CEP:</strong> ${formatarCEP(e.cep)}</p>` : ''}
                ` : ''}

                ${e.observacao ? `
                <hr class="my-2">
                <p class="mb-1 fw-bold text-dark">
                    <i class="fa-solid fa-note-sticky me-1 text-primary"></i>Observação
                </p>
                <p class="mb-0 fst-italic">${e.observacao}</p>
                ` : ''}
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
        ie: document.getElementById("ie").value,
        rua: document.getElementById("rua").value,
        cidade: document.getElementById("cidade").value,
        estado: document.getElementById("estado").value,
        cep: document.getElementById("cep").value.replace(/\D/g, ""),
        observacao: document.getElementById("observacao").value
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
    document.getElementById("rua").value = empresa.rua || '';
    document.getElementById("cidade").value = empresa.cidade || '';
    document.getElementById("estado").value = empresa.estado || '';
    document.getElementById("cep").value = empresa.cep || '';
    document.getElementById("observacao").value = empresa.observacao || '';

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

        if (response.ok) {
            showToast(result.message, "success");
            bsModal.hide();
            carregarEmpresas();
        } else {
            showToast(result.error, "danger");
        }
    });
}

async function abrirPedidosEmpresa(id, nome) {
    const modal = new bootstrap.Modal(document.getElementById('modalPedidosEmpresa'));
    const titulo = document.getElementById('modalPedidosEmpresaTitulo');
    const subtitulo = document.getElementById('modalPedidosEmpresaSubtitulo');
    const body = document.getElementById('modalPedidosEmpresaBody');

    titulo.textContent = `Pedidos — ${nome}`;
    subtitulo.textContent = '';
    body.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted small">Carregando pedidos...</p>
        </div>`;
    modal.show();

    try {
        const response = await fetch(`/empresas/${id}/pedidos`);
        const data = await response.json();

        subtitulo.textContent = `${data.total} pedido(s) encontrado(s)`;

        if (data.total === 0) {
            body.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fa-solid fa-file-circle-xmark fa-2x mb-3"></i>
                    <p>Nenhum pedido cadastrado para esta empresa.</p>
                </div>`;
            return;
        }

        const statusClass = (status) => {
            if (status === 'Pendente')     return 'bg-warning text-dark';
            if (status === 'Em Produção')  return 'bg-primary';
            if (status === 'Concluído')    return 'bg-success';
            return 'bg-secondary';
        };

        let linhas = data.pedidos.map(p => `
            <tr>
                <td class="fw-bold">${p.numero_pedido}</td>
                <td>${p.data || '—'}</td>
                <td><span class="badge ${statusClass(p.status)}">${p.status || '—'}</span></td>
                <td>${p.nf || '—'}</td>
                <td>${p.vencimento || '—'}</td>
                <td>${p.data_entrega || '—'}</td>
                <td class="text-end fw-bold">
                    R$ ${(p.total_pedido || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="abrirDetalhePedido(${p.pedido_id})">
                        <i class="fa-solid fa-eye me-1"></i> Ver Detalhes
                    </button>
                </td>
            </tr>
        `).join('');

        body.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Nº Pedido</th>
                            <th>Data</th>
                            <th>Status</th>
                            <th>NF</th>
                            <th>Vencimento</th>
                            <th>Entrega</th>
                            <th class="text-end">Total</th>
                            <th class="text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>${linhas}</tbody>
                </table>
            </div>`;

    } catch (err) {
        body.innerHTML = `<p class="text-danger text-center">Erro ao carregar pedidos.</p>`;
    }
}

async function abrirDetalhePedido(pedidoId) {
    bootstrap.Modal.getInstance(
        document.getElementById('modalPedidosEmpresa')
    ).hide();

    const modal = new bootstrap.Modal(
        document.getElementById('modalDetalhePedido')
    );
    const titulo = document.getElementById('modalDetalheTitulo');
    const subtitulo = document.getElementById('modalDetalheSubtitulo');
    const body = document.getElementById('modalDetalheBody');

    titulo.textContent = 'Detalhes do Pedido';
    subtitulo.textContent = '';
    body.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted small">Carregando detalhes...</p>
        </div>`;
    modal.show();

    try {
        const response = await fetch(`/pedidos/${pedidoId}`);
        const p = await response.json();

        titulo.textContent = `Pedido Nº ${p.numero_pedido}`;
        subtitulo.textContent = `Emitido em ${p.data || '—'}`;

        const statusClass =
            p.status === 'Pendente'    ? 'bg-warning text-dark' :
            p.status === 'Em Produção' ? 'bg-primary' :
            p.status === 'Concluído'   ? 'bg-success' : 'bg-secondary';

        const linhasItens = p.itens.map(item => `
            <tr>
                <td>${item.produto}</td>
                <td class="text-center">${item.quantidade}</td>
                <td class="text-end">
                    R$ ${item.valor_milheiro.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </td>
                <td class="text-end fw-bold">
                    R$ ${item.soma.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </td>
            </tr>
        `).join('');

        body.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <p class="mb-1 text-muted small">Status</p>
                    <span class="badge ${statusClass} px-3">${p.status || '—'}</span>
                </div>
                <div class="col-md-4">
                    <p class="mb-1 text-muted small">Nota Fiscal</p>
                    <p class="fw-bold mb-0">${p.nf || '—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="mb-1 text-muted small">Total NF</p>
                    <p class="fw-bold mb-0">
                        R$ ${p.total_nf 
                            ? parseFloat(p.total_nf).toLocaleString('pt-BR', {minimumFractionDigits: 2}) 
                            : '—'}
                    </p>
                </div>
                <div class="col-md-4">
                    <p class="mb-1 text-muted small">Vencimento</p>
                    <p class="fw-bold mb-0">${p.vencimento || '—'}</p>
                </div>
                <div class="col-md-4">
                    <p class="mb-1 text-muted small">Data de Entrega</p>
                    <p class="fw-bold mb-0">${p.data_entrega || '—'}</p>
                </div>
            </div>

            <hr>

            <h6 class="fw-bold mb-3">
                <i class="fa-solid fa-boxes-stacked me-2 text-primary"></i>Itens do Pedido
            </h6>
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Produto</th>
                            <th class="text-center">Quantidade</th>
                            <th class="text-end">Valor Milheiro</th>
                            <th class="text-end">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${linhasItens}</tbody>
                    <tfoot class="table-light">
                        <tr>
                            <td colspan="3" class="text-end fw-bold">Total do Pedido</td>
                            <td class="text-end fw-bold text-primary">
                                R$ ${(p.total_pedido || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!-- BOTÃO EDITAR NO RODAPÉ DO MODAL -->
            <div class="d-flex justify-content-end mt-3 pt-3 border-top">
                <button class="btn btn-dark px-4"
                        onclick="editarPedidoDetalhe(${p.pedido_id})">
                    <i class="fa-solid fa-pen me-2"></i>Editar Pedido
                </button>
            </div>`;

    } catch (err) {
        body.innerHTML = `<p class="text-danger text-center">Erro ao carregar detalhes do pedido.</p>`;
    }
}

async function editarPedidoDetalhe(pedidoId) {
    // Fecha o modal de detalhes
    bootstrap.Modal.getInstance(
        document.getElementById('modalDetalhePedido')
    ).hide();

    // Redireciona para a página de pedidos passando o id via query string
    window.location.href = `/pedidos/view?editar=${pedidoId}`;
}

window.editarPedidoDetalhe = editarPedidoDetalhe;

function formatarCNPJ(cnpj) {
    if (!cnpj || cnpj.length !== 14) return cnpj;
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatarTelefone(tel) {
    if (!tel) return tel;
    if (tel.length === 11)
        return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (tel.length === 10)
        return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return tel;
}

function formatarCEP(cep) {
    if (!cep || cep.length !== 8) return cep;
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}


window.abrirDetalhePedido = abrirDetalhePedido;
window.abrirPedidosEmpresa = abrirPedidosEmpresa;
window.showForm = showForm;
window.showList = showList;
window.editarEmpresa = editarEmpresa;
window.deletarEmpresa = deletarEmpresa;
