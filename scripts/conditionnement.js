function genLot() {
  return 'LOT-' + Date.now();
}

function showAddConditionnementForm() {
  const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
  const formHtml = `
    <div class="modal" id="modal-add-conditionnement">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-conditionnement')">&times;</span>
        <h3>Ajouter un conditionnement</h3>
        <form id="form-add-conditionnement">
          <label>
            Recette :
            <select name="RecetteId" required>
              ${recettes.map(recette => `
                <option value="${recette.id}">${recette.Nom}</option>
              `).join('')}
            </select>
          </label>
          <label>Volume (L) : <input type="number" name="volume_total" step="0.01" required></label>
          <label>Fûts : <input type="number" name="futs"></label>
          <label>Bouteilles 33cl : <input type="number" name="bouteilles_33"></label>
          <label>Bouteilles 75cl : <input type="number" name="bouteilles_75"></label>
          <label>Canettes 44cl : <input type="number" name="canettes_44"></label>
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
    const entry = Object.fromEntries(formData.entries());
    entry.date = new Date().toISOString().split('T')[0];
    entry.lot = genLot();

    const conditionnement = JSON.parse(localStorage.getItem('conditionnement')) || [];
    conditionnement.push(entry);
    localStorage.setItem('conditionnement', JSON.stringify(conditionnement));
    e.target.reset();
    closeModal('modal-add-conditionnement');
    location.reload();
  });
}
