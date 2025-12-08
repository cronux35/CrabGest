// Calculer le coût d'une recette
function calculerCoutRecette(recette) {
  return recette.ingredients.reduce((total, ing) => total + ing.cout, 0);
}

// Ajouter une recette
function showAddRecetteForm() {
  const formHtml = `
    <div class="modal" id="modal-add-recette">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-recette')">&times;</span>
        <h3>Ajouter une recette</h3>
        <form id="form-add-recette">
          <label>Nom: <input type="text" name="nom" required></label>
          <label>Style: <input type="text" name="style" required></label>
          <label>ABV cible (%): <input type="number" name="abv_cible" step="0.1" required></label>
          <label>Volume (L): <input type="number" name="volume" step="0.1" required></label>
          <label>Coût calculé (€): <input type="text" id="recette-cout-calcule" readonly></label>
          <label>Coût manuel (€): <input type="number" id="recette-cout-manual" step="0.01"></label>
          <button type="button" id="recette-reset-cout" style="display: none;">Réinitialiser</button>
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
    const recette = {
      id: `rec_${Date.now()}`,
      nom: formData.get('nom'),
      style: formData.get('style'),
      abv_cible: parseFloat(formData.get('abv_cible')),
      volume: parseFloat(formData.get('volume')),
      ingredients: [],
      cout_calcule: 0,
      cout_manual: formData.get('recette-cout-manual') || null,
      cout_override: !!formData.get('recette-cout-manual')
    };
    ajouterRecette(recette);
    closeModal('modal-add-recette');
  });
}

function ajouterRecette(recette) {
  const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
  recettes.push(recette);
  localStorage.setItem('recettes', JSON.stringify(recettes));
  renderRecettes();
}

// Mettre à jour le coût manuel
function updateCoutManual(recetteId, coutManual) {
  const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
  const recette = recettes.find(r => r.id === recetteId);
  if (recette) {
    recette.cout_manual = parseFloat(coutManual);
    recette.cout_override = true;
    localStorage.setItem('recettes', JSON.stringify(recettes));
    renderRecettes();
  }
}

// Ajouter un ingrédient à une recette
function showAddIngredientToRecetteForm(recetteId) {
  const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
  const formHtml = `
    <div class="modal" id="modal-add-ingredient-to-recette">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-ingredient-to-recette')">&times;</span>
        <h3>Ajouter un ingrédient</h3>
        <form id="form-add-ingredient-to-recette">
          <label>Ingrédient:
            <select name="ingredient_id" required>
              ${stocks.map(stock => `<option value="${stock.id}">${stock.type} - ${stock.nom}</option>`).join('')}
            </select>
          </label>
          <label>Quantité (g): <input type="number" name="quantite" step="0.01" required></label>
          <input type="hidden" name="recette_id" value="${recetteId}">
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
    const ingredientId = formData.get('ingredient_id');
    const quantite = parseFloat(formData.get('quantite'));
    const stock = stocks.find(s => s.id === ingredientId);
    const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
    const recette = recettes.find(r => r.id === recetteId);

    recette.ingredients.push({
      ingredient_id: ingredientId,
      nom: stock.nom,
      quantite: quantite,
      prix_kg: stock.prix_kg,
      cout: (quantite * stock.prix_kg) / 1000
    });

    recette.cout_calcule = calculerCoutRecette(recette);
    localStorage.setItem('recettes', JSON.stringify(recettes));
    closeModal('modal-add-ingredient-to-recette');
    showRecetteDetails(recetteId);
  });
}
