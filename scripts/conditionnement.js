// conditionnement.js - Version avec calcul automatique du volume conditionné
let currentConditionnementId = null;

// 1. Types de contenants disponibles
const TYPES_CONTENANTS = [
    { id: 'canette_44cl', nom: 'Canette 44cl', volume: 0.44, code: 'C44' },
    { id: 'canette_33cl', nom: 'Canette 33cl', volume: 0.33, code: 'C33' },
    { id: 'bouteille_33cl', nom: 'Bouteille 33cl', volume: 0.33, code: 'B33' },
    { id: 'bouteille_50cl', nom: 'Bouteille 50cl', volume: 0.50, code: 'B50' },
    { id: 'bouteille_75cl', nom: 'Bouteille 75cl', volume: 0.75, code: 'B75' },
    { id: 'fut_sodakeg_19l', nom: 'Fût SodaKeg 19L', volume: 19, code: 'FS19' },
    { id: 'fut_20l', nom: 'Fût 20L', volume: 20, code: 'F20' }
];

// 2. Générer un numéro de lot unique et mnémotechnique
function genererNumeroLot(biereNom, typeContenant, date) {
    const biereCode = biereNom.substring(0, 2).toUpperCase();
    const contenant = TYPES_CONTENANTS.find(c => c.id === typeContenant);
    const contenantCode = contenant ? contenant.code : 'XX';
    const dateCode = new Date(date).toISOString().substring(2, 10).replace(/-/g, '');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${biereCode}-${contenantCode}-${dateCode}-${randomCode}`;
}

// 3. Charger les bières dans le sélecteur
async function chargerSelecteurBieresConditionnement() {
    try {
        const bieres = await loadData('bieres').catch(() => []);
        const select = document.getElementById('select-biere-conditionnement');
        if (select) {
            select.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
            bieres.forEach(biere => {
                const option = document.createElement('option');
                option.value = biere.id;
                option.textContent = biere.nom;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erreur chargement bières:", error);
    }
}

// 4. Charger les contenants dans le sélecteur
function chargerSelecteurContenants() {
    const select = document.getElementById('type-contenant');
    if (select) {
        select.innerHTML = '';
        TYPES_CONTENANTS.forEach(contenant => {
            const option = document.createElement('option');
            option.value = contenant.id;
            option.textContent = contenant.nom;
            select.appendChild(option);
        });
    }
}

// 5. Afficher les conditionnements existants
async function afficherConditionnements() {
    try {
        const conditionnements = await loadData('conditionnements').catch(() => []);
        const bieres = await loadData('bieres').catch(() => []);

        // Calculer le volume total par bière
        const volumesParBiere = {};
        conditionnements.forEach(cond => {
            const contenant = TYPES_CONTENANTS.find(c => c.id === cond.type_contenant);
            if (!contenant) return;

            const volumeTotal = cond.quantite * contenant.volume;
            if (!volumesParBiere[cond.id_biere]) {
                volumesParBiere[cond.id_biere] = 0;
            }
            volumesParBiere[cond.id_biere] += volumeTotal;
        });

        const tbody = document.querySelector('#table-conditionnements tbody');
        if (tbody) {
            tbody.innerHTML = conditionnements.map(cond => {
                const biere = bieres.find(b => b.id === cond.id_biere);
                const contenant = TYPES_CONTENANTS.find(c => c.id === cond.type_contenant);
                const volumeTotalContenant = cond.quantite * contenant.volume;
                const volumeTotalBiere = volumesParBiere[cond.id_biere] || 0;

                return `
                    <tr data-id="${cond.id}">
                        <td>${cond.id}</td>
                        <td>${biere ? biere.nom : 'Inconnu'}</td>
                        <td>${cond.volume_total_calcule || 'N/A'}L</td>
                        <td>${cond.abv}°</td>
                        <td>${contenant ? contenant.nom : cond.type_contenant}</td>
                        <td>${cond.quantite}</td>
                        <td>${volumeTotalContenant.toFixed(2)}L</td>
                        <td>${new Date(cond.date).toLocaleDateString()}</td>
                        <td>${cond.numero_lot || '-'}</td>
                        <td>
                            <button class="action-btn info-btn" title="Voir historique"
                                   onclick="afficherHistoriqueConditionnement(${cond.id_biere})">
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

            // Ajouter une ligne de synthèse par bière
            const syntheseParBiere = {};
            conditionnements.forEach(cond => {
                if (!syntheseParBiere[cond.id_biere]) {
                    const biere = bieres.find(b => b.id === cond.id_biere);
                    syntheseParBiere[cond.id_biere] = {
                        nom: biere ? biere.nom : 'Inconnu',
                        volumeTotal: 0,
                        count: 0
                    };
                }
                const contenant = TYPES_CONTENANTS.find(c => c.id === cond.type_contenant);
                if (contenant) {
                    syntheseParBiere[cond.id_biere].volumeTotal += cond.quantite * contenant.volume;
                    syntheseParBiere[cond.id_biere].count += cond.quantite;
                }
            });

            // Ajouter les lignes de synthèse
            Object.entries(syntheseParBiere).forEach(([idBiere, data]) => {
                const row = document.createElement('tr');
                row.className = 'synthese-biere';
                row.innerHTML = `
                    <td colspan="2"><strong>${data.nom}</strong></td>
                    <td colspan="2"><strong>Total:</strong></td>
                    <td colspan="2"><strong>${data.count} contenants</strong></td>
                    <td><strong>${data.volumeTotal.toFixed(2)}L</strong></td>
                    <td colspan="3"></td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Erreur affichage conditionnements:", error);
    }
}

// 6. Ajouter un conditionnement (version modifiée pour calcul automatique)
async function ajouterConditionnement() {
    const idBiere = document.getElementById('select-biere-conditionnement').value;
    const abv = parseFloat(document.getElementById('abv-final').value);
    const typeContenant = document.getElementById('type-contenant').value;
    const quantite = parseInt(document.getElementById('quantite-contenant').value);
    const dateConditionnement = document.getElementById('date-conditionnement').value;

    if (!idBiere || isNaN(abv) || !typeContenant || isNaN(quantite) || quantite <= 0 || !dateConditionnement) {
        alert("Veuillez remplir tous les champs correctement (y compris la date)");
        return;
    }

    try {
        const biere = await loadItemById('bieres', idBiere);
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
            id_biere: parseInt(idBiere),
            nom_biere: biere.nom,
            volume_total_calcule: volumeTotalContenants, // Volume calculé automatiquement
            abv: abv,
            type_contenant: typeContenant,
            quantite: quantite,
            date: dateConditionnement,
            numero_lot: numeroLot,
            contenant_nom: contenant.nom,
            contenant_volume: contenant.volume,
            volume_total_contenants: volumeTotalContenants
        };

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

        // Réinitialiser le formulaire
        document.getElementById('abv-final').value = '';
        document.getElementById('quantite-contenant').value = '';
        document.getElementById('date-conditionnement').valueAsDate = new Date();

        // Rafraîchir l'affichage
        afficherConditionnements();
        alert(`Conditionnement enregistré:\n`
            + `Numéro de lot: ${numeroLot}\n`
            + `${quantite} x ${contenant.nom} (${volumeTotalContenants.toFixed(2)}L)`);
    } catch (error) {
        console.error("Erreur ajout conditionnement:", error);
        alert("Erreur lors de l'enregistrement");
    }
}

// 7. Supprimer un conditionnement
async function supprimerConditionnement(id) {
    try {
        const conditionnement = await loadItemById('conditionnements', id);
        if (!conditionnement) return;

        if (confirm(`Voulez-vous vraiment supprimer ce conditionnement (Lot: ${conditionnement.numero_lot || 'N/A'}) ?`)) {
            await deleteItem('conditionnements', id);

            // Mettre à jour l'historique de la bière
            const biere = await loadItemById('bieres', conditionnement.id_biere);
            if (biere) {
                // Retirer de l'historique
                if (biere.historique_conditionnement) {
                    biere.historique_conditionnement = biere.historique_conditionnement.filter(
                        h => h.numero_lot !== conditionnement.numero_lot
                    );
                }

                // Mettre à jour le volume total
                if (biere.volume_total_conditionne) {
                    biere.volume_total_conditionne -= conditionnement.volume_total_contenants;
                }

                await updateItem('bieres', biere);
            }

            afficherConditionnements();
        }
    } catch (error) {
        console.error("Erreur suppression conditionnement:", error);
        alert("Erreur lors de la suppression");
    }
}

// 8. Afficher l'historique de conditionnement pour une bière
async function afficherHistoriqueConditionnement(idBiere) {
    try {
        const biere = await loadItemById('bieres', idBiere);
        if (!biere) {
            alert("Bière non trouvée");
            return;
        }

        let message = `Historique de conditionnement pour "${biere.nom}":\n`;
        message += `Volume total conditionné: ${biere.volume_total_conditionne ? biere.volume_total_conditionne.toFixed(2) : 0}L\n\n`;

        if (!biere.historique_conditionnement || biere.historique_conditionnement.length === 0) {
            message += "Aucun conditionnement enregistré pour cette bière.";
        } else {
            const historique = [...biere.historique_conditionnement].sort((a, b) => new Date(b.date) - new Date(a.date));
            historique.forEach(item => {
                message += `- ${new Date(item.date).toLocaleDateString()}: `
                         + `${item.numero_lot || 'N/A'} - `
                         + `${item.quantite} x ${item.contenant_nom} `
                         + `(ABV: ${item.abv}°, Total: ${item.volume_total.toFixed(2)}L)\n`;
            });
        }

        alert(message);
    } catch (error) {
        console.error("Erreur affichage historique:", error);
        alert("Erreur lors de l'affichage de l'historique");
    }
}

// 9. Calculer les volumes totaux conditionnés
async function calculerVolumesTotauxConditionnes() {
    try {
        const bieres = await loadData('bieres').catch(() => []);
        const conditionnements = await loadData('conditionnements').catch(() => []);

        // Réinitialiser les volumes totaux
        for (const biere of bieres) {
            biere.volume_total_conditionne = 0;
            await updateItem('bieres', biere);
        }

        // Recalculer les volumes totaux par bière
        const volumesParBiere = {};
        conditionnements.forEach(cond => {
            const contenant = TYPES_CONTENANTS.find(c => c.id === cond.type_contenant);
            if (!contenant) return;

            const volumeTotal = cond.quantite * contenant.volume;
            if (!volumesParBiere[cond.id_biere]) {
                volumesParBiere[cond.id_biere] = 0;
            }
            volumesParBiere[cond.id_biere] += volumeTotal;
        });

        // Mettre à jour les bières avec les nouveaux volumes totaux
        for (const biere of bieres) {
            biere.volume_total_conditionne = volumesParBiere[biere.id] || 0;
            await updateItem('bieres', biere);
        }
    } catch (error) {
        console.error("Erreur calcul volumes totaux:", error);
    }
}

// 10. Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données initiales
    chargerSelecteurBieresConditionnement();
    chargerSelecteurContenants();

    // Calculer et afficher les volumes totaux
    calculerVolumesTotauxConditionnes().then(() => {
        afficherConditionnements();
    });

    // Configuration des inputs
    const abvInput = document.getElementById('abv-final');
    const quantiteInput = document.getElementById('quantite-contenant');
    const dateInput = document.getElementById('date-conditionnement');

    if (abvInput) abvInput.step = '0.1';
    if (quantiteInput) quantiteInput.step = '1';
    if (dateInput) dateInput.valueAsDate = new Date();
});
