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
        document.getElementById('nom-biere').value = '';
        document.getElementById('style-biere').value = '';
        document.getElementById('degre-biere').value = '';
        document.getElementById('volume-biere').value = '';
        afficherBieres();
    } catch (error) {
        console.error("Erreur lors de l'ajout de la bière:", error);
        alert("Une erreur est survenue lors de l'ajout de la bière.");
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
                            `<button class="action-btn info-btn" title="Voir les ingrédients utilisés" onclick="voirIngredientsBiere(${biere.id})">
                                <i class="material-icons">info</i>
                            </button>` : ''}
                        <button class="action-btn edit-btn" onclick="openEditBiereModal(${biere.id})" title="Éditer">
                            <i class="material-icons">edit</i>
                        </button>
                        <button class="action-btn delete-btn" onclick="openDeleteModal('Voulez-vous vraiment supprimer cette bière ?', async () => { await deleteItem('bieres', ${biere.id}); afficherBieres(); })" title="Supprimer">
                            <i class="material-icons">delete</i>
                        </button>
                    </td>
                </tr>
            `).join('');
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
function openEditBiereModal(id) {
    loadItemById('bieres', id).then(biere => {
        currentEditType = 'biere';
        currentEditId = id;
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
            <button type="button" onclick="saveEditBiere(${biere.id})" class="btn btn-primary">
                Enregistrer
            </button>
        `;

        openModal('editModal');
    }).catch(error => {
        console.error("Erreur lors du chargement de la bière:", error);
    });
}

// Sauvegarder les modifications d'une bière
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
        afficherBieres();
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de la bière:", error);
        alert("Une erreur est survenue lors de la sauvegarde.");
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', afficherBieres);
