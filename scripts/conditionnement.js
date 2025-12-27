// conditionnement.js - Gestion des déclarations de conditionnement avec destruction et raison

// Déclaration des types de contenants
if (typeof window.TYPES_CONTENANTS === 'undefined') {
    window.TYPES_CONTENANTS = [
        { id: 'canette_44cl', label: 'Canette 44cl', volume: 0.44 },
        { id: 'canette_33cl', label: 'Canette 33cl', volume: 0.33 },
        { id: 'bouteille_33cl', label: 'Bouteille 33cl', volume: 0.33 },
        { id: 'bouteille_50cl', label: 'Bouteille 50cl', volume: 0.50 },
        { id: 'bouteille_75cl', label: 'Bouteille 75cl', volume: 0.75 },
        { id: 'fut_19l', label: 'Fût 19L', volume: 19 },
        { id: 'fut_20l', label: 'Fût 20L', volume: 20 }
    ];
}

if (typeof window.currentEditId === 'undefined') {
    window.currentEditId = null;
}

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
                // Effacer le contenu actuel
                tbody.innerHTML = '';

                // Ajouter les lignes de conditionnements
                conditionnementsBiere.forEach(conditionnement => {
                    const row = document.createElement('tr');
                    row.dataset.id = conditionnement.id;

                    // Appliquer un style différent si le conditionnement est détruit
                    if (conditionnement.detruit) {
                        row.style.backgroundColor = '#ffebee';
                        row.style.textDecoration = 'line-through';
                        row.style.color = '#d32f2f';
                    }

                    // Ajouter un tooltip pour la raison de destruction si elle existe
                    const raisonDestruction = conditionnement.raison_destruction ?
                        ` title="Raison de destruction: ${conditionnement.raison_destruction}"` : '';

                    row.innerHTML = `
                        <td${raisonDestruction}>${conditionnement.numero_lot} ${conditionnement.detruit ? '(DÉTRUIT)' : ''}</td>
                        <td${raisonDestruction}>${conditionnement.biere_nom || 'Inconnu'}</td>
                        <td${raisonDestruction}>${conditionnement.abv_final || 'N/A'}</td>
                        <td${raisonDestruction}>${conditionnement.contenants.map(c => `${c.type} (${c.quantite})`).join(', ')}</td>
                        <td${raisonDestruction}>${conditionnement.contenants.reduce((total, c) => total + c.quantite, 0)}</td>
                        <td${raisonDestruction}>${conditionnement.volume_total} L</td>
                        <td${raisonDestruction}>${new Date(conditionnement.date).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn edit-btn" data-action="edit" data-id="${conditionnement.id}" title="Éditer" ${conditionnement.detruit ? 'disabled' : ''}>
                                <i class="material-icons">edit</i>
                            </button>
                            <button class="action-btn delete-btn" data-action="delete" data-id="${conditionnement.id}" title="Supprimer" ${conditionnement.detruit ? 'disabled' : ''}>
                                <i class="material-icons">delete</i>
                            </button>
                            <button class="action-btn destroy-btn" data-action="destroy" data-id="${conditionnement.id}"
                                    title="${conditionnement.detruit ? 'Rétablir ce conditionnement' : 'Détruire ce conditionnement'}"
                                    style="background-color: ${conditionnement.detruit ? '#4caf50' : '#f44336'};">
                                <i class="material-icons">${conditionnement.detruit ? 'restore' : 'delete_forever'}</i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                // Ajouter la ligne de résumé
                if (conditionnementsBiere.length > 0) {
                    const totalVolume = conditionnementsBiere.reduce((sum, c) => c.detruit ? sum : sum + c.volume_total, 0);
                    const totalABV = conditionnementsBiere.filter(c => !c.detruit).length > 0 ?
                                      conditionnementsBiere.reduce((sum, c) => c.detruit ? sum : sum + (c.abv_final || 0), 0) /
                                      conditionnementsBiere.filter(c => !c.detruit).length : 0;

                    const summaryRow = document.createElement('tr');
                    summaryRow.className = 'summary-row';
                    summaryRow.style.backgroundColor = '#f8f9fa';
                    summaryRow.style.fontWeight = 'bold';
                    summaryRow.innerHTML = `
                        <td colspan="4" style="text-align: right;">Total (disponibles)</td>
                        <td>${conditionnementsBiere.filter(c => !c.detruit).reduce((total, c) => total + c.contenants.reduce((sum, cont) => sum + cont.quantite, 0), 0)}</td>
                        <td>${totalVolume ? totalVolume.toFixed(2) : '0.00'} L</td>
                        <td>ABV : ${totalABV ? totalABV.toFixed(2) : '0.00'}%</td>
                        <td></td>
                    `;
                    tbody.appendChild(summaryRow);

                    // Ajouter une ligne pour les détruits
                    const totalVolumeDetruit = conditionnementsBiere.reduce((sum, c) => c.detruit ? sum + c.volume_total : sum, 0);
                    if (totalVolumeDetruit > 0) {
                        const destroyedRow = document.createElement('tr');
                        destroyedRow.className = 'summary-row';
                        destroyedRow.style.backgroundColor = '#ffebee';
                        destroyedRow.style.fontWeight = 'bold';
                        destroyedRow.innerHTML = `
                            <td colspan="4" style="text-align: right;">Total (détruits)</td>
                            <td>${conditionnementsBiere.filter(c => c.detruit).reduce((total, c) => total + c.contenants.reduce((sum, cont) => sum + cont.quantite, 0), 0)}</td>
                            <td>${totalVolumeDetruit.toFixed(2)} L</td>
                            <td colspan="2"></td>
                        `;
                        tbody.appendChild(destroyedRow);
                    }
                }
            }
        }

        attachConditionnementEventListeners();
    } catch (error) {
        console.error("Erreur lors du chargement des conditionnements:", error);
    }
}

// Ouvrir la modale pour ajouter ou éditer un conditionnement
function ouvrirModaleConditionnement(conditionnement = null) {
    const modaleConditionnement = document.getElementById('modale-conditionnement');
    if (!modaleConditionnement) return;

    const formConditionnement = document.getElementById('form-conditionnement');
    if (!formConditionnement) return;

    const selectBiereConditionnement = document.getElementById('select-biere-conditionnement');
    const abvFinalInput = document.getElementById('abv-final');
    const typeContenantSelect = document.getElementById('type-contenant');
    const quantiteContenantInput = document.getElementById('quantite-contenant');
    const dateConditionnementInput = document.getElementById('date-conditionnement');
    const btnEnregistrer = document.querySelector('#modale-conditionnement .btn-primary');

    if (!selectBiereConditionnement || !abvFinalInput || !typeContenantSelect || !quantiteContenantInput || !dateConditionnementInput || !btnEnregistrer) {
        console.error("Un ou plusieurs éléments du formulaire sont introuvables.");
        return;
    }

    if (conditionnement) {
        // Mode édition
        window.currentEditId = conditionnement.id;
        btnEnregistrer.onclick = () => {
            mettreAJourConditionnement(conditionnement.id);
        };

        const biereId = conditionnement.id_biere;
        selectBiereConditionnement.value = biereId;

        abvFinalInput.value = conditionnement.abv_final || '';
        dateConditionnementInput.value = conditionnement.date.split('T')[0]; // Format YYYY-MM-DD

        // Remplir le premier contenant (simplification)
        if (conditionnement.contenants && conditionnement.contenants.length > 0) {
            const contenant = conditionnement.contenants[0];
            typeContenantSelect.value = contenant.type;
            quantiteContenantInput.value = contenant.quantite;
        }
    } else {
        // Mode ajout
        window.currentEditId = null;
        btnEnregistrer.onclick = ajouterConditionnement;

        // Réinitialiser les champs
        selectBiereConditionnement.value = '';
        abvFinalInput.value = '';
        typeContenantSelect.value = '';
        quantiteContenantInput.value = '';
        dateConditionnementInput.value = '';
    }

    modaleConditionnement.style.display = 'block';
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

    const contenantInfo = window.TYPES_CONTENANTS.find(c => c.id === typeContenant);
    if (!contenantInfo) {
        alert("Type de contenant invalide.");
        return;
    }

    const volumeTotal = quantite * contenantInfo.volume;

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
                volume_unitaire: contenantInfo.volume
            }],
            volume_total: volumeTotal,
            detruit: false, // Par défaut, non détruit
            raison_destruction: null // Pas de raison de destruction par défaut
        };

        await window.DB.addItem('conditionnements', nouveauConditionnement);

        // Fermer la modale
        const modaleConditionnement = document.getElementById('modale-conditionnement');
        if (modaleConditionnement) {
            modaleConditionnement.style.display = 'none';
        }

        // Rafraîchir l'affichage
        chargerConditionnements(idBiere);

        alert(`Conditionnement enregistré avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'ajout du conditionnement:", error);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}

// Mettre à jour un conditionnement
async function mettreAJourConditionnement(id) {
    if (!id) {
        console.error("ID du conditionnement non défini.");
        alert("Erreur : ID du conditionnement non défini.");
        return;
    }

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

    const contenantInfo = window.TYPES_CONTENANTS.find(c => c.id === typeContenant);
    if (!contenantInfo) {
        alert("Type de contenant invalide.");
        return;
    }

    const volumeTotal = quantite * contenantInfo.volume;

    try {
        const biere = await window.DB.loadItemById('bieres', idBiere);
        const conditionnementExistant = await window.DB.loadItemById('conditionnements', id);

        if (!conditionnementExistant) {
            alert("Conditionnement non trouvé.");
            return;
        }

        // Supprimer l'ancien conditionnement et en créer un nouveau avec les mêmes données mises à jour
        await window.DB.deleteItem('conditionnements', id);

        const conditionnementMisAJour = {
            id_biere: idBiere,
            biere_nom: biere.nom,
            date: dateConditionnement,
            numero_lot: conditionnementExistant.numero_lot, // Conserver le numéro de lot existant
            abv_final: parseFloat(abvFinal),
            contenants: [{
                type: typeContenant,
                quantite: quantite,
                volume_unitaire: contenantInfo.volume
            }],
            volume_total: volumeTotal,
            detruit: conditionnementExistant.detruit || false, // Conserver l'état détruit
            raison_destruction: conditionnementExistant.raison_destruction || null // Conserver la raison de destruction
        };

        await window.DB.addItem('conditionnements', conditionnementMisAJour);

        // Fermer la modale
        const modaleConditionnement = document.getElementById('modale-conditionnement');
        if (modaleConditionnement) {
            modaleConditionnement.style.display = 'none';
        }

        // Rafraîchir l'affichage
        chargerConditionnements(idBiere);

        alert(`Conditionnement mis à jour avec succès.`);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du conditionnement:", error);
        alert("Une erreur est survenue lors de la mise à jour : " + error.message);
    }
}

// Supprimer un conditionnement
async function supprimerConditionnement(id) {
    try {
        const conditionnement = await window.DB.loadItemById('conditionnements', id);
        if (!conditionnement) return;

        if (confirm(`Voulez-vous vraiment supprimer définitivement ce conditionnement (Lot: ${conditionnement.numero_lot}) ?`)) {
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

// Détruire ou rétablir un conditionnement
async function detruireConditionnement(id) {
    try {
        const conditionnement = await window.DB.loadItemById('conditionnements', id);
        if (!conditionnement) return;

        if (conditionnement.detruit) {
            // Si déjà détruit, on demande confirmation pour rétablir
            if (confirm(`Voulez-vous vraiment rétablir ce conditionnement (Lot: ${conditionnement.numero_lot}) ?`)) {
                await marquerConditionnement(id, false, null);
            }
        } else {
            // Si non détruit, on ouvre une modale pour demander la raison de la destruction
            ouvrirModaleRaisonDestruction(id);
        }
    } catch (error) {
        console.error(`Erreur lors de la vérification du conditionnement:`, error);
        alert(`Une erreur est survenue lors de la vérification du conditionnement.`);
    }
}

// Ouvrir une modale pour demander la raison de la destruction
function ouvrirModaleRaisonDestruction(id) {
    // Créer la modale si elle n'existe pas
    let modaleRaisonDestruction = document.getElementById('modale-raison-destruction');
    if (!modaleRaisonDestruction) {
        modaleRaisonDestruction = document.createElement('div');
        modaleRaisonDestruction.id = 'modale-raison-destruction';
        modaleRaisonDestruction.className = 'custom-modal';
        modaleRaisonDestruction.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>Raison de la destruction</h3>
                <form id="form-raison-destruction">
                    <div class="form-group">
                        <label for="raison-destruction">Veuillez indiquer la raison de la destruction :</label>
                        <textarea id="raison-destruction" class="form-control" rows="4" required></textarea>
                    </div>
                    <button type="button" id="btn-confirmer-destruction" class="btn btn-primary">Confirmer la destruction</button>
                </form>
            </div>
        `;
        document.body.appendChild(modaleRaisonDestruction);
    }

    // Afficher la modale
    modaleRaisonDestruction.style.display = 'block';

    // Écouteur pour le bouton de confirmation
    const btnConfirmerDestruction = document.getElementById('btn-confirmer-destruction');
    if (btnConfirmerDestruction) {
        btnConfirmerDestruction.onclick = async () => {
            const raisonDestruction = document.getElementById('raison-destruction').value;
            if (!raisonDestruction) {
                alert("Veuillez indiquer une raison pour la destruction.");
                return;
            }

            await marquerConditionnement(id, true, raisonDestruction);
            modaleRaisonDestruction.style.display = 'none';
        };
    }

    // Écouteur pour fermer la modale
    const closeModal = modaleRaisonDestruction.querySelector('.close');
    if (closeModal) {
        closeModal.onclick = () => {
            modaleRaisonDestruction.style.display = 'none';
        };
    }
}

// Marquer un conditionnement comme détruit ou rétablir
async function marquerConditionnement(id, detruit, raisonDestruction) {
    try {
        const conditionnement = await window.DB.loadItemById('conditionnements', id);
        if (!conditionnement) return;

        // Supprimer l'ancien conditionnement et en créer un nouveau avec l'état détruit mis à jour
        await window.DB.deleteItem('conditionnements', id);

        const conditionnementMisAJour = {
            ...conditionnement,
            detruit: detruit,
            raison_destruction: detruit ? raisonDestruction : null
        };

        await window.DB.addItem('conditionnements', conditionnementMisAJour);

        // Rafraîchir l'affichage
        const listboxBieres = document.getElementById('listbox-bieres');
        if (listboxBieres) {
            const idBiere = listboxBieres.value;
            chargerConditionnements(idBiere);
        }

        alert(`Conditionnement ${detruit ? 'détruit' : 'rétabli'} avec succès.`);
    } catch (error) {
        console.error(`Erreur lors de la ${detruit ? 'destruction' : 'réhabilitation'} du conditionnement:`, error);
        alert(`Une erreur est survenue lors de la ${detruit ? 'destruction' : 'réhabilitation'}.`);
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
        const row = target.closest('tr');
        if (!row) return;

        const id = row.dataset.id;
        if (!id) {
            console.error("ID du conditionnement non trouvé.");
            return;
        }

        if (action === 'edit') {
            try {
                const conditionnement = await window.DB.loadItemById('conditionnements', id);
                if (conditionnement) {
                    ouvrirModaleConditionnement(conditionnement);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération du conditionnement:", error);
                alert("Erreur lors de la récupération du conditionnement.");
            }
        } else if (action === 'delete') {
            await supprimerConditionnement(id);
        } else if (action === 'destroy') {
            await detruireConditionnement(id);
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
            ouvrirModaleConditionnement();
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
        window.TYPES_CONTENANTS.forEach(contenant => {
            const option = document.createElement('option');
            option.value = contenant.id;
            option.textContent = contenant.label;
            typeContenantSelect.appendChild(option);
        });
    }
});
