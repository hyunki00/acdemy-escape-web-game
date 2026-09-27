/* ===========================================================
   puzzle.js — 퍼즐 창
   퍼즐 종류마다 PUZZLE_TYPES에 render(화면) · check(채점) · init(준비)가 있습니다.
   새 종류를 만들 땐 여기에 하나 추가하고 data.js에서 type으로 쓰면 됩니다.
=========================================================== */

const stageDef = (p, stage) => stage === 'followUp' ? p.followUp : p;
const normalize = s => String(s).trim().toLowerCase().replace(/\s+/g, '');
const confirmButton = (id, stage, extra = '') =>
  `<div class="right" ${extra}><button class="btn" onclick="submitPuzzle('${id}', '${stage}')">확인</button></div>`;
const hintButton = (id, stage) =>
  `<div class="right"><button class="btn secondary" onclick="showHint('${id}', '${stage}')">힌트</button></div>`;

const PUZZLE_TYPES = {
  /* 읽고 확인만 누르는 창 */
  info: {
    narrow: true,
    render: (def, id, stage, done) =>
      (def.prompt ? `<p class="info-prompt">${nl2br(def.prompt)}</p>` : '') + (done ? '' : confirmButton(id, stage))
  },

  /* 기사 목록을 보여주고 확인 */
  newsfeed: {
    render: (def, id, stage, done) => `<div class="news-feed">
      ${def.articles.map(a => `<div class="news-article">
        <div class="news-title">${a.title}</div><div class="news-body">${nl2br(a.body)}</div></div>`).join('')}
      ${done ? '' : confirmButton(id, stage, 'style="margin-top:12px;"')}</div>`
  },

  /* ID/PW 로그인 (ID는 미리 채워둠) */
  login: {
    render: (def, id, stage, done) => done ? '' : `<div class="login-form">
      <input type="text" id="loginId" value="${def.idAnswer}" placeholder="ID">
      <input type="password" id="loginPw" placeholder="PW">
      <div class="login-buttons">
        <button class="btn secondary" onclick="showHint('${id}', '${stage}')">힌트</button>
        <button class="btn" onclick="submitPuzzle('${id}', '${stage}')">로그인</button>
      </div></div>`,
    check: def => el('loginId').value === def.idAnswer && el('loginPw').value === def.pwAnswer
      ? '' : '아이디 또는 비밀번호가 올바르지 않습니다.'
  },

  /* 문장 속 빈칸 맞히기 (대소문자·공백 무시) */
  blank: {
    render: (def, id, stage, done) => {
      const code = nl2br(def.code).replace('{{blank}}', `<span class="blank-marker">${done ? def.answer : '?'}</span>`);
      return `<div class="code-box">${code}</div>` + (done ? '' : `<div class="answer-row">
          <input id="blankInput" type="text" placeholder="빈칸에 들어갈 답"
            onkeydown="if(event.key==='Enter') submitPuzzle('${id}', '${stage}')">
          <button class="btn" onclick="submitPuzzle('${id}', '${stage}')">확인</button>
        </div>` + hintButton(id, stage));
    },
    check: def => normalize(el('blankInput').value) === normalize(def.answer) ? '' : '다시 확인해보세요.'
  },

  /* 손수건으로 문질러서 숨은 글자 드러내기 — 충분히 닦으면 자동 완료 */
  hold: {
    render: (def, id, stage, done) => {
      const question = `<p class="hold-question">${nl2br(def.prompt)}</p>`;
      if (done) return question;
      if (!hasItem(def.requiresItem)) return question + `<p class="hold-missing-msg">${def.missingItemMsg}</p>`;
      return question + `<div class="hold-write-area">
          <div class="hold-answer-text">${def.revealText}</div>
          <canvas id="holdCanvas" class="hold-canvas"></canvas>
          <span class="hold-label" id="holdLabel">손수건으로 뽀득뽀득 문질러 닦아보자...</span>
        </div>` + hintButton(id, stage);
    },
    init: (def, id, stage) => initScratch(id, stage)
  },

  /* 차단기 Lights Out — 모든 배선이 켜지면 자동 완료 */
  breakerbox: {
    render: (def, id, stage, done) => done ? '' : breakerGridHtml(def),
    init: (def, id, stage) => initBreaker(def, id, stage)
  }
};

/* ---------- 창 열기 / 채점 / 완료 ---------- */
function openPuzzle(id, stage = 'main'){
  const p = PUZZLES[id], def = stageDef(p, stage), type = PUZZLE_TYPES[def.type];
  const done = !!state.solved[id];
  openModal(`
    <h3>${def.title}</h3>
    <p class="sub">${def.subtext || ''}</p>
    ${type.render(def, id, stage, done)}
    ${done ? '<p class="feedback ok">✓ 이미 확인했어요.</p>' : '<div id="puzzleFeedback" class="feedback"></div>'}
  `, type.narrow ? 'modal-narrow' : '');
  if (!done && type.init) type.init(def, id, stage);
}

function submitPuzzle(id, stage){
  const def = stageDef(PUZZLES[id], stage);
  const check = PUZZLE_TYPES[def.type].check;
  const wrong = check ? check(def) : '';
  if (wrong) return setFeedback('puzzleFeedback', wrong, 'bad');
  solveStage(id, stage);
}

function showHint(id, stage){
  setFeedback('puzzleFeedback', '힌트: ' + stageDef(PUZZLES[id], stage).hint, 'hint');
}

/* 한 단계를 맞혔을 때 — followUp이 있으면 2단계로, 없으면 완료 처리 */
function solveStage(id, stage){
  const p = PUZZLES[id];
  if (stage === 'main' && p.followUp){
    setFeedback('puzzleFeedback', p.stage1SuccessMsg || '✓ 정답!', 'ok');
    return setTimeout(() => openPuzzle(id, 'followUp'), 900);
  }
  state.solved[id] = true;
  if (p.setPower) state.power = true;
  render();
  if (p.grantItem) addInventory(p.grantItem);
  playSfx(p.completeSound);
  if (stageDef(p, stage).silentClose) return closeModal();
  setFeedback('puzzleFeedback', p.successMsg || '✓ 정답!', 'ok');
  setTimeout(closeModal, 900);
}

/* ---------- 스크래치 (hold) ----------
   글자는 캔버스 "아래" div에 있고, 캔버스는 덮개 역할만 함.
   문지르면 덮개가 지워지고, 지워진 면적이 SCRATCH_DONE(70%) 이상이면 완료 */
const SCRATCH_DONE = 0.7;
const SCRATCH_BRUSH = 32;
const scratch = { ctx: null, canvas: null, last: null, moves: 0, done: false, id: null, stage: null };

function initScratch(id, stage){
  const canvas = el('holdCanvas');
  if (!canvas) return;   // 손수건이 없어서 안내 문구만 보이는 경우
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext('2d');
  Object.assign(scratch, { ctx, canvas, last: null, moves: 0, done: false, id, stage });

  ctx.fillStyle = '#33363d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  Object.assign(ctx, { lineWidth: SCRATCH_BRUSH, lineCap: 'round', lineJoin: 'round', globalCompositeOperation: 'destination-out' });

  const pos = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.onpointerdown = e => {
    if (scratch.done) return;
    canvas.setPointerCapture(e.pointerId);   // 캔버스 밖으로 나가도 계속 문질러짐
    el('holdLabel').style.opacity = '0';
    scratch.last = pos(e);
    scratchLine(scratch.last, scratch.last);
  };
  canvas.onpointermove = e => {
    if (!scratch.last || scratch.done) return;
    const p = pos(e);
    scratchLine(scratch.last, p);
    scratch.last = p;
    if (++scratch.moves % 3 === 0) checkScratch();   // 픽셀 검사는 3번에 1번만
  };
  canvas.onpointerup = canvas.onpointercancel = () => { scratch.last = null; checkScratch(); };
}
function scratchLine([x1, y1], [x2, y2]){
  const ctx = scratch.ctx;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function checkScratch(){
  if (scratch.done) return;
  const { canvas, ctx } = scratch;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let cleared = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 40) cleared++;
  if (cleared / (canvas.width * canvas.height) < SCRATCH_DONE) return;
  scratch.done = true;
  ctx.fillRect(0, 0, canvas.width, canvas.height);   // 남은 덮개도 전부 걷어냄
  setTimeout(() => solveStage(scratch.id, scratch.stage), 550);
}

/* ---------- 차단기 (breakerbox) ----------
   차단기 번호 = 행*열수+열. 누르면 상하좌우 이웃과 잇는 배선이 토글됨 */
const breaker = { id: null, stage: null, cols: 0, rows: 0, broken: [], wires: {} };
const wireKey = (a, b) => Math.min(a, b) + '-' + Math.max(a, b);
function breakerNeighbors(i){
  const { cols, rows } = breaker, r = Math.floor(i / cols), c = i % cols;
  return [c > 0 && i - 1, c < cols - 1 && i + 1, r > 0 && i - cols, r < rows - 1 && i + cols]
    .filter(n => n !== false);
}

/* 차단기(56px)와 배선(26px)이 번갈아 놓인 격자 */
function breakerGridHtml(def){
  const cols = def.gridCols, rows = def.gridRows;
  const track = n => Array.from({ length: 2 * n - 1 }, (_, i) => i % 2 ? '26px' : '56px').join(' ');
  let html = `<div class="breaker-grid" style="grid-template-columns:${track(cols)}; grid-template-rows:${track(rows)};">`;
  for (let r = 0; r < 2 * rows - 1; r++){
    for (let c = 0; c < 2 * cols - 1; c++){
      const i = Math.floor(r / 2) * cols + Math.floor(c / 2);
      if (r % 2 === 0 && c % 2 === 0){
        html += def.brokenBreakers.includes(i)
          ? `<button type="button" class="breaker-btn broken" id="breaker${i}" disabled title="고장난 버튼">⏻</button>`
          : `<button type="button" class="breaker-btn" id="breaker${i}" onclick="pressBreaker(${i})">⏻</button>`;
      } else if (r % 2 === 0){
        html += `<div class="wire wire-h" id="wire-${wireKey(i, i + 1)}"></div>`;
      } else if (c % 2 === 0){
        html += `<div class="wire wire-v" id="wire-${wireKey(i, i + cols)}"></div>`;
      } else {
        html += '<div></div>';
      }
    }
  }
  return html + '</div>';
}

function initBreaker(def, id, stage){
  Object.assign(breaker, { id, stage, cols: def.gridCols, rows: def.gridRows, broken: def.brokenBreakers, wires: {} });
  for (let i = 0; i < def.gridCols * def.gridRows; i++){
    breakerNeighbors(i).forEach(n => { if (n > i) breaker.wires[wireKey(i, n)] = false; });
  }
}
function pressBreaker(i){
  if (breaker.broken.includes(i)) return;
  el('breaker' + i).classList.toggle('active');
  breakerNeighbors(i).forEach(n => {
    const key = wireKey(i, n);
    breaker.wires[key] = !breaker.wires[key];
    el('wire-' + key).classList.toggle('lit', breaker.wires[key]);
  });
  if (Object.values(breaker.wires).every(Boolean)) solveStage(breaker.id, breaker.stage);
}
