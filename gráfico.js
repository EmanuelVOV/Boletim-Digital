const SPREADSHEET_ID = "1yhQkt8Q6tlIvcg5Fon3mdXZ3cMR-mnTXi7A7gDxXxPc";
const URL_NOTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Notas`;

const dadosReserva = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85 },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0 },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9" },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7 },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4" },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93 },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5" },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0" },
  { disciplina: "Literatura", tri1: "7,7", tri2: 80, tri3: null },
  { disciplina: "Práticas Exp.", tri1: 58, tri2: "6,2", tri3: 6.4 }
];

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

function calcularMedias(lista) {
    const nomes = [];
    const medias = [];

    lista.forEach(item => {
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        const notasValidas = [n1, n2, n3].filter(n => n !== null);
        
        if (notasValidas.length > 0) {
            const soma = notasValidas.reduce((a, b) => a + b, 0);
            const media = Number((soma / notasValidas.length).toFixed(1));
            nomes.push(item.disciplina);
            medias.push(media);
        }
    });

    return { nomes, medias };
}

function desenharGrafico(nomes, medias) {
    const ctx = document.getElementById('graficoNotas').getContext('2d');

    // Cores dinâmicas: verde para média >= 6.0 e vermelho para < 6.0
    const coresBarras = medias.map(m => m >= 6.0 ? '#27ae60' : '#e74c3c');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nomes,
            datasets: [{
                label: 'Média Atual',
                data: medias,
                backgroundColor: coresBarras,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    grid: { color: '#2e1b4d' },
                    ticks: { color: '#a392c2' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#a392c2', font: { size: 10 } }
                }
            },
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            }
        }
    });
}

async function carregarGrafico() {
    try {
        const resposta = await fetch(URL_NOTAS);
        if (!resposta.ok) throw new Error();
        const texto = await resposta.text();
        const matriz = parseCSV(texto);

        let lista = [];
        for (let i = 1; i <= 15; i++) {
            if (matriz[i] && matriz[i][0]) {
                lista.push({
                    disciplina: matriz[i][0],
                    tri1: matriz[i][1],
                    tri2: matriz[i][2],
                    tri3: matriz[i][3]
                });
            }
        }
        const { nomes, medias } = calcularMedias(lista);
        desenharGrafico(nomes, medias);
    } catch {
        const { nomes, medias } = calcularMedias(dadosReserva);
        desenharGrafico(nomes, medias);
    }
}

carregarGrafico();