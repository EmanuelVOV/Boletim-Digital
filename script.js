// DADOS FICTÍCIOS PADRONIZADOS - 8º ANO
const dadosBoletim = [
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

// Função para converter/normalizar notas para a escala de 0 a 10
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null; // Nota ausente/ainda não lançada
    }

    // Se a nota vier como texto, troca vírgula por ponto
    if (typeof valor === 'string') {
        valor = valor.replace(',', '.');
    }

    let numero = Number(valor);

    // Se não for um número válido, desconsidera
    if (isNaN(numero)) {
        return null;
    }

    // Se estiver entre 10 e 100, divide por 10 (ex: 82 vira 8.2)
    if (numero > 10 && numero <= 100) {
        numero = numero / 10;
    }

    // Mantém apenas notas válidas entre 0 e 10
    if (numero < 0 || numero > 10) {
        return null;
    }

    return numero;
}

// Função para somar a lista de faltas do array
function somarFaltas(listaFaltas) {
    let total = 0;
    listaFaltas.forEach(f => {
        total += f;
    });
    return total;
}

// Função para formatar o número da nota na hora de exibir na tabela
function formatarExibicao(nota) {
    if (nota === null) {
        return "—";
    }
    return nota.toFixed(1).replace('.', ',');
}

// Função principal que preenche a página web
function carregarBoletim() {
    const tabelaCorpo = document.getElementById('tabela-boletim');
    tabelaCorpo.innerHTML = ''; // Limpa a tabela antes de preencher

    let somaDasMedias = 0;
    let disciplinasComMedia = 0;
    let totalFaltasGeral = 0;
    let bomDesempenhoCount = 0;
    let atencaoCount = 0;

    // Percorre cada disciplina da lista
    dadosBoletim.forEach(item => {
        // Normaliza as 3 notas do trimestre
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        // Separa apenas as notas que já foram lançadas (não nulas)
        const notasDisponiveis = [n1, n2, n3].filter(n => n !== null);

        let mediaTexto = "—";
        let situacaoTexto = "Nota ainda não disponível";
        let situacaoClasse = "situacao-indisponivel";

        // Se houver pelo menos uma nota disponível, calcula a média
        if (notasDisponiveis.length > 0) {
            const somaNotas = notasDisponiveis.reduce((total, n) => total + n, 0);
            const mediaCalculada = somaNotas / notasDisponiveis.length;

            mediaTexto = mediaCalculada.toFixed(1).replace('.', ',');
            somaDasMedias += mediaCalculada;
            disciplinasComMedia++;

            // Define a situação da disciplina
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

        // Soma as faltas
        const faltasDisciplina = somarFaltas(item.faltas);
        totalFaltasGeral += faltasDisciplina;

        // Cria a linha da tabela HTML
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.disciplina}</strong></td>
            <td>${formatarExibicao(n1)}</td>
            <td>${formatarExibicao(n2)}</td>
            <td>${formatarExibicao(n3)}</td>
            <td><strong>${mediaTexto}</strong></td>
            <td>${faltasDisciplina}</td>
            <td class="${situacaoClasse}">${situacaoTexto}</td>
        `;
        tabelaCorpo.appendChild(tr);
    });

    // Atualiza os Cards de Resumo na tela
    const mediaGeralFinal = disciplinasComMedia > 0 
        ? (somaDasMedias / disciplinasComMedia).toFixed(1).replace('.', ',') 
        : "—";

    document.getElementById('card-media').innerText = mediaGeralFinal;
    document.getElementById('card-faltas').innerText = totalFaltasGeral;
    document.getElementById('card-bom-desempenho').innerText = bomDesempenhoCount;
    document.getElementById('card-atencao').innerText = atencaoCount;

    // FREQUÊNCIA: Percentual fictício/demonstrativo (92%). Será calculado dinamicamente em versões futuras.
    document.getElementById('card-frequencia').innerText = "92%";
    document.getElementById('card-frequencia-texto').innerText = "Frequência adequada";
}

// Executa a função assim que a página é carregada
carregarBoletim();