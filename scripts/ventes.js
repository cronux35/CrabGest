function showAddVenteForm() {
  const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
  const formHtml = `
    <div class="modal" id="modal-add-vente">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-vente')">&times;</span>
        <h3>Ajouter une vente</h3>
        <form id="form-add-vente">
          <label>
            Recette :
            <select name="RecetteId" required>
              ${recettes.map(recette => `
                <option value="${recette.id}">${recette.Nom}</option>
              `).join('')}
            </select>
          </label>
          <label>Client : <input name="client" required></label>
          <label>Quantité : <input type="number" name="quantite" step="0.01" required></label>
          <label>Prix unitaire : <input type="number" name="prix_unitaire" step="0.01" required></label>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('modal-add-vente').style.display = 'block';

  document.getElementById('form-add-vente').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const entry = Object.fromEntries(formData.entries());
    entry.date = new Date().toISOString().split('T')[0];
    entry.total = entry.quantite * entry.prix_unitaire;

    const ventes = JSON.parse(localStorage.getItem('ventes')) || [];
    ventes.push(entry);
    localStorage.setItem('ventes', JSON.stringify(ventes));
    e.target.reset();
    closeModal('modal-add-vente');
    location.reload();
  });
}
