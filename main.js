/* ===========================================================
   main.js — 게임 진입점
   타이머, 설정, 초기화(재시작), 엔딩 처리 후 최초 render()를 호출합니다.
   반드시 다른 모든 스크립트보다 나중에 로드되어야 합니다.
=========================================================== */

/* ---------- 타이머 ---------- */
setInterval(() => {
  if (state.finished) return;
  const sec = Math.floor((Date.now() - state.startTime) / 1000);
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  document.getElementById('timer').textContent = `${m}:${s}`;
}, 1000);

/* ---------- 설정 모달 ---------- */
document.getElementById('settingsBtn').addEventListener('click', () => {
  openModal(`
    <h3>설정</h3>
    <p class="sub">프로토타입 단계 — 음원은 추후 연결 예정</p>
    <div style="display:flex; flex-direction:column; gap:10px;">
      <button class="btn secondary" disabled>🔈 음소거 (준비 중)</button>
      <button class="btn secondary" onclick="closeModal()">힌트는 각 퍼즐 창의 '힌트' 버튼을 확인하세요</button>
      <button class="btn" onclick="restartGame()">처음부터 다시 시작</button>
    </div>
  `);
});

/* ---------- 리셋 ---------- */
function restartGame(){
  state.currentRoom = 'classroom';
  state.inventory = [];
  state.solved = {};
  state.unlocked = {};
  state.power = false;
  state.startTime = Date.now();
  state.finished = false;
  document.getElementById('invItems').innerHTML = '';
  closeModal();
  render();
}

/* ---------- 엔딩 ---------- */
function finishGame(){
  state.finished = true;
  const sec = Math.floor((Date.now() - state.startTime) / 1000);
  const m = Math.floor(sec / 60), s = sec % 60;
  setTimeout(() => {
    openModal(`
      <h3>학원을 탈출했다 🎉</h3>
      <p class="sub">총 소요 시간: ${m}분 ${s}초</p>
      <button class="btn" onclick="restartGame()">다시 플레이</button>
    `);
  }, 500);
}

/* ---------- 시작 ---------- */
render();
