/* ===========================================================
   puzzle.js — 퀴즈(퍼즐) 시스템
   빈칸 채우기 / 출력값(주관식) 맞추기 / 객관식 문제의 출제와 채점을 담당합니다.

   2단계 체인 퍼즐: PUZZLES[id]에 followUp을 넣으면, 1단계(메인) 정답을 맞힌 뒤
   자동으로 2단계(followUp) 문제가 이어서 열립니다. 실제로 "다 풀었다"고 인정되는
   시점(=state.solved[id]=true, 문 코드로 쓰이는 digit 공개)은 마지막 단계를
   맞혔을 때입니다. followUp이 없는 퍼즐은 예전처럼 1단계만으로 바로 완료됩니다.
=========================================================== */

/* 정답이 배열이면 그 중 하나만 맞아도 정답 처리 (i++ / i += 1 / i = i + 1 처럼
   같은 의미의 다른 문법을 전부 인정할 때 사용). 화면에 대표로 보여줄 땐 첫 번째 값을 사용. */
function canonicalAnswer(def){ return Array.isArray(def.answer) ? def.answer[0] : def.answer; }
/* 채점용 정규화: 공백/끝 세미콜론을 지우고 소문자로 맞춰서 비교 —
   "Transformation"과 "transformation", "i += 1"과 "i+=1" 등을 같은 답으로 처리 */
function normalizeCode(str){ return String(str).trim().toLowerCase().replace(/\s+/g, '').replace(/;+$/, ''); }
function isAnswerCorrect(def, val){
  const accepted = Array.isArray(def.answer) ? def.answer : [def.answer];
  return accepted.some(a => normalizeCode(val) === normalizeCode(a));
}
/* stage: 'main'(1단계, 기본값) | 'followUp'(2단계) — 어느 단계의 정의를 볼지 결정 */
function getStageDef(p, stage){ return stage === 'followUp' ? p.followUp : p; }

/* 한 단계를 맞혔을 때 다음으로 진행할지, 완전히 풀린 것으로 처리할지 결정 */
function advanceStage(puzzleId, p, stage, fb){
  if (stage === 'main' && p.followUp){
    fb.className = p.flavor ? 'feedback info' : 'feedback ok';
    fb.textContent = p.stage1SuccessMsg || '✓ 정답! 다음 단서로 넘어간다...';
    setTimeout(() => { openPuzzle(puzzleId, 'followUp'); }, 900);
  } else {
    markSolved(puzzleId);
    fb.className = p.flavor ? 'feedback info' : 'feedback ok';
    fb.textContent = p.flavor ? (p.successMsg || '✓ 정답!') : `✓ 정답! 코드 조각 확보: ${p.digit}`;
    if (puzzleId === 'p_callcode') onCallCodeSolved();
    if (p.noDigit) onBreakerSolved();
  }
}

/* ---------- 퍼즐 모달 ---------- */
function openPuzzle(puzzleId, stage){
  stage = stage || 'main';
  const p = PUZZLES[puzzleId];
  const def = getStageDef(p, stage);
  const already = state.solved[puzzleId]; // 마지막 단계까지 다 풀렸을 때만 true

  let subText, bodyExtra;

  if (def.type === 'choice'){
    subText = def.subtext || '다음 중에서 골라보자.';
    const optionsHtml = def.options.map((opt, i) => {
      const isCorrectShown = already && i === def.correct;
      return `<button class="choice-btn${isCorrectShown ? ' correct' : ''}" ${already ? 'disabled' : `onclick="checkChoice('${puzzleId}', ${i}, '${stage}')"`}>${opt}</button>`;
    }).join('');
    bodyExtra = `<div class="choice-list" id="choiceList">${def.prompt ? `<p class="choice-prompt">${def.prompt.replace(/\n/g, '<br>')}</p>` : ''}${optionsHtml}</div>`;
  } else if (def.type === 'text'){
    subText = def.subtext || '다음 질문에 답해보자.';
    bodyExtra = `<div class="choice-list">${def.prompt ? `<p class="choice-prompt">${def.prompt.replace(/\n/g, '<br>')}</p>` : ''}
      ${already ? '' : `<div class="answer-row">
        <input id="outputInput" type="text" placeholder="정답 입력" onkeydown="if(event.key==='Enter') checkOutput('${puzzleId}', '${stage}')">
        <button class="btn" onclick="checkOutput('${puzzleId}', '${stage}')">확인</button>
      </div>
      <div style="text-align:right;"><button class="btn secondary" onclick="showHint('${puzzleId}', '${stage}')">힌트</button></div>`}</div>`;
  } else if (def.type === 'info'){
    // 답을 직접 입력받지 않고, 정보/힌트만 보여준 뒤 확인 버튼으로 다음 단계로 넘어가는 타입
    subText = def.subtext || '';
    bodyExtra = `<div class="choice-list">${def.prompt ? `<p class="choice-prompt">${def.prompt.replace(/\n/g, '<br>')}</p>` : ''}
      ${already ? '' : `<div style="text-align:right;"><button class="btn" onclick="checkInfo('${puzzleId}', '${stage}')">확인</button></div>`}</div>`;
  } else {
    let codeHtml = def.code.replace(/\n/g, '<br>');
    if (def.type === 'blank'){
      codeHtml = codeHtml.replace('{{blank}}', `<span class="blank-marker">${already ? canonicalAnswer(def) : '?'}</span>`);
    }
    subText = def.subtext || (def.type === 'blank' ? '빈칸에 들어갈 말을 아래에 입력해보세요.' : '무엇이 정답일까요?');
    const inputId = def.type === 'blank' ? 'blankInput' : 'outputInput';
    const checkFn = def.type === 'blank' ? 'checkBlank' : 'checkOutput';
    bodyExtra = `<div class="code-box">${codeHtml}</div>
       ${already ? '' : `<div class="answer-row">
         <input id="${inputId}" type="text" placeholder="${def.type === 'blank' ? '빈칸에 들어갈 답' : '정답 입력'}" onkeydown="if(event.key==='Enter') ${checkFn}('${puzzleId}', '${stage}')">
         <button class="btn" onclick="${checkFn}('${puzzleId}', '${stage}')">확인</button>
       </div>
       <div style="text-align:right;"><button class="btn secondary" onclick="showHint('${puzzleId}', '${stage}')">힌트</button></div>`}`;
  }

  const successNote = already
    ? `<p class="feedback ${p.flavor ? 'info' : 'ok'}">✓ 이미 확인했어요. ${p.flavor ? '' : `코드 조각: <strong>${p.digit}</strong>`}</p>`
    : `<div id="puzzleFeedback" class="feedback"></div>`;

  openModal(`
    <h3>${def.title || p.title}</h3>
    <p class="sub">${subText}</p>
    ${bodyExtra}
    ${successNote}
  `);
}
function showHint(puzzleId, stage){
  const p = PUZZLES[puzzleId];
  const def = getStageDef(p, stage || 'main');
  const fb = document.getElementById('puzzleFeedback');
  if (fb) fb.innerHTML = `<span style="color:#8a5a12;">힌트: ${def.hint}</span>`;
}
function markSolved(puzzleId){
  state.solved[puzzleId] = true;
  render();
}
function checkBlank(puzzleId, stage){
  stage = stage || 'main';
  const p = PUZZLES[puzzleId];
  const def = getStageDef(p, stage);
  const val = document.getElementById('blankInput').value;
  const fb = document.getElementById('puzzleFeedback');
  if (isAnswerCorrect(def, val)){
    advanceStage(puzzleId, p, stage, fb);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = '다시 확인해보세요.';
  }
}
function checkOutput(puzzleId, stage){
  stage = stage || 'main';
  const p = PUZZLES[puzzleId];
  const def = getStageDef(p, stage);
  const val = document.getElementById('outputInput').value.trim();
  const fb = document.getElementById('puzzleFeedback');
  if (isAnswerCorrect(def, val)){
    advanceStage(puzzleId, p, stage, fb);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = '다시 확인해보세요.';
  }
}
function checkChoice(puzzleId, idx, stage){
  stage = stage || 'main';
  const p = PUZZLES[puzzleId];
  const def = getStageDef(p, stage);
  const fb = document.getElementById('puzzleFeedback');
  if (idx === def.correct){
    document.querySelectorAll('#choiceList .choice-btn').forEach((btn, i) => {
      btn.disabled = true;
      if (i === idx) btn.classList.add('correct');
    });
    advanceStage(puzzleId, p, stage, fb);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = '음... 다시 생각해보자.';
  }
}
function checkInfo(puzzleId, stage){
  stage = stage || 'main';
  const p = PUZZLES[puzzleId];
  const fb = document.getElementById('puzzleFeedback');
  advanceStage(puzzleId, p, stage, fb);
}
