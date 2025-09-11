// monitor_app/index.js - Código para monitor
let timerInterval = null;
let timeLeft = 60;

// Formatear tiempo
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Actualizar timer
function updateTimer() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = formatTime(timeLeft);
    }
    
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        closeAuction();
    } else {
        timeLeft--;
    }
}

// Obtener y mostrar items
async function getItems() {
    try {
        const response = await fetch('/items?sort=highestBid');
        const items = await response.json();
        
        const itemsGrid = document.getElementById('items-grid');
        if (!itemsGrid) return;
        
        itemsGrid.innerHTML = '';
        
        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            itemCard.innerHTML = `
                <h3>${item.name}</h3>
                <div class="current-bid">
                    <div class="bidder-info">
                        <span>Postor líder:</span>
                        <span>${item.highestBidder || 'Nadie'}</span>
                    </div>
                    <div class="bidder-info">
                        <span>Puja actual:</span>
                        <span>$${item.highestBid}</span>
                    </div>
                </div>
                <div class="item-detail">
                    <span>Precio base:</span>
                    <span>$${item.basePrice}</span>
                </div>
                <div class="item-detail">
                    <span>Estado:</span>
                    <span>${item.sold ? 'Vendido' : 'Disponible'}</span>
                </div>
            `;
            
            itemsGrid.appendChild(itemCard);
        });
    } catch (error) {
        console.error('Error al obtener items:', error);
    }
}

// Abrir subasta
async function openAuction() {
    try {
        const response = await fetch('/auction/openAll', {
            method: 'POST'
        });
        
        if (response.ok) {
            // Iniciar timer
            timeLeft = 60;
            if (timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(updateTimer, 1000);
            
            // Actualizar items cada segundo
            setInterval(getItems, 1000);
            
            // Deshabilitar botones
            document.getElementById('open-btn').disabled = true;
            document.getElementById('close-btn').disabled = false;
            
            alert('Subasta abierta!');
            
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

// Cerrar subasta
async function closeAuction() {
    try {
        const response = await fetch('/auction/closeAll', {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Mostrar resultados
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.style.display = 'block';
                
                const resultsBody = document.getElementById('results-body');
                if (resultsBody) {
                    resultsBody.innerHTML = '';
                    
                    result.results.forEach(item => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${item.item}</td>
                            <td>${item.winner}</td>
                            <td>$${item.finalBid}</td>
                        `;
                        resultsBody.appendChild(row);
                    });
                }
            }
            
            // Detener timer
            clearInterval(timerInterval);
            document.getElementById('close-btn').disabled = true;
            
            alert('Subasta cerrada!');
            
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

// Event listeners
document.getElementById('open-btn').addEventListener('click', openAuction);
document.getElementById('close-btn').addEventListener('click', closeAuction);

// Cargar items al iniciar
getItems();