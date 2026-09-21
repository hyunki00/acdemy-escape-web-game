/* ===========================================================
   main.js — 게임 진입점
   타이머, 설정, 초기화(재시작), 엔딩 처리 후 최초 render()를 호출합니다.
   반드시 다른 모든 스크립트보다 나중에 로드되어야 합니다.
=========================================================== */

/* ---------- 배경음악(BGM) ---------- */
const bgmAudio = document.getElementById('bgmAudio');
bgmAudio.volume = 0.5;
function tryPlayBgm(){
  const p = bgmAudio.play();
  if (p && p.catch){
    p.catch(() => {
      // 브라우저의 자동재생 차단 — 사용자가 처음 클릭/키 입력하는 순간 재생 시도
      const resume = () => { bgmAudio.play().catch(() => {}); document.removeEventListener('click', resume); document.removeEventListener('keydown', resume); };
      document.addEventListener('click', resume, { once: true });
      document.addEventListener('keydown', resume, { once: true });
    });
  }
}
tryPlayBgm();

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
    <p class="sub">배경음악을 켜고 끌 수 있어요</p>
    <div style="display:flex; flex-direction:column; gap:10px;">
      <button class="btn secondary" onclick="toggleMute(this)">${bgmAudio.muted ? '🔇 음소거 중 (클릭해서 켜기)' : '🔈 음소거'}</button>
      <button class="btn secondary" onclick="closeModal()">힌트는 각 퍼즐 창의 '힌트' 버튼을 확인하세요</button>
      <button class="btn" onclick="restartGame()">처음부터 다시 시작</button>
    </div>
  `);
});
function toggleMute(btn){
  bgmAudio.muted = !bgmAudio.muted;
  btn.textContent = bgmAudio.muted ? '🔇 음소거 중 (클릭해서 켜기)' : '🔈 음소거';
}

/* ---------- 리셋 ---------- */
function restartGame(){
  state.currentRoom = 'classroom';
  state.inventory = [];
  state.solved = {};
  state.unlocked = {};
  state.seenDialogue = {};
  state.power = false;
  state.startTime = Date.now();
  state.finished = false;
  renderInventorySlots();
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
renderInventorySlots();
render();
