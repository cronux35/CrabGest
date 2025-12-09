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

// Afficher les stocks avec boutons d'action
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
                <td>${stock.annee_recolte || '-'}</td>
                <td>${stock.conditionnement || 'non spécifié'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${stock.id}" title="Éditer">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${stock.id}" title="Supprimer">
                        <i class="material-icons">delete</i>
                    </button>
                    ${stock.notes ? `<button class="action-btn notes-btn" data-id="${stock.id}" title="Voir les notes">
                        <i class="material-icons">info</i>
                    </button>` : ''}
                </td>
            </tr>
        `).join('');

        // Attacher les écouteurs d'événements aux boutons
        tbody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const stock = stocks.find(s => s.id === id);
                if (stock) openEditModal('stock', id, stock);
            };
        });

        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const stock = stocks.find(s => s.id === id);
                if (stock) openDeleteModal(
                    `Voulez-vous vraiment supprimer l'ingrédient "${stock.nom}" ?`,
                    () => supprimerStock(id)
                );
            };
        });

        tbody.querySelectorAll('.notes-btn').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const stock = stocks.find(s => s.id === id);
                if (stock) alert(`Notes pour ${stock.nom}:\n${stock.notes}`);
            };
        });
    }
}

// Ouvrir la modale d'ajout d'ingrédient
function ouvrirModalAjoutIngredient() {
    openEditModal('stock', null, {
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

// Ajouter un nouvel ingrédient
function ajouterIngredient() {
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

    const stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
    const id = stocks.length > 0 ? Math.max(...stocks.map(s => s.id)) + 1 : 1;

    const nouvelIngredient = {
        id,
        type,
        nom,
        lot,
        quantite,
        fournisseur,
        specification: (type === 'Malt' || type === 'Houblon') ? specification : null,
        annee_recolte: type === 'Houblon' ? parseInt(annee) || null : null,
        pourcentage_aa: type === 'Houblon' ? parseFloat(specification) || null : null,
        conditionnement: conditionnement || 'non spécifié',
        notes
    };

    stocks.push(nouvelIngredient);
    localStorage.setItem('stocks', JSON.stringify(stocks));
    afficherStocks();
    closeModal('editModal');
    alert(`L'ingrédient "${nom}" a été ajouté avec succès.`);
}

// Retirer du stock
function retirerStock() {
    const idIngredient = document.getElementById('select-ingredient')?.value;
    const idBiere = document.getElementById('select-biere')?.value;
    const quantite = parseFloat(document.getElementById('quantite-retrait')?.value);

    if (!idIngredient || !idBiere || isNaN(quantite) || quantite <= 0) {
        alert("Veuillez sélectionner un ingrédient, une bière et une quantité valide.");
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

    alert(`Retrait de ${quantite}g de ${ingredient.nom} pour la bière #${idBiere} enregistré.`);
    afficherStocks();
}

// Supprimer un stock
function supprimerStock(id) {
    let stocks = JSON.parse(localStorage.getItem('stocks') || '[]');
    const stockIndex = stocks.findIndex(s => s.id === id);
    if (stockIndex !== -1) {
        const nomStock = stocks[stockIndex].nom;
        stocks = stocks.filter(stock => stock.id !== id);
        localStorage.setItem('stocks', JSON.stringify(stocks));
        afficherStocks();
        alert(`L'ingrédient "${nomStock}" a été supprimé avec succès.`);
    }
}

// Afficher l'historique par bière
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

        // Attacher les écouteurs d'événements aux boutons Supprimer
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = () => {
                const date = btn.getAttribute('data-date');
                openDeleteModal(
                    'Voulez-vous vraiment supprimer cette entrée d\'historique ?',
                    () => supprimerHistorique(date)
                );
            };
        });
    }
}

// Supprimer une entrée d'historique
function supprimerHistorique(date) {
    let historique = JSON.parse(localStorage.getItem('historique_stocks') || '[]');
    historique = historique.filter(entry => entry.date !== date);
    localStorage.setItem('historique_stocks', JSON.stringify(historique));
    const biereId = document.getElementById('select-biere-historique')?.value;
    if (biereId) afficherHistoriqueParBiere(biereId);
}

// Appeler chargerDonnees une fois le DOM chargé
document.addEventListener('DOMContentLoaded', chargerDonnees);
