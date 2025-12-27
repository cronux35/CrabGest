// conditionnement.js - Gestion des déclarations de conditionnement avec édition et résumé
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
                    row.innerHTML = `
                        <td>${conditionnement.numero_lot}</td>
                        <td>${conditionnement.biere_nom || 'Inconnu'}</td>
                        <td>${conditionnement.abv_final || 'N/A'}</td>
                        <td>${conditionnement.contenants.map(c => `${c.type} (${c.quantite})`).join(', ')}</td>
                        <td>${conditionnement.contenants.reduce((total, c) => total + c.quantite, 0)}</td>
                        <td>${conditionnement.volume_total} L</td>
                        <td>${new Date(conditionnement.date).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn edit-btn" data-action="edit" data-id="${conditionnement.id}" title="Éditer">
                                <i class="material-icons">edit</i>
                            </button>
                            <button class="action-btn delete-btn" data-action="delete" data-id="${conditionnement.id}" title="Supprimer">
                                <i class="material-icons">delete</i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                // Ajouter la ligne de résumé
                if (conditionnementsBiere.length > 0) {
                    const totalVolume = conditionnementsBiere.reduce((sum, c) => sum + c.volume_total, 0);
                    const totalABV = conditionnementsBiere.reduce((sum, c) => sum + (c.abv_final || 0), 0) / conditionnementsBiere.length;

                    const summaryRow = document.createElement('tr');
                    summaryRow.className = 'summary-row';
                    summaryRow.style.backgroundColor = '#f8f9fa';
                    summaryRow.style.fontWeight = 'bold';
                    summaryRow.innerHTML = `
                        <td colspan="4" style="text-align: right;">Total</td>
                        <td>${conditionnementsBiere.reduce((total, c) => total + c.contenants.reduce((sum, cont) => sum + cont.quantite, 0), 0)}</td>
                        <td>${totalVolume.toFixed(2)} L</td>
                        <td>ABV : ${totalABV.toFixed(2)}%</td>
                        <td></td>
                    `;
                    tbody.appendChild(summaryRow);
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
            volume_total: volumeTotal
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
            volume_total: volumeTotal
        };

        await window.DB.updateItem('conditionnements', id, conditionnementMisAJour);

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
