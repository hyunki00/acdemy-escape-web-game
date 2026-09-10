/* ===========================================================
   inventory.js — 아이템(인벤토리) 처리
=========================================================== */

function hasItem(id){ return state.inventory.some(i => i.id === id); }
function addInventory(item){
  if (hasItem(item.id)) return;
  state.inventory.push(item);
  const bar = document.getElementById('invItems');
  const d = document.createElement('div');
  d.className = 'inv-item'; d.title = item.name; d.textContent = item.icon;
  bar.appendChild(d);
}
