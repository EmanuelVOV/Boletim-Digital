// Link da sua Planilha do Google Drive
const SPREADSHEET_ID = "1yhQkt8Q6tlIvcg5Fon3mdXZ3cMR-mnTXi7A7gDxXxPc";

// Links para baixar as abas "Notas" e "Faltas" em formato texto (CSV)
const URL_NOTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Notas`;
const URL_FALTAS = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Faltas`;

// Função para converter/normalizar notas para a escala de 0 a 10
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "" || valor === "—") {
        return null;
    }

    // Se vier entre aspas ou texto, ajusta vírgula por ponto
    if (typeof valor === 'string') {
        valor = valor.replace(/"/g, '').replace(',', '.').trim();
    }

    let numero = Number(valor);

    if (isNaN(numero)) {
        return null;
    }

    // Se a nota estiver entre 10 e 100, divide por 10 (ex: 85 vira 8.5)
    if (numero > 10 && numero <= 100) {
        numero = numero / 10;
    }

    if (numero < 0 || numero > 10) {
        return null;
    }

    return numero;
}

// Função para transformar o texto da planilha (CSV) em linhas e colunas organizadas
function parseCSV(textoCSV) {
    const linhas = textoCSV.split('\n');
    return linhas.map(linha => {
        // Divide as colunas separadas por vírgula e remove aspas
        return linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(celula => 
            celula.replace(/^"|"$/g, '').trim()
        );
    });
}

// Função para formatar exibição das notas na tabela
function formatarExibicao(nota) {
    if (nota === null) {
        return "—";
    }
    return nota.toFixed(1).replace('.', ',');
}

// Função principal que busca os dados da planilha e atualiza a tela
async function carregarBoletimDoDrive() {
    try {
        // Busca os dados da aba Notas e da aba Faltas no Google Drive
        const [respostaNotas, respostaFaltas] = await Promise.all([
            fetch(URL_NOTAS),
            fetch(URL_FALTAS)
        ]);

        const textoNotas = await respostaNotas.text();
        const textoFaltas = await respostaFaltas.text();

        const matrizNotas = parseCSV(textoNotas);
        const matrizFaltas = parseCSV(textoFaltas);

        const tabelaCorpo = document.getElementById('tabela-boletim');
        tabelaCorpo.innerHTML = '';

        let somaDasMedias = 0;
        let disciplinasComMedia = 0;
        let totalFaltasGeral = 0;
        let bomDesempenhoCount = 0;
        let atencaoCount = 0;

        // Pula a primeira linha de título e lê as disciplinas (linhas 1 a 15)
        for (let i = 1; i <= 15; i++) {
            if (!matrizNotas[i] || matrizNotas[i].length < 4) continue;

            const disciplina = matrizNotas[i][0];
            const n1 = normalizarNota(matrizNotas[i][1]);
            const n2 = normalizarNota(matrizNotas[i][2]);
            const n3 = normalizarNota(matrizNotas[i][3]);

            // Pega as faltas correspondentes na aba Faltas
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

            // Adiciona a linha na tabela
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${disciplina}</strong></td>
                <td>${formatarExibicao(n1)}</td>
                <td>${formatarExibicao(n2)}</td>
                <td>${formatarExibicao(n3)}</td>
                <td><strong>${mediaTexto}</strong></td>
                <td>${faltasTotal}</td>
                <td class="${situacaoClasse}">${situacaoTexto}</td>
            `;
            tabelaCorpo.appendChild(tr);
        }

        // Atualiza os Cards de Resumo
        const mediaGeralFinal = disciplinasComMedia > 0 
            ? (somaDasMedias / disciplinasComMedia).toFixed(1).replace('.', ',') 
            : "—";

        document.getElementById('card-media').innerText = mediaGeralFinal;
        document.getElementById('card-faltas').innerText = totalFaltasGeral;
        document.getElementById('card-bom-desempenho').innerText = bomDesempenhoCount;
        document.getElementById('card-atencao').innerText = atencaoCount;

        // Frequência demonstrativa (92%)
        document.getElementById('card-frequencia').innerText = "92%";
        document.getElementById('card-frequencia-texto').innerText = "Frequência adequada";

    } catch (erro) {
        console.error("Erro ao carregar dados da planilha do Drive:", erro);
    }
}

// Carrega o boletim direto do Google Drive assim que abre a página
carregarBoletimDoDrive();