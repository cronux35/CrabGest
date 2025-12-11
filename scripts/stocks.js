let stockTableBody = null;

// Charger les données des stocks et bières
async function chargerDonnees() {
    try {
        const stocks = await loadData('stocks').catch(() => []);
        const bieres = await loadData('bieres').catch(() => []);

        // Charger les ingrédients dans le sélecteur principal
        const selectIngredient = document.getElementById('select-ingredient');
        if (selectIngredient) {
            selectIngredient.innerHTML = '<option value="">-- Ingrédient --</option>';
            stocks.forEach(stock => {
                const option = document.createElement('option');
                option.value = stock.id;
                option.textContent = `${stock.type} - ${stock.nom} (${stock.quantite}g)`;
                if (stock.quantite < 0) option.classList.add('stock-negatif');
                selectIngredient.appendChild(option);
            });
        }

        afficherStocks();
        chargerDonneesRetrait();
        afficherHistoriqueRetraits();
    } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
    }
}

// Charger les données pour les sélecteurs de retrait
// Charger les données pour les sélecteurs de retrait
async function chargerDonneesRetrait() {
    try {
        const stocks = await loadData('stocks').catch(() => []);
        const bieres = await loadData('bieres').catch(() => []);

        // Charger les ingrédients dans le sélecteur de retrait
        const selectIngredientRetrait = document.getElementById('select-ingredient-retrait');
        if (selectIngredientRetrait) {
            selectIngredientRetrait.innerHTML = '<option value="">-- Ingrédient --</option>';
            stocks.forEach(stock => {
                if (stock.quantite > 0) {
                    const option = document.createElement('option');
                    option.value = stock.id;
                    option.textContent = `${stock.type} - ${stock.nom} (${stock.quantite}g)`;
                    selectIngredientRetrait.appendChild(option);
                }
            });
        }

        // Charger les bières dans le sélecteur de retrait
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
    } catch (error) {
        console.error("Erreur lors du chargement des données pour le retrait:", error);
    }
}

// Rendre la fonction accessible globalement
window.chargerDonneesRetrait = chargerDonneesRetrait;



// Afficher les stocks avec boutons d'action
async function afficherStocks() {
    try {
        const stocks = await loadData('stocks').catch(() => []);
        stockTableBody = document.querySelector('#table-stocks tbody');

        if (stockTableBody) {
            stockTableBody.innerHTML = stocks.map(stock => `
                <tr data-id="${stock.id}">
                    <td>${stock.type || ''}</td>
                    <td>${stock.nom || ''}</td>
                    <td>${stock.lot || '-'}</td>
                    <td class="${stock.quantite < 0 ? 'stock-negatif' : ''}">${stock.quantite || 0}g</td>
                    <td>${stock.fournisseur || ''}</td>
                    <td>${stock.specification || '-'}</td>
                    <td>${stock.annee_recolte || '-'}</td>
                    <td>${stock.conditionnement || 'non spécifié'}</td>
                    <td>
                        <button class="action-btn edit-btn" data-action="edit" data-id="${stock.id}" title="Éditer">
                            <i class="material-icons">edit</i>
                        </button>
                        <button class="action-btn delete-btn" data-action="delete" data-id="${stock.id}" title="Supprimer">
                            <i class="material-icons">delete</i>
                        </button>
                        ${stock.notes ? `<button class="action-btn notes-btn" data-action="notes" data-id="${stock.id}" title="Voir les notes">
                            <i class="material-icons">info</i>
                        </button>` : ''}
                    </td>
                </tr>
            `).join('');

            attachEventListeners();
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage des stocks:", error);
    }
}

// Fonction pour recharger les sélecteurs de bières dans le formulaire de retrait
async function rechargerSelecteurBieresRetrait() {
    try {
        const bieres = await loadData('bieres').catch(() => []);

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
    } catch (error) {
        console.error("Erreur lors du rechargement du sélecteur de bières pour le retrait:", error);
    }
}

// Rendre la fonction accessible globalement
window.rechargerSelecteurBieresRetrait = rechargerSelecteurBieresRetrait;

// Attacher les écouteurs d'événements
function attachEventListeners() {
    if (!stockTableBody) return;

    stockTableBody.onclick = async function(e) {
        const target = e.target.closest('button[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        const id = parseInt(target.closest('tr').getAttribute('data-id'));

        try {
            const stocks = await loadData('stocks').catch(() => []);
            const stock = stocks.find(s => s.id === id);

            if (!stock) return;

            switch (action) {
                case 'edit':
                    openEditModal('stock', id, stock);
                    break;
                case 'delete':
                    openDeleteModal(
                        `Voulez-vous vraiment supprimer "${stock.nom}" ?`,
                        async () => await supprimerStock(id)
                    );
                    break;
                case 'notes':
                    alert(`Notes pour ${stock.nom}:\n${stock.notes}`);
                    break;
            }
        } catch (error) {
            console.error("Erreur lors de la gestion de l'action:", error);
        }
    };
}

// Retirer du stock pour une bière
async function retirerStockPourBiere() {
    const idIngredient = document.getElementById('select-ingredient-retrait')?.value;
    const idBiere = document.getElementById('select-biere-retrait')?.value;
    const quantite = parseFloat(document.getElementById('quantite-retrait')?.value);
    const errorElement = document.getElementById('retrait-error');

    if (errorElement) errorElement.textContent = '';

    if (!idIngredient || !idBiere || isNaN(quantite) || quantite <= 0) {
        if (errorElement) errorElement.textContent = "Veuillez sélectionner un ingrédient, une bière et une quantité valide.";
        return;
    }

    try {
        const stocks = await loadData('stocks').catch(() => []);
        const biere = await loadItemById('bieres', idBiere).catch(() => null);
        const stock = stocks.find(s => s.id == idIngredient);

        if (!stock) {
            if (errorElement) errorElement.textContent = "Ingrédient non trouvé.";
            return;
        }

        if (!biere) {
            if (errorElement) errorElement.textContent = "Bière non trouvée.";
            return;
        }

        if (quantite > stock.quantite) {
            if (errorElement) errorElement.textContent = `Quantité insuffisante en stock (disponible: ${stock.quantite}g).`;
            return;
        }

        const updatedStock = {...stock};
        updatedStock.quantite -= quantite;
        await updateItem('stocks', updatedStock);

        const historiqueEntry = {
            date: new Date().toISOString(),
            type: "retrait_biere",
            ingredient: stock.nom,
            ingredient_id: stock.id,
            biere: biere.nom,
            biere_id: biere.id,
            quantite: quantite,
            stock_avant: stock.quantite,
            stock_apres: updatedStock.quantite,
            notes: `Retrait pour la bière "${biere.nom}"`
        };
        await addItem('historique_stocks', historiqueEntry);

        if (!biere.ingredients) biere.ingredients = [];
        const ingredientExist = biere.ingredients.find(ing => ing.id === stock.id);

        if (ingredientExist) {
            ingredientExist.quantite_utilisee = (ingredientExist.quantite_utilisee || 0) + quantite;
            ingredientExist.date_dernier_retrait = new Date().toISOString();
        } else {
            biere.ingredients.push({
                id: stock.id,
                nom: stock.nom,
                quantite_utilisee: quantite,
                date_dernier_retrait: new Date().toISOString()
            });
        }

        await updateItem('bieres', biere);
        afficherStocks();
        chargerDonneesRetrait();
        document.getElementById('quantite-retrait').value = '';
        alert(`Retrait de ${quantite}g de ${stock.nom} pour la bière "${biere.nom}" enregistré avec succès.`);
    } catch (error) {
        console.error("Erreur lors du retrait de stock pour la bière:", error);
        if (errorElement) errorElement.textContent = "Une erreur est survenue. Veuillez réessayer.";
    }
}

// Afficher l'historique des retraits liés aux bières
async function afficherHistoriqueRetraits() {
    try {
        const historique = await loadData('historique_stocks').catch(() => []);
        const historiqueFiltre = historique.filter(entry => entry.type === "retrait_biere");
        const tbody = document.querySelector('#historique-retraits tbody');

        if (tbody) {
            tbody.innerHTML = historiqueFiltre.map(entry => `
                <tr data-id="${entry.id}">
                    <td>${new Date(entry.date).toLocaleString()}</td>
                    <td>${entry.ingredient || ''}</td>
                    <td>${entry.quantite || 0}g</td>
                    <td>${entry.biere || ''}</td>
                    <td>${entry.notes || ''}</td>
                    <td>
                        <button class="action-btn delete-btn" data-action="delete" data-id="${entry.id}" title="Annuler le retrait">
                            <i class="material-icons">undo</i>
                        </button>
                    </td>
                </tr>
            `).join('');

            tbody.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = parseInt(btn.closest('tr').getAttribute('data-id'));
                    try {
                        const entry = historiqueFiltre.find(e => e.id === id);
                        if (entry) {
                            const stocks = await loadData('stocks').catch(() => []);
                            const stock = stocks.find(s => s.id === entry.ingredient_id);
                            if (stock) {
                                stock.quantite += entry.quantite;
                                await updateItem('stocks', stock);

                                const biere = await loadItemById('bieres', entry.biere_id).catch(() => null);
                                if (biere && biere.ingredients) {
                                    const ingredient = biere.ingredients.find(ing => ing.id === entry.ingredient_id);
                                    if (ingredient) {
                                        ingredient.quantite_utilisee -= entry.quantite;
                                        await updateItem('bieres', biere);
                                    }
                                }
                            }
                        }

                        await deleteItem('historique_stocks', id);
                        afficherHistoriqueRetraits();
                        afficherStocks();
                    } catch (error) {
                        console.error("Erreur lors de l'annulation du retrait:", error);
                    }
                };
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage de l'historique des retraits:", error);
    }
}

// Ouvrir la modale d'ajout d'ingrédient
function ouvrirModalAjoutIngredient() {
    openEditModal('stock', null, {
        type: "", nom: "", lot: "", quantite: 0, fournisseur: "",
        specification: "", annee_recolte: null, pourcentage_aa: null,
        conditionnement: "", notes: ""
    });
}

// Ajouter un nouvel ingrédient
async function ajouterIngredient() {
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

    try {
        const nouvelIngredient = {
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

        await addItem('stocks', nouvelIngredient);
        afficherStocks();
        closeModal('editModal');
        alert(`L'ingrédient "${nom}" a été ajouté avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'ingrédient:", error);
        alert("Une erreur est survenue lors de l'ajout de l'ingrédient.");
    }
}

// Sauvegarder les modifications
async function saveEdit() {
    if (!currentEditType || currentEditId === null) {
        console.error("Type ou ID manquant pour la sauvegarde.");
        return;
    }

    try {
        const type = document.getElementById('edit-type').value;
        const specification = document.getElementById('edit-specification').value;
        const annee = document.getElementById('edit-annee').value;

        const updatedStock = {
            id: currentEditId,
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

        await updateItem('stocks', updatedStock);
        afficherStocks();
        alert("Ingrédient mis à jour avec succès !");
        closeModal('editModal');
    } catch (error) {
        console.error("Erreur lors de la sauvegarde des modifications:", error);
        alert("Une erreur est survenue lors de la sauvegarde.");
    }
}

// Supprimer un stock
async function supprimerStock(id) {
    try {
        const stocks = await loadData('stocks').catch(() => []);
        const stockToDelete = stocks.find(s => s.id === id);
        if (!stockToDelete) return;

        await deleteItem('stocks', id);
        afficherStocks();
        alert(`"${stockToDelete.nom}" a été supprimé avec succès.`);
    } catch (error) {
        console.error("Erreur lors de la suppression du stock:", error);
        alert("Une erreur est survenue lors de la suppression.");
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', chargerDonnees);
