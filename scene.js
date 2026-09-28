/* ===========================================================
   scene.js — 방 화면 (그리기 · 사물 클릭 · 이동)
=========================================================== */

const currentRoom = () => ROOMS[state.currentRoom];
const valueOf = v => typeof v === 'function' ? v(state) : v;
const visibleHotspots = room => room.hotspots.filter(h => !h.showIf || h.showIf(state));
const findHotspot = id => visibleHotspots(currentRoom()).find(h => h.id === id);

/* ---------- 그리기 ---------- */
function render(){
  const room = currentRoom();
  el('roomTitle').textContent = room.name;
  el('roomDesc').textContent = valueOf(room.desc);

  const shapes = visibleHotspots(room).map(h =>
    `<polygon points="${h.points.map(p => p.join(',')).join(' ')}" data-id="${h.id}"><title>${h.label}</title></polygon>`
  ).join('');
  el('sceneArt').innerHTML = `<div class="image-scene">
      <img src="${valueOf(room.background)}" alt="${room.name}" onload="fitHitboxLayer(this)">
      <svg class="hitbox-layer" viewBox="0 0 100 100" preserveAspectRatio="none">${shapes}</svg>
      <div class="flicker-overlay"></div>
    </div>`;

  renderNavButtons(room);
  fitFrameWidth();
}

/* 이미지가 실제로 보이는 영역(레터박스 제외)에 클릭 레이어를 딱 맞춤 */
function fitHitboxLayer(img){
  const box = img.parentElement, layer = box.querySelector('.hitbox-layer');
  const cw = box.clientWidth, ch = box.clientHeight, nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh || !cw || !ch) return;
  const scale = Math.min(cw / nw, ch / nh);
  Object.assign(layer.style, {
    left: (cw - nw * scale) / 2 + 'px', top: (ch - nh * scale) / 2 + 'px',
    width: nw * scale + 'px', height: nh * scale + 'px'
  });
}

/* 화면 높이에서 상단바·캡션·소지품바를 뺀 높이 × 16:9로 프레임 폭을 맞춰 좌우 여백을 최소화 */
function fitFrameWidth(){
  const chrome = ['topbar', 'captionBar', 'invbar'].reduce((sum, id) => sum + el(id).offsetHeight, 0);
  const ideal = (window.innerHeight - chrome) * 16 / 9;
  el('frame').style.width = Math.min(window.innerWidth, Math.max(ideal, 0)) + 'px';
  document.querySelectorAll('.image-scene img').forEach(img => { if (img.complete) fitHitboxLayer(img); });
}
window.addEventListener('resize', fitFrameWidth);

/* ---------- 이동 ---------- */
function goRoom(roomId){
  playSfx(SOUND.walk);
  const art = el('sceneArt');
  art.classList.add('fade-out');
  setTimeout(() => {
    state.currentRoom = roomId;
    el('navOverlay').classList.remove('show');
    render();
    requestAnimationFrame(() => art.classList.remove('fade-out'));   // 다음 프레임에 페이드인
    if (roomId === 'elevatorInside' && !state.finished) return finishGame();
    lineOnce('roomIntro_' + roomId, currentRoom().introLines);
  }, 500);
}

function renderNavButtons(room){
  const nav = el('navOverlay');
  nav.innerHTML = '';
  room.connections.forEach(c => {
    const locked = !DEBUG_FREE_ROAM && c.lockId && !state.unlocked[c.lockId];
    const btn = document.createElement('button');
    btn.className = 'nav-btn' + (locked ? ' locked' : '');
    btn.textContent = (locked ? '🔒 ' : '→ ') + c.label;
    btn.onclick = e => {
      if (isBlocking()) return;
      if (!locked) return goRoom(c.dest);
      const key = 'doorIntro_' + c.lockId;
      if (c.introLine && !state.seen[key]){
        state.seen[key] = true;
        e.stopPropagation();   // 이 클릭이 방금 연 대화를 바로 넘기지 않도록
        showImagePopup(c.introImage);
        showDialogue(c.introLine, () => { hideImagePopup(); openLock(c.lockId, c.dest); });
      } else {
        openLock(c.lockId, c.dest);
      }
    };
    nav.appendChild(btn);
  });
}
el('moveToggleBtn').addEventListener('click', () => {
  if (!isBlocking()) el('navOverlay').classList.toggle('show');
});

/* ---------- 사물 클릭 ---------- */
el('sceneArt').addEventListener('click', e => {
  if (isBlocking()) return;
  const target = e.target.closest('[data-id]');
  if (!target) return;
  e.stopPropagation();   // 이 클릭이 방금 연 대화를 바로 넘기지 않도록
  const hs = findHotspot(target.dataset.id);
  if (state.cameraMode && !hs.requiresCamera){   // 휴대폰 커서일 땐 원래 반응 대신 안내 대사 + 원래 커서로
    setCameraMode(false);
    return showDialogue(QR_SCAN.wrongTargetLine);
  }
  if (hs.kind === 'flavor') return clickFlavor(hs);
  if (hs.kind === 'move') return goRoom(hs.dest);
  if (DEBUG_FREE_ROAM){ if (hs.kind === 'lock' && hs.dest) goRoom(hs.dest); return; }
  if (hs.kind === 'puzzle') clickPuzzle(hs);
  if (hs.kind === 'lock') clickLock(hs);
});

/* 대사를 처음 한 번만 보여준 뒤 next 실행 (두 번째부터는 바로 next) */
function lineOnce(key, line, next = () => {}){
  if (!line || state.seen[key]) return next();
  state.seen[key] = true;
  showDialogue(line, next);
}

function clickFlavor(hs){
  playSfx(hs.sound);
  if (hs.requiresCamera){
    return state.cameraMode ? showDialogue(hs.cameraLine, openQRScan) : showDialogue(valueOf(hs.line));
  }
  const w = hs.withItem;
  if (w && (state[w.setState] || hasItem(w.requires))){
    if (!state[w.setState]){   // 처음 사용: 상태를 바로 바꿔서 배경도 즉시 바뀌게
      playSfx(w.sound);
      state[w.setState] = true;
      render();
    }
    return showDialogue(w.line);
  }
  if (hs.grantItem && !hasItem(hs.grantItem)){
    addInventory(hs.grantItem);
    return showDialogue(hs.lineFirst || valueOf(hs.line));
  }
  showDialogue(valueOf(hs.line));
}

function clickPuzzle(hs){
  const stage = state.solved[hs.id] && PUZZLES[hs.id].followUp ? 'followUp' : 'main';
  lineOnce(hs.id, hs.line, () => openPuzzle(hs.id, stage));
}

function clickLock(hs){
  lineOnce(hs.id, hs.line, () => openLock(hs.id, hs.dest));
}
