/* ===========================================================
   inventory.js — 소지품
   state.inventory에는 아이템 id만 들어 있고, 이름·이미지는 data.js의 ITEMS에서 가져옵니다.
=========================================================== */

const hasItem = id => state.inventory.includes(id);

function addInventory(id){
  if (hasItem(id)) return;
  state.inventory.push(id);
  renderInventory();
  showItemPopup(ITEMS[id]);
  playSfx(SOUND.pickup);
  lineOnce('pickup_' + id, valueOf(ITEMS[id].pickupLines));   // 처음 얻을 때 한 번만 나오는 대사
}

/* 칸 INVENTORY_SLOTS개를 그리고, 가진 아이템을 앞에서부터 채움 */
function renderInventory(){
  el('invItems').innerHTML = Array.from({ length: INVENTORY_SLOTS }, (_, i) => {
    const id = state.inventory[i];
    if (!id) return '<div class="inv-item empty"></div>';
    const item = ITEMS[id];
    const desc = valueOf(item.desc);
    const descHtml = desc ? `<div class="tooltip-desc">${partsHtml(lineParts(desc))}</div>` : '';
    return `<div class="inv-item" data-item-id="${id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="inv-tooltip"><div class="tooltip-name">${escapeHtml(item.name)}</div>${descHtml}</div>
      </div>`;
  }).join('');
}

/* 소지품 칸 클릭 → 아이템의 onClick 동작 (phone.js의 ITEM_ACTIONS) */
el('invItems').addEventListener('click', e => {
  const slot = e.target.closest('[data-item-id]');
  if (!slot) return;
  const id = slot.dataset.itemId;
  const action = ITEM_ACTIONS[ITEMS[id].onClick];
  if (action) action(id);
});
