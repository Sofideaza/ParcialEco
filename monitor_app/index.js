let timerInterval = null;
let timeLeft = 60;

function format(n) {
  return String(n).padStart(2, '0');
}

function updateTimer() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const m = document.getElementById('t-min');
  const s = document.getElementById('t-sec');
  if (m) m.textContent = format(mins);
  if (s) s.textContent = format(secs);
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    closeAuction();
  } else {
    timeLeft--;
  }
}

async function getItems() {
  try {
    const response = await fetch('/items?sort=highestBid');
    const items = await response.json();
    const grid = document.getElementById('items-grid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `
        <h3>${item.name}</h3>
        <div class="row meta">
          <span>Precio base</span>
          <strong>$${item.basePrice}</strong>
        </div>
        <div class="row meta">
          <span>Puja actual</span>
          <strong>$${item.highestBid}</strong>
        </div>

        <div class="row meta">
          <span>Postor líder</span>
          <strong>${item.highestBidder || 'Nadie'}</strong>
        </div>

        <div class="row">
          <span class="badge">${item.sold ? 'Vendido' : 'Disponible'}</span>
        </div>
      `;
      grid.appendChild(el);
    });
  } catch {}
}

async function openAuction() {
  try {
    const response = await fetch('/auction/openAll', { method: 'POST' });
    if (response.ok) {
      timeLeft = 60;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(updateTimer, 1000);
      document.getElementById('open-btn').disabled = true;
      document.getElementById('close-btn').disabled = false;
      setInterval(getItems, 1000);
    } else {
      const err = await response.json();
      alert(err.error || 'No se pudo abrir la subasta');
    }
  } catch {
    alert('Error de conexión');
  }
}

async function closeAuction() {
  try {
    const response = await fetch('/auction/closeAll', { method: 'POST' });
    if (response.ok) {
      const result = await response.json();
      const section = document.getElementById('results-section');
      const body = document.getElementById('results-body');
      if (section && body) {
        section.classList.remove('hidden');
        body.innerHTML = '';
        result.results.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${r.item}</td><td>${r.winner}</td><td>$${r.finalBid}</td>`;
          body.appendChild(tr);
        });
      }
      clearInterval(timerInterval);
      document.getElementById('close-btn').disabled = true;
    } else {
      const err = await response.json();
      alert(err.error || 'No se pudo cerrar la subasta');
    }
  } catch {
    alert('Error de conexión');
  }
}

document.getElementById('open-btn').addEventListener('click', openAuction);
document.getElementById('close-btn').addEventListener('click', closeAuction);
getItems();
