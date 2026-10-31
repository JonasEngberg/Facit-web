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
    nothingToPreview: 'Nothing to preview',
    removeWrong: 'Remove wrong answer',
    addWrong: '+ wrong answer',
    addWrongTitle: 'Add wrong answers to make this a multiple-choice quiz card.',
    removeCard: 'Delete card',
    qrInfo: (frames, chars) => `frames: ${frames} · payload: ${chars} chars`,
    clipboardEmpty: 'Your clipboard is empty. Copy a two-column table (question, answer) first.',
    notATable: 'That didn\'t look like a table. Copy rows like <code>France, Paris</code> — a question, then its answer, separated by a comma, a tab, or the <code>|</code> of a Markdown table. Extra columns are wrong answers for a multiple-choice card: <code>Capital of France, Paris, Lyon, Nice</code>.',
    clipboardFailed: 'Couldn\'t read your clipboard. Allow clipboard access for this page, then copy your table again.',
    copied: 'Copied',
    copyPrompt: 'Copy prompt',
    copyFailed: 'Couldn\'t copy — select the text and copy it',
    dueKinds: { exam: 'Exam', test: 'Test', homework: 'Homework', other: 'Other' },
    customEmoji: 'Type an emoji or letter',
    colorNames: ['Red', 'Orange', 'Yellow', 'Green', 'Teal', 'Cyan', 'Blue', 'Indigo', 'Purple', 'Pink', 'Brown', 'Grey']
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
    nothingToPreview: 'Inget att förhandsvisa',
    removeWrong: 'Ta bort fel svar',
    addWrong: '+ fel svar',
    addWrongTitle: 'Lägg till fel svar för att göra det här till ett flervalskort.',
    removeCard: 'Radera kort',
    qrInfo: (frames, chars) => `bildrutor: ${frames} · data: ${chars} tecken`,
    clipboardEmpty: 'Urklippet är tomt. Kopiera först en tabell med två kolumner (fråga, svar).',
    notATable: 'Det där ser inte ut som en tabell. Kopiera rader som <code>Frankrike, Paris</code> — en fråga och sedan svaret, åtskilda av komma, semikolon, tabb eller <code>|</code> i en Markdown-tabell. Extra kolumner blir fel svar på ett flervalskort: <code>Frankrikes huvudstad, Paris, Lyon, Nice</code>.',
    clipboardFailed: 'Kunde inte läsa urklippet. Tillåt åtkomst till urklipp för den här sidan och kopiera tabellen igen.',
    copied: 'Kopierat',
    copyPrompt: 'Kopiera prompt',
    copyFailed: 'Kunde inte kopiera — markera texten och kopiera den',
    dueKinds: { exam: 'Prov', test: 'Förhör', homework: 'Läxa', other: 'Annat' },
    customEmoji: 'Skriv en emoji eller bokstav',
    colorNames: ['Röd', 'Orange', 'Gul', 'Grön', 'Blågrön', 'Cyan', 'Blå', 'Indigo', 'Lila', 'Rosa', 'Brun', 'Grå']
  }
};
const T = STRINGS[document.documentElement.lang.startsWith('sv') ? 'sv' : 'en'];

// The subject picker's choices. Mirror EmojiPicker.presets and
// ColorDotsPicker.hexColors (iOS); the first colour is the default.
const SubjectEmojis = [
  '🇬🇧', '🇪🇸', '🇫🇷', '🇩🇪', '🇮🇹', '🇯🇵',
  '📜', '🌍', '🔢', '🔬', '🧪', '🧬',
  '📖', '🎨', '🎵', '🩺', '💻'
];
const SubjectColors = [
  '#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#30B0C7', '#34C3FF',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E', '#8E8E93'
];

function emptySubject() {
  return { title: '', emoji: '', color: SubjectColors[0] };
}

// Example initial deck — a few plain cards plus Markdown and LaTeX samples
let deck = {
  name: T.sampleDeck.name,
  dueDate: null,
  dueKind: '',
  subject: emptySubject(),
  listening: false,
  passage: '',
  passageLanguage: '',
  cards: T.sampleDeck.cards
};

// Reset the deck to an empty slate (used before importing an AI-parsed deck)
function clearDeck() {
  deck = { name: '', dueDate: null, dueKind: '', subject: emptySubject(), listening: false, passage: '', passageLanguage: '', cards: [] };
}

// Replace the whole deck with cards parsed from an AI table / clipboard. A
// text above the table (`source`) makes it a listening deck, as in the app.
function applyParsedCards(parsed, source) {
  clearDeck();
  deck.cards = parsed;
  const found = passageIn(source);
  if (found.passage) {
    deck.listening = true;
    deck.passage = found.passage;
    deck.name = found.title;
  }
  syncForm();
  generateQRCodes();
  hidePasteMsg();
}

// The message shows under whichever Paste from AI button was pressed
let pasteMsgId = 'pasteMsg';
function showPasteMsg(html) {
  const el = document.getElementById(pasteMsgId);
  el.innerHTML = html;
  el.hidden = false;
}
function hidePasteMsg() {
  document.querySelectorAll('.paste-msg').forEach(el => { el.hidden = true; el.textContent = ''; });
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

const DueKinds = ['exam', 'test', 'homework', 'other'];

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
      // What the date is for: exam / test / homework / other. Readers that
      // don't know uk: skip it and import a plain due date.
      if (DueKinds.includes(deck.dueKind)) parts.push(`uk:${deck.dueKind}`);
    }
  }
  // The deck's subject: s:<title>, with se:<emoji> and sc:<#RRGGBB>. Facit
  // files the deck under the user's subject of that name, or makes one like it.
  const subjectTitle = (deck.subject && deck.subject.title || '').trim();
  if (subjectTitle) {
    parts.push(`s:${encodeMetadataValue(subjectTitle)}`);
    if (deck.subject.emoji) parts.push(`se:${encodeMetadataValue(deck.subject.emoji)}`);
    if (deck.subject.color) parts.push(`sc:${deck.subject.color}`);
  }
  // A listening deck's text, read aloud before the questions: p:<passage>
  // (escaped like d:, newlines kept) and tl:<language>. Facit 2.0 skips them
  // and imports the questions as a plain deck. Mirrors QrPayloadCodec (iOS).
  const passage = deck.listening ? (deck.passage || '').trim() : '';
  if (passage) {
    parts.push(`p:${encodeMetadataValue(passage)}`);
    if (deck.passageLanguage) parts.push(`tl:${deck.passageLanguage}`);
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

// qrElements[i] holds frame i of every QR plate, so the plates cycle in step
function animateQRCodes(qrElements, interval) {
  let index = 0; const total = qrElements.length; if (total === 0) return;
  if (window.__qrAnimationTimer) clearInterval(window.__qrAnimationTimer);
  const show = (i, display) => qrElements[i].forEach(el => el.style.display = display);
  qrElements.forEach((_, i) => show(i, 'none'));
  show(index, 'flex');
  if (total === 1) return;
  // The frames must always cycle — it's how the deck transfers, not decoration —
  // so this deliberately ignores prefers-reduced-motion / Low Power Mode.
  window.__qrAnimationTimer = setInterval(() => { show(index, 'none'); index = (index+1)%total; show(index, 'flex'); }, interval);
}

function generateQRCodes() {
  const text = encodeDeckText(deck);
  const payload = compressAndBase64(text);
  const parts = splitString(payload, 170);
  const total = parts.length;

  // One plate in the hero, one beside the deck builder
  const plates = document.querySelectorAll('.qr-plate');
  plates.forEach(plate => { plate.innerHTML = ''; });
  const qrElements = [];
  parts.forEach((part, idx) => {
    // facit + index(2) + total(2) + part
    const partStr = `facit${String(idx).padStart(2,'0')}${String(total).padStart(2,'0')}${part}`;

    qrElements.push([...plates].map(plate => {
      const frame = document.createElement('div');
      frame.className = 'qr-frame';
      const qrDiv = document.createElement('div'); qrDiv.className = 'qr-canvas';
      frame.appendChild(qrDiv);
      plate.appendChild(frame);
      new QRCode(qrDiv, { text: partStr, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.L });
      return frame;
    }));
  });

  animateQRCodes(qrElements, 300);
  document.querySelectorAll('.qr-info').forEach(el => { el.textContent = T.qrInfo(total, payload.length); });
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
            if (parsed && parsed.length>0) { applyParsedCards(parsed, html); return; }
          }
          if (item.types.includes('text/markdown')) {
            const blob = await item.getType('text/markdown');
            const md = await blob.text();
            const parsed = parseMarkdownTable(md);
            if (parsed && parsed.length>0) { applyParsedCards(parsed, md); return; }
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
    if (fromMd && fromMd.length>0) { applyParsedCards(fromMd, text); return; }

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

// --- A listening deck's text: the prose above a pasted table ---
// Mirrors PassageParser (iOS): only the part before a Markdown table's first
// `|` line or an HTML <table>; with headings (`## Text`, <h2>, a line that is
// only bold) the longest section between them, else everything less a short
// opening line ending in ":". Emphasis and rules dropped, paragraphs kept.
// Fewer than 8 words is no text, so a stray line above a word list doesn't
// make a listening deck.
const PassageMinimumWords = 8;

function passageIn(source) {
  const none = { passage: '', title: '' };
  if (!source) return none;
  let prose;
  const table = source.search(/<table/i);
  if (table >= 0) prose = plainTextFromHtml(source.slice(0, table));
  else if (/<tr/i.test(source)) return none;
  else prose = beforeMarkdownTable(source);
  const passage = cleanedPassage(passageSection(prose));
  if (wordCount(passage) < PassageMinimumWords) return none;
  return { passage, title: passageTitle(prose) };
}

function beforeMarkdownTable(text) {
  const lines = text.split(/\r?\n/);
  const first = lines.findIndex(l => { const t = l.trim(); return t.length > 1 && t.startsWith('|') && t.endsWith('|'); });
  return first < 0 ? '' : lines.slice(0, first).join('\n');
}

function wordCount(s) { return (s || '').split(/\s+/).filter(Boolean).length; }

function isPassageHeading(line) {
  const t = line.trim();
  if (!t) return false;
  if (t.startsWith('#')) return true;
  for (const mark of ['**', '__']) {
    if (t.startsWith(mark) && t.endsWith(mark) && t.length > 4) return !t.slice(2, -2).includes(mark);
  }
  return t.endsWith(':') && wordCount(t) <= 4;
}

function passageSection(prose) {
  const lines = prose.split(/\r?\n/);
  const sections = [[]];
  let sawHeading = false;
  for (const line of lines) {
    if (isPassageHeading(line)) { sawHeading = true; sections.push([]); }
    else sections[sections.length - 1].push(line);
  }
  if (sawHeading) {
    let best = sections[0];
    for (const s of sections) if (wordCount(s.join(' ')) > wordCount(best.join(' '))) best = s;
    return best.join('\n');
  }
  const start = lines.findIndex(l => l.trim());
  let body = start < 0 ? [] : lines.slice(start);
  if (body.length && body[0].trim().endsWith(':') && body[0].trim().length <= 80) body = body.slice(1);
  return body.join('\n');
}

function cleanedPassage(text) {
  const paragraphs = []; let current = [];
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    if (/^[-*_=]*$/.test(line)) line = '';          // a rule
    if (line.startsWith('>')) line = line.slice(1).trim();
    line = line.split('**').join('').split('__').join('');
    if (!line) { if (current.length) { paragraphs.push(current.join('\n')); current = []; } }
    else current.push(line);
  }
  if (current.length) paragraphs.push(current.join('\n'));
  return paragraphs.join('\n\n');
}

// A title the AI gave the text: the first heading, when the text isn't right
// under it ("# Lucía en Sevilla" over "## Text").
function passageTitle(prose) {
  const lines = prose.split(/\r?\n/);
  // "Here is your exercise:" above it all only announces what follows.
  const start = lines.findIndex(l => l.trim());
  if (start >= 0 && !lines[start].trim().startsWith('#') && lines[start].trim().endsWith(':')) lines[start] = '';
  const first = lines.findIndex(isPassageHeading);
  if (first < 0) return '';
  const after = lines.slice(first + 1);
  const end = after.findIndex(isPassageHeading);
  const section = end < 0 ? after : after.slice(0, end);
  if (wordCount(section.join(' ')) >= PassageMinimumWords) return '';
  return cleanedPassage(lines[first]).replace(/^[#:*_\s]+|[#:*_\s]+$/g, '');
}

// Block tags to line breaks (headings kept as `#` lines), other tags out,
// entities decoded.
function plainTextFromHtml(html) {
  let s = html
    .replace(/<h[1-6][^>]*>/gi, '\n# ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
    .replace(/<(head|style|script)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '');
  const decoder = document.createElement('textarea');
  decoder.innerHTML = s;
  return decoder.value;
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

// Due date type: a row of buttons — tap one to pick it, tap it again for none
DueKinds.forEach(kind => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'due-kind';
  b.dataset.kind = kind;
  b.textContent = T.dueKinds[kind];
  b.addEventListener('click', () => {
    deck.dueKind = deck.dueKind === kind ? '' : kind;
    renderDueKinds();
    generateQRCodes();
  });
  document.getElementById('dueKinds').append(b);
});
function renderDueKinds() {
  document.querySelectorAll('.due-kind').forEach(b => b.setAttribute('aria-pressed', b.dataset.kind === deck.dueKind));
}

// Listening text: a switch, then the text and the language it's read in
document.getElementById('useListening').addEventListener('change', (e) => {
  deck.listening = e.target.checked;
  document.getElementById('listeningField').hidden = !deck.listening;
  generateQRCodes();
});
document.getElementById('passage').addEventListener('input', (e) => { deck.passage = e.target.value; generateQRCodes(); });
document.getElementById('passageLanguage').addEventListener('change', (e) => { deck.passageLanguage = e.target.value; generateQRCodes(); });

// Subject: name, emoji and colour. The emoji and colour pickers show once
// there's a name, since the QR code only carries them with one.
function firstGrapheme(s) {
  s = (s || '').trim();
  if (!s) return '';
  if (window.Intl && Intl.Segmenter) return new Intl.Segmenter().segment(s)[Symbol.iterator]().next().value.segment;
  return Array.from(s)[0];
}
function setSubject(changes) {
  Object.assign(deck.subject, changes);
  renderSubject();
  generateQRCodes();
}
SubjectEmojis.forEach(emoji => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'emoji-tile';
  b.dataset.emoji = emoji;
  b.textContent = emoji;
  b.addEventListener('click', () => setSubject({ emoji }));
  document.getElementById('emojiGrid').append(b);
});
// The last tile takes any other emoji, or a letter, from the keyboard
const emojiCustom = document.createElement('input');
emojiCustom.type = 'text';
emojiCustom.className = 'emoji-tile';
emojiCustom.id = 'emojiCustom';
emojiCustom.placeholder = ' ';  // keeps :placeholder-shown, which draws the keyboard icon
emojiCustom.autocomplete = 'off';
emojiCustom.setAttribute('aria-label', T.customEmoji);
emojiCustom.title = T.customEmoji;
emojiCustom.addEventListener('focus', () => emojiCustom.select());
emojiCustom.addEventListener('input', () => {
  const emoji = firstGrapheme(emojiCustom.value);
  emojiCustom.value = emoji;
  setSubject({ emoji });
});
document.getElementById('emojiGrid').append(emojiCustom);
SubjectColors.forEach((color, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'color-dot';
  b.dataset.color = color;
  b.style.setProperty('--dot', color);
  b.setAttribute('aria-label', T.colorNames[i]);
  b.title = T.colorNames[i];
  b.addEventListener('click', () => setSubject({ color }));
  document.getElementById('colorDots').append(b);
});
document.getElementById('subjectTitle').addEventListener('input', (e) => setSubject({ title: e.target.value }));

function renderSubject() {
  const s = deck.subject;
  const badge = document.getElementById('subjectBadge');
  badge.textContent = s.emoji || '🙂';
  badge.classList.toggle('subject-badge--empty', !s.emoji);
  badge.style.setProperty('--subject', s.color);
  document.getElementById('subjectStyle').hidden = !s.title.trim();
  const custom = !!s.emoji && !SubjectEmojis.includes(s.emoji);
  document.querySelectorAll('#emojiGrid button').forEach(b => {
    b.classList.toggle('is-selected', b.dataset.emoji === s.emoji);
    b.setAttribute('aria-pressed', b.dataset.emoji === s.emoji);
  });
  emojiCustom.classList.toggle('is-selected', custom);
  if (document.activeElement !== emojiCustom) emojiCustom.value = custom ? s.emoji : '';
  document.querySelectorAll('.color-dot').forEach(b => b.setAttribute('aria-pressed', b.dataset.color === s.color));
}
document.getElementById('addCardBtn').addEventListener('click', () => { addCard(); });
document.querySelectorAll('.btn--ai').forEach(btn => {
  btn.addEventListener('click', () => { pasteMsgId = btn.dataset.msg; readHtmlClipboard(); });
});

// Links to the AI prompts land with one open: the flashcard prompt, unless
// one is open already. The prompts share a name, so only one is open at a time.
document.querySelectorAll('a[href="#prompts"]').forEach(link => {
  link.addEventListener('click', () => {
    if (!document.querySelector('#prompts details[open]')) document.querySelector('#prompts details').open = true;
  });
});

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
  renderDueKinds();
  document.getElementById('useListening').checked = deck.listening;
  document.getElementById('listeningField').hidden = !deck.listening;
  document.getElementById('passage').value = deck.passage || '';
  document.getElementById('passageLanguage').value = deck.passageLanguage || '';
  document.getElementById('subjectTitle').value = deck.subject.title;
  renderSubject();
  renderCards();
}

// initialize UI
(function init(){
  syncForm();
  generateQRCodes();
})();
