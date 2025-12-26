// fermentation.js - Gestion complète du suivi de fermentation avec points colorés
let fermentationChart = null;

// Couleurs par type d'action pour les points sur le graphique
const ACTION_COLORS = {
    densite: 'rgb(75, 192, 192)',       // Turquoise pour la gravité
    temperature: 'rgb(255, 99, 132)',   // Rose pour la température
    purge: 'rgb(54, 162, 235)',         // Bleu pour la purge
    pression: 'rgb(255, 206, 86)',      // Jaune pour la pression
    dry_hopping: 'rgb(153, 102, 255)',   // Violet pour le dry hopping
    autre: 'rgb(201, 203, 207)'          // Gris pour les autres types
};

// Charger les bières dans le sélecteur de fermentation
async function chargerSelecteurBieresFermentation() {
    try {
        const bieres = await window.DB.loadData('bieres').catch(() => []);

        const selectBiereFermentation = document.getElementById('select-biere-fermentation');
        if (selectBiereFermentation) {
            selectBiereFermentation.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
            bieres.forEach(biere => {
                const option = document.createElement('option');
                option.value = biere.id;
                option.textContent = biere.nom;
                selectBiereFermentation.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erreur lors du chargement des bières pour la fermentation:", error);
    }
}

// Calculer les limites dynamiques pour les échelles
function calculerLimitesEchelles(densites, temperatures) {
    let minGravite = 0.800;
    let maxGravite = 1.150;

    if (densites.length > 0) {
        const graviteValues = densites.map(d => d.valeur);
        const minGraviteData = Math.min(...graviteValues);
        const maxGraviteData = Math.max(...graviteValues);
        const margeGravite = Math.max(0.010, 0.05 * (maxGraviteData - minGraviteData));
        minGravite = Math.max(0.800, minGraviteData - margeGravite);
        maxGravite = Math.min(1.150, maxGraviteData + margeGravite);
    }

    let minTemperature = 0;
    let maxTemperature = 40;

    if (temperatures.length > 0) {
        const tempValues = temperatures.map(t => t.valeur);
        const minTempData = Math.min(...tempValues);
        const maxTempData = Math.max(...tempValues);
        const margeTemp = Math.max(2, 0.1 * (maxTempData - minTempData));
        minTemperature = Math.max(0, minTempData - margeTemp);
        maxTemperature = Math.min(40, maxTempData + margeTemp);
    }

    return {
        gravite: { min: minGravite, max: maxGravite },
        temperature: { min: minTemperature, max: maxTemperature }
    };
}

// Préparer les données pour le graphique avec points colorés
function preparerDonneesGraphique(data) {
    const types = [...new Set(data.map(a => a.type))];
    const datasets = [];

    // Extraire les dates uniques et les trier
    const dates = [...new Set(data.map(a => a.date))].sort((a, b) => new Date(a) - new Date(b));

    types.forEach(type => {
        const actions = data.filter(a => a.type === type).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (actions.length > 0) {
            // Créer un tableau de valeurs aligné avec les dates
            const values = dates.map(date => {
                const action = actions.find(a => a.date === date);
                return action ? action.valeur : null;
            });

            datasets.push({
                label: type === 'densite' ? 'Gravité (SG)' :
                       type === 'temperature' ? 'Température (°C)' :
                       type.charAt(0).toUpperCase() + type.slice(1),
                data: values,
                borderColor: ACTION_COLORS[type] || ACTION_COLORS.autre,
                backgroundColor: `${ACTION_COLORS[type] || ACTION_COLORS.autre}33`,
                tension: type === 'densite' || type === 'temperature' ? 0.3 : 0, // Lisser uniquement les courbes de densité et température
                fill: false,
                yAxisID: type === 'densite' ? 'y' : 'y1',
                pointRadius: type === 'densite' || type === 'temperature' ? 4 : 6, // Points plus gros pour les autres actions
                pointHoverRadius: type === 'densite' || type === 'temperature' ? 6 : 8,
                pointBackgroundColor: ACTION_COLORS[type] || ACTION_COLORS.autre,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                showLine: type === 'densite' || type === 'temperature' // Montrer une ligne uniquement pour densité et température
            });
        }
    });

    return { datasets, labels: dates.map(date => new Date(date).toLocaleString()) };
}

// Afficher le suivi de fermentation pour une bière sélectionnée
async function afficherSuiviFermentation(idBiere) {
    try {
        const fermentations = await window.DB.loadData('fermentations').catch(() => []);
        const biere = await window.DB.loadItemById('bieres', idBiere).catch(() => null);

        const data = fermentations.filter(f => f.id_biere == idBiere);

        // Afficher le graphique
        afficherGraphiqueFermentation(data, biere ? biere.nom : 'Bière inconnue');

        // Afficher les actions de fermentation dans un tableau
        const actionsTable = document.getElementById('fermentation-actions-table');
        if (actionsTable) {
            const tbody = actionsTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = data.map(action => `
                    <tr data-id="${action.id}">
                        <td>${new Date(action.date).toLocaleString()}</td>
                        <td>${action.type === 'densite' ? 'Gravité' :
                            action.type === 'temperature' ? 'Température' :
                            action.type.charAt(0).toUpperCase() + action.type.slice(1)}</td>
                        <td>${action.valeur}</td>
                        <td>
                            <button class="action-btn delete-btn" data-action="delete" data-id="${action.id}" title="Supprimer">
                                <i class="material-icons">delete</i>
                            </button>
                        </td>
                    </tr>
                `).join('');

                // Attacher les écouteurs pour les boutons "Supprimer"
                attachDeleteEventListeners();
            }
        }
    } catch (error) {
        console.error("Erreur lors de l'affichage du suivi de fermentation:", error);
    }
}

// Attacher les écouteurs pour les boutons "Supprimer"
function attachDeleteEventListeners() {
    const deleteButtons = document.querySelectorAll('.action-btn.delete-btn');
    deleteButtons.forEach(button => {
        button.onclick = async function() {
            const id = this.getAttribute('data-id');
            await supprimerActionFermentation(id);
        };
    });
}

// Afficher le graphique de fermentation avec points colorés et infobulles détaillées
function afficherGraphiqueFermentation(data, nomBiere) {
    if (data.length === 0) {
        const ctx = document.getElementById('fermentationChart');
        if (ctx && fermentationChart) {
            fermentationChart.destroy();
            fermentationChart = null;
        }
        return;
    }

    // Préparer les données avec points colorés
    const { datasets, labels } = preparerDonneesGraphique(data);

    // Calculer les limites dynamiques
    const densites = data.filter(a => a.type === 'densite');
    const temperatures = data.filter(a => a.type === 'temperature');
    const limites = calculerLimitesEchelles(densites, temperatures);

    const ctx = document.getElementById('fermentationChart');
    if (ctx) {
        // Détruire le graphique existant s'il y en a un
        if (fermentationChart) {
            fermentationChart.destroy();
            fermentationChart = null;
        }

        // Créer un nouveau graphique avec points colorés
        fermentationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Suivi de fermentation - ${nomBiere}`,
                        font: { size: 16 }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                if (value !== null) {
                                    return `${label}: ${label === 'Gravité (SG)' ? value.toFixed(3) : value.toFixed(1)}`;
                                }
                                return null;
                            },
                            afterLabel: function(context) {
                                const index = context.dataIndex;
                                const date = context.chart.data.labels[index];
                                return `Date: ${date}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Gravité (SG)',
                            color: ACTION_COLORS.densite
                        },
                        min: limites.gravite.min,
                        max: limites.gravite.max,
                        ticks: {
                            stepSize: 0.010,
                            callback: function(value) {
                                return value.toFixed(3);
                            }
                        },
                        grid: { drawOnChartArea: true }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Température (°C)',
                            color: ACTION_COLORS.temperature
                        },
                        min: limites.temperature.min,
                        max: limites.temperature.max,
                        ticks: {
                            stepSize: 2,
                            callback: function(value) {
                                return value.toFixed(1) + '°C';
                            }
                        },
                        grid: { drawOnChartArea: false }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date et heure'
                        },
                        ticks: {
                            autoSkip: true,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                onClick: function(evt) {
                    const points = fermentationChart.getElementsAtEventForMode(
                        evt, 'nearest', { intersect: true }, true
                    );

                    if (points.length > 0) {
                        const pointIndex = points[0].index;
                        const datasetIndex = points[0].datasetIndex;
                        const dataset = fermentationChart.data.datasets[datasetIndex];
                        const label = fermentationChart.data.labels[pointIndex];
                        const value = dataset.data[pointIndex];

                        if (value !== null) {
                            alert(`Détails de l'action:\n\n` +
                                  `Type: ${dataset.label}\n` +
                                  `Valeur: ${dataset.label === 'Gravité (SG)' ? value.toFixed(3) : value.toFixed(1)}\n` +
                                  `Date: ${label}`);
                        }
                    }
                }
            }
        });
    }
}

// Ajouter une action de fermentation
async function ajouterActionFermentation() {
    const idBiere = document.getElementById('select-biere-fermentation').value;
    const date = document.getElementById('date-action').value;
    const type = document.getElementById('type-action').value;
    const valeur = parseFloat(document.getElementById('valeur-action').value);

    if (!idBiere || !type || isNaN(valeur)) {
        alert("Veuillez sélectionner une bière, un type d'action et une valeur valide.");
        return;
    }

    // Validations des valeurs
    if (type === 'densite') {
        if (valeur < 0.800 || valeur > 1.150) {
            alert("La gravité doit être comprise entre 0.800 et 1.150.");
            return;
        }
    } else if (type === 'temperature') {
        if (valeur < 0 || valeur > 40) {
            alert("La température doit être comprise entre 0°C et 40°C.");
            return;
        }
    }

    try {
        const nouvelleAction = {
            id_biere: idBiere,
            date: date || new Date().toISOString(),
            type: type,
            valeur: valeur
        };

        await window.DB.addItem('fermentations', nouvelleAction);

        // Réinitialiser le champ de valeur
        document.getElementById('valeur-action').value = '';

        // Rafraîchir l'affichage
        afficherSuiviFermentation(idBiere);

        alert(`Action de ${type === 'densite' ? 'gravité' :
              type === 'temperature' ? 'température' :
              type.charAt(0).toUpperCase() + type.slice(1)} enregistrée avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'action de fermentation:", error);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}

// Supprimer une action de fermentation
async function supprimerActionFermentation(id) {
    try {
        const action = await window.DB.loadItemById('fermentations', id);
        if (!action) return;

        if (confirm(`Voulez-vous vraiment supprimer cette action de ${action.type === 'densite' ? 'gravité' :
                    action.type === 'temperature' ? 'température' :
                    action.type.charAt(0).toUpperCase() + action.type.slice(1)} ?`)) {
            await window.DB.deleteItem('fermentations', id);
            afficherSuiviFermentation(action.id_biere);
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de l'action de fermentation:", error);
        alert("Une erreur est survenue lors de la suppression.");
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Charger les bières dans le sélecteur
    chargerSelecteurBieresFermentation();

    // Écouteur pour le changement de bière sélectionnée
    const selectBiereFermentation = document.getElementById('select-biere-fermentation');
    if (selectBiereFermentation) {
        selectBiereFermentation.addEventListener('change', function() {
            const idBiere = this.value;
            if (idBiere) {
                afficherSuiviFermentation(idBiere);
            } else {
                // Effacer le graphique si aucune bière n'est sélectionnée
                const ctx = document.getElementById('fermentationChart');
                if (ctx && fermentationChart) {
                    fermentationChart.destroy();
                    fermentationChart = null;
                }
            }
        });
    }

    // Écouteur pour le bouton "Ajouter Action"
    const btnAjouterAction = document.getElementById('btn-ajouter-action-fermentation');
    if (btnAjouterAction) {
        btnAjouterAction.addEventListener('click', ajouterActionFermentation);
    }

    // Configuration des inputs pour les valeurs décimales
    const valeurActionInput = document.getElementById('valeur-action');
    if (valeurActionInput) {
        valeurActionInput.step = 'any';

        // Écouteur pour changer le placeholder en fonction du type sélectionné
        const typeActionSelect = document.getElementById('type-action');
        if (typeActionSelect) {
            typeActionSelect.addEventListener('change', function() {
                const type = this.value;
                if (type === 'densite') {
                    valeurActionInput.placeholder = 'Ex: 1.050';
                    valeurActionInput.step = '0.001';
                } else if (type === 'temperature') {
                    valeurActionInput.placeholder = 'Ex: 20.0';
                    valeurActionInput.step = '0.1';
                } else if (type === 'pression') {
                    valeurActionInput.placeholder = 'Ex: 1.5';
                    valeurActionInput.step = '0.1';
                } else {
                    valeurActionInput.placeholder = 'Valeur';
                    valeurActionInput.step = 'any';
                }
            });
        }
    }
});
