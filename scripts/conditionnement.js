// conditionnement.js - Version mise à jour pour CrabGest
let currentConditionnementId = null;
let currentSortColumn = null;
let currentSortDirection = 1;
let currentFilters = {};
let allConditionnements = [];
let allBieres = [];

// Types de contenants disponibles
const TYPES_CONTENANTS = [
    { id: 'canette_44cl', nom: 'Canette 44cl', volume: 0.44, code: 'C44' },
    { id: 'canette_33cl', nom: 'Canette 33cl', volume: 0.33, code: 'C33' },
    { id: 'bouteille_33cl', nom: 'Bouteille 33cl', volume: 0.33, code: 'B33' },
    { id: 'bouteille_50cl', nom: 'Bouteille 50cl', volume: 0.50, code: 'B50' },
    { id: 'bouteille_75cl', nom: 'Bouteille 75cl', volume: 0.75, code: 'B75' },
    { id: 'fut_sodakeg_19l', nom: 'Fût SodaKeg 19L', volume: 19, code: 'FS19' },
    { id: 'fut_20l', nom: 'Fût 20L', volume: 20, code: 'F20' }
];

// Générer un numéro de lot unique
function genererNumeroLot(biereNom, typeContenant, date) {
    const biereCode = biereNom.substring(0, 2).toUpperCase();
    const contenant = TYPES_CONTENANTS.find(c => c.id === typeContenant);
    const contenantCode = contenant ? contenant.code : 'XX';
    const dateCode = new Date(date).toISOString().substring(2, 10).replace(/-/g, '');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${biereCode}-${contenantCode}-${dateCode}-${randomCode}`;
}

// Charger les bières dans le sélecteur de filtre
function chargerSelecteurBieresFiltre() {
    const select = document.getElementById('select-biere-filtre');
    if (select) {
        select.innerHTML = '<option value="">-- Toutes les bières --</option>';
        allBieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            select.appendChild(option);
        });

        select.addEventListener('change', function() {
            afficherConditionnements();
        });
    }
}

// Charger les bières dans le sélecteur de la modale
function chargerSelecteurBieresModale() {
    const select = document.getElementById('modal-select-biere');
    if (select) {
        select.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
        allBieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            select.appendChild(option);
        });
    }
}

// Ouvrir la modale d'ajout de conditionnement
function ouvrirModaleAjoutConditionnement() {
    const modal = document.getElementById('ajout-conditionnement-modal');
    if (!modal) return;

    // Réinitialiser le formulaire
    document.getElementById('modal-select-biere').value = '';
    document.getElementById('modal-abv').value = '';
    document.getElementById('modal-date').valueAsDate = new Date();
    document.getElementById('modal-type-contenant').value = '';
    document.getElementById('modal-quantite').value = '';

    // Charger les sélecteurs
    chargerSelecteurBieresModale();

    // Afficher la modale
    modal.style.display = 'block';
}

// Fermer une modale
function fermerModale(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Ajouter un conditionnement depuis la modale
async function ajouterConditionnementDepuisModale() {
    const idBiere = document.getElementById('modal-select-biere').value;
    const abv = parseFloat(document.getElementById('modal-abv').value);
    const typeContenant = document.getElementById('modal-type-contenant').value;
    const quantite = parseInt(document.getElementById('modal-quantite').value);
    const dateConditionnement = document.getElementById('modal-date').value;

    if (!idBiere || isNaN(abv) || !typeContenant || isNaN(quantite) || quantite <= 0 || !dateConditionnement) {
        alert("Veuillez remplir tous les champs correctement (y compris la date)");
        return;
    }

    try {
        const biere = allBieres.find(b => b.id == idBiere);
        if (!biere) {
            alert("Bière non trouvée");
            return;
        }

        const contenant = TYPES_CONTENANTS.find(c => c.id === typeContenant);
        if (!contenant) {
            alert("Type de contenant invalide");
            return;
        }

        // Calculer le volume total conditionné automatiquement
        const volumeTotalContenants = quantite * contenant.volume;

        // Générer le numéro de lot
        const numeroLot = genererNumeroLot(biere.nom, typeContenant, dateConditionnement);

        const nouveauConditionnement = {
            id: Date.now(),
            id_biere: parseInt(idBiere),
            nom_biere: biere.nom,
            abv: abv,
            type_contenant: typeContenant,
            quantite: quantite,
            date: dateConditionnement,
            numero_lot: numeroLot,
            contenant_nom: contenant.nom,
            contenant_volume: contenant.volume,
            volume_total_contenants: volumeTotalContenants
        };

        // Ajouter à la base de données
        await addItem('conditionnements', nouveauConditionnement);

        // Mettre à jour l'historique de la bière
        if (!biere.historique_conditionnement) {
            biere.historique_conditionnement = [];
        }
        biere.historique_conditionnement.push({
            date: dateConditionnement,
            abv: abv,
            type_contenant: typeContenant,
            quantite: quantite,
            contenant_nom: contenant.nom,
            volume_total: volumeTotalContenants,
            numero_lot: numeroLot
        });

        // Mettre à jour le volume total conditionné de la bière
        if (!biere.volume_total_conditionne) {
            biere.volume_total_conditionne = 0;
        }
        biere.volume_total_conditionne += volumeTotalContenants;
        await updateItem('bieres', biere);

        // Recharger les données et afficher
        allConditionnements = await loadData('conditionnements').catch(() => []);
        afficherConditionnements();

        // Fermer la modale
        fermerModale('ajout-conditionnement-modal');

        alert(`Conditionnement enregistré:\n`
            + `Numéro de lot: ${numeroLot}\n`
            + `${quantite} x ${contenant.nom} (${volumeTotalContenants.toFixed(2)}L)`);
    } catch (error) {
        console.error("Erreur ajout conditionnement:", error);
        alert("Erreur lors de l'enregistrement");
    }
}

// Modifier la fonction afficherConditionnements pour prendre en compte le filtre par bière
async function afficherConditionnements() {
    try {
        const biereId = document.getElementById('select-biere-filtre')?.value;
        let data = allConditionnements;

        // Filtrer par bière si un filtre est sélectionné
        if (biereId) {
            data = data.filter(cond => cond.id_biere == biereId);
        }

        const tbody = document.querySelector('#table-conditionnements tbody');
        if (tbody) {
            tbody.innerHTML = data.map(cond => {
                const biere = allBieres.find(b => b.id === cond.id_biere);
                const contenant = TYPES_CONTENANTS.find(c => c.id === cond.type_contenant);
                const volumeTotalContenant = cond.quantite * (contenant ? contenant.volume : 0);

                return `
                    <tr data-id="${cond.id}">
                        <td>${cond.numero_lot || '-'}</td>
                        <td>${biere ? biere.nom : 'Inconnu'}</td>
                        <td>${cond.abv}°</td>
                        <td>${contenant ? contenant.nom : cond.type_contenant}</td>
                        <td>${cond.quantite}</td>
                        <td>${volumeTotalContenant.toFixed(2)}L</td>
                        <td>${new Date(cond.date).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn info-btn" title="Voir détails"
                                   onclick="afficherDetailsConditionnement(${cond.id})">
                                <i class="material-icons">info</i>
                            </button>
                            <button class="action-btn delete-btn"
                                   onclick="supprimerConditionnement(${cond.id})">
                                <i class="material-icons">delete</i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Ajouter une ligne de synthèse par bière (sur les données filtrées)
            if (biereId) {
                const biere = allBieres.find(b => b.id == biereId);
                if (biere) {
                    const row = document.createElement('tr');
                    row.className = 'synthese-biere';
                    row.innerHTML = `
                        <td colspan="4"><strong>Total pour ${biere.nom}</strong></td>
                        <td><strong>${data.reduce((sum, cond) => sum + cond.quantite, 0)} contenants</strong></td>
                        <td><strong>${data.reduce((sum, cond) => {
                            const contenant = TYPES_CONTENANTS.find(c => c.id === cond.type_contenant);
                            return sum + (cond.quantite * (contenant ? contenant.volume : 0));
                        }, 0).toFixed(2)}L</strong></td>
                        <td colspan="2"></td>
                    `;
                    tbody.appendChild(row);
                }
            }
        }
    } catch (error) {
        console.error("Erreur affichage conditionnements:", error);
    }
}

// Modifier la fonction d'initialisation pour charger les sélecteurs
async function chargerDonneesInitiales() {
    try {
        allBieres = await loadData('bieres').catch(() => []);
        allConditionnements = await loadData('conditionnements').catch(() => []);

        // Charger les sélecteurs
        chargerSelecteurBieresFiltre();
        afficherConditionnements();
    } catch (error) {
        console.error("Erreur chargement initial:", error);
    }
}

// Ajoutez cette ligne à la fin de votre fichier pour initialiser les données
document.addEventListener('DOMContentLoaded', function() {
    chargerDonneesInitiales();

    // Gestion des clics en dehors des modales pour les fermer
    window.onclick = function(event) {
        const modal = document.getElementById('ajout-conditionnement-modal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
});
