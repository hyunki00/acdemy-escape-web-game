/* ===========================================================
   puzzle.js — 퀴즈(퍼즐) 시스템
   빈칸 채우기 / 출력값 맞추기 문제의 출제와 채점을 담당합니다.
=========================================================== */

/* ---------- 퍼즐 모달 ---------- */
function openPuzzle(puzzleId){
  const p = PUZZLES[puzzleId];
  const already = state.solved[puzzleId];
  let codeHtml = p.code
    .replace(/\n/g, '<br>')
    .replace('{{blank}}', `<input class="blank-input" id="blankInput" ${already ? `value="${p.answer}" disabled` : ''} placeholder="?">`);

  const bodyExtra = p.type === 'blank'
    ? `<div class="code-box">${codeHtml}</div>
       ${already ? '' : `<div style="display:flex; justify-content:flex-end; gap:8px;">
         <button class="btn secondary" onclick="showHint('${puzzleId}')">힌트</button>
         <button class="btn" onclick="checkBlank('${puzzleId}')">확인</button>
       </div>`}`
    : `<div class="code-box">${codeHtml}</div>
       ${already ? '' : `<div class="answer-row">
         <input id="outputInput" type="text" placeholder="출력값 입력">
         <button class="btn" onclick="checkOutput('${puzzleId}')">확인</button>
       </div>
       <div style="text-align:right;"><button class="btn secondary" onclick="showHint('${puzzleId}')">힌트</button></div>`}`;

  const successNote = already
    ? `<p class="feedback ok">✓ 이미 확인했어요. ${p.flavor ? '' : `코드 조각: <strong>${p.digit}</strong>`}</p>`
    : `<div id="puzzleFeedback" class="feedback"></div>`;

  openModal(`
    <h3>${p.title}</h3>
    <p class="sub">${p.type === 'blank' ? '빈칸을 채워보세요.' : '이 코드를 실행하면 무엇이 출력될까요?'}</p>
    ${bodyExtra}
    ${successNote}
  `);
}
function showHint(puzzleId){
  const fb = document.getElementById('puzzleFeedback');
  if (fb) fb.innerHTML = `<span style="color:#8a5a12;">힌트: ${PUZZLES[puzzleId].hint}</span>`;
}
function markSolved(puzzleId){
  state.solved[puzzleId] = true;
  render();
}
function checkBlank(puzzleId){
  const p = PUZZLES[puzzleId];
  const val = document.getElementById('blankInput').value.trim();
  const fb = document.getElementById('puzzleFeedback');
  if (val === p.answer){
    markSolved(puzzleId);
    fb.className = 'feedback ok';
    fb.textContent = p.noDigit ? '✓ 정답! 전원이 복구됐다.' : `✓ 정답! 코드 조각 확보: ${p.digit}`;
    if (p.noDigit) onBreakerSolved();
  } else {
    fb.className = 'feedback bad';
    fb.textContent = '다시 확인해보세요.';
  }
}
function checkOutput(puzzleId){
  const p = PUZZLES[puzzleId];
  const val = document.getElementById('outputInput').value.trim();
  const fb = document.getElementById('puzzleFeedback');
  if (val.toUpperCase() === p.answer.toUpperCase()){
    markSolved(puzzleId);
    fb.className = 'feedback ok';
    fb.textContent = p.flavor ? '✓ 정답! ("ESCAPE"라는 글자가 흐릿하게 보인다)' : `✓ 정답! 코드 조각 확보: ${p.digit}`;
    if (puzzleId === 'p_callcode') onCallCodeSolved();
  } else {
    fb.className = 'feedback bad';
    fb.textContent = '다시 확인해보세요.';
  }
}
