/* ===========================================================
   phone.js — 소지품으로 여는 화면 (쪽지 · 스마트폰 패턴 · 카메라 모드 · QR 스캔)
=========================================================== */

/* 아이템의 onClick 값 → 동작 */
const ITEM_ACTIONS = {
  note: id => openItemNote(ITEMS[id]),
  pattern: id => state.smartphoneUnlocked ? toggleCameraMode() : openPatternLock(ITEMS[id])
};

/* ---------- 쪽지 (읽기 전용) ---------- */
function openItemNote(item){
  openModal(`<h3>${item.name}</h3>
    <p class="sub note-text">${escapeHtml(item.noteText)}</p>`, 'modal-narrow');
}

/* ---------- 스마트폰 패턴 잠금 (점 1~9: 1 2 3 / 4 5 6 / 7 8 9) ---------- */
const pattern = { item: null, seq: [], last: null };

function openPatternLock(item){
  pattern.item = item;
  openModal(`<h3>${item.name}</h3>
    <p class="sub">${item.patternHint}</p>
    <div class="pattern-lock" id="patternLock">
      <svg id="patternSvg"></svg>
      ${[1,2,3,4,5,6,7,8,9].map(n => `<div class="pattern-dot" id="pdot${n}"></div>`).join('')}
    </div>
    <div class="center" style="margin:12px 0 4px;">
      <button class="btn secondary" onclick="setFeedback('patternFeedback', pattern.item.hintReveal, 'info')">[패턴을 까먹었어]</button>
    </div>
    <div id="patternFeedback" class="feedback center"></div>`, 'modal-narrow');

  const box = el('patternLock'), svg = el('patternSvg');
  const pos = e => { const r = box.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const dotCenter = n => {
    const b = box.getBoundingClientRect(), r = el('pdot' + n).getBoundingClientRect();
    return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
  };
  /* 직전 위치 → 현재 위치 선분 가까이(20px) 지나간 점을 지나간 순서대로 반환
     (마우스를 빠르게 그어도 중간 점을 놓치지 않도록) */
  const dotsOnSegment = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
    const hits = [];
    for (let n = 1; n <= 9; n++){
      if (pattern.seq.includes(n)) continue;
      const c = dotCenter(n);
      const t = len2 ? Math.max(0, Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / len2)) : 0;
      if (Math.hypot(c.x - (a.x + t * dx), c.y - (a.y + t * dy)) < 20) hits.push({ n, t });
    }
    return hits.sort((p, q) => p.t - q.t).map(h => h.n);
  };
  const addDot = n => {
    pattern.seq.push(n);
    el('pdot' + n).classList.add('active');
    if (pattern.seq.length < 2) return;
    const a = dotCenter(pattern.seq.at(-2)), b = dotCenter(n);
    svg.insertAdjacentHTML('beforeend', `<line class="pattern-line" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`);
  };

  box.onpointerdown = e => {
    box.setPointerCapture(e.pointerId);
    pattern.seq = [];
    svg.innerHTML = '';
    box.querySelectorAll('.pattern-dot').forEach(d => d.classList.remove('active'));
    setFeedback('patternFeedback', '');
    pattern.last = pos(e);
    dotsOnSegment(pattern.last, pattern.last).slice(0, 1).forEach(addDot);
  };
  box.onpointermove = e => {
    if (!pattern.last) return;
    const p = pos(e);
    dotsOnSegment(pattern.last, p).forEach(addDot);
    pattern.last = p;
  };
  box.onpointerup = box.onpointercancel = () => {
    if (!pattern.last) return;
    pattern.last = null;
    checkPattern();
  };
}
function checkPattern(){
  if (!pattern.seq.length) return;
  if (pattern.seq.join() === pattern.item.patternAnswer.join()){
    state.smartphoneUnlocked = true;
    renderInventory();   // 소지품 설명을 '잠금 해제' 버전으로
    setFeedback('patternFeedback', pattern.item.revealMsg, 'ok');
  } else {
    setFeedback('patternFeedback', '패턴이 일치하지 않는다.', 'bad');
  }
}

/* ---------- 카메라 모드 (커서가 폰 모양으로 바뀜, 우클릭으로도 끔) ---------- */
function setCameraMode(on){
  state.cameraMode = on;
  document.body.classList.toggle('camera-mode', on);
}
const toggleCameraMode = () => setCameraMode(!state.cameraMode);
document.addEventListener('contextmenu', e => {
  if (!state.cameraMode) return;
  e.preventDefault();
  setCameraMode(false);
});

/* ---------- QR 스캔 — 화면을 끌어서 사진 속 QR을 십자선에 맞추고 셔터 ---------- */
const qr = { left: 0, top: 0, aligned: false };

function openQRScan(){
  openModal(`<h3>카메라</h3>
    <p class="sub">화면을 드래그해서 QR 코드를 중앙 십자선에 맞춰보자.</p>
    <div class="phone-frame">
      <div class="phone-screen qr-screen" id="qrScreen">
        <img class="qr-scene" id="qrScene" src="${QR_SCAN.image}" alt="" draggable="false"
          style="width:${QR_SCAN.size}px; height:${QR_SCAN.size}px;">
        <div class="qr-crosshair"></div>
      </div>
      <div class="phone-bottom-bar"><button type="button" class="phone-shutter" onclick="takeQRPhoto()" aria-label="촬영"></button></div>
    </div>
    <div id="qrFeedback" class="feedback center"></div>`, 'modal-narrow');

  const screen = el('qrScreen');
  qr.aligned = false;
  placeQRScene(0, 0);   // 처음엔 사진 왼쪽 위 — QR은 화면 밖 아래쪽
  let drag = null;
  screen.onpointerdown = e => {
    screen.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, left: qr.left, top: qr.top };
  };
  screen.onpointermove = e => {
    if (!drag) return;
    placeQRScene(drag.left + e.clientX - drag.x, drag.top + e.clientY - drag.y);
  };
  screen.onpointerup = screen.onpointercancel = () => { drag = null; };
}

/* 사진 위치 이동 (사진이 항상 화면을 꽉 채우도록 제한) + 초점 판정 */
function placeQRScene(left, top){
  const screen = el('qrScreen'), w = screen.clientWidth, h = screen.clientHeight, size = QR_SCAN.size;
  qr.left = Math.min(0, Math.max(w - size, left));
  qr.top = Math.min(0, Math.max(h - size, top));
  Object.assign(el('qrScene').style, { left: qr.left + 'px', top: qr.top + 'px' });

  const qx = qr.left + QR_SCAN.center.x * size, qy = qr.top + QR_SCAN.center.y * size;
  qr.aligned = Math.hypot(w / 2 - qx, h / 2 - qy) < QR_SCAN.tolerance;
  setFeedback('qrFeedback', qr.aligned ? QR_SCAN.alignedMsg : '', qr.aligned ? 'ok' : '');
}

function takeQRPhoto(){
  playSfx(SOUND.shutter);
  if (!qr.aligned) return setFeedback('qrFeedback', QR_SCAN.missMsg, 'bad');
  closeModal();
  setCameraMode(false);
  if (!state.power) return showDialogue(QR_SCAN.noPowerLine);
  state.elevatorOpen = true;
  playSfx(QR_SCAN.openSound);
  render();
  showDialogue(QR_SCAN.successLine);
}
