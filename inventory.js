/* ===========================================================
   inventory.js — 아이템(인벤토리) 처리
   소지품 바에는 항상 INVENTORY_SLOTS개의 칸이 미리 배열되어 있고,
   아이템을 주우면 비어있는 칸을 순서대로 채웁니다.
=========================================================== */

function hasItem(id){ return state.inventory.some(i => i.id === id); }

/* 소지품 바에 빈 칸들을 미리 그려둠. 게임 시작 시, 그리고 재시작 시 호출합니다. */
function renderInventorySlots(){
  const bar = document.getElementById('invItems');
  bar.innerHTML = '';
  for (let i = 0; i < INVENTORY_SLOTS; i++){
    const d = document.createElement('div');
    d.className = 'inv-item empty';
    bar.appendChild(d);
  }
  // 이미 갖고 있던 아이템이 있다면(재렌더 등) 다시 채워줌
  state.inventory.forEach(fillNextSlot);
}

/* 비어있는 칸 중 첫 번째를 찾아 아이템으로 채움. item.image가 있으면 이미지 아이콘,
   없으면 기존처럼 item.icon(이모지)을 텍스트로 표시. item.desc가 있으면 호버 시 그 설명을,
   없으면 item.name만 툴팁으로 보여줌 */
function fillNextSlot(item){
  const bar = document.getElementById('invItems');
  const slot = bar.querySelector('.inv-item.empty');
  if (!slot) return; // 칸이 모자라면 조용히 무시 (INVENTORY_SLOTS를 늘려서 해결)
  slot.classList.remove('empty');
  slot.dataset.tooltip = item.desc || item.name;
  if (item.image){
    slot.textContent = '';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    slot.appendChild(img);
  } else {
    slot.textContent = item.icon;
  }
}

function addInventory(item){
  if (hasItem(item.id)) return;
  state.inventory.push(item);
  fillNextSlot(item);
  showItemPopup(item);
  playSfx('Sound/item-pickup.mp3');
}

/* 쓸모를 다한 아이템을 인벤토리에서 제거하고, 남은 아이템들로 슬롯을 다시 채움 */
function removeInventoryItem(id){
  const idx = state.inventory.findIndex(i => i.id === id);
  if (idx === -1) return;
  state.inventory.splice(idx, 1);
  renderInventorySlots();
}
