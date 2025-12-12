// Types de contenants disponibles (corrigé)
const TYPES_CONTENANTS = {
    'canette_33cl': { nom: 'Canette 33cl', volume: 0.33, code: 'C33' },
    'canette_44cl': { nom: 'Canette 44cl', volume: 0.44, code: 'C44' },
    'bouteille_33cl': { nom: 'Bouteille 33cl', volume: 0.33, code: 'B33' },
    'bouteille_50cl': { nom: 'Bouteille 50cl', volume: 0.50, code: 'B50' },
    'bouteille_75cl': { nom: 'Bouteille 75cl', volume: 0.75, code: 'B75' },
    'fut_sodakeg_19l': { nom: 'Fût SodaKeg 19L', volume: 19, code: 'FS19' },  // Corrigé
    'fut_20l': { nom: 'Fût 20L', volume: 20, code: 'F20' }
};

// Variables globales
let allBieres = [];
let allConditionnements = [];

// Générer un numéro de lot unique
function genererNumeroLot(biereNom, typeContenant, date) {
    const biereCode = biereNom.substring(0, 2).toUpperCase();
    const contenant = TYPES_CONTENANTS[typeContenant];
    const contenantCode = contenant ? contenant.code : 'XX';
    const dateCode = new Date(date).toISOString().substring(2, 10).replace(/-/g, '');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LOT-${biereCode}-${contenantCode}-${dateCode}-${randomCode}`;
}

// Charger les données initiales
async function chargerDonneesInitiales() {
    try {
        // Charger les données en parallèle
        const [bieres, conditionnements] = await Promise.all([
            loadData('bieres'),
            loadData('conditionnements')
        ]);

        allBieres = bieres;
        allConditionnements = conditionnements;

        // Charger les sélecteurs
        chargerSelecteurBieres();
        afficherConditionnements();
    } catch (error) {
        console.error("Erreur chargement initial:", error);
    }
}

// Charger les bières dans les sélecteurs
function chargerSelecteurBieres() {
    // Sélecteur de filtre
    const selectFiltre = document.getElementById('select-biere-filtre');
    if (selectFiltre) {
        selectFiltre.innerHTML = '<option value="">-- Toutes les bières --</option>';
        allBieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            selectFiltre.appendChild(option);
        });

        // Ajouter l'événement de changement
        selectFiltre.addEventListener('change', afficherConditionnements);
    }

    // Sélecteur de la modale
    const selectModale = document.getElementById('modale-biere');
    if (selectModale) {
        selectModale.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
        allBieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            selectModale.appendChild(option);
        });
    }
}

// Ouvrir la modale d'ajout
function ouvrirModaleConditionnement() {
    const modal = document.getElementById('modale-conditionnement');
    if (modal) {
        modal.style.display = 'block';

        // Réinitialiser le formulaire
        document.getElementById('modale-abv').value = '';
        document.getElementById('modale-date').valueAsDate = new Date();
        document.getElementById('modale-contenant').value = '';
        document.getElementById('modale-quantite').value = '';
    }
}

// Fermer la modale
function fermerModale(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Fonction enregistrerConditionnement corrigée
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
        const numeroLot = genererNumeroLot(biere.nom, contenantId, date);

        // Créer le conditionnement avec le volume pré-calculé
        const conditionnement = {
            id: Date.now(),
            id_biere: biere.id,
            nom_biere: biere.nom,
            abv: abv,
            type_contenant: contenantId,
            quantite: quantite,
            date: date,
            numero_lot: numeroLot,
            volume_total: volumeTotal  // Stockage du volume calculé
        };

        // Ajouter à la base de données
        await addItem('conditionnements', conditionnement);

        // Mettre à jour la bière
        if (!biere.historique_conditionnement) {
            biere.historique_conditionnement = [];
        }

        biere.historique_conditionnement.push({
            ...conditionnement,
            contenant_nom: contenant.nom
        });

        if (!biere.volume_total_conditionne) {
            biere.volume_total_conditionne = 0;
        }

        biere.volume_total_conditionne += volumeTotal;
        await updateItem('bieres', biere);

        // Recharger les données et afficher
        await chargerDonneesInitiales();

        // Fermer la modale
        fermerModale('modale-conditionnement');

        alert(`Conditionnement enregistré avec succès!\nNuméro de lot: ${numeroLot}`);
    } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue lors de l'enregistrement");
    }
}

// Fonction afficherConditionnements corrigée
function afficherConditionnements() {
    const tbody = document.querySelector('#table-conditionnements tbody');
    if (!tbody) {
        console.error("Élément tbody non trouvé");
        return;
    }

    const biereId = document.getElementById('select-biere-filtre')?.value;
    let data = allConditionnements;

    // Filtrer par bière si un filtre est sélectionné
    if (biereId) {
        data = data.filter(c => c.id_biere == biereId);
    }

    // Afficher les données
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">
                    ${biereId ? `Aucun conditionnement trouvé pour cette bière` : 'Aucun conditionnement enregistré'}
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(cond => {
        const biere = allBieres.find(b => b.id === cond.id_biere);
        const contenant = TYPES_CONTENANTS[cond.type_contenant];

        // Calculer le volume total pour cette ligne
        const volumeTotal = cond.quantite * (contenant ? contenant.volume : 0);

        return `
            <tr>
                <td>${cond.numero_lot || '-'}</td>
                <td>${biere ? biere.nom : 'Inconnu'}</td>
                <td>${cond.abv}°</td>
                <td>${contenant ? contenant.nom : cond.type_contenant}</td>
                <td>${cond.quantite}</td>
                <td>${volumeTotal.toFixed(2)}L</td>  <!-- Volume calculé ici -->
                <td>${new Date(cond.date).toLocaleDateString('fr-FR')}</td>  <!-- Format français -->
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
            const totalQuantite = data.reduce((sum, cond) => {
                const contenant = TYPES_CONTENANTS[cond.type_contenant];
                return sum + cond.quantite;
            }, 0);

            const totalVolume = data.reduce((sum, cond) => {
                const contenant = TYPES_CONTENANTS[cond.type_contenant];
                return sum + (cond.quantite * (contenant ? contenant.volume : 0));
            }, 0);

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
    // Charger les données initiales
    chargerDonneesInitiales();

    // Gestion des clics en dehors des modales
    window.onclick = function(event) {
        const modal = document.getElementById('modale-conditionnement');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
});
