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
  else if (kind === 'callpanel') openCallPanel();
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
}

document.getElementById('moveToggleBtn').addEventListener('click', () => {
  document.getElementById('navOverlay').classList.toggle('show');
});
