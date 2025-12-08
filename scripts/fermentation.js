// Ajouter une action de fermentation
function showAddFermentationForm() {
  const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
  const formHtml = `
    <div class="modal" id="modal-add-fermentation">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-fermentation')">&times;</span>
        <h3>Ajouter un suivi</h3>
        <form id="form-add-fermentation">
          <label>Recette:
            <select name="recette_id" required>
              ${recettes.map(r => `<option value="${r.id}">${r.nom}</option>`).join('')}
            </select>
          </label>
          <label>Type:
            <select name="type" required>
              <option value="densite">Densité</option>
              <option value="temperature">Température</option>
              <option value="purge">Purge</option>
              <option value="pression">Pression</option>
              <option value="dry_hopping">Dry Hopping</option>
            </select>
          </label>
          <label>Valeur: <input type="text" name="valeur" required></label>
          <label>Date/Heure: <input type="datetime-local" name="date" required></label>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('modal-add-fermentation').style.display = 'block';

  document.getElementById('form-add-fermentation').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const action = {
      type: formData.get('type'),
      valeur: formData.get('valeur'),
      date: formData.get('date')
    };
    ajouterActionFermentation(formData.get('recette_id'), action);
    closeModal('modal-add-fermentation');
  });
}

function ajouterActionFermentation(recetteId, action) {
  let fermentations = JSON.parse(localStorage.getItem('fermentations')) || [];
  let ferment = fermentations.find(f => f.recette_id === recetteId);
  if (!ferment) {
    ferment = { id: `ferment_${Date.now()}`, recette_id: recetteId, actions: [] };
    fermentations.push(ferment);
  }
  ferment.actions.push(action);
  localStorage.setItem('fermentations', JSON.stringify(fermentations));
  renderFermentation(recetteId);
}

// Afficher les graphiques
function renderFermentation(recetteId) {
  const ferment = JSON.parse(localStorage.getItem('fermentations')) || []
    .find(f => f.recette_id === recetteId);

  if (ferment) {
    const densiteData = ferment.actions
      .filter(a => a.type === 'densite')
      .map(a => ({ x: new Date(a.date), y: parseFloat(a.valeur) }));

    new Chart(document.getElementById('densite-chart'), {
      type: 'line',
      data: { datasets: [{ label: 'Densité (SG)', data: densiteData, borderColor: '#FFD300' }] },
      options: { scales: { x: { type: 'time' } } }
    });
  }
}
