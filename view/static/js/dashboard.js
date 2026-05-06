document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();
    Chart.register(ChartDataLabels);
    carregarDashboard();
});

const STATUS_COLORS = {
    'Pendente':    '#ef9905',
    'Em Produção': '#011e5c',
    'Concluído':   '#02744e'
};

// ─── ENTRADA PRINCIPAL ───────────────────────────────────────────────────────

async function carregarDashboard() {
    try {
        const [resEmpresas, resPedidos] = await Promise.all([
            fetchAuth('/empresas'),
            fetchAuth('/pedidos')
        ]);

        if (!resEmpresas || !resPedidos) return;

        const empresas = await resEmpresas.json();
        const pedidos  = await resPedidos.json();

        preencherCards(empresas, pedidos);
        renderizarPedidosPorMes(pedidos);
        renderizarStatusPedidos(pedidos);
        renderizarTopClientes(pedidos);
        renderizarTopProdutos(pedidos);

    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        showToast('Erro ao carregar dados do dashboard.', 'danger');
    }
}

// ─── CARDS ────────────────────────────────────────────────────────────────────

function preencherCards(empresas, pedidos) {
    const faturamento = pedidos
        .filter(p => p.status === 'Concluído')
        .reduce((acc, p) => acc + (p.total_pedido || 0), 0);

    document.getElementById('card-empresas').textContent    = empresas.length;
    document.getElementById('card-pedidos').textContent     = pedidos.length;
    document.getElementById('card-faturamento').textContent =
        'R$ ' + faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

// ─── PEDIDOS POR MÊS ─────────────────────────────────────────────────────────

function renderizarPedidosPorMes(pedidos) {
    const mapa = {};

    pedidos.forEach(p => {
        if (!p.data) return;
        const partes = p.data.split('/');
        if (partes.length < 3) return;
        const chave = `${partes[1]}/${partes[2]}`;
        mapa[chave] = (mapa[chave] || 0) + (p.total_pedido || 0);
    });

    const chaves = Object.keys(mapa).sort((a, b) => {
        const [ma, ya] = a.split('/').map(Number);
        const [mb, yb] = b.split('/').map(Number);
        return ya !== yb ? ya - yb : ma - mb;
    });

    const nomesMeses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const labels = chaves.map(c => {
        const [m] = c.split('/').map(Number);
        return nomesMeses[m - 1];
    });
    const dados    = chaves.map(c => parseFloat(mapa[c].toFixed(2)));
    const maxValor = Math.max(...dados);

    new Chart(document.getElementById('chartMes'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Faturamento',
                data: dados,
                backgroundColor: '#011a4f',
                borderRadius: 6,
                barThickness: 28
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#1f2937',
                    font: { weight: 'bold', size: 12 },
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    formatter: value => parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#6b7280' }
                },
                y: {
                    beginAtZero: true,
                    max: maxValor + (maxValor * 0.1),
                    grid: { color: 'rgba(0,0,0,0.06)' },
                    ticks: { display: false }
                }
            }
        }
    });
}

// ─── STATUS DOS PEDIDOS ───────────────────────────────────────────────────────

function renderizarStatusPedidos(pedidos) {
    const mapa = {};
    pedidos.forEach(p => {
        if (!p.status) return;
        mapa[p.status] = (mapa[p.status] || 0) + 1;
    });

    const labels = Object.keys(mapa);
    const dados  = labels.map(s => mapa[s]);
    const cores  = labels.map(s => STATUS_COLORS[s] || '#6b7280');

    const legendEl = document.getElementById('legend-status');
    legendEl.innerHTML = '';
    labels.forEach((s, i) => {
        legendEl.innerHTML += `
            <span class="d-flex align-items-center gap-1 small text-muted">
                <span style="width:10px;height:10px;border-radius:2px;background:${cores[i]};display:inline-block;flex-shrink:0;"></span>
                ${s}: <strong>${dados[i]}</strong>
            </span>`;
    });

    new Chart(document.getElementById('chartStatus'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: dados,
                backgroundColor: cores,
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#ffffff',
                    font: { weight: 'bold', size: 13 },
                    formatter: value => value
                }
            }
        }
    });
}

// ─── TOP CLIENTES ─────────────────────────────────────────────────────────────

function renderizarTopClientes(pedidos) {
    const mapa = {};
    pedidos
        .filter(p => p.status === 'Concluído')
        .forEach(p => {
            const nome = p.empresa || 'Desconhecido';
            mapa[nome] = (mapa[nome] || 0) + (p.total_pedido || 0);
        });

    const sorted = Object.entries(mapa)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const labels   = sorted.map(([nome]) => nome);
    const dados    = sorted.map(([, val]) => parseFloat(val.toFixed(2)));
    const maxValor = Math.max(...dados);

    const altura = Math.max(labels.length * 46 + 60, 180);
    document.getElementById('wrap-clientes').style.height = altura + 'px';

    new Chart(document.getElementById('chartClientes'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Faturamento (R$)',
                data: dados,
                backgroundColor: '#016f4a',
                borderRadius: 5,
                barThickness: 26
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#1f2937',
                    font: { weight: 'bold', size: 12 },
                    anchor: 'end',
                    align: 'right',
                    offset: 4,
                    formatter: value => 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: maxValor + (maxValor * 0.3),
                    grid: { display: false },
                    ticks: { display: false }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#6b7280' }
                }
            }
        }
    });
}

// ─── TOP PRODUTOS ─────────────────────────────────────────────────────────────

function renderizarTopProdutos(pedidos) {
    const mapa = {};
    pedidos.forEach(p => {
        if (!p.itens) return;
        p.itens.forEach(item => {
            const nome = item.produto || 'Desconhecido';
            mapa[nome] = (mapa[nome] || 0) + (item.quantidade || 0);
        });
    });

    const sorted = Object.entries(mapa)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const labels   = sorted.map(([nome]) => nome);
    const dados    = sorted.map(([, qtd]) => parseInt(qtd));
    const maxValor = Math.max(...dados);

    const altura = Math.max(labels.length * 46 + 60, 180);
    document.getElementById('wrap-produtos').style.height = altura + 'px';

    new Chart(document.getElementById('chartProdutos'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Quantidade',
                data: dados,
                backgroundColor: '#f59e0b',
                borderRadius: 5,
                barThickness: 26
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#1f2937',
                    font: { weight: 'bold', size: 12 },
                    anchor: 'end',
                    align: 'right',
                    offset: 4,
                    formatter: value => value
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: maxValor + (maxValor * 0.3),
                    grid: { display: false },
                    ticks: { display: false }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#6b7280' }
                }
            }
        }
    });
}