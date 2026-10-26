// Link da sua Planilha do Google Drive
const SPREADSHEET_ID = "1yhQkt8Q6tlIvcg5Fon3mdXZ3cMR-mnTXi7A7gDxXxPc";

// Links de exportação direta do Google Sheets
const URL_NOTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Notas`;
const URL_FALTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Faltas`;

// Função para converter/normalizar notas para a escala de 0 a 10
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "" || valor === "—") {
        return null;
    }

    if (typeof valor === 'string') {
        valor = valor.replace(/"/g, '').replace(',', '.').trim();
    }

    let numero = Number(valor);

    if (isNaN(numero)) {
        return null;
    }

    if (numero > 10 && numero <= 100) {
        numero = numero / 10;
    }

    if (numero < 0 || numero > 10) {
        return null;
    }

    return numero;
}

// Converte texto em formato CSV para linhas e colunas
function parseCSV(textoCSV) {
    const linhas = textoCSV.split('\n');
    return linhas.map(linha => {
        return linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(celula => 
            celula.replace(/^"|"$/g, '').trim()
        );
    });
}

// Formata a exibição das notas com vírgula
function formatarExibicao(nota) {
    if (nota === null) {
        return "—";
    }
    return nota.toFixed(1).replace('.', ',');
}

// Função principal que busca os dados no Google Drive
async function carregarBoletimDoDrive() {
    const containerMaterias = document.getElementById('materias-container');

    try {
        const [respostaNotas, respostaFaltas] = await Promise.all([
            fetch(URL_NOTAS),
            fetch(URL_FALTAS)
        ]);

        if (!respostaNotas.ok || !respostaFaltas.ok) {
            throw new Error("Não foi possível acessar a planilha.");
        }

        const textoNotas = await respostaNotas.text();
        const textoFaltas = await respostaFaltas.text();

        const matrizNotas = parseCSV(textoNotas);
        const matrizFaltas = parseCSV(textoFaltas);

        containerMaterias.innerHTML = '';

        let somaDasMedias = 0;
        let disciplinasComMedia = 0;
        let totalFaltasGeral = 0;
        let bomDesempenhoCount = 0;
        let atencaoCount = 0;

        for (let i = 1; i <= 15; i++) {
            if (!matrizNotas[i] || matrizNotas[i].length < 4) continue;

            const disciplina = matrizNotas[i][0];
            const n1 = normalizarNota(matrizNotas[i][1]);
            const n2 = normalizarNota(matrizNotas[i][2]);
            const n3 = normalizarNota(matrizNotas[i][3]);

            let f1 = 0, f2 = 0, f3 = 0;
            if (matrizFaltas[i]) {
                f1 = Number(matrizFaltas[i][1]) || 0;
                f2 = Number(matrizFaltas[i][2]) || 0;
                f3 = Number(matrizFaltas[i][3]) || 0;
            }
            const faltasTotal = f1 + f2 + f3;
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
                    <h3 class="materia-titulo">${disciplina}</h3>
                    <span class="situacao-badge ${situacaoClasse}">${situacaoTexto}</span>
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
            containerMaterias.appendChild(cardMateria);
        }

        const mediaGeralFinal = disciplinasComMedia > 0 
            ? (somaDasMedias / disciplinasComMedia).toFixed(1).replace('.', ',') 
            : "—";

        document.getElementById('card-media').innerText = mediaGeralFinal;
        document.getElementById('card-faltas').innerText = totalFaltasGeral;
        document.getElementById('card-bom-desempenho').innerText = bomDesempenhoCount;
        document.getElementById('card-atencao').innerText = atencaoCount;

        // Frequência demonstrativa
        document.getElementById('card-frequencia').innerText = "92%";
        document.getElementById('card-frequencia-texto').innerText = "Frequência adequada";

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        containerMaterias.innerHTML = `<p style="text-align: center; color: #ff2a55; padding: 20px;">Carregando notas ou verifique se a planilha foi publicada na web no Google Drive.</p>`;
    }
}

carregarBoletimDoDrive();