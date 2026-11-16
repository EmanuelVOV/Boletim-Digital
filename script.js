const SENHA_CORRETA = "Mell07312002";
const SPREADSHEET_ID = "1yhQkt8Q6tlIvcg5Fon3mdXZ3cMR-mnTXi7A7gDxXxPc";
const URL_NOTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Notas`;
const URL_FALTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Faltas`;

let dadosProcessados = [];
let filtroAtual = "todas";
let todasExpandidas = false;
let chartMedias = null;
let chartSituacao = null;
let chartFaltas = null;

// Plano B: Dados locais caso haja oscilação na rede
const dadosBoletimReserva = [
    { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
    { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
    { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
    { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
    { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
    { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
    { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
    { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
    { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
    { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
    { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
    { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
    { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
    { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
    { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// --- AUTENTICAÇÃO ---
function inicializarSeguranca() {
    const telaLogin = document.getElementById('tela-login');
    const conteudoBoletim = document.getElementById('conteudo-boletim');
    const campoSenha = document.getElementById('campo-senha');
    const btnEntrar = document.getElementById('btn-entrar');
    const btnVerSenha = document.getElementById('btn-ver-senha');
    const btnSair = document.getElementById('btn-sair');
    const msgErro = document.getElementById('msg-erro');

    // Mantém desbloqueado na mesma sessão do navegador
    if (sessionStorage.getItem('boletim_autenticado') === 'true') {
        telaLogin.classList.add('escondido');
        conteudoBoletim.classList.remove('escondido');
        iniciarSistema();
        return;
    }

    btnVerSenha.addEventListener('click', () => {
        campoSenha.type = campoSenha.type === 'password' ? 'text' : 'password';
    });

    function tentarLogin() {
        if (campoSenha.value === SENHA_CORRETA) {
            sessionStorage.setItem('boletim_autenticado', 'true');
            telaLogin.classList.add('escondido');
            conteudoBoletim.classList.remove('escondido');
            iniciarSistema();
        } else {
            msgErro.innerText = "Senha incorreta. Tente novamente.";
            campoSenha.value = "";
            campoSenha.focus();
        }
    }

    btnEntrar.addEventListener('click', tentarLogin);
    campoSenha.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') tentarLogin();
    });

    btnSair.addEventListener('click', () => {
        sessionStorage.removeItem('boletim_autenticado');
        location.reload();
    });
}

// --- TEMA CLARO / ESCURO ---
function inicializarTema() {
    const btnTema = document.getElementById('btn-tema');
    const temaSalvo = localStorage.getItem('boletim_tema');

    if (temaSalvo === 'light') {
        document.body.classList.add('light-mode');
        btnTema.innerText = '☀️';
    }

    btnTema.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        btnTema.innerText = isLight ? '☀️' : '🌙';
        localStorage.setItem('boletim_tema', isLight ? 'light' : 'dark');
        renderizarGraficos();
    });
}

// --- ABAS DE NAVEGAÇÃO ---
function inicializarAbas() {
    const botoesAba = document.querySelectorAll('.aba-btn');
    const conteudosAba = document.querySelectorAll('.aba-conteudo');

    botoesAba.forEach(btn => {
        btn.addEventListener('click', () => {
            botoesAba.forEach(b => b.classList.remove('ativa'));
            conteudosAba.forEach(c => c.classList.remove('ativa'));

            btn.classList.add('ativa');
            const alvo = document.getElementById(btn.dataset.aba);
            if (alvo) alvo.classList.add('ativa');

            if (btn.dataset.aba === 'aba-graficos') {
                renderizarGraficos();
            }
        });
    });
}

// --- TRATAMENTO DE DADOS ---
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "" || valor === "—") return null;
    if (typeof valor === 'string') valor = valor.replace(/"/g, '').replace(',', '.').trim();

    let numero = Number(valor);
    if (isNaN(numero)) return null;
    if (numero > 10 && numero <= 100) numero = numero / 10;
    if (numero < 0 || numero > 10) return null;

    return numero;
}

function parseCSV(textoCSV) {
    return textoCSV.split('\n').map(linha =>
        linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim())
    );
}

function formatarNota(nota) {
    return nota === null ? "—" : nota.toFixed(1).replace('.', ',');
}

function processarListaBruta(listaBruta) {
    return listaBruta.map(item => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        const f1 = Number(item.faltas?.[0]) || 0;
        const f2 = Number(item.faltas?.[1]) || 0;
        const f3 = Number(item.faltas?.[2]) || 0;
        const totalFaltas = f1 + f2 + f3;

        const validas = [n1, n2, n3].filter(n => n !== null);
        let media = null;
        let status = "pendente";
        let statusTexto = "Nota não lançada";
        let statusClasse = "situacao-indisponivel";

        if (validas.length > 0) {
            media = validas.reduce((acc, val) => acc + val, 0) / validas.length;
            if (media >= 6.0) {
                status = "bom";
                statusTexto = "Bom desempenho";
                statusClasse = "situacao-bom";
            } else {
                status = "atencao";
                statusTexto = "Atenção";
                statusClasse = "situacao-atencao";
            }
        }

        return {
            disciplina: item.disciplina,
            n1, n2, n3,
            media,
            f1, f2, f3,
            totalFaltas,
            status,
            statusTexto,
            statusClasse
        };
    });
}

// --- RENDERIZAÇÃO DA INTERFACE ---
function atualizarKPIs() {
    let somaMedias = 0;
    let qtdComMedia = 0;
    let totalFaltas = 0;
    let bomCount = 0;
    let atencaoCount = 0;

    dadosProcessados.forEach(d => {
        totalFaltas += d.totalFaltas;
        if (d.media !== null) {
            somaMedias += d.media;
            qtdComMedia++;
            if (d.status === "bom") bomCount++;
            if (d.status === "atencao") atencaoCount++;
        }
    });

    const mediaGeral = qtdComMedia > 0 ? (somaMedias / qtdComMedia).toFixed(1).replace('.', ',') : "—";

    document.getElementById('card-media').innerText = mediaGeral;
    document.getElementById('card-faltas').innerText = totalFaltas;
    document.getElementById('card-bom-desempenho').innerText = bomCount;
    document.getElementById('card-atencao').innerText = atencaoCount;
    document.getElementById('card-frequencia').innerText = "92%";
    document.getElementById('card-frequencia-texto').innerText = "Frequência adequada";
}

function renderizarListaMaterias() {
    const container = document.getElementById('materias-container');
    const termoBusca = document.getElementById('input-busca').value.toLowerCase().trim();
    container.innerHTML = '';

    const filtradas = dadosProcessados.filter(d => {
        const bateTexto = d.disciplina.toLowerCase().includes(termoBusca);
        const bateFiltro = filtroAtual === "todas" || d.status === filtroAtual;
        return bateTexto && bateFiltro;
    });

    if (filtradas.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 20px;">Nenhuma disciplina encontrada para este filtro.</p>`;
        return;
    }

    filtradas.forEach(d => {
        const mediaStr = formatarNota(d.media);
        const porcentagemBarra = d.media !== null ? Math.min(100, Math.max(0, d.media * 10)) : 0;
        const classeAlerta = d.media !== null && d.media < 6.0 ? 'alerta' : '';

        const card = document.createElement('article');
        card.className = `materia-card ${todasExpandidas ? 'aberto' : ''}`;
        card.innerHTML = `
            <div class="materia-header">
                <div class="materia-info-esq">
                    <h3 class="materia-titulo">${d.disciplina}</h3>
                    <span class="situacao-badge ${d.statusClasse}">${d.statusTexto}</span>
                </div>
                <div class="materia-info-dir">
                    <span class="resumo-rapido">Média: ${mediaStr} • Faltas: ${d.totalFaltas}</span>
                    <span class="seta-icon">▼</span>
                </div>
            </div>
            <div class="materia-detalhes">
                <div class="materia-grid">
                    <div class="nota-box">
                        <span class="nota-label">1º Trimestre</span>
                        <span class="nota-valor">${formatarNota(d.n1)}</span>
                    </div>
                    <div class="nota-box">
                        <span class="nota-label">2º Trimestre</span>
                        <span class="nota-valor">${formatarNota(d.n2)}</span>
                    </div>
                    <div class="nota-box">
                        <span class="nota-label">3º Trimestre</span>
                        <span class="nota-valor">${formatarNota(d.n3)}</span>
                    </div>
                    <div class="nota-box nota-box-destaque">
                        <span class="nota-label">Média Atual</span>
                        <span class="nota-valor nota-destaque">${mediaStr}</span>
                    </div>
                    <div class="nota-box">
                        <span class="nota-label">Faltas</span>
                        <span class="nota-valor">${d.totalFaltas}</span>
                    </div>
                </div>
                <div class="barra-progresso-fundo" title="Desempenho: ${mediaStr} / 10">
                    <div class="barra-progresso-preenchimento ${classeAlerta}" style="width: ${porcentagemBarra}%"></div>
                </div>
            </div>
        `;

        card.querySelector('.materia-header').addEventListener('click', () => {
            card.classList.toggle('aberto');
        });

        container.appendChild(card);
    });
}

function renderizarTabelaFaltas() {
    const corpo = document.getElementById('tabela-faltas-corpo');
    corpo.innerHTML = '';

    dadosProcessados.forEach(d => {
        const statusFalta = d.totalFaltas >= 10
            ? `<span class="situacao-badge situacao-atencao">Atenção</span>`
            : `<span class="situacao-badge situacao-bom">Regular</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${d.disciplina}</strong></td>
            <td>${d.f1}</td>
            <td>${d.f2}</td>
            <td>${d.f3}</td>
            <td><strong>${d.totalFaltas}</strong></td>
            <td>${statusFalta}</td>
        `;
        corpo.appendChild(tr);
    });
}

function renderizarGraficos() {
    if (typeof Chart === 'undefined') return;

    const isLight = document.body.classList.contains('light-mode');
    const corTexto = isLight ? '#1d1030' : '#ede8f5';
    const corGrade = isLight ? '#dcd0ed' : '#2f1d4a';
    const corVerde = isLight ? '#1e7e45' : '#27ae60';
    const corVermelho = isLight ? '#c0392b' : '#e74c3c';
    const corCinza = isLight ? '#8c7ba6' : '#5e4d78';

    const comMedia = dadosProcessados.filter(d => d.media !== null);
    const labels = comMedia.map(d => d.disciplina);
    const valores = comMedia.map(d => Number(d.media.toFixed(1)));
    const coresBarras = valores.map(v => v >= 6.0 ? corVerde : corVermelho);

    if (chartMedias) chartMedias.destroy();
    chartMedias = new Chart(document.getElementById('graficoMedias'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Média',
                data: valores,
                backgroundColor: coresBarras,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 10, ticks: { color: corTexto }, grid: { color: corGrade } },
                x: { ticks: { color: corTexto, font: { size: 11 } }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    const bom = dadosProcessados.filter(d => d.status === 'bom').length;
    const atencao = dadosProcessados.filter(d => d.status === 'atencao').length;
    const pendente = dadosProcessados.filter(d => d.status === 'pendente').length;

    if (chartSituacao) chartSituacao.destroy();
    chartSituacao = new Chart(document.getElementById('graficoSituacao'), {
        type: 'doughnut',
        data: {
            labels: ['Bom Desempenho', 'Atenção', 'Pendentes'],
            datasets: [{
                data: [bom, atencao, pendente],
                backgroundColor: [corVerde, corVermelho, corCinza],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: corTexto } } }
        }
    });

    if (chartFaltas) chartFaltas.destroy();
    chartFaltas = new Chart(document.getElementById('graficoFaltas'), {
        type: 'bar',
        data: {
            labels: dadosProcessados.map(d => d.disciplina),
            datasets: [{
                label: 'Faltas',
                data: dadosProcessados.map(d => d.totalFaltas),
                backgroundColor: '#6c3483',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { color: corTexto, stepSize: 1 }, grid: { color: corGrade } },
                x: { ticks: { display: false }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// --- CARREGAMENTO DO GOOGLE DRIVE ---
async function buscarDadosPlanilha() {
    const statusEl = document.getElementById('status-conexao');
    statusEl.innerText = "Sincronizando com Google Drive...";

    try {
        const cacheBuster = `&t=${Date.now()}`;
        const [resNotas, resFaltas] = await Promise.all([
            fetch(URL_NOTAS + cacheBuster),
            fetch(URL_FALTAS + cacheBuster)
        ]);

        if (!resNotas.ok || !resFaltas.ok) throw new Error("Erro de rede");

        const matrizNotas = parseCSV(await resNotas.text());
        const matrizFaltas = parseCSV(await resFaltas.text());

        const listaExtraida = [];

        for (let i = 1; i < matrizNotas.length; i++) {
            const linha = matrizNotas[i];
            if (!linha || !linha[0]) continue;

            const nomeDisc = linha[0];
            const linhaFalta = matrizFaltas.find(f => f[0]?.toLowerCase() === nomeDisc.toLowerCase()) || matrizFaltas[i] || [];

            listaExtraida.push({
                disciplina: nomeDisc,
                tri1: linha[1],
                tri2: linha[2],
                tri3: linha[3],
                faltas: [linhaFalta[1], linhaFalta[2], linhaFalta[3]]
            });
        }

        if (listaExtraida.length > 0) {
            dadosProcessados = processarListaBruta(listaExtraida);
            statusEl.innerText = "● Conectado ao Google Drive (Atualizado)";
        } else {
            throw new Error("Planilha vazia");
        }
    } catch (erro) {
        console.warn("Usando dados locais de backup:", erro);
        dadosProcessados = processarListaBruta(dadosBoletimReserva);
        statusEl.innerText = "● Modo Offline (Dados de backup)";
    }

    atualizarKPIs();
    renderizarListaMaterias();
    renderizarTabelaFaltas();
    renderizarGraficos();
}

function inicializarControles() {
    document.getElementById('input-busca').addEventListener('input', renderizarListaMaterias);

    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            filtroAtual = btn.dataset.filtro;
            renderizarListaMaterias();
        });
    });

    const btnExpandir = document.getElementById('btn-expandir-todas');
    btnExpandir.addEventListener('click', () => {
        todasExpandidas = !todasExpandidas;
        btnExpandir.innerText = todasExpandidas ? "Recolher Todas" : "Expandir Todas";
        renderizarListaMaterias();
    });

    document.getElementById('btn-sincronizar').addEventListener('click', buscarDadosPlanilha);
}

function iniciarSistema() {
    inicializarTema();
    inicializarAbas();
    inicializarControles();
    buscarDadosPlanilha();
}

inicializarSeguranca();