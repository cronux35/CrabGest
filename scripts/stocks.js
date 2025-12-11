// stocks.js - Version complète avec IndexedDB
let stockTableBody = null;

// Charger les données des stocks et recettes
async function chargerDonnees() {
    try {
        const stocks = await loadData('stocks');
        const recettes = await loadData('recettes');

        // Charger les ingrédients dans le sélecteur
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

        // Charger les bières dans les sélecteurs
        const selectBiere = document.getElementById('select-biere');
        const selectBiereHistorique = document.getElementById('select-biere-historique');
        if (selectBiere && selectBiereHistorique) {
            selectBiere.innerHTML = '<option value="">-- Bière --</option>';
            selectBiereHistorique.innerHTML = '<option value="">-- Bière --</option>';
            recettes.forEach(biere => {
                const option = document.createElement('option');
                option.value = biere.id;
                option.textContent = biere.nom;
                selectBiere.appendChild(option.cloneNode(true));
                selectBiereHistorique.appendChild(option.cloneNode(true));
            });
        }

        afficherStocks();
        attachEventListeners();
    } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
    }
}

// Afficher les stocks avec boutons d'action
async function afficherStocks() {
    try {
        const stocks = await loadData('stocks');
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

// Attacher les écouteurs d'événements
function attachEventListeners() {
    if (!stockTableBody) return;

    stockTableBody.onclick = async function(e) {
        const target = e.target.closest('button[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        const id = parseInt(target.closest('tr').getAttribute('data-id'));

        try {
            const stocks = await loadData('stocks');
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
        const stocks = await loadData('stocks');
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

// Retirer du stock
async function retirerStock() {
    const idIngredient = document.getElementById('select-ingredient')?.value;
    const idBiere = document.getElementById('select-biere')?.value;
    const quantite = parseFloat(document.getElementById('quantite-retrait')?.value);

    if (!idIngredient || !idBiere || isNaN(quantite) || quantite <= 0) {
        alert("Veuillez sélectionner un ingrédient, une bière et une quantité valide.");
        return;
    }

    try {
        const stocks = await loadData('stocks');
        const stockIndex = stocks.findIndex(s => s.id == idIngredient);
        if (stockIndex !== -1) {
            const updatedStock = {...stocks[stockIndex]};
            updatedStock.quantite -= quantite;
            await updateItem('stocks', updatedStock);

            // Ajouter à l'historique
            const historiqueEntry = {
                date: new Date().toISOString(),
                type: "retrait",
                ingredient: updatedStock.nom,
                lot: updatedStock.lot || '-',
                quantite: quantite,
                stock_avant: updatedStock.quantite + quantite,
                stock_apres: updatedStock.quantite,
                id_biere: parseInt(idBiere),
                notes: `Retrait pour la bière #${idBiere}`
            };
            await addItem('historique_stocks', historiqueEntry);

            alert(`Retrait de ${quantite}g de ${updatedStock.nom} pour la bière #${idBiere} enregistré.`);
            afficherStocks();
        }
    } catch (error) {
        console.error("Erreur lors du retrait de stock:", error);
        alert("Une erreur est survenue lors du retrait de stock.");
    }
}

// Afficher l'historique par bière
async function afficherHistoriqueParBiere(idBiere) {
    try {
        const historique = await loadData('historique_stocks');
        const historiqueFiltre = historique.filter(entry => entry.id_biere == idBiere);
        const tbody = document.querySelector('#historique-biere tbody');

        if (tbody) {
            tbody.innerHTML = historiqueFiltre.map(entry => `
                <tr data-id="${entry.id}">
                    <td>${new Date(entry.date).toLocaleString()}</td>
                    <td>${entry.ingredient || ''}</td>
                    <td>${entry.quantite || 0}g</td>
                    <td>${entry.notes || ''}</td>
                    <td>
                        <button class="action-btn delete-btn" data-action="delete" data-id="${entry.id}" title="Supprimer">
                            <i class="material-icons">delete</i>
                        </button>
                    </td>
                </tr>
            `).join('');

            // Écouteur pour les boutons de suppression de l'historique
            tbody.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = parseInt(btn.closest('tr').getAttribute('data-id'));
                    try {
                        await deleteItem('historique_stocks', id);
                        afficherHistoriqueParBiere(idBiere);
                    } catch (error) {
                        console.error("Erreur lors de la suppression de l'entrée d'historique:", error);
                    }
                };
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage de l'historique:", error);
    }
}


// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', chargerDonnees);

// Charger les données pour les sélecteurs de retrait
async function chargerDonneesRetrait() {
    try {
        const stocks = await loadData('stocks');
        const recettes = await loadData('recettes');

        // Charger les ingrédients dans le sélecteur de retrait
        const selectIngredientRetrait = document.getElementById('select-ingredient-retrait');
        if (selectIngredientRetrait) {
            selectIngredientRetrait.innerHTML = '<option value="">-- Ingrédient --</option>';
            stocks.forEach(stock => {
                if (stock.quantite > 0) { // Seulement les stocks disponibles
                    const option = document.createElement('option');
                    option.value = stock.id;
                    option.textContent = `${stock.type} - ${stock.nom} (${stock.quantite}g)`;
                    selectIngredientRetrait.appendChild(option);
                }
            });
        }

        // Charger les recettes dans le sélecteur de retrait
        const selectRecetteRetrait = document.getElementById('select-recette-retrait');
        if (selectRecetteRetrait) {
            selectRecetteRetrait.innerHTML = '<option value="">-- Recette --</option>';
            recettes.forEach(recette => {
                const option = document.createElement('option');
                option.value = recette.id;
                option.textContent = recette.nom;
                selectRecetteRetrait.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erreur lors du chargement des données pour le retrait:", error);
    }
}

// Retirer du stock pour une recette
async function retirerStockPourRecette() {
    const idIngredient = document.getElementById('select-ingredient-retrait')?.value;
    const idRecette = document.getElementById('select-recette-retrait')?.value;
    const quantite = parseFloat(document.getElementById('quantite-retrait')?.value);
    const errorElement = document.getElementById('retrait-error');

    // Réinitialiser les messages d'erreur
    if (errorElement) errorElement.textContent = '';

    // Validations
    if (!idIngredient || !idRecette || isNaN(quantite) || quantite <= 0) {
        if (errorElement) errorElement.textContent = "Veuillez sélectionner un ingrédient, une recette et une quantité valide.";
        return;
    }

    try {
        // Charger les données nécessaires
        const stocks = await loadData('stocks');
        const recette = await loadRecetteById(idRecette);
        const stock = stocks.find(s => s.id == idIngredient);

        if (!stock) {
            if (errorElement) errorElement.textContent = "Ingrédient non trouvé.";
            return;
        }

        if (quantite > stock.quantite) {
            if (errorElement) errorElement.textContent = `Quantité insuffisante en stock (disponible: ${stock.quantite}g).`;
            return;
        }

        // Mettre à jour le stock
        const updatedStock = {...stock};
        updatedStock.quantite -= quantite;
        await updateItem('stocks', updatedStock);

        // Ajouter à l'historique
        const historiqueEntry = {
            date: new Date().toISOString(),
            type: "retrait_recette",
            ingredient: stock.nom,
            ingredient_id: stock.id,
            recette: recette.nom,
            recette_id: recette.id,
            quantite: quantite,
            stock_avant: stock.quantite,
            stock_apres: updatedStock.quantite,
            notes: `Retrait pour la recette "${recette.nom}"`
        };
        await addItem('historique_stocks', historiqueEntry);

        // Mettre à jour la recette (optionnel: ajouter l'ingrédient utilisé)
        if (!recette.ingredients) recette.ingredients = [];
        const ingredientExist = recette.ingredients.find(ing => ing.id === stock.id);

        if (ingredientExist) {
            ingredientExist.quantite_utilisee = (ingredientExist.quantite_utilisee || 0) + quantite;
        } else {
            recette.ingredients.push({
                id: stock.id,
                nom: stock.nom,
                quantite_utilisee: quantite,
                date_dernier_retrait: new Date().toISOString()
            });
        }

        await updateRecette(recette);

        // Rafraîchir les données
        afficherStocks();
        chargerDonneesRetrait();

        // Réinitialiser le formulaire
        document.getElementById('quantite-retrait').value = '';

        alert(`Retrait de ${quantite}g de ${stock.nom} pour la recette "${recette.nom}" enregistré avec succès.`);
    } catch (error) {
        console.error("Erreur lors du retrait de stock pour la recette:", error);
        if (errorElement) errorElement.textContent = "Une erreur est survenue. Veuillez réessayer.";
    }
}

// Afficher l'historique des retraits (version améliorée)
async function afficherHistoriqueRetraits() {
    try {
        const historique = await loadData('historique_stocks');
        const historiqueFiltre = historique.filter(entry => entry.type === "retrait_recette");
        const tbody = document.querySelector('#historique-biere tbody');

        if (tbody) {
            tbody.innerHTML = historiqueFiltre.map(entry => `
                <tr data-id="${entry.id}">
                    <td>${new Date(entry.date).toLocaleString()}</td>
                    <td>${entry.ingredient || ''}</td>
                    <td>${entry.quantite || 0}g</td>
                    <td>${entry.recette || ''}</td>
                    <td>${entry.notes || ''}</td>
                    <td>
                        <button class="action-btn delete-btn" data-action="delete" data-id="${entry.id}" title="Supprimer">
                            <i class="material-icons">delete</i>
                        </button>
                    </td>
                </tr>
            `).join('');

            // Écouteur pour les boutons de suppression de l'historique
            tbody.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = parseInt(btn.closest('tr').getAttribute('data-id'));
                    try {
                        // Avant de supprimer, on doit annuler le retrait (remettre en stock)
                        const entry = historique.find(e => e.id === id);
                        if (entry) {
                            const stocks = await loadData('stocks');
                            const stock = stocks.find(s => s.id === entry.ingredient_id);
                            if (stock) {
                                stock.quantite += entry.quantite;
                                await updateItem('stocks', stock);

                                // Mettre à jour la recette
                                const recette = await loadRecetteById(entry.recette_id);
                                if (recette && recette.ingredients) {
                                    const ingredient = recette.ingredients.find(ing => ing.id === entry.ingredient_id);
                                    if (ingredient) {
                                        ingredient.quantite_utilisee -= entry.quantite;
                                        await updateRecette(recette);
                                    }
                                }
                            }
                        }

                        await deleteItem('historique_stocks', id);
                        afficherHistoriqueRetraits();
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

// Charger les données pour les retraits au démarrage
document.addEventListener('DOMContentLoaded', function() {
    chargerDonnees();
    chargerDonneesRetrait();
    afficherHistoriqueRetraits(); // Afficher l'historique des retraits liés aux recettes
});
