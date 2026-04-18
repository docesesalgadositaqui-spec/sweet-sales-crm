/**
 * CRM Doces Artesanais — Google Apps Script API
 *
 * Como usar:
 * 1. Abra sua planilha no Google Sheets.
 * 2. Crie 3 abas com EXATAMENTE estes nomes e cabeçalhos (linha 1):
 *
 *    Aba "CLIENTES":
 *      id | nome | telefone | instagram | cidade | aniversario | ultima_compra | valor_total | observacoes
 *
 *    Aba "PRODUTOS":
 *      id | nome | categoria | sabor | preco | custo | estoque | ativo | foto
 *
 *    Aba "PEDIDOS":
 *      id | cliente_id | cliente_nome | itens | valor_total | pagamento | data_pedido | data_entrega | status | observacoes
 *      (itens é uma string JSON, ex: [{"produto_id":"p1","nome":"Brigadeiro","qtd":10,"preco":3.5}])
 *
 * 3. Extensões > Apps Script > cole TODO este arquivo.
 * 4. Implantar > Nova implantação > Tipo: Aplicativo da Web
 *    - Executar como: Eu
 *    - Quem tem acesso: Qualquer pessoa
 * 5. Copie a URL gerada e cole no app (Configurações).
 *
 * Endpoints:
 *   GET  ?sheet=CLIENTES                    -> lista todos
 *   POST { sheet:"CLIENTES", action:"create", data:{...} }
 *   POST { sheet:"CLIENTES", action:"update", id:"...", data:{...} }
 *   POST { sheet:"CLIENTES", action:"delete", id:"..." }
 */

const SHEETS = ["CLIENTES", "PRODUTOS", "PEDIDOS"];

function doGet(e) {
  try {
    const sheetName = (e.parameter.sheet || "CLIENTES").toUpperCase();
    if (!SHEETS.includes(sheetName)) return _json({ error: "Aba inválida" });
    return _json(_readSheet(sheetName));
  } catch (err) {
    return _json({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheetName = (body.sheet || "CLIENTES").toUpperCase();
    if (!SHEETS.includes(sheetName)) return _json({ error: "Aba inválida" });

    const action = body.action || "create";
    if (action === "create") return _json(_create(sheetName, body.data || {}));
    if (action === "update") return _json(_update(sheetName, body.id, body.data || {}));
    if (action === "delete") return _json(_delete(sheetName, body.id));
    return _json({ error: "Ação inválida" });
  } catch (err) {
    return _json({ error: String(err) });
  }
}

function _readSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function _create(name, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const headers = sheet.getDataRange().getValues()[0];
  if (!data.id) data.id = Utilities.getUuid();
  const row = headers.map(h => data[h] !== undefined ? data[h] : "");
  sheet.appendRow(row);
  return { sucesso: true, id: data.id };
}

function _update(name, id, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf("id");
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(id)) {
      const newRow = headers.map((h, j) => data[h] !== undefined ? data[h] : values[i][j]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
      return { sucesso: true };
    }
  }
  return { sucesso: false, error: "ID não encontrado" };
}

function _delete(name, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const values = sheet.getDataRange().getValues();
  const idCol = values[0].indexOf("id");
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { sucesso: true };
    }
  }
  return { sucesso: false, error: "ID não encontrado" };
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
