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
    const def = getStageDef(p, stage);
    if (p.noDigit) onBreakerSolved();
    if (p.grantItem) addInventory(p.grantItem);
    if (p.completeSound) playSfx(p.completeSound);
    if (def.silentClose){
      // 완료 메시지 없이 바로 닫힘 (예: 정보만 확인하는 화면)
      closeModal();
    } else {
      fb.className = p.flavor ? 'feedback info' : 'feedback ok';
      fb.textContent = p.flavor ? (p.successMsg || '✓ 정답!') : `✓ 정답! 코드 조각 확보: ${p.digit}`;
      // 완료 메시지를 잠깐 보여준 뒤 모달을 자동으로 닫음(이전 화면 위에 메시지만 얹힌 채
      // 계속 떠 있던 문제 방지). 다시 열면 openPuzzle이 "이미 확인함" 상태로 깔끔하게 그려줌.
      setTimeout(() => { closeModal(); }, 900);
    }
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
  let breakerNeedsInit = null;

  if (def.type === 'info'){
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
          <div class="hold-answer-text" id="holdAnswerText"></div>
          <canvas id="holdCanvas" class="hold-canvas"></canvas>
          <span class="hold-label" id="holdLabel">손수건으로 뽀득뽀득 문질러 닦아보자...</span>
        </div>
        <div style="text-align:right;"><button class="btn secondary" onclick="showHint('${puzzleId}', '${stage}')">힌트</button></div>`;
    }
  } else if (def.type === 'breakerbox'){
    // 9개 차단기 + 12개 전선. 차단기를 누르면 주변 전선이 전부 토글됨.
    // 모든 전선이 켜져야 완료(체크는 pressBreaker 안에서 매번 수행).
    subText = def.subtext || '차단기 버튼을 눌러서 모든 배선에 불을 켜보자.';
    if (already){
      bodyExtra = '';
    } else {
      breakerNeedsInit = { puzzleId, stage, def };
      bodyExtra = renderBreakerGrid(def);
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
  if (breakerNeedsInit) initBreakerBox(breakerNeedsInit.puzzleId, breakerNeedsInit.stage, breakerNeedsInit.def);
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
let _holdDrawing = false;
let _holdLastX = 0, _holdLastY = 0;
let _holdMoveCount = 0;
let _holdDone = false;
let _holdPuzzleId = null, _holdStage = null;
const HOLD_REVEAL_THRESHOLD = 0.7; // 캔버스 전체 면적의 70% 이상 지워지면 완료
const HOLD_BRUSH_WIDTH = 32; // 손수건으로 문지르는 넓은 브러시

function initHoldCanvas(puzzleId, stage, revealText){
  _holdPuzzleId = puzzleId;
  _holdStage = stage;

  // 답 텍스트는 캔버스 안에 그리지 않고, 캔버스 "아래" 별도 DOM 레이어에 둔다.
  // (캔버스 위에 그린 뒤 덮으면 덮개가 텍스트 픽셀 자체를 지워버려서 긁어도 안 나타나는 문제가 있었음)
  const textEl = document.getElementById('holdAnswerText');
  if (textEl) textEl.textContent = revealText;

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

  // 캔버스 전체를 뿌연 막(김 서림)으로 채움 — 캔버스는 오직 "덮개"로만 쓰임
  _holdCtx.globalCompositeOperation = 'source-over';
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
/* 캔버스(덮개) 전체 면적 중 실제로 투명해진(지워진) 픽셀 비율을 측정 */
function checkRevealPercent(){
  if (!_holdCtx || !_holdCanvasEl) return 0;
  const w = _holdCanvasEl.width, h = _holdCanvasEl.height;
  if (w <= 0 || h <= 0) return 0;
  const data = _holdCtx.getImageData(0, 0, w, h).data;
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

/* ---------- 차단기함(breakerbox) — Lights Out 방식 ----------
   3x3 배열의 차단기(0~8, row*3+col). 차단기를 누르면 상하좌우로 인접한 전선이 전부 토글됨.
   전선은 두 차단기 사이를 정확히 하나씩 잇는데(가로 6개+세로 6개=12개), 인접한 두 차단기가
   "하나는 홀수 번, 하나는 짝수 번 눌린" 상태가 되면 그 사이 전선은 항상 켜진다(체스판 색칠
   원리) — 그래서 고장난 버튼이 한쪽 색 그룹에만 몰려 있으면 반대쪽 색 그룹만 눌러서 항상
   풀 수 있다. brokenBreakers는 반드시 한쪽 색 그룹 안에서만 골라야 항상 풀리는 게 보장됨. */
function breakerNeighbors(idx, cols, rows){
  const r = Math.floor(idx / cols), c = idx % cols;
  const list = [];
  if (c > 0) list.push(idx - 1);
  if (c < cols - 1) list.push(idx + 1);
  if (r > 0) list.push(idx - cols);
  if (r < rows - 1) list.push(idx + cols);
  return list;
}
function wireKey(a, b){ return Math.min(a, b) + '-' + Math.max(a, b); }

function renderBreakerGrid(def){
  const cols = def.gridCols || 3, rows = def.gridRows || 3;
  const broken = def.brokenBreakers || [];
  const gridW = 2 * cols - 1, gridH = 2 * rows - 1;
  const colTemplate = Array.from({length: gridW}, (_, i) => i % 2 === 0 ? '56px' : '26px').join(' ');
  const rowTemplate = Array.from({length: gridH}, (_, i) => i % 2 === 0 ? '56px' : '26px').join(' ');
  let html = `<div class="breaker-grid" style="grid-template-columns:${colTemplate}; grid-template-rows:${rowTemplate};">`;
  for (let r = 0; r < gridH; r++){
    for (let c = 0; c < gridW; c++){
      if (r % 2 === 0 && c % 2 === 0){
        const idx = (r / 2) * cols + (c / 2);
        const isBroken = broken.includes(idx);
        html += `<button type="button" class="breaker-btn${isBroken ? ' broken' : ''}" id="breaker${idx}"
          ${isBroken ? 'disabled title="고장난 버튼"' : `onclick="pressBreaker(${idx})"`}>⏻</button>`;
      } else if (r % 2 === 0 && c % 2 === 1){
        const left = (r / 2) * cols + ((c - 1) / 2);
        const key = wireKey(left, left + 1);
        html += `<div class="wire wire-h" id="wire-${key}"></div>`;
      } else if (r % 2 === 1 && c % 2 === 0){
        const top = ((r - 1) / 2) * cols + (c / 2);
        const key = wireKey(top, top + cols);
        html += `<div class="wire wire-v" id="wire-${key}"></div>`;
      } else {
        html += `<div class="breaker-spacer"></div>`;
      }
    }
  }
  html += '</div>';
  return html;
}

let _breakerPuzzleId = null, _breakerStage = null;
let _breakerPressed = [];
let _breakerWires = {};
let _breakerBroken = [];
let _breakerCols = 3, _breakerRows = 3;

function initBreakerBox(puzzleId, stage, def){
  _breakerPuzzleId = puzzleId;
  _breakerStage = stage;
  _breakerCols = def.gridCols || 3;
  _breakerRows = def.gridRows || 3;
  const total = _breakerCols * _breakerRows;
  _breakerPressed = new Array(total).fill(false);
  _breakerBroken = def.brokenBreakers || [];
  _breakerWires = {};
  for (let i = 0; i < total; i++){
    breakerNeighbors(i, _breakerCols, _breakerRows).forEach(n => { if (n > i) _breakerWires[wireKey(i, n)] = false; });
  }
}
function pressBreaker(idx){
  if (_breakerPressed[idx] == null || _breakerBroken.includes(idx)) return;
  _breakerPressed[idx] = !_breakerPressed[idx];
  const btn = document.getElementById('breaker' + idx);
  if (btn) btn.classList.toggle('active', _breakerPressed[idx]);
  breakerNeighbors(idx, _breakerCols, _breakerRows).forEach(n => {
    const key = wireKey(idx, n);
    _breakerWires[key] = !_breakerWires[key];
    const wireEl = document.getElementById('wire-' + key);
    if (wireEl) wireEl.classList.toggle('lit', _breakerWires[key]);
  });
  const allLit = Object.values(_breakerWires).every(Boolean);
  if (allLit){
    const p = PUZZLES[_breakerPuzzleId];
    const fb = document.getElementById('puzzleFeedback');
    advanceStage(_breakerPuzzleId, p, _breakerStage, fb);
  }
}
