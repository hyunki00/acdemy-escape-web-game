/* ===========================================================
   ui.js — 공통 UI (모달 열고 닫기)
=========================================================== */

function escapeHtml(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- 모달 공통 ---------- */
const overlay = document.getElementById('overlay');
const modalBody = document.getElementById('modalBody');
function openModal(innerHTML, skinClass){
  modalBody.className = 'modal' + (skinClass ? ' ' + skinClass : '');
  modalBody.innerHTML = `<button class="modal-close" onclick="closeModal()">✕</button>` + innerHTML;
  overlay.classList.add('show');
}
function closeModal(){ overlay.classList.remove('show'); hideImagePopup(); }
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

/* ---------- 화면 중앙 이미지 팝업 (대사와 함께 잠깐 보여주는 작은 이미지) ---------- */
const imagePopup = document.getElementById('imagePopup');
const imagePopupImg = document.getElementById('imagePopupImg');
function showImagePopup(src){
  if (!src) return;
  imagePopupImg.src = src;
  imagePopup.classList.add('show');
}
function hideImagePopup(){ imagePopup.classList.remove('show'); }

/* ---------- 아이템 획득 팝업 — 화면 중앙에 크게 떴다가 잠시 후 자동으로 사라짐 ---------- */
const itemPopup = document.getElementById('itemPopup');
const itemPopupIcon = document.getElementById('itemPopupIcon');
const itemPopupName = document.getElementById('itemPopupName');
let _itemPopupTimer = null;
function showItemPopup(item){
  if (!item) return;
  itemPopupIcon.innerHTML = '';
  if (item.image){
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    itemPopupIcon.appendChild(img);
  } else {
    itemPopupIcon.textContent = item.icon || '';
  }
  itemPopupName.textContent = item.name || '';
  itemPopup.classList.add('show');
  if (_itemPopupTimer) clearTimeout(_itemPopupTimer);
  // 아이템 지급 직후 대사가 뒤이어 뜨는 경우(예: 처음 줍는 사물)가 많은데, 그 대사가
  // 다 끝날 때까지 팝업이 유지돼야 하므로 여기서 바로 타이머를 걸지 않고, 살짝(50ms) 대기한
  // 뒤에 실제로 대화가 떠 있는지 확인해서 분기한다.
  _itemPopupTimer = setTimeout(() => {
    if (!dialogueBar.classList.contains('show')){
      // 뒤이은 대화가 없으면(예: 퍼즐을 풀어서 바로 받는 경우) 기존처럼 일정 시간 후 자동으로 닫힘.
      // 대화가 있으면 advanceDialogue()가 대화를 완전히 닫을 때 함께 닫아준다.
      _itemPopupTimer = setTimeout(() => { itemPopup.classList.remove('show'); }, 1600);
    }
  }, 50);
}

/* 오브젝트 상호작용 효과음 공용 재생기 — hotspot.sound에 적힌 경로를 그때그때 넣어 재생 */
const sfxAudio = document.getElementById('sfxAudio');
function playSfx(src){
  if (!src || !sfxAudio) return;
  sfxAudio.src = src;
  if (typeof sfxVolumeFor === 'function') sfxAudio.volume = sfxVolumeFor(src);
  sfxAudio.currentTime = 0;
  const p = sfxAudio.play();
  if (p && p.catch) p.catch(() => {});
}

/* ---------- 상호작용 대사 ----------
   사물 클릭 → 하단에 대사 표시. 시간이 지나면 자동으로 넘어가는 게 아니라,
   화면(대화바)을 클릭해야 다음 줄로 넘어가거나(뒤에 줄이 더 있으면) 닫힙니다(마지막 줄이면).
   text는 문자열 하나 또는 여러 줄을 순서대로 보여줄 배열(["...", "..."])을 받을 수 있습니다.
   닫힐 때 onProceed가 있으면 그걸 실행합니다(예: 이어서 퍼즐/잠금 창 열기). */
const dialogueBar = document.getElementById('dialogueBar');
const dialogueBarText = document.getElementById('dialogueBarText');
let _dialogueQueue = [];
let _dialogueIndex = 0;
let _dialogueOnProceed = null;

let _typeTimer = null;
let _typeDone = false;
const TYPE_SPEED_MS = 65; // 한 글자당 걸리는 시간

function renderDialogueLine(){
  const line = _dialogueQueue[_dialogueIndex] || '';
  if (_typeTimer) clearInterval(_typeTimer);
  _typeDone = false;
  dialogueBarText.textContent = '';
  let i = 0;
  _typeTimer = setInterval(() => {
    i++;
    dialogueBarText.textContent = line.slice(0, i);
    if (i >= line.length) skipTyping();
  }, TYPE_SPEED_MS);
}
/* 타이핑 중 클릭 시 애니메이션을 건너뛰고 문장 전체 + ▽ 표시를 즉시 보여줌 */
function skipTyping(){
  if (_typeTimer) clearInterval(_typeTimer);
  _typeTimer = null;
  _typeDone = true;
  const line = _dialogueQueue[_dialogueIndex] || '';
  dialogueBarText.innerHTML = `${escapeHtml(line)} <span class="dialogue-next">▽</span>`;
}
function showDialogue(text, onProceed){
  const lines = Array.isArray(text) ? text.filter(t => t !== undefined && t !== null) : [text || ''];
  _dialogueQueue = lines.length ? lines : [''];
  _dialogueIndex = 0;
  _dialogueOnProceed = onProceed || null;
  renderDialogueLine();
  dialogueBar.classList.add('show');
  document.body.classList.add('dialogue-active');
}
function advanceDialogue(){
  if (!dialogueBar.classList.contains('show')) return;
  if (!_typeDone){ skipTyping(); return; }
  if (_dialogueIndex < _dialogueQueue.length - 1){
    _dialogueIndex++;
    renderDialogueLine();
  } else {
    dialogueBar.classList.remove('show');
    document.body.classList.remove('dialogue-active');
    if (itemPopup.classList.contains('show')){
      if (_itemPopupTimer) clearTimeout(_itemPopupTimer);
      itemPopup.classList.remove('show');
    }
    const cb = _dialogueOnProceed;
    _dialogueQueue = []; _dialogueIndex = 0; _dialogueOnProceed = null;
    if (cb) cb();
  }
}
/* 대화가 떠 있는 동안엔 씬(배경 이미지) 영역 어디를 클릭해도 다음 줄로 넘어감 —
   대화바 자체를 클릭한 경우도 이 리스너로 버블링되어 함께 처리되므로 별도 리스너를 달지 않음 */
document.getElementById('sceneWrap').addEventListener('click', () => {
  if (dialogueBar.classList.contains('show')) advanceDialogue();
});
