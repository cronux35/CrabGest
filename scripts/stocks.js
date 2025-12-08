// Charger les stocks
function loadStocks() {
  fetch('./data/stocks.json')
    .then(response => response.json())
    .then(stocks => {
      localStorage.setItem('stocks', JSON.stringify(stocks));
      renderStocks();
      renderHistorique();
    })
    .catch(() => {
      const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
      renderStocks(stocks);
      renderHistorique();
    });
}

// Afficher les stocks
function renderStocks() {
  const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
  const tbody = document.querySelector('#stocks-table tbody');
  if (tbody) {
    tbody.innerHTML = stocks.map(stock => {
      const isNegative = stock.quantite < 0;
      const warningIcon = isNegative ? '<i class="fas fa-exclamation-triangle warning-icon"></i>' : '';
      return `
        <tr class="${isNegative ? 'negative-stock' : ''}">
          <td>${warningIcon} ${stock.type}</td>
          <td>${stock.nom}</td>
          <td>${stock.lot}</td>
          <td>${stock.quantite} g</td>
          <td>${stock.fournisseur}</td>
          <td>${stock.spec || '-'}</td>
          <td>${stock.peremption || '-'}</td>
          <td>
            <button onclick="showEditStockForm('${stock.id}')">✏️</button>
            <button onclick="confirmDeleteStock('${stock.id}')">🗑️</button>
            <button onclick="showSortirStockForm('${stock.id}')">📤</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

// Ajouter un ingrédient
// Ajouter un ingrédient
function showAddIngredientForm() {
  const formHtml = `
    <div class="modal" id="modal-add-ingredient">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-ingredient')">&times;</span>
        <h3>Ajouter un ingrédient</h3>
        <form id="form-add-ingredient">
          <label>Type:
            <select name="type" id="ingredient-type" required>
              <option value="Malt">Malt</option>
              <option value="Houblon">Houblon</option>
              <option value="Levure">Levure</option>
              <option value="Autre">Autre</option>
            </select>
          </label>
          <label>Nom: <input type="text" name="nom" required></label>
          <label>Fournisseur: <input type="text" name="fournisseur" required></label>
          <label>Lot: <input type="text" name="lot"></label>
          <label>Quantité (g): <input type="number" name="quantite" step="0.01" required></label>
          <label>Prix/kg (€): <input type="number" name="prix_kg" step="0.01" required></label>
          <div id="spec-container">
            <!-- Contenu dynamique selon le type -->
          </div>
          <label>Péremption: <input type="date" name="peremption"></label>
          <label>Notes: <input type="text" name="notes"></label>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('modal-add-ingredient').style.display = 'block';

  // Ajouter l'écouteur pour le changement de type
  document.getElementById('ingredient-type').addEventListener('change', updateSpecField);

  // Initialiser le champ dynamique
  updateSpecField();

  document.getElementById('form-add-ingredient').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const ingredient = {
      id: `ing_${Date.now()}`,
      type: formData.get('type'),
      nom: formData.get('nom'),
      fournisseur: formData.get('fournisseur'),
      lot: formData.get('lot'),
      quantite: parseFloat(formData.get('quantite')),
      prix_kg: parseFloat(formData.get('prix_kg')),
      spec: formData.get('spec') || '',
      peremption: formData.get('peremption')
    };
    ajouterIngredient(ingredient);
    closeModal('modal-add-ingredient');
  });
}

// Mettre à jour le champ de spécification selon le type
function updateSpecField() {
  const type = document.getElementById('ingredient-type').value;
  const specContainer = document.getElementById('spec-container');
  let specHtml = '';

  if (type === 'Malt') {
    specHtml = `<label>EBC: <input type="text" name="spec" placeholder="Ex: 6"></label>`;
  } else if (type === 'Houblon') {
    specHtml = `<label>% AA: <input type="text" name="spec" placeholder="Ex: 12"></label>`;
  } else if (type === 'Levure') {
    specHtml = ''; // Pas de champ spécification pour les levures
  } else {
    specHtml = `<label>Spécification: <input type="text" name="spec" placeholder="Détails"></label>`;
  }

  specContainer.innerHTML = specHtml;
}


// Logique d'ajout avec historique
function ajouterIngredient(ingredient) {
  const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
  const historique = JSON.parse(localStorage.getItem('historique_stocks')) || [];
  stocks.push(ingredient);
  localStorage.setItem('stocks', JSON.stringify(stocks));

  historique.push({
    id: `hist_${Date.now()}`,
    date: new Date().toISOString(),
    type: "ajout",
    ingredient_id: ingredient.id,
    quantite: ingredient.quantite,
    lot: ingredient.lot,
    utilisateur: "François",
    notes: ingredient.notes || '',
    stock_avant: 0,
    stock_apres: ingredient.quantite
  });
  localStorage.setItem('historique_stocks', JSON.stringify(historique));
  renderStocks();
  renderHistorique();
}

// Retirer un ingrédient
function showSortirStockForm(id) {
  const stock = JSON.parse(localStorage.getItem('stocks')).find(s => s.id === id);
  const formHtml = `
    <div class="modal" id="modal-sortir-stock">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-sortir-stock')">&times;</span>
        <h3>Sortir du stock</h3>
        <p>${stock.type} - ${stock.nom} (Lot: ${stock.lot})</p>
        <form id="form-sortir-stock">
          <label>Quantité (g): <input type="number" name="quantite" step="0.01" required></label>
          <input type="hidden" name="stockId" value="${id}">
          <button type="submit">Valider</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('modal-sortir-stock').style.display = 'block';

  document.getElementById('form-sortir-stock').addEventListener('submit', (e) => {
    e.preventDefault();
    const quantite = parseFloat(e.target.quantite.value);
    sortirStock(id, quantite);
    closeModal('modal-sortir-stock');
  });
}

function sortirStock(id, quantite) {
  let stocks = JSON.parse(localStorage.getItem('stocks'));
  let historique = JSON.parse(localStorage.getItem('historique_stocks')) || [];
  const stock = stocks.find(s => s.id === id);
  const stockAvant = stock.quantite;
  stock.quantite -= quantite;

  historique.push({
    id: `hist_${Date.now()}`,
    date: new Date().toISOString(),
    type: "retrait",
    ingredient_id: id,
    quantite: -quantite,
    lot: stock.lot,
    utilisateur: "François",
    notes: `Retrait manuel`,
    stock_avant: stockAvant,
    stock_apres: stock.quantite
  });

  localStorage.setItem('stocks', JSON.stringify(stocks));
  localStorage.setItem('historique_stocks', JSON.stringify(historique));
  renderStocks();
  renderHistorique();
}

// Afficher l'historique
function renderHistorique() {
  const historique = JSON.parse(localStorage.getItem('historique_stocks')) || [];
  const tbody = document.querySelector('#historique-table tbody');
  if (tbody) {
    tbody.innerHTML = historique.map(entry => `
      <tr>
        <td>${new Date(entry.date).toLocaleString()}</td>
        <td class="${entry.type === 'ajout' ? 'positive' : 'negative'}">${entry.type}</td>
        <td>${entry.ingredient_id}</td>
        <td>${entry.lot}</td>
        <td>${entry.quantite}</td>
        <td>${entry.stock_avant}</td>
        <td>${entry.stock_apres}</td>
        <td>${entry.utilisateur}</td>
        <td>${entry.notes}</td>
      </tr>
    `).join('');
  }
}

// Charger au démarrage
document.addEventListener('DOMContentLoaded', loadStocks);
