// "Try it": the app's three ways of studying, in the page. Flashcard (flip,
// then swipe or press Mark as known / Keep to repeat), Quiz (pick the capital
// of Sweden) and Game (three questions against made-up players in the same
// room, with a countdown, who-picked-what tags and a scoreboard). Mirrors the
// iOS empty screen; nothing is saved and nothing leaves the page.
(() => {
  const root = document.getElementById('try');
  if (!root) return;

  const sv = document.documentElement.lang.startsWith('sv');
  const S = sv ? {
    tabs: ['Flashkort', 'Quiz', 'Spel'],
    tablist: 'Prova ett kort',
    tryIt: 'Prova',
    cards: [['Största planeten?', 'Jupiter'], ['Kemiska tecknet för guld?', 'Au'], ['Hur många ben har en spindel?', '8']],
    flip: 'Vänd', known: 'Kan det', repeat: 'Igen',
    knownLabel: 'Markera som kan', repeatLabel: 'Spara för repetition',
    capHint: 'Tryck för att vända. Svep åt höger om du kunde det, åt vänster för att se det igen.',
    capKnown: 'Kan det — det kommer tillbaka om några dagar, sedan allt mer sällan.',
    capRepeat: 'Det kommer tillbaka senare i dag, tills du kan det.',
    quizQ: 'Vad är Sveriges huvudstad?',
    quizOptions: ['Stockholm', 'Göteborg', 'Oslo', 'Köpenhamn'],
    correct: 'Rätt!', wrong: 'Fel', tryAgain: 'Försök igen',
    gamePromo: 'En kortlek med bara quizkort kan spelas som ett spel med vänner i samma rum.',
    gameTitle: 'Quizspel', you: 'Du',
    question: (n, t) => `Fråga ${n} av ${t}`,
    getReady: 'Gör dig redo…',
    pick: 'Välj ett svar innan tiden tar slut.',
    answered: (n, t) => `${n} av ${t} har svarat`,
    points: (p) => `+${p} poäng`, noPoints: 'Inga poäng den här gången',
    inARow: (n) => `🔥 ${n} i rad`,
    results: 'Resultat',
    realGame: 'I ett riktigt spel är ni i samma rum, var och en på sin egen telefon — upp till 8 spelare.',
    playAgain: 'Spela igen',
    playingWith: (names) => `Spelar med ${names}`,
    questions: [
      ['Vad är Norges huvudstad?', ['Oslo', 'Bergen', 'Trondheim', 'Stavanger']],
      ['Hur många kontinenter finns det?', ['7', '5', '6', '8']],
      ['Vilken planet kallas den röda planeten?', ['Mars', 'Venus', 'Jupiter', 'Saturnus']],
    ],
    and: 'och',
  } : {
    tabs: ['Flashcard', 'Quiz', 'Game'],
    tablist: 'Try a card',
    tryIt: 'Try it',
    cards: [['Largest planet?', 'Jupiter'], ['Chemical symbol for gold?', 'Au'], ['How many legs does a spider have?', '8']],
    flip: 'Flip', known: 'Knew it', repeat: 'Again',
    knownLabel: 'Mark as known', repeatLabel: 'Keep to repeat',
    capHint: 'Tap to flip. Swipe right if you knew it, left to see it again.',
    capKnown: 'Known — it comes back in a few days, then less and less.',
    capRepeat: 'It comes back later today, until you know it.',
    quizQ: 'What is the capital of Sweden?',
    quizOptions: ['Stockholm', 'Gothenburg', 'Oslo', 'Copenhagen'],
    correct: 'Correct!', wrong: 'Wrong', tryAgain: 'Try again',
    gamePromo: 'A deck of only quiz cards can be played as a game with friends in the same room.',
    gameTitle: 'Quiz game', you: 'You',
    question: (n, t) => `Question ${n} of ${t}`,
    getReady: 'Get ready…',
    pick: 'Pick an answer before the time runs out.',
    answered: (n, t) => `${n} of ${t} answered`,
    points: (p) => `+${p} points`, noPoints: 'No points this time',
    inARow: (n) => `🔥 ${n} in a row`,
    results: 'Results',
    realGame: "In a real game you're all in the same room, each on your own phone — up to 8 players.",
    playAgain: 'Play again',
    playingWith: (names) => `Playing with ${names}`,
    questions: [
      ['What is the capital of Norway?', ['Oslo', 'Bergen', 'Trondheim', 'Stavanger']],
      ['How many continents are there?', ['7', '5', '6', '8']],
      ['Which planet is known as the red planet?', ['Mars', 'Venus', 'Jupiter', 'Saturn']],
    ],
    and: 'and',
  };

  // The app's game rules and player colours.
  const CORRECT_POINTS = 100, STREAK_BONUS = 50, STREAK_FOR_BONUS = 3;
  const PLAYER_COLORS = ['#007AFF', '#D9730D', '#AF52DE', '#E0245E', '#1F8A9E', '#5856D6', '#A2845E', '#6E6E73'];
  const NAMES = ['Alva', 'Elias', 'Maja', 'Noah', 'Saga', 'Liam', 'Ella', 'Hugo', 'Ebba', 'Leo', 'Wilma', 'Oscar'];
  const GAME_ICON = '<svg class="try-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9h4M8 7v4M15 10h.01M18 8h.01"/><path d="M7.5 5h9A4.5 4.5 0 0 1 21 9.5v4.3a2.7 2.7 0 0 1-4.9 1.6L15 14H9l-1.1 1.4A2.7 2.7 0 0 1 3 13.8V9.5A4.5 4.5 0 0 1 7.5 5z"/></svg>';

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const listJoin = (names) => names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${S.and} ${names[names.length - 1]}`;
  const badge = (name, color) => `<span class="try-badge" style="--c:${color}">${esc(name)}</span>`;

  // ---------- shell: tabs + stage ----------
  root.innerHTML = `
    <div class="try-tabs" role="tablist" aria-label="${esc(S.tablist)}">
      ${S.tabs.map((t, i) => `<button type="button" role="tab" data-tab="${i}" aria-selected="${i === 0}">${esc(t)}</button>`).join('')}
    </div>
    <div class="try-stage" role="tabpanel"></div>`;
  const stage = root.querySelector('.try-stage');
  const tabs = [...root.querySelectorAll('[role=tab]')];
  let stop = () => {};
  function show(i) {
    stop(); stop = () => {};
    tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
    [flashcard, quiz, game][i]();
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => show(i)));

  // ---------- flashcard ----------
  function flashcard() {
    let index = 0, showsAnswer = false, busy = false;
    stage.innerHTML = `
      <div class="try-card try-card--flip" tabindex="0" role="button">
        <div class="try-card-title">${esc(S.tryIt)}</div>
        <div class="try-card-text"></div>
        <div class="try-wash" aria-hidden="true"><span class="try-wash-label"></span></div>
      </div>
      <div class="try-actions">
        <button type="button" class="try-act try-act--repeat" aria-label="${esc(S.repeatLabel)}">↩ ${esc(S.repeat)}</button>
        <button type="button" class="try-act try-act--flip">${esc(S.flip)}</button>
        <button type="button" class="try-act try-act--known" aria-label="${esc(S.knownLabel)}">✓ ${esc(S.known)}</button>
      </div>
      <p class="try-caption" aria-live="polite">${esc(S.capHint)}</p>`;
    const card = stage.querySelector('.try-card');
    const text = card.querySelector('.try-card-text');
    const wash = card.querySelector('.try-wash');
    const washLabel = card.querySelector('.try-wash-label');
    const caption = stage.querySelector('.try-caption');
    const render = () => {
      const [q, a] = S.cards[index % S.cards.length];
      text.textContent = showsAnswer ? a : q;
      card.setAttribute('aria-label', `${text.textContent}. ${S.flip}`);
    };
    render();

    function flip() {
      if (busy) return;
      busy = true;
      card.classList.add('is-flipping');
      setTimeout(() => {
        showsAnswer = !showsAnswer; render();
        card.classList.remove('is-flipping');
        busy = false;
      }, 140);
    }
    function setDrag(dx) {
      card.style.transform = dx ? `translateX(${dx}px) rotate(${dx / 25}deg)` : '';
      const known = dx >= 0;
      wash.style.opacity = Math.min(Math.abs(dx) / 90, 1);
      wash.className = `try-wash ${known ? 'is-known' : 'is-repeat'}`;
      washLabel.textContent = known ? `✓ ${S.knownLabel}` : `↩ ${S.repeatLabel}`;
    }
    function grade(known) {
      if (busy) return;
      busy = true;
      card.classList.add('is-leaving');
      setDrag(known ? 520 : -520);
      setTimeout(() => {
        card.classList.remove('is-leaving');
        card.classList.add('is-entering');
        setDrag(0);
        index++; showsAnswer = false; render();
        caption.textContent = known ? S.capKnown : S.capRepeat;
        caption.className = `try-caption ${known ? 'is-known' : 'is-repeat'}`;
        // Back in a moment later, so it fades in rather than jumping.
        setTimeout(() => card.classList.remove('is-entering'), 30);
        busy = false;
      }, 230);
    }

    // A sideways drag grades; a tap flips. touch-action: pan-y leaves vertical
    // swipes to the page, so it still scrolls.
    let startX = null, dx = 0, moved = false;
    card.addEventListener('pointerdown', (e) => {
      if (busy) return;
      startX = e.clientX; dx = 0; moved = false;
      card.setPointerCapture(e.pointerId);
      card.classList.add('is-dragging');
    });
    card.addEventListener('pointermove', (e) => {
      if (startX === null) return;
      dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      if (moved) setDrag(dx);
    });
    const end = () => {
      if (startX === null) return;
      startX = null;
      card.classList.remove('is-dragging');
      if (!moved) { flip(); return; }
      if (dx > 90) grade(true);
      else if (dx < -90) grade(false);
      else setDrag(0);
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', () => { startX = null; card.classList.remove('is-dragging'); setDrag(0); });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
      if (e.key === 'ArrowRight') grade(true);
      if (e.key === 'ArrowLeft') grade(false);
    });
    stage.querySelector('.try-act--flip').addEventListener('click', flip);
    stage.querySelector('.try-act--known').addEventListener('click', () => grade(true));
    stage.querySelector('.try-act--repeat').addEventListener('click', () => grade(false));
  }

  // ---------- quiz card (shared by Quiz and Game) ----------
  // Draws one multiple-choice card into `el`: options, the selection, and the
  // graded result with who-picked-what tags.
  function quizCard(el, { title, question, options, answer, pick = null, selection = null, revealed = false, tags = {}, onPick = null, hideOptions = false }) {
    const graded = revealed || pick !== null;
    const right = pick === answer;
    const state = graded ? (pick === null ? 'is-missed' : right ? 'is-right' : 'is-wrong') : '';
    el.className = `try-card try-card--quiz ${state}`;
    el.innerHTML = `
      ${graded ? `<div class="try-pill">${pick !== null && right ? '✓ ' + esc(S.correct) : '✕ ' + esc(S.wrong)}</div>` : `<div class="try-card-title">${esc(title)}</div>`}
      <div class="try-quiz-q">${esc(question)}</div>
      <div class="try-options"${hideOptions ? ' hidden' : ''}>
        ${options.map((o) => {
          let cls = 'try-option';
          if (graded && o === answer) cls += ' is-answer';
          else if (graded && o === pick) cls += ' is-picked-wrong';
          else if (graded) cls += ' is-dim';
          else if (o === selection) cls += ' is-selected';
          const t = (tags[o] || []).map((p) => badge(p.name, p.color)).join('');
          return `<button type="button" class="${cls}" data-o="${esc(o)}"${graded || !onPick ? ' disabled' : ''}>
            <span>${esc(o)}</span>${graded && o === answer ? '<b aria-hidden="true">✓</b>' : graded && o === pick ? '<b aria-hidden="true">✕</b>' : ''}
            ${t ? `<span class="try-tags">${t}</span>` : ''}
          </button>`;
        }).join('')}
      </div>`;
    if (onPick && !graded) el.querySelectorAll('.try-option').forEach((b) => b.addEventListener('click', () => onPick(b.dataset.o)));
  }

  // ---------- quiz ----------
  function quiz() {
    let options = shuffle(S.quizOptions), pick = null;
    stage.innerHTML = `
      <div class="try-card"></div>
      <p class="try-caption">${GAME_ICON} ${esc(S.gamePromo)}</p>
      <div class="try-again-row"><button type="button" class="try-link" hidden>${esc(S.tryAgain)}</button></div>`;
    const el = stage.querySelector('.try-card');
    const again = stage.querySelector('.try-link');
    const render = () => {
      quizCard(el, { title: S.tryIt, question: S.quizQ, options, answer: S.quizOptions[0], pick, onPick: (o) => { pick = o; render(); } });
      again.hidden = pick === null;
    };
    again.addEventListener('click', () => { pick = null; options = shuffle(S.quizOptions); render(); });
    render();
  }

  // ---------- game ----------
  function game() {
    const READ = 1500, ANSWER = 10, REVEAL = 3000;
    let alive = true;
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); };
    stop = () => { alive = false; timers.forEach(clearTimeout); clearInterval(tick); };
    let tick = null;

    function round() {
      const questions = S.questions.map(([q, opts]) => ({ q, options: shuffle(opts), answer: opts[0] }));
      const players = [{ id: 0, name: S.you, me: true }]
        .concat(shuffle(NAMES).slice(0, 3).map((name, i) => ({ id: i + 1, name })))
        .map((p) => ({ ...p, color: PLAYER_COLORS[p.id], score: 0, streak: 0 }));

      stage.innerHTML = `
        <div class="try-players" aria-label="${esc(S.playingWith(listJoin(players.slice(1).map((p) => p.name))))}">
          ${players.map((p) => badge(p.name, p.color)).join('')}
        </div>
        <div class="try-game"></div>`;
      const box = stage.querySelector('.try-game');
      let qi = 0;

      function ask() {
        const Q = questions[qi];
        const picks = {};
        box.innerHTML = `
          <div class="try-top"><b>${esc(S.question(qi + 1, questions.length))}</b><span class="try-secs"></span></div>
          <div class="try-bar"><i></i></div>
          <div class="try-card"></div>
          <p class="try-caption" aria-live="polite">${esc(S.getReady)}</p>`;
        const el = box.querySelector('.try-card');
        const caption = box.querySelector('.try-caption');
        const secs = box.querySelector('.try-secs');
        const bar = box.querySelector('.try-bar i');
        const draw = (revealed = false) => {
          const tags = {};
          if (revealed) players.forEach((p) => { if (picks[p.id]) (tags[picks[p.id]] ||= []).push(p); });
          quizCard(el, {
            title: S.gameTitle, question: Q.q, options: Q.options, answer: Q.answer,
            pick: revealed ? (picks[0] ?? null) : null, revealed, selection: picks[0] ?? null, tags,
            hideOptions: phase === 'reading',
            onPick: phase === 'answering' && !picks[0] ? (o) => { picks[0] = o; draw(); update(); } : null,
          });
        };
        let phase = 'reading';
        draw();

        let deadline = 0;
        const update = () => {
          const n = Object.keys(picks).length;
          caption.textContent = picks[0] ? S.answered(n, players.length) : S.pick;
          if (n === players.length) reveal();
        };

        later(() => {
          phase = 'answering';
          deadline = Date.now() + ANSWER * 1000;
          draw(); update();
          bar.parentElement.classList.add('is-running');
          tick = setInterval(() => {
            const left = Math.max(0, deadline - Date.now());
            secs.textContent = Math.ceil(left / 1000);
            bar.style.transform = `scaleX(${left / (ANSWER * 1000)})`;
            if (left === 0) reveal();
          }, 100);
          // The others answer at random moments, right about two times in three.
          players.slice(1).forEach((p) => {
            const right = Math.random() < 0.65;
            const pickOpt = right ? Q.answer : shuffle(Q.options.filter((o) => o !== Q.answer))[0];
            later(() => { if (phase === 'answering') { picks[p.id] = pickOpt; update(); } }, 1500 + Math.random() * 5500);
          });
        }, READ);

        function reveal() {
          if (phase !== 'answering') return;
          phase = 'reveal';
          clearInterval(tick);
          secs.textContent = '';
          bar.style.transform = '';
          bar.parentElement.classList.remove('is-running');
          bar.parentElement.classList.add('is-done');
          players.forEach((p) => {
            const right = picks[p.id] === Q.answer;
            p.streak = right ? p.streak + 1 : 0;
            if (right) p.score += CORRECT_POINTS + (p.streak >= STREAK_FOR_BONUS ? STREAK_BONUS : 0);
          });
          draw(true);
          const me = players[0];
          const right = picks[0] === Q.answer;
          const pts = CORRECT_POINTS + (me.streak >= STREAK_FOR_BONUS ? STREAK_BONUS : 0);
          caption.innerHTML = right
            ? `<span class="try-gain">${esc(S.points(pts))}</span>${me.streak >= STREAK_FOR_BONUS ? ` <span class="try-fire">${esc(S.inARow(me.streak))}</span>` : ''}`
            : esc(S.noPoints);
          caption.className = 'try-caption try-caption--result';
          later(() => { qi++; qi < questions.length ? ask() : results(); }, REVEAL);
        }
      }

      function results() {
        const sorted = players.slice().sort((a, b) => b.score - a.score || a.id - b.id);
        box.innerHTML = `
          <div class="try-results">
            <h3>${esc(S.results)}</h3>
            <ol>
              ${sorted.map((p) => {
                const place = 1 + players.filter((o) => o.score > p.score).length;
                return `<li class="${p.me ? 'is-me' : ''}" style="--c:${p.color}">
                  <span class="try-place">${place}.</span>${badge(p.name, p.color)}${place === 1 ? '<span aria-hidden="true">🏆</span>' : ''}
                  <span class="try-score">${p.score}</span></li>`;
              }).join('')}
            </ol>
            <p class="try-caption">${esc(S.realGame)}</p>
            <button type="button" class="btn try-again">${esc(S.playAgain)}</button>
          </div>`;
        box.querySelector('.try-again').addEventListener('click', round);
      }
      ask();
    }
    round();
  }

  flashcard();
})();
