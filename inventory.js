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

/* 비어있는 칸 중 첫 번째를 찾아 아이템으로 채움 */
function fillNextSlot(item){
  const bar = document.getElementById('invItems');
  const slot = bar.querySelector('.inv-item.empty');
  if (!slot) return; // 칸이 모자라면 조용히 무시 (INVENTORY_SLOTS를 늘려서 해결)
  slot.classList.remove('empty');
  slot.title = item.name;
  slot.textContent = item.icon;
}

function addInventory(item){
  if (hasItem(item.id)) return;
  state.inventory.push(item);
  fillNextSlot(item);
}
