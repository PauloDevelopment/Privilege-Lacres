// Configuração das Máscaras
const cnpj = document.getElementById('cnpj');
const telefone = document.getElementById('telefone');

let cnpjMask, telefoneMask;

if (cnpj) {
    cnpjMask = IMask(cnpj, { mask: '00.000.000/0000-00' });
}

if (telefone) {
    telefoneMask = IMask(telefone, { mask: '(00) 00000-0000' });
}

// Funções de Alternância de Tela
function showForm(modo) {

    const list = document.getElementById('section-list');
    const form = document.getElementById('section-form');

    if (!list || !form) return;

    list.style.display = 'none';
    form.style.display = 'block';

    const title = document.getElementById('form-title');
    const btn = document.getElementById('btn-submit');

    if (modo === 'editar') {
        title.innerText = "Editar Empresa";
        btn.innerHTML = '<i class="fa-solid fa-check me-2"></i>Atualizar Cadastro';
    } else {
        title.innerText = "Nova Empresa";
        btn.innerHTML = '<i class="fa-solid fa-plus me-2"></i>Salvar Empresa';

        // Limpa campos ao criar nova empresa
        empresaEditando = null;
        document.getElementById('razao_social').value = '';
        document.getElementById('nome_comprador').value = '';
        document.getElementById('ie').value = '';
        document.getElementById('email').value = '';

        // Limpa valores das máscaras
        if (cnpjMask) cnpjMask.value = '';
        if (telefoneMask) telefoneMask.value = '';
    }
}

function showList() {
    const list = document.getElementById('section-list');
    const form = document.getElementById('section-form');

    if (!list || !form) return;

    list.style.display = 'block';
    form.style.display = 'none';
}