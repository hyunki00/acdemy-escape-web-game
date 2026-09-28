# 학원 탈출 게임 🏫

바닐라 HTML/CSS/JS로 만든 포인트 앤 클릭 방탈출 게임입니다.

**🔗 플레이하기:** https://hyunki00.github.io/acdemy-escape-web-game/academy-escape-pointclick.html

---

## 게임 소개

학원에 갇혔다. 탈출구를 찾아라.

화면의 오브젝트를 클릭해 단서를 모으고, 퍼즐을 풀어 엘리베이터를 타고 탈출하는 게임입니다.

---

## 게임 방법

- **오브젝트 클릭** — 방 안의 사물과 상호작용
- **이동 버튼** (화면 우측 하단 →) — 연결된 방으로 이동
- **소지품 칸** (하단) — 획득한 아이템 확인, 마우스 오버 시 설명 표시
- **대화창** — 클릭하면 다음 줄로 넘어감

---

## 파일 구조
academy-escape-pointclick.html # 메인 HTML
data.js # 게임 데이터 (방·아이템·퍼즐·대사 등 모든 콘텐츠)
audio.js # 오디오 재생
ui.js # 공통 UI (모달·팝업·대화창)
scene.js # 방 렌더링·핫스팟 클릭·이동
inventory.js # 소지품
puzzle.js # 퍼즐 창
lock.js # 잠금 해제
phone.js # 스마트폰 패턴 잠금·카메라·QR 스캔
main.js # 타이머·설정·시작·종료·재시작
style.css # 스타일

Sound/ # 효과음
Video/ # 엔딩 영상
img/ # 배경·아이템 이미지


**스크립트 로드 순서**

data.js → audio.js → ui.js → scene.js → inventory.js → puzzle.js → lock.js → phone.js → main.js


---

## 개발 참고

- `lineOnce(key, lines)` — `state.seen[key]`로 1회만 대사 표시
- `valueOf(v)` — 함수면 `v(state)`, 아니면 값 그대로 반환
- `[[내용]]` 마크업 — 대사·피드백·툴팁에서 회색 글씨로 표시
- `DEBUG_FREE_ROAM = true` — 모든 잠금 무시하고 자유 이동

---

*개발 일지: [devlog.md](devlog.md) | 할 일: [todo.md](todo.md)*