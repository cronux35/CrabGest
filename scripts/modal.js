// Gestion des modales
let currentEditId = null;
let currentEditType = null;
let currentDeleteCallback = null;

// Ouvrir une modale
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

// Fermer une modale
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Fermer les modales en cliquant sur la croix
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        closeModal(closeBtn.closest('.modal').id);
    });
});

// Fermer les modales en cliquant en dehors
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// Ouvrir modale d'édition
function openEditModal(type, id, data) {
    currentEditType = type;
    currentEditId = id;
    const form = document.getElementById('editForm');
    form.innerHTML = '';

    // Vérifier que data est un objet valide
    if (typeof data !== 'object' || data === null) {
        console.error("Données invalides pour l'édition:", data);
        alert("Erreur : données corrompues. Veuillez actualiser la page.");
        return;
    }

    // Personnaliser le formulaire selon le type
    if (type === 'stock') {
        document.getElementById('editModalTitle').textContent = id ? 'Éditer un ingrédient' : 'Ajouter un ingrédient';
        form.innerHTML = `
            <div class="form-group">
                <label for="edit-type">Type</label>
                <select id="edit-type" class="form-control" required ${id ? 'disabled' : ''}>
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
                <input type="text" id="edit-specification" class="form-control" value="${data.specification || ''}" placeholder="${data.type === 'Malt' ? 'EBC (ex: 3.5)' : '%AA (ex: 8.9)'}">
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
            <button type="button" onclick="${id ? 'saveEdit()' : 'ajouterIngredient()'}" class="btn btn-primary">${id ? 'Enregistrer' : 'Ajouter'}</button>
        `;

        // Gérer l'affichage des champs spécifiques selon le type
        document.getElementById('edit-type').addEventListener('change', function() {
            const type = this.value;
            const specGroup = document.getElementById('specification-group');
            const anneeGroup = document.getElementById('annee-group');
            const specInput = document.getElementById('edit-specification');

            if (type === 'Malt') {
                specGroup.style.display = 'block';
                anneeGroup.style.display = 'none';
                specInput.placeholder = 'EBC (ex: 3.5)';
            } else if (type === 'Houblon') {
                specGroup.style.display = 'block';
                anneeGroup.style.display = 'block';
                specInput.placeholder = '%AA (ex: 8.9)';
            } else {
                specGroup.style.display = 'none';
                anneeGroup.style.display = 'none';
            }
        });
    }
    openModal('editModal');
}

// Sauvegarder les modifications
function saveEdit() {
    if (!currentEditType || currentEditId === null) {
        console.error("Type ou ID manquant pour la sauvegarde.");
        return;
    }

    if (currentEditType === 'stock') {
        const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
        const index = stocks.findIndex(s => s.id === currentEditId);
        if (index !== -1) {
            const type = document.getElementById('edit-type').value;
            const specification = document.getElementById('edit-specification').value;
            const annee = document.getElementById('edit-annee').value;

            stocks[index] = {
                ...stocks[index],
                type: type,
                nom: document.getElementById('edit-nom').value,
                lot: document.getElementById('edit-lot').value,
                quantite: parseFloat(document.getElementById('edit-quantite').value),
                fournisseur: document.getElementById('edit-fournisseur').value,
                specification: (type === 'Malt' || type === 'Houblon') ? specification : null,
                annee_recolte: type === 'Houblon' ? parseInt(annee) || null : null,
                pourcentage_aa: type === 'Houblon' ? parseFloat(specification) || null : null,
                conditionnement: document.getElementById('edit-conditionnement').value,
                notes: document.getElementById('edit-notes').value
            };
            localStorage.setItem('stocks', JSON.stringify(stocks));
            afficherStocks();
            alert("Ingrédient mis à jour avec succès !");
        }
    }
    closeModal('editModal');
}

// Ouvrir modale de suppression
function openDeleteModal(message, callback) {
    document.getElementById('deleteModalMessage').textContent = message;
    currentDeleteCallback = callback;
    openModal('deleteModal');
}

// Confirmer la suppression
document.getElementById('confirmDelete').addEventListener('click', () => {
    if (currentDeleteCallback) {
        currentDeleteCallback();
        currentDeleteCallback = null;
    }
    closeModal('deleteModal');
});

// Annuler la suppression
document.getElementById('cancelDelete').addEventListener('click', () => {
    currentDeleteCallback = null;
    closeModal('deleteModal');
});
