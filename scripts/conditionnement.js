// conditionnement.js - Gestion des déclarations de conditionnement
let conditionnementChart = null;

// Charger les bières dans le sélecteur de conditionnement
async function chargerSelecteurBieresConditionnement() {
    try {
        const bieres = await window.DB.loadData('bieres').catch(() => []);

        const selectBiereConditionnement = document.getElementById('select-biere-conditionnement');
        if (selectBiereConditionnement) {
            selectBiereConditionnement.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
            bieres.forEach(biere => {
                const option = document.createElement('option');
                option.value = biere.id;
                option.textContent = biere.nom;
                selectBiereConditionnement.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erreur lors du chargement des bières pour le conditionnement:", error);
    }
}

// Charger les conditionnements pour une bière sélectionnée
async function chargerConditionnements(idBiere) {
    try {
        const conditionnements = await window.DB.loadData('conditionnements').catch(() => []);
        const conditionnementsBiere = conditionnements.filter(c => c.id_biere == idBiere);

        const conditionnementsTable = document.getElementById('conditionnements-table');
        if (conditionnementsTable) {
            const tbody = conditionnementsTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = conditionnementsBiere.map(conditionnement => `
                    <tr data-id="${conditionnement.id}">
                        <td>${new Date(conditionnement.date).toLocaleDateString()}</td>
                        <td>${conditionnement.numero_lot}</td>
                        <td>${conditionnement.contenants.map(c => `${c.type} (${c.quantite})`).join(', ')}</td>
                        <td>${conditionnement.volume_total} L</td>
                        <td>
                            <button class="action-btn delete-btn" data-action="delete" data-id="${conditionnement.id}" title="Supprimer">
                                <i class="material-icons">delete</i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        attachConditionnementEventListeners();
    } catch (error) {
        console.error("Erreur lors du chargement des conditionnements:", error);
    }
}

// Ajouter un conditionnement
async function ajouterConditionnement() {
    const idBiere = document.getElementById('select-biere-conditionnement').value;
    const date = document.getElementById('date-conditionnement').value;
    const numeroLot = document.getElementById('numero-lot').value;

    if (!idBiere || !date || !numeroLot) {
        alert("Veuillez sélectionner une bière, une date et un numéro de lot valide.");
        return;
    }

    // Récupérer les quantités des contenants
    const contenants = [];
    const typesContenants = ['canette_44cl', 'canette_33cl', 'bouteille_33cl', 'bouteille_50cl', 'bouteille_75cl', 'fut_19l', 'fut_20l'];

    let volumeTotal = 0;
    typesContenants.forEach(type => {
        const quantite = parseInt(document.getElementById(type).value) || 0;
        if (quantite > 0) {
            let volumeUnitaire;
            if (type === 'canette_44cl') volumeUnitaire = 0.44;
            else if (type === 'canette_33cl') volumeUnitaire = 0.33;
            else if (type === 'bouteille_33cl') volumeUnitaire = 0.33;
            else if (type === 'bouteille_50cl') volumeUnitaire = 0.50;
            else if (type === 'bouteille_75cl') volumeUnitaire = 0.75;
            else if (type === 'fut_19l') volumeUnitaire = 19;
            else if (type === 'fut_20l') volumeUnitaire = 20;

            contenants.push({
                type: type,
                quantite: quantite,
                volume_unitaire: volumeUnitaire
            });

            volumeTotal += quantite * volumeUnitaire;
        }
    });

    if (contenants.length === 0) {
        alert("Veuillez indiquer au moins un type de contenant avec une quantité.");
        return;
    }

    try {
        const nouveauConditionnement = {
            id_biere: idBiere,
            date: date,
            numero_lot: numeroLot,
            contenants: contenants,
            volume_total: volumeTotal
        };

        await window.DB.addItem('conditionnements', nouveauConditionnement);

        // Réinitialiser les champs
        document.getElementById('date-conditionnement').value = '';
        document.getElementById('numero-lot').value = '';
        typesContenants.forEach(type => {
            document.getElementById(type).value = '';
        });

        // Rafraîchir l'affichage
        chargerConditionnements(idBiere);

        alert(`Conditionnement enregistré avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'ajout du conditionnement:", error);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}

// Supprimer un conditionnement
async function supprimerConditionnement(id) {
    try {
        const conditionnement = await window.DB.loadItemById('conditionnements', id);
        if (!conditionnement) return;

        if (confirm(`Voulez-vous vraiment supprimer ce conditionnement (Lot: ${conditionnement.numero_lot}) ?`)) {
            await window.DB.deleteItem('conditionnements', id);
            const idBiere = document.getElementById('select-biere-conditionnement').value;
            chargerConditionnements(idBiere);
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du conditionnement:", error);
        alert("Une erreur est survenue lors de la suppression.");
    }
}

// Attacher les écouteurs pour les actions de conditionnement
function attachConditionnementEventListeners() {
    const conditionnementsTable = document.getElementById('conditionnements-table');
    if (!conditionnementsTable) return;

    const tbody = conditionnementsTable.querySelector('tbody');
    if (!tbody) return;

    tbody.onclick = async (e) => {
        const target = e.target.closest('button[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const id = target.closest('tr').dataset.id;

        if (action === 'delete') {
            await supprimerConditionnement(id);
        }
    };
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Charger les bières dans le sélecteur
    chargerSelecteurBieresConditionnement();

    // Écouteur pour le changement de bière sélectionnée
    const selectBiereConditionnement = document.getElementById('select-biere-conditionnement');
    if (selectBiereConditionnement) {
        selectBiereConditionnement.addEventListener('change', function() {
            const idBiere = this.value;
            if (idBiere) {
                chargerConditionnements(idBiere);
            } else {
                const conditionnementsTable = document.getElementById('conditionnements-table');
                if (conditionnementsTable) {
                    const tbody = conditionnementsTable.querySelector('tbody');
                    if (tbody) {
                        tbody.innerHTML = '';
                    }
                }
            }
        });
    }

    // Écouteur pour le bouton "Ajouter Conditionnement"
    const btnAjouterConditionnement = document.getElementById('btn-ajouter-conditionnement');
    if (btnAjouterConditionnement) {
        btnAjouterConditionnement.addEventListener('click', ajouterConditionnement);
    }
});
