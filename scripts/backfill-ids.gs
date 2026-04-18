/**
 * BACKFILL DE IDs — rode UMA VEZ na sua planilha.
 *
 * Como usar:
 * 1. Abra sua planilha no Google Sheets.
 * 2. Extensões → Apps Script.
 * 3. Cole este arquivo (pode ser num arquivo novo, ex: backfill.gs).
 * 4. Salve. Em cima, escolha a função `backfillAll` e clique em ▶ Executar.
 *    (autorize quando pedir)
 * 5. Pronto — todas as linhas sem id ganham um id único.
 *
 * Funciona em qualquer aba que tenha uma coluna chamada "id" no cabeçalho.
 * Se a coluna "id" não existir, ela é criada na primeira posição.
 */

// Liste aqui as abas que você quer preencher.
// Pode deixar só "NOMES" se for a única, ou adicionar CLIENTES/PRODUTOS/PEDIDOS.
const ABAS_PARA_PREENCHER = ["NOMES", "CLIENTES", "PRODUTOS", "PEDIDOS"];

function backfillAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resumo = [];

  ABAS_PARA_PREENCHER.forEach(nome => {
    const sheet = ss.getSheetByName(nome);
    if (!sheet) {
      resumo.push(`• ${nome}: aba não encontrada (ignorada)`);
      return;
    }
    const preenchidos = backfillSheet_(sheet);
    resumo.push(`• ${nome}: ${preenchidos} id(s) gerados`);
  });

  const msg = "Backfill concluído!\n\n" + resumo.join("\n");
  SpreadsheetApp.getUi().alert(msg);
  Logger.log(msg);
}

function backfillSheet_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1) return 0;

  // Cabeçalho
  let headers = sheet.getRange(1, 1, 1, Math.max(lastCol, 1)).getValues()[0];
  let idCol = headers.findIndex(h => String(h).trim().toLowerCase() === "id");

  // Se não tem coluna id, cria na primeira posição
  if (idCol === -1) {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue("id");
    idCol = 0;
  }

  if (lastRow < 2) return 0; // só cabeçalho

  const idColNumber = idCol + 1;
  const idsRange = sheet.getRange(2, idColNumber, lastRow - 1, 1);
  const ids = idsRange.getValues();

  let preenchidos = 0;
  for (let i = 0; i < ids.length; i++) {
    const valor = ids[i][0];
    if (valor === "" || valor === null || valor === undefined) {
      ids[i][0] = Utilities.getUuid();
      preenchidos++;
    }
  }

  if (preenchidos > 0) idsRange.setValues(ids);
  return preenchidos;
}
