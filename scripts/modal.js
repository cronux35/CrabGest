let currentEditId = null;
let currentEditType = null;
let currentDeleteCallback = null;

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "block";
}

// Assure-toi que l'ID de la modale est correct
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    } else {
        console.error(`Modale avec l'ID ${modalId} non trouvée.`);
    }
}


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

    title.textContent = id ? `Éditer un${type === 'stock' ? ' ingrédient' : type === 'biere' ? 'e bière' : ' ' + type}` : `Ajouter un${type === 'stock' ? ' ingrédient' : type === 'biere' ? 'e bière' : ' ' + type}`;

    // Générer dynamiquement le formulaire en fonction du type
    form.innerHTML = generateFormFields(type, data);

    openModal('editModal');
}

function generateFormFields(type, data) {
    const fields = [];

    // Champs communs à tous les types
    fields.push(`
        <div class="form-group">
            <label for="edit-nom">Nom</label>
            <input type="text" id="edit-nom" class="form-control" value="${data.nom || ''}" required>
        </div>
    `);

    // Champs spécifiques au type
    switch (type) {
        case 'stock':
            fields.push(`
                <div class="form-group">
                    <label for="edit-type">Type</label>
                    <select id="edit-type" class="form-control" ${data.id ? 'disabled' : ''} required>
                        <option value="">-- Sélectionner un type --</option>
                        <option value="Malt" ${data.type === 'Malt' ? 'selected' : ''}>Malt</option>
                        <option value="Houblon" ${data.type === 'Houblon' ? 'selected' : ''}>Houblon</option>
                        <option value="Levure" ${data.type === 'Levure' ? 'selected' : ''}>Levure</option>
                        <option value="Autre" ${data.type === 'Autre' ? 'selected' : ''}>Autre</option>
                    </select>
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
            `);
            break;

        case 'biere':
            fields.push(`
                <div class="form-group">
                    <label for="edit-abv">ABV (%)</label>
                    <input type="number" id="edit-abv" class="form-control" step="0.1" value="${data.abv || ''}" required>
                </div>
                <div class="form-group">
                    <label for="edit-style">Style</label>
                    <input type="text" id="edit-style" class="form-control" value="${data.style || ''}" required>
                </div>
                <div class="form-group">
                    <label for="edit-description">Description</label>
                    <textarea id="edit-description" class="form-control" rows="3" placeholder="Description de la bière">${data.description || ''}</textarea>
                </div>
            `);
            break;

        // Ajoutez d'autres cas pour d'autres types de données
    }

    // Champ de notes commun à tous les types
    fields.push(`
        <div class="form-group">
            <label for="edit-notes">Notes</label>
            <textarea id="edit-notes" class="form-control" rows="2" placeholder="Informations supplémentaires">${data.notes || ''}</textarea>
        </div>
    `);

    // Bouton de soumission
    fields.push(`
        <button type="button" onclick="${id ? 'saveEdit()' : 'ajouterElement()'}" class="btn btn-primary">
            ${id ? 'Enregistrer' : 'Ajouter'}
        </button>
    `);

    return fields.join('');
}


// Fonction pour recharger les sélecteurs après la fermeture de la modale
function setupModalCloseHandlers() {
    document.getElementById('confirmDelete').addEventListener('click', function() {
        if (currentDeleteCallback) {
            currentDeleteCallback().then(() => {
                if (typeof rechargerSelecteurBieresRetrait === 'function') {
                    rechargerSelecteurBieresRetrait();
                }
            }).catch(error => {
                console.error("Erreur lors de la suppression:", error);
            });
            currentDeleteCallback = null;
        }
        closeModal('deleteModal');
    });

    document.getElementById('cancelDelete').addEventListener('click', function() {
        currentDeleteCallback = null;
        closeModal('deleteModal');
    });
}

function openConditionnementModal() {
    openModal('modale-conditionnement');
}

function closeConditionnementModal() {
    closeModal('modale-conditionnement');
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

// Garde un seul bloc DOMContentLoaded
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

    // Écouteurs pour la modale de suppression
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
