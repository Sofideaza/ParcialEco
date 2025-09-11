// players_app/index.js - Código para jugadores
let currentUser = null;

// Mostrar mensaje
function showMessage(text, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = isError ? 'message error' : 'message success';
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// Registrar usuario
async function registerUser(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('name');
    const name = nameInput.value.trim();
    
    if (!name) {
        showMessage('Por favor ingresa tu nombre', true);
        return;
    }
    
    try {
        const response = await fetch('/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            showMessage(`¡Bienvenido ${user.name}! Tu balance: $${user.balance}`);
            
            // Mostrar info de usuario
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-balance').textContent = user.balance;
            
            // Ocultar formulario de registro
            document.getElementById('registration-section').style.display = 'none';
            
            // Mostrar items
            document.getElementById('items-section').style.display = 'block';
            
            // Cargar items
            getItems();
            
        } else {
            const error = await response.json();
            showMessage(error.error, true);
        }
    } catch (error) {
        showMessage('Error de conexión', true);
    }
}

// Obtener items
async function getItems() {
    try {
        const response = await fetch('/items?sort=highestBid');
        const items = await response.json();
        
        const itemsList = document.getElementById('items-list');
        itemsList.innerHTML = '';
        
        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            itemCard.innerHTML = `
                <h3>${item.name}</h3>
                <div class="item-detail">
                    <span>Precio base:</span>
                    <span>$${item.basePrice}</span>
                </div>
                <div class="item-detail">
                    <span>Puja más alta:</span>
                    <span>$${item.highestBid}</span>
                </div>
                <div class="item-detail">
                    <span>Postor líder:</span>
                    <span>${item.highestBidder || 'Nadie'}</span>
                </div>
                <div class="bid-form">
                    <input type="number" class="bid-input" id="bid-${item.id}" 
                           placeholder="Tu oferta" min="${item.highestBid + 1}">
                    <button class="bid-button" onclick="placeBid(${item.id})">Pujar</button>
                </div>
            `;
            
            itemsList.appendChild(itemCard);
        });
    } catch (error) {
        showMessage('Error al cargar items', true);
    }
}

// Hacer una puja
async function placeBid(itemId) {
    if (!currentUser) {
        showMessage('Primero debes registrarte', true);
        return;
    }
    
    const bidInput = document.getElementById(`bid-${itemId}`);
    const amount = parseInt(bidInput.value);
    
    if (!amount || amount <= 0) {
        showMessage('Ingresa un monto válido', true);
        return;
    }
    
    try {
        const response = await fetch(`/items/${itemId}/bid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                amount: amount
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage(`¡Puja exitosa! Nuevo monto: $${result.highestBid}`);
            
            // Actualizar balance
            const userResponse = await fetch(`/users/${currentUser.id}`);
            const user = await userResponse.json();
            currentUser = user;
            
            document.getElementById('user-balance').textContent = user.balance;
            getItems();
            
        } else {
            const error = await response.json();
            showMessage(error.error, true);
        }
    } catch (error) {
        showMessage('Error de conexión', true);
    }
    
    bidInput.value = '';
}

// Event listeners
document.getElementById('register-form').addEventListener('submit', registerUser);

// Cargar items si ya está registrado
if (window.location.hash === '#registered') {
    getItems();
}