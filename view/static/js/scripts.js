// Variáveis globais das máscaras
let cnpjMask, telefoneMask, cepMask;

// Inicialização quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    const cnpj = document.getElementById('cnpj');
    const telefone = document.getElementById('telefone');
    const cep = document.getElementById('cep');

    if (cnpj) {
        cnpjMask = IMask(cnpj, { mask: '00.000.000/0000-00' });
    }

    if (telefone) {
        telefoneMask = IMask(telefone, { mask: '(00) 00000-0000' });
    }

    if (cep) {
        cepMask = IMask(cep, { mask: '00000-000' });
    }
});

// Funções de Alternância de Tela
function showForm(modo) {

    const list = document.getElementById('section-list');
    const formSection = document.getElementById('section-form');

    if (!list || !formSection) return;

    list.style.display = 'none';
    formSection.style.display = 'block';

    const title = document.getElementById('form-title');
    const btn = document.getElementById('btn-submit');
    const form = document.getElementById('empresa-form');

    if (modo === 'editar') {
        title.innerText = "Editar Empresa";
        btn.innerHTML = '<i class="fa-solid fa-check me-2"></i>Atualizar Cadastro';
    } else {
        title.innerText = "Nova Empresa";
        btn.innerHTML = '<i class="fa-solid fa-plus me-2"></i>Salvar Empresa';

        // RESET COMPLETO
        form.reset();
        empresaEditando = null;

        // LIMPEZA FORÇADA DAS MÁSCARAS (resolve seu bug)
        if (cnpjMask) {
            cnpjMask.value = '';
            cnpjMask.updateValue();
        }

        if (telefoneMask) {
            telefoneMask.value = '';
            telefoneMask.updateValue();
        }

        if (cepMask) {
            cepMask.value = '';
            cepMask.updateValue();
        }
    }

    configurarViaCEP();
}

function showList() {
    const list = document.getElementById('section-list');
    const form = document.getElementById('section-form');

    if (!list || !form) return;

    list.style.display = 'block';
    form.style.display = 'none';
}

function getToken() {
    return localStorage.getItem("token");
}

async function fetchAuth(url, options = {}) {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        localStorage.removeItem("token");
        alert("Sessão expirada!");
        window.location.href = "/login";
        return;
    }

    if (response.status === 422) {
        localStorage.removeItem("token");
        alert("Você não está logado!");
        window.location.href = "/login";
        return;
    }

    return response;
}