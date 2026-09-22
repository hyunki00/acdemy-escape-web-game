/* ===========================================================
   data.js — 게임 데이터 계층
   상태(state)와 정적 데이터(PUZZLES, LOCKS, ROOMS)를 정의합니다.
   화면을 그리거나 로직을 처리하는 코드는 여기에 두지 않습니다.
=========================================================== */

/* 테스트용 자유 이동 모드 — true면 퍼즐 클릭 무시 + 모든 문/서랍이 열린 것처럼 취급됩니다.
   실제 플레이 테스트로 되돌리려면 false로 바꾸세요. */
const DEBUG_FREE_ROAM = false;

/* 소지품 바에 항상 미리 배열해둘 빈 칸 개수 (아이템을 주우면 순서대로 채워짐) */
const INVENTORY_SLOTS = 4;

/* 잠금(도어락) 모달 공통 텍스트. 개별 LOCKS 항목에 같은 이름의 필드를 넣으면
   그 잠금에서만 다른 문구로 재정의됩니다 (예: LOCKS.xxx.wrong = '...'). */
const LOCK_TEXT = {
  title: '암호를 입력해주세요',
  subtext(len){ return `${len}자리 비밀번호를 입력하세요.`; },
  wrong: '틀렸어요. 다시 시도해보세요.',
  success: '✓ 열렸다!'
};

const state = {
  currentRoom: 'classroom',
  inventory: [],
  solved: {},
  unlocked: {},
  seenDialogue: {},
  power: false,
  startTime: Date.now(),
  finished: false
};

/* ---------- 퍼즐 데이터 ----------
   answer는 문자열 하나 또는 배열([...])일 수 있습니다. 배열이면 그 중 아무거나 맞으면 정답 처리.
   (예: i++ / i += 1 / i = i + 1 처럼 같은 의미의 다른 문법을 모두 인정할 때 사용)
   채점 시 공백과 끝의 세미콜론은 무시하고 비교합니다 (puzzle.js의 normalizeCode 참고). */
const PUZZLES = {
  p_computer: {
    title: '컴퓨터 - 로그인', type: 'login', flavor: true,
    subtext: '로그인 정보를 입력하세요.',
    idAnswer: 'BYEMEDIA5G-2', pwAnswer: 'byemedia1',
    hint: 'ID: BYEMEDIA5G-2 / PW: byemedia1',
    stage1SuccessMsg: '✓ 로그인 성공! 화면이 전환된다...',
    followUp: {
      title: '뉴스 사이트', type: 'newsfeed',
      subtext: '검색 기록에 남아있던 페이지가 열린다.',
      articles: [
        {
          title: '[속보] ○○아카데미 신입 강사 ○○○, 수강생 살인 혐의로 체포',
          body: '금일 오전, ○○아카데미 소속 신입 강사가 수강생 살해 혐의로 긴급 체포됐다. 경찰은 정확한 동기를 조사 중이라고 밝혔다.'
        },
        {
          title: '충격) 한 아카데미의 기괴한 감금 살인 수법',
          body: '범인은 엘리베이터 안에 숨어 수강생들을 가둬놓고, 그들이 탈출하려 발버둥 치는 모습을 지켜보며 즐기다가 유일한 탈출구인 엘리베이터에 들어오는 순간 살해한 것으로 드러났다.'
        },
        {
          title: '[특보] 종로 소재 ○○아카데미에 숨어든 연쇄살인범?',
          body: '종로의 한 IT 교육 아카데미에서 신원 미상의 인물이 수강생들을 노리고 있다는 제보가 잇따르고 있다. 경찰은 관련 여부를 확인 중이다.'
        }
      ]
    }
  },
  p_board: {
    title: '낯익은 문장이다. 분명 빈칸에 들어갈 단어가...', type: 'blank', flavor: true,
    subtext: '분명 내가 듣고 있는 강의명 같은데?.',
    successMsg: '✓ 정보를 다 모았다! 이제 이 정보들을 직접 조합해서 문 앞 키패드에 입력해보자.',
    code: '[IBM x RedHat] AI {{blank}} - AX Academy 8기',
    answer: 'Transformation', digit: '20260847',
    hint: '지금 듣고 있는 강의 이름 그대로예요.',
    stage1SuccessMsg: '✓ 정답!',
    followUp: {
      title: '뒤이어 떠오른 창 하나', type: 'info',
      subtext: '언제더라...?',
      prompt: '[IBM x RedHat] AI Transformation - AX Academy 8기의 첫 오리엔테이션 날짜는?',
      hint: '아까 빔프로젝터 화면에서 봤던 "+22"도 같이 떠올려보자.'
    }
  },
  p_locker: {
    title: '사물함 - 최댓값 찾기', type: 'output',
    code: 'let nums = [3, 7, 2, 9, 4];\nlet max = nums[0];\nfor (let i = 1; i < nums.length; i++) {\n    if (nums[i] > max) {\n        max = nums[i];\n    }\n}\nconsole.log(max);',
    answer: '9', digit: '9',
    hint: '배열에서 가장 큰 값을 찾는 코드예요.'
  },
  p_bulletin: {
    title: '게시판 - 합계의 나머지', type: 'output',
    code: 'let arr = [2, 4, 6, 8];\nlet total = 0;\nfor (const n of arr) {\n    total += n;\n}\nconsole.log(total % 10);',
    answer: '0', digit: '0',
    hint: '배열 합을 구한 뒤 10으로 나눈 나머지예요.'
  },
  p_study: {
    title: '스터디실 문에 붙은 메모', type: 'blank',
    code: 'let count = 0;\nwhile (count {{blank}} 3) {\n    count++;\n}\nconsole.log(count);',
    answer: '<', digit: '3',
    hint: 'count가 3이 될 때까지 반복하려면?'
  },
  p_restroom: {
    title: '거울 낙서', type: 'hold', flavor: true,
    requiresItem: 'handkerchief',
    missingItemMsg: '[...닦을 만한 게 있으면 지울 수 있을 것 같아.]',
    prompt: '누가 범인인 것 같아?',
    revealText: '신지원',
    hint: '손수건으로 뽀득뽀득 문질러서 닦아보자.',
    successMsg: '✓ 흐릿하게 적혀 있던 이름이 드러난다.',
    grantItem: { id: 'rustykey', name: '녹슨 열쇠', icon: '🔑', image: 'img/item-rustykey.png' }
  },
  p_extinguisher: {
    title: '소화전 - 배열 인덱스', type: 'blank',
    code: 'let codes = [4, 6, 8, 2];\nconsole.log(codes[{{blank}}]);',
    answer: '1', digit: '6',
    hint: '두 번째 원소(인덱스 1)를 출력하려면?'
  },
  p_frontdesk: {
    title: '방문자 명단 - 조건부 보너스', type: 'output',
    code: 'let score = 82;\nlet bonus = (score >= 80) ? 7 : 0;\nconsole.log(bonus);',
    answer: '7', digit: '7',
    hint: '삼항 연산자의 조건을 따라가 보세요.'
  },
  p_breaker: {
    title: '차단기함 - 전원 복구', type: 'blank', noDigit: true,
    code: 'let power = 0;\n{{blank}}\nconsole.log(power);',
    answer: ['power += 100', 'power = power + 100'],
    hint: 'power에 100을 더해서 대입하려면? — power += 100; 이든 power = power + 100; 이든 다 정답이에요.'
  },
  p_callcode: {
    title: '호출 패널 - 마지막 메시지', type: 'choice',
    prompt: '호출 버튼 위, 익숙한 손글씨로 작은 메모가 붙어 있다:\n\n"속아줘서 고마워. 이제 집에 가자. — 담당 강사"\n\n그 밑에 마지막 질문 하나가 더 적혀 있다: "오늘 밤 이 학원의 주인공은 누구였을까?"',
    options: ['이름 모를 침입자', '경비원 아저씨', '유령', '처음부터 나를 지켜보던 담당 강사님'],
    correct: 3, digit: '37',
    hint: '손글씨체를 다시 보자. 낯설지 않다.'
  }
};

/* ---------- 잠금(문/서랍) 데이터 ---------- */
const LOCKS = {
  classroomDoor: { require: ['p_board'], reward: null },
  elevatorCall: { require: ['p_callcode'], reward: null },
  // 스터디룸 상자 — 회전 다이얼(콤보락) 스타일. code/문구는 전부 임시이니 나중에 실제 값으로 교체.
  studyBox: {
    code: '7878', style: 'combo',
    reward: { id: 'smartphone', name: '스마트폰', icon: '📱', image: 'img/item-smartphone.png' },
    title: '(임시) 자물쇠를 맞춰보자',
    subtext: '(임시) 다이얼을 돌려 숫자를 맞춰보세요.',
    wrong: '(임시) 맞지 않는 것 같다.',
    success: '(임시) 찰칵, 자물쇠가 열렸다!'
  }
};

/* ===========================================================
   씬(배경) 그리기 함수들
   각 함수는 SVG 조각을 문자열로 반환합니다.
   data-kind / data-id / data-dest 속성이 붙은 <g>가 클릭 가능한 "사물"입니다.
=========================================================== */
/* ---------- 방 데이터 (배경 + 사물) ---------- */
const ROOMS = {
  classroom: {
    name: '본 강의실', desc: '5강의실. 야자 중 잠들었던 곳. 문이 잠겨 있다.',
    connections: [ { label: '복도(좌)', dest: 'hallwayLeft', lockId: 'classroomDoor',
      introImage: 'img/classroom-doorlock.png',
      introLine: '뭐야, x발. 누가 여기에다 도어락을 설치해놨어?!' } ],
    background(s){ return s.projectorLit ? 'img/classroom-lit.png' : 'img/classroom.png'; },
    hotspots: [
      { kind: 'puzzle', id: 'p_board', label: '모니터 화면',
        line: '내 모니터만 이상하게 켜져 있다. 화면에 뭔가 떠 있는데?',
        points: [[0,60.65],[0,84.63],[5.57,84.72],[2.6,86.39],[2.14,87.22],[2.34,88.52],[4.9,89.72],[8.44,89.54],[11.93,87.22],[11.67,85.65],[10.16,84.63],[17.19,84.26],[17.19,60.65]] },
      { kind: 'flavor', id: 'f_chair', label: '의자',
        line: '누군가 앉아있던 것처럼, 의자가 살짝 돌아가 있어.',
        lineFirst: '의자 밑에 뭔가 떨어져 있다. 손전등? 꺼져 있었지만 아직 배터리가 남아있어.',
        grantItem: { id: 'flashlight', name: '손전등', icon: '🔦', image: 'img/item-flashlight.png' },
        points: [[82.24,67.59],[80.42,66.76],[76.51,67.13],[74.43,68.24],[72.71,70.46],[72.29,72.96],[73.18,80.28],[69.69,80.65],[70.26,82.59],[69.69,84.72],[69.32,97.04],[69.84,96.85],[70.57,83.61],[74.74,86.94],[72.97,87.87],[72.45,89.35],[72.97,99.91],[73.7,99.91],[73.12,89.81],[73.59,88.61],[74.64,88.24],[74.84,84.91],[81.56,84.44],[81.93,78.33],[83.33,70.93],[83.23,69.17]] },
      { kind: 'flavor', id: 'f_projector', label: '빔프로젝터 화면',
        line: '화면에 뭔가가 적혀져 있는 것 같아. 하지만 어두워서 보이지 않아.',
        withItem: { requires: 'flashlight', setState: 'projectorLit', removeItem: 'flashlight',
          line: '손전등을 비추자 어둠에 가려져 있던 글자가 드러난다. +22라고 적혀있어.' },
        points: [[40.89,23.33],[41.56,25.46],[41.46,53.15],[59.06,53.15],[59.11,48.06],[64.11,48.06],[64.11,25.37],[64.69,23.33]] },
      { kind: 'flavor', id: 'f_ac', label: '에어컨',
        line: '에어컨은 꺼져 있어.',
        points: [[46.77,17.13],[47.14,21.11],[47.5,21.48],[57.81,21.48],[59.48,17.59],[59.48,17.13]] }
    ]
  },
  hallwayLeft: {
    name: '복도(좌)', desc: '본 강의실 · 복도(우) · 인포데스크로 이어지는 구역.',
    connections: [
      { label: '본 강의실', dest: 'classroom' },
      { label: '복도(우)', dest: 'hallwayRight' },
      { label: '인포데스크', dest: 'frontdesk' }
    ],
    background: 'img/corridor.png',
    hotspots: [
      { kind: 'flavor', id: 'f_hallwayDoor', label: '문',
        line: '복도 끝에 또 다른 문이 있다. 저 안쪽은 아직 확인하지 못했다.',
        points: [[46.88,36.67],[46.88,47.31],[52.34,47.31],[52.34,36.67]] },
      { kind: 'flavor', id: 'f_hallwayFloor', label: '바닥',
        line: '발밑 타일에 비상등 불빛이 어른거린다.',
        points: [[78.91,99.91],[71.2,83.98],[69.38,82.31],[62.03,67.04],[60.99,66.76],[52.97,47.59],[51.72,47.31],[46.15,47.59],[19.74,99.81]] }
    ]
  },
  studyroom: {
    name: '스터디룸', desc: '문을 열고 들어왔다. 책상 위에 배터리가 놓여 있었다.',
    connections: [ { label: '인포데스크', dest: 'frontdesk' } ],
    background(s){ return s.unlocked.studyBox ? 'img/studyroom-box-open.png' : 'img/studyroom-box-closed.png'; },
    hotspots: [
      { kind: 'flavor', id: 'f_vase', label: '화분',
        line: '마른 나뭇가지가 꽂힌 화분이다. 오래 돌보지 않은 듯하다.',
        withItem: { requires: 'glasses',
          line: '화분 뒤에 접힌 메모가 숨겨져 있다 — "오늘만 특별히, 답은 알아서 찾아봐 ㅎㅎ"',
          grantItem: { id: 'note', name: '하얀 쪽지', icon: '📝', image: 'img/item-note.png' } },
        points: [[9.58,42.31],[9.01,55.28],[10.26,60.19],[9.58,64.54],[8.44,62.04],[8.49,54.54],[6.46,48.98],[7.66,55.0],[7.66,62.78],[9.69,70.28],[9.64,72.59],[8.07,73.8],[8.44,75.37],[7.45,84.07],[8.65,93.61],[11.25,94.07],[12.5,91.67],[13.23,81.39],[12.14,75.37],[12.45,73.7],[11.04,72.41],[13.39,62.69],[15.31,60.65],[15.73,57.13],[14.58,60.19],[13.12,60.93],[12.92,57.78],[14.06,54.91],[14.27,51.11],[13.44,51.76],[12.08,58.52],[10.89,57.13],[9.74,52.78]] },
      { kind: 'flavor', id: 'f_studySign', label: '스터디룸 팻말',
        line: '"스터디룸 STUDY ROOM" — 문 옆에 붙은 팻말이다.',
        points: [[73.28,5.28],[73.28,24.35],[84.06,24.35],[83.96,5.28]] },
      { kind: 'lock', id: 'studyBox', label: '상자',
        showIf: s => !s.unlocked.studyBox,
        line: '(임시 대사) 낯선 상자가 놓여 있다. 자물쇠로 잠겨 있는 것 같다.',
        points: [[39.32,63.8],[39.58,71.11],[45.05,71.02],[45.62,71.11],[45.94,71.67],[47.55,71.67],[47.86,71.11],[53.96,70.83],[54.06,63.52],[53.12,61.2],[40.62,61.2]] },
      { kind: 'flavor', id: 'f_studyBoxOpen', label: '열린 상자',
        showIf: s => s.unlocked.studyBox,
        line: '(임시 대사) 열려 있는 상자다. 안을 다시 들여다본다.',
        points: [[40.05,58.7],[40.05,68.8],[39.01,72.22],[39.01,77.13],[39.38,77.78],[39.43,77.31],[45.99,77.31],[46.3,77.78],[47.81,77.31],[54.9,77.31],[54.9,71.67],[53.49,68.52],[53.75,62.31],[54.06,62.22],[54.06,60.37],[53.23,58.15],[40.42,58.06]] }
    ]
  },
  restroom: {
    name: '화장실', desc: '가벼운 분위기 환기용 공간.',
    connections: [ { label: '엘리베이터 앞', dest: 'elevatorFront' } ],
    background(s){ return s.solved.p_restroom ? 'img/restroom-broken.png' : 'img/restroom.png'; },
    hotspots: [
      { kind: 'puzzle', id: 'p_restroom', label: '거울',
        showIf: s => !s.solved.p_restroom,
        line: '거울에 낙서가 흐릿하게 남아있다. 뭔가 적혀 있는 것 같은데...',
        points: [[0.0,16.2],[0.1,63.7],[10.62,59.72],[10.52,22.04]] },
      { kind: 'flavor', id: 'f_brokenMirror', label: '깨진 거울',
        showIf: s => s.solved.p_restroom,
        line: '(임시 대사) 거울이 산산조각 나 있다. 깨진 조각 사이로 뭔가 반짝인다.',
        points: [[0.0,15.46],[0.0,63.89],[11.09,59.91],[11.41,59.17],[11.3,21.94]] },
      { kind: 'flavor', id: 'f_cabinet', label: '벽면 캐비닛',
        showIf: s => !s.solved.p_restroom,
        line: '작은 벽면 캐비닛이다. 손잡이를 당겨봐도 잠겨서 열리지 않는다.',
        withItem: { requires: 'rustykey', removeItem: 'rustykey', sound: 'Sound/cabinet-sfx.mp3',
          line: '(임시 대사) 녹슨 열쇠를 넣고 돌리자 캐비닛이 열렸다.' },
        points: [[63.59,44.07],[63.54,53.61],[64.95,53.89],[67.86,53.7],[67.97,52.69],[67.92,44.07]] },
      { kind: 'flavor', id: 'f_cabinet', label: '벽면 캐비닛',
        showIf: s => s.solved.p_restroom,
        line: '작은 벽면 캐비닛이다. 손잡이를 당겨봐도 잠겨서 열리지 않는다.',
        withItem: { requires: 'rustykey', removeItem: 'rustykey', sound: 'Sound/cabinet-sfx.mp3',
          line: '(임시 대사) 녹슨 열쇠를 넣고 돌리자 캐비닛이 열렸다.' },
        points: [[63.96,44.07],[63.85,44.44],[63.91,53.8],[64.17,53.98],[68.28,53.8],[68.39,53.61],[68.44,49.91],[68.39,44.17],[68.23,43.98]] },
      { kind: 'flavor', id: 'f_stalls', label: '화장실 칸막이',
        line: '칸막이 문들이 전부 닫혀 있다. 안에는 아무도 없는 것 같다.',
        points: [[40.36,20.83],[39.27,20.83],[39.27,26.3],[14.53,26.3],[14.53,65.0],[23.91,65.46],[23.18,75.19],[23.54,84.81],[40.26,84.63],[40.73,76.57],[43.07,77.41],[44.27,70.65],[45.89,70.56],[46.15,67.31],[48.02,65.56],[48.18,34.35]] }
    ]
  },
  hallwayRight: {
    name: '복도(우)', desc: '엘리베이터 앞으로 이어지는 구역.',
    connections: [
      { label: '복도(좌)', dest: 'hallwayLeft' },
      { label: '엘리베이터 앞', dest: 'elevatorFront' }
    ],
    background: 'img/corridor-right.png',
    hotspots: [
      { kind: 'flavor', id: 'f_rightFloor', label: '바닥',
        line: '바닥 타일 위로 비상등 붉은 빛이 길게 늘어져 있다.',
        points: [[68.65,99.91],[59.06,70.65],[54.32,58.89],[47.45,58.52],[47.4,51.11],[45.0,51.02],[26.25,85.46],[26.2,89.17],[20.78,99.91]] },
      { kind: 'flavor', id: 'f_exitSign', label: '비상구 표시등',
        line: '비상구 표시등이 정적 속에서 홀로 빛나고 있다.',
        points: [[45.47,29.44],[45.47,32.78],[48.33,32.78],[48.33,32.31],[48.28,32.22],[48.28,31.02],[48.33,30.93],[48.33,30.19],[48.39,30.09],[48.33,30.0],[48.33,29.44]] },
      { kind: 'flavor', id: 'f_classroom05', label: '05 강의실 팻말',
        line: '"BYEMIDEA 05 CLASS ROOM" — 문 안쪽은 캄캄해서 아무것도 보이지 않는다.',
        points: [[80.78,0.0],[60.52,27.13],[60.42,55.0],[94.58,94.35],[95.42,0.0]] }
    ] // TODO: 소화전(p_extinguisher) 위치 확정되면 추가
  },
  frontdesk: {
    name: '인포데스크', desc: '안내데스크. 인기척 없이 조용하다.',
    connections: [
      { label: '스터디룸', dest: 'studyroom' },
      { label: '복도(좌)', dest: 'hallwayLeft' }
    ],
    background: 'img/frontdesk.png',
    hotspots: [
      { kind: 'puzzle', id: 'p_computer', label: '모니터',
        line: '모니터가 꺼져 있다. 전원 버튼을 눌러보니 로그인 화면이 켜진다.',
        points: [[76.82,51.76],[76.77,65.83],[80.78,67.31],[80.52,69.17],[78.75,69.54],[78.7,70.28],[83.59,71.94],[85.83,71.39],[85.73,70.65],[82.76,69.72],[82.81,67.59],[89.9,69.17],[89.84,52.41]] },
      { kind: 'flavor', id: 'f_logo', label: 'BYEMEDIA 로고',
        line: '"BYEMEDIA TOGETHER" — 벽에 새겨진 회사 로고다.',
        points: [[81.72,31.3],[80.57,32.31],[79.64,34.35],[79.27,36.2],[79.22,39.17],[79.53,40.93],[80.47,43.15],[81.15,43.8],[82.24,44.07],[83.44,43.33],[84.48,41.67],[85.16,38.8],[85.21,36.3],[84.79,34.07],[84.06,32.5],[82.86,31.39]] },
      { kind: 'flavor', id: 'f_deskChair', label: '의자',
        line: '의자 하나가 카운터에서 살짝 빠져나와 있다.',
        lineFirst: '의자 아래 흰 손수건이 떨어져 있다 — 낯익은 자수가 새겨져 있다.',
        grantItem: { id: 'handkerchief', name: '흰 손수건', icon: '🤍', image: 'img/item-handkerchief.png' },
        points: [[40.73,61.11],[41.88,70.83],[42.66,72.41],[44.11,72.96],[44.64,74.07],[44.58,78.61],[42.5,79.63],[42.24,81.02],[42.81,81.76],[44.06,82.13],[47.4,81.67],[47.76,80.93],[47.55,79.72],[45.42,78.61],[45.42,73.61],[45.78,72.87],[48.91,71.94],[49.11,70.37],[48.44,69.44],[48.23,67.69],[47.86,66.94],[45.57,66.85],[44.84,65.09],[43.75,64.72],[42.81,61.85]] }
    ]
  },
  elevatorFront: {
    name: '엘리베이터 앞',
    desc(s){ return s.power ? '전원이 복구됐다.' : '전원이 꺼져 있다.'; },
    connections: [
      { label: '복도(우)', dest: 'hallwayRight' },
      { label: '화장실', dest: 'restroom' }
    ],
    background: 'img/elevator-front.png',
    hotspots: [
      { kind: 'lock', id: 'elevatorCall', dest: 'elevatorInside', label: '엘리베이터 문',
        points: [[39.74,0.0],[19.84,0.0],[22.6,99.91],[29.38,99.91],[34.53,92.59],[40.94,93.33],[41.46,92.5]] },
      { kind: 'flavor', id: 'f_maroonDoor', label: '문',
        line: '굳게 닫힌 문. 손잡이를 돌려봐도 꿈쩍하지 않는다.',
        sound: 'Sound/maroondoor-sfx.mp3',
        withItem: { requires: ['handkerchief', 'flashlight', 'glasses'],
          line: '문틈 사이로 강사님 명찰이 떨어져 있는 게 보인다. 그제야 알겠다 — 정전도, 잠긴 문들도, 전부 강사님의 장난이었다는 걸. 마침 배전함 쪽에서 "달칵" 하는 소리와 함께 불빛이 돌아온다.',
          setPower: true },
        points: [[47.92,18.8],[48.7,80.19],[49.17,79.44],[49.22,74.35],[53.75,67.69],[56.2,67.59],[55.78,23.61]] },
      { kind: 'flavor', id: 'f_waterCooler', label: '정수기',
        line: '전원이 나가 정수기 표시등도 꺼져 있다.',
        points: [[72.6,41.11],[71.46,42.87],[71.15,50.19],[71.93,51.3],[72.08,54.63],[71.2,55.09],[70.99,56.02],[71.2,72.13],[72.4,73.7],[76.98,73.89],[78.07,74.44],[78.8,72.5],[78.85,66.11],[79.58,65.74],[79.43,64.44],[78.96,63.89],[79.27,53.06],[78.85,51.48],[79.95,50.28],[80.1,40.74],[79.27,40.0],[76.56,40.0],[75.83,41.2]] },
      { kind: 'callpanel', id: 'elevatorCallPanel', label: '호출 버튼',
        lineOff: '버튼을 눌러봤지만 반응이 없다. 전원이 나간 것 같다.',
        line: '버튼에 불이 들어왔다. 눌러보자.',
        points: [[42.29,41.2],[41.25,41.2],[41.2,41.67],[41.25,51.3],[41.41,51.48],[42.45,51.02]] }
    ] // TODO: 차단기함(breaker) 위치 확정되면 추가
  },
  elevatorInside: {
    name: '엘리베이터', desc: '문이 닫히고, 1층으로 내려간다...',
    connections: [],
    background: 'img/elevator-inside.png',
    hotspots: []
  }
};

/* ---------- 유틸 ---------- */
function lockCode(lockId){
  const lock = LOCKS[lockId];
  if (lock.code) return lock.code; // 퍼즐 연계 없이 직접 코드가 정해진 잠금(예: 상자 자물쇠)
  return lock.require.map(pid => PUZZLES[pid].digit).join('');
}
function lockSolved(lockId){
  const lock = LOCKS[lockId];
  if (!lock.require) return true;
  return lock.require.every(pid => state.solved[pid]);
}
