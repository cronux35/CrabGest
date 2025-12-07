// Charger et afficher les stocks depuis le fichier JSON
async function loadStocks() {
  try {
    const response = await fetch('./data/stocks.json');
    if (!response.ok) throw new Error("Erreur de chargement des stocks");
    const stocks = await response.json();
    console.log(stocks); // Vérifie que toutes les données sont bien chargées
    localStorage.setItem('stocks', JSON.stringify(stocks));
    renderStocks(stocks);
  } catch (error) {
    console.error("Erreur:", error);
    const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
    renderStocks(stocks);
  }
}

// Afficher les stocks dans le tableau
function renderStocks(stocks) {
  const tbody = document.querySelector('#stocks-table tbody');
  const container = document.querySelector('#stocks-table').parentNode;

  if (window.innerWidth <= 768) {
    container.innerHTML = stocks.map(stock => {
      // Déterminer la spécification à afficher
      let specText = '';
      if (stock.Type === 'Malt') {
        specText = stock.Spec || 'N/A';
      } else if (stock.Type === 'Houblon') {
        specText = stock.Spec || 'N/A';
      } else if (stock.Type === 'Levure') {
        specText = stock.Peremption || 'N/A';
      }

      // Vérifier si le stock est négatif
      const isNegativeStock = stock['Qté restante'] < 0;
      const warningIcon = isNegativeStock ? '<i class="fas fa-exclamation-triangle warning-icon" title="Stock négatif"></i>' : '';

      return `
        <div class="stock-card ${isNegativeStock ? 'negative-stock' : ''}">
          ${warningIcon}
          <div class="card-row">
            <span class="card-label">Type:</span>
            <span>${stock.Type}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Nom:</span>
            <span>${stock.Nom}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Lot:</span>
            <span>${stock['Numéro de lot']}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Qté restante:</span>
            <span>${stock['Qté restante']} g</span>
          </div>
          <div class="card-row">
            <span class="card-label">Fournisseur:</span>
            <span>${stock.Fournisseur}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Spécification:</span>
            <span>${specText}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Péremption:</span>
            <span>${stock.Peremption || '-'}</span>
          </div>
          <div class="card-actions">
            <button onclick="editStock('${stock.id}')">✏️</button>
            <button onclick="confirmDeleteStock('${stock.id}')">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  } else {
    tbody.innerHTML = stocks.map(stock => {
      // Déterminer la spécification à afficher
      let specText = '';
      if (stock.Type === 'Malt') {
        specText = stock.Spec || 'N/A';
      } else if (stock.Type === 'Houblon') {
        specText = stock.Spec || 'N/A';
      } else if (stock.Type === 'Levure') {
        specText = stock.Peremption || 'N/A';
      }

      // Vérifier si le stock est négatif
      const isNegativeStock = stock['Qté restante'] < 0;
      const warningIcon = isNegativeStock ? '<i class="fas fa-exclamation-triangle warning-icon" title="Stock négatif"></i>' : '';

      return `
        <tr class="${isNegativeStock ? 'negative-stock' : ''}">
          <td>${warningIcon} ${stock.Type}</td>
          <td>${stock.Nom}</td>
          <td>${stock['Numéro de lot']}</td>
          <td>${stock['Qté restante']} g</td>
          <td>${stock.Fournisseur}</td>
          <td>${specText}</td>
          <td>${stock.Peremption || '-'}</td>
          <td>
            <button onclick="editStock('${stock.id}')">✏️</button>
            <button onclick="confirmDeleteStock('${stock.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}


// Charger les stocks au démarrage
document.addEventListener('DOMContentLoaded', loadStocks);

