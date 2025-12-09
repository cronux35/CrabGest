// Gestion des modales (version alternative)
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

// Ouvrir modale d'édition (version alternative)
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
        document.getElementById('editModalTitle').textContent = 'Éditer un stock';
        form.innerHTML = `
            <div class="form-group">
                <label for="edit-type">Type</label>
                <input type="text" id="edit-type" class="form-control" value="${data.type || ''}" required>
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
            <div class="form-group">
                <label for="edit-specification">Spécification</label>
                <input type="text" id="edit-specification" class="form-control" value="${data.specification || ''}">
            </div>
            <button type="button" onclick="saveEdit()" class="btn btn-primary">Enregistrer</button>
        `;
    }
    openModal('editModal');
}

// Sauvegarder les modifications (version alternative)
function saveEdit() {
    if (!currentEditType || currentEditId === null) {
        console.error("Type ou ID manquant pour la sauvegarde.");
        return;
    }

    if (currentEditType === 'stock') {
        const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
        const index = stocks.findIndex(s => s.id === currentEditId);
        if (index !== -1) {
            stocks[index] = {
                ...stocks[index],
                type: document.getElementById('edit-type').value,
                nom: document.getElementById('edit-nom').value,
                lot: document.getElementById('edit-lot').value,
                quantite: parseFloat(document.getElementById('edit-quantite').value),
                fournisseur: document.getElementById('edit-fournisseur').value,
                specification: document.getElementById('edit-specification').value
            };
            localStorage.setItem('stocks', JSON.stringify(stocks));
            afficherStocks();
            alert("Stock mis à jour avec succès !");
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
