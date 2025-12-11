// conditionnement.js - Version avec filtres déroulants et actualisation automatique
let currentConditionnementId = null;
let currentSortColumn = null;
let currentSortDirection = 1;
let currentFilters = {};
let allConditionnements = [];
let allBieres = [];

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

// 2. Générer un numéro de lot unique
function genererNumeroLot(biereNom, typeContenant, date) {
    const biereCode = biereNom.substring(0, 2).toUpperCase();
    const contenant = TYPES_CONTENANTS.find(c => c.id === typeContenant);
    const contenantCode = contenant ? contenant.code : 'XX';
    const dateCode = new Date(date).toISOString().substring(2, 10).replace(/-/g, '');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${biereCode}-${contenantCode}-${dateCode}-${randomCode}`;
}

// 3. Charger les données initiales
async function chargerDonneesInitiales() {
    try {
        allBieres = await loadData('bieres').catch(() => []);
        allConditionnements = await loadData('conditionnements').catch(() => []);

        // Charger les sélecteurs
        chargerSelecteurBieresConditionnement();
        chargerSelecteurContenants();

        // Initialiser les filtres
        initialiserFiltres();

        // Afficher les conditionnements
        afficherConditionnements();
    } catch (error) {
        console.error("Erreur chargement initial:", error);
    }
}

// 4. Charger les bières dans le sélecteur
function chargerSelecteurBieresConditionnement() {
    const select = document.getElementById('select-biere-conditionnement');
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

// 5. Charger les contenants dans le sélecteur
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

// 6. Initialiser les filtres déroulants
function initialiserFiltres() {
    const headers = document.querySelectorAll('#table-conditionnements thead th');
    headers.forEach((header, index) => {
        if (index === headers.length - 1) return; // Ne pas ajouter de filtre à la colonne Actions

        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';

        const select = document.createElement('select');
        select.className = 'filter-select';
        select.dataset.column = index;

        // Ajouter une option "Tous" par défaut
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Tous';
        select.appendChild(defaultOption);

        // Ajouter les options spécifiques à chaque colonne
        switch(index) {
            case 0: // Numéro de lot
                const lotsUniques = [...new Set(allConditionnements.map(c => c.numero_lot))].sort();
                lotsUniques.forEach(lot => {
                    const option = document.createElement('option');
                    option.value = lot;
                    option.textContent = lot;
                    select.appendChild(option);
                });
                break;

            case 1: // Bière
                allBieres.forEach(biere => {
                    const option = document.createElement('option');
                    option.value = biere.nom;
                    option.textContent = biere.nom;
                    select.appendChild(option);
                });
                break;

            case 2: // ABV
                const abvUniques = [...new Set(allConditionnements.map(c => c.abv))].sort((a, b) => a - b);
                abvUniques.forEach(abv => {
                    const option = document.createElement('option');
                    option.value = abv;
                    option.textContent = abv + '°';
                    select.appendChild(option);
                });
                break;

            case 3: // Contenant
                TYPES_CONTENANTS.forEach(contenant => {
                    const option = document.createElement('option');
                    option.value = contenant.nom;
                    option.textContent = contenant.nom;
                    select.appendChild(option);
                });
                break;

            case 4: // Quantité
                // Pas de filtre spécifique pour la quantité
                select.style.display = 'none';
                const input = document.createElement('input');
                input.type = 'number';
                input.placeholder = 'Filtrer...';
                input.className = 'filter-input';
                input.dataset.column = index;
                input.addEventListener('input', () => {
                    currentFilters[index] = input.value;
                    afficherConditionnements();
                });
                filterContainer.appendChild(input);
                break;

            case 5: // Volume conditionné
                // Pas de filtre spécifique pour le volume
                select.style.display = 'none';
                const volumeInput = document.createElement('input');
                volumeInput.type = 'number';
                volumeInput.placeholder = 'Filtrer...';
                volumeInput.className = 'filter-input';
                volumeInput.dataset.column = index;
                volumeInput.addEventListener('input', () => {
                    currentFilters[index] = volumeInput.value;
                    afficherConditionnements();
                });
                filterContainer.appendChild(volumeInput);
                break;

            case 6: // Date
                // Pas de filtre spécifique pour la date
                select.style.display = 'none';
                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.className = 'filter-input';
                dateInput.dataset.column = index;
                dateInput.addEventListener('input', () => {
                    currentFilters[index] = dateInput.value;
                    afficherConditionnements();
                });
                filterContainer.appendChild(dateInput);
                break;
        }

        if (select.style.display !== 'none') {
            select.addEventListener('change', () => {
                currentFilters[index] = select.value;
                afficherConditionnements();
            });
            filterContainer.appendChild(select);
        }

        header.appendChild(filterContainer);
    });

    // Ajouter des indicateurs de tri
    headers.forEach((header, index) => {
        if (index === headers.length - 1) return; // Ne pas ajouter de tri à la colonne Actions

        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            if (currentSortColumn === index) {
                currentSortDirection *= -1;
            } else {
                currentSortColumn = index;
                currentSortDirection = 1;
            }
            afficherConditionnements();
        });
    });
}

// 7. Appliquer les filtres et le tri
function appliquerFiltresEtTri(data) {
    // Appliquer les filtres
    let filteredData = data.filter(cond => {
        const biere = allBieres.find(b => b.id === cond.id_biere);
        const contenant = TYPES_CONTENANTS.find(c => c.id === cond.type_contenant);

        return Object.entries(currentFilters).every(([columnIndex, filterValue]) => {
            if (!filterValue) return true;

            columnIndex = parseInt(columnIndex);
            switch(columnIndex) {
                case 0: return cond.numero_lot.toLowerCase().includes(filterValue.toLowerCase());
                case 1: return (biere ? biere.nom.toLowerCase() : '').includes(filterValue.toLowerCase());
                case 2: return cond.abv.toString() === filterValue;
                case 3: return (contenant ? contenant.nom.toLowerCase() : '').includes(filterValue.toLowerCase());
                case 4: return cond.quantite.toString().includes(filterValue);
                case 5: {
                    const volume = cond.quantite * (contenant ? contenant.volume : 0);
                    return volume.toFixed(2).includes(filterValue);
                }
                case 6: {
                    const date = new Date(cond.date).toISOString().split('T')[0];
                    return date === filterValue;
                }
                default: return true;
            }
        });
    });

    // Appliquer le tri
    if (currentSortColumn !== null) {
        filteredData.sort((a, b) => {
            const biereA = allBieres.find(b => b.id === a.id_biere);
            const biereB = allBieres.find(b => b.id === b.id_biere);
            const contenantA = TYPES_CONTENANTS.find(c => c.id === a.type_contenant);
            const contenantB = TYPES_CONTENANTS.find(c => c.id === b.type_contenant);

            let valueA, valueB;

            switch(currentSortColumn) {
                case 0: valueA = a.numero_lot; valueB = b.numero_lot; break;
                case 1: valueA = biereA ? biereA.nom : ''; valueB = biereB ? biereB.nom : ''; break;
                case 2: valueA = a.abv; valueB = b.abv; break;
                case 3: valueA = contenantA ? contenantA.nom : ''; valueB = contenantB ? contenantB.nom : ''; break;
                case 4: valueA = a.quantite; valueB = b.quantite; break;
                case 5: valueA = a.quantite * (contenantA ? contenantA.volume : 0); valueB = b.quantite * (contenantB ? contenantB.volume : 0); break;
                case 6: valueA = new Date(a.date); valueB = new Date(b.date); break;
                default: return 0;
            }

            if (valueA < valueB) return -1 * currentSortDirection;
            if (valueA > valueB) return 1 * currentSortDirection;
            return 0;
        });
    }

    return filteredData;
}

// 8. Afficher les conditionnements avec filtres et tri
async function afficherConditionnements() {
    try {
        // Appliquer filtres et tri
        const filteredData = appliquerFiltresEtTri(allConditionnements);

        // Calculer le volume total par bière (sur les données filtrées)
        const volumesParBiere = {};
        filteredData.forEach(cond => {
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
            tbody.innerHTML = filteredData.map(cond => {
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

            // Ajouter une ligne de synthèse par bière (sur les données filtrées)
            const syntheseParBiere = {};
            filteredData.forEach(cond => {
                if (!syntheseParBiere[cond.id_biere]) {
                    const biere = allBieres.find(b => b.id === cond.id_biere);
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
                    <td colspan="4"><strong>${data.nom}</strong></td>
                    <td><strong>${data.count} contenants</strong></td>
                    <td><strong>${data.volumeTotal.toFixed(2)}L</strong></td>
                    <td colspan="2"></td>
                `;
                tbody.appendChild(row);
            });

            // Mettre à jour les indicateurs de tri
            const headers = document.querySelectorAll('#table-conditionnements thead th');
            headers.forEach((header, index) => {
                header.classList.remove('sorted-asc', 'sorted-desc');
                if (index === currentSortColumn) {
                    header.classList.add(currentSortDirection === 1 ? 'sorted-asc' : 'sorted-desc');
                }
            });
        }
    } catch (error) {
        console.error("Erreur affichage conditionnements:", error);
    }
}

// 9. Ajouter un conditionnement
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

        // Réinitialiser le formulaire
        document.getElementById('abv-final').value = '';
        document.getElementById('quantite-contenant').value = '';
        document.getElementById('date-conditionnement').valueAsDate = new Date();

        alert(`Conditionnement enregistré:\n`
            + `Numéro de lot: ${numeroLot}\n`
            + `${quantite} x ${contenant.nom} (${volumeTotalContenants.toFixed(2)}L)`);
    } catch (error) {
        console.error("Erreur ajout conditionnement:", error);
        alert("Erreur lors de l'enregistrement");
    }
}

// 10. Supprimer un conditionnement
async function supprimerConditionnement(id) {
    try {
        const conditionnement = await loadItemById('conditionnements', id);
        if (!conditionnement) return;

        if (confirm(`Voulez-vous vraiment supprimer ce conditionnement (Lot: ${conditionnement.numero_lot || 'N/A'}) ?`)) {
            await deleteItem('conditionnements', id);

            // Mettre à jour l'historique de la bière
            const biere = allBieres.find(b => b.id === conditionnement.id_biere);
            if (biere) {
                // Retirer de l'historique
                if (biere.historique_conditionnement) {
                    biere.historique_conditionnement = biere.historique_conditionnement.filter(
                        h => h.numero_lot !== conditionnement.numero_lot
                    );
                }

                // Mettre à jour le volume total
                if (biere.volume_total_conditionne) {
                    const contenant = TYPES_CONTENANTS.find(c => c.id === conditionnement.type_contenant);
                    if (contenant) {
                        biere.volume_total_conditionne -= conditionnement.quantite * contenant.volume;
                    }
                }

                await updateItem('bieres', biere);
            }

            // Recharger les données et afficher
            allConditionnements = await loadData('conditionnements').catch(() => []);
            afficherConditionnements();
        }
    } catch (error) {
        console.error("Erreur suppression conditionnement:", error);
        alert("Erreur lors de la suppression");
    }
}

// 11. Afficher l'historique de conditionnement pour une bière
async function afficherHistoriqueConditionnement(idBiere) {
    try {
        const biere = allBieres.find(b => b.id === idBiere);
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

// 12. Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données initiales
    chargerDonneesInitiales();

    // Configuration des inputs
    const abvInput = document.getElementById('abv-final');
    const quantiteInput = document.getElementById('quantite-contenant');
    const dateInput = document.getElementById('date-conditionnement');

    if (abvInput) abvInput.step = '0.1';
    if (quantiteInput) quantiteInput.step = '1';
    if (dateInput) dateInput.valueAsDate = new Date();
});
