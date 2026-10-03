// Tokens must match QrPayloadParser.cs
const PipeToken = '__PIPE__';
const SemicolonToken = '__SEMICOLON__';

// UI strings and the sample deck, picked by the page's <html lang>
const STRINGS = {
  en: {
    sampleDeck: {
      name: 'Sample deck',
      cards: [
        { question: 'Capital of France', answer: 'Paris' },
        { question: 'Capital of Sweden', answer: 'Stockholm' },
        { question: "Newton's second law", answer: 'Force equals mass times acceleration:\n\n$$F = ma$$' },
        { question: 'Area of a circle of radius $r$', answer: 'Inline math: $A = \\pi r^2$' },
        { question: 'Markdown formatting', answer: '**Bold**, *italic*, `code`, and a list:\n\n- first point\n- second point' },
        { question: 'Capital of Switzerland', answer: 'Bern', wrongAnswers: ['Zürich', 'Geneva', 'Basel'] }
      ]
    },
    question: 'Question',
    answer: 'Answer',
    correctAnswer: 'Correct answer',
    wrongAnswer: 'Wrong answer',
    clickToEdit: 'Click to edit',
    nothingToPreview: 'Nothing to preview yet',
    removeWrong: 'Remove wrong answer',
    addWrong: '+ wrong answer',
    addWrongTitle: 'Add a wrong answer to make this a multiple-choice card',
    removeCard: 'Remove card',
    qrInfo: (frames, chars) => `frames: ${frames} · payload: ${chars} chars`,
    clipboardEmpty: 'Your clipboard is empty. Copy a two-column table (question, answer) first.',
    notATable: 'That clipboard content isn\'t a table. Give AI paste rows like <code>France, Paris</code> — a question, then its answer, separated by a comma, a tab, or the <code>|</code> of a Markdown table. Extra columns are wrong answers for a multiple-choice card: <code>Capital of France, Paris, Lyon, Nice</code>.',
    clipboardFailed: 'Couldn\'t read your clipboard. Allow clipboard access for this page, then copy your table again.',
    copied: 'Copied',
    copyPrompt: 'Copy prompt',
    copyFailed: 'Couldn\'t copy — select the text and copy it'
  },
  sv: {
    sampleDeck: {
      name: 'Exempelkortlek',
      cards: [
        { question: 'Frankrikes huvudstad', answer: 'Paris' },
        { question: 'Sveriges huvudstad', answer: 'Stockholm' },
        { question: 'Newtons andra lag', answer: 'Kraft är lika med massa gånger acceleration:\n\n$$F = ma$$' },
        { question: 'Arean av en cirkel med radien $r$', answer: 'Matematik i löptext: $A = \\pi r^2$' },
        { question: 'Markdown-formatering', answer: '**Fetstil**, *kursiv*, `kod` och en lista:\n\n- första punkten\n- andra punkten' },
        { question: 'Schweiz huvudstad', answer: 'Bern', wrongAnswers: ['Zürich', 'Genève', 'Basel'] }
      ]
    },
    question: 'Fråga',
    answer: 'Svar',
    correctAnswer: 'Rätt svar',
    wrongAnswer: 'Fel svar',
    clickToEdit: 'Klicka för att redigera',
    nothingToPreview: 'Inget att förhandsvisa än',
    removeWrong: 'Ta bort fel svar',
    addWrong: '+ fel svar',
    addWrongTitle: 'Lägg till ett fel svar så blir kortet ett flervalskort',
    removeCard: 'Ta bort kort',
    qrInfo: (frames, chars) => `bildrutor: ${frames} · data: ${chars} tecken`,
    clipboardEmpty: 'Urklippet är tomt. Kopiera först en tabell med två kolumner (fråga, svar).',
    notATable: 'Det du har kopierat är ingen tabell. Ge AI-inklistringen rader som <code>Frankrike, Paris</code> — en fråga och sedan svaret, åtskilda av komma, semikolon, tabb eller <code>|</code> i en Markdown-tabell. Extra kolumner blir fel svar på ett flervalskort: <code>Frankrikes huvudstad, Paris, Lyon, Nice</code>.',
    clipboardFailed: 'Kunde inte läsa urklippet. Tillåt åtkomst till urklipp för den här sidan och kopiera tabellen igen.',
    copied: 'Kopierat',
    copyPrompt: 'Kopiera prompt',
    copyFailed: 'Kunde inte kopiera — markera texten och kopiera den'
  }
};
const T = STRINGS[document.documentElement.lang.startsWith('sv') ? 'sv' : 'en'];

// Example initial deck — a few plain cards plus Markdown and LaTeX samples
let deck = {
  name: T.sampleDeck.name,
  dueDate: null,
  cards: T.sampleDeck.cards
};

// Reset the deck to an empty slate (used before importing an AI-parsed deck)
function clearDeck() {
  deck = { name: '', dueDate: null, cards: [] };
}

// Replace the whole deck with cards parsed from an AI table / clipboard
function applyParsedCards(parsed) {
  clearDeck();
  deck.cards = parsed;
  syncForm();
  generateQRCodes();
  hidePasteMsg();
}

function showPasteMsg(html) {
  const el = document.getElementById('pasteMsg');
  el.innerHTML = html;
  el.hidden = false;
}
function hidePasteMsg() {
  const el = document.getElementById('pasteMsg');
  if (el) { el.hidden = true; el.textContent = ''; }
}

// --- Encoding logic (mirrors QrPayloadParser.EncodeDeckText) ---
function encodeCardValue(value) {
  if (!value) return '';
  return value.replace(/\|/g, PipeToken).replace(/;/g, SemicolonToken);
}

function encodeMetadataValue(value) {
  if (!value) return '';
  return value.replace(/\|/g, PipeToken).replace(/;/g, SemicolonToken);
}

// A quiz card's wrong answers, trimmed, without blanks, duplicates or copies of
// the correct answer (case-insensitive). Mirrors CardDraft.cleanedWrongAnswers (iOS).
function cleanWrongAnswers(wrongAnswers, correct) {
  const key = (s) => (s || '').trim().toLowerCase();
  const seen = new Set([key(correct)]);
  const out = [];
  for (const w of wrongAnswers || []) {
    const t = (w || '').trim();
    if (t && !seen.has(key(t))) { seen.add(key(t)); out.push(t); }
  }
  return out;
}

function encodeDeckText(deck) {
  const parts = [];
  if (deck.name) parts.push(`d:${encodeMetadataValue(deck.name)}`);
  if (deck.dueDate) {
    // Use yyyyMMdd like the .NET parser, only include if valid date
    let d;
    if (typeof deck.dueDate === 'string' && /^\d{8}$/.test(deck.dueDate)) {
      // yyyyMMdd -> construct Date
      const yyyy = deck.dueDate.substring(0,4);
      const mm = deck.dueDate.substring(4,6);
      const dd = deck.dueDate.substring(6,8);
      d = new Date(`${yyyy}-${mm}-${dd}`);
    } else {
      d = new Date(deck.dueDate);
    }
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear().toString().padStart(4,'0');
      const mm = (d.getMonth()+1).toString().padStart(2,'0');
      const dd = d.getDate().toString().padStart(2,'0');
      parts.push(`u:${yyyy}${mm}${dd}`);
    }
  }
  const cardValues = [];
  for (const c of deck.cards || []) {
    cardValues.push(encodeCardValue(c.question || ''));
    cardValues.push(encodeCardValue(c.answer || ''));
  }
  if (cardValues.length > 0) parts.push(`c:${cardValues.join('|')}`);

  // Multiple-choice cards: w:<n>|<wrong1>|<wrong2>|… where n is the card's
  // 0-based pair index in c:. Readers that don't know w: skip it and import
  // the card as a plain flashcard.
  (deck.cards || []).forEach((c, i) => {
    const wrong = cleanWrongAnswers(c.wrongAnswers, c.answer);
    if (wrong.length > 0) parts.push(`w:${[i, ...wrong.map(encodeCardValue)].join('|')}`);
  });

  return parts.join(';');
}

// gzip + base64 using pako
function compressAndBase64(str) {
  const compressed = pako.gzip(str);
  let binary = '';
  for (let i = 0; i < compressed.length; i++) binary += String.fromCharCode(compressed[i]);
  return btoa(binary);
}

// split into chunks for QR capacity
function splitString(str, maxLen = 170) {
  const parts = [];
  let i = 0;
  while (i < str.length) { parts.push(str.substr(i, maxLen)); i += maxLen; }
  return parts;
}

function animateQRCodes(qrElements, interval) {
  let index = 0; const total = qrElements.length; if (total === 0) return;
  if (window.__qrAnimationTimer) clearInterval(window.__qrAnimationTimer);
  qrElements.forEach(el => el.style.display = 'none');
  qrElements[index].style.display = 'flex';
  if (total === 1) return;
  // The frames must always cycle — it's how the deck transfers, not decoration —
  // so this deliberately ignores prefers-reduced-motion / Low Power Mode.
  window.__qrAnimationTimer = setInterval(() => { qrElements[index].style.display = 'none'; index = (index+1)%total; qrElements[index].style.display = 'flex'; }, interval);
}

function generateQRCodes() {
  const text = encodeDeckText(deck);
  const payload = compressAndBase64(text);
  const parts = splitString(payload, 170);
  const total = parts.length;

  const container = document.getElementById('qrcodes');
  container.innerHTML = '';
  const qrElements = [];
  parts.forEach((part, idx) => {
    // facit + index(2) + total(2) + part
    const partStr = `facit${String(idx).padStart(2,'0')}${String(total).padStart(2,'0')}${part}`;

    const frame = document.createElement('div');
    frame.className = 'qr-frame';
    const qrDiv = document.createElement('div'); qrDiv.className = 'qr-canvas';
    frame.appendChild(qrDiv);
    container.appendChild(frame);

    new QRCode(qrDiv, { text: partStr, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.L });
    qrElements.push(frame);
  });

  animateQRCodes(qrElements, 300);
  document.getElementById('qrInfo').textContent = T.qrInfo(total, payload.length);
}

// --- UI helpers ---
// Grow a card field to fit its text (capped, then it scrolls)
function autoGrow(el) {
  el.style.height = 'auto';
  const h = Math.min(el.scrollHeight, 220);
  el.style.height = h + 'px';
  el.style.overflowY = el.scrollHeight > 220 ? 'auto' : 'hidden';
}

// Whether the builder shows cards rendered (true) or as raw editable text (false)
let previewMode = true;

// A card field: a rendered Markdown + LaTeX preview you click to edit, plus its textarea
function makeCardField(value, placeholder, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'card-field';

  const t = document.createElement('textarea');
  t.rows = 1;
  t.value = value || '';
  t.placeholder = placeholder;
  t.oninput = () => { onChange(t.value); autoGrow(t); };
  t.addEventListener('blur', () => { if (previewMode) setEditing(false); });

  const preview = document.createElement('div');
  preview.className = 'card-preview';
  preview.tabIndex = 0;
  preview.title = T.clickToEdit;
  preview.setAttribute('aria-label', placeholder + ' — ' + T.clickToEdit.toLowerCase());
  preview.addEventListener('click', () => setEditing(true, true));
  preview.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true, true); }
  });

  function setEditing(on, focus) {
    t.style.display = on ? 'block' : 'none';
    preview.hidden = on;
    if (on) { autoGrow(t); if (focus) t.focus(); }
    else renderRichInto(preview, t.value);
  }

  setEditing(!previewMode, false);

  wrap.append(t, preview);
  wrap._setEditing = setEditing;
  return wrap;
}

// Render Markdown + LaTeX source into an element
function renderRichInto(el, src) {
  const source = src || '';
  if (!source.trim()) {
    el.innerHTML = `<span class="preview-empty">${T.nothingToPreview}</span>`;
    return;
  }
  // Shield math spans from the Markdown parser, then hand them back to KaTeX
  const math = [];
  const shielded = source.replace(
    /\$\$[\s\S]+?\$\$|\$[^\n$]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/g,
    (m) => { math.push(m); return `M${math.length - 1}`; }
  );
  let html = window.marked
    ? marked.parse(shielded, { breaks: true })
    : shielded.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  html = html.replace(/M(\d+)/g, (_, i) => math[+i]);
  el.innerHTML = html;
  if (window.renderMathInElement) {
    try {
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    } catch (e) { /* leave the raw math visible */ }
  }
}

function renderCards() {
  const list = document.getElementById('cardsList'); list.innerHTML = '';
  deck.cards = deck.cards || [];
  deck.cards.forEach((c, i) => {
    c.wrongAnswers = c.wrongAnswers || [];
    const isQuiz = c.wrongAnswers.length > 0;
    const row = document.createElement('div');
    row.className = 'card-row' + (isQuiz ? ' card-row--quiz' : '');
    const q = makeCardField(c.question, T.question, (v) => { c.question = v; generateQRCodes(); });
    const a = makeCardField(c.answer, isQuiz ? T.correctAnswer : T.answer, (v) => { c.answer = v; generateQRCodes(); });

    // Answer column: the answer (✓ on a quiz card), each wrong answer (✕),
    // then "+ wrong answer", which turns a flashcard into a quiz card.
    const answerCol = document.createElement('div'); answerCol.className = 'answer-col';
    const fields = [q, a];
    answerCol.appendChild(isQuiz ? optionLine(a, 'right') : a);
    c.wrongAnswers.forEach((w, wi) => {
      const f = makeCardField(w, T.wrongAnswer, (v) => { c.wrongAnswers[wi] = v; generateQRCodes(); });
      const line = optionLine(f, 'wrong');
      const rm = document.createElement('button');
      rm.className = 'wrong-remove'; rm.innerHTML = '×'; rm.title = T.removeWrong;
      rm.setAttribute('aria-label', T.removeWrong);
      rm.onclick = () => { c.wrongAnswers.splice(wi, 1); renderCards(); generateQRCodes(); };
      line.appendChild(rm);
      answerCol.appendChild(line);
      fields.push(f);
    });
    const addWrong = document.createElement('button');
    addWrong.className = 'add-wrong'; addWrong.textContent = T.addWrong;
    addWrong.title = T.addWrongTitle;
    addWrong.onclick = () => {
      c.wrongAnswers.push('');
      renderCards();
      // Straight into editing the new wrong answer
      const rows = document.querySelectorAll('#cardsList .card-row');
      const lines = rows[i] && rows[i].querySelectorAll('.opt-line .card-field');
      if (lines && lines.length) lines[lines.length - 1]._setEditing(true, true);
    };
    answerCol.appendChild(addWrong);

    const del = document.createElement('button');
    del.innerHTML = '×';
    del.className = 'remove-btn';
    del.title = T.removeCard;
    del.onclick = () => { deck.cards.splice(i,1); renderCards(); generateQRCodes(); };
    row.appendChild(q); row.appendChild(answerCol); row.appendChild(del);
    list.appendChild(row);
    // Size any textarea that's visible now that it's in the DOM
    fields.forEach((f) => {
      const ta = f.querySelector('textarea');
      if (ta.style.display !== 'none') autoGrow(ta);
    });
  });
}

// A field with a ✓ (correct answer) or ✕ (wrong answer) mark in front
function optionLine(field, kind) {
  const line = document.createElement('div'); line.className = 'opt-line';
  const mark = document.createElement('span');
  mark.className = 'opt-mark opt-mark--' + kind;
  mark.textContent = kind === 'right' ? '✓' : '✕';
  mark.title = kind === 'right' ? T.correctAnswer : T.wrongAnswer;
  mark.setAttribute('aria-hidden', 'true');
  line.append(mark, field);
  return line;
}

function addCard() {
  deck.cards = deck.cards || [];
  deck.cards.push({ question: '', answer: '', wrongAnswers: [] });
  renderCards();
  generateQRCodes();
  // Drop straight into editing the new card even when the builder is in preview mode
  const rows = document.querySelectorAll('#cardsList .card-row');
  const last = rows[rows.length - 1];
  if (last) last.querySelector('.card-field')._setEditing(true, true);
}

// parse HTML clipboard tables (like earlier)
async function readHtmlClipboard() {
  hidePasteMsg();
  try {
    // Try clipboard.read() for rich types when available
    if (navigator.clipboard && navigator.clipboard.read) {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            const html = await blob.text();
            const parsed = parseClipboardHtml(html);
            if (parsed && parsed.length>0) { applyParsedCards(parsed); return; }
          }
          if (item.types.includes('text/markdown')) {
            const blob = await item.getType('text/markdown');
            const md = await blob.text();
            const parsed = parseMarkdownTable(md);
            if (parsed && parsed.length>0) { applyParsedCards(parsed); return; }
          }
        }
      } catch (e) {
        // navigator.clipboard.read may fail on some browsers; fall back to readText
      }
    }

    // Fallback: plain text — Markdown table, tab-separated, then comma/semicolon
    const text = await navigator.clipboard.readText();
    if (!text || !text.trim()) {
      showPasteMsg(T.clipboardEmpty);
      return;
    }

    const fromMd = parseMarkdownTable(text);
    if (fromMd && fromMd.length>0) { applyParsedCards(fromMd); return; }

    const fromTsv = parseTSV(text);
    if (fromTsv && fromTsv.length>0) { applyParsedCards(fromTsv); return; }

    const fromDelim = parseDelimited(text);
    if (fromDelim && fromDelim.length>0) { applyParsedCards(fromDelim); return; }

    showPasteMsg(T.notATable);
  } catch (e) {
    console.error('Clipboard read failed', e);
    showPasteMsg(T.clipboardFailed);
  }
}

// One table row → a card: column 1 the question, column 2 the (correct) answer,
// columns 3+ wrong answers, which make it a multiple-choice card. Mirrors
// ClipboardParser.card(fromColumns:) in the iOS app.
function cardFromColumns(cols) {
  if (!cols || cols.length < 2) return null;
  return { question: cols[0], answer: cols[1], wrongAnswers: cleanWrongAnswers(cols.slice(2), cols[1]) };
}

// Split a line on `sep`, honouring "double quotes" so a quoted comma stays in its cell
function splitQuoted(line, sep) {
  const out = []; let cur = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === sep && !inQuotes) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

// Comma or semicolon separated rows — only accepted when most lines split into columns
function parseDelimited(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // The separator is whichever of , and ; the first line uses more
  const first = lines[0] || '';
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  for (const l of lines) {
    const card = cardFromColumns(splitQuoted(l, sep));
    if (card && card.question && card.answer) rows.push(card);
  }
  return rows.length >= Math.max(1, Math.ceil(lines.length * 0.6)) ? rows : [];
}

// Parse markdown table text like:
// | Question | Answer |
// | --- | --- |
// | Hund | Dog |
function parseMarkdownTable(md) {
  if (!md) return [];
  const lines = md.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // find a header + separator row pattern
  let headerIndex = -1;
  for (let i = 0; i < lines.length - 1; i++) {
    if (/^\|?.*\|.*$/.test(lines[i]) && /^\|?\s*:?-{3,}:?\s*\|/.test(lines[i+1])) { headerIndex = i; break; }
  }
  if (headerIndex === -1) return [];

  const rows = [];
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const row = lines[i];
    if (!/^\|?.*\|.*$/.test(row)) continue;
    // split on '|' and remove empty leading/trailing
    const cols = row.split('|').map(c => c.trim()).filter((c, idx, arr) => !(c === '' && (idx === 0 || idx === arr.length-1)));
    const card = cardFromColumns(cols);
    if (card) rows.push(card);
  }
  return rows;
}

function parseTSV(text) {
  if (!text) return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows = [];
  for (const l of lines) {
    if (!l) continue;
    const card = cardFromColumns(l.split('\t').map(p => p.trim()));
    if (card) rows.push(card);
  }
  return rows;
}

function parseClipboardHtml(html) {
  const cards = [];
  if (!html) return cards;
  try {
    const parser = new DOMParser(); const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table tr');
    rows.forEach(row => {
      const cols = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
      const card = cardFromColumns(cols);
      if (card) cards.push(card);
    });
  } catch (e) { console.error('parseClipboardHtml', e); }
  return cards;
}

// --- Wire DOM ---
document.getElementById('deckName').oninput = (e) => { deck.name = e.target.value; generateQRCodes(); };
function formatDueDateForInput(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    // yyyyMMdd -> yyyy-mm-dd for input
    const m = value.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    // ISO-like
    const iso = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];
  }
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear().toString().padStart(4,'0');
      const mm = (d.getMonth()+1).toString().padStart(2,'0');
      const dd = d.getDate().toString().padStart(2,'0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch (e) { }
  return '';
}

document.getElementById('useDueDate').addEventListener('change', (e) => {
  const field = document.getElementById('dueDateField');
  if (e.target.checked) {
    field.hidden = false;
    const v = document.getElementById('dueDate').value;
    deck.dueDate = v ? v : null;
  } else {
    field.hidden = true;
    deck.dueDate = null;
  }
  generateQRCodes();
});
document.getElementById('dueDate').onchange = (e) => {
  // input returns yyyy-mm-dd; keep deck.dueDate in that format for clarity
  deck.dueDate = e.target.value ? e.target.value : null;
  generateQRCodes();
};
document.getElementById('addCardBtn').addEventListener('click', () => { addCard(); });
document.getElementById('pasteBtn').addEventListener('click', readHtmlClipboard);

// Copy an example AI prompt to the clipboard
document.querySelectorAll('.copy-prompt').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = document.getElementById(btn.dataset.target).textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add('copied');
      btn.title = T.copied;
      setTimeout(() => { btn.classList.remove('copied'); btn.title = T.copyPrompt; }, 2000);
    } catch (e) {
      btn.title = T.copyFailed;
    }
  });
});

const modeToggle = document.getElementById('modeToggle');
modeToggle.checked = !previewMode;
modeToggle.addEventListener('change', () => {
  previewMode = !modeToggle.checked;
  renderCards();
});

// Push the current deck object into the form controls
function syncForm() {
  document.getElementById('deckName').value = deck.name || '';
  const use = !!deck.dueDate;
  document.getElementById('useDueDate').checked = use;
  document.getElementById('dueDateField').hidden = !use;
  document.getElementById('dueDate').value = formatDueDateForInput(deck.dueDate);
  renderCards();
}

// initialize UI
(function init(){
  syncForm();
  generateQRCodes();
})();
