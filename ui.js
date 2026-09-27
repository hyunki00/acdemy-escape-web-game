/* ===========================================================
   ui.js — 공통 화면 요소 (모달 · 팝업 · 대화창)
=========================================================== */

const el = id => document.getElementById(id);
const nl2br = s => String(s || '').replace(/\n/g, '<br>');
const escapeHtml = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* 피드백 문구 (cls: 'ok' 초록 · 'bad' 빨강 · 'info' 하늘 · 'hint' 노랑). \n 줄바꿈 · [[...]] 회색 글씨 가능 */
function setFeedback(id, text, cls){
  const f = el(id);
  if (!f) return;
  f.className = 'feedback' + (cls ? ' ' + cls : '');
  f.innerHTML = nl2br(partsHtml(lineParts(text ?? '')));
}

/* ---------- 모달 ---------- */
const overlay = el('overlay');
const modalBody = el('modalBody');
function openModal(html, skinClass){
  modalBody.className = 'modal' + (skinClass ? ' ' + skinClass : '');
  modalBody.innerHTML = `<button class="modal-close" onclick="closeModal()">✕</button>` + html;
  overlay.classList.add('show');
}
function closeModal(){ overlay.classList.remove('show'); hideImagePopup(); }
/* 창 바깥을 눌렀을 때만 닫힘 — 입력칸에서 드래그하다 바깥에서 손을 떼도 닫히지 않도록, 누른 곳도 바깥이어야 함 */
let overlayPressed = false;
overlay.addEventListener('mousedown', e => { overlayPressed = e.target === overlay; });
overlay.addEventListener('click', e => { if (e.target === overlay && overlayPressed) closeModal(); });

/* ---------- 화면 중앙 이미지 팝업 (문 인트로 등) ---------- */
const imagePopup = el('imagePopup');
function showImagePopup(src){
  if (!src) return;
  el('imagePopupImg').src = src;
  imagePopup.classList.add('show');
}
function hideImagePopup(){ imagePopup.classList.remove('show'); }

/* ---------- 아이템 획득 팝업 ----------
   대화창이 떠 있는 동안은 계속 보이고, 대화창이 끝날 때 같이 닫힘.
   대화창이 없으면 1.6초 뒤 자동으로 닫힘 */
const itemPopup = el('itemPopup');
const ITEM_POPUP_MS = 1600;
let itemPopupTimer = null;
function showItemPopup(item){
  el('itemPopupIcon').innerHTML = `<img src="${item.image}" alt="${item.name}">`;
  el('itemPopupName').textContent = item.name;
  itemPopup.classList.add('show');
  clearTimeout(itemPopupTimer);
  itemPopupTimer = setTimeout(() => { if (!isDialogueOpen()) hideItemPopup(); }, ITEM_POPUP_MS);
}
function hideItemPopup(){ clearTimeout(itemPopupTimer); itemPopup.classList.remove('show'); }

/* ---------- 대화창 ----------
   showDialogue('대사') 또는 showDialogue(['줄1', '줄2'], 닫힌 뒤 실행할 함수)
   글자가 한 자씩 나오고, 클릭 1번 = 끝까지 표시, 한 번 더 = 다음 줄/닫기
   대사 안에 [[...]]로 감싼 부분은 회색 글씨로 표시 (예: '본문 [[(속마음)]]') — 소지품 설명 · 피드백 문구도 동일 */
const dialogueBar = el('dialogueBar');
const dialogueText = el('dialogueTextInner');
const TYPE_SPEED_MS = 28;
const DIALOGUE_ARROW_SPACE = 28;   // 오른쪽 ▽ 표시 자리(px)

const dialogue = { lines: [], index: 0, onClose: null, timer: null, typing: false };

const isDialogueOpen = () => dialogueBar.classList.contains('show');
const isBlocking = () => isDialogueOpen() || imagePopup.classList.contains('show');

function showDialogue(text, onClose){
  dialogue.lines = [].concat(text ?? '');
  dialogue.index = 0;
  dialogue.onClose = onClose || null;
  typeLine();
  dialogueBar.classList.add('show');
  document.body.classList.add('dialogue-active');
}

/* 완성된 줄의 폭을 미리 재서 박스 폭을 고정 → 박스는 중앙에 가만히 있고 글자만 왼쪽부터 채워짐 */
/* '[[...]]' 표시를 나눠서 [{ text, gray }] 조각 목록으로 */
const lineParts = line => String(line).split(/(\[\[.*?\]\])/).filter(Boolean)
  .map(p => p.startsWith('[[') ? { text: p.slice(2, -2), gray: true } : { text: p });
/* 앞에서부터 n글자까지만 HTML로 (회색 조각은 span으로 감쌈) */
function partsHtml(parts, n = Infinity){
  let html = '';
  for (const { text, gray } of parts){
    if (n <= 0) break;
    const shown = escapeHtml(text.slice(0, n));
    n -= text.length;
    html += gray ? `<span class="aside-text">${shown}</span>` : shown;
  }
  return html;
}

function typeLine(){
  const parts = lineParts(dialogue.lines[dialogue.index]);
  const length = parts.reduce((sum, p) => sum + p.text.length, 0);
  const measure = el('dialogueMeasure');
  measure.innerHTML = partsHtml(parts);
  const maxWidth = Math.max(280, (dialogueBar.offsetWidth || 900) - 88);
  el('dialogueBarText').style.width = Math.min(measure.offsetWidth + DIALOGUE_ARROW_SPACE, maxWidth) + 'px';

  clearInterval(dialogue.timer);
  dialogue.typing = true;
  dialogueText.textContent = '';
  startTypingSound();
  let i = 0;
  dialogue.timer = setInterval(() => {
    dialogueText.innerHTML = partsHtml(parts, ++i);
    if (i >= length) finishTyping();
  }, TYPE_SPEED_MS);
}
function finishTyping(){
  clearInterval(dialogue.timer);
  dialogue.typing = false;
  stopTypingSound();
  dialogueText.innerHTML = partsHtml(lineParts(dialogue.lines[dialogue.index]));
}
function advanceDialogue(){
  if (!isDialogueOpen()) return;
  if (dialogue.typing) return finishTyping();
  if (dialogue.index < dialogue.lines.length - 1){
    dialogue.index++;
    return typeLine();
  }
  dialogueBar.classList.remove('show');
  document.body.classList.remove('dialogue-active');
  stopTypingSound();
  if (itemPopup.classList.contains('show')) hideItemPopup();
  const cb = dialogue.onClose;
  dialogue.onClose = null;
  if (cb) cb();
}
/* 대화 중엔 장면 아무 곳이나 클릭하면 진행 */
el('sceneWrap').addEventListener('click', () => { if (isDialogueOpen()) advanceDialogue(); });
