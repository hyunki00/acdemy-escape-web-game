/* ===========================================================
   draw.js — 그래픽 렌더링 (SVG 드로잉 함수 모음)
   각 방의 배경·가구·사물을 SVG 문자열로 그려주는 함수들입니다.
   상태를 변경하지 않고, 오직 '어떻게 그릴지'만 담당합니다.
=========================================================== */

function wrapScene(furniture, wallTop){
  return `
  <svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${wallTop}"/>
        <stop offset="100%" stop-color="#1c0f13"/>
      </linearGradient>
      <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a1b1f"/>
        <stop offset="100%" stop-color="#150a0c"/>
      </linearGradient>
      <radialGradient id="vignette" cx="50%" cy="30%" r="80%">
        <stop offset="0%" stop-color="rgba(242,165,65,0.08)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.42)"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="640" height="262" fill="url(#wallGrad)"/>
    <polygon points="0,400 640,400 512,262 128,262" fill="url(#floorGrad)"/>
    <polygon points="0,400 640,400 512,262 128,262" fill="none" stroke="#0d0608" stroke-width="1" opacity="0.5"/>
    <line x1="0" y1="262" x2="640" y2="262" stroke="#0d0608" stroke-width="4"/>
    ${furniture}
    <rect x="0" y="0" width="640" height="400" fill="url(#vignette)" pointer-events="none"/>
  </svg>`;
}
function signPlate(x, y, w, line1, line2){
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="34" fill="#6b1f2e" stroke="#3a0f18" stroke-width="1.5"/>
    <text x="${x+10}" y="${y+14}" fill="#e9c9d0" font-size="8" font-family="sans-serif" letter-spacing="1">${line1}</text>
    <text x="${x+10}" y="${y+27}" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold">${line2}</text>
  </g>`;
}
function checkIcon(x,y){
  return `<circle cx="${x}" cy="${y}" r="10" fill="#3f8a4a"/><text x="${x}" y="${y+4}" text-anchor="middle" fill="#fff" font-size="11" font-family="sans-serif">✓</text>`;
}
function lockIcon(x,y){
  return `<g transform="translate(${x-8},${y-10})">
    <rect x="0" y="7" width="16" height="12" rx="2" fill="#b23a52"/>
    <path d="M3,7 V4 a5,5 0 0 1 10,0 v3" fill="none" stroke="#b23a52" stroke-width="2.2"/>
  </g>`;
}

function blackboard(x,y,id,solved){
  return `<g class="hotspot-region ${solved?'is-solved':''}" data-kind="puzzle" data-id="${id}">
    <rect x="${x-8}" y="${y-8}" width="156" height="96" fill="transparent"/>
    <rect x="${x}" y="${y}" width="140" height="80" rx="3" fill="#1a1a1c" stroke="#6b1f2e" stroke-width="4"/>
    <rect x="${x+10}" y="${y+14}" width="60" height="5" fill="#7fa8c9" opacity="0.65"/>
    <rect x="${x+10}" y="${y+28}" width="95" height="5" fill="#7fa8c9" opacity="0.4"/>
    <rect x="${x+10}" y="${y+42}" width="40" height="5" fill="#7fa8c9" opacity="0.3"/>
    <rect x="${x}" y="${y+80}" width="140" height="7" fill="#3a0f18"/>
    ${solved ? checkIcon(x+126, y+14) : ''}
  </g>`;
}
function locker(x,y,id,solved){
  return `<g class="hotspot-region ${solved?'is-solved':''}" data-kind="puzzle" data-id="${id}">
    <rect x="${x-8}" y="${y-8}" width="86" height="156" fill="transparent"/>
    <rect x="${x}" y="${y}" width="70" height="140" rx="2" fill="#38363a" stroke="#1a1a1c" stroke-width="3"/>
    <rect x="${x}" y="${y}" width="70" height="6" fill="#6b1f2e"/>
    <line x1="${x+35}" y1="${y}" x2="${x+35}" y2="${y+140}" stroke="#1a1a1c" stroke-width="2"/>
    <circle cx="${x+30}" cy="${y+70}" r="3.5" fill="#c7cfd8"/>
    <circle cx="${x+40}" cy="${y+70}" r="3.5" fill="#c7cfd8"/>
    ${solved ? checkIcon(x+58, y+16) : ''}
  </g>`;
}
function doorLocked(x,y,w,h,id,dest,unlocked){
  return `<g class="hotspot-region ${unlocked?'is-solved':''}" data-kind="lock" data-id="${id}" data-dest="${dest||''}">
    <rect x="${x-8}" y="${y-8}" width="${w+16}" height="${h+16}" fill="transparent"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3a1017" stroke="#1a0a0d" stroke-width="4"/>
    <rect x="${x+8}" y="${y+8}" width="${w-16}" height="${h-52}" fill="rgba(180,195,200,0.16)" stroke="#8a4a58" stroke-width="1.5"/>
    <circle cx="${x+w-16}" cy="${y+h/2}" r="4" fill="#e9c9d0"/>
    ${signPlate(x+8, y+h-38, w-16, 'BY MEDIA', 'DOOR')}
    ${unlocked ? checkIcon(x+w/2, y-18) : lockIcon(x+w/2, y-14)}
  </g>`;
}
function deskCluster(x,y){
  let rects = '';
  for (let r = 0; r < 2; r++){
    for (let c = 0; c < 3; c++){
      const dx = x + c*68, dy = y + r*42;
      rects += `<rect x="${dx}" y="${dy}" width="52" height="24" rx="2" fill="#c9beae" stroke="#8a7d68" stroke-width="1.5"/>`;
      rects += `<rect x="${dx+16}" y="${dy-16}" width="20" height="15" rx="1" fill="#1a1a1c" stroke="#050505" stroke-width="1"/>`;
      rects += `<rect x="${dx+24}" y="${dy-1}" width="4" height="3" fill="#3a3a3a"/>`;
    }
  }
  return `<g opacity="0.95">${rects}</g>`;
}
function windowDeco(x,y,w,h){
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#141f30" stroke="#0a1119" stroke-width="4"/>
    <line x1="${x+w/2}" y1="${y}" x2="${x+w/2}" y2="${y+h}" stroke="#0a1119" stroke-width="3"/>
    <line x1="${x}" y1="${y+h/2}" x2="${x+w}" y2="${y+h/2}" stroke="#0a1119" stroke-width="3"/>
  </g>`;
}
function bulletinBoard(x,y,id,solved){
  return `<g class="hotspot-region ${solved?'is-solved':''}" data-kind="puzzle" data-id="${id}">
    <rect x="${x-8}" y="${y-8}" width="136" height="96" fill="transparent"/>
    <rect x="${x}" y="${y}" width="120" height="80" rx="3" fill="#7a5c3e" stroke="#4a3826" stroke-width="4"/>
    <rect x="${x+10}" y="${y+10}" width="40" height="26" fill="#f3e6c9" transform="rotate(-4 ${x+30} ${y+23})"/>
    <rect x="${x+60}" y="${y+16}" width="40" height="26" fill="#f3e6c9" transform="rotate(3 ${x+80} ${y+29})"/>
    <rect x="${x+30}" y="${y+46}" width="40" height="24" fill="#f3e6c9" transform="rotate(-2 ${x+50} ${y+58})"/>
    ${solved ? checkIcon(x+106, y+14) : ''}
  </g>`;
}
function pinnedNote(x,y,id,solved){
  return `<g class="hotspot-region ${solved?'is-solved':''}" data-kind="puzzle" data-id="${id}">
    <rect x="${x-10}" y="${y-10}" width="60" height="70" fill="transparent"/>
    <rect x="${x}" y="${y}" width="40" height="50" fill="#f3e6c9" stroke="#c9b98f" stroke-width="1.5" transform="rotate(-6 ${x+20} ${y+25})"/>
    <circle cx="${x+20}" cy="${y+4}" r="3" fill="#a5424a"/>
    ${solved ? checkIcon(x+44, y-2) : ''}
  </g>`;
}
function extinguisherBox(x,y,id,solved){
  return `<g class="hotspot-region ${solved?'is-solved':''}" data-kind="puzzle" data-id="${id}">
    <rect x="${x-8}" y="${y-8}" width="56" height="76" fill="transparent"/>
    <rect x="${x}" y="${y}" width="40" height="60" rx="3" fill="#7a2a2a" stroke="#3f1414" stroke-width="3"/>
    <rect x="${x+14}" y="${y+8}" width="12" height="30" rx="4" fill="#c94f4f"/>
    ${solved ? checkIcon(x+40, y-2) : ''}
  </g>`;
}
function counterDesk(x,y,w){
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="16" rx="6" fill="#f3f1ee" stroke="#c9c4bc" stroke-width="1.5"/>
    <rect x="${x}" y="${y+16}" width="${w}" height="58" fill="#6b1f2e" stroke="#3a0f18" stroke-width="2"/>
    <circle cx="${x+34}" cy="${y+45}" r="16" fill="#ffffff" opacity="0.92"/>
    <text x="${x+34}" y="${y+49}" text-anchor="middle" fill="#6b1f2e" font-size="10" font-family="sans-serif" font-weight="bold">BY</text>
    <text x="${x+60}" y="${y+42}" fill="#ffffff" font-size="9" font-family="sans-serif" letter-spacing="1">BY MEDIA</text>
    <text x="${x+60}" y="${y+54}" fill="#e9c9d0" font-size="7" font-family="sans-serif">ACADEMY</text>
    <rect x="${x+w-70}" y="${y-34}" width="46" height="34" rx="2" fill="#1a1a1c" stroke="#050505" stroke-width="2"/>
  </g>`;
}
function clipboard(x,y,id,solved){
  return `<g class="hotspot-region ${solved?'is-solved':''}" data-kind="puzzle" data-id="${id}">
    <rect x="${x-8}" y="${y-8}" width="52" height="62" fill="transparent"/>
    <rect x="${x}" y="${y}" width="36" height="46" rx="2" fill="#f3e6c9" stroke="#c9b98f" stroke-width="1.5"/>
    <rect x="${x+8}" y="${y-4}" width="20" height="8" rx="2" fill="#8a5a12"/>
    ${solved ? checkIcon(x+38, y+2) : ''}
  </g>`;
}
function drawerUnit(x,y,id,unlocked){
  return `<g class="hotspot-region ${unlocked?'is-solved':''}" data-kind="lock" data-id="${id}" data-dest="">
    <rect x="${x-8}" y="${y-8}" width="96" height="56" fill="transparent"/>
    <rect x="${x}" y="${y}" width="80" height="40" rx="2" fill="#4a3826" stroke="#2c2013" stroke-width="3"/>
    <rect x="${x+34}" y="${y+14}" width="12" height="4" fill="#c7cfd8"/>
    ${unlocked ? checkIcon(x+70, y-10) : lockIcon(x+70, y-6)}
  </g>`;
}
function breakerBox(x,y,id,active){
  return `<g class="hotspot-region ${active?'is-solved':''}" data-kind="breaker">
    <rect x="${x-8}" y="${y-8}" width="66" height="86" fill="transparent"/>
    <rect x="${x}" y="${y}" width="50" height="70" rx="2" fill="#4a5560" stroke="#20272c" stroke-width="3"/>
    <rect x="${x+10}" y="${y+12}" width="12" height="20" rx="2" fill="${active?'#3f8a4a':'#a5424a'}"/>
    <rect x="${x+28}" y="${y+12}" width="12" height="20" rx="2" fill="${active?'#3f8a4a':'#a5424a'}"/>
    ${active ? checkIcon(x+50, y-2) : ''}
  </g>`;
}
function callPanel(x,y,id,active){
  return `<g class="hotspot-region" data-kind="callpanel">
    <rect x="${x-8}" y="${y-8}" width="66" height="76" fill="transparent"/>
    <rect x="${x}" y="${y}" width="50" height="60" rx="3" fill="#2b3d52" stroke="#131f30" stroke-width="3"/>
    <rect x="${x+8}" y="${y+8}" width="34" height="16" rx="2" fill="${active?'#b23a52':'#1c2733'}"/>
    ${!active ? `<text x="${x+25}" y="${y+42}" text-anchor="middle" fill="#5f6b7a" font-size="9" font-family="sans-serif">OFF</text>` : ''}
  </g>`;
}
function elevatorDoors(x,y,w,h,id,dest,unlocked){
  const mid = x + w/2;
  return `<g class="hotspot-region ${unlocked?'is-solved':''}" data-kind="lock" data-id="${id}" data-dest="${dest||''}">
    <rect x="${x-8}" y="${y-8}" width="${w+16}" height="${h+16}" fill="transparent"/>
    ${signPlate(x, y-40, w, 'BY MEDIA ACADEMY', 'ELEVATOR')}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#4a4a4d" stroke="#1a1a1c" stroke-width="4"/>
    <rect x="${x}" y="${y}" width="${w/2-2}" height="${h}" fill="#5c5c60"/>
    <rect x="${mid+2}" y="${y}" width="${w/2-2}" height="${h}" fill="#5c5c60"/>
    <line x1="${mid}" y1="${y}" x2="${mid}" y2="${y+h}" stroke="#1a1a1c" stroke-width="3"/>
    <circle cx="${mid-14}" cy="${y+h/2}" r="3" fill="#e9c9d0"/>
    <circle cx="${mid+14}" cy="${y+h/2}" r="3" fill="#e9c9d0"/>
    ${unlocked ? checkIcon(mid, y+h+16) : lockIcon(mid, y+h+14)}
  </g>`;
}
function sinkMirror(x,y,id,solved){
  return `<g class="hotspot-region ${solved?'is-solved':''}" data-kind="puzzle" data-id="${id}">
    <rect x="${x-8}" y="${y-8}" width="156" height="106" fill="transparent"/>
    <rect x="${x}" y="${y}" width="140" height="70" rx="3" fill="#8fa5b8" stroke="#4a5b6b" stroke-width="3"/>
    <rect x="${x}" y="${y+70}" width="140" height="20" fill="#4a5b6b"/>
    <path d="M${x+20},${y+80} q10,-8 20,0 t20,0" stroke="#b23a52" stroke-width="2" fill="none" opacity="0.7"/>
    ${solved ? checkIcon(x+126, y+14) : ''}
  </g>`;
}
function stallDeco(x,y){
  return `<rect x="${x}" y="${y}" width="60" height="110" fill="#2e3d4d" stroke="#131f30" stroke-width="3"/>`;
}
function bookshelfDeco(x,y){
  let books = '';
  const colors = ['#6b3f3f','#3f5a6b','#5a6b3f','#6b5a3f','#4a3f6b'];
  for (let i=0;i<5;i++) books += `<rect x="${x+8+i*20}" y="${y+16}" width="16" height="46" fill="${colors[i]}"/>`;
  return `<g><rect x="${x}" y="${y}" width="120" height="90" fill="#3f2e1f" stroke="#2c2013" stroke-width="3"/>${books}</g>`;
}
function deskChairDeco(x,y){
  return `<g>
    <rect x="${x}" y="${y}" width="70" height="14" fill="#5c4530" stroke="#2c2013" stroke-width="2"/>
    <rect x="${x+8}" y="${y+14}" width="8" height="30" fill="#2c2013"/>
    <rect x="${x+54}" y="${y+14}" width="8" height="30" fill="#2c2013"/>
    <rect x="${x+22}" y="${y+50}" width="26" height="26" fill="#3a4a5c"/>
  </g>`;
}

/* ===========================================================
   이미지 기반 씬 렌더러
   실사 → AI 게임 그래픽 변환 자산을 쓰는 방은 SVG 대신 이 함수로 그립니다.
   room.background: 이미지 경로
   room.hotspots: 클릭 가능한 영역 배열. 각 항목은 둘 중 하나:
     - 사각형: { kind, id, dest, label, x, y, w, h }  (전부 0~100 퍼센트)
     - 다각형(사물 윤곽 따라가기): { kind, id, dest, label, points: [[x,y], ...] } (0~100 퍼센트)
=========================================================== */
function renderImageScene(room, state){
  const shapesHtml = (room.hotspots || []).map(h => {
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
    <img src="${room.background}" alt="${room.name}" onload="fitHitboxLayer(this)">
    <svg class="hitbox-layer" viewBox="0 0 100 100" preserveAspectRatio="none">${shapesHtml}</svg>
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
