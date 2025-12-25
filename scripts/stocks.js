let stockTableBody = null;

async function chargerDonnees() {
    try {
        const stocks = await DB.loadData('stocks').catch(() => []);
        const bieres = await DB.loadData('bieres').catch(() => []);

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

async function chargerDonneesRetrait() {
    try {
        const stocks = await DB.loadData('stocks').catch(() => []);
        const bieres = await DB.loadData('bieres').catch(() => []);

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

async function chargerTypesIngredients() {
    const stocks = await DB.loadData('stocks');
    const types = [...new Set(stocks.map(s => s.type))];
    const selectType = document.getElementById('select-type-ingredient');
    selectType.innerHTML = '<option value="">-- Sélectionnez un type --</option>';
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        selectType.appendChild(option);
    });
}

async function chargerIngredientsParType() {
    const type = document.getElementById('select-type-ingredient').value;
    const selectIngredient = document.getElementById('select-ingredient-retrait');
    selectIngredient.innerHTML = '<option value="">-- Sélectionnez un ingrédient --</option>';

    if (!type) return;

    const stocks = await DB.loadData('stocks');
    const ingredientsFiltres = stocks.filter(s => s.type === type && s.quantite > 0);

    ingredientsFiltres.forEach(ingredient => {
        const option = document.createElement('option');
        option.value = ingredient.id;
        option.textContent = `${ingredient.nom} (${ingredient.quantite}g)`;
        selectIngredient.appendChild(option);
    });
}

async function afficherStocks() {
    try {
        const stocks = await DB.loadData('stocks').catch(() => []);
        const stockTableBody = document.querySelector('#table-stocks tbody');

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

function attachEventListeners() {
    const stockTableBody = document.querySelector('#table-stocks tbody');
    if (!stockTableBody) return;

    stockTableBody.onclick = async function(e) {
        console.log("Clic détecté dans le tableau des stocks")
        const target = e.target.closest('button[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        console.log("Action demandée :", action);
        const id = parseInt(target.closest('tr').getAttribute('data-id'));

        try {
            const stocks = await DB.loadData('stocks').catch(() => []);
            const stock = stocks.find(s => s.id === id);
            console.log("Stock trouvé pour l'ID :", stock);
        
            if (!stock){
                console.log("Aucun stock trouvé pour l'ID :", id);
                return;
            }

            switch (action) {
                case 'edit':
                    console.log("Édition de l'ingrédient avec l'ID :", id);
                    openEditIngredientModal('stock', id, stock);
                    break;
                case 'delete':
                    console.log("Suppression de l'ingrédient avec l'ID :", id);
                    openDeleteModal(
                        `Voulez-vous vraiment supprimer "${stock.nom}" ?`,
                        async () => {
                            try {
                                await DB.deleteItem('stocks', id);
                                afficherStocks();
                            } catch (error) {
                                console.error("Erreur lors de la suppression du stock:", error);
                                alert("Erreur lors de la suppression du stock. Veuillez réessayer.");
                            }
                        }
                    );
                    break;
                case 'notes':
                    console.log("Affichage des notes pour l'ingrédient avec l'ID :", id);
                    const nom = stock.nom;
                    const notes = stock.notes || 'Aucune note';
                    alert(`Notes pour ${nom}:\n${notes}`);
                    break;
            }
        } catch (error) {
            console.error("Erreur lors de la gestion de l'action:", error);
        }
    };
}

async function saveEdit() {
    if (!currentEditType || currentEditId === null) {
        console.error("Type ou ID manquant pour la sauvegarde.");
        return;
    }

    try {
        const type = document.getElementById('edit-type').value;
        const nom = document.getElementById('edit-nom').value;
        const lot = document.getElementById('edit-lot').value;
        const quantite = parseFloat(document.getElementById('edit-quantite').value);
        const fournisseur = document.getElementById('edit-fournisseur').value;
        const specification = document.getElementById('edit-specification').value;
        const annee = document.getElementById('edit-annee')?.value;
        const conditionnement = document.getElementById('edit-conditionnement').value;
        const notes = document.getElementById('edit-notes').value;

        if (!nom || !fournisseur || isNaN(quantite)) {
            alert("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        const updatedStock = {
            id: currentEditId,
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

        await DB.updateItem('stocks', updatedStock);
        closeModal('editModal');
        afficherStocks();
        alert("Ingrédient mis à jour avec succès !");
    } catch (error) {
        console.error("Erreur lors de la sauvegarde des modifications:", error);
        alert("Une erreur est survenue lors de la sauvegarde.");
    }
}

async function ajouterIngredient() {
    const type = document.getElementById('edit-type').value;
    const nom = document.getElementById('edit-nom').value;
    const lot = document.getElementById('edit-lot').value;
    const quantite = parseFloat(document.getElementById('edit-quantite').value);
    const fournisseur = document.getElementById('edit-fournisseur').value;
    const specification = document.getElementById('edit-specification').value;
    const annee = document.getElementById('edit-annee')?.value;
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

        await DB.addItem('stocks', nouvelIngredient);
        await afficherStocks();
        await chargerTypesIngredients();
        await chargerIngredientsParType();
        closeModal('editModal');
        alert(`L'ingrédient "${nom}" a été ajouté avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'ingrédient:", error);
        alert("Une erreur est survenue lors de l'ajout de l'ingrédient.");
    }
}

function ouvrirModalAjoutIngredient() {
    openEditIngredientModal('stock', null, {
        type: "",
        nom: "",
        lot: "",
        quantite: 0,
        fournisseur: "",
        specification: "",
        annee_recolte: null,
        pourcentage_aa: null,
        conditionnement: "",
        notes: ""
    });
}

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
        const stocks = await DB.loadData('stocks');
        const biere = await DB.loadItemById('bieres', idBiere);
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

        const updatedStock = { ...stock };
        updatedStock.quantite -= quantite;
        await DB.updateItem('stocks', updatedStock);

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
        await DB.addItem('historique_stocks', historiqueEntry);

        if (!biere.ingredients) biere.ingredients = [];
        const ingredientExistIndex = biere.ingredients.findIndex(ing => ing.id === stock.id);

        if (ingredientExistIndex !== -1) {
            biere.ingredients[ingredientExistIndex].quantite_utilisee = (biere.ingredients[ingredientExistIndex].quantite_utilisee || 0) + quantite;
            biere.ingredients[ingredientExistIndex].date_dernier_retrait = new Date().toISOString();
        } else {
            biere.ingredients.push({
                id: stock.id,
                nom: stock.nom,
                quantite_utilisee: quantite,
                date_dernier_retrait: new Date().toISOString()
            });
        }

        await DB.updateItem('bieres', biere);

        await afficherStocks();
        await chargerDonneesRetrait();
        await afficherHistoriqueRetraits();

        document.getElementById('quantite-retrait').value = '';
        document.getElementById('select-ingredient-retrait').value = '';

        alert(`Retrait de ${quantite}g de ${stock.nom} pour la bière "${biere.nom}" enregistré avec succès.`);
    } catch (error) {
        console.error("Erreur lors du retrait de stock pour la bière:", error);
        if (errorElement) errorElement.textContent = "Une erreur est survenue. Veuillez réessayer.";
    }
}

async function annulerRetrait(entryId) {
    try {
        const entry = await DB.loadItemById('historique_stocks', entryId);
        if (!entry || entry.type !== "retrait_biere") {
            alert("Entrée d'historique non valide ou non trouvée.");
            return;
        }

        const stock = await DB.loadItemById('stocks', entry.ingredient_id);
        const biere = await DB.loadItemById('bieres', entry.biere_id);

        if (!stock || !biere) {
            alert("Ingrédient ou bière non trouvé.");
            return;
        }

        const updatedStock = { ...stock };
        updatedStock.quantite += entry.quantite;
        await DB.updateItem('stocks', updatedStock);

        if (!biere.ingredients) biere.ingredients = [];
        const ingredientExistIndex = biere.ingredients.findIndex(ing => ing.id === entry.ingredient_id);

        if (ingredientExistIndex !== -1) {
            biere.ingredients[ingredientExistIndex].quantite_utilisee -= entry.quantite;
            await DB.updateItem('bieres', biere);
        }

        entry.annule = true;
        entry.date_annulation = new Date().toISOString();
        await DB.updateItem('historique_stocks', entry);

        afficherStocks();
        afficherHistoriqueRetraits();

        alert(`Retrait de ${entry.quantite}g de ${entry.ingredient} pour la bière "${entry.biere}" a été annulé avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'annulation du retrait:", error);
        alert("Erreur lors de l'annulation du retrait. Veuillez réessayer.");
    }
}

async function afficherHistoriqueRetraits() {
    try {
        const historique = await DB.loadData('historique_stocks').catch(() => []);
        const selectBiere = document.getElementById('select-biere-historique');
        const biereId = selectBiere ? selectBiere.value : null;

        let historiqueFiltre = historique.filter(entry => entry.type === "retrait_biere" && !entry.annule);

        if (biereId) {
            historiqueFiltre = historiqueFiltre.filter(entry => entry.biere_id == biereId);
        }

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
                    const id = btn.closest('tr').getAttribute('data-id');
                    annulerRetrait(id);
                };
            });
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage de l'historique des retraits:", error);
    }
}

async function chargerBieresPourFiltre() {
    try {
        const bieres = await DB.loadData('bieres').catch(() => []);
        const selectBiere = document.getElementById('select-biere-historique');

        if (selectBiere) {
            selectBiere.innerHTML = '<option value="">-- Toutes les bières --</option>';
            bieres.forEach(biere => {
                const option = document.createElement('option');
                option.value = biere.id;
                option.textContent = biere.nom;
                selectBiere.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erreur lors du chargement des bières pour le filtre :", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    chargerDonnees();
    chargerTypesIngredients();
    chargerBieresPourFiltre();
    afficherHistoriqueRetraits();
});
