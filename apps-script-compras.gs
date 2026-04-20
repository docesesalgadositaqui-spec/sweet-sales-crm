/**
 * Apps Script para a aba "i" (Compras / Insumos)
 *
 * COMO USAR:
 * 1. Cole TODO este código em Extensões > Apps Script (substituindo o que tem lá).
 * 2. Salve.
 * 3. Implantar > Gerenciar implantações > Editar > Nova versão > Implantar.
 * 4. Copie a URL e cole em Configurações > "API de Compras".
 *
 * Endpoints:
 *   GET  ?aba=i                                   -> lista todas as linhas
 *   POST { aba:"i", acao:"adicionar", dados:{ campos:{ Produtos:"...", "Preços":1.5 }}}
 *   POST { aba:"i", acao:"editar",    dados:{ linha:5, campos:{ ... }}}
 *   POST { aba:"i", acao:"excluir",   dados:{ linha:5 }}
 */

function doGet(e) {
  try {
    const aba = (e.parameter.aba || e.parameter.sheet || "i");
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = planilha.getSheetByName(aba);
    if (!sheet) return respostaErro("Aba não encontrada: " + aba);

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return _json([]);

    const headers = data[0];
    const rows = data.slice(1).map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
    return _json(rows);
  } catch (err) {
    return respostaErro(String(err));
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const aba = body.aba || body.sheet || "i";
    const acao = body.acao || body.action;
    const dados = body.dados || {};
    const campos = dados.campos || body.data || {};

    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = planilha.getSheetByName(aba);
    if (!sheet) return respostaErro("Aba não encontrada: " + aba);

    const headers = sheet.getDataRange().getValues()[0];

    if (acao === "adicionar" || acao === "create") {
      const novaLinha = headers.map(function (h) {
        return campos[h] !== undefined ? campos[h] : "";
      });
      sheet.appendRow(novaLinha);
      return respostaSucesso("Linha adicionada");
    }

    if (acao === "editar" || acao === "update") {
      const linhaNumero = dados.linha || body.linha;
      if (!linhaNumero) return respostaErro("Linha não informada");
      Object.keys(campos).forEach(function (campo) {
        const coluna = headers.indexOf(campo) + 1;
        if (coluna > 0) {
          sheet.getRange(linhaNumero, coluna).setValue(campos[campo]);
        }
      });
      return respostaSucesso("Linha atualizada");
    }

    if (acao === "excluir" || acao === "delete") {
      const linhaNumero = dados.linha || body.linha;
      if (!linhaNumero) return respostaErro("Linha não informada");
      sheet.deleteRow(linhaNumero);
      return respostaSucesso("Linha excluída");
    }

    return respostaErro("Ação inválida: " + acao);
  } catch (err) {
    return respostaErro(String(err));
  }
}

function respostaSucesso(mensagem) {
  return _json({ sucesso: true, mensagem: mensagem });
}

function respostaErro(mensagem) {
  return _json({ sucesso: false, mensagem: mensagem });
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
