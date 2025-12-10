// Variables globales pour les modales
let currentEditId = null;
let currentEditType = null;
let currentDeleteCallback = null;

// Ouvrir une modale
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "block";
}

// Fermer une modale
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

// Ouvrir modale d'édition
function openEditModal(type, id, data) {
    currentEditType = type;
    currentEditId = id;
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editForm');
    const title = document.getElementById('editModalTitle');

    if (!modal || !form || !title) {
        console.error("Éléments de la modale introuvables");
        return;
    }

    title.textContent = id ? 'Éditer un ingrédient' : 'Ajouter un ingrédient';
    form.innerHTML = `
        <div class="form-group">
            <label for="edit-type">Type</label>
            <select id="edit-type" class="form-control" ${id ? 'disabled' : ''} required>
                <option value="">-- Sélectionner --</option>
                <option value="Malt" ${data.type === 'Malt' ? 'selected' : ''}>Malt</option>
                <option value="Houblon" ${data.type === 'Houblon' ? 'selected' : ''}>Houblon</option>
                <option value="Levure" ${data.type === 'Levure' ? 'selected' : ''}>Levure</option>
            </select>
        </div>
        <div class="form-group">
            <label for="edit-nom">Nom</label>
            <input type="text" id="edit-nom" class="form-control" value="${data.nom || ''}" required>
        </div>
        <!-- Autres champs -->
        <button type="button" onclick="${id ? 'saveEdit()' : 'ajouterIngredient()'}"
                class="btn btn-primary">${id ? 'Enregistrer' : 'Ajouter'}</button>
    `;

    openModal('editModal');
}

// Ouvrir modale de suppression
function openDeleteModal(message, callback) {
    document.getElementById('deleteModalMessage').textContent = message;
    currentDeleteCallback = callback;
    openModal('deleteModal');
}

// Initialisation des écouteurs de modales
document.addEventListener('DOMContentLoaded', function() {
    // Fermer les modales
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('.modal').id));
    });

    // Boutons de la modale de suppression
    document.getElementById('confirmDelete').addEventListener('click', () => {
        if (currentDeleteCallback) {
            currentDeleteCallback();
            currentDeleteCallback = null;
        }
        closeModal('deleteModal');
    });

    document.getElementById('cancelDelete').addEventListener('click', () => {
        currentDeleteCallback = null;
        closeModal('deleteModal');
    });
});
