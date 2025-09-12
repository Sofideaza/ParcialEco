let currentUser = null;

function showMessage(text, isError = false) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.style.background = isError ? '#7a1b1b' : '#111827';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

async function registerUser(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  if (!name) {
    showMessage('Por favor ingresa tu nombre', true);
    return;
  }
  try {
    const response = await fetch('/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (response.ok) {
      const user = await response.json();
      currentUser = user;
      document.getElementById('user-info').classList.remove('hidden');
      document.getElementById('user-name').textContent = user.name;
      document.getElementById('user-balance').textContent = user.balance;
      document.getElementById('registration-section').classList.add('hidden');
      getItems();
      showMessage(`Bienvenido ${user.name}`);
    } else {
      const err = await response.json();
      showMessage(err.error || 'No se pudo registrar', true);
    }
  } catch {
    showMessage('Error de conexión', true);
  }
}

async function getItems() {
  try {
    const response = await fetch('/items?sort=highestBid');
    const items = await response.json();
    const grid = document.getElementById('items-list');
    grid.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${item.name}</h3>
        <div class="line">
          <span>Precio base</span>
          <strong>$${item.basePrice}</strong>
        </div>

        <div class="line">
          <span>Puja más alta</span>
          <strong>$${item.highestBid}</strong>
        </div>

        <div class="line">
          <span>Postor líder</span>
          <strong>${item.highestBidder || 'Nadie'}</strong>
        </div>

        <div class="bid">
          <input type="number" id="bid-${item.id}" min="${item.highestBid + 1}" placeholder="Tu oferta" />
          <button class="btn btn-primary" data-id="${item.id}">Pujar</button>
        </div>
      `;
      grid.appendChild(card);
    });
    document.querySelectorAll('.bid .btn').forEach(btn => {
      btn.addEventListener('click', () => placeBid(parseInt(btn.dataset.id, 10)));
    });
  } catch {
    showMessage('Error al cargar items', true);
  }
}

async function placeBid(itemId) {
  if (!currentUser) {
    showMessage('Primero debes registrarte', true);
    return;
  }
  const input = document.getElementById(`bid-${itemId}`);
  const amount = parseInt(input.value, 10);
  if (!amount || amount <= 0) {
    showMessage('Ingresa un monto válido', true);
    return;
  }
  try {
    const response = await fetch(`/items/${itemId}/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, amount })
    });
    if (response.ok) {
      const result = await response.json();
      showMessage(`Puja exitosa. Nuevo monto: $${result.highestBid}`);
      const userResponse = await fetch(`/users/${currentUser.id}`);
      const user = await userResponse.json();
      currentUser = user;
      document.getElementById('user-balance').textContent = user.balance;
      getItems();
    } else {
      const err = await response.json();
      showMessage(err.error || 'No se pudo pujar', true);
    }
  } catch {
    showMessage('Error de conexión', true);
  }
  input.value = '';
}

document.getElementById('register-form').addEventListener('submit', registerUser);
if (window.location.hash === '#registered') getItems();
