// Ajouter une bière
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

        await addItem('bieres', nouvelleBiere);
        alert(`La bière "${nom}" a été ajoutée avec succès.`);

        // Réinitialiser le formulaire
        document.getElementById('nom-biere').value = '';
        document.getElementById('style-biere').value = '';
        document.getElementById('degre-biere').value = '';
        document.getElementById('volume-biere').value = '';

        // Recharger les données
        await afficherBieres();
        await rechargerSelecteursBieres();
    } catch (error) {
        console.error("Erreur lors de l'ajout de la bière:", error);
        alert("Une erreur est survenue lors de l'ajout de la bière.");
    }
}

// Sauvegarder une bière éditée
async function saveEditBiere(id) {
    try {
        const updatedBiere = {
            id: id,
            nom: document.getElementById('edit-nom-biere').value,
            style: document.getElementById('edit-style-biere').value,
            degre: parseFloat(document.getElementById('edit-degre-biere').value),
            volume: parseFloat(document.getElementById('edit-volume-biere').value)
        };

        await updateItem('bieres', updatedBiere);
        alert("Bière mise à jour avec succès !");
        closeModal('editModal');
        await afficherBieres();
        await rechargerSelecteursBieres();
        if (typeof afficherHistoriqueRetraits === 'function') afficherHistoriqueRetraits();
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de la bière:", error);
        alert("Une erreur est survenue lors de la sauvegarde.");
    }
}

// Recharger les sélecteurs de bières dans tous les onglets
async function rechargerSelecteursBieres() {
    try {
        const bieres = await loadData('bieres').catch(() => []);

        // Mettre à jour le sélecteur de retrait de stock
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

        // Mettre à jour le sélecteur de fermentation
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

        // Mettre à jour le sélecteur de conditionnement
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
    } catch (error) {
        console.error("Erreur lors du rechargement des sélecteurs de bières:", error);
    }
}

// Afficher les bières
async function afficherBieres() {
    try {
        const bieres = await loadData('bieres').catch(() => []);
        const tbody = document.querySelector('#table-bieres tbody');

        if (tbody) {
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
            attachBiereEventListeners(); // Attacher les écouteurs après génération
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage des bières:", error);
    }
}

// Afficher les ingrédients utilisés pour une bière
async function voirIngredientsBiere(biereId) {
    try {
        const biere = await loadItemById('bieres', biereId).catch(() => null);
        if (!biere || !biere.ingredients || biere.ingredients.length === 0) {
            alert("Aucun ingrédient utilisé pour cette bière.");
            return;
        }

        const ingredientsInfo = biere.ingredients.map(ing => {
            return `${ing.nom}: ${ing.quantite_utilisee}g (dernier retrait: ${new Date(ing.date_dernier_retrait).toLocaleDateString()})`;
        }).join('\n');

        alert(`Ingrédients utilisés pour "${biere.nom}":\n\n${ingredientsInfo}`);
    } catch (error) {
        console.error("Erreur lors de l'affichage des ingrédients:", error);
        alert("Une erreur est survenue.");
    }
}

// Ouvrir modale d'édition de bière
async function openEditBiereModal(id) {
    try {
        const biere = await loadItemById('bieres', id);
        const modal = document.getElementById('editModal');
        const form = document.getElementById('editForm');
        const title = document.getElementById('editModalTitle');

        if (!modal || !form || !title) {
            console.error("Éléments de la modale introuvables");
            return;
        }

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
                                <span>${ing.nom}: ${ing.quantite_utilisee}g</span>
                                <span>${ing.date_dernier_retrait ? new Date(ing.date_dernier_retrait).toLocaleDateString() : ''}</span>
                            </div>
                        `).join('') : '<div>Aucun ingrédient utilisé</div>'}
                </div>
            </div>
            <button type="button" id="saveEditBiereBtn" class="btn btn-primary">
                Enregistrer
            </button>
        `;

        // Écouteur dynamique pour le bouton Enregistrer
        document.getElementById('saveEditBiereBtn').addEventListener('click', () => saveEditBiere(id));

        openModal('editModal');
    } catch (error) {
        console.error("Erreur lors du chargement de la bière:", error);
    }
}

// Attacher les écouteurs d'événements pour les actions sur les bières
function attachBiereEventListeners() {
    const tbody = document.querySelector('#table-bieres tbody');
    if (!tbody) return;

    tbody.addEventListener('click', async (e) => {
        const target = e.target.closest('button[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const id = target.closest('tr').dataset.id;

        try {
            const biere = await loadItemById('bieres', id);
            if (!biere) {
                console.error("Bière non trouvée pour l'ID:", id);
                return;
            }

            switch (action) {
                case 'info':
                    voirIngredientsBiere(id);
                    break;
                case 'edit':
                    openEditBiereModal(id);
                    break;
                case 'delete':
                    openDeleteModal(
                        `Voulez-vous vraiment supprimer "${biere.nom}" ?`,
                        async () => {
                            await deleteItem('bieres', id);
                            await afficherBieres();
                        }
                    );
                    break;
            }
        } catch (error) {
            console.error("Erreur lors de l'action sur la bière:", error);
        }
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', afficherBieres);
