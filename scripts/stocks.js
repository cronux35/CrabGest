function chargerDonnees() {
    const stocks = JSON.parse(localStorage.getItem('stocks'));
    const recettes = JSON.parse(localStorage.getItem('recettes'));

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
    const selectsBiere = document.querySelectorAll('[id^="select-biere"]');
    selectsBiere.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">-- Bière --</option>';
            recettes.forEach(biere => {
                const option = document.createElement('option');
                option.value = biere.id;
                option.textContent = biere.nom;
                select.appendChild(option.cloneNode(true));
            });
        }
    });

    afficherStocks();
}

function afficherStocks() {
    const stocks = JSON.parse(localStorage.getItem('stocks'));
    const table = document.getElementById('table-stocks');
    if (table) {
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Nom</th>
                    <th>Lot</th>
                    <th>Quantité</th>
                    <th>Fournisseur</th>
                    <th>Spécification</th>
                </tr>
            </thead>
            <tbody>
                ${stocks.map(stock => `
                    <tr>
                        <td>${stock.type}</td>
                        <td>${stock.nom}</td>
                        <td>${stock.lot || '-'}</td>
                        <td class="${stock.quantite < 0 ? 'stock-negatif' : ''}">${stock.quantite}g</td>
                        <td>${stock.fournisseur}</td>
                        <td>${stock.specification || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
    }
}

function retirerStock() {
    const idIngredient = document.getElementById('select-ingredient').value;
    const idBiere = document.getElementById('select-biere').value;
    const quantite = parseFloat(document.getElementById('quantite-retrait').value);

    if (!idIngredient || !idBiere || isNaN(quantite) || quantite <= 0) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    let stocks = JSON.parse(localStorage.getItem('stocks'));
    const stockIndex = stocks.findIndex(s => s.id == idIngredient);
    if (stockIndex !== -1) {
        stocks[stockIndex].quantite -= quantite;
        localStorage.setItem('stocks', JSON.stringify(stocks));
    }

    // Ajouter à l'historique
    const ingredient = stocks[stockIndex];
    let historique = JSON.parse(localStorage.getItem('historique_stocks'));
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

function afficherHistoriqueParBiere(idBiere) {
    const historique = JSON.parse(localStorage.getItem('historique_stocks'));
    const historiqueFiltre = historique.filter(entry => entry.id_biere == idBiere);
    const table = document.getElementById('historique-biere');
    if (table) {
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Ingrédient</th>
                    <th>Quantité</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${historiqueFiltre.map(entry => `
                    <tr>
                        <td>${new Date(entry.date).toLocaleString()}</td>
                        <td>${entry.ingredient}</td>
                        <td>${entry.quantite}g</td>
                        <td>${entry.notes}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
    }
}
