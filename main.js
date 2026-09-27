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
/* 상태를 처음으로 되돌리고(1회용 대사 기록 포함), 화면이 어두워졌다가 첫 연출부터 다시 시작 */
function restartGame(){
  Object.assign(state, initialState());
  setCameraMode(false);
  hideItemPopup();
  closeModal();
  el('navOverlay').classList.remove('show');
  renderInventory();
  render();
  el('wakeOverlay').classList.remove('hide');   // 다시 검은 화면으로
  setTimeout(wakeUp, 1200);
}

function finishGame(){
  state.finished = true;
  const s = elapsed();
  setTimeout(() => openModal(`<h3>학원을 탈출했다 🎉</h3>
    <p class="sub">총 소요 시간: ${Math.floor(s / 60)}분 ${s % 60}초</p>
    <button class="btn" onclick="restartGame()">다시 플레이</button>`), 500);
}

/* ---------- 시작 ----------
   검은 화면 위에 튜토리얼 → [확인]을 누르면 눈을 뜨듯 페이드인 + 첫 대사 */
const breakSentences = t => t.replace(/\.\s+(?!\()/g, '.<br>');   // 마침표로 끝난 문장 뒤에서 줄바꿈 (괄호 설명은 같은 줄)
function showTutorial(){
  el('tutorialBody').innerHTML = `<h3>${TUTORIAL.title}</h3>
    <ul class="tutorial-list">${TUTORIAL.lines.map(l =>
      `<li>${breakSentences(l.text)}${l.sub ? `<span class="tutorial-sub">${breakSentences(l.sub)}</span>` : ''}</li>`).join('')}</ul>
    <div class="right"><button class="btn" onclick="startGame()">확인</button></div>`;
}
function startGame(){
  el('tutorial').classList.add('hide');
  wakeUp();
}
/* 눈을 뜨듯 페이드인 + 첫 대사 (처음 시작 · 다시 플레이 공통) */
function wakeUp(){
  el('wakeOverlay').classList.add('hide');
  state.startTime = Date.now();   // 튜토리얼·암전 시간은 기록에서 제외
  setTimeout(() => showDialogue(OPENING_LINES), 400);
}

renderInventory();
render();
showTutorial();
