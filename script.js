const SENHA_CORRETA = "Mell07312002";
const SPREADSHEET_ID = "1yhQkt8Q6tlIvcg5Fon3mdXZ3cMR-mnTXi7A7gDxXxPc";
const URL_NOTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Notas`;
const URL_FALTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Faltas`;
const STORAGE_KEY = "boletim_8ano_dados_v1";

let materias = [];
let modoEdicao = true;
let filtroAtual = "todas";
let expandirTodas = true;
let chartMedias = null;
let chartStatus = null;
let chartFaltas = null;

// Dados iniciais de backup caso o Drive esteja indisponível no primeiro acesso
const dadosBackup = [
    { id: 0, disciplina: "Língua Portuguesa", tri1: 8.2, tri2: 7.8, tri3: 8.5, f1: 2, f2: 1, f3: 1 },
    { id: 1, disciplina: "Matemática", tri1: 5.2, tri2: 5.8, tri3: null, f1: 3, f2: 2, f3: 1 },
    { id: 2, disciplina: "Ciências", tri1: 8.1, tri2: 7.6, tri3: 8.0, f1: 1, f2: 2, f3: 0 },
    { id: 3, disciplina: "História", tri1: 7.0, tri2: 8.4, tri3: null, f1: 1, f2: 1, f3: 1 },
    { id: 4, disciplina: "Geografia", tri1: 6.8, tri2: 7.3, tri3: 7.9, f1: 0, f2: 1, f3: 1 },
    { id: 5, disciplina: "Língua Inglesa", tri1: 8.6, tri2: 8.1, tri3: 8.7, f1: 1, f2: 0, f3: 0 },
    { id: 6, disciplina: "Arte", tri1: 9.0, tri2: 9.2, tri3: null, f1: 1, f2: 1, f3: 0 },
    { id: 7, disciplina: "Educação Física", tri1: 9.5, tri2: 9.0, tri3: 9.4, f1: 0, f2: 1, f3: 0 },
    { id: 8, disciplina: "Educação Digital", tri1: 8.8, tri2: 9.1, tri3: 9.3, f1: 1, f2: 0, f3: 1 },
    { id: 9, disciplina: "Educação Financeira", tri1: 7.4, tri2: 7.8, tri3: null, f1: 1, f2: 1, f3: 1 },
    { id: 10, disciplina: "Estudo Orientado", tri1: 8.0, tri2: 8.3, tri3: 8.5, f1: 0, f2: 1, f3: 0 },
    { id: 11, disciplina: "Redação e Leitura", tri1: 6.2, tri2: 6.8, tri3: null, f1: 2, f2: 1, f3: 1 },
    { id: 12, disciplina: "Pensamento Lógico", tri1: 4.8, tri2: 5.6, tri3: 6.0, f1: 2, f2: 2, f3: 1 },
    { id: 13, disciplina: "Literatura Arte e Movimento", tri1: 7.7, tri2: 8.0, tri3: null, f1: 1, f2: 0, f3: 1 },
    { id: 14, disciplina: "Práticas Experimentais", tri1: 5.8, tri2: 6.2, tri3: 6.4, f1: 1, f2: 1, f3: 1 }
];

// --- LOGIN / SENHA ---
function configurarLogin() {
    const telaLogin = document.getElementById('tela-login');
    const conteudo = document.getElementById('conteudo-boletim');
    const campoSenha = document.getElementById('campo-senha');
    const btnEntrar = document.getElementById('btn-entrar');
    const btnVer = document.getElementById('btn-ver-senha');
    const btnSair = document.getElementById('btn-sair');
    const msgErro = document.getElementById('msg-erro');

    if (sessionStorage.getItem('boletim_logado') === 'true') {
        telaLogin.classList.add('escondido');
        conteudo.classList.remove('escondido');
        iniciarApp();
        return;
    }

    btnVer.addEventListener('click', () => {
        campoSenha.type = campoSenha.type === 'password' ? 'text' : 'password';
    });

    function validar() {
        if (campoSenha.value === SENHA_CORRETA) {
            sessionStorage.setItem('boletim_logado', 'true');
            telaLogin.classList.add('escondido');
            conteudo.classList.remove('escondido');
            iniciarApp();
        } else {
            msgErro.innerText = "Senha incorreta! Verifique e tente novamente.";
            campoSenha.value = "";
            campoSenha.focus();
        }
    }

    btnEntrar.addEventListener('click', validar);
    campoSenha.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validar();
    });

    btnSair.addEventListener('click', () => {
        sessionStorage.removeItem('boletim_logado');
        location.reload();
    });
}

// --- NORMALIZAÇÃO E CÁLCULOS ---
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "" || valor === "—") return null;
    if (typeof valor === 'string') {
        valor = valor.replace(/"/g, '').replace(',', '.').trim();
        if (valor === "") return null;
    }

    let num = Number(valor);
    if (isNaN(num)) return null;
    if (num > 10 && num <= 100) num = num / 10;
    if (num < 0) num = 0;
    if (num > 10) num = 10;

    return Math.round(num * 10) / 10;
}

function formatarNota(nota) {
    return nota === null ? "—" : nota.toFixed(1).replace('.', ',');
}

function formatarInputNota(nota) {
    return nota === null ? "" : nota.toFixed(1).replace('.', ',');
}

function calcularInfoMateria(m) {
    const validas = [m.tri1, m.tri2, m.tri3].filter(n => n !== null && !isNaN(n));
    const totalFaltas = (Number(m.f1) || 0) + (Number(m.f2) || 0) + (Number(m.f3) || 0);

    let media = null;
    let status = "pendente";
    let statusLabel = "Sem notas";
    let statusClass = "status-pendente";

    if (validas.length > 0) {
        media = validas.reduce((a, b) => a + b, 0) / validas.length;
        if (media >= 6.0) {
            status = "bom";
            statusLabel = "Bom Desempenho";
            statusClass = "status-bom";
        } else {
            status = "atencao";
            statusLabel = "Atenção";
            statusClass = "status-atencao";
        }
    }

    return { media, totalFaltas, status, statusLabel, statusClass };
}

// --- PERSISTÊNCIA E GOOGLE DRIVE ---
function salvarLocalmente() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materias));
    const indicador = document.getElementById('indicador-salvo');
    indicador.innerText = "✓ Alterações salvas";
    document.getElementById('status-sync').innerText = "● Editado localmente";
}

function parseCSV(texto) {
    return texto.split('\n').map(linha =>
        linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim())
    );
}

async function sincronizarComDrive(forcarDrive = false) {
    const statusEl = document.getElementById('status-sync');

    if (!forcarDrive) {
        const salvo = localStorage.getItem(STORAGE_KEY);
        if (salvo) {
            try {
                materias = JSON.parse(salvo);
                statusEl.innerText = "● Dados locais carregados";
                atualizarTudo();
                return;
            } catch (e) {
                console.warn("Erro ao ler dados salvos:", e);
            }
        }
    }

    statusEl.innerText = "⏳ Buscando do Google Drive...";

    try {
        const nocache = `&t=${Date.now()}`;
        const [resNotas, resFaltas] = await Promise.all([
            fetch(URL_NOTAS + nocache),
            fetch(URL_FALTAS + nocache)
        ]);

        if (!resNotas.ok || !resFaltas.ok) throw new Error("Falha ao acessar planilha");

        const matrizNotas = parseCSV(await resNotas.text());
        const matrizFaltas = parseCSV(await resFaltas.text());

        const novaLista = [];
        for (let i = 1; i < matrizNotas.length; i++) {
            const row = matrizNotas[i];
            if (!row || !row[0]) continue;

            const nome = row[0];
            const rowFalta = matrizFaltas.find(f => f[0]?.toLowerCase() === nome.toLowerCase()) || matrizFaltas[i] || [];

            novaLista.push({
                id: i - 1,
                disciplina: nome,
                tri1: normalizarNota(row[1]),
                tri2: normalizarNota(row[2]),
                tri3: normalizarNota(row[3]),
                f1: Number(rowFalta[1]) || 0,
                f2: Number(rowFalta[2]) || 0,
                f3: Number(rowFalta[3]) || 0
            });
        }

        if (novaLista.length > 0) {
            materias = novaLista;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(materias));
            statusEl.innerText = "● Sincronizado com Google Drive";
        } else {
            throw new Error("Planilha vazia");
        }
    } catch (erro) {
        console.warn("Usando backup local:", erro);
        if (materias.length === 0) {
            materias = JSON.parse(JSON.stringify(dadosBackup));
        }
        statusEl.innerText = "● Modo Offline (Backup)";
    }

    atualizarTudo();
}

// --- ATUALIZAÇÃO DA INTERFACE ---
function atualizarTudo() {
    atualizarKPIs();
    renderizarListaMaterias();
    renderizarTabelaGeral();
    renderizarGraficos();
}

function atualizarKPIs() {
    let somaMedias = 0;
    let qtdMedias = 0;
    let qtdBom = 0;
    let qtdAtencao = 0;
    let somaFaltas = 0;

    materias.forEach(m => {
        const info = calcularInfoMateria(m);
        somaFaltas += info.totalFaltas;
        if (info.media !== null) {
            somaMedias += info.media;
            qtdMedias++;
            if (info.status === "bom") qtdBom++;
            if (info.status === "atencao") qtdAtencao++;
        }
    });

    const mediaGeral = qtdMedias > 0 ? (somaMedias / qtdMedias).toFixed(1).replace('.', ',') : "—";

    const aulasTotais = 800;
    const freqNum = Math.max(0, Math.min(100, ((aulasTotais - somaFaltas) / aulasTotais) * 100));
    const freqStr = freqNum.toFixed(1).replace('.', ',') + "%";

    document.getElementById('kpi-media').innerText = mediaGeral;
    document.getElementById('kpi-bom').innerText = qtdBom;
    document.getElementById('kpi-atencao').innerText = qtdAtencao;
    document.getElementById('kpi-faltas').innerText = somaFaltas;
    document.getElementById('kpi-frequencia').innerText = freqStr;
    document.getElementById('kpi-frequencia-desc').innerText = freqNum >= 75 ? "Frequência regular (≥ 75%)" : "Alerta de baixa frequência";
}

function renderizarListaMaterias() {
    const container = document.getElementById('lista-materias');
    const busca = document.getElementById('input-busca').value.toLowerCase().trim();
    container.innerHTML = '';

    const filtradas = materias.filter(m => {
        const info = calcularInfoMateria(m);
        const matchTexto = m.disciplina.toLowerCase().includes(busca);
        const matchFiltro = filtroAtual === "todas" || info.status === filtroAtual;
        return matchTexto && matchFiltro;
    });

    if (filtradas.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding: 24px; color: var(--text-muted);">Nenhuma disciplina encontrada.</p>`;
        return;
    }

    filtradas.forEach(m => {
        const info = calcularInfoMateria(m);
        const mediaStr = formatarNota(info.media);
        const larguraBarra = info.media !== null ? Math.min(100, info.media * 10) : 0;
        const disabledAttr = modoEdicao ? "" : "disabled";

        const card = document.createElement('article');
        card.className = `materia-card ${expandirTodas ? 'aberto' : ''}`;
        card.innerHTML = `
            <div class="materia-header">
                <div class="materia-esq">
                    <span class="materia-nome">${m.disciplina}</span>
                    <span class="badge-status ${info.statusClass}" id="badge-${m.id}">${info.statusLabel}</span>
                </div>
                <div class="materia-dir">
                    <span class="pilula-info pilula-media" id="pilula-media-${m.id}">Média: ${mediaStr}</span>
                    <span class="pilula-info" id="pilula-faltas-${m.id}">Faltas: ${info.totalFaltas}</span>
                    <span class="seta-accordion">▼</span>
                </div>
            </div>

            <div class="materia-corpo">
                <div class="grade-notas-edit">
                    <div class="campo-box">
                        <label>1º Trimestre</label>
                        <input type="text" class="input-nota" data-id="${m.id}" data-campo="tri1" value="${formatarInputNota(m.tri1)}" placeholder="—" ${disabledAttr}>
                    </div>
                    <div class="campo-box">
                        <label>2º Trimestre</label>
                        <input type="text" class="input-nota" data-id="${m.id}" data-campo="tri2" value="${formatarInputNota(m.tri2)}" placeholder="—" ${disabledAttr}>
                    </div>
                    <div class="campo-box">
                        <label>3º Trimestre</label>
                        <input type="text" class="input-nota" data-id="${m.id}" data-campo="tri3" value="${formatarInputNota(m.tri3)}" placeholder="—" ${disabledAttr}>
                    </div>
                    <div class="campo-box destaque-media">
                        <label>Média Atual</label>
                        <div class="valor-calculado" id="media-box-${m.id}">${mediaStr}</div>
                    </div>
                    <div class="campo-box">
                        <label>Faltas (1º / 2º / 3º Tri)</label>
                        <div class="faltas-trimestres">
                            <input type="number" min="0" class="input-falta" data-id="${m.id}" data-campo="f1" value="${m.f1}" ${disabledAttr}>
                            <input type="number" min="0" class="input-falta" data-id="${m.id}" data-campo="f2" value="${m.f2}" ${disabledAttr}>
                            <input type="number" min="0" class="input-falta" data-id="${m.id}" data-campo="f3" value="${m.f3}" ${disabledAttr}>
                        </div>
                    </div>
                </div>
                <div class="progresso-trilha">
                    <div class="progresso-barra ${info.media !== null && info.media < 6 ? 'baixo' : ''}" id="barra-${m.id}" style="width: ${larguraBarra}%"></div>
                </div>
            </div>
        `;

        card.querySelector('.materia-header').addEventListener('click', () => {
            card.classList.toggle('aberto');
        });

        card.querySelectorAll('.input-nota').forEach(input => {
            input.addEventListener('click', e => e.stopPropagation());

            input.addEventListener('input', (e) => {
                const id = Number(e.target.dataset.id);
                const campo = e.target.dataset.campo;
                const mat = materias.find(item => item.id === id);
                if (!mat) return;

                mat[campo] = normalizarNota(e.target.value);
                atualizarCardIndividual(mat);
                atualizarKPIs();
                renderizarTabelaGeral();
                salvarLocalmente();
            });

            input.addEventListener('blur', (e) => {
                const id = Number(e.target.dataset.id);
                const campo = e.target.dataset.campo;
                const mat = materias.find(item => item.id === id);
                if (mat) {
                    e.target.value = formatarInputNota(mat[campo]);
                    renderizarGraficos();
                }
            });
        });

        card.querySelectorAll('.input-falta').forEach(input => {
            input.addEventListener('click', e => e.stopPropagation());

            input.addEventListener('input', (e) => {
                const id = Number(e.target.dataset.id);
                const campo = e.target.dataset.campo;
                const mat = materias.find(item => item.id === id);
                if (!mat) return;

                mat[campo] = Math.max(0, parseInt(e.target.value) || 0);
                atualizarCardIndividual(mat);
                atualizarKPIs();
                renderizarTabelaGeral();
                salvarLocalmente();
            });

            input.addEventListener('blur', () => renderizarGraficos());
        });

        container.appendChild(card);
    });
}

function atualizarCardIndividual(m) {
    const info = calcularInfoMateria(m);
    const mediaStr = formatarNota(info.media);

    const badge = document.getElementById(`badge-${m.id}`);
    const pilulaMedia = document.getElementById(`pilula-media-${m.id}`);
    const pilulaFaltas = document.getElementById(`pilula-faltas-${m.id}`);
    const mediaBox = document.getElementById(`media-box-${m.id}`);
    const barra = document.getElementById(`barra-${m.id}`);

    if (badge) {
        badge.className = `badge-status ${info.statusClass}`;
        badge.innerText = info.statusLabel;
    }
    if (pilulaMedia) pilulaMedia.innerText = `Média: ${mediaStr}`;
    if (pilulaFaltas) pilulaFaltas.innerText = `Faltas: ${info.totalFaltas}`;
    if (mediaBox) mediaBox.innerText = mediaStr;
    if (barra) {
        barra.style.width = `${info.media !== null ? Math.min(100, info.media * 10) : 0}%`;
        barra.className = `progresso-barra ${info.media !== null && info.media < 6 ? 'baixo' : ''}`;
    }
}

function renderizarTabelaGeral() {
    const tbody = document.getElementById('corpo-tabela-geral');
    tbody.innerHTML = '';

    materias.forEach(m => {
        const info = calcularInfoMateria(m);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${m.disciplina}</strong></td>
            <td>${formatarNota(m.tri1)}</td>
            <td>${formatarNota(m.tri2)}</td>
            <td>${formatarNota(m.tri3)}</td>
            <td><strong>${formatarNota(info.media)}</strong></td>
            <td>${info.totalFaltas}</td>
            <td><span class="badge-status ${info.statusClass}">${info.statusLabel}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarGraficos() {
    if (typeof Chart === 'undefined') return;

    const isLight = document.body.classList.contains('light-mode');
    const corTexto = isLight ? '#334155' : '#b8c0d9';
    const corGrade = isLight ? '#e2e8f0' : '#1f2438';
    const corVerde = isLight ? '#059669' : '#00ff87';
    const corVermelho = isLight ? '#e11d48' : '#ff2a6d';
    const corCiano = isLight ? '#0284c7' : '#00f3ff';

    const comNota = materias.map(m => ({ nome: m.disciplina, info: calcularInfoMateria(m) }))
                            .filter(x => x.info.media !== null);

    if (chartMedias) chartMedias.destroy();
    chartMedias = new Chart(document.getElementById('chartMedias'), {
        type: 'bar',
        data: {
            labels: comNota.map(x => x.nome),
            datasets: [{
                label: 'Média',
                data: comNota.map(x => Number(x.info.media.toFixed(1))),
                backgroundColor: comNota.map(x => x.info.media >= 6 ? corVerde : corVermelho),
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

    const bom = materias.filter(m => calcularInfoMateria(m).status === 'bom').length;
    const atencao = materias.filter(m => calcularInfoMateria(m).status === 'atencao').length;
    const pendente = materias.filter(m => calcularInfoMateria(m).status === 'pendente').length;

    if (chartStatus) chartStatus.destroy();
    chartStatus = new Chart(document.getElementById('chartStatus'), {
        type: 'doughnut',
        data: {
            labels: ['Na Média (≥ 6,0)', 'Atenção (< 6,0)', 'Sem Notas'],
            datasets: [{
                data: [bom, atencao, pendente],
                backgroundColor: [corVerde, corVermelho, '#64748b'],
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
    chartFaltas = new Chart(document.getElementById('chartFaltas'), {
        type: 'bar',
        data: {
            labels: materias.map(m => m.disciplina),
            datasets: [{
                label: 'Faltas',
                data: materias.map(m => calcularInfoMateria(m).totalFaltas),
                backgroundColor: corCiano,
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

// --- CONTROLES E EVENTOS ---
function configurarEventos() {
    // Alternar Tema (Padrão: Preto e Neon / Opcional: Claro)
    const btnTema = document.getElementById('btn-tema');
    if (localStorage.getItem('boletim_tema_light') === 'true') {
        document.body.classList.add('light-mode');
        btnTema.innerText = '🌙';
    }

    btnTema.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        btnTema.innerText = isLight ? '🌙' : '☀️';
        localStorage.setItem('boletim_tema_light', isLight);
        renderizarGraficos();
    });

    // Alternar Modo Edição
    const btnEdicao = document.getElementById('btn-modo-edicao');
    const bannerEdicao = document.getElementById('banner-edicao');
    btnEdicao.addEventListener('click', () => {
        modoEdicao = !modoEdicao;
        btnEdicao.classList.toggle('btn-editar-ativo', modoEdicao);
        btnEdicao.innerText = modoEdicao ? "✏️ Editando Notas" : "🔒 Edição Bloqueada";
        bannerEdicao.classList.toggle('escondido', !modoEdicao);
        renderizarListaMaterias();
    });

    // Puxar dados originais da planilha do Drive
    document.getElementById('btn-puxar-drive').addEventListener('click', () => {
        if (confirm("Deseja substituir as edições locais pelos dados atuais da planilha do Google Drive?")) {
            localStorage.removeItem(STORAGE_KEY);
            sincronizarComDrive(true);
        }
    });

    // Abas
    document.querySelectorAll('.aba-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
            document.querySelectorAll('.aba-painel').forEach(p => p.classList.remove('ativa'));
            btn.classList.add('ativa');
            document.getElementById(btn.dataset.aba).classList.add('ativa');
            if (btn.dataset.aba === 'aba-graficos') renderizarGraficos();
        });
    });

    // Busca e Filtros
    document.getElementById('input-busca').addEventListener('input', renderizarListaMaterias);

    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            filtroAtual = btn.dataset.filtro;
            renderizarListaMaterias();
        });
    });

    const btnExpandir = document.getElementById('btn-expandir-tudo');
    btnExpandir.addEventListener('click', () => {
        expandirTodas = !expandirTodas;
        btnExpandir.innerText = expandirTodas ? "Recolher Todas" : "Expandir Todas";
        renderizarListaMaterias();
    });
}

function iniciarApp() {
    configurarEventos();
    sincronizarComDrive(false);
}

configurarLogin();