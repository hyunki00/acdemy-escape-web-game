/* ===========================================================
   puzzle.js — 퀴즈(퍼즐) 시스템
   빈칸 채우기 / 출력값 맞추기 문제의 출제와 채점을 담당합니다.
=========================================================== */

/* 정답이 배열이면 그 중 하나만 맞아도 정답 처리 (i++ / i += 1 / i = i + 1 처럼
   같은 의미의 다른 문법을 전부 인정하기 위함). 화면에 대표로 보여줄 땐 첫 번째 값을 사용. */
function canonicalAnswer(p){ return Array.isArray(p.answer) ? p.answer[0] : p.answer; }
/* 채점용 정규화: 공백을 전부 지우고 끝의 세미콜론도 지워서 비교 —
   "i += 1"과 "i+=1", "power = power + 100;"과 "power=power+100" 등을 같은 답으로 처리 */
function normalizeCode(str){ return String(str).trim().replace(/\s+/g, '').replace(/;+$/, ''); }
function isAnswerCorrect(p, val){
  const accepted = Array.isArray(p.answer) ? p.answer : [p.answer];
  return accepted.some(a => normalizeCode(val) === normalizeCode(a));
}

/* ---------- 퍼즐 모달 ---------- */
function openPuzzle(puzzleId){
  const p = PUZZLES[puzzleId];
  const already = state.solved[puzzleId];
  let codeHtml = p.code
    .replace(/\n/g, '<br>')
    .replace('{{blank}}', `<input class="blank-input" id="blankInput" ${already ? `value="${canonicalAnswer(p)}" disabled` : ''} placeholder="?">`);

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
  const val = document.getElementById('blankInput').value;
  const fb = document.getElementById('puzzleFeedback');
  if (isAnswerCorrect(p, val)){
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
  const accepted = Array.isArray(p.answer) ? p.answer : [p.answer];
  const correct = accepted.some(a => val.toUpperCase() === String(a).toUpperCase());
  if (correct){
    markSolved(puzzleId);
    fb.className = 'feedback ok';
    fb.textContent = p.flavor ? '✓ 정답! ("ESCAPE"라는 글자가 흐릿하게 보인다)' : `✓ 정답! 코드 조각 확보: ${p.digit}`;
    if (puzzleId === 'p_callcode') onCallCodeSolved();
  } else {
    fb.className = 'feedback bad';
    fb.textContent = '다시 확인해보세요.';
  }
}
