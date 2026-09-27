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
}

/* 칸 INVENTORY_SLOTS개를 그리고, 가진 아이템을 앞에서부터 채움 */
function renderInventory(){
  el('invItems').innerHTML = Array.from({ length: INVENTORY_SLOTS }, (_, i) => {
    const id = state.inventory[i];
    if (!id) return '<div class="inv-item empty"></div>';
    const item = ITEMS[id];
    const tooltip = item.desc ? `${item.name}\n${item.desc}` : item.name;
    return `<div class="inv-item" data-item-id="${id}" data-tooltip="${escapeHtml(tooltip)}"><img src="${item.image}" alt="${item.name}"></div>`;
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
