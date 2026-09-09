# 바이미디어 아카데미: 이스케이프

웹 기반 포인트앤클릭 방탈출 게임 — Vanilla JavaScript / SVG (프레임워크 미사용)

자바스크립트를 학습 중인 훈련생이 야간 자율학습 중 잠들었다가 학원에 갇히는 상황에서 시작하는 게임으로,
각 방에 배치된 코드 문제를 풀어 잠금을 해제하며 탈출합니다.

## 🔗 바로가기

- 🎮 **[게임 플레이하기](https://hyunki00.github.io/acdemy-escape-web-game/academy-escape-pointclick.html)**
- 📓 **[개발 일지 보기](https://hyunki00.github.io/acdemy-escape-web-game/devlog.html)**
- 📄 [기획서 (Word) 다운로드](./academy-escape-portfolio-doc.docx)

## 기술 스택

- HTML5, CSS3 (SVG, clip-path)
- Vanilla JavaScript (ES6+), 별도 프레임워크 미사용
- 정적 단일 배포 (빌드 도구 불필요)

## 코드 구조

역할별로 스크립트를 분리해 관리와 유지보수가 쉽도록 구성했습니다.

| 파일 | 역할 |
|---|---|
| `data.js` | 상태(state) + 퍼즐 · 잠금 · 방 데이터 |
| `draw.js` | SVG 배경 · 사물 드로잉 함수 |
| `ui.js` | 모달 열고 닫기 등 공통 UI |
| `puzzle.js` | 퀴즈(퍼즐) 출제 · 채점 |
| `lock.js` | 잠금 · 키패드 · 전원/호출 처리 |
| `inventory.js` | 아이템 획득 · 보유 확인 |
| `navigation.js` | 클릭 이벤트 위임, 방 이동, 화면 렌더링 |
| `main.js` | 타이머 · 설정 · 재시작 · 엔딩, 게임 시작 진입점 |

자세한 시스템 설계는 [기획서](./academy-escape-portfolio-doc.docx)와 [개발 일지](https://hyunki00.github.io/acdemy-escape-web-game/devlog.html)를 참고해주세요.
