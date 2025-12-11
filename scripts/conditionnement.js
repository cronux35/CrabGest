// conditionnement.js - Version complète avec modale et listbox
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
        chargerListBoxBieres();

        // Créer la ligne de filtres
        ajouterLigneFiltres();

        // Afficher tous les conditionnements
        afficherTousConditionnements();
    } catch (error) {
        console.error("Erreur chargement initial:", error);
    }
}

// 4. Charger les bières dans le sélecteur de conditionnement
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

// 5. Charger les bières dans la listbox
function chargerListBoxBieres() {
    const listbox = document.getElementById('listbox-bieres');
    if (listbox) {
        listbox.innerHTML = '';
        allBieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            listbox.appendChild(option);
        });
    }
}

// 6. Charger les contenants dans le sélecteur
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

// 7. Ajouter une ligne de filtres
function ajouterLigneFiltres() {
    const table = document.getElementById('table-conditionnements');
    if (!table) return;

    const thead = table.querySelector('thead');
    if (!thead) return;

    // Créer une nouvelle ligne pour les filtres
    const filterRow = document.createElement('tr');
    filterRow.className = 'filter-row';

    // 1. Numéro de lot
    const tdLot = document.createElement('td');
    const inputLot = document.createElement('input');
    inputLot.type = 'text';
    inputLot.placeholder = 'Filtrer numéro de lot...';
    inputLot.className = 'filter-input';
    inputLot.dataset.column = '0';
    inputLot.addEventListener('input', () => {
        currentFilters[0] = inputLot.value.toLowerCase();
        afficherTousConditionnements();
    });
    tdLot.appendChild(inputLot);
    filterRow.appendChild(tdLot);

    // 2. Bière
    const tdBiere = document.createElement('td');
    const selectBiere = document.createElement('select');
    selectBiere.className = 'filter-select';
    selectBiere.dataset.column = '1';
    const defaultOptionBiere = document.createElement('option');
    defaultOptionBiere.value = '';
    defaultOptionBiere.textContent = 'Tous';
    selectBiere.appendChild(defaultOptionBiere);

    allBieres.forEach(biere => {
        const option = document.createElement('option');
        option.value = biere.nom;
        option.textContent = biere.nom;
        selectBiere.appendChild(option);
    });

    selectBiere.addEventListener('change', () => {
        currentFilters[1] = selectBiere.value;
        afficherTousConditionnements();
    });
    tdBiere.appendChild(selectBiere);
    filterRow.appendChild(tdBiere);

    // 3. ABV
    const tdAbv = document.createElement('td');
    const selectAbv = document.createElement('select');
    selectAbv.className = 'filter-select';
    selectAbv.dataset.column = '2';
    const defaultOptionAbv = document.createElement('option');
    defaultOptionAbv.value = '';
    defaultOptionAbv.textContent = 'Tous';
    selectAbv.appendChild(defaultOptionAbv);

    const abvUniques = [...new Set(allConditionnements.map(c => c.abv))].sort((a, b) => a - b);
    abvUniques.forEach(abv => {
        const option = document.createElement('option');
        option.value = abv;
        option.textContent = abv + '°';
        selectAbv.appendChild(option);
    });

    selectAbv.addEventListener('change', () => {
        currentFilters[2] = selectAbv.value;
        afficherTousConditionnements();
    });
    tdAbv.appendChild(selectAbv);
    filterRow.appendChild(tdAbv);

    // 4. Contenant
    const tdContenant = document.createElement('td');
    const selectContenant = document.createElement('select');
    selectContenant.className = 'filter-select';
    selectContenant.dataset.column = '3';
    const defaultOptionContenant = document.createElement('option');
    defaultOptionContenant.value = '';
    defaultOptionContenant.textContent = 'Tous';
    selectContenant.appendChild(defaultOptionContenant);

    TYPES_CONTENANTS.forEach(contenant => {
        const option = document.createElement('option');
        option.value = contenant.nom;
        option.textContent = contenant.nom;
        selectContenant.appendChild(option);
    });

    selectContenant.addEventListener('change', () => {
        currentFilters[3] = selectContenant.value;
        afficherTousConditionnements();
    });
    tdContenant.appendChild(selectContenant);
    filterRow.appendChild(tdContenant);

    // 5. Quantité
    const tdQuantite = document.createElement('td');
    const inputQuantite = document.createElement('input');
    inputQuantite.type = 'number';
    inputQuantite.placeholder = 'Filtrer quantité...';
    inputQuantite.className = 'filter-input';
    inputQuantite.dataset.column = '4';
    inputQuantite.addEventListener('input', () => {
        currentFilters[4] = inputQuantite.value;
        afficherTousConditionnements();
    });
    tdQuantite.appendChild(inputQuantite);
    filterRow.appendChild(tdQuantite);

    // 6. Volume conditionné
    const tdVolume = document.createElement('td');
    const inputVolume = document.createElement('input');
    inputVolume.type = 'number';
    inputVolume.placeholder = 'Filtrer volume...';
    inputVolume.className = 'filter-input';
    inputVolume.dataset.column = '5';
    inputVolume.addEventListener('input', () => {
        currentFilters[5] = inputVolume.value;
        afficherTousConditionnements();
    });
    tdVolume.appendChild(inputVolume);
    filterRow.appendChild(tdVolume);

    // 7. Date
    const tdDate = document.createElement('td');
    const inputDate = document.createElement('input');
    inputDate.type = 'date';
    inputDate.className = 'filter-input';
    inputDate.dataset.column = '6';
    inputDate.addEventListener('input', () => {
        currentFilters[6] = inputDate.value;
        afficherTousConditionnements();
    });
    tdDate.appendChild(inputDate);
    filterRow.appendChild(tdDate);

    // 8. Cellule vide pour les actions
    const tdActions = document.createElement('td');
    filterRow.appendChild(tdActions);

    thead.appendChild(filterRow);

    // Ajouter des indicateurs de tri aux en-têtes
    const headers = document.querySelectorAll('#table-conditionnements thead tr:first-child th');
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
            afficherTousConditionnements();
        });
    });
}

// 8. Appliquer les filtres et le tri
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

// 9. Afficher tous les conditionnements
async function afficherTousConditionnements() {
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
            const headers = document.querySelectorAll('#table-conditionnements thead tr:first-child th');
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

// 10. Afficher les détails d'un conditionnement
async function afficherDetailsConditionnement(id) {
    try {
        const conditionnement = await loadItemById('conditionnements', id);
        if (!conditionnement) {
            alert("Conditionnement non trouvé");
            return;
        }

        const biere = allBieres.find(b => b.id === conditionnement.id_biere);
        const contenant = TYPES_CONTENANTS.find(c => c.id === conditionnement.type_contenant);
        const volumeTotal = conditionnement.quantite * (contenant ? contenant.volume : 0);

        let message = `Détails du conditionnement:\n\n`;
        message += `Numéro de lot: ${conditionnement.numero_lot || 'N/A'}\n`;
        message += `Bière: ${biere ? biere.nom : 'Inconnu'}\n`;
        message += `ABV: ${conditionnement.abv}°\n`;
        message += `Contenant: ${contenant ? contenant.nom : conditionnement.type_contenant}\n`;
        message += `Quantité: ${conditionnement.quantite}\n`;
        message += `Volume conditionné: ${volumeTotal.toFixed(2)}L\n`;
        message += `Date: ${new Date(conditionnement.date).toLocaleString()}\n`;

        alert(message);
    } catch (error) {
        console.error("Erreur affichage détails:", error);
        alert("Erreur lors de l'affichage des détails");
    }
}

// 11. Afficher l'historique d'une bière spécifique
async function afficherHistoriqueBiere(idBiere) {
    try {
        const biere = allBieres.find(b => b.id === idBiere);
        if (!biere) {
            alert("Bière non trouvée");
            return;
        }

        // Filtrer les conditionnements pour cette bière
        currentFilters[1] = biere.nom;
        afficherTousConditionnements();

        // Afficher aussi l'historique complet dans une modale
        ouvrirModaleHistoriqueBiere(biere);
    } catch (error) {
        console.error("Erreur affichage historique bière:", error);
        alert("Erreur lors de l'affichage de l'historique");
    }
}

// 12. Ouvrir la modale d'historique d'une bière
function ouvrirModaleHistoriqueBiere(biere) {
    const modal = document.getElementById('historique-biere-modal');
    if (!modal) return;

    // Remplir les données de la modale
    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');

    modalTitle.textContent = `Historique complet - ${biere.nom}`;

    let content = `<p>Volume total conditionné: <strong>${biere.volume_total_conditionne ? biere.volume_total_conditionne.toFixed(2) : 0}L</strong></p>`;

    if (!biere.historique_conditionnement || biere.historique_conditionnement.length === 0) {
        content += "<p>Aucun conditionnement enregistré pour cette bière.</p>";
    } else {
        content += `<table class="table table-sm">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Numéro de lot</th>
                    <th>Contenant</th>
                    <th>Quantité</th>
                    <th>Volume (L)</th>
                    <th>ABV</th>
                </tr>
            </thead>
            <tbody>`;

        const historique = [...biere.historique_conditionnement].sort((a, b) => new Date(b.date) - new Date(a.date));
        historique.forEach(item => {
            content += `
                <tr>
                    <td>${new Date(item.date).toLocaleDateString()}</td>
                    <td>${item.numero_lot || 'N/A'}</td>
                    <td>${item.contenant_nom}</td>
                    <td>${item.quantite}</td>
                    <td>${item.volume_total.toFixed(2)}</td>
                    <td>${item.abv}°</td>
                </tr>`;
        });

        content += `</tbody></table>`;
    }

    modalBody.innerHTML = content;

    // Afficher la modale
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// 13. Ouvrir la modale d'ajout de conditionnement
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
    const selectBiere = document.getElementById('modal-select-biere');
    if (selectBiere) {
        selectBiere.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
        allBieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            selectBiere.appendChild(option);
        });
    }

    const selectContenant = document.getElementById('modal-type-contenant');
    if (selectContenant) {
        selectContenant.innerHTML = '';
        TYPES_CONTENANTS.forEach(contenant => {
            const option = document.createElement('option');
            option.value = contenant.id;
            option.textContent = contenant.nom;
            selectContenant.appendChild(option);
        });
    }

    // Afficher la modale
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

// 14. Ajouter un conditionnement depuis la modale
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
        afficherTousConditionnements();

        // Fermer la modale
        const modal = document.getElementById('ajout-conditionnement-modal');
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();

        alert(`Conditionnement enregistré:\n`
            + `Numéro de lot: ${numeroLot}\n`
            + `${quantite} x ${contenant.nom} (${volumeTotalContenants.toFixed(2)}L)`);
    } catch (error) {
        console.error("Erreur ajout conditionnement:", error);
        alert("Erreur lors de l'enregistrement");
    }
}

// 15. Supprimer un conditionnement
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
            afficherTousConditionnements();
        }
    } catch (error) {
        console.error("Erreur suppression conditionnement:", error);
        alert("Erreur lors de la suppression");
    }
}

// 16. Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données initiales
    chargerDonneesInitiales();

    // Configuration des inputs du formulaire principal
    const abvInput = document.getElementById('abv-final');
    const quantiteInput = document.getElementById('quantite-contenant');
    const dateInput = document.getElementById('date-conditionnement');

    if (abvInput) abvInput.step = '0.1';
    if (quantiteInput) quantiteInput.step = '1';
    if (dateInput) dateInput.valueAsDate = new Date();

    // Initialiser les filtres
    currentFilters = {};
});
