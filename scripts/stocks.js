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

// Charger les stocks au démarrage
document.addEventListener('DOMContentLoaded', loadStocks);
