let currentEditId = null;
let currentEditType = null;
let currentDeleteCallback = null;

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "block";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    } else {
        console.error(`Modale avec l'ID ${modalId} non trouvée.`);
    }
}

function openEditIngredientModal(type, id, data) {
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
                <option value="">-- Sélectionner un type --</option>
                <option value="Malt" ${data.type === 'Malt' ? 'selected' : ''}>Malt</option>
                <option value="Houblon" ${data.type === 'Houblon' ? 'selected' : ''}>Houblon</option>
                <option value="Levure" ${data.type === 'Levure' ? 'selected' : ''}>Levure</option>
                <option value="Autre" ${data.type === 'Autre' ? 'selected' : ''}>Autre</option>
            </select>
        </div>
        <div class="form-group">
            <label for="edit-nom">Nom</label>
            <input type="text" id="edit-nom" class="form-control" value="${data.nom || ''}" required>
        </div>
        <div class="form-group">
            <label for="edit-lot">Lot</label>
            <input type="text" id="edit-lot" class="form-control" value="${data.lot || ''}">
        </div>
        <div class="form-group">
            <label for="edit-quantite">Quantité (g)</label>
            <input type="number" id="edit-quantite" class="form-control" value="${data.quantite || 0}" min="0" required>
        </div>
        <div class="form-group">
            <label for="edit-fournisseur">Fournisseur</label>
            <input type="text" id="edit-fournisseur" class="form-control" value="${data.fournisseur || ''}" required>
        </div>
        <div class="form-group" id="specification-group" style="${(data.type === 'Malt' || data.type === 'Houblon') ? 'block' : 'none'}">
            <label for="edit-specification">Spécification</label>
            <input type="text" id="edit-specification" class="form-control" value="${data.specification || ''}"
                   placeholder="${data.type === 'Malt' ? 'EBC (ex: 3.5)' : data.type === 'Houblon' ? '%AA (ex: 8.9)' : ''}">
        </div>
        <div class="form-group" id="annee-group" style="${data.type === 'Houblon' ? 'block' : 'none'}">
            <label for="edit-annee">Année de récolte</label>
            <input type="number" id="edit-annee" class="form-control" value="${data.annee_recolte || ''}" placeholder="Année (ex: 2023)">
        </div>
        <div class="form-group">
            <label for="edit-conditionnement">Conditionnement</label>
            <input type="text" id="edit-conditionnement" class="form-control" value="${data.conditionnement || ''}" placeholder="ex: Sac de 25 kg">
        </div>
        <div class="form-group">
            <label for="edit-notes">Notes</label>
            <textarea id="edit-notes" class="form-control" rows="2" placeholder="Informations supplémentaires">${data.notes || ''}</textarea>
        </div>
        <button type="button" onclick="${id ? 'saveEdit()' : 'ajouterIngredient()'}" class="btn btn-primary">
            ${id ? 'Enregistrer' : 'Ajouter'}
        </button>
    `;

    document.getElementById('edit-type').addEventListener('change', function() {
        const type = this.value;
        const specGroup = document.getElementById('specification-group');
        const anneeGroup = document.getElementById('annee-group');
        const specInput = document.getElementById('edit-specification');

        if (type === 'Malt') {
            specGroup.style.display = 'block';
            anneeGroup.style.display = 'none';
            specInput.placeholder = 'EBC (ex: 3.5)';
        }
        else if (type === 'Houblon') {
            specGroup.style.display = 'block';
            anneeGroup.style.display = 'block';
            specInput.placeholder = '%AA (ex: 8.9)';
        }
        else {
            specGroup.style.display = 'none';
            anneeGroup.style.display = 'none';
        }
    });

    openModal('editModal');
}

function openDeleteModal(message, callback) {
    const modal = document.getElementById('deleteModal');
    const messageElement = document.getElementById('deleteModalMessage');

    if (!modal || !messageElement) {
        console.error("Éléments de la modale de suppression introuvables");
        return;
    }

    messageElement.textContent = message;
    currentDeleteCallback = callback;
    openModal('deleteModal');
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.close').forEach(function(closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal(closeBtn.closest('.modal').id);
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    document.getElementById('confirmDelete').addEventListener('click', function() {
        if (currentDeleteCallback) {
            currentDeleteCallback();
            currentDeleteCallback = null;
        }
        closeModal('deleteModal');
    });

    document.getElementById('cancelDelete').addEventListener('click', function() {
        currentDeleteCallback = null;
        closeModal('deleteModal');
    });
});
