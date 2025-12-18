// Fonction pour générer une déclaration douanière mensuelle
async function genererDeclarationDouane() {
    const mois = document.getElementById('select-mois-douane').value;
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
    alert(`Déclaration pour ${mois} générée. Montant des droits: ${totalDroits} €.`);
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

    if (declarations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucune déclaration douanière enregistrée</td></tr>';
        return;
    }

    declarations.forEach(dec => {
        dec.bières.forEach(b => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dec.mois}</td>
                <td>${b.nom}</td>
                <td>${b.volume.toFixed(2)} L</td>
                <td>${b.abv}°</td>
                <td>${b.droits.toFixed(2)} €</td>
                <td>${b.lots.join(', ')}</td>
            `;
            tbody.appendChild(row);
        });
    });
}

// Fonction pour charger les mois disponibles
async function chargerMoisDisponibles() {
    const selectMois = document.getElementById('select-mois-douane');
    if (!selectMois) {
        console.error("Élément select-mois-douane non trouvé.");
        return;
    }

    const conditionnements = await loadData('conditionnements').catch(() => []);

    // Extraire les mois uniques
    const moisUniques = [...new Set(conditionnements.map(c => new Date(c.date).toISOString().substring(0, 7)))];

    selectMois.innerHTML = '';
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
    afficherDeclarations();
});
