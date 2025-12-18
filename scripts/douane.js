// Fonction pour générer une déclaration douanière mensuelle
async function genererDeclarationDouane() {
    const mois = document.getElementById('select-mois-douane').value;
    if (!mois) {
        alert("Veuillez sélectionner un mois.");
        return;
    }

    const conditionnements = await loadData('conditionnements').catch(() => []);
    const declarations = await loadData('declarations_douanes').catch(() => []);

    // Filtrer les conditionnements du mois
    const conditionnementsMois = conditionnements.filter(c => new Date(c.date).toISOString().startsWith(mois));

    // Regrouper les conditionnements par bière
    const bièresDeclarees = conditionnementsMois.reduce((acc, c) => {
        if (!acc[c.id_biere]) {
            acc[c.id_biere] = {
                nom: c.nom_biere,
                volume: 0,
                abv: c.abv,
                lots: []
            };
        }
        acc[c.id_biere].volume += c.volume_litres;
        if (!acc[c.id_biere].lots.includes(c.numeroLot)) {
            acc[c.id_biere].lots.push(c.numeroLot);
        }
        return acc;
    }, {});

    // Calcul des droits (exemple: 1€/L/°)
    const droitsParBiere = Object.entries(bièresDeclarees).map(([id, b]) => ({
        id_biere: parseInt(id),
        nom: b.nom,
        volume: b.volume,
        abv: b.abv,
        lots: b.lots,
        droits: b.volume * b.abv
    }));

    const totalDroits = droitsParBiere.reduce((total, b) => total + b.droits, 0);

    // Ajouter la déclaration
    declarations.push({
        mois,
        bières: droitsParBiere,
        montant_total_droits: totalDroits,
        date: new Date().toISOString()
    });

    await saveData('declarations_douanes', declarations);

    afficherDeclarations();
    alert(`Déclaration pour ${new Date(mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} générée. Montant des droits: ${totalDroits.toFixed(2)} €.`);
}


// Fonction pour afficher les déclarations douanières
async function afficherDeclarations() {
    const declarations = await loadData('declarations_douanes').catch(() => []);
    const tbody = document.querySelector('#table-douane tbody');

    if (!tbody) {
        console.error("Élément table-douane tbody non trouvé.");
        return;
    }

    tbody.innerHTML = '';

    if (!declarations || declarations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucune déclaration douanière enregistrée</td></tr>';
        return;
    }

    declarations.forEach(dec => {
        if (dec.bières && dec.bières.length > 0) {
            dec.bières.forEach(b => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(dec.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
                    <td>${b.nom}</td>
                    <td>${b.volume ? b.volume.toFixed(2) : '0.00'} L</td>
                    <td>${b.abv ? b.abv : '0'}°</td>
                    <td>${b.droits ? b.droits.toFixed(2) : '0.00'} €</td>
                    <td>${b.lots ? b.lots.join(', ') : ''}</td>
                `;
                tbody.appendChild(row);
            });
        }
    });
}

async function afficherConditionnementsParMois() {
    const mois = document.getElementById('select-mois-douane').value;
    if (!mois) {
        alert("Veuillez sélectionner un mois.");
        return;
    }

    const conditionnements = await loadData('conditionnements').catch(() => []);
    const conditionnementsMois = conditionnements.filter(c => new Date(c.date).toISOString().startsWith(mois));

    if (!conditionnementsMois || conditionnementsMois.length === 0) {
        alert("Aucun conditionnement trouvé pour ce mois.");
        return;
    }

    // Regrouper les conditionnements par bière
    const bièresConditionnées = conditionnementsMois.reduce((acc, c) => {
        if (!acc[c.id_biere]) {
            acc[c.id_biere] = {
                nom: c.nom,
                volume: 0,
                abv: c.abv,
                lots: []
            };
        }
        acc[c.id_biere].volume += c.volume_litres;
        if (!acc[c.id_biere].lots.includes(c.numeroLot)) {
            acc[c.id_biere].lots.push(c.numeroLot);
        }
        return acc;
    }, {});

    const tbody = document.querySelector('#table-douane tbody');
    if (!tbody) {
        console.error("Élément table-douane tbody non trouvé.");
        return;
    }

    tbody.innerHTML = '';

    // Calcul du volume total pour toutes les bières
    let volumeTotalGlobal = 0;

    Object.entries(bièresConditionnées).forEach(([id, b]) => {
        volumeTotalGlobal += b.volume;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
            <td>${b.nom}</td>
            <td>${volumeTotalGlobal.toFixed(2)} L</td>
            <td>${b.abv}°</td>
            <td>${b.lots.join(', ')}</td>
        `;
        tbody.appendChild(row);
    });

    tbody.appendChild(totalRow);
}








// Fonction pour charger les mois disponibles
async function chargerMoisDisponibles() {
    const selectMois = document.getElementById('select-mois-douane');
    if (!selectMois) {
        console.error("Élément select-mois-douane non trouvé.");
        return;
    }

    const conditionnements = await loadData('conditionnements').catch(() => []);

    if (!conditionnements || conditionnements.length === 0) {
        console.log("Aucun conditionnement trouvé.");
        return;
    }

    // Extraire les mois uniques
    const moisUniques = [...new Set(conditionnements.map(c => new Date(c.date).toISOString().substring(0, 7)))];

    selectMois.innerHTML = '<option value="">-- Sélectionner un mois --</option>';
    moisUniques.forEach(mois => {
        const option = document.createElement('option');
        option.value = mois;
        option.textContent = new Date(mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        selectMois.appendChild(option);
    });
}





// Écouteurs d'événements
document.addEventListener('DOMContentLoaded', function() {
    chargerMoisDisponibles();
});

document.getElementById('select-mois-douane').addEventListener('change', afficherConditionnementsParMois);
