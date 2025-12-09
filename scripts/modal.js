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

    // Personnaliser le formulaire selon le type
    if (type === 'stock') {
        document.getElementById('editModalTitle').textContent = 'Éditer un stock';
        form.innerHTML = `
            <div class="form-group">
                <label for="edit-type">Type</label>
                <input type="text" id="edit-type" class="form-control" value="${data.type}">
            </div>
            <div class="form-group">
                <label for="edit-nom">Nom</label>
                <input type="text" id="edit-nom" class="form-control" value="${data.nom}">
            </div>
            <div class="form-group">
                <label for="edit-lot">Lot</label>
                <input type="text" id="edit-lot" class="form-control" value="${data.lot || ''}">
            </div>
            <div class="form-group">
                <label for="edit-quantite">Quantité</label>
                <input type="number" id="edit-quantite" class="form-control" value="${data.quantite}">
            </div>
            <div class="form-group">
                <label for="edit-fournisseur">Fournisseur</label>
                <input type="text" id="edit-fournisseur" class="form-control" value="${data.fournisseur}">
            </div>
            <div class="form-group">
                <label for="edit-specification">Spécification</label>
                <input type="text" id="edit-specification" class="form-control" value="${data.specification || ''}">
            </div>
            <button onclick="saveEdit()" class="btn btn-primary">Enregistrer</button>
        `;
    } else if (type === 'recette') {
        document.getElementById('editModalTitle').textContent = 'Éditer une recette';
        form.innerHTML = `
            <div class="form-group">
                <label for="edit-nom">Nom</label>
                <input type="text" id="edit-nom" class="form-control" value="${data.nom}">
            </div>
            <div class="form-group">
                <label for="edit-style">Style</label>
                <input type="text" id="edit-style" class="form-control" value="${data.style}">
            </div>
            <div class="form-group">
                <label for="edit-degre">Degré alcoolique</label>
                <input type="number" id="edit-degre" class="form-control" value="${data.degre_alcool}">
            </div>
            <div class="form-group">
                <label for="edit-volume">Volume (L)</label>
                <input type="number" id="edit-volume" class="form-control" value="${data.volume_litres}">
            </div>
            <button onclick="saveEdit()" class="btn btn-primary">Enregistrer</button>
        `;
    } else if (type === 'fermentation') {
        document.getElementById('editModalTitle').textContent = 'Éditer une action de fermentation';
        form.innerHTML = `
            <div class="form-group">
                <label for="edit-date">Date</label>
                <input type="datetime-local" id="edit-date" class="form-control" value="${new Date(data.date).toISOString().slice(0, 16)}">
            </div>
            <div class="form-group">
                <label for="edit-type">Type</label>
                <select id="edit-type" class="form-control">
                    <option value="densite" ${data.type === 'densite' ? 'selected' : ''}>Densité (SG)</option>
                    <option value="temperature" ${data.type === 'temperature' ? 'selected' : ''}>Température (°C)</option>
                    <option value="purge" ${data.type === 'purge' ? 'selected' : ''}>Purge (mL)</option>
                    <option value="pression" ${data.type === 'pression' ? 'selected' : ''}>Pression (bars)</option>
                    <option value="dry_hopping" ${data.type === 'dry_hopping' ? 'selected' : ''}>Dry Hopping (g)</option>
                </select>
            </div>
            <div class="form-group">
                <label for="edit-valeur">Valeur</label>
                <input type="number" id="edit-valeur" class="form-control" value="${data.valeur}">
            </div>
            <button onclick="saveEdit()" class="btn btn-primary">Enregistrer</button>
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
            afficherStocks();
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
            afficherRecettes();
        }
    } else if (currentEditType === 'fermentation') {
        const fermentations = JSON.parse(localStorage.getItem('fermentations'));
        const index = fermentations.findIndex(f => f.id === currentEditId);
        if (index !== -1) {
            fermentations[index] = {
                ...fermentations[index],
                date: document.getElementById('edit-date').value,
                type: document.getElementById('edit-type').value,
                valeur: parseFloat(document.getElementById('edit-valeur').value)
            };
            localStorage.setItem('fermentations', JSON.stringify(fermentations));
            afficherSuiviFermentation(fermentations[index].id_biere);
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
