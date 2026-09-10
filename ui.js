/* ===========================================================
   ui.js — 공통 UI (모달 열고 닫기)
=========================================================== */

/* ---------- 모달 공통 ---------- */
const overlay = document.getElementById('overlay');
const modalBody = document.getElementById('modalBody');
function openModal(innerHTML){
  modalBody.innerHTML = `<button class="modal-close" onclick="closeModal()">✕</button>` + innerHTML;
  overlay.classList.add('show');
}
function closeModal(){ overlay.classList.remove('show'); }
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
