// Charger et afficher les recettes
async function loadRecettes() {
  try {
    const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
    renderRecettes(recettes);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

// Afficher les recettes dans le tableau
function renderRecettes(recettes) {
  const tbody = document.querySelector('#recettes-table tbody');
  if (tbody) {
    tbody.innerHTML = recettes.map(recette => `
      <tr>
        <td>${recette.Nom}</td>
        <td>${recette.Style}</td>
        <td>${recette['Degré alcoolique']}%</td>
        <td>${recette['Volume (L)']} L</td>
        <td>
          <button onclick="editRecette('${recette.id}')">✏️</button>
          <button onclick="confirmDeleteRecette('${recette.id}')">🗑️</button>
          <button onclick="showRecetteDetails('${recette.id}')">📄</button>
        </td>
      </tr>
    `).join('');
  }
}

// Ajouter une recette
function showAddRecetteForm() {
  const formHtml = `
    <div class="modal" id="modal-add-recette">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-recette')">&times;</span>
        <h3>Ajouter une recette</h3>
        <form id="form-add-recette">
          <label>
            Nom :
            <input type="text" name="Nom" required>
          </label>
          <label>
            Style :
            <input type="text" name="Style" required>
          </label>
          <label>
            Degré alcoolique :
            <input type="number" name="Degré alcoolique" step="0.1" required>
          </label>
          <label>
            Volume (L) :
            <input type="number" name="Volume (L)" step="0.1" required>
          </label>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('modal-add-recette').style.display = 'block';

  document.getElementById('form-add-recette').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const recette = Object.fromEntries(formData.entries());
    recette.id = `Recette::${recette.Nom}`;
    recette.Ingrédients = [];

    const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
    recettes.push(recette);
    localStorage.setItem('recettes', JSON.stringify(recettes));
    e.target.reset();
    closeModal('modal-add-recette');
    renderRecettes(recettes);
  });
}

// Afficher les détails d'une recette
function showRecetteDetails(id) {
  const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
  const recette = recettes.find(r => r.id === id);

  if (recette) {
    const formHtml = `
      <div class="modal" id="modal-recette-details">
        <div class="modal-content">
          <span class="modal-close" onclick="closeModal('modal-recette-details')">&times;</span>
          <h3>Détails de la recette : ${recette.Nom}</h3>
          <div>
            <h4>Ingrédients</h4>
            <table id="recette-ingredients-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Nom</th>
                  <th>Spécification</th>
                  <th>Quantité (g)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${recette.Ingrédients.map(ingredient => `
                  <tr>
                    <td>${ingredient.Type}</td>
                    <td>${ingredient.Nom}</td>
                    <td>${ingredient.Spec}</td>
                    <td>${ingredient.Quantité} g</td>
                    <td>
                      <button onclick="removeIngredientFromRecette('${recette.id}', '${ingredient.id}')">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <button class="action-btn" onclick="showAddIngredientToRecetteForm('${recette.id}')">
              <i class="fas fa-plus"></i> Ajouter un ingrédient
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHtml);
    document.getElementById('modal-recette-details').style.display = 'block';
  }
}

// Ajouter un ingrédient à une recette
function showAddIngredientToRecetteForm(recetteId) {
  const stocks = JSON.parse(localStorage.getItem('stocks')) || [];

  const formHtml = `
    <div class="modal" id="modal-add-ingredient-to-recette">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-ingredient-to-recette')">&times;</span>
        <h3>Ajouter un ingrédient à la recette</h3>
        <form id="form-add-ingredient-to-recette">
          <label>
            Ingrédient :
            <select name="IngredientId" required>
              ${stocks.map(stock => `
                <option value="${stock.id}" data-type="${stock.Type}" data-spec="${stock.Spec}">
                  ${stock.Type} - ${stock.Nom} (${stock.Spec})
                </option>
              `).join('')}
            </select>
          </label>
          <label>
            Quantité (g) :
            <input type="number" name="Quantité" step="0.01" required>
          </label>
          <input type="hidden" name="RecetteId" value="${recetteId}">
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('modal-add-ingredient-to-recette').style.display = 'block';

  document.getElementById('form-add-ingredient-to-recette').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const ingredientId = formData.get('IngredientId');
    const quantité = parseFloat(formData.get('Quantité'));
    const recetteId = formData.get('RecetteId');

    const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
    const recettes = JSON.parse(localStorage.getItem('recettes')) || [];

    const ingredient = stocks.find(stock => stock.id === ingredientId);
    const recette = recettes.find(r => r.id === recetteId);

    if (ingredient && recette) {
      recette.Ingrédients.push({
        id: ingredient.id,
        Type: ingredient.Type,
        Nom: ingredient.Nom,
        Spec: ingredient.Spec,
        Quantité: quantité
      });

      localStorage.setItem('recettes', JSON.stringify(recettes));
      closeModal('modal-add-ingredient-to-recette');
      showRecetteDetails(recetteId);
    }
  });
}

// Supprimer un ingrédient d'une recette
function removeIngredientFromRecette(recetteId, ingredientId) {
  const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
  const recette = recettes.find(r => r.id === recetteId);

  if (recette) {
    recette.Ingrédients = recette.Ingrédients.filter(ingredient => ingredient.id !== ingredientId);
    localStorage.setItem('recettes', JSON.stringify(recettes));
    showRecetteDetails(recetteId);
  }
}

// Fonction pour fermer les modales
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

// Charger les recettes au démarrage
document.addEventListener('DOMContentLoaded', loadRecettes);
