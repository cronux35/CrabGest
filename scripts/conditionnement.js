// Types de contenants (à ajouter en haut du fichier)
const TYPES_CONTENANTS = {
    'canette_33cl': { nom: 'Canette 33cl', volume: 0.33 },
    'canette_44cl': { nom: 'Canette 44cl', volume: 0.44 },
    'bouteille_33cl': { nom: 'Bouteille 33cl', volume: 0.33 },
    'bouteille_50cl': { nom: 'Bouteille 50cl', volume: 0.50 },
    'bouteille_75cl': { nom: 'Bouteille 75cl', volume: 0.75 },
    'fut_19l': { nom: 'Fût 19L', volume: 19 },
    'fut_20l': { nom: 'Fût 20L', volume: 20 }
};

// Générer un numéro de lot
function genererNumeroLot(biereNom, date) {
    const biereCode = biereNom.substring(0, 3).toUpperCase();
    const dateCode = new Date(date).toISOString().substring(2, 10).replace(/-/g, '');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LOT-${biereCode}-${dateCode}-${randomCode}`;
}

// Ouvrir la modale
function ouvrirModaleConditionnement() {
    document.getElementById('modale-conditionnement').style.display = 'block';

    // Charger les bières dans le sélecteur
    const selectBiere = document.getElementById('modale-biere');
    selectBiere.innerHTML = '<option value="">-- Sélectionner une bière --</option>';

    loadData('bieres').then(bieres => {
        bieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            selectBiere.appendChild(option);
        });
    });

    // Réinitialiser le formulaire
    document.getElementById('modale-abv').value = '';
    document.getElementById('modale-date').valueAsDate = new Date();
    document.getElementById('modale-contenant').value = '';
    document.getElementById('modale-quantite').value = '';
}

// Fermer la modale
function fermerModale(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Enregistrer un nouveau conditionnement
async function enregistrerConditionnement() {
    const biereId = document.getElementById('modale-biere').value;
    const abv = parseFloat(document.getElementById('modale-abv').value);
    const date = document.getElementById('modale-date').value;
    const contenantId = document.getElementById('modale-contenant').value;
    const quantite = parseInt(document.getElementById('modale-quantite').value);

    if (!biereId || isNaN(abv) || !date || !contenantId || isNaN(quantite) || quantite <= 0) {
        alert("Veuillez remplir tous les champs correctement");
        return;
    }

    try {
        const biere = await loadItemById('bieres', parseInt(biereId));
        if (!biere) {
            alert("Bière non trouvée");
            return;
        }

        const contenant = TYPES_CONTENANTS[contenantId];
        if (!contenant) {
            alert("Type de contenant invalide");
            return;
        }

        // Calculer le volume total
        const volumeTotal = quantite * contenant.volume;

        // Générer le numéro de lot
        const numeroLot = genererNumeroLot(biere.nom, date);

        // Créer le nouveau conditionnement
        const nouveauConditionnement = {
            id: Date.now(),
            id_biere: biere.id,
            nom_biere: biere.nom,
            abv: abv,
            type_contenant: contenantId,
            quantite: quantite,
            date: date,
            numero_lot: numeroLot,
            volume_total: volumeTotal
        };

        // Ajouter à la base de données
        await addItem('conditionnements', nouveauConditionnement);

        // Mettre à jour la bière
        if (!biere.historique_conditionnement) {
            biere.historique_conditionnement = [];
        }

        biere.historique_conditionnement.push({
            ...nouveauConditionnement,
            contenant_nom: contenant.nom
        });

        if (!biere.volume_total_conditionne) {
            biere.volume_total_conditionne = 0;
        }

        biere.volume_total_conditionne += volumeTotal;
        await updateItem('bieres', biere);

        // Rafraîchir l'affichage
        afficherConditionnements();

        // Fermer la modale
        fermerModale('modale-conditionnement');

        alert(`Conditionnement enregistré avec succès!\nNuméro de lot: ${numeroLot}`);
    } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue lors de l'enregistrement");
    }
}

// Charger les bières dans le sélecteur de filtre
async function chargerSelecteurBieresFiltre() {
    const select = document.getElementById('select-biere-filtre');
    if (!select) return;

    select.innerHTML = '<option value="">-- Toutes les bières --</option>';

    const bieres = await loadData('bieres');
    bieres.forEach(biere => {
        const option = document.createElement('option');
        option.value = biere.id;
        option.textContent = biere.nom;
        select.appendChild(option);
    });

    select.addEventListener('change', afficherConditionnements);
}

// Modifier la fonction afficherConditionnements pour prendre en compte le filtre
async function afficherConditionnements() {
    const biereId = document.getElementById('select-biere-filtre')?.value;
    const conditionnements = await loadData('conditionnements');

    const tbody = document.querySelector('#table-conditionnements tbody');
    if (!tbody) return;

    // Filtrer les conditionnements
    let data = conditionnements;
    if (biereId) {
        data = data.filter(c => c.id_biere == biereId);
    }

    // Afficher les données
    tbody.innerHTML = data.map(cond => {
        const biere = allBieres.find(b => b.id === cond.id_biere);
        const contenant = TYPES_CONTENANTS[cond.type_contenant];

        return `
            <tr>
                <td>${cond.numero_lot || '-'}</td>
                <td>${biere ? biere.nom : 'Inconnu'}</td>
                <td>${cond.abv}°</td>
                <td>${contenant ? contenant.nom : cond.type_contenant}</td>
                <td>${cond.quantite}</td>
                <td>${cond.volume_total.toFixed(2)}L</td>
                <td>${new Date(cond.date).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn info-btn" title="Voir détails">
                        <i class="material-icons">info</i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Ajouter une ligne de total si une bière est sélectionnée
    if (biereId) {
        const biere = allBieres.find(b => b.id == biereId);
        if (biere) {
            const totalQuantite = data.reduce((sum, cond) => sum + cond.quantite, 0);
            const totalVolume = data.reduce((sum, cond) => sum + cond.volume_total, 0);

            const row = document.createElement('tr');
            row.className = 'synthese-biere';
            row.innerHTML = `
                <td colspan="4"><strong>Total pour ${biere.nom}</strong></td>
                <td><strong>${totalQuantite}</strong></td>
                <td><strong>${totalVolume.toFixed(2)}L</strong></td>
                <td colspan="2"></td>
            `;
            tbody.appendChild(row);
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    chargerSelecteurBieresFiltre();
    afficherConditionnements();
});
