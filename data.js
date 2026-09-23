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
    hint: 'WIFI',
    stage1SuccessMsg: '✓ 로그인 성공! 화면이 전환된다...',
    followUp: {
      title: '뉴스 사이트', type: 'newsfeed',
      subtext: '검색 기록에 남아있던 페이지가 열린다.',
      articles: [
        {
          title: '[속보] ○○아카데미 강사 신○○, 수강생 살인 혐의로 체포',
          body: '금일 오전, ○○아카데미 소속 신입 강사가 수강생 살해 혐의로 긴급 체포됐다. 경찰은 정확한 동기를 조사 중이라고 밝혔다.'
        },
        {
          title: '충격) 한 아카데미의 기괴한 감금 살인 수법',
          body: '범인은 엘리베이터 안에 숨어 수강생들을 가둬놓고, 그들이 탈출하려 발버둥 치는 모습을 지켜보며 즐기다가 유일한 탈출구인 엘리베이터에 들어오는 순간 살해한 것으로 드러났다.'
        },
        {
          title: '[특보] 종로 소재 ○○아카데미에 숨어든 연쇄살인범, 그 동기는?',
          body: '오늘 오전에 긴급 체포된 연쇄 살인으로 알려진 oo아카데미의 신○○ 강사는 살해 동기에 대해 이렇게 말했다. 나는 수강생들이 JS,Python,React로 고통받는 모습이 좋다. 때문에 이를 어려워하지 않는 수강생들을 좋아하지 않아 살해했을 뿐이다.'
        }
      ]
    }
  },
  p_board: {
    title: '낯익은 문장이다. 분명 빈칸에 들어갈 단어가...', type: 'blank', flavor: true,
    subtext: '분명 내가 듣고 있는 강의명 같은데?.',
    code: '[IBM x RedHat] AI {{blank}} - AX Academy 8기',
    answer: 'Transformation', digit: '20260847',
    hint: '분명 트랜스 뭔 션이었는데...?',
    stage1SuccessMsg: '✓ 정답!',
    followUp: {
      title: '뒤이어 떠오른 창 하나', type: 'info',
      subtext: '언제더라...?',
      prompt: '[IBM x RedHat] AI Transformation - AX Academy 8기의 첫 오리엔테이션 날짜는?',
      hint: '아까 빔프로젝터 화면에서 봤던 "+22"도 같이 떠올려보자.',
      silentClose: true
    }
  },
  p_restroom: {
    title: '거울에 적힌 무언가', type: 'hold', flavor: true,
    requiresItem: 'handkerchief',
    missingItemMsg: '[뭔가가 적혀 있는데 때가 끼어서 안보여...닦을 만한 게 있으면 지울 수 있을 것 같아.]',
    prompt: '누가 범인인 것 같아?',
    revealText: '신지원',
    hint: '손수건으로 뽀득뽀득 문질러서 닦아보자.',
    successMsg: '✓ 흐릿하게 적혀 있던 이름이 드러난다.',
    completeSound: 'Sound/glass-break.mp3',
    grantItem: { id: 'rustykey', name: '녹슨 열쇠', icon: '🔑', image: 'img/item-rustykey.png' }
  }
};

/* ---------- 잠금(문/서랍) 데이터 ---------- */
const LOCKS = {
  classroomDoor: { require: ['p_board'], reward: null },
  elevatorCall: { require: ['p_callcode'], reward: null, requiresPower: true,
    offLine: '전원이 꺼져 있어 반응이 없다.', openSound: 'Sound/elevator-ding.wav' },
  // 스터디룸 상자 — 회전 다이얼(콤보락) 스타일. code/문구는 전부 임시이니 나중에 실제 값으로 교체.
  studyBox: {
    code: '7878', style: 'combo',
    reward: { id: 'smartphone', name: '스마트폰', icon: '📱', image: 'img/item-smartphone.png' },
    title: '자물쇠를 맞춰보자',
    subtext: '다이얼을 돌려 숫자를 맞춰야해.',
    wrong: '맞지 않는 것 같다.',
    success: '찰칵, 자물쇠가 열렸다!'
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
    name: '강의실', desc: '5강의실. 나도 모르게 잠든 건가?',
    connections: [ { label: '복도(좌)', dest: 'hallwayLeft', lockId: 'classroomDoor',
      introImage: 'img/classroom-doorlock.png',
      introLine: '뭐야, 누가 여기에다 도어락을 설치해놨지?' } ],
    background(s){ return s.projectorLit ? 'img/classroom-lit.png' : 'img/classroom.png'; },
    hotspots: [
      { kind: 'puzzle', id: 'p_board', label: '모니터 화면',
        line: '내 모니터만 이상하게 켜져 있다. 화면에 뭔가 떠 있는데?',
        points: [[0,60.65],[0,84.63],[5.57,84.72],[2.6,86.39],[2.14,87.22],[2.34,88.52],[4.9,89.72],[8.44,89.54],[11.93,87.22],[11.67,85.65],[10.16,84.63],[17.19,84.26],[17.19,60.65]] },
      { kind: 'flavor', id: 'f_chair', label: '의자',
        line: '누군가 앉아있던 것처럼, 의자가 살짝 돌아가 있어.',
        lineFirst: '의자 밑에 뭔가 떨어져 있다. 손전등? 아직 배터리는 남아있네.',
        grantItem: { id: 'flashlight', name: '손전등', icon: '🔦', image: 'img/item-flashlight.png' },
        points: [[82.24,67.59],[80.42,66.76],[76.51,67.13],[74.43,68.24],[72.71,70.46],[72.29,72.96],[73.18,80.28],[69.69,80.65],[70.26,82.59],[69.69,84.72],[69.32,97.04],[69.84,96.85],[70.57,83.61],[74.74,86.94],[72.97,87.87],[72.45,89.35],[72.97,99.91],[73.7,99.91],[73.12,89.81],[73.59,88.61],[74.64,88.24],[74.84,84.91],[81.56,84.44],[81.93,78.33],[83.33,70.93],[83.23,69.17]] },
      { kind: 'flavor', id: 'f_projector', label: '빔프로젝터 화면',
        line: '화면에 뭔가가 적혀져 있는 것 같아. 하지만 어두워서 보이지 않아.',
        withItem: { requires: 'flashlight', setState: 'projectorLit', removeItem: 'flashlight',
          line: '손전등을 비추자 어둠에 가려져 있던 글자가 드러난다.' },
        points: [[40.89,23.33],[41.56,25.46],[41.46,53.15],[59.06,53.15],[59.11,48.06],[64.11,48.06],[64.11,25.37],[64.69,23.33]] },
      { kind: 'flavor', id: 'f_ac', label: '에어컨',
        line: '에어컨은 꺼져 있어.',
        points: [[46.77,17.13],[47.14,21.11],[47.5,21.48],[57.81,21.48],[59.48,17.59],[59.48,17.13]] }
    ]
  },
  hallwayLeft: {
    name: '복도(좌)', desc: '오늘따라 유난히 길어보이는군',
    connections: [
      { label: '강의실', dest: 'classroom' },
      { label: '복도(우)', dest: 'hallwayRight' },
      { label: '인포데스크', dest: 'frontdesk' }
    ],
    background: 'img/corridor.png',
    hotspots: [
      { kind: 'flavor', id: 'f_hallwayDoor', label: '문',
        line: '학원의 정문이다, 멀리서 봐도 잠겨있는 걸 알겠어.',
        points: [[46.88,36.67],[46.88,47.31],[52.34,47.31],[52.34,36.67]] },
      { kind: 'flavor', id: 'f_hallwayFloor', label: '바닥',
        line: '발밑 타일에 비상등 불빛이 어른거린다.',
        points: [[78.91,99.91],[71.2,83.98],[69.38,82.31],[62.03,67.04],[60.99,66.76],[52.97,47.59],[51.72,47.31],[46.15,47.59],[19.74,99.81]] }
    ]
  },
  studyroom: {
    name: '스터디룸', desc: '원래 이런 상자가 있었나?',
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
        line: '낯선 상자가 놓여 있다. 자물쇠로 잠겨 있는 것 같아.',
        points: [[39.32,63.8],[39.58,71.11],[45.05,71.02],[45.62,71.11],[45.94,71.67],[47.55,71.67],[47.86,71.11],[53.96,70.83],[54.06,63.52],[53.12,61.2],[40.62,61.2]] },
      { kind: 'flavor', id: 'f_studyBoxOpen', label: '열린 상자',
        showIf: s => s.unlocked.studyBox,
        line: '안에는 이제 아무것도 없어.',
        points: [[40.05,58.7],[40.05,68.8],[39.01,72.22],[39.01,77.13],[39.38,77.78],[39.43,77.31],[45.99,77.31],[46.3,77.78],[47.81,77.31],[54.9,77.31],[54.9,71.67],[53.49,68.52],[53.75,62.31],[54.06,62.22],[54.06,60.37],[53.23,58.15],[40.42,58.06]] }
    ]
  },
  restroom: {
    name: '화장실', desc: '평소보다 서늘하다.',
    connections: [ { label: '엘리베이터 앞', dest: 'elevatorFront' } ],
    background(s){
      if (s.cabinetOpen) return 'img/restroom-breaker-open.png';
      return s.solved.p_restroom ? 'img/restroom-broken.png' : 'img/restroom.png';
    },
    hotspots: [
      { kind: 'puzzle', id: 'p_restroom', label: '거울',
        showIf: s => !s.solved.p_restroom,
        line: '거울에 글씨가 흐릿하게 남아있다. 뭔가 적혀 있는 것 같은데...',
        points: [[0.0,16.2],[0.1,63.7],[10.62,59.72],[10.52,22.04]] },
      { kind: 'flavor', id: 'f_brokenMirror', label: '깨진 거울',
        showIf: s => s.solved.p_restroom,
        line: '거울이 산산조각 나 있다. 깨진 조각이 위험하니 가까이 가지 말자.',
        points: [[0.0,15.46],[0.0,63.89],[11.09,59.91],[11.41,59.17],[11.3,21.94]] },
      { kind: 'flavor', id: 'f_cabinet', label: '벽면 캐비닛',
        showIf: s => !s.solved.p_restroom,
        line: '작은 벽면 캐비닛이다. 손잡이를 당겨봐도 잠겨서 열리지 않아.',
        points: [[63.59,44.07],[63.54,53.61],[64.95,53.89],[67.86,53.7],[67.97,52.69],[67.92,44.07]] },
      { kind: 'flavor', id: 'f_cabinet', label: '벽면 캐비닛',
        showIf: s => s.solved.p_restroom && !s.cabinetOpen,
        line: '작은 벽면 캐비닛이다. 손잡이를 당겨봐도 잠겨서 열리지 않아.',
        withItem: { requires: 'rustykey', removeItem: 'rustykey', setState: 'cabinetOpen', sound: 'Sound/cabinet-sfx.mp3',
          line: '녹슨 열쇠를 넣고 돌리자 캐비닛이 열렸다. 안에 낡은 차단기함이 보인다.' },
        points: [[63.96,44.07],[63.85,44.44],[63.91,53.8],[64.17,53.98],[68.28,53.8],[68.39,53.61],[68.44,49.91],[68.39,44.17],[68.23,43.98]] },
      { kind: 'puzzle', id: 'p_breaker', label: '차단기함',
        showIf: s => s.cabinetOpen,
        line: '차단기가 있다. 잘만하면 엘리베이터 전원을 복구할 수 있을 것 같은데?',
        points: [[63.59,44.17],[63.54,53.7],[67.5,53.7],[67.5,44.17]] },
      { kind: 'flavor', id: 'f_stalls', label: '화장실 칸막이',
        line: '칸막이 문들이 열려 있다. 안에는... 당연히 아무도 없겠지.',
        points: [[40.36,20.83],[39.27,20.83],[39.27,26.3],[14.53,26.3],[14.53,65.0],[23.91,65.46],[23.18,75.19],[23.54,84.81],[40.26,84.63],[40.73,76.57],[43.07,77.41],[44.27,70.65],[45.89,70.56],[46.15,67.31],[48.02,65.56],[48.18,34.35]] }
    ]
  },
  hallwayRight: {
    name: '복도(우)', desc: '엘리베이터 앞으로 갈 수 있는 통로.',
    connections: [
      { label: '복도(좌)', dest: 'hallwayLeft' },
      { label: '엘리베이터 앞', dest: 'elevatorFront' }
    ],
    background: 'img/corridor-right.png',
    hotspots: [
      { kind: 'flavor', id: 'f_rightFloor', label: '바닥',
        line: '바닥 타일 위로 붉은 빛이 길게 늘어져 있다.',
        points: [[68.65,99.91],[59.06,70.65],[54.32,58.89],[47.45,58.52],[47.4,51.11],[45.0,51.02],[26.25,85.46],[26.2,89.17],[20.78,99.91]] },
      { kind: 'flavor', id: 'f_exitSign', label: '비상구 표시등',
        line: '비상구 표시등이 빛나고 있다. 원래 붉은색으로 빛나나?',
        points: [[45.47,29.44],[45.47,32.78],[48.33,32.78],[48.33,32.31],[48.28,32.22],[48.28,31.02],[48.33,30.93],[48.33,30.19],[48.39,30.09],[48.33,30.0],[48.33,29.44]] },
      { kind: 'flavor', id: 'f_classroom05', label: '05 강의실 팻말',
        line: '"BYEMIDEA 05 CLASS ROOM" — 우리 기수의 강의실이다.',
        points: [[80.78,0.0],[60.52,27.13],[60.42,55.0],[94.58,94.35],[95.42,0.0]] }
    ]
  },
  frontdesk: {
    name: '인포데스크', desc: '인포데스크. 인기척 없이 조용하다.',
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
        line: '벽에 달린 아카데미의 로고다.',
        points: [[81.72,31.3],[80.57,32.31],[79.64,34.35],[79.27,36.2],[79.22,39.17],[79.53,40.93],[80.47,43.15],[81.15,43.8],[82.24,44.07],[83.44,43.33],[84.48,41.67],[85.16,38.8],[85.21,36.3],[84.79,34.07],[84.06,32.5],[82.86,31.39]] },
      { kind: 'flavor', id: 'f_deskChair', label: '의자',
        line: '의자 하나가 카운터에서 살짝 빠져나와 있다.',
        lineFirst: '의자 아래 손수건이 떨어져 있다. 뭔가를 닦을 수 있을지도.',
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
    background(s){ return s.power ? 'img/elevator-front-powered.png' : 'img/elevator-front.png'; },
    hotspots: [
      { kind: 'lock', id: 'elevatorCall', dest: 'elevatorInside', label: '엘리베이터 문',
        points: [[39.74,0.0],[19.84,0.0],[22.6,99.91],[29.38,99.91],[34.53,92.59],[40.94,93.33],[41.46,92.5]] },
      { kind: 'flavor', id: 'f_maroonDoor', label: '문',
        line: '굳게 닫힌 문. 손잡이를 돌려봐도 꿈쩍하지 않아.',
        sound: 'Sound/maroondoor-sfx.mp3',
        points: [[47.92,18.8],[48.7,80.19],[49.17,79.44],[49.22,74.35],[53.75,67.69],[56.2,67.59],[55.78,23.61]] },
      { kind: 'flavor', id: 'f_waterCooler', label: '정수기',
        line: '전원이 나가 정수기 표시등도 꺼져 있다.',
        points: [[72.6,41.11],[71.46,42.87],[71.15,50.19],[71.93,51.3],[72.08,54.63],[71.2,55.09],[70.99,56.02],[71.2,72.13],[72.4,73.7],[76.98,73.89],[78.07,74.44],[78.8,72.5],[78.85,66.11],[79.58,65.74],[79.43,64.44],[78.96,63.89],[79.27,53.06],[78.85,51.48],[79.95,50.28],[80.1,40.74],[79.27,40.0],[76.56,40.0],[75.83,41.2]] },
      { kind: 'callpanel', id: 'elevatorCallPanel', label: '호출 버튼',
        lineOff: '버튼을 눌러봤지만 반응이 없다.',
        line: '버튼에 불이 들어왔다. 눌러보자.',
        points: [[42.29,41.2],[41.25,41.2],[41.2,41.67],[41.25,51.3],[41.41,51.48],[42.45,51.02]] }
    ]
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
