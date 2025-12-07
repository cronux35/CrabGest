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

// Fonction pour fermer les modales
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  document.getElementById(modalId).remove();
}

// Charger les recettes au démarrage
document.addEventListener('DOMContentLoaded', loadRecettes);
