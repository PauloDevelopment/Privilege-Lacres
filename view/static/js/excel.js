function baixarExcel(nomeArquivo, planilhas) {
    if (typeof XLSX === "undefined") {
        throw new Error("A biblioteca de exportação Excel não foi carregada.");
    }

    const pastaTrabalho = XLSX.utils.book_new();

    planilhas.forEach(({ nome, colunas, linhas }) => {
        const planilha = XLSX.utils.aoa_to_sheet([colunas, ...linhas]);
        XLSX.utils.book_append_sheet(pastaTrabalho, planilha, nome);
    });

    XLSX.writeFile(pastaTrabalho, nomeArquivo);
}
