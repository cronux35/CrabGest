// Variables globales pour les écouteurs
let stockTableBody = null;

// Charger les données des stocks
function chargerDonnees() {
    const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
    const recettes = JSON.parse(localStorage.getItem('recettes') || '[]');

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
    attachEventListeners(); // Attacher les écouteurs après le premier chargement
}

// Afficher les stocks
function afficherStocks() {
    const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
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

        attachEventListeners(); // Réattacher les écouteurs après chaque mise à jour
    }
}

// Attacher les écouteurs d'événements
function attachEventListeners() {
    if (!stockTableBody) return;

    // Écouteur unique sur le tbody pour tous les boutons
    stockTableBody.querySelectorAll('tr').forEach(row => {
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        const notesBtn = row.querySelector('.notes-btn');
        const stockId = parseInt(row.getAttribute('data-id'));

        if (editBtn) {
            editBtn.onclick = () => {
                const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
                const stock = stocks.find(s => s.id === stockId);
                if (stock) openEditModal('stock', stockId, stock);
            };
        }

        if (deleteBtn) {
            deleteBtn.onclick = () => {
                const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
                const stock = stocks.find(s => s.id === stockId);
                if (stock) openDeleteModal(
                    `Voulez-vous vraiment supprimer "${stock.nom}" ?`,
                    () => supprimerStock(stockId)
                );
            };
        }

        if (notesBtn) {
            notesBtn.onclick = () => {
                const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
                const stock = stocks.find(s => s.id === stockId);
                if (stock) alert(`Notes pour ${stock.nom}:\n${stock.notes}`);
            };
        }
    });
}

// Ouvrir la modale d'ajout d'ingrédient
function ouvrirModalAjoutIngredient() {
    openEditModal('stock', null, {
        type: "", nom: "", lot: "", quantite: 0, fournisseur: "",
        specification: "", annee_recolte: null, pourcentage_aa: null,
        conditionnement: "", notes: ""
    });
}

// Supprimer un stock
function supprimerStock(id) {
    let stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
    const stockIndex = stocks.findIndex(s => s.id === id);
    if (stockIndex !== -1) {
        const nomStock = stocks[stockIndex].nom;
        stocks = stocks.filter(stock => stock.id !== id);
        localStorage.setItem('stocks', JSON.stringify(stocks));
        afficherStocks(); // Recharge le tableau et réattache les écouteurs
        alert(`"${nomStock}" supprimé avec succès.`);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', chargerDonnees);
