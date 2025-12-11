// conditionnement.js - Gestion complète du conditionnement avec volume total
let currentConditionnementId = null;

// 1. Types de contenants disponibles
const TYPES_CONTENANTS = [
    { id: 'canette_44cl', nom: 'Canette 44cl', volume: 0.44 },
    { id: 'canette_33cl', nom: 'Canette 33cl', volume: 0.33 },
    { id: 'bouteille_33cl', nom: 'Bouteille 33cl', volume: 0.33 },
    { id: 'bouteille_50cl', nom: 'Bouteille 50cl', volume: 0.50 },
    { id: 'bouteille_75cl', nom: 'Bouteille 75cl', volume: 0.75 },
    { id: 'fut_sodakeg_19l', nom: 'Fût SodaKeg 19L', volume: 19 },
    { id: 'fut_20l', nom: 'Fût 20L', volume: 20 }
];

// 2. Charger les bières dans le sélecteur
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

// 3. Charger les contenants dans le sélecteur
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

// 4. Afficher les conditionnements existants
async function afficherConditionnements() {
    try {
        const conditionnements = await loadData('conditionnements').catch(() => []);
        const bieres = await loadData('bieres').catch(() => []);

        // Calculer le volume total par bière
        const volumesParBiere = {};
        conditionnements.forEach(cond => {
            const contenant = TYPES_CONTENANTS.find(c => c.id === cond.type_contenant);
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
                        <td>${cond.volume_litres}L</td>
                        <td>${cond.abv}°</td>
                        <td>${contenant ? contenant.nom : cond.type_contenant}</td>
                        <td>${cond.quantite}</td>
                        <td>${volumeTotalContenant.toFixed(2)}L</td>
                        <td>${new Date(cond.date).toLocaleString()}</td>
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
                    syntheseParBiere[cond.id_biere] = {
                        nom: bieres.find(b => b.id === cond.id_biere)?.nom || 'Inconnu',
                        volumeTotal: 0,
                        count: 0
                    };
                }
                const contenant = TYPES_CONTENANTS.find(c => c.id === cond.type_contenant);
                syntheseParBiere[cond.id_biere].volumeTotal += cond.quantite * contenant.volume;
                syntheseParBiere[cond.id_biere].count += cond.quantite;
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
                    <td colspan="2"></td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Erreur affichage conditionnements:", error);
    }
}

// 5. Ajouter un conditionnement
async function ajouterConditionnement() {
    const idBiere = document.getElementById('select-biere-conditionnement').value;
    const volume = parseFloat(document.getElementById('volume-conditionne').value);
    const abv = parseFloat(document.getElementById('abv-final').value);
    const typeContenant = document.getElementById('type-contenant').value;
    const quantite = parseInt(document.getElementById('quantite-contenant').value);

    if (!idBiere || isNaN(volume) || isNaN(abv) || !typeContenant || isNaN(quantite) || quantite <= 0) {
        alert("Veuillez remplir tous les champs correctement");
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

        const volumeTotalContenants = quantite * contenant.volume;
        if (volumeTotalContenants > volume) {
            alert(`Le volume total des contenants (${volumeTotalContenants.toFixed(2)}L) dépasse le volume déclaré (${volume}L)`);
            return;
        }

        const nouveauConditionnement = {
            id_biere: parseInt(idBiere),
            nom_biere: biere.nom,
            volume_litres: volume,
            abv: abv,
            type_contenant: typeContenant,
            quantite: quantite,
            date: new Date().toISOString(),
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
            date: new Date().toISOString(),
            volume: volume,
            abv: abv,
            type_contenant: typeContenant,
            quantite: quantite,
            contenant_nom: contenant.nom,
            volume_total: volumeTotalContenants
        });

        // Mettre à jour le volume total conditionné
        if (!biere.volume_total_conditionne) {
            biere.volume_total_conditionne = 0;
        }
        biere.volume_total_conditionne += volumeTotalContenants;
        await updateItem('bieres', biere);

        // Réinitialiser le formulaire
        document.getElementById('volume-conditionne').value = '';
        document.getElementById('abv-final').value = '';
        document.getElementById('quantite-contenant').value = '';

        // Rafraîchir l'affichage
        afficherConditionnements();
        alert(`Conditionnement enregistré: ${quantite} x ${contenant.nom} (${volumeTotalContenants.toFixed(2)}L)`);
    } catch (error) {
        console.error("Erreur ajout conditionnement:", error);
        alert("Erreur lors de l'enregistrement");
    }
}

// 6. Supprimer un conditionnement
async function supprimerConditionnement(id) {
    try {
        const conditionnement = await loadItemById('conditionnements', id);
        if (!conditionnement) return;

        if (confirm(`Voulez-vous vraiment supprimer ce conditionnement ?`)) {
            await deleteItem('conditionnements', id);

            // Mettre à jour l'historique de la bière
            const biere = await loadItemById('bieres', conditionnement.id_biere);
            if (biere) {
                // Retirer de l'historique
                if (biere.historique_conditionnement) {
                    biere.historique_conditionnement = biere.historique_conditionnement.filter(
                        h => !(h.date === conditionnement.date &&
                              h.volume === conditionnement.volume_litres &&
                              h.abv === conditionnement.abv &&
                              h.type_contenant === conditionnement.type_contenant &&
                              h.quantite === conditionnement.quantite)
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

// 7. Afficher l'historique de conditionnement pour une bière
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
                message += `- ${new Date(item.date).toLocaleString()}: `
                         + `${item.quantite} x ${item.contenant_nom} `
                         + `(Volume: ${item.volume}L, ABV: ${item.abv}°, `
                         + `Total: ${item.volume_total.toFixed(2)}L)\n`;
            });
        }

        alert(message);
    } catch (error) {
        console.error("Erreur affichage historique:", error);
        alert("Erreur lors de l'affichage de l'historique");
    }
}

// 8. Afficher le volume total conditionné par bière dans le tableau des bières
async function afficherVolumesTotauxDansTableauBieres() {
    try {
        const bieres = await loadData('bieres').catch(() => []);
        const conditionnements = await loadData('conditionnements').catch(() => []);

        // Calculer les volumes totaux par bière
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

        // Mettre à jour les bières avec les volumes totaux
        for (const biere of bieres) {
            biere.volume_total_conditionne = volumesParBiere[biere.id] || 0;
            await updateItem('bieres', biere);
        }
    } catch (error) {
        console.error("Erreur calcul volumes totaux:", error);
    }
}

// 9. Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données initiales
    chargerSelecteurBieresConditionnement();
    chargerSelecteurContenants();

    // Calculer et afficher les volumes totaux
    afficherVolumesTotauxDansTableauBieres().then(() => {
        afficherConditionnements();
    });

    // Configuration des inputs
    const volumeInput = document.getElementById('volume-conditionne');
    const abvInput = document.getElementById('abv-final');
    const quantiteInput = document.getElementById('quantite-contenant');

    if (volumeInput) volumeInput.step = '0.01';
    if (abvInput) abvInput.step = '0.1';
    if (quantiteInput) quantiteInput.step = '1';
});
