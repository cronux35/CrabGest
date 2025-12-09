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

    // Convertir data en objet si c'est une chaîne JSON
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data.replace(/&quot;/g, '"'));
        } catch (e) {
            console.error("Erreur de parsing des données:", e);
            return;
        }
    }

    // Personnaliser le formulaire selon le type
    if (type === 'stock') {
        document.getElementById('editModalTitle').textContent = 'Éditer un stock';
        form.innerHTML = `
            <div class="form-group">
                <label for="edit-type">Type</label>
                <input type="text" id="edit-type" class="form-control" value="${data.type || ''}">
            </div>
            <div class="form-group">
                <label for="edit-nom">Nom</label>
                <input type="text" id="edit-nom" class="form-control" value="${data.nom || ''}">
            </div>
            <div class="form-group">
                <label for="edit-lot">Lot</label>
                <input type="text" id="edit-lot" class="form-control" value="${data.lot || ''}">
            </div>
            <div class="form-group">
                <label for="edit-quantite">Quantité</label>
                <input type="number" id="edit-quantite" class="form-control" value="${data.quantite || 0}">
            </div>
            <div class="form-group">
                <label for="edit-fournisseur">Fournisseur</label>
                <input type="text" id="edit-fournisseur" class="form-control" value="${data.fournisseur || ''}">
            </div>
            <div class="form-group">
                <label for="edit-specification">Spécification</label>
                <input type="text" id="edit-specification" class="form-control" value="${data.specification || ''}">
            </div>
            <button type="button" onclick="saveEdit()" class="btn btn-primary">Enregistrer</button>
        `;
    } else if (type === 'recette') {
        document.getElementById('editModalTitle').textContent = 'Éditer une recette';
        form.innerHTML = `
            <div class="form-group">
                <label for="edit-nom">Nom</label>
                <input type="text" id="edit-nom" class="form-control" value="${data.nom || ''}">
            </div>
            <div class="form-group">
                <label for="edit-style">Style</label>
                <input type="text" id="edit-style" class="form-control" value="${data.style || ''}">
            </div>
            <div class="form-group">
                <label for="edit-degre">Degré alcoolique</label>
                <input type="number" id="edit-degre" class="form-control" value="${data.degre_alcool || 0}">
            </div>
            <div class="form-group">
                <label for="edit-volume">Volume (L)</label>
                <input type="number" id="edit-volume" class="form-control" value="${data.volume_litres || 0}">
            </div>
            <button type="button" onclick="saveEdit()" class="btn btn-primary">Enregistrer</button>
        `;
    }

    openModal('editModal');
}

// Sauvegarder les modifications
function saveEdit() {
    if (currentEditType === 'stock') {
        const stocks = JSON.parse(localStorage.getItem('stocks'));
        const index = stocks.findIndex(s => s.id == currentEditId);
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
            if (typeof afficherStocks === 'function') afficherStocks();
        }
    } else if (currentEditType === 'recette') {
        const recettes = JSON.parse(localStorage.getItem('recettes'));
        const index = recettes.findIndex(r => r.id == currentEditId);
        if (index !== -1) {
            recettes[index] = {
                ...recettes[index],
                nom: document.getElementById('edit-nom').value,
                style: document.getElementById('edit-style').value,
                degre_alcool: parseFloat(document.getElementById('edit-degre').value),
                volume_litres: parseFloat(document.getElementById('edit-volume').value)
            };
            localStorage.setItem('recettes', JSON.stringify(recettes));
            if (typeof afficherRecettes === 'function') afficherRecettes();
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
    }
    closeModal('deleteModal');
});

// Annuler la suppression
document.getElementById('cancelDelete').addEventListener('click', () => {
    closeModal('deleteModal');
});
