/* ===========================================================
   data.js — 게임 데이터 계층
   상태(state)와 정적 데이터(PUZZLES, LOCKS, ROOMS)를 정의합니다.
   화면을 그리거나 로직을 처리하는 코드는 여기에 두지 않습니다.
=========================================================== */

/* 테스트용 자유 이동 모드 — true면 퍼즐 클릭 무시 + 모든 문/서랍이 열린 것처럼 취급됩니다.
   실제 플레이 테스트로 되돌리려면 false로 바꾸세요. */
const DEBUG_FREE_ROAM = true;

const state = {
  currentRoom: 'classroom',
  inventory: [],
  solved: {},
  unlocked: {},
  power: false,
  startTime: Date.now(),
  finished: false
};

/* ---------- 퍼즐 데이터 ---------- */
const PUZZLES = {
  p_board: {
    title: '칠판 - 합계 구하기', type: 'blank',
    code: 'int sum = 0;\nfor (int i = 1; i <= 5; i{{blank}}) {\n    sum += i;\n}\nSystem.out.println(sum);',
    answer: '++', digit: '5',
    hint: '반복문의 증감식을 채워보세요. (1부터 5까지 1씩)'
  },
  p_locker: {
    title: '사물함 - 최댓값 찾기', type: 'output',
    code: 'int[] nums = {3, 7, 2, 9, 4};\nint max = nums[0];\nfor (int i = 1; i < nums.length; i++) {\n    if (nums[i] > max) {\n        max = nums[i];\n    }\n}\nSystem.out.println(max);',
    answer: '9', digit: '9',
    hint: '배열에서 가장 큰 값을 찾는 코드예요.'
  },
  p_bulletin: {
    title: '게시판 - 합계의 나머지', type: 'output',
    code: 'int[] arr = {2, 4, 6, 8};\nint total = 0;\nfor (int n : arr) {\n    total += n;\n}\nSystem.out.println(total % 10);',
    answer: '0', digit: '0',
    hint: '배열 합을 구한 뒤 10으로 나눈 나머지예요.'
  },
  p_study: {
    title: '스터디실 문에 붙은 메모', type: 'blank',
    code: 'int count = 0;\nwhile (count {{blank}} 3) {\n    count++;\n}\nSystem.out.println(count);',
    answer: '<', digit: '3',
    hint: 'count가 3이 될 때까지 반복하려면?'
  },
  p_restroom: {
    title: '낙서 - 문자열 이어붙이기', type: 'output', flavor: true,
    code: 'String a = "ESC";\nString b = "APE";\nSystem.out.println(a + b);',
    answer: 'ESCAPE',
    hint: '문자열 두 개를 이어 붙이면?'
  },
  p_extinguisher: {
    title: '소화전 - 배열 인덱스', type: 'blank',
    code: 'int[] codes = {4, 6, 8, 2};\nSystem.out.println(codes[{{blank}}]);',
    answer: '1', digit: '6',
    hint: '두 번째 원소(인덱스 1)를 출력하려면?'
  },
  p_frontdesk: {
    title: '방문자 명단 - 조건부 보너스', type: 'output',
    code: 'int score = 82;\nint bonus = (score >= 80) ? 7 : 0;\nSystem.out.println(bonus);',
    answer: '7', digit: '7',
    hint: '삼항 연산자의 조건을 따라가 보세요.'
  },
  p_breaker: {
    title: '차단기함 - 전원 복구', type: 'blank', noDigit: true,
    code: 'int power = 0;\npower {{blank}} 100;\nSystem.out.println(power);',
    answer: '+=',
    hint: 'power에 100을 더해서 대입하려면?'
  },
  p_callcode: {
    title: '호출 패널 - 최종 코드', type: 'output',
    code: 'int a = 6, b = 7;\nSystem.out.println(a * b - 5);',
    answer: '37', digit: '37',
    hint: '곱셈 먼저, 그 다음 뺄셈이에요.'
  }
};

/* ---------- 잠금(문/서랍) 데이터 ---------- */
const LOCKS = {
  classroomDoor: { require: ['p_board', 'p_locker'], reward: { id: 'cardkey', name: '카드키', icon: '🔑' } },
  studyroomDoor: { require: ['p_bulletin', 'p_study'], reward: { id: 'battery', name: '배터리', icon: '🔋' } },
  frontdeskDrawer: { require: ['p_extinguisher', 'p_frontdesk'], reward: { id: 'masterkey', name: '마스터키', icon: '🗝️' } },
  elevatorCall: { require: ['p_callcode'], reward: null }
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
    connections: [ { label: '복도(앞)', dest: 'hallwayFront', lockId: 'classroomDoor' } ],
    scene(s){
      return wrapScene(`
        ${windowDeco(380,30,220,90)}
        ${deskCluster(70,190)}
        ${blackboard(40,50,'p_board', !!s.solved.p_board)}
        ${locker(540,110,'p_locker', !!s.solved.p_locker)}
        ${doorLocked(578,86,52,176,'classroomDoor','hallwayFront', !!s.unlocked.classroomDoor)}
      `, '#3a141d');
    }
  },
  hallwayFront: {
    name: '복도(앞)', desc: '본 강의실과 화장실 쪽으로 이어지는 조용한 통로.',
    connections: [
      { label: '본 강의실', dest: 'classroom' },
      { label: '화장실', dest: 'restroom' },
      { label: '복도(뒤)', dest: 'hallwayBack' }
    ],
    background: 'img/corridor.jpg',
    hotspots: []
  },
  studyroom: {
    name: '스터디실', desc: '문을 열고 들어왔다. 책상 위에 배터리가 놓여 있었다.',
    connections: [ { label: '복도(뒤)', dest: 'hallwayBack' } ],
    scene(){
      return wrapScene(`
        ${windowDeco(360,40,220,90)}
        ${bookshelfDeco(60,90)}
        ${deskChairDeco(320,160)}
      `, '#331319');
    }
  },
  restroom: {
    name: '화장실', desc: '가벼운 분위기 환기용 공간.',
    connections: [ { label: '복도(앞)', dest: 'hallwayFront' } ],
    scene(s){
      return wrapScene(`
        ${sinkMirror(250,90,'p_restroom', !!s.solved.p_restroom)}
        ${stallDeco(460,110)}
        ${stallDeco(530,110)}
      `, '#301218');
    }
  },
  hallwayBack: {
    name: '복도(뒤)', desc: '스터디룸 · 인포메이션 · 엘리베이터가 모여 있는 중심 구역.',
    connections: [
      { label: '복도(앞)', dest: 'hallwayFront' },
      { label: '스터디실', dest: 'studyroom', lockId: 'studyroomDoor' },
      { label: '인포데스크', dest: 'frontdesk' },
      { label: '엘리베이터 앞', dest: 'elevatorFront' }
    ],
    scene(s){
      return wrapScene(`
        ${signPlate(430, 60, 160, 'BY MEDIA', 'CLASS ROOM 01')}
        ${bulletinBoard(40,60,'p_bulletin', !!s.solved.p_bulletin)}
        ${doorLocked(180,86,110,176,'studyroomDoor','studyroom', !!s.unlocked.studyroomDoor)}
        ${pinnedNote(138,150,'p_study', !!s.solved.p_study)}
        ${extinguisherBox(560,150,'p_extinguisher', !!s.solved.p_extinguisher)}
      `, '#341019');
    }
  },
  frontdesk: {
    name: '아카데미 프론트', desc: '안내데스크. 서랍이 잠겨 있다.',
    connections: [ { label: '복도(뒤)', dest: 'hallwayBack' } ],
    background: 'img/frontdesk.jpg',
    hotspots: [] // TODO: 방문자 명단(p_frontdesk), 서랍(frontdeskDrawer) 위치 확정되면 추가
  },
  elevatorFront: {
    name: '엘리베이터 앞',
    desc(s){ return s.power ? '전원이 복구됐다.' : '전원이 꺼져 있다.'; },
    connections: [ { label: '복도(뒤)', dest: 'hallwayBack' } ],
    scene(s){
      return wrapScene(`
        ${breakerBox(60,140,'breaker', !!s.power)}
        ${callPanel(500,150,'callpanel', !!s.power)}
        ${elevatorDoors(230,90,180,170,'elevatorCall','elevatorInside', !!s.unlocked.elevatorCall)}
      `, '#241014');
    }
  },
  elevatorInside: {
    name: '엘리베이터 안', desc: '문이 닫히고, 1층으로 내려간다...',
    connections: [],
    scene(){
      return wrapScene(`
        <rect x="180" y="20" width="280" height="242" fill="#4a4a4d" stroke="#1a1a1c" stroke-width="4"/>
        <rect x="200" y="40" width="240" height="30" rx="3" fill="#6b1f2e"/>
      `, '#1c0d10');
    }
  }
};

/* ---------- 유틸 ---------- */
function lockCode(lockId){ return LOCKS[lockId].require.map(pid => PUZZLES[pid].digit).join(''); }
function lockSolved(lockId){ return LOCKS[lockId].require.every(pid => state.solved[pid]); }
