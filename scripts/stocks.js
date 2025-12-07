// Charger et afficher les stocks depuis le fichier JSON
async function loadStocks() {
  try {
    const response = await fetch('./data/stocks.json');
    if (!response.ok) throw new Error("Erreur de chargement des stocks");
    const stocks = await response.json();
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
  tbody.innerHTML = stocks.map(stock => `
    <tr>
      <td>${stock.Type}</td>
      <td>${stock.Nom}</td>
      <td>${stock['Numéro de lot']}</td>
      <td>${stock['Qté restante']} g</td>
      <td>${stock.Fournisseur}</td>
      <td>${stock.Peremption || '-'}</td>
      <td>
        <button onclick="editStock('${stock.id}')">✏️</button>
        <button onclick="confirmDeleteStock('${stock.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

// Charger les stocks au démarrage
document.addEventListener('DOMContentLoaded', loadStocks);


// Ajouter un ingrédient
document.getElementById('form-add-ingredient').addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const stock = Object.fromEntries(formData.entries());
  stock.id = `${stock.Type}::${stock.Fournisseur}::${stock.Nom}::${stock['Numéro de lot'] || 'no-lot'}`;
  stock['Qté utilisée (g)'] = 0;
  stock['Qté restante'] = parseFloat(stock['Qté initiale (g)']);

  const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
  stocks.push(stock);
  localStorage.setItem('stocks', JSON.stringify(stocks));
  e.target.reset();
  document.getElementById('modal-add-ingredient').style.display = 'none';
  renderStocks(stocks);
});

// Supprimer un stock (avec confirmation)
function confirmDeleteStock(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
    deleteStock(id);
  }
}

function deleteStock(id) {
  let stocks = JSON.parse(localStorage.getItem('stocks')) || [];
  stocks = stocks.filter(stock => stock.id !== id);
  localStorage.setItem('stocks', JSON.stringify(stocks));
  renderStocks(stocks);
}

// Fonction d'édition (à implémenter selon tes besoins)
function editStock(id) {
  console.log("Éditer le stock avec l'ID:", id);
}

// Charger les stocks au démarrage
document.addEventListener('DOMContentLoaded', loadStocks);

