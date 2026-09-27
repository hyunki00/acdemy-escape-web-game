/* ===========================================================
   main.js — 게임 시작 · 타이머 · 설정 · 재시작 · 엔딩
   반드시 가장 마지막에 로드되어야 합니다.
=========================================================== */

const elapsed = () => Math.floor((Date.now() - state.startTime) / 1000);
const percent = v => Math.round(v * 100) + '%';

/* ---------- 타이머 ---------- */
setInterval(() => {
  if (state.finished) return;
  const s = elapsed();
  el('timer').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}, 1000);

/* ---------- 설정 ---------- */
const muteLabel = () => muted ? '🔇 음소거 중 (클릭해서 켜기)' : '🔈 음소거';
const volumeRow = (key, label, value) => `<div>
    <div class="volume-label"><span>${label}</span><span id="${key}VolumeLabel">${percent(value)}</span></div>
    <input type="range" min="0" max="1" step="0.05" value="${value}" oninput="changeVolume('${key}', this.value)">
  </div>`;

el('settingsBtn').addEventListener('click', () => {
  if (isBlocking()) return;
  openModal(`<h3>설정</h3>
    <p class="sub">배경음악·효과음 볼륨을 각각 따로 조절할 수 있어요</p>
    <div class="settings-list">
      ${volumeRow('bgm', '🎵 배경음악', bgmVolume)}
      ${volumeRow('sfx', '🔊 효과음', sfxVolume)}
      <button class="btn secondary" onclick="setMuted(!muted); this.textContent = muteLabel()">${muteLabel()}</button>
      <button class="btn secondary" onclick="closeModal()">힌트는 각 퍼즐 창의 '힌트' 버튼을 확인하세요</button>
      <button class="btn" onclick="restartGame()">처음부터 다시 시작</button>
    </div>`);
});
function changeVolume(key, v){
  if (key === 'bgm') setBgmVolume(v); else setSfxVolume(v);
  el(key + 'VolumeLabel').textContent = percent(key === 'bgm' ? bgmVolume : sfxVolume);
}

/* ---------- 재시작 · 엔딩 ---------- */
function restartGame(){
  Object.assign(state, initialState());
  setCameraMode(false);
  renderInventory();
  closeModal();
  render();
}

function finishGame(){
  state.finished = true;
  const s = elapsed();
  setTimeout(() => openModal(`<h3>학원을 탈출했다 🎉</h3>
    <p class="sub">총 소요 시간: ${Math.floor(s / 60)}분 ${s % 60}초</p>
    <button class="btn" onclick="restartGame()">다시 플레이</button>`), 500);
}

/* ---------- 시작 ---------- */
renderInventory();
render();
setTimeout(() => el('wakeOverlay').classList.add('hide'), 400);   // 눈을 뜨는 페이드인
showDialogue(OPENING_LINES);
