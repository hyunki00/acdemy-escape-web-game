/* ===========================================================
   lock.js — 잠금 창 (도어락 키패드 · 다이얼 자물쇠)
=========================================================== */

let lockCtx = null;   // 지금 열려 있는 잠금 { lockId, dest, entered, digits }

function openLock(lockId, dest){
  if (state.unlocked[lockId]){ if (dest) goRoom(dest); return; }
  const lock = LOCKS[lockId], len = lock.code.length;
  lockCtx = { lockId, dest, entered: '', digits: Array(len).fill(0) };
  const head = `<h3>${lock.title || LOCK_TEXT.title}</h3><p class="sub">${lock.subtext || LOCK_TEXT.subtext(len)}</p>`;

  if (lock.style === 'combo'){
    const dials = lockCtx.digits.map((d, i) => `<div class="combo-dial">
        <button type="button" onclick="turnDial(${i}, 1)">▲</button>
        <div class="combo-digit" id="comboDigit${i}">0</div>
        <button type="button" onclick="turnDial(${i}, -1)">▼</button></div>`).join('');
    openModal(head + `<div class="combo-lock-body" id="comboBody">${dials}</div>
      <div class="right" style="margin-bottom:8px;"><button class="btn" onclick="checkCombo()">확인</button></div>
      <div id="lockFeedback" class="feedback"></div>`);
  } else {
    const keys = ['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(k => {
      const cls = k === 'C' ? ' key-clear' : k === '⌫' ? ' key-back' : '';
      return `<button class="key${cls}" onclick="pressKey('${k}')">${k}</button>`;
    }).join('');
    openModal(head + `<div class="keypad-display" id="keypadDisplay">${'_'.repeat(len)}</div>
      <div class="keypad-grid" id="keypadGrid">${keys}</div>
      <div id="lockFeedback" class="feedback" style="margin-top:8px;"></div>`);
  }
}

/* ---------- 도어락 키패드 ---------- */
function pressKey(k){
  playSfx(SOUND.beep);
  const code = LOCKS[lockCtx.lockId].code;
  if (k === 'C') lockCtx.entered = '';
  else if (k === '⌫') lockCtx.entered = lockCtx.entered.slice(0, -1);
  else if (lockCtx.entered.length < code.length) lockCtx.entered += k;
  el('keypadDisplay').textContent = lockCtx.entered.padEnd(code.length, '_');
  if (lockCtx.entered.length < code.length) return;
  if (lockCtx.entered === code) return unlockSuccess();
  unlockFail();
  setTimeout(() => { lockCtx.entered = ''; el('keypadDisplay').textContent = '_'.repeat(code.length); }, 400);
}

/* ---------- 다이얼 자물쇠 ---------- */
function turnDial(i, delta){
  playSfx(SOUND.beep);
  lockCtx.digits[i] = (lockCtx.digits[i] + delta + 10) % 10;
  el('comboDigit' + i).textContent = lockCtx.digits[i];
}
function checkCombo(){
  if (lockCtx.digits.join('') === LOCKS[lockCtx.lockId].code) unlockSuccess();
  else unlockFail();
}

/* ---------- 결과 ---------- */
function unlockSuccess(){
  const { lockId, dest } = lockCtx, lock = LOCKS[lockId];
  const msg = lock.success || LOCK_TEXT.success;
  state.unlocked[lockId] = true;
  if (lock.reward) addInventory(lock.reward);
  playSfx(lock.openSound || SOUND.doorOpen);
  setFeedback('lockFeedback', lock.reward ? `${msg} ${ITEMS[lock.reward].name} 획득` : msg, 'ok');
  render();
  setTimeout(() => { closeModal(); if (dest) goRoom(dest); }, 700);
}
function unlockFail(){
  playSfx(SOUND.doorWrong);
  setFeedback('lockFeedback', LOCKS[lockCtx.lockId].wrong || LOCK_TEXT.wrong, 'bad');
}
