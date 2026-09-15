/* ===========================================================
   lock.js — 잠금 · 코드 조합 시스템
   문/서랍 잠금 해제(키패드)와 엘리베이터 전원·호출 처리를 담당합니다.
=========================================================== */

/* ---------- 잠금(문/서랍) 모달 : 체크리스트 + 키패드 ---------- */
function openLock(lockId, destRoom){
  const lock = LOCKS[lockId];
  if (state.unlocked[lockId]){
    if (destRoom) goRoom(destRoom);
    return;
  }
  const items = lock.require.map(pid => {
    const p = PUZZLES[pid];
    const done = !!state.solved[pid];
    return `<li><span class="dot ${done ? 'on' : ''}"></span>${p.title} ${done ? `— 조각 ${p.digit}` : '(미확인)'}</li>`;
  }).join('');
  const allDone = lockSolved(lockId);
  openModal(`
    <h3>잠긴 문</h3>
    <p class="sub">필요한 단서를 모두 모으면 비밀번호를 입력할 수 있어요.</p>
    <ul class="checklist">${items}</ul>
    ${allDone ? `
      <div class="keypad-display" id="keypadDisplay">${'_'.repeat(lockCode(lockId).length)}</div>
      <div class="keypad-grid" id="keypadGrid"></div>
      <div id="lockFeedback" class="feedback" style="margin-top:8px;"></div>
    ` : `<p class="feedback bad">아직 단서가 부족해요. 방을 더 둘러보세요.</p>`}
  `);
  if (allDone){
    window.__lockCtx = { lockId, destRoom, entered: '' };
    buildKeypad();
  }
}
function buildKeypad(){
  const grid = document.getElementById('keypadGrid');
  grid.innerHTML = '';
  const make = (label) => {
    const b = document.createElement('button');
    b.className = 'key'; b.textContent = label;
    b.onclick = () => keypadPress(label);
    return b;
  };
  for (let n = 1; n <= 9; n++) grid.appendChild(make(String(n)));
  grid.appendChild(make('C'));
  grid.appendChild(make('0'));
  grid.appendChild(make('⌫'));
}
function keypadPress(label){
  const ctx = window.__lockCtx;
  const target = lockCode(ctx.lockId);
  if (label === 'C') ctx.entered = '';
  else if (label === '⌫') ctx.entered = ctx.entered.slice(0, -1);
  else if (ctx.entered.length < target.length) ctx.entered += label;
  document.getElementById('keypadDisplay').textContent = ctx.entered.padEnd(target.length, '_');
  if (ctx.entered.length === target.length){
    const fb = document.getElementById('lockFeedback');
    if (ctx.entered === target){
      state.unlocked[ctx.lockId] = true;
      const lock = LOCKS[ctx.lockId];
      if (lock.reward) addInventory(lock.reward);
      fb.className = 'feedback ok';
      fb.textContent = `✓ 열렸다! ${lock.reward ? lock.reward.name + ' 획득' : ''}`;
      render();
      setTimeout(() => { closeModal(); if (ctx.destRoom) goRoom(ctx.destRoom); }, 700);
    } else {
      fb.className = 'feedback bad';
      fb.textContent = '틀렸어요. 다시 시도해보세요.';
      setTimeout(() => { ctx.entered = ''; document.getElementById('keypadDisplay').textContent = '_'.repeat(target.length); }, 400);
    }
  }
}

/* ---------- 차단기 / 호출패널 ---------- */
function openBreaker(){
  if (!hasItem('masterkey')){
    openModal(`<h3>차단기함</h3><p class="sub">잠겨 있다. 열쇠가 필요해 보인다.</p>`);
    return;
  }
  if (state.power){
    openModal(`<h3>차단기함</h3><p class="sub">이미 전원이 복구되어 있다.</p>`);
    return;
  }
  openPuzzle('p_breaker');
}
function onBreakerSolved(){ state.power = true; render(); }
function openCallPanel(){
  openPuzzle('p_callcode');
}
function onCallCodeSolved(){ state.unlocked['elevatorCall'] = true; render(); }
