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
    if (p.grantItem) addInventory(p.grantItem);
    // 완료 메시지를 잠깐 보여준 뒤 모달을 자동으로 닫음(이전 화면 위에 메시지만 얹힌 채
    // 계속 떠 있던 문제 방지). 다시 열면 openPuzzle이 "이미 확인함" 상태로 깔끔하게 그려줌.
    setTimeout(() => { closeModal(); }, 900);
  }
}

/* ---------- 퍼즐 모달 ---------- */
function openPuzzle(puzzleId, stage){
  stage = stage || 'main';
  const p = PUZZLES[puzzleId];
  const def = getStageDef(p, stage);
  const already = state.solved[puzzleId]; // 마지막 단계까지 다 풀렸을 때만 true

  let subText, bodyExtra;
  let holdNeedsInit = null;

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
  } else if (def.type === 'login'){
    subText = def.subtext || '로그인 정보를 입력하세요.';
    bodyExtra = already ? '' : `<div class="login-form">
      <input type="text" id="loginId" value="${def.idAnswer || ''}" placeholder="${def.idPlaceholder || 'ID'}">
      <input type="password" id="loginPw" placeholder="${def.pwPlaceholder || 'PW'}">
      <div style="display:flex; justify-content:space-between; gap:8px; margin-top:4px;">
        <button class="btn secondary" onclick="showHint('${puzzleId}', '${stage}')">힌트</button>
        <button class="btn" onclick="checkLogin('${puzzleId}', '${stage}')">로그인</button>
      </div>
    </div>`;
  } else if (def.type === 'newsfeed'){
    // 답을 입력받지 않고 기사들을 보여준 뒤 확인 버튼으로 넘어가는, info와 유사한 읽기 전용 타입
    subText = def.subtext || '';
    const articlesHtml = (def.articles || []).map(a => `
      <div class="news-article">
        <div class="news-title">${a.title}</div>
        <div class="news-body">${(a.body || '').replace(/\n/g, '<br>')}</div>
      </div>`).join('');
    bodyExtra = `<div class="news-feed">${articlesHtml}
      ${already ? '' : `<div style="text-align:right; margin-top:12px;"><button class="btn" onclick="checkInfo('${puzzleId}', '${stage}')">확인</button></div>`}</div>`;
  } else if (def.type === 'hold'){
    // 특정 아이템(펜)이 있어야 시도할 수 있는 "기믹". 이미 적혀 있는 답이 뿌연 막 아래
    // 숨어 있고, 두꺼운 펜으로 문질러 긁어내면(캔버스 destination-out) 드러남.
    // 충분히 긁으면 자동으로 정답 처리되어 다음으로 넘어감 (별도 확인 버튼 없음).
    subText = def.subtext || '';
    const questionHtml = `<p class="hold-question">${(def.prompt || '').replace(/\n/g, '<br>')}</p>`;
    const hasReq = !def.requiresItem || hasItem(def.requiresItem);
    if (already){
      bodyExtra = questionHtml;
    } else if (!hasReq){
      bodyExtra = `${questionHtml}<p class="hold-missing-msg">${def.missingItemMsg || ''}</p>`;
    } else {
      holdNeedsInit = { puzzleId, stage, revealText: def.revealText || '???' };
      bodyExtra = `${questionHtml}
        <div class="hold-write-area" id="holdWriteArea">
          <canvas id="holdCanvas" class="hold-canvas"></canvas>
          <span class="hold-label" id="holdLabel">손수건으로 뽀득뽀득 문질러 닦아보자...</span>
        </div>
        <div style="text-align:right;"><button class="btn secondary" onclick="showHint('${puzzleId}', '${stage}')">힌트</button></div>`;
    }
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
  `, def.type === 'info' ? 'modal-narrow' : undefined);
  if (holdNeedsInit) initHoldCanvas(holdNeedsInit.puzzleId, holdNeedsInit.stage, holdNeedsInit.revealText);
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
  const correct = def.anyAnswer ? val.length > 0 : isAnswerCorrect(def, val);
  if (correct){
    advanceStage(puzzleId, p, stage, fb);
  } else if (def.anyAnswer){
    fb.className = 'feedback bad';
    fb.textContent = '뭐라도 적어보자.';
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
function checkLogin(puzzleId, stage){
  stage = stage || 'main';
  const p = PUZZLES[puzzleId];
  const def = getStageDef(p, stage);
  const idVal = document.getElementById('loginId').value;
  const pwVal = document.getElementById('loginPw').value;
  const fb = document.getElementById('puzzleFeedback');
  if (idVal === def.idAnswer && pwVal === def.pwAnswer){
    advanceStage(puzzleId, p, stage, fb);
  } else {
    fb.className = 'feedback bad';
    fb.textContent = '아이디 또는 비밀번호가 올바르지 않습니다.';
  }
}

/* ---------- 스크래치 기믹(손수건으로 문질러서 숨겨진 답 드러내기) ----------
   캔버스에 답 텍스트를 먼저 그리고, 그 위를 뿌연 막으로 덮는다.
   손수건(굵은 브러시)으로 드래그하면 destination-out으로 막이 지워지며 아래 텍스트가 드러난다.
   완료 판정은 "그은 거리"가 아니라 글자 영역(bounding box) 안에서 실제로 투명해진
   픽셀 비율을 getImageData로 직접 측정해 HOLD_REVEAL_THRESHOLD(70%)를 넘었는지로 판단한다.
   포인터 캡처(setPointerCapture)를 사용해, 드래그 중 커서가 캔버스 경계를 잠깐 벗어나도
   mouseleave로 끊기지 않고 계속 같은 스트로크로 이어지게 한다. */
let _holdCtx = null;
let _holdCanvasEl = null;
let _holdBBox = null;
let _holdDrawing = false;
let _holdLastX = 0, _holdLastY = 0;
let _holdMoveCount = 0;
let _holdDone = false;
let _holdPuzzleId = null, _holdStage = null;
const HOLD_REVEAL_THRESHOLD = 0.7; // 글자 영역의 70% 이상 지워지면 완료
const HOLD_BRUSH_WIDTH = 32; // 손수건으로 문지르는 넓은 브러시

function initHoldCanvas(puzzleId, stage, revealText){
  _holdPuzzleId = puzzleId;
  _holdStage = stage;
  const canvas = document.getElementById('holdCanvas');
  if (!canvas) return;
  _holdCanvasEl = canvas;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  _holdCtx = canvas.getContext('2d');
  if (!_holdCtx) return; // 캔버스 2D 컨텍스트를 지원하지 않는 환경 방어
  _holdDrawing = false;
  _holdDone = false;
  _holdMoveCount = 0;

  // 1) 숨겨진 답 텍스트를 선명한 붉은색으로 먼저 그림
  _holdCtx.globalCompositeOperation = 'source-over';
  _holdCtx.fillStyle = '#ff2b3d';
  _holdCtx.font = 'bold 28px "Segoe UI", sans-serif';
  _holdCtx.textAlign = 'center';
  _holdCtx.textBaseline = 'middle';
  _holdCtx.shadowColor = 'rgba(255,40,60,0.65)';
  _holdCtx.shadowBlur = 10;
  _holdCtx.fillText(revealText, canvas.width / 2, canvas.height / 2);
  _holdCtx.shadowBlur = 0;

  // 텍스트가 그려진 영역(바운딩 박스)을 기록 — 완료 판정은 이 영역 안에서만 측정
  const metrics = _holdCtx.measureText(revealText);
  const asc = metrics.actualBoundingBoxAscent || 16;
  const desc = metrics.actualBoundingBoxDescent || 10;
  const pad = 10;
  _holdBBox = {
    x: Math.max(0, canvas.width / 2 - metrics.width / 2 - pad),
    y: Math.max(0, canvas.height / 2 - asc - pad),
    w: Math.min(canvas.width, metrics.width + pad * 2),
    h: Math.min(canvas.height, asc + desc + pad * 2)
  };

  // 2) 그 위를 뿌연 막(김 서림)으로 덮음
  _holdCtx.fillStyle = '#33363d';
  _holdCtx.fillRect(0, 0, canvas.width, canvas.height);
  _holdCtx.lineWidth = HOLD_BRUSH_WIDTH;
  _holdCtx.lineCap = 'round';
  _holdCtx.lineJoin = 'round';

  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const start = (e) => {
    if (_holdDone) return;
    if (canvas.setPointerCapture && e.pointerId != null){
      try { canvas.setPointerCapture(e.pointerId); } catch(err){}
    }
    _holdDrawing = true;
    const [x, y] = getPos(e);
    _holdLastX = x; _holdLastY = y;
    const label = document.getElementById('holdLabel');
    if (label) label.style.opacity = '0';
    scratchAt(x, y, x, y);
  };
  const move = (e) => {
    if (!_holdDrawing || _holdDone) return;
    const [x, y] = getPos(e);
    scratchAt(_holdLastX, _holdLastY, x, y);
    _holdLastX = x; _holdLastY = y;
    // 매 이동마다 픽셀을 읽는 건 낭비라 몇 번에 한 번씩만 실제 비율을 측정
    _holdMoveCount++;
    if (_holdMoveCount % 3 === 0 && checkRevealPercent() >= HOLD_REVEAL_THRESHOLD) finishHoldWriting();
  };
  const end = (e) => {
    _holdDrawing = false;
    if (canvas.releasePointerCapture && e.pointerId != null){
      try { canvas.releasePointerCapture(e.pointerId); } catch(err){}
    }
    if (!_holdDone && checkRevealPercent() >= HOLD_REVEAL_THRESHOLD) finishHoldWriting();
  };

  // Pointer Events는 마우스/펜/터치를 하나로 통합해서 처리해줌
  canvas.onpointerdown = start;
  canvas.onpointermove = move;
  canvas.onpointerup = end;
  canvas.onpointercancel = end;
}
function scratchAt(x1, y1, x2, y2){
  _holdCtx.globalCompositeOperation = 'destination-out';
  _holdCtx.beginPath();
  _holdCtx.moveTo(x1, y1);
  _holdCtx.lineTo(x2, y2);
  _holdCtx.stroke();
}
/* 글자 바운딩 박스 안에서 실제로 투명해진(지워진) 픽셀 비율을 측정 */
function checkRevealPercent(){
  if (!_holdCtx || !_holdBBox || !_holdCanvasEl) return 0;
  const x = Math.floor(_holdBBox.x), y = Math.floor(_holdBBox.y);
  const w = Math.min(Math.ceil(_holdBBox.w), _holdCanvasEl.width - x);
  const h = Math.min(Math.ceil(_holdBBox.h), _holdCanvasEl.height - y);
  if (w <= 0 || h <= 0) return 0;
  const data = _holdCtx.getImageData(x, y, w, h).data;
  let clearPixels = 0;
  const totalPixels = w * h;
  for (let i = 3; i < data.length; i += 4){
    if (data[i] < 40) clearPixels++; // 알파가 낮으면(거의 투명) 지워진 픽셀로 침
  }
  return clearPixels / totalPixels;
}
function finishHoldWriting(){
  if (_holdDone) return;
  _holdDone = true;
  // 남은 막도 마저 걷어내 답 전체가 드러나게 함
  if (_holdCtx && _holdCanvasEl){
    _holdCtx.globalCompositeOperation = 'destination-out';
    _holdCtx.fillRect(0, 0, _holdCanvasEl.width, _holdCanvasEl.height);
  }
  setTimeout(() => {
    const p = PUZZLES[_holdPuzzleId];
    const fb = document.getElementById('puzzleFeedback');
    advanceStage(_holdPuzzleId, p, _holdStage, fb);
  }, 550);
}
