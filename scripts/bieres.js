// Cache local pour les bières
let bieresCache = [];

// Charger les bières (avec cache)
async function loadBieres(forceReload = false) {
    if (!forceReload && bieresCache.length > 0) {
        return bieresCache; // Retourne le cache si disponible
    }
    bieresCache = await window.DB.loadData('bieres');
    return bieresCache;
}

// Afficher les bières (optimisé)
async function afficherBieres() {
    const bieres = await loadBieres();
    const tbody = document.querySelector('#table-bieres tbody');
    if (!tbody) return;

    tbody.innerHTML = bieres.map(biere => `
        <tr data-id="${biere.id}">
            <td>${biere.id}</td>
            <td>${biere.nom}</td>
            <td>${biere.style || '-'}</td>
            <td>${biere.degre || '-'}</td>
            <td>${biere.volume || '-'}</td>
            <td>
                ${biere.ingredients && biere.ingredients.length > 0 ?
                    `<button class="action-btn info-btn" data-action="info" title="Voir les ingrédients utilisés">
                        <i class="material-icons">info</i>
                    </button>` : ''}
                <button class="action-btn edit-btn" data-action="edit" title="Éditer">
                    <i class="material-icons">edit</i>
                </button>
                <button class="action-btn delete-btn" data-action="delete" title="Supprimer">
                    <i class="material-icons">delete</i>
                </button>
            </td>
        </tr>
    `).join('');

    attachBiereEventListeners();
}

// Recharger les sélecteurs de bières (optimisé)
async function rechargerSelecteursBieres() {
    const bieres = await loadBieres();

    const selectBiereRetrait = document.getElementById('select-biere-retrait');
    if (selectBiereRetrait) {
        selectBiereRetrait.innerHTML = '<option value="">-- Bière --</option>';
        bieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            selectBiereRetrait.appendChild(option);
        });
    }

    const selectBiereFermentation = document.getElementById('select-biere-fermentation');
    if (selectBiereFermentation) {
        selectBiereFermentation.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
        bieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            selectBiereFermentation.appendChild(option);
        });
    }

    const selectBiereConditionnement = document.getElementById('select-biere-conditionnement');
    if (selectBiereConditionnement) {
        selectBiereConditionnement.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
        bieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            selectBiereConditionnement.appendChild(option);
        });
    }
}

// Écouteurs dynamiques pour les actions sur les bières
function attachBiereEventListeners() {
    const tbody = document.querySelector('#table-bieres tbody');
    if (!tbody) return;

    // Détacher l'ancien écouteur s'il existe
    const oldHandler = tbody.onclick;
    if (oldHandler) {
        tbody.onclick = null;
    }

    tbody.onclick = async (e) => {
        const target = e.target.closest('button[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const id = target.closest('tr').dataset.id;

        try {
            const biere = await window.DB.loadItemById('bieres', id);
            if (!biere) {
                console.error("Bière non trouvée pour l'ID:", id);
                return;
            }

            switch (action) {
                case 'info':
                    await voirIngredientsBiere(id);
                    break;
                case 'edit':
                    await openEditBiereModal(id);
                    break;
                case 'delete':
                    await deleteBiere(id);
                    break;
            }
        } catch (error) {
            console.error("Erreur lors de l'action sur la bière:", error);
        }
    };
}

// Voir les ingrédients d'une bière (optimisé)
async function voirIngredientsBiere(id) {
    try {
        let biere = bieresCache.find(b => b.id === id);
        if (!biere) {
            biere = await window.DB.loadItemById('bieres', id);
        }

        if (!biere || !biere.ingredients || biere.ingredients.length === 0) {
            alert("Aucun ingrédient utilisé pour cette bière.");
            return;
        }

        const ingredientsInfo = biere.ingredients.map(ing => {
            return `${ing.nom}: ${Math.abs(ing.quantite_utilisee)}g (dernier retrait: ${new Date(ing.date_dernier_retrait).toLocaleDateString()})`;
        }).join('\n');

        alert(`Ingrédients pour "${biere.nom}":\n\n${ingredientsInfo}`);
    } catch (error) {
        console.error("Erreur lors de l'affichage des ingrédients:", error);
        alert("Erreur lors de l'affichage des ingrédients.");
    }
}

// Ouvrir la modale d'édition (optimisé)
async function openEditBiereModal(id) {
    try {
        let biere = bieresCache.find(b => b.id === id);
        if (!biere) {
            biere = await window.DB.loadItemById('bieres', id);
        }
        if (!biere) return;

        const modal = document.getElementById('editModal');
        const form = document.getElementById('editForm');
        const title = document.getElementById('editModalTitle');

        if (!modal || !form || !title) return;

        title.textContent = 'Éditer une bière';
        form.innerHTML = `
            <div class="form-group">
                <label for="edit-nom-biere">Nom</label>
                <input type="text" id="edit-nom-biere" class="form-control" value="${biere.nom || ''}" required>
            </div>
            <div class="form-group">
                <label for="edit-style-biere">Style</label>
                <input type="text" id="edit-style-biere" class="form-control" value="${biere.style || ''}">
            </div>
            <div class="form-group">
                <label for="edit-degre-biere">Degré alcoolique</label>
                <input type="number" id="edit-degre-biere" class="form-control" value="${biere.degre || ''}" step="0.1">
            </div>
            <div class="form-group">
                <label for="edit-volume-biere">Volume (L)</label>
                <input type="number" id="edit-volume-biere" class="form-control" value="${biere.volume || ''}" step="0.1">
            </div>
            <div class="form-group">
                <label>Ingrédients utilisés</label>
                <div class="ingredients-list">
                    ${biere.ingredients && biere.ingredients.length > 0 ?
                        biere.ingredients.map(ing => `
                            <div class="ingredient-item">
                                <span>${ing.nom}: ${Math.abs(ing.quantite_utilisee)}g</span>
                                <span>${ing.date_dernier_retrait ? new Date(ing.date_dernier_retrait).toLocaleDateString() : ''}</span>
                            </div>
                        `).join('') : '<div>Aucun ingrédient utilisé</div>'}
                </div>
            </div>
            <button type="button" id="saveEditBiereBtn" class="btn btn-primary">Enregistrer</button>
        `;

        document.getElementById('saveEditBiereBtn').onclick = async () => {
            await saveEditBiere(id);
        };

        openModal('editModal');
    } catch (error) {
        console.error("Erreur lors du chargement de la bière:", error);
        alert("Erreur lors du chargement de la bière.");
    }
}

// Sauvegarder une bière modifiée (optimisé)
async function saveEditBiere(id) {
    try {
        const updatedBiere = {
            id: id,
            nom: document.getElementById('edit-nom-biere').value,
            style: document.getElementById('edit-style-biere').value,
            degre: parseFloat(document.getElementById('edit-degre-biere').value),
            volume: parseFloat(document.getElementById('edit-volume-biere').value)
        };

        await window.DB.updateItem('bieres', updatedBiere);

        // Mettre à jour le cache local
        const index = bieresCache.findIndex(b => b.id === id);
        if (index !== -1) {
            bieresCache[index] = updatedBiere;
        }

        alert("Bière mise à jour avec succès !");
        closeModal('editModal');
        afficherBieres();
    } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        alert("Erreur lors de la sauvegarde.");
    }
}

// Ajouter une bière (optimisé)
async function ajouterBiere() {
    const nom = document.getElementById('nom-biere').value;
    const style = document.getElementById('style-biere').value;
    const degre = parseFloat(document.getElementById('degre-biere').value);
    const volume = parseFloat(document.getElementById('volume-biere').value);

    if (!nom) {
        alert("Veuillez au moins indiquer un nom pour la bière.");
        return;
    }

    try {
        const nouvelleBiere = {
            nom: nom,
            style: style,
            degre: degre,
            volume: volume,
            ingredients: []
        };

        await window.DB.addItem('bieres', nouvelleBiere);
        alert(`La bière "${nom}" a été ajoutée avec succès.`);

        // Réinitialiser le formulaire
        document.getElementById('nom-biere').value = '';
        document.getElementById('style-biere').value = '';
        document.getElementById('degre-biere').value = '';
        document.getElementById('volume-biere').value = '';

        // Recharger le cache et afficher les bières
        await loadBieres(true); // Force le rechargement
        afficherBieres();
        rechargerSelecteursBieres();
    } catch (error) {
        console.error("Erreur lors de l'ajout de la bière:", error);
        alert("Une erreur est survenue lors de l'ajout de la bière.");
    }
}

// Supprimer une bière (optimisé)
async function deleteBiere(id) {
    try {
        const biere = await window.DB.loadItemById('bieres', id);
        if (!biere) return;

        const confirmDelete = confirm(`Voulez-vous vraiment supprimer "${biere.nom}" ?`);
        if (!confirmDelete) return;

        await window.DB.deleteItem('bieres', id);

        // Mettre à jour le cache local
        bieresCache = bieresCache.filter(b => b.id !== id);

        afficherBieres();
        rechargerSelecteursBieres();
    } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression.");
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', afficherBieres);
