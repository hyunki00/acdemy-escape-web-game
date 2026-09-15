/* ===========================================================
   navigation.js — 이동 및 화면 렌더링
   사물 클릭 위임 처리, 방 이동, 현재 화면을 다시 그리는 render()를 담당합니다.
=========================================================== */

/* ---------- 씬 클릭 위임 ---------- */
function findHotspot(id){
  const room = ROOMS[state.currentRoom];
  return (room.hotspots || []).find(h => h.id === id);
}
document.getElementById('sceneArt').addEventListener('click', (e) => {
  const t = e.target.closest('[data-kind]');
  if (!t) return;
  const kind = t.dataset.kind, id = t.dataset.id, dest = t.dataset.dest;

  // 장식용 상호작용 대사는 퍼즐이 없어 누를 때마다 항상 표시, 자유 이동 모드와도 무관
  if (kind === 'flavor'){
    const hs = findHotspot(id);
    showDialogue(hs ? hs.line : '');
    return;
  }

  // 호출 버튼: 전원 꺼진 동안은 누를 때마다 대사만, 전원 켜지면 최초 1회 대사 후 퍼즐 오픈
  if (kind === 'callpanel'){
    const hs = findHotspot(id);
    if (!state.power){
      showDialogue(hs && hs.lineOff ? hs.lineOff : '전원이 꺼져 있어 반응이 없다.');
      return;
    }
    if (DEBUG_FREE_ROAM) return; // 전원이 켜졌어도 디버그 모드에서는 퍼즐 진입은 건너뜀
    if (hs && hs.line && !state.seenDialogue[id]){
      state.seenDialogue[id] = true;
      showDialogue(hs.line, () => openCallPanel());
    } else {
      openCallPanel();
    }
    return;
  }

  if (DEBUG_FREE_ROAM){
    if (kind === 'lock' && dest) goRoom(dest); // 잠긴 문이어도 목적지가 있으면 바로 이동
    return; // 퍼즐/차단기/호출패널 클릭은 전부 무시
  }
  if (kind === 'puzzle'){
    const hs = findHotspot(id);
    if (hs && hs.line && !state.seenDialogue[id]){
      state.seenDialogue[id] = true;
      showDialogue(hs.line, () => openPuzzle(id));
    } else {
      openPuzzle(id);
    }
  }
  else if (kind === 'lock') openLock(id, dest || undefined);
  else if (kind === 'breaker') openBreaker();
});

/* ---------- 방 이동 / 렌더링 ---------- */
function goRoom(roomId){
  state.currentRoom = roomId;
  document.getElementById('navOverlay').classList.remove('show');
  render();
  if (roomId === 'elevatorInside' && !state.finished) finishGame();
}

function render(){
  const room = ROOMS[state.currentRoom];
  document.getElementById('roomTitle').textContent = room.name;
  document.getElementById('roomDesc').textContent =
    typeof room.desc === 'function' ? room.desc(state) : room.desc;

  document.getElementById('sceneArt').innerHTML =
    room.background ? renderImageScene(room, state) : room.scene(state);

  const nav = document.getElementById('navOverlay');
  nav.innerHTML = '';
  room.connections.forEach(c => {
    const locked = !DEBUG_FREE_ROAM && c.lockId && !state.unlocked[c.lockId];
    const btn = document.createElement('button');
    btn.className = 'nav-btn' + (locked ? ' locked' : '');
    btn.textContent = (locked ? '🔒 ' : '→ ') + c.label;
    btn.onclick = () => { locked ? openLock(c.lockId, c.dest) : goRoom(c.dest); };
    nav.appendChild(btn);
  });

  fitFrameWidth();
}

/* ---------- 프레임 너비를 배경 이미지 비율에 맞춰 조정 ----------
   #frame이 화면 전체 높이(100vh)를 그대로 쓰면, 씬 영역(sceneWrap)의 가로세로
   비율이 배경 이미지(16:9)보다 훨씬 가로로 길어질 수 있어 좌우 레터박스가
   커집니다. 상단바·캡션·이동버튼·소지품바처럼 높이가 고정된 영역을 제외한
   "씬에 실제로 쓸 수 있는 높이"를 구한 뒤, 그 높이에 이미지 비율을 곱해
   프레임의 이상적인 너비를 계산하고, 화면 너비를 넘지 않는 선에서 적용합니다. */
function fitFrameWidth(){
  const frame = document.getElementById('frame');
  const chromeHeight = ['topbar', 'captionBar', 'moveToggleWrap', 'invbar']
    .reduce((sum, id) => {
      const el = document.getElementById(id);
      return sum + (el ? el.offsetHeight : 0);
    }, 0);
  const availableHeight = window.innerHeight - chromeHeight;
  const imageAspect = 1920 / 1080; // 배경 이미지(16:9) 비율
  const idealWidth = availableHeight * imageAspect;
  frame.style.width = Math.min(window.innerWidth, Math.max(idealWidth, 0)) + 'px';

  // 프레임 너비가 바뀌면 이미지 히트박스 레이어도 다시 맞춰줘야 함
  document.querySelectorAll('.image-scene img').forEach(img => {
    if (img.complete) fitHitboxLayer(img);
  });
}
window.addEventListener('resize', fitFrameWidth);

document.getElementById('moveToggleBtn').addEventListener('click', () => {
  document.getElementById('navOverlay').classList.toggle('show');
});
