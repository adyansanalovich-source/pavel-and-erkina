/**
 * Код для таблицы гостей (Расширения → Apps Script).
 * A — ID, B — обращение, C — ссылка. Активный лист выбирается
 * однократно при запуске setupGuestLinks из редактора.
 * Скрипт RSVP с ответами гостей не заменяет.
 */
const INVITATION_URL = 'https://pavel-and-erkina.ru/';
const GENERAL_ROW = 'Для всех остальных';

function setupGuestLinks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  PropertiesService.getScriptProperties().setProperties({
    GUEST_SPREADSHEET_ID: ss.getId(),
    GUEST_SHEET_ID: String(sheet.getSheetId())
  });
  fillGuestLinks_(sheet, 2, sheet.getLastRow());
}

function onEdit(e) {
  if (!e || !e.range) return;
  const props = PropertiesService.getScriptProperties();
  const sheet = e.range.getSheet();
  if (String(sheet.getSheetId()) !== props.getProperty('GUEST_SHEET_ID')) return;
  if (e.range.getColumn() > 2 || e.range.getLastColumn() < 2) return;
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) return;
  try {
    fillGuestLinks_(sheet, Math.max(2, e.range.getRow()), e.range.getLastRow());
  } finally {
    lock.releaseLock();
  }
}

function fillGuestLinks_(sheet, first, last) {
  if (last < first) return;
  const data = sheet.getRange(1, 1, Math.max(last, sheet.getLastRow()), 2).getDisplayValues();
  const used = new Set(data.map(row => row[0].trim().toUpperCase()).filter(Boolean));
  for (let row = first; row <= last; row++) {
    const greeting = String(data[row - 1][1] || '').trim();
    if (!greeting) continue;
    if (greeting.toLowerCase() === GENERAL_ROW.toLowerCase()) {
      sheet.getRange(row, 3).setValue(INVITATION_URL);
      continue;
    }
    let id = String(data[row - 1][0] || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(id)) {
      do {
        id = Math.random().toString(36).slice(2, 8).toUpperCase();
      } while (id.length !== 6 || used.has(id));
      sheet.getRange(row, 1).setValue(id);
      used.add(id);
    }
    sheet.getRange(row, 3).setValue(INVITATION_URL + '?g=' + id);
  }
}

// Веб-приложение только читает одну запись по ID. Ответы RSVP оно не принимает.
function doGet(e) {
  const id = String((e && e.parameter && e.parameter.id) || '').trim().toUpperCase();
  let greeting = null;
  if (/^[A-Z0-9]{6}$/.test(id)) {
    const props = PropertiesService.getScriptProperties();
    const ss = SpreadsheetApp.openById(props.getProperty('GUEST_SPREADSHEET_ID'));
    const sheetId = Number(props.getProperty('GUEST_SHEET_ID'));
    const sheet = ss.getSheets().find(s => s.getSheetId() === sheetId);
    if (sheet && sheet.getLastRow() >= 2) {
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
      const found = rows.find(r => r[0].trim().toUpperCase() === id);
      if (found) greeting = String(found[1] || '').trim() || null;
    }
  }
  return ContentService.createTextOutput('window.weddingGuestLookup(' + JSON.stringify(greeting) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
