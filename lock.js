/* ===========================================================
   lock.js — 잠금 · 코드 조합 시스템
   문/서랍 잠금 해제(키패드)와 엘리베이터 전원·호출 처리를 담당합니다.
=========================================================== */

/* ---------- 잠금(문/서랍) 모달 : 도어락 키패드 / 콤보락(다이얼) ---------- */
function openLock(lockId, destRoom){
  const lock = LOCKS[lockId];
  if (state.unlocked[lockId]){
    if (destRoom) goRoom(destRoom);
    return;
  }
  if (lock.style === 'combo'){ openComboLock(lockId, destRoom); return; }

  const codeLength = lockCode(lockId).length;
  const title = lock.title || LOCK_TEXT.title;
  const subtext = lock.subtext
    ? (typeof lock.subtext === 'function' ? lock.subtext(codeLength) : lock.subtext)
    : LOCK_TEXT.subtext(codeLength);
  openModal(`
    <h3>${title}</h3>
    <p class="sub">${subtext}</p>
    <div class="keypad-display" id="keypadDisplay">${'_'.repeat(codeLength)}</div>
    <div class="keypad-grid" id="keypadGrid"></div>
    <div id="lockFeedback" class="feedback" style="margin-top:8px;"></div>
  `, 'lock-modal');
  window.__lockCtx = { lockId, destRoom, entered: '' };
  buildKeypad();
}
function buildKeypad(){
  const grid = document.getElementById('keypadGrid');
  grid.innerHTML = '';
  const make = (label, extraClass) => {
    const b = document.createElement('button');
    b.className = 'key' + (extraClass ? ' ' + extraClass : ''); b.textContent = label;
    b.onclick = () => keypadPress(label);
    return b;
  };
  for (let n = 1; n <= 9; n++) grid.appendChild(make(String(n)));
  grid.appendChild(make('C', 'key-clear'));
  grid.appendChild(make('0'));
  grid.appendChild(make('⌫', 'key-back'));
}
function playSound(el){
  if (!el) return;
  el.currentTime = 0;
  const p = el.play();
  if (p && p.catch) p.catch(() => {});
}
function keypadPress(label){
  playSound(document.getElementById('doorlockBeepAudio'));

  const ctx = window.__lockCtx;
  const lock = LOCKS[ctx.lockId];
  const target = lockCode(ctx.lockId);
  if (label === 'C') ctx.entered = '';
  else if (label === '⌫') ctx.entered = ctx.entered.slice(0, -1);
  else if (ctx.entered.length < target.length) ctx.entered += label;
  document.getElementById('keypadDisplay').textContent = ctx.entered.padEnd(target.length, '_');
  if (ctx.entered.length === target.length){
    const fb = document.getElementById('lockFeedback');
    if (ctx.entered === target){
      state.unlocked[ctx.lockId] = true;
      if (lock.reward) addInventory(lock.reward);
      if (lock.openSound) playSfx(lock.openSound);
      else playSound(document.getElementById('doorlockOpenAudio'));
      fb.className = 'feedback ok';
      fb.textContent = lock.reward ? `${lock.success || LOCK_TEXT.success} ${lock.reward.name} 획득` : (lock.success || LOCK_TEXT.success);
      render();
      setTimeout(() => { closeModal(); if (ctx.destRoom) goRoom(ctx.destRoom); }, 700);
    } else {
      playSound(document.getElementById('doorlockWrongAudio'));
      fb.className = 'feedback bad';
      fb.textContent = lock.wrong || LOCK_TEXT.wrong;
      setTimeout(() => { ctx.entered = ''; document.getElementById('keypadDisplay').textContent = '_'.repeat(target.length); }, 400);
    }
  }
}

/* ---------- 콤보락(회전 다이얼 자물쇠) — 도어락과 달리 버튼 누르는 게 아니라
   ▲▼로 각 자리 숫자를 돌려 맞추는 실물 자물쇠 스타일 UI ---------- */
function openComboLock(lockId, destRoom){
  const lock = LOCKS[lockId];
  const target = lockCode(lockId);
  const codeLength = target.length;
  const title = lock.title || LOCK_TEXT.title;
  const subtext = lock.subtext
    ? (typeof lock.subtext === 'function' ? lock.subtext(codeLength) : lock.subtext)
    : LOCK_TEXT.subtext(codeLength);
  openModal(`
    <h3>${title}</h3>
    <p class="sub">${subtext}</p>
    <div class="combo-lock-body" id="comboBody"></div>
    <div style="text-align:right; margin-bottom:8px;"><button class="btn" onclick="comboCheck()">확인</button></div>
    <div id="lockFeedback" class="feedback"></div>
  `, 'combo-modal');
  window.__comboCtx = { lockId, destRoom, digits: new Array(codeLength).fill(0) };
  buildComboDials();
}
function buildComboDials(){
  const body = document.getElementById('comboBody');
  const ctx = window.__comboCtx;
  body.innerHTML = '';
  ctx.digits.forEach((v, i) => {
    const dial = document.createElement('div');
    dial.className = 'combo-dial';
    dial.innerHTML = `
      <button type="button" onclick="comboChange(${i},1)">▲</button>
      <div class="combo-digit" id="comboDigit${i}">${v}</div>
      <button type="button" onclick="comboChange(${i},-1)">▼</button>
    `;
    body.appendChild(dial);
  });
}
function comboChange(i, delta){
  playSound(document.getElementById('doorlockBeepAudio'));
  const ctx = window.__comboCtx;
  ctx.digits[i] = (ctx.digits[i] + delta + 10) % 10;
  document.getElementById('comboDigit' + i).textContent = ctx.digits[i];
}
function comboCheck(){
  const ctx = window.__comboCtx;
  const lock = LOCKS[ctx.lockId];
  const target = lockCode(ctx.lockId);
  const entered = ctx.digits.join('');
  const fb = document.getElementById('lockFeedback');
  if (entered === target){
    state.unlocked[ctx.lockId] = true;
    if (lock.reward) addInventory(lock.reward);
    if (lock.openSound) playSfx(lock.openSound);
    else playSound(document.getElementById('doorlockOpenAudio'));
    fb.className = 'feedback ok';
    fb.textContent = lock.reward ? `${lock.success || LOCK_TEXT.success} ${lock.reward.name} 획득` : (lock.success || LOCK_TEXT.success);
    render();
    setTimeout(() => { closeModal(); if (ctx.destRoom) goRoom(ctx.destRoom); }, 700);
  } else {
    playSound(document.getElementById('doorlockWrongAudio'));
    fb.className = 'feedback bad';
    fb.textContent = lock.wrong || LOCK_TEXT.wrong;
  }
}

/* ---------- 차단기 전원 복구 콜백 ---------- */
function onBreakerSolved(){ state.power = true; render(); }
