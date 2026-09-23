/* ===========================================================
   draw.js — 그래픽 렌더링
   각 방의 배경·히트박스를 실제로 그려주는 이미지 기반 렌더러입니다.
=========================================================== */
/* ===========================================================
   이미지 기반 씬 렌더러
   실사 → AI 게임 그래픽 변환 자산을 쓰는 방은 SVG 대신 이 함수로 그립니다.
   room.background: 이미지 경로
   room.hotspots: 클릭 가능한 영역 배열. 각 항목은 둘 중 하나:
     - 사각형: { kind, id, dest, label, x, y, w, h }  (전부 0~100 퍼센트)
     - 다각형(사물 윤곽 따라가기): { kind, id, dest, label, points: [[x,y], ...] } (0~100 퍼센트)
=========================================================== */
function renderImageScene(room, state){
  const bg = typeof room.background === 'function' ? room.background(state) : room.background;
  const shapesHtml = (room.hotspots || [])
    .filter(h => !h.showIf || h.showIf(state))
    .map(h => {
    let solved = false;
    if (h.kind === 'puzzle') solved = !!state.solved[h.id];
    if (h.kind === 'lock') solved = !!state.unlocked[h.id];
    const cls = solved ? 'is-solved' : '';
    const attrs = `class="${cls}" data-kind="${h.kind}" data-id="${h.id || ''}" data-dest="${h.dest || ''}"`;

    if (h.points){
      const pts = h.points.map(p => p.join(',')).join(' ');
      return `<polygon points="${pts}" ${attrs}><title>${h.label || ''}</title></polygon>`;
    }
    return `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}" rx="1" ${attrs}><title>${h.label || ''}</title></rect>`;
  }).join('');
  return `<div class="image-scene">
    <img src="${bg}" alt="${room.name}" onload="fitHitboxLayer(this)">
    <svg class="hitbox-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
      ${shapesHtml}
    </svg>
    <div class="flicker-overlay"></div>
  </div>`;
}

/* 이미지가 object-fit:contain으로 표시될 때, 실제로 그림이 차지하는 영역(레터박스 제외)에
   맞춰 히트박스 레이어(svg) 위치·크기를 정확히 맞춥니다. 창 크기가 바뀌어도 항상 재계산됩니다. */
function fitHitboxLayer(img){
  const container = img.parentElement;
  const layer = container && container.querySelector('.hitbox-layer');
  if (!layer) return;
  const cw = container.clientWidth, ch = container.clientHeight;
  const nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh || !cw || !ch) return;
  const scale = Math.min(cw / nw, ch / nh);
  const rw = nw * scale, rh = nh * scale;
  const ox = (cw - rw) / 2, oy = (ch - rh) / 2;
  layer.style.left = ox + 'px';
  layer.style.top = oy + 'px';
  layer.style.width = rw + 'px';
  layer.style.height = rh + 'px';
}
window.addEventListener('resize', () => {
  document.querySelectorAll('.image-scene img').forEach(img => { if (img.complete) fitHitboxLayer(img); });
});
