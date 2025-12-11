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

// Ouvrir modale de suppression
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

// Fermer les modales en cliquant sur la croix ou en dehors
document.addEventListener('DOMContentLoaded', function() {
    // Fermer les modales en cliquant sur la croix
    document.querySelectorAll('.close').forEach(function(closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal(closeBtn.closest('.modal').id);
        });
    });

    // Fermer les modales en cliquant en dehors
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });

    // Gestion des boutons de suppression
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

// Fonction pour ajouter un ingrédient
function ajouterIngredient() {
    const type = document.getElementById('edit-type').value;
    const nom = document.getElementById('edit-nom').value;
    const lot = document.getElementById('edit-lot').value;
    const quantite = parseFloat(document.getElementById('edit-quantite').value);
    const fournisseur = document.getElementById('edit-fournisseur').value;
    const specification = document.getElementById('edit-specification').value;
    const annee = document.getElementById('edit-annee').value;
    const conditionnement = document.getElementById('edit-conditionnement').value;
    const notes = document.getElementById('edit-notes').value;

    if (!type || !nom || !fournisseur || isNaN(quantite)) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
    }

    const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
    const id = stocks.length > 0 ? Math.max(...stocks.map(s => s.id)) + 1 : 1;

    const nouvelIngredient = {
        id: id,
        type: type,
        nom: nom,
        lot: lot,
        quantite: quantite,
        fournisseur: fournisseur,
        specification: (type === 'Malt' || type === 'Houblon') ? specification : null,
        annee_recolte: type === 'Houblon' ? parseInt(annee) || null : null,
        pourcentage_aa: type === 'Houblon' ? parseFloat(specification) || null : null,
        conditionnement: conditionnement || 'non spécifié',
        notes: notes
    };

    stocks.push(nouvelIngredient);
    localStorage.setItem('stocks', JSON.stringify(stocks));
    afficherStocks(); // Fonction définie dans stocks.js
    closeModal('editModal');
    alert(`L'ingrédient "${nom}" a été ajouté avec succès.`);
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
            afficherStocks(); // Rafraîchir l'affichage
            alert("Ingrédient mis à jour avec succès !");
        }
    }
    closeModal('editModal');
}
