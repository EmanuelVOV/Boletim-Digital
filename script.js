// Link da sua Planilha do Google Drive
const SPREADSHEET_ID = "1yhQkt8Q6tlIvcg5Fon3mdXZ3cMR-mnTXi7A7gDxXxPc";
const URL_NOTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Notas`;
const URL_FALTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Faltas`;

// DADOS DE RESERVA (Plano B)
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

// LÓGICA DO BOTÃO DE TEMA (CLARO / ESCURO)
function inicializarTema() {
    const btnTema = document.getElementById('btn-tema');
    if (!btnTema) return;

    btnTema.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        
        if (document.body.classList.contains('light-mode')) {
            btnTema.innerText = '☀️';
        } else {
            btnTema.innerText = '🌙';
        }
    });
}

function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "" || valor === "—") {
        return null;
    }

    if (typeof valor === 'string') {
        valor = valor.replace(/"/g, '').replace(',', '.').trim();
    }

    let numero = Number(valor);

    if (isNaN(numero)) return null;
    if (numero > 10 && numero <= 100) numero = numero / 10;
    if (numero < 0 || numero > 10) return null;

    return numero;
}

function parseCSV(textoCSV) {
    const linhas = textoCSV.split('\n');
    return linhas.map(linha => {
        return linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(celula => 
            celula.replace(/^"|"$/g, '').trim()
        );
    });
}

function formatarExibicao(nota) {
    if (nota === null) return "—";
    return nota.toFixed(1).replace('.', ',');
}

function renderizarMaterias(lista) {
    const containerMaterias = document.getElementById('materias-container');
    containerMaterias.innerHTML = '';

    let somaDasMedias = 0;
    let disciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let bomDesempenhoCount = 0;
    let atencaoCount = 0;

    lista.forEach(item => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        let faltasTotal = Array.isArray(item.faltas)
            ? item.faltas.reduce((a, b) => a + b, 0)
            : Number(item.faltas) || 0;

        totalFaltasGeral += faltasTotal;

        const notasDisponiveis = [n1, n2, n3].filter(n => n !== null);

        let mediaTexto = "—";
        let situacaoTexto = "Nota ainda não disponível";
        let situacaoClasse = "situacao-indisponivel";

        if (notasDisponiveis.length > 0) {
            const somaNotas = notasDisponiveis.reduce((a, b) => a + b, 0);
            const mediaCalculada = somaNotas / notasDisponiveis.length;

            mediaTexto = mediaCalculada.toFixed(1).replace('.', ',');
            somaDasMedias += mediaCalculada;
            disciplinasComMedia++;

            if (mediaCalculada >= 6.0) {
                situacaoTexto = "Bom desempenho";
                situacaoClasse = "situacao-bom";
                bomDesempenhoCount++;
            } else {
                situacaoTexto = "Atenção";
                situacaoClasse = "situacao-atencao";
                atencaoCount++;
            }
        }

        const cardMateria = document.createElement('article');
        cardMateria.className = 'materia-card';
        cardMateria.innerHTML = `
            <div class="materia-header">
                <div class="materia-info-topo">
                    <h3 class="materia-titulo">${item.disciplina}</h3>
                    <span class="situacao-badge ${situacaoClasse}">${situacaoTexto}</span>
                </div>
                <span class="seta-icon">▼</span>
            </div>
            <div class="materia-grid">
                <div class="nota-box">
                    <span class="nota-label">1º Tri</span>
                    <span class="nota-valor">${formatarExibicao(n1)}</span>
                </div>
                <div class="nota-box">
                    <span class="nota-label">2º Tri</span>
                    <span class="nota-valor">${formatarExibicao(n2)}</span>
                </div>
                <div class="nota-box">
                    <span class="nota-label">3º Tri</span>
                    <span class="nota-valor">${formatarExibicao(n3)}</span>
                </div>
                <div class="nota-box nota-box-destaque">
                    <span class="nota-label">Média</span>
                    <span class="nota-valor nota-destaque">${mediaTexto}</span>
                </div>
                <div class="nota-box">
                    <span class="nota-label">Faltas</span>
                    <span class="nota-valor">${faltasTotal}</span>
                </div>
            </div>
        `;

        const header = cardMateria.querySelector('.materia-header');
        header.addEventListener('click', () => {
            cardMateria.classList.toggle('aberto');
        });

        containerMaterias.appendChild(cardMateria);
    });

    const mediaGeralFinal = disciplinasComMedia > 0 
        ? (somaDasMedias / disciplinasComMedia).toFixed(1).replace('.', ',') 
        : "—";

    document.getElementById('card-media').innerText = mediaGeralFinal;
    document.getElementById('card-faltas').innerText = totalFaltasGeral;
    document.getElementById('card-bom-desempenho').innerText = bomDesempenhoCount;
    document.getElementById('card-atencao').innerText = atencaoCount;
    document.getElementById('card-frequencia').innerText = "92%";
    document.getElementById('card-frequencia-texto').innerText = "Frequência adequada";
}

async function carregarBoletim() {
    inicializarTema();

    try {
        const [respostaNotas, respostaFaltas] = await Promise.all([
            fetch(URL_NOTAS),
            fetch(URL_FALTAS)
        ]);

        if (!respostaNotas.ok || !respostaFaltas.ok) {
            throw new Error("Falha ao acessar o Google Drive.");
        }

        const textoNotas = await respostaNotas.text();
        const textoFaltas = await respostaFaltas.text();

        const matrizNotas = parseCSV(textoNotas);
        const matrizFaltas = parseCSV(textoFaltas);

        let listaDoDrive = [];

        for (let i = 1; i <= 15; i++) {
            if (!matrizNotas[i] || matrizNotas[i].length < 4) continue;

            let f1 = 0, f2 = 0, f3 = 0;
            if (matrizFaltas[i]) {
                f1 = Number(matrizFaltas[i][1]) || 0;
                f2 = Number(matrizFaltas[i][2]) || 0;
                f3 = Number(matrizFaltas[i][3]) || 0;
            }

            listaDoDrive.push({
                disciplina: matrizNotas[i][0],
                tri1: matrizNotas[i][1],
                tri2: matrizNotas[i][2],
                tri3: matrizNotas[i][3],
                faltas: [f1, f2, f3]
            });
        }

        if (listaDoDrive.length > 0) {
            renderizarMaterias(listaDoDrive);
        } else {
            renderizarMaterias(dadosBoletimReserva);
        }

    } catch (erro) {
        console.warn("Usando dados locais de reserva:", erro);
        renderizarMaterias(dadosBoletimReserva);
    }
}

carregarBoletim();