console.log("JS carregado");
// Configuração da URL base do seu servidor Flask
const API_BASE_URL = 'http://localhost:5000'; 


// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    listarPedidos();
    carregarEmpresasSelect();
});

/**
 * 1. LISTAGEM DE PEDIDOS (READ)
 * Busca os pedidos no Flask e preenche a tabela
 */
async function excluirPedido(id) {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            listarPedidos();
        } else {
            alert("Erro ao excluir pedido.");
        }
    } catch (error) {
        console.error("Erro ao excluir:", error);
    }
}
async function listarPedidos() {
    try {
        const response = await fetch(`${API_BASE_URL}/pedidos`);
        const pedidos = await response.json();
        
        const corpoTabela = document.getElementById('tabela-pedidos-corpo');
        corpoTabela.innerHTML = '';

        pedidos.forEach(p => {
            // Calcula o total somando os itens (usando a lógica do seu to_dict)
            const totalCalculado = p.total || 0;
            
            // Define a cor do badge de status baseada no seu anexo
            const statusClass = p.status === 'Pendente' ? 'bg-warning text-dark' : 
                                p.status === 'Em Produção' ? 'bg-primary' : 'bg-success';

            corpoTabela.innerHTML += `
                <tr>
                    <td class="fw-bold">${p.numero_pedido}</td>
                    <td class="text-primary">Empresa ID: ${p.id_empresa}</td>
                    <td>${p.data}</td>
                    <td><span class="badge ${statusClass} px-3">${p.status}</span></td>
                    <td class="text-end fw-bold text-dark">R$ ${totalCalculado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td class="text-center">
                        <button class="btn btn-sm text-secondary me-2" onclick="editarPedido(${p.pedido_id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm text-danger" onclick="excluirPedido(${p.pedido_id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Erro ao listar pedidos:", error);
    }
}

/**
 * 2. GERENCIAMENTO DE ITENS DINÂMICOS
 * Adiciona uma nova linha de produto no modal
 */
function adicionarLinhaItem(dados = {}) {
    const container = document.getElementById('container-itens');
    const idLinha = Date.now(); // Gera um ID temporário único para a linha

    const div = document.createElement('div');
    div.className = 'row g-2 mb-2 align-items-end item-row';
    div.id = `item-${idLinha}`;
    
    div.innerHTML = `
        <div class="col-md-6">
            <input type="text" class="form-control campo-produto" placeholder="Produto" value="${dados.produto || ''}" required>
        </div>
        <div class="col-md-2">
            <input type="number" step="0.001" class="form-control text-center campo-quantidade" placeholder="Qtd" oninput="calcularTotalPedido()" value="${dados.quantidade || 1}" required>
        </div>
        <div class="col-md-3">
            <input type="number" step="0.01" class="form-control campo-valor" placeholder="Valor Milheiro" oninput="calcularTotalPedido()" value="${dados.valor_milheiro || 0}" required>
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-outline-danger border-0" onclick="removerLinhaItem('${idLinha}')">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(div);
}

function removerLinhaItem(id) {
    document.getElementById(`item-${id}`).remove();
    calcularTotalPedido();
}

/**
 * 3. CÁLCULO DE TOTAL (SOMA PRODUTO X QTD)
 * Atualiza o valor visual no modal
 */
function calcularTotalPedido() {
    let totalGeral = 0;
    const linhas = document.querySelectorAll('.item-row');
    
    linhas.forEach(linha => {
        const qtd = parseFloat(linha.querySelector('.campo-quantidade').value) || 0;
        const valor = parseFloat(linha.querySelector('.campo-valor').value) || 0;
        totalGeral += (qtd * valor);
    });

    document.getElementById('valor-total-pedido').innerText = `R$ ${totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

/**
 * 4. SALVAR PEDIDO (CREATE / UPDATE)
 * Coleta todos os dados do formulário e envia para o Flask
 */
async function salvarPedidoCompleto() {
    const id = document.getElementById('pedido_id').value;
    
    // Coleta os itens da lista dinâmica
    const itens = Array.from(document.querySelectorAll('.item-row')).map(linha => ({
        produto: linha.querySelector('.campo-produto').value,
        quantidade: parseFloat(linha.querySelector('.campo-quantidade').value),
        valor_milheiro: parseFloat(linha.querySelector('.campo-valor').value)
    }));

    // Monta o objeto seguindo os nomes das colunas do seu banco
    const payload = {
        id_empresa: document.getElementById('id_empresa').value,
        numero_pedido: document.getElementById('numero_pedido').value,
        data: document.getElementById('data').value,
        nf: document.getElementById('nf').value,
        total_nf: document.getElementById('total_nf').value,
        vencimento: document.getElementById('vencimento').value,
        data_entrega: document.getElementById('data_entrega').value,
        status: document.getElementById('status').value,
        itens: itens // O back-end deve processar essa lista
    };

    const url = id ? `${API_BASE_URL}/pedidos/${id}` : `${API_BASE_URL}/pedidos`;
    const metodo = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalPedido')).hide();
            listarPedidos();
        } else {
            alert("Erro ao salvar o pedido.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

/**
 * 5. FUNÇÕES AUXILIARES
 */

// Limpa o modal para um novo cadastro
function prepararNovoPedido() {
    document.getElementById('formPedido').reset();
    document.getElementById('pedido_id').value = '';
    document.getElementById('container-itens').innerHTML = '';
    document.getElementById('valor-total-pedido').innerText = 'R$ 0,00';
    adicionarLinhaItem(); // Inicia com uma linha vazia
}

// Carrega as empresas no Select do Modal
async function carregarEmpresasSelect() {
    try {
        const response = await fetch(`${API_BASE_URL}/empresas`);
        const empresas = await response.json();
        const select = document.getElementById('id_empresa');
        
        empresas.forEach(emp => {
            const opt = document.createElement('option');
            opt.value = emp.id_empresa;
            opt.textContent = emp.razao_social;
            select.appendChild(opt);
        });
    } catch (err) {
        console.warn("Não foi possível carregar a lista de empresas.");
    }
}

// Preenche o modal para edição
async function editarPedido(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/pedidos/${id}`);
        const p = await response.json();

        document.getElementById('pedido_id').value = p.pedido_id;
        document.getElementById('id_empresa').value = p.id_empresa;
        document.getElementById('numero_pedido').value = p.numero_pedido;
        document.getElementById('nf').value = p.nf;
        document.getElementById('total_nf').value = p.total_nf;
        document.getElementById('status').value = p.status;
        
        // Formatar datas para o input type="date" (YYYY-MM-DD)
        if(p.data) document.getElementById('data').value = p.data.split('/').reverse().join('-');
        if(p.vencimento) document.getElementById('vencimento').value = p.vencimento.split('/').reverse().join('-');
        // Limpa e preenche os itens
        const container = document.getElementById('container-itens');
        container.innerHTML = '';
        p.itens.forEach(item => adicionarLinhaItem(item));
        
        calcularTotalPedido();
        new bootstrap.Modal(document.getElementById('modalPedido')).show();
    } catch (error) {
        console.error("Erro ao carregar pedido:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    listarPedidos();
    carregarEmpresasSelect();

    // Verifica se deve abrir edição direto
    const params = new URLSearchParams(window.location.search);
    const editarId = params.get('editar');
    if (editarId) {
        // Aguarda o select de empresas carregar antes de abrir
        setTimeout(() => editarPedido(parseInt(editarId)), 800);
    }
});