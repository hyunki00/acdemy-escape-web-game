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
  seenDialogue: {},
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
    connections: [ { label: '복도(좌)', dest: 'hallwayLeft', lockId: 'classroomDoor' } ],
    background: 'img/classroom.png',
    hotspots: [
      { kind: 'puzzle', id: 'p_board', label: '모니터 화면',
        line: '저 모니터만 이상하게 켜져 있다. 화면에 낯익은 코드가 떠 있다.',
        points: [[0,60.65],[0,84.63],[5.57,84.72],[2.6,86.39],[2.14,87.22],[2.34,88.52],[4.9,89.72],[8.44,89.54],[11.93,87.22],[11.67,85.65],[10.16,84.63],[17.19,84.26],[17.19,60.65]] },
      { kind: 'flavor', id: 'f_chair', label: '의자',
        line: '누군가 앉아있던 것처럼, 의자가 살짝 돌아가 있다.',
        points: [[82.24,67.59],[80.42,66.76],[76.51,67.13],[74.43,68.24],[72.71,70.46],[72.29,72.96],[73.18,80.28],[69.69,80.65],[70.26,82.59],[69.69,84.72],[69.32,97.04],[69.84,96.85],[70.57,83.61],[74.74,86.94],[72.97,87.87],[72.45,89.35],[72.97,99.91],[73.7,99.91],[73.12,89.81],[73.59,88.61],[74.64,88.24],[74.84,84.91],[81.56,84.44],[81.93,78.33],[83.33,70.93],[83.23,69.17]] },
      { kind: 'flavor', id: 'f_projector', label: '빔프로젝터 화면',
        line: '빔프로젝터 화면엔 아무것도 비치지 않는다. 그저 하얗게 빛나고 있을 뿐.',
        points: [[40.89,23.33],[41.56,25.46],[41.46,53.15],[59.06,53.15],[59.11,48.06],[64.11,48.06],[64.11,25.37],[64.69,23.33]] },
      { kind: 'flavor', id: 'f_ac', label: '에어컨',
        line: '에어컨은 꺼져 있다. 정적만이 감돈다.',
        points: [[46.77,17.13],[47.14,21.11],[47.5,21.48],[57.81,21.48],[59.48,17.59],[59.48,17.13]] }
    ] // TODO: 사물함(p_locker), 문(classroomDoor) 위치 확정되면 추가
  },
  hallwayLeft: {
    name: '복도(좌)', desc: '본 강의실 · 복도(우) · 인포데스크로 이어지는 구역.',
    connections: [
      { label: '본 강의실', dest: 'classroom' },
      { label: '복도(우)', dest: 'hallwayRight' },
      { label: '인포데스크', dest: 'frontdesk' }
    ],
    background: 'img/corridor.png',
    hotspots: []
  },
  studyroom: {
    name: '스터디룸', desc: '문을 열고 들어왔다. 책상 위에 배터리가 놓여 있었다.',
    connections: [ { label: '인포데스크', dest: 'frontdesk' } ],
    background: 'img/studyroom.png',
    hotspots: []
  },
  restroom: {
    name: '화장실', desc: '가벼운 분위기 환기용 공간.',
    connections: [ { label: '엘리베이터 앞', dest: 'elevatorFront' } ],
    background: 'img/restroom.png',
    hotspots: [] // TODO: 낙서(p_restroom) 위치 확정되면 추가
  },
  hallwayRight: {
    name: '복도(우)', desc: '엘리베이터 앞으로 이어지는 구역.',
    connections: [
      { label: '복도(좌)', dest: 'hallwayLeft' },
      { label: '엘리베이터 앞', dest: 'elevatorFront' }
    ],
    background: 'img/corridor-right.png',
    hotspots: [] // TODO: 소화전(p_extinguisher) 위치 확정되면 추가
  },
  frontdesk: {
    name: '인포데스크', desc: '안내데스크. 서랍이 잠겨 있다.',
    connections: [
      { label: '스터디룸', dest: 'studyroom', lockId: 'studyroomDoor' },
      { label: '복도(좌)', dest: 'hallwayLeft' }
    ],
    background: 'img/frontdesk.png',
    hotspots: [] // TODO: 방문자 명단(p_frontdesk), 서랍(frontdeskDrawer) 위치 확정되면 추가
  },
  elevatorFront: {
    name: '엘리베이터 앞',
    desc(s){ return s.power ? '전원이 복구됐다.' : '전원이 꺼져 있다.'; },
    connections: [
      { label: '복도(우)', dest: 'hallwayRight' },
      { label: '화장실', dest: 'restroom' },
      { label: '엘리베이터 안', dest: 'elevatorInside', lockId: 'elevatorCall' }
    ],
    background: 'img/elevator-front.png',
    hotspots: [] // TODO: 차단기함(breaker), 호출패널(callpanel) 위치 확정되면 추가
  },
  elevatorInside: {
    name: '엘리베이터', desc: '문이 닫히고, 1층으로 내려간다...',
    connections: [],
    background: 'img/elevator-inside.png',
    hotspots: []
  }
};

/* ---------- 유틸 ---------- */
function lockCode(lockId){ return LOCKS[lockId].require.map(pid => PUZZLES[pid].digit).join(''); }
function lockSolved(lockId){ return LOCKS[lockId].require.every(pid => state.solved[pid]); }
