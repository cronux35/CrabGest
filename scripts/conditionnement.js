// conditionnement.js - Gestion des déclarations de conditionnement
let conditionnementChart = null;

// Charger les bières dans le sélecteur de conditionnement
async function chargerSelecteurBieresConditionnement() {
    try {
        const bieres = await window.DB.loadData('bieres').catch(() => []);

        const selectBiereConditionnement = document.getElementById('select-biere-conditionnement');
        const listboxBieres = document.getElementById('listbox-bieres');

        if (selectBiereConditionnement) {
            selectBiereConditionnement.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
            bieres.forEach(biere => {
                const option = document.createElement('option');
                option.value = biere.id;
                option.textContent = biere.nom;
                selectBiereConditionnement.appendChild(option);
            });
        }

        if (listboxBieres) {
            listboxBieres.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
            bieres.forEach(biere => {
                const option = document.createElement('option');
                option.value = biere.id;
                option.textContent = biere.nom;
                listboxBieres.appendChild(option);
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

        const conditionnementsTable = document.getElementById('table-conditionnements');
        if (conditionnementsTable) {
            const tbody = conditionnementsTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = conditionnementsBiere.map(conditionnement => `
                    <tr data-id="${conditionnement.id}">
                        <td>${conditionnement.numero_lot}</td>
                        <td>${conditionnement.biere_nom || 'Inconnu'}</td>
                        <td>${conditionnement.abv_final || 'N/A'}</td>
                        <td>${conditionnement.contenants.map(c => `${c.type} (${c.quantite})`).join(', ')}</td>
                        <td>${conditionnement.contenants.reduce((total, c) => total + c.quantite, 0)}</td>
                        <td>${conditionnement.volume_total} L</td>
                        <td>${new Date(conditionnement.date).toLocaleDateString()}</td>
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
    const selectBiereConditionnement = document.getElementById('select-biere-conditionnement');
    const abvFinalInput = document.getElementById('abv-final');
    const typeContenantSelect = document.getElementById('type-contenant');
    const quantiteContenantInput = document.getElementById('quantite-contenant');
    const dateConditionnementInput = document.getElementById('date-conditionnement');

    if (!selectBiereConditionnement || !abvFinalInput || !typeContenantSelect || !quantiteContenantInput || !dateConditionnementInput) {
        console.error("Un ou plusieurs éléments du formulaire sont introuvables.");
        alert("Une erreur est survenue. Veuillez vérifier que tous les champs sont correctement chargés.");
        return;
    }

    const idBiere = selectBiereConditionnement.value;
    const abvFinal = abvFinalInput.value;
    const typeContenant = typeContenantSelect.value;
    const quantiteContenant = quantiteContenantInput.value;
    const dateConditionnement = dateConditionnementInput.value;

    if (!idBiere || !abvFinal || !typeContenant || !quantiteContenant || !dateConditionnement) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const quantite = parseInt(quantiteContenant);
    if (isNaN(quantite) || quantite <= 0) {
        alert("Veuillez entrer une quantité valide.");
        return;
    }

    let volumeUnitaire;
    if (typeContenant === 'canette_44cl') volumeUnitaire = 0.44;
    else if (typeContenant === 'canette_33cl') volumeUnitaire = 0.33;
    else if (typeContenant === 'bouteille_33cl') volumeUnitaire = 0.33;
    else if (typeContenant === 'bouteille_50cl') volumeUnitaire = 0.50;
    else if (typeContenant === 'bouteille_75cl') volumeUnitaire = 0.75;
    else if (typeContenant === 'fut_19l') volumeUnitaire = 19;
    else if (typeContenant === 'fut_20l') volumeUnitaire = 20;

    const volumeTotal = quantite * volumeUnitaire;

    try {
        const biere = await window.DB.loadItemById('bieres', idBiere);
        const numeroLot = `LOT-${Date.now()}`; // Générer un numéro de lot unique

        const nouveauConditionnement = {
            id_biere: idBiere,
            biere_nom: biere.nom,
            date: dateConditionnement,
            numero_lot: numeroLot,
            abv_final: parseFloat(abvFinal),
            contenants: [{
                type: typeContenant,
                quantite: quantite,
                volume_unitaire: volumeUnitaire
            }],
            volume_total: volumeTotal
        };

        await window.DB.addItem('conditionnements', nouveauConditionnement);

        // Fermer la modale
        const modaleConditionnement = document.getElementById('modale-conditionnement');
        if (modaleConditionnement) {
            modaleConditionnement.style.display = 'none';
        }

        // Réinitialiser les champs
        abvFinalInput.value = '';
        typeContenantSelect.value = '';
        quantiteContenantInput.value = '';
        dateConditionnementInput.value = '';

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
            const listboxBieres = document.getElementById('listbox-bieres');
            if (listboxBieres) {
                const idBiere = listboxBieres.value;
                chargerConditionnements(idBiere);
            }
        }
    } catch (error) {
        console.error("Erreur lors de la suppression du conditionnement:", error);
        alert("Une erreur est survenue lors de la suppression.");
    }
}

// Attacher les écouteurs pour les actions de conditionnement
function attachConditionnementEventListeners() {
    const conditionnementsTable = document.getElementById('table-conditionnements');
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
    const listboxBieres = document.getElementById('listbox-bieres');
    if (listboxBieres) {
        listboxBieres.addEventListener('change', function() {
            const idBiere = this.value;
            if (idBiere) {
                chargerConditionnements(idBiere);
            } else {
                const conditionnementsTable = document.getElementById('table-conditionnements');
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
        btnAjouterConditionnement.addEventListener('click', function() {
            const modaleConditionnement = document.getElementById('modale-conditionnement');
            if (modaleConditionnement) {
                modaleConditionnement.style.display = 'block';
            }
        });
    }

    // Écouteur pour fermer la modale
    const closeModal = document.querySelector('#modale-conditionnement .close');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            const modaleConditionnement = document.getElementById('modale-conditionnement');
            if (modaleConditionnement) {
                modaleConditionnement.style.display = 'none';
            }
        });
    }

    // Charger les types de contenants dans le sélecteur
    const typeContenantSelect = document.getElementById('type-contenant');
    if (typeContenantSelect) {
        typeContenantSelect.innerHTML = '<option value="">-- Sélectionner un contenant --</option>';
        const typesContenants = [
            { id: 'canette_44cl', label: 'Canette 44cl' },
            { id: 'canette_33cl', label: 'Canette 33cl' },
            { id: 'bouteille_33cl', label: 'Bouteille 33cl' },
            { id: 'bouteille_50cl', label: 'Bouteille 50cl' },
            { id: 'bouteille_75cl', label: 'Bouteille 75cl' },
            { id: 'fut_19l', label: 'Fût 19L' },
            { id: 'fut_20l', label: 'Fût 20L' }
        ];

        typesContenants.forEach(contenant => {
            const option = document.createElement('option');
            option.value = contenant.id;
            option.textContent = contenant.label;
            typeContenantSelect.appendChild(option);
        });
    }
});
