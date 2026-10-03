/**
 * Отдельный проект Apps Script: https://script.google.com/home/projects/create
 * Таблица: A — ID, B — обращение, C — ссылка.
 * Не вставлять вместо действующего скрипта анкеты RSVP.
 */
const GUEST_SPREADSHEET_ID = '1o3UpLdfui0ILBiRX6Vg-2PFMf2mN2UoI8qKZq13UZTU';
const INVITATION_URL = 'https://pavel-and-erkina.ru/';
const INITIAL_IDS = {
  'уважаемая семья лиджи-убушаевых': 'A8L3PU',
  'уважаемая семья бурульдиновых': 'C7R4YN',
  'уважаемая семья дженгуровых': 'F9M2VK',
  'уважаемая семья бембиновых': 'J6Q8ST',
  'уважаемая семья картеевых': 'U4D7PX'
};

function normalizeGuest_(value) {
  return String(value || '').replace(/[‐‑–—]/g, '-')
    .replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();
}

function findGuestSheet_(ss) {
  const matches = ss.getSheets().filter(sheet => {
    const last = Math.min(sheet.getLastRow(), 30);
    if (!last) return false;
    const values = sheet.getRange(1, 2, last, 1).getDisplayValues();
    return values.some(row => normalizeGuest_(row[0]).includes('лиджи-убушаевых'));
  });
  if (matches.length !== 1) throw new Error('Не найден единственный лист гостей с семьёй Лиджи-Убушаевых в столбце B.');
  return matches[0];
}

function setupGuestLinks() {
  const ss = SpreadsheetApp.openById(GUEST_SPREADSHEET_ID);
  const sheet = findGuestSheet_(ss);
  PropertiesService.getScriptProperties().setProperty('GUEST_SHEET_ID', String(sheet.getSheetId()));
  fillGuestLinks_(sheet, 2, sheet.getLastRow());
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'guestLinksOnEdit')) {
    ScriptApp.newTrigger('guestLinksOnEdit').forSpreadsheet(ss).onEdit().create();
  }
}

function guestLinksOnEdit(e) {
  if (!e || !e.range || e.source.getId() !== GUEST_SPREADSHEET_ID) return;
  const sheet = e.range.getSheet();
  if (String(sheet.getSheetId()) !== PropertiesService.getScriptProperties().getProperty('GUEST_SHEET_ID')) return;
  if (e.range.getColumn() > 2 || e.range.getLastColumn() < 2) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    fillGuestLinks_(sheet, Math.max(2, e.range.getRow()), e.range.getLastRow());
  } finally {
    lock.releaseLock();
  }
}

function fillGuestLinks_(sheet, first, last) {
  if (last < first) return;
  const data = sheet.getRange(1, 1, Math.max(last, sheet.getLastRow()), 2).getDisplayValues();
  const used = new Set(data.map(r => String(r[0]).trim().toUpperCase()).filter(Boolean));
  for (let row = first; row <= last; row++) {
    const greeting = String(data[row - 1][1] || '').trim();
    if (!greeting) continue;
    if (normalizeGuest_(greeting) === 'для всех остальных') {
      sheet.getRange(row, 3).setValue(INVITATION_URL);
      continue;
    }
    let id = String(data[row - 1][0] || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(id)) {
      const preferred = INITIAL_IDS[normalizeGuest_(greeting)];
      if (preferred && !used.has(preferred)) id = preferred;
      else do { id = Math.random().toString(36).slice(2, 8).toUpperCase(); }
        while (id.length !== 6 || used.has(id));
      sheet.getRange(row, 1).setValue(id);
      used.add(id);
    }
    sheet.getRange(row, 3).setValue(INVITATION_URL + '?g=' + id);
  }
}

// Публичный веб-запрос читает только обращение по конкретному шестизначному ID.
function doGet(e) {
  const id = String((e && e.parameter && e.parameter.id) || '').trim().toUpperCase();
  let greeting = null;
  if (/^[A-Z0-9]{6}$/.test(id)) {
    const sheetId = Number(PropertiesService.getScriptProperties().getProperty('GUEST_SHEET_ID'));
    const ss = SpreadsheetApp.openById(GUEST_SPREADSHEET_ID);
    const sheet = ss.getSheets().find(s => s.getSheetId() === sheetId);
    if (sheet && sheet.getLastRow() >= 2) {
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues();
      const found = rows.find(r => String(r[0]).trim().toUpperCase() === id);
      if (found) greeting = String(found[1] || '').trim() || null;
    }
  }
  return ContentService.createTextOutput('window.weddingGuestLookup(' + JSON.stringify(greeting) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
