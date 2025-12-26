// Variable globale pour éviter les doubles clics
let isAddingIngredient = false;
let isAddingStock = false;

// Utilise le cache global
async function loadStocks(forceReload = false) {
    if (!forceReload && window.appDataCache.stocks.length > 0) {
        return window.appDataCache.stocks;
    }
    window.appDataCache.stocks = await window.DB.loadData('stocks');
    return window.appDataCache.stocks;
}

async function loadBieres(forceReload = false) {
    if (!forceReload && window.appDataCache.bieres.length > 0) {
        return window.appDataCache.bieres;
    }
    window.appDataCache.bieres = await window.DB.loadData('bieres');
    return window.appDataCache.bieres;
}

async function loadHistoriqueStocks(forceReload = false) {
    if (!forceReload && window.appDataCache.historique_stocks.length > 0) {
        return window.appDataCache.historique_stocks;
    }
    window.appDataCache.historique_stocks = await window.DB.loadData('historique_stocks');
    return window.appDataCache.historique_stocks;
}

// Ouvrir la modale d'ajout d'ingrédient
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

    // Écouteur pour le bouton "Enregistrer" de la modale
    setTimeout(() => {
        const btnEnregistrer = document.getElementById('saveEditBiereBtn');
        if (btnEnregistrer) {
            btnEnregistrer.onclick = null;
            btnEnregistrer.removeEventListener('click', ajouterIngredient);
            btnEnregistrer.addEventListener('click', ajouterIngredient);
        }
    }, 100);
}

// Charger les données initiales
async function chargerDonnees() {
    try {
        await Promise.all([
            loadStocks(true),
            loadBieres(true),
            loadHistoriqueStocks(true)
        ]);

        const selectIngredient = document.getElementById('select-ingredient');
        if (selectIngredient) {
            selectIngredient.innerHTML = '<option value="">-- Ingrédient --</option>';
            window.appDataCache.stocks.forEach(stock => {
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

// Charger les données pour le retrait de stock
async function chargerDonneesRetrait() {
    try {
        const selectIngredientRetrait = document.getElementById('select-ingredient-retrait');
        if (selectIngredientRetrait) {
            selectIngredientRetrait.innerHTML = '<option value="">-- Ingrédient --</option>';
            window.appDataCache.stocks.filter(stock => stock.quantite > 0).forEach(stock => {
                const option = document.createElement('option');
                option.value = stock.id;
                option.textContent = `${stock.type} - ${stock.nom} (${stock.quantite}g)`;
                selectIngredientRetrait.appendChild(option);
            });
        }

        const selectBiereRetrait = document.getElementById('select-biere-retrait');
        if (selectBiereRetrait) {
            selectBiereRetrait.innerHTML = '<option value="">-- Bière --</option>';
            window.appDataCache.bieres.forEach(biere => {
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

// Charger les types d'ingrédients
async function chargerTypesIngredients() {
    const types = [...new Set(window.appDataCache.stocks.map(s => s.type))];
    const selectType = document.getElementById('select-type-ingredient');
    if (selectType) {
        selectType.innerHTML = '<option value="">-- Sélectionnez un type --</option>';
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            selectType.appendChild(option);
        });
    }
}

// Charger les ingrédients par type
async function chargerIngredientsParType() {
    const type = document.getElementById('select-type-ingredient').value;
    const selectIngredient = document.getElementById('select-ingredient-retrait');
    if (!selectIngredient) return;

    selectIngredient.innerHTML = '<option value="">-- Sélectionnez un ingrédient --</option>';
    if (!type) return;

    window.appDataCache.stocks.filter(s => s.type === type && s.quantite > 0).forEach(ingredient => {
        const option = document.createElement('option');
        option.value = ingredient.id;
        option.textContent = `${ingredient.nom} (${ingredient.quantite}g)`;
        selectIngredient.appendChild(option);
    });
}

// Filtrer les stocks par bière
async function filtrerStocksParBiere() {
    const biereId = document.getElementById('biere-select').value;
    const stockTableBody = document.querySelector('#table-stocks tbody');
    if (!stockTableBody) return;

    let stocksFiltres = window.appDataCache.stocks;
    if (biereId) {
        const biere = window.appDataCache.bieres.find(b => b.id === biereId);
        if (biere && biere.ingredients) {
            const ingredientIds = biere.ingredients.map(ing => ing.id);
            stocksFiltres = window.appDataCache.stocks.filter(stock => ingredientIds.includes(stock.id));
        }
    }

    stockTableBody.innerHTML = stocksFiltres.map(stock => `
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
                <button class="action-btn edit-btn" data-action="edit" title="Éditer">
                    <i class="material-icons">edit</i>
                </button>
                <button class="action-btn delete-btn" data-action="delete" title="Supprimer">
                    <i class="material-icons">delete</i>
                </button>
                ${stock.notes ? `<button class="action-btn notes-btn" data-action="notes" title="Voir les notes">
                    <i class="material-icons">info</i>
                </button>` : ''}
            </td>
        </tr>
    `).join('');

    attachEventListeners();
}

// Afficher les stocks
async function afficherStocks() {
    try {
        const stockTableBody = document.querySelector('#table-stocks tbody');
        if (!stockTableBody) return;

        stockTableBody.innerHTML = window.appDataCache.stocks.map(stock => `
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
                    <button class="action-btn edit-btn" data-action="edit" title="Éditer">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="action-btn delete-btn" data-action="delete" title="Supprimer">
                        <i class="material-icons">delete</i>
                    </button>
                    ${stock.notes ? `<button class="action-btn notes-btn" data-action="notes" title="Voir les notes">
                        <i class="material-icons">info</i>
                    </button>` : ''}
                </td>
            </tr>
        `).join('');

        attachEventListeners();
    } catch (error) {
        console.error("Erreur lors de l'affichage des stocks:", error);
    }
}

// Écouteurs dynamiques pour les actions sur les stocks
function attachEventListeners() {
    const stockTableBody = document.querySelector('#table-stocks tbody');
    if (!stockTableBody) return;

    // Détache l'ancien écouteur s'il existe
    stockTableBody.onclick = null;

    // Attache le nouvel écouteur
    stockTableBody.onclick = async (e) => {
        const target = e.target.closest('button[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const id = target.closest('tr').dataset.id;

        try {
            const stock = window.appDataCache.stocks.find(s => s.id == id);
            if (!stock) {
                console.error("Stock non trouvé pour l'ID:", id);
                return;
            }

            switch (action) {
                case 'edit':
                    openEditIngredientModal('stock', id, stock);
                    break;
                case 'delete':
                    openDeleteModal(
                        `Voulez-vous vraiment supprimer "${stock.nom}" ?`,
                        async () => {
                            try {
                                await DB.deleteItem('stocks', id);
                                window.appDataCache.stocks = window.appDataCache.stocks.filter(s => s.id !== id);
                                afficherStocks();
                            } catch (error) {
                                console.error("Erreur lors de la suppression du stock:", error);
                                alert("Erreur lors de la suppression du stock. Veuillez réessayer.");
                            }
                        }
                    );
                    break;
                case 'notes':
                    alert(`Notes pour ${stock.nom}:\n${stock.notes || 'Aucune note'}`);
                    break;
            }
        } catch (error) {
            console.error("Erreur lors de la gestion de l'action:", error);
        }
    };
}

// Sauvegarder un ingrédient modifié
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

        // Mettre à jour le cache global
        const index = window.appDataCache.stocks.findIndex(s => s.id === currentEditId);
        if (index !== -1) {
            window.appDataCache.stocks[index] = updatedStock;
        }

        closeModal('editModal');
        afficherStocks();
        alert("Ingrédient mis à jour avec succès !");
    } catch (error) {
        console.error("Erreur lors de la sauvegarde des modifications:", error);
        alert("Une erreur est survenue lors de la sauvegarde.");
    }
}

// Ajouter un ingrédient
async function ajouterIngredient() {
    if (isAddingIngredient) {
        console.log("Double appel détecté !");
        return;
    }
    isAddingIngredient = true;

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

        if (!type || !nom || !fournisseur || isNaN(quantite)) {
            alert("Veuillez remplir tous les champs obligatoires.");
            return;
        }

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

        const newId = await DB.addItem('stocks', nouvelIngredient);
        nouvelIngredient.id = newId;
        window.appDataCache.stocks.push(nouvelIngredient);

        // Met à jour le tableau sans tout recharger
        const stockTableBody = document.querySelector('#table-stocks tbody');
        if (stockTableBody) {
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-id', newId);
            newRow.innerHTML = `
                <td>${type}</td>
                <td>${nom}</td>
                <td>${lot || '-'}</td>
                <td class="${quantite < 0 ? 'stock-negatif' : ''}">${quantite}g</td>
                <td>${fournisseur}</td>
                <td>${specification || '-'}</td>
                <td>${annee || '-'}</td>
                <td>${conditionnement || 'non spécifié'}</td>
                <td>
                    <button class="action-btn edit-btn" data-action="edit" title="Éditer">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="action-btn delete-btn" data-action="delete" title="Supprimer">
                        <i class="material-icons">delete</i>
                    </button>
                    ${notes ? `<button class="action-btn notes-btn" data-action="notes" title="Voir les notes">
                        <i class="material-icons">info</i>
                    </button>` : ''}
                </td>
            `;
            stockTableBody.appendChild(newRow);
        }

        await chargerTypesIngredients();
        await chargerIngredientsParType();
        closeModal('editModal');
        alert(`L'ingrédient "${nom}" a été ajouté avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'ingrédient:", error);
        alert("Une erreur est survenue lors de l'ajout de l'ingrédient.");
    } finally {
        isAddingIngredient = false;
    }
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
        const stock = window.appDataCache.stocks.find(s => s.id == idIngredient);
        const biere = window.appDataCache.bieres.find(b => b.id == idBiere);

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

        // Mettre à jour le cache global
        const stockIndex = window.appDataCache.stocks.findIndex(s => s.id === idIngredient);
        if (stockIndex !== -1) {
            window.appDataCache.stocks[stockIndex] = updatedStock;
        }

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
        window.appDataCache.historique_stocks.push(historiqueEntry);

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

        // Mettre à jour le cache global des bières
        const biereIndex = window.appDataCache.bieres.findIndex(b => b.id === idBiere);
        if (biereIndex !== -1) {
            window.appDataCache.bieres[biereIndex] = biere;
        }

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

// Annuler un retrait
async function annulerRetrait(entryId) {
    try {
        const entry = window.appDataCache.historique_stocks.find(e => e.id == entryId);
        if (!entry || entry.type !== "retrait_biere") {
            alert("Entrée d'historique non valide ou non trouvée.");
            return;
        }

        const stock = window.appDataCache.stocks.find(s => s.id == entry.ingredient_id);
        const biere = window.appDataCache.bieres.find(b => b.id == entry.biere_id);

        if (!stock || !biere) {
            alert("Ingrédient ou bière non trouvé.");
            return;
        }

        const updatedStock = { ...stock };
        updatedStock.quantite += entry.quantite;

        await DB.updateItem('stocks', updatedStock);

        // Mettre à jour le cache global
        const stockIndex = window.appDataCache.stocks.findIndex(s => s.id === entry.ingredient_id);
        if (stockIndex !== -1) {
            window.appDataCache.stocks[stockIndex] = updatedStock;
        }

        if (biere.ingredients) {
            const ingredientExistIndex = biere.ingredients.findIndex(ing => ing.id === entry.ingredient_id);
            if (ingredientExistIndex !== -1) {
                biere.ingredients[ingredientExistIndex].quantite_utilisee -= entry.quantite;
                await DB.updateItem('bieres', biere);

                // Mettre à jour le cache global des bières
                const biereIndex = window.appDataCache.bieres.findIndex(b => b.id === entry.biere_id);
                if (biereIndex !== -1) {
                    window.appDataCache.bieres[biereIndex] = biere;
                }
            }
        }

        const entryIndex = window.appDataCache.historique_stocks.findIndex(e => e.id === entryId);
        if (entryIndex !== -1) {
            window.appDataCache.historique_stocks[entryIndex].annule = true;
            window.appDataCache.historique_stocks[entryIndex].date_annulation = new Date().toISOString();
            await DB.updateItem('historique_stocks', window.appDataCache.historique_stocks[entryIndex]);
        }

        afficherStocks();
        afficherHistoriqueRetraits();

        alert(`Retrait de ${entry.quantite}g de ${entry.ingredient} pour la bière "${entry.biere}" a été annulé avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'annulation du retrait:", error);
        alert("Erreur lors de l'annulation du retrait. Veuillez réessayer.");
    }
}

// Afficher l'historique des retraits
async function afficherHistoriqueRetraits() {
    try {
        const selectBiere = document.getElementById('select-biere-historique');
        const biereId = selectBiere ? selectBiere.value : null;

        let historiqueFiltre = window.appDataCache.historique_stocks.filter(entry => entry.type === "retrait_biere" && !entry.annule);

        if (biereId) {
            historiqueFiltre = historiqueFiltre.filter(entry => entry.biere_id == biereId);
        }

        const tbody = document.querySelector('#historique-retraits tbody');
        if (!tbody) return;

        tbody.innerHTML = historiqueFiltre.map(entry => `
            <tr data-id="${entry.id}">
                <td>${new Date(entry.date).toLocaleString()}</td>
                <td>${entry.ingredient || ''}</td>
                <td>${entry.quantite || 0}g</td>
                <td>${entry.biere || ''}</td>
                <td>${entry.notes || ''}</td>
                <td>
                    <button class="action-btn delete-btn" data-action="annuler" data-id="${entry.id}" title="Annuler le retrait">
                        <i class="material-icons">undo</i>
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = () => annulerRetrait(btn.closest('tr').getAttribute('data-id'));
        });
    } catch (error) {
        console.error("Erreur lors de l'affichage de l'historique des retraits:", error);
    }
}

// Charger les bières pour le filtre
async function chargerBieresPourFiltre() {
    try {
        const selectBiere = document.getElementById('select-biere-historique');
        if (!selectBiere) return;

        selectBiere.innerHTML = '<option value="">-- Toutes les bières --</option>';
        window.appDataCache.bieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            selectBiere.appendChild(option);
        });
    } catch (error) {
        console.error("Erreur lors du chargement des bières pour le filtre:", error);
    }
}

// Initialisation des écouteurs
document.addEventListener('DOMContentLoaded', () => {
    // Écouteurs pour les boutons
    const btnAjouterIngredient = document.getElementById('btn-ajouter-ingredient');
    if (btnAjouterIngredient) {
        btnAjouterIngredient.addEventListener('click', ouvrirModalAjoutIngredient);
    }

    const btnRetirerStock = document.getElementById('btn-retirer-stock');
    if (btnRetirerStock) {
        btnRetirerStock.addEventListener('click', retirerStockPourBiere);
    }

    // Écouteurs pour les sélecteurs
    const selectTypeIngredient = document.getElementById('select-type-ingredient');
    if (selectTypeIngredient) {
        selectTypeIngredient.addEventListener('change', chargerIngredientsParType);
    }

    const selectBiereHistorique = document.getElementById('select-biere-historique');
    if (selectBiereHistorique) {
        selectBiereHistorique.addEventListener('change', afficherHistoriqueRetraits);
    }

    const biereSelect = document.getElementById('biere-select');
    if (biereSelect) {
        biereSelect.addEventListener('change', filtrerStocksParBiere);
    }

    // Charger les données initiales
    chargerDonnees();
    chargerTypesIngredients();
    chargerBieresPourFiltre();
    afficherHistoriqueRetraits();
});
