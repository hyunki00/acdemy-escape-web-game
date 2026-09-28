/* ===========================================================
   data.js — 게임 내용 전부 (설정 · 사운드 · 아이템 · 퍼즐 · 잠금 · 방)
   대사, 정답, 좌표, 파일 경로 등 "내용"을 바꿀 때는 이 파일만 고치면 됩니다.
   동작(로직)은 다른 js 파일에 있습니다.
=========================================================== */

/* ---------- 설정 ---------- */
const DEBUG_FREE_ROAM = false;   // true: 퍼즐 클릭 무시 + 잠긴 문도 그냥 통과 (테스트용)
const INVENTORY_SLOTS = 13;      // 소지품 칸 수
const DEFAULT_VOLUME = { bgm: 0.1, sfx: 0.78 };   // 시작 볼륨 (0~1)

const OPENING_LINES = [
  '이런 내가 잠깐 졸았나?',
  '너무 어두운데, 시간이... 내 휴대폰이 어디갔지?',
  '...일단 나가봐야겠다.'
];

/* 시작 전 튜토리얼 (확인을 누르면 화면이 밝아지며 시작). sub: 들여쓴 보충 설명 */
const TUTORIAL = {
  title: '플레이 방법',
  lines: [
    { text: '화면 곳곳에 존재하는 일부 오브젝트를 클릭하여 상호작용이 가능합니다.' },
    { text: '상호작용을 통해, 아이템 및 단서를 획득할 수 있습니다.',
      sub: '일부 아이템은 소지품 칸에서 눌렀을 때, 상호작용이 가능합니다. 아이템을 획득하면 한 번씩 눌러보는 것을 권장드립니다.' },
    { text: '방 안에 더 이상 상호작용할 오브젝트가 없다면 [이동] 버튼을 통해 다른 곳으로 이동하는 것을 추천드립니다.'},
    { text: '획득한 단서들을 통해 퍼즐을 풀고 탈출하세요.'},
    { text: '게임을 발전시키고 싶으시다면 토스은행 100054785704(조현기)로 후원부탁드립니다',
      sub: '후원해주신 분들께는 게임 내에 이름을 남기는 특전을 제공해드립니다. (닉네임/실명 가능)'
     },
  ]
};

/* ---------- 사운드 ----------
   게임 시스템이 쓰는 소리. 사물·퍼즐별 소리는 아래 각 데이터의 sound / completeSound / openSound에 있음 */
const SOUND = {
  bgm:       'Sound/bgm.mp3',
  typing:    'Sound/typing-blip.mp3',
  walk:      'Sound/walk.mp3',
  pickup:    'Sound/item-pickup.mp3',
  beep:      'Sound/doorlock-beep.mp3',
  doorOpen:  'Sound/doorlock-open.mp3',
  doorWrong: 'Sound/doorlock-wrong.mp3',
  shutter:   'Sound/camera-shutter.mp3'
};
/* 특정 소리만 효과음 볼륨 대비 비율을 다르게 (예: 0.6 = 효과음 볼륨의 60%) */
const SOUND_VOLUME = {
  'Sound/glass-break.mp3': 0.62,
  'Sound/typing-blip.mp3': 0.6,
  'Sound/breaker-success.mp3': 1.3   // 1보다 크면 더 크게 (최대치는 브라우저 한계인 100%)
};

/* ---------- 아이템 ----------
   다른 데이터에서는 아이템을 id(예: 'flashlight')로만 가리킵니다.
   onClick: 소지품 칸을 눌렀을 때 동작 — 'note'(쪽지 보기) / 'pattern'(스마트폰 패턴 → 카메라)
   desc: 소지품 칸에 마우스를 올리면 나오는 설명 (\n 줄바꿈 · [[...]] 회색 글씨 · 상태에 따라 바뀌면 함수 s => 설명)
   pickupLines: 처음 얻었을 때 한 번만 나오는 대사 (상태에 따라 바뀌면 함수 s => 대사) */
const PHONE_CAMERA_GUIDE = '휴대폰 아이템을 누르면 커서가 변경됩니다. 커서가 변경되고 휴대폰을 사용할 곳에 클릭하세요.';
const ITEMS = {
  flashlight:   { name: '손전등',   image: 'img/item-flashlight.png', desc: '아직 배터리가 조금 남아있다. 비출만한 게 있을까?' },
  handkerchief: { name: '흰 손수건', image: 'img/item-handkerchief.png', desc: '무언가를 닦아낼 때 쓸 수 있을 것 같다.' },
  rustykey: {
    name: '녹슨 열쇠', image: 'img/item-rustykey.png', desc: '녹이 슬어 있다. 어디에 사용하는 열쇠지?',
    pickupLines: s => s.seen.puzzleIntro_p_computer_followUp   // 뉴스 사이트 창을 본 적 있는지
      ? [
          '어째 불길한 예감이 들더라니...',
          '우리 강사님이 연쇄 살인범이고 이번 목표는 내 차례였나?',
          '그런데 뉴스 기사로는 분명 오늘 오후에 체포되었다고 했는데.',
          '나를 노리는 함정을 설치하다가 재수없게 체포된건가.',
          '나는 체포되기 전에 설치해둔 덫에 걸린거고... 재수가 없네.'
        ]
      : [
          '우리 강사님이 범인...?',
          '젠장, 설문조사에 사명감이 부족하다고 쓴 게 걸린건가? [[(※ 저 아니에요)]]',
          '...지금 후회해봤자 소용없지. 이 열쇠를 쓸 곳이나 찾아보자.'
        ]
  },
  note: {
    name: '하얀 쪽지', image: 'img/item-note.png', onClick: 'note',
    desc: '무언가 계산식이 적혀 있다.',
    noteText: '1878+320÷5-100*10+978'
  },
  smartphone: {
    name: '휴대폰', image: 'img/item-smartphone.png', onClick: 'pattern',
    desc: s => s.smartphoneUnlocked
      ? '다른 기능은 없고... 카메라만 사용할 수 있어.\n[[' + PHONE_CAMERA_GUIDE + ']]'
      : '화면에 패턴 잠금이 걸려 있다.',
    pickupLines: ['휴대폰...? 내 건 아닌데.', '패턴으로 잠겨있잖아. 음... 일단 시도라도 해볼까.'],
    patternHint: '화면에 패턴 잠금이 걸려 있다.',
    patternAnswer: [3, 2, 1, 4, 7, 8, 5],   // 점 번호: 1 2 3 / 4 5 6 / 7 8 9
    hintReveal: '[97125]',
    revealMsg: '✓ 잠금 해제! 사용할 수 있는 기능은... 카메라밖에 없는 것 같다.\n[[' + PHONE_CAMERA_GUIDE + ']]'
  }
};

/* ---------- 퍼즐 ----------
   type: 'blank'(빈칸) · 'login'(ID/PW) · 'info'(읽고 확인) · 'newsfeed'(기사 목록)
         · 'hold'(손수건 스크래치) · 'breakerbox'(차단기 미니게임)
   followUp: 1단계를 맞히면 이어서 열리는 2단계. 다시 열면 2단계부터 보임
   풀었을 때: grantItem(아이템 지급) · setPower(전원 복구) · completeSound(효과음) · successMsg(문구)
   introLines: 그 창이 처음 열릴 때 한 번만 나오는 대사 */
const PUZZLES = {
  p_computer: {
    title: '컴퓨터 - 로그인', type: 'login',
    subtext: '로그인 정보를 입력하세요.',
    idAnswer: 'BYEMEDIA5G-2', pwAnswer: 'byemedia1',
    hint: 'WIFI',
    stage1SuccessMsg: '✓ 로그인 성공! 화면이 전환된다...',
    followUp: {
      title: '뉴스 사이트', type: 'newsfeed',
      subtext: '검색 기록에 남아있던 페이지가 열린다.',
      silentClose: true,   // 확인을 누르면 완료 문구 없이 바로 닫힘
      introLines: ['뭐야, 이 기사는...?', 'oo아카데미의 신OO 강사... 아니겠지.'],
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
    title: '낯익은 문장이다. 분명 빈칸에 들어갈 단어가...', type: 'blank',
    subtext: '분명 내가 듣고 있는 강의명 같은데?.',
    code: '[IBM x RedHat] AI {{blank}} - AX Academy 8기',
    answer: 'Transformation',   // 대소문자·공백 무시하고 비교
    hint: '분명 트랜스 뭔 션이었는데...?',
    stage1SuccessMsg: '✓ 정답!',
    followUp: {
      title: '뒤이어 떠오른 창 하나', type: 'info',
      subtext: '언제더라...?',
      prompt: '[IBM x RedHat] AI Transformation - AX Academy 8기의 첫 오리엔테이션 날짜는?',
      silentClose: true   // 확인을 누르면 완료 문구 없이 바로 닫힘
    }
  },
  p_restroom: {
    title: '거울에 적힌 무언가', type: 'hold',
    requiresItem: 'handkerchief',
    missingItemMsg: '[뭔가가 적혀 있는데 때가 끼어서 안보여...닦을 만한 게 있으면 지울 수 있을 것 같아.]',
    prompt: '누가 범인인 것 같아?',
    revealText: '신지원',
    hint: '손수건으로 뽀득뽀득 문질러서 닦아보자.',
    successMsg: '✓ 흐릿하게 적혀 있던 이름이 드러난다.',
    completeSound: 'Sound/glass-break.mp3',
    grantItem: 'rustykey'
  },
  // Lights Out 방식: 차단기를 누르면 이웃 배선이 토글, 모든 배선이 켜지면 완료.
  // brokenBreakers는 체스판의 한쪽 색 칸((행+열)이 짝수)에서만 골라야 항상 풀 수 있음
  p_breaker: {
    title: '차단기함', type: 'breakerbox',
    subtext: '차단기 버튼을 눌러서 주변 배선에 불을 켜보자. 모든 배선에 불이 들어와야 한다.',
    gridCols: 4, gridRows: 4,
    brokenBreakers: [0, 2, 8, 10, 15],
    hint: '차단기를 누르면 그 주변 배선만 바뀌어. 이웃한 두 차단기가 서로 반대 상태(하나는 누르고 하나는 안 누름)가 되어야 그 사이 배선이 켜지는 것 같아.',
    successMsg: '✓ 딸깍! 모든 배선에 불이 들어왔다.',
    completeSound: 'Sound/breaker-success.mp3',
    setPower: true
  }
};

/* ---------- 잠금 (문 · 상자) ----------
   style: 'combo'면 다이얼 자물쇠, 없으면 도어락 키패드
   reward: 열면 받는 아이템 id · openSound: 열릴 때 소리 */
const LOCK_TEXT = {   // 기본 문구 — 개별 잠금에 같은 이름의 필드를 넣으면 그 잠금만 바뀜
  title: '암호를 입력해주세요',
  subtext: len => `${len}자리 비밀번호를 입력하세요.`,
  wrong: '틀렸어요. 다시 시도해보세요.',
  success: '✓ 열렸다!'
};
const LOCKS = {
  classroomDoor: { code: '20260847' },   // 첫 오리엔테이션 날짜(20260825) + 빔프로젝터의 +22
  studyBox: {
    code: '1920', style: 'combo', reward: 'smartphone',
    title: '자물쇠를 맞춰보자',
    subtext: '다이얼을 돌려 숫자를 맞춰야해.',
    wrong: '맞지 않는 것 같다.',
    success: '찰칵, 자물쇠가 열렸다!'
  }
};

/* ---------- QR 스캔 (카메라 모드로 QR 코드를 클릭하면 열림 → 찍으면 엘리베이터 문이 열림) ---------- */
const QR_SCAN = {
  image: 'img/qr-scene.jpg',
  size: 520,                       // 카메라 화면 안 사진 크기(px)
  center: { x: 0.499, y: 0.618 },  // 사진 속 QR 중심 위치(사진 크기 대비 비율)
  tolerance: 18,                   // 십자선과 QR 중심 사이 허용 오차(px)
  openSound: 'Sound/elevator-ding.wav',   // 엘리베이터 문이 열릴 때 소리
  alignedMsg: '✓ 초점이 맞았다. 셔터를 눌러 찍어보자.',
  missMsg: '초점이 안 맞는다. QR 코드를 십자선에 맞춰보자.',
  noPowerLine: '엘리베이터에 전원이 들어오지 않아서 아무 일도 일어나지 않았다.',
  successLine: 'QR 코드를 촬영하자, 어디선가 엘리베이터 문이 열리는 소리가 들린다.',
  wrongTargetLine: '휴대폰으로 뭘 할 수 있을 것 같지는 않아.'   // 카메라 모드로 QR 코드가 아닌 곳을 눌렀을 때
};

/* ---------- 방 ----------
   background: 이미지 경로, 또는 상태에 따라 바뀌면 함수 s => 경로
   introLines: 그 방에 처음 들어왔을 때 한 번만 나오는 대사
   connections: 이동 버튼. lockId가 있으면 잠겨 있음 (introImage/introLine: 처음 누를 때 연출)
   hotspots: 클릭 영역. points는 이미지 대비 % 좌표 다각형
     kind: 'flavor'(대사) · 'puzzle'(PUZZLES의 id) · 'lock'(LOCKS의 id, dest로 이동) · 'move'(누르면 dest로 이동)
     line: 대사 — 여러 줄이면 배열, 상태에 따라 바뀌면 함수 s => 대사 (puzzle/lock은 처음 한 번만 보여주고 창을 엶)
     showIf: s => 조건 — 조건이 맞을 때만 클릭 영역이 생김 (같은 id를 상태별로 여러 개 둘 수 있음)
     sound: 누를 때 소리
     grantItem + lineFirst: 처음 누르면 아이템 지급 + lineFirst 대사
     withItem: { requires, setState, line, sound } — 그 아이템이 있으면 state[setState]=true + 대사
     requiresCamera + cameraLine: 카메라 모드일 때 누르면 QR 스캔 */
const ELEVATOR_DOOR = [[39.74,0.0],[19.84,0.0],[22.6,99.91],[29.38,99.91],[34.53,92.59],[40.94,93.33],[41.46,92.5]];

const ROOMS = {
  classroom: {
    name: '강의실', desc: '5강의실. 나도 모르게 잠든 건가?',
    connections: [ { label: '복도(좌)', dest: 'hallwayLeft', lockId: 'classroomDoor',
      introImage: 'img/classroom-doorlock.png',
      introLine: '뭐야, 누가 여기에다 도어락을 설치해놨지?' } ],
    background: s => s.projectorLit ? 'img/classroom-lit.png' : 'img/classroom.png',
    hotspots: [
      { kind: 'puzzle', id: 'p_board', label: '모니터 화면',
        line: '내 모니터만 이상하게 켜져 있다. 화면에 뭔가 떠 있는데?',
        points: [[0,60.65],[0,84.63],[5.57,84.72],[2.6,86.39],[2.14,87.22],[2.34,88.52],[4.9,89.72],[8.44,89.54],[11.93,87.22],[11.67,85.65],[10.16,84.63],[17.19,84.26],[17.19,60.65]] },
      { kind: 'flavor', id: 'f_chair', label: '의자',
        line: '누군가 앉아있던 것처럼, 의자가 살짝 돌아가 있어.',
        lineFirst: '의자 밑에 뭔가 떨어져 있다. 손전등? 아직 배터리는 남아있네.',
        grantItem: 'flashlight',
        points: [[82.24,67.59],[80.42,66.76],[76.51,67.13],[74.43,68.24],[72.71,70.46],[72.29,72.96],[73.18,80.28],[69.69,80.65],[70.26,82.59],[69.69,84.72],[69.32,97.04],[69.84,96.85],[70.57,83.61],[74.74,86.94],[72.97,87.87],[72.45,89.35],[72.97,99.91],[73.7,99.91],[73.12,89.81],[73.59,88.61],[74.64,88.24],[74.84,84.91],[81.56,84.44],[81.93,78.33],[83.33,70.93],[83.23,69.17]] },
      { kind: 'flavor', id: 'f_projector', label: '빔프로젝터 화면',
        line: '화면에 뭔가가 적혀져 있는 것 같아. 하지만 어두워서 보이지 않아.',
        withItem: { requires: 'flashlight', setState: 'projectorLit',
          line: '손전등을 비추자 어둠에 가려져 있던 글자가 드러난다.' },
        points: [[40.89,23.33],[41.56,25.46],[41.46,53.15],[59.06,53.15],[59.11,48.06],[64.11,48.06],[64.11,25.37],[64.69,23.33]] },
      { kind: 'flavor', id: 'f_ac', label: '에어컨',
        line: '에어컨은 꺼져 있어.',
        points: [[46.77,17.13],[47.14,21.11],[47.5,21.48],[57.81,21.48],[59.48,17.59],[59.48,17.13]] }
    ]
  },
  hallwayLeft: {
    name: '복도(좌)', desc: '오늘따라 유난히 길어보이는군',
    introLines: [
      '강의실 문에 분명 도어락 같은 건 없었는데...',
      '그건 그렇고 역시 아무도 없는 것 같네.',
      '정문도 잠긴 것 같고... 어떻게 나가야 될까.',
      '일단 인포데스크로 이동할까.'
    ],
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
    background: s => s.unlocked.studyBox ? 'img/studyroom-box-open.png' : 'img/studyroom-box-closed.png',
    hotspots: [
      { kind: 'flavor', id: 'f_vase', label: '화분',
        line: '화분 뒤엔 별다른 게 없다.',
        lineFirst: '마른 나뭇가지가 꽂힌 화분이다. 뒤쪽에 접힌 메모가 숨겨져 있다.',
        grantItem: 'note',
        points: [[9.58,42.31],[9.01,55.28],[10.26,60.19],[9.58,64.54],[8.44,62.04],[8.49,54.54],[6.46,48.98],[7.66,55.0],[7.66,62.78],[9.69,70.28],[9.64,72.59],[8.07,73.8],[8.44,75.37],[7.45,84.07],[8.65,93.61],[11.25,94.07],[12.5,91.67],[13.23,81.39],[12.14,75.37],[12.45,73.7],[11.04,72.41],[13.39,62.69],[15.31,60.65],[15.73,57.13],[14.58,60.19],[13.12,60.93],[12.92,57.78],[14.06,54.91],[14.27,51.11],[13.44,51.76],[12.08,58.52],[10.89,57.13],[9.74,52.78]] },
      { kind: 'flavor', id: 'f_studySign', label: '스터디룸 팻말',
        showIf: s => !s.unlocked.studyBox,
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
    background: s => s.cabinetOpen ? 'img/restroom-breaker-open.png'
                    : s.solved.p_restroom ? 'img/restroom-broken.png' : 'img/restroom.png',
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
      { kind: 'flavor', id: 'f_cabinet', label: '벽면 캐비닛',   // 거울이 깨진 뒤 배경에 맞춘 좌표
        showIf: s => s.solved.p_restroom && !s.cabinetOpen,
        line: '작은 벽면 캐비닛이다. 손잡이를 당겨봐도 잠겨서 열리지 않아.',
        withItem: { requires: 'rustykey', setState: 'cabinetOpen', sound: 'Sound/cabinet-sfx.mp3',
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
        grantItem: 'handkerchief',
        points: [[40.73,61.11],[41.88,70.83],[42.66,72.41],[44.11,72.96],[44.64,74.07],[44.58,78.61],[42.5,79.63],[42.24,81.02],[42.81,81.76],[44.06,82.13],[47.4,81.67],[47.76,80.93],[47.55,79.72],[45.42,78.61],[45.42,73.61],[45.78,72.87],[48.91,71.94],[49.11,70.37],[48.44,69.44],[48.23,67.69],[47.86,66.94],[45.57,66.85],[44.84,65.09],[43.75,64.72],[42.81,61.85]] }
    ]
  },
  elevatorFront: {
    name: '엘리베이터 앞',
    desc: s => s.power ? '전원이 복구됐다.' : '전원이 꺼져 있다.',
    introLines: [
      '엘리베이터를 써보...려고 했는데 전원이 나갔네.',
      '엘리베이터 버튼도 누가 부숴놨고.',
      '근데 뭐야, 이 수상쩍은 QR 코드는?'
    ],
    connections: [
      { label: '복도(우)', dest: 'hallwayRight' },
      { label: '화장실', dest: 'restroom' }
    ],
    background: s => s.elevatorOpen ? 'img/elevator-front-open.png'
                    : s.power ? 'img/elevator-front-powered.png' : 'img/elevator-front.png',
    hotspots: [
      { kind: 'flavor', id: 'f_elevator', label: '엘리베이터 문', showIf: s => !s.elevatorOpen,
        line: s => s.power
          ? ['전원이 들어왔지만 버튼이 고장나서 호출할 수가 없어.', '...혹시 이 QR코드가?']
          : '전원이 꺼져 있어 반응이 없다.',
        points: ELEVATOR_DOOR },
      { kind: 'move', id: 'm_elevator', label: '엘리베이터 타기', showIf: s => s.elevatorOpen,
        dest: 'elevatorInside', points: ELEVATOR_DOOR },
      { kind: 'flavor', id: 'f_maroonDoor', label: '문',
        line: '굳게 닫힌 문. 손잡이를 돌려봐도 꿈쩍하지 않아.',
        sound: 'Sound/maroondoor-sfx.mp3',
        points: [[47.92,18.8],[48.7,80.19],[49.17,79.44],[49.22,74.35],[53.75,67.69],[56.2,67.59],[55.78,23.61]] },
      { kind: 'flavor', id: 'f_waterCooler', label: '정수기',
        line: '전원이 나가 정수기 표시등도 꺼져 있다.',
        points: [[72.6,41.11],[71.46,42.87],[71.15,50.19],[71.93,51.3],[72.08,54.63],[71.2,55.09],[70.99,56.02],[71.2,72.13],[72.4,73.7],[76.98,73.89],[78.07,74.44],[78.8,72.5],[78.85,66.11],[79.58,65.74],[79.43,64.44],[78.96,63.89],[79.27,53.06],[78.85,51.48],[79.95,50.28],[80.1,40.74],[79.27,40.0],[76.56,40.0],[75.83,41.2]] },
      { kind: 'flavor', id: 'f_qrCode', label: 'QR 코드',
        line: '누군가 벽에 QR 코드를 붙여놨다. 낯선 코드다. 휴대폰 카메라가 있으면 찍어볼 수 있을 것 같은데.',
        requiresCamera: true,
        cameraLine: '카메라로 QR 코드를 찍어보자.',
        points: [[45.0,52.04],[44.43,52.04],[43.85,52.41],[43.07,52.59],[42.97,52.78],[42.29,52.78],[42.03,53.06],[41.56,53.15],[41.56,54.35],[41.46,54.44],[41.41,55.0],[41.61,57.96],[41.67,61.94],[45.05,59.81]] }
    ]
  },
  elevatorInside: {
    name: '엘리베이터', desc: '문이 닫히고, 1층으로 내려간다...',
    connections: [],
    background: 'img/elevator-inside.png',
    hotspots: []
  }
};

/* ---------- 엔딩 (엘리베이터에 타면 영상 재생 → 마지막 장면 위에 탈출 성공 창) ---------- */
const ENDING = {
  video: 'Video/elevator-ending.mp4',
  title: '학원을 탈출했다 🎉'
};

/* ---------- 게임 상태 ----------
   새 상태 값을 추가할 땐 여기에만 넣으면 됩니다 (재시작하면 자동으로 이 값으로 돌아감) */
function initialState(){
  return {
    currentRoom: 'classroom',
    inventory: [],      // 가진 아이템 id 목록
    solved: {},         // 푼 퍼즐 { id: true }
    unlocked: {},       // 연 잠금 { id: true }
    seen: {},           // 한 번만 나오는 대사를 이미 봤는지
    power: false,
    elevatorOpen: false,   // QR 촬영으로 엘리베이터 문이 열림
    projectorLit: false,
    cabinetOpen: false,
    smartphoneUnlocked: false,
    cameraMode: false,
    startTime: Date.now(),
    finished: false
  };
}
const state = initialState();
