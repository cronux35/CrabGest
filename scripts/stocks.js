// Charger les données des stocks et recettes
function chargerDonnees() {
    const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
    const recettes = JSON.parse(localStorage.getItem('recettes') || '[]');

    // Charger les ingrédients
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

    // Charger les bières
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
}

// Afficher les stocks avec boutons d'action (version corrigée et testée)
function afficherStocks() {
    const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
    const tbody = document.querySelector('#table-stocks tbody');
    if (tbody) {
        tbody.innerHTML = stocks.map(stock => `
            <tr data-id="${stock.id}">
                <td>${stock.type || ''}</td>
                <td>${stock.nom || ''}</td>
                <td>${stock.lot || '-'}</td>
                <td class="${stock.quantite < 0 ? 'stock-negatif' : ''}">${stock.quantite || 0}g</td>
                <td>${stock.fournisseur || ''}</td>
                <td>${stock.specification || '-'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${stock.id}" title="Éditer">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${stock.id}" title="Supprimer">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Utiliser la délégation d'événements pour les boutons dynamiques
        tbody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');

            if (editBtn) {
                e.stopPropagation();
                const id = parseInt(editBtn.getAttribute('data-id'));
                const stock = stocks.find(s => s.id === id);
                if (stock) {
                    openEditModal('stock', id, stock);
                }
            }

            if (deleteBtn) {
                e.stopPropagation();
                const id = parseInt(deleteBtn.getAttribute('data-id'));
                const stock = stocks.find(s => s.id === id);
                if (stock) {
                    openDeleteModal(
                        `Voulez-vous vraiment supprimer le stock "${stock.nom}" ?`,
                        () => supprimerStock(id)
                    );
                }
            }
        });
    }
}

// Supprimer un stock (version corrigée)
function supprimerStock(id) {
    let stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
    const stockIndex = stocks.findIndex(s => s.id === id);
    if (stockIndex !== -1) {
        const nomStock = stocks[stockIndex].nom;
        stocks = stocks.filter(stock => stock.id !== id);
        localStorage.setItem('stocks', JSON.stringify(stocks));
        afficherStocks();
        alert(`Le stock "${nomStock}" a été supprimé avec succès.`);
    }
}



// Retirer du stock
function retirerStock() {
    const idIngredient = document.getElementById('select-ingredient')?.value;
    const idBiere = document.getElementById('select-biere')?.value;
    const quantite = parseFloat(document.getElementById('quantite-retrait')?.value);

    if (!idIngredient || !idBiere || isNaN(quantite) || quantite <= 0) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    let stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
    const stockIndex = stocks.findIndex(s => s.id == idIngredient);
    if (stockIndex !== -1) {
        stocks[stockIndex].quantite -= quantite;
        localStorage.setItem('stocks', JSON.stringify(stocks));
    }

    // Ajouter à l'historique
    const ingredient = stocks[stockIndex];
    let historique = JSON.parse(localStorage.getItem('historique_stocks') || '[]');
    historique.push({
        date: new Date().toISOString(),
        type: "retrait",
        ingredient: ingredient.nom,
        lot: ingredient.lot || '-',
        quantite: quantite,
        stock_avant: ingredient.quantite + quantite,
        stock_apres: ingredient.quantite,
        id_biere: parseInt(idBiere),
        notes: `Retrait pour la bière #${idBiere}`
    });
    localStorage.setItem('historique_stocks', JSON.stringify(historique));

    alert(`Retrait enregistré.`);
    afficherStocks();
}

// Afficher l'historique par bière (version corrigée)
function afficherHistoriqueParBiere(idBiere) {
    const historique = JSON.parse(localStorage.getItem('historique_stocks') || '[]');
    const historiqueFiltre = historique.filter(entry => entry.id_biere == idBiere);
    const tbody = document.querySelector('#historique-biere tbody');
    if (tbody) {
        tbody.innerHTML = historiqueFiltre.map(entry => `
            <tr data-date="${entry.date}">
                <td>${new Date(entry.date).toLocaleString()}</td>
                <td>${entry.ingredient || ''}</td>
                <td>${entry.quantite || 0}g</td>
                <td>${entry.notes || ''}</td>
                <td>
                    <button class="action-btn delete-btn" data-date="${entry.date}" title="Supprimer">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Utiliser la délégation d'événements pour les boutons dynamiques
        tbody.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                e.stopPropagation();
                const date = deleteBtn.getAttribute('data-date');
                openDeleteModal(
                    'Voulez-vous vraiment supprimer cette entrée d\'historique ?',
                    () => supprimerHistorique(date)
                );
            }
        });
    }
}

// Supprimer une entrée d'historique (version corrigée)
function supprimerHistorique(date) {
    let historique = JSON.parse(localStorage.getItem('historique_stocks') || '[]');
    historique = historique.filter(entry => entry.date !== date);
    localStorage.setItem('historique_stocks', JSON.stringify(historique));
    const biereId = document.getElementById('select-biere-historique')?.value;
    if (biereId) afficherHistoriqueParBiere(biereId);
}


// Appeler chargerDonnees une fois le DOM chargé
document.addEventListener('DOMContentLoaded', chargerDonnees);
