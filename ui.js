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

function renderDialogueLine(){
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
  if (_dialogueIndex < _dialogueQueue.length - 1){
    _dialogueIndex++;
    renderDialogueLine();
  } else {
    dialogueBar.classList.remove('show');
    document.body.classList.remove('dialogue-active');
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
