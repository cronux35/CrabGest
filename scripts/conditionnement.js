// Ajouter un conditionnement
function showAddConditionnementForm() {
  const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
  const formHtml = `
    <div class="modal" id="modal-add-conditionnement">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-conditionnement')">&times;</span>
        <h3>Ajouter un conditionnement</h3>
        <form id="form-add-conditionnement">
          <label>Recette:
            <select name="recette_id" required>
              ${recettes.map(r => `<option value="${r.id}">${r.nom}</option>`).join('')}
            </select>
          </label>
          <label>Volume total (L): <input type="number" name="volume" step="0.1" required></label>
          <label>ABV final (%): <input type="number" name="abv_final" step="0.1" required></label>
          <label>Bouteilles 33cl: <input type="number" name="bouteilles_33cl"></label>
          <label>Bouteilles 75cl: <input type="number" name="bouteilles_75cl"></label>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('modal-add-conditionnement').style.display = 'block';

  document.getElementById('form-add-conditionnement').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const conditionnement = {
      recette_id: formData.get('recette_id'),
      volume: parseFloat(formData.get('volume')),
      abv_final: parseFloat(formData.get('abv_final')),
      contenants: {
        bouteilles_33cl: parseInt(formData.get('bouteilles_33cl')) || 0,
        bouteilles_75cl: parseInt(formData.get('bouteilles_75cl')) || 0
      }
    };
    ajouterConditionnement(conditionnement);
    closeModal('modal-add-conditionnement');
  });
}

function ajouterConditionnement(conditionnement) {
  const conditionnements = JSON.parse(localStorage.getItem('conditionnements')) || [];
  conditionnement.id = `cond_${Date.now()}`;
  conditionnement.date = new Date().toISOString();
  conditionnements.push(conditionnement);
  localStorage.setItem('conditionnements', JSON.stringify(conditionnements));
  renderConditionnements();
}
