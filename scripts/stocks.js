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
  if (tbody) {
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
  closeModal('modal-add-ingredient');
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

function editStock(id) {
  const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
  const stockToEdit = stocks.find(stock => stock.id === id);

  if (stockToEdit) {
    const formHtml = `
      <div class="modal" id="modal-edit-ingredient">
        <div class="modal-content">
          <span class="modal-close" onclick="closeModal('modal-edit-ingredient')">&times;</span>
          <h3>Éditer l'ingrédient</h3>
          <form id="form-edit-ingredient">
            <label>
              Type :
              <select name="Type" required>
                <option value="Malt" ${stockToEdit.Type === 'Malt' ? 'selected' : ''}>Malt</option>
                <option value="Houblon" ${stockToEdit.Type === 'Houblon' ? 'selected' : ''}>Houblon</option>
                <option value="Levure" ${stockToEdit.Type === 'Levure' ? 'selected' : ''}>Levure</option>
                <option value="Autre" ${stockToEdit.Type === 'Autre' ? 'selected' : ''}>Autre</option>
              </select>
            </label>
            <label>
              Nom :
              <input type="text" name="Nom" value="${stockToEdit.Nom}" required>
            </label>
            <label>
              Fournisseur :
              <input type="text" name="Fournisseur" value="${stockToEdit.Fournisseur}" required>
            </label>
            <label>
              Numéro de lot :
              <input type="text" name="Numéro de lot" value="${stockToEdit['Numéro de lot']}">
            </label>
            <label>
              Quantité initiale (g) :
              <input type="number" name="Qté initiale (g)" step="0.01" value="${stockToEdit['Qté initiale (g)']}" required>
            </label>
            <label>
              Péremption :
              <input type="date" name="Peremption" value="${stockToEdit.Peremption || ''}">
            </label>
            <label>
              Spécification :
              <input type="text" name="Spec" value="${stockToEdit.Spec || ''}">
            </label>
            <input type="hidden" name="id" value="${stockToEdit.id}">
            <button type="submit">Enregistrer</button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHtml);
    document.getElementById('modal-edit-ingredient').style.display = 'block';

    document.getElementById('form-edit-ingredient').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const updatedStock = Object.fromEntries(formData.entries());

      const updatedStocks = stocks.map(stock => stock.id === updatedStock.id ? updatedStock : stock);
      localStorage.setItem('stocks', JSON.stringify(updatedStocks));
      closeModal('modal-edit-ingredient');
      renderStocks(updatedStocks);
    });
  }
}


// Charger les stocks au démarrage
document.addEventListener('DOMContentLoaded', loadStocks);

