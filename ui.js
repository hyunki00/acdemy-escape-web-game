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
function openModal(innerHTML){
  modalBody.innerHTML = `<button class="modal-close" onclick="closeModal()">✕</button>` + innerHTML;
  overlay.classList.add('show');
}
function closeModal(){ overlay.classList.remove('show'); }
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

/* ---------- 상호작용 대사 (사물 클릭 → 하단에 대사 표시 → 자동으로 사라지며 다음 동작) ---------- */
const dialogueBar = document.getElementById('dialogueBar');
const dialogueBarText = document.getElementById('dialogueBarText');
let _dialogueTimer = null;
function showDialogue(text, onProceed){
  if (_dialogueTimer) clearTimeout(_dialogueTimer);
  dialogueBarText.textContent = text || '';
  dialogueBar.classList.add('show');
  const duration = Math.max(1600, (text || '').length * 55);
  _dialogueTimer = setTimeout(() => {
    dialogueBar.classList.remove('show');
    _dialogueTimer = null;
    if (onProceed) onProceed();
  }, duration);
}
