// Variable globale pour éviter les doubles clics
let isAddingBiere = false;

// Charger les bières (avec cache)
async function loadBieres(forceReload = false) {
    if (!forceReload && window.appDataCache.bieres.length > 0) {
        return window.appDataCache.bieres;
    }
    window.appDataCache.bieres = await window.DB.loadData('bieres');
    return window.appDataCache.bieres;
}

// Afficher les bières
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

// Recharger les sélecteurs de bières
async function rechargerSelecteursBieres() {
    const bieres = await loadBieres();

    const selectors = [
        { id: 'select-biere-retrait', label: '-- Bière --' },
        { id: 'select-biere-fermentation', label: '-- Sélectionner une bière --' },
        { id: 'select-biere-conditionnement', label: '-- Sélectionner une bière --' }
    ];

    selectors.forEach(({ id, label }) => {
        const selectElement = document.getElementById(id);
        if (selectElement) {
            selectElement.innerHTML = `<option value="">${label}</option>`;
            bieres.forEach(biere => {
                const option = document.createElement('option');
                option.value = biere.id;
                option.textContent = biere.nom;
                selectElement.appendChild(option);
            });
        }
    });
}

// Écouteurs dynamiques pour les actions sur les bières
function attachBiereEventListeners() {
    const tbody = document.querySelector('#table-bieres tbody');
    if (!tbody) return;

    // Détache l'ancien écouteur s'il existe
    const oldHandler = tbody.onclick;
    if (oldHandler) {
        tbody.onclick = null;
    }

    // Attache le nouvel écouteur
    tbody.onclick = async (e) => {
        const target = e.target.closest('button[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const id = target.closest('tr').dataset.id;

        try {
            const biere = window.appDataCache.bieres.find(b => b.id === id);
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

// Voir les ingrédients d'une bière
async function voirIngredientsBiere(id) {
    try {
        let biere = window.appDataCache.bieres.find(b => b.id === id);
        if (!biere) {
            biere = await window.DB.loadItemById('bieres', id);
            if (biere) {
                const index = window.appDataCache.bieres.findIndex(b => b.id === id);
                if (index === -1) {
                    window.appDataCache.bieres.push(biere);
                }
            }
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

// Ouvrir la modale d'édition
async function openEditBiereModal(id) {
    try {
        let biere = window.appDataCache.bieres.find(b => b.id === id);
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

        // Écouteur pour le bouton "Enregistrer"
        setTimeout(() => {
            const btnEnregistrer = document.getElementById('saveEditBiereBtn');
            if (btnEnregistrer) {
                btnEnregistrer.onclick = null;
                btnEnregistrer.removeEventListener('click', saveEditBiere);
                btnEnregistrer.addEventListener('click', () => saveEditBiere(id));
            }
        }, 100);

        openModal('editModal');
    } catch (error) {
        console.error("Erreur lors du chargement de la bière:", error);
        alert("Erreur lors du chargement de la bière.");
    }
}

// Sauvegarder une bière modifiée
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

        // Mettre à jour le cache global
        const index = window.appDataCache.bieres.findIndex(b => b.id === id);
        if (index !== -1) {
            window.appDataCache.bieres[index] = updatedBiere;
        }

        alert("Bière mise à jour avec succès !");
        closeModal('editModal');
        afficherBieres();
    } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        alert("Erreur lors de la sauvegarde.");
    }
}

// Ajouter une bière
async function ajouterBiere() {
    if (isAddingBiere) {
        console.log("Double appel détecté !");
        return;
    }
    isAddingBiere = true;

    try {
        const nom = document.getElementById('nom-biere').value;
        const style = document.getElementById('style-biere').value;
        const degre = parseFloat(document.getElementById('degre-biere').value);
        const volume = parseFloat(document.getElementById('volume-biere').value);

        if (!nom) {
            alert("Veuillez au moins indiquer un nom pour la bière.");
            return;
        }

        const nouvelleBiere = {
            nom: nom,
            style: style,
            degre: degre,
            volume: volume,
            ingredients: []
        };

        const newId = await window.DB.addItem('bieres', nouvelleBiere);
        nouvelleBiere.id = newId;
        window.appDataCache.bieres.push(nouvelleBiere);

        // Met à jour le tableau sans tout recharger
        const tbody = document.querySelector('#table-bieres tbody');
        if (tbody) {
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-id', newId);
            newRow.innerHTML = `
                <td>${newId}</td>
                <td>${nom}</td>
                <td>${style || '-'}</td>
                <td>${degre || '-'}</td>
                <td>${volume || '-'}</td>
                <td>
                    <button class="action-btn edit-btn" data-action="edit" title="Éditer">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="action-btn delete-btn" data-action="delete" title="Supprimer">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            `;
            tbody.appendChild(newRow);
        }

        // Réinitialiser le formulaire
        document.getElementById('nom-biere').value = '';
        document.getElementById('style-biere').value = '';
        document.getElementById('degre-biere').value = '';
        document.getElementById('volume-biere').value = '';

        rechargerSelecteursBieres();
        alert(`La bière "${nom}" a été ajoutée avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'ajout de la bière:", error);
        alert("Une erreur est survenue lors de l'ajout de la bière.");
    } finally {
        isAddingBiere = false;
    }
}

// Supprimer une bière
async function deleteBiere(id) {
    try {
        const biere = window.appDataCache.bieres.find(b => b.id === id);
        if (!biere) return;

        const confirmDelete = confirm(`Voulez-vous vraiment supprimer "${biere.nom}" ?`);
        if (!confirmDelete) return;

        await window.DB.deleteItem('bieres', id);

        // Mettre à jour le cache global
        window.appDataCache.bieres = window.appDataCache.bieres.filter(b => b.id !== id);

        afficherBieres();
        rechargerSelecteursBieres();
    } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression.");
    }
}

// Initialisation des écouteurs
document.addEventListener('DOMContentLoaded', () => {
    // Écouteur pour le bouton "Ajouter Bière"
    const btnAjouterBiere = document.getElementById('btn-ajouter-biere');
    if (btnAjouterBiere) {
        btnAjouterBiere.addEventListener('click', ajouterBiere);
    }
});
