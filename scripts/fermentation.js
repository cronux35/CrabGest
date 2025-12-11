// fermentation.js - Gestion complète du suivi de fermentation avec échelle de temps détaillée
let fermentationChart = null;

// Charger les bières dans le sélecteur de fermentation
async function chargerSelecteurBieresFermentation() {
    try {
        const bieres = await loadData('bieres').catch(() => []);

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
    // Calcul des limites pour la gravité
    let minGravite = 0.800;
    let maxGravite = 1.150;

    if (densites.length > 0) {
        const graviteValues = densites.map(d => d.valeur);
        const minGraviteData = Math.min(...graviteValues);
        const maxGraviteData = Math.max(...graviteValues);

        // Ajouter une marge de 5% ou 0.010 (le plus grand des deux)
        const margeGravite = Math.max(0.010, 0.05 * (maxGraviteData - minGraviteData));

        minGravite = Math.max(0.800, minGraviteData - margeGravite);
        maxGravite = Math.min(1.150, maxGraviteData + margeGravite);
    }

    // Calcul des limites pour la température
    let minTemperature = 0;
    let maxTemperature = 40;

    if (temperatures.length > 0) {
        const tempValues = temperatures.map(t => t.valeur);
        const minTempData = Math.min(...tempValues);
        const maxTempData = Math.max(...tempValues);

        // Ajouter une marge de 10% ou 2°C (le plus grand des deux)
        const margeTemp = Math.max(2, 0.1 * (maxTempData - minTempData));

        minTemperature = Math.max(0, minTempData - margeTemp);
        maxTemperature = Math.min(40, maxTempData + margeTemp);
    }

    return {
        gravite: { min: minGravite, max: maxGravite },
        temperature: { min: minTemperature, max: maxTemperature }
    };
}

// Formater les dates pour l'axe X
function formaterDatesPourAxeX(dates) {
    if (dates.length === 0) return [];

    // Trouver la durée totale
    const datesTriées = [...dates].sort((a, b) => new Date(a) - new Date(b));
    const debut = new Date(datesTriées[0]);
    const fin = new Date(datesTriées[datesTriées.length - 1]);
    const duréeTotaleHeures = (fin - debut) / (1000 * 60 * 60);

    // Déterminer le format en fonction de la durée
    let formatDate;
    if (duréeTotaleHeures <= 24) {
        // Moins d'un jour: afficher heures:minutes
        formatDate = date => {
            const d = new Date(date);
            return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        };
    } else if (duréeTotaleHeures <= 24 * 7) {
        // Moins d'une semaine: afficher jour et heure
        formatDate = date => {
            const d = new Date(date);
            return d.toLocaleString([], {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
    } else {
        // Plus d'une semaine: afficher date complète
        formatDate = date => {
            const d = new Date(date);
            return d.toLocaleString([], {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
    }

    return datesTriées.map(date => formatDate(date));
}

// Générer des ticks de temps réguliers pour l'axe X
function genererTicksTemps(dates) {
    if (dates.length === 0) return [];

    const datesTriées = [...dates].sort((a, b) => new Date(a) - new Date(b));
    const debut = new Date(datesTriées[0]);
    const fin = new Date(datesTriées[datesTriées.length - 1]);
    const duréeTotaleMs = fin - debut;

    // Déterminer l'intervalle en fonction de la durée totale
    let intervalleMs;
    if (duréeTotaleMs <= 3600000) { // 1 heure
        intervalleMs = 900000; // 15 minutes
    } else if (duréeTotaleMs <= 86400000) { // 1 jour
        intervalleMs = 3600000; // 1 heure
    } else if (duréeTotaleMs <= 604800000) { // 1 semaine
        intervalleMs = 21600000; // 6 heures
    } else if (duréeTotaleMs <= 2592000000) { // 1 mois
        intervalleMs = 86400000; // 1 jour
    } else {
        intervalleMs = 604800000; // 1 semaine
    }

    // Générer les ticks
    const ticks = [];
    let current = new Date(debut);

    while (current <= fin) {
        ticks.push(new Date(current));
        current = new Date(current.getTime() + intervalleMs);
    }

    return ticks;
}

// Afficher le suivi de fermentation pour une bière sélectionnée
async function afficherSuiviFermentation(idBiere) {
    try {
        const fermentations = await loadData('fermentations').catch(() => []);
        const biere = await loadItemById('bieres', idBiere).catch(() => null);

        const data = fermentations.filter(f => f.id_biere == idBiere);

        // Afficher les actions de fermentation dans un tableau
        const actionsTable = document.getElementById('fermentation-actions-table');
        if (actionsTable) {
            const tbody = actionsTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = data.map(action => `
                    <tr>
                        <td>${new Date(action.date).toLocaleString()}</td>
                        <td>${action.type === 'densite' ? 'Gravité' : action.type}</td>
                        <td>${action.valeur}</td>
                        <td>
                            <button class="action-btn delete-btn" onclick="supprimerActionFermentation(${action.id})" title="Supprimer">
                                <i class="material-icons">delete</i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Mettre à jour le graphique
        afficherGraphiqueFermentation(data, biere ? biere.nom : 'Bière inconnue');
    } catch (error) {
        console.error("Erreur lors de l'affichage du suivi de fermentation:", error);
    }
}

// Afficher le graphique de fermentation avec échelle de temps détaillée
function afficherGraphiqueFermentation(data, nomBiere) {
    // Filtrer et trier les données
    const densites = data.filter(a => a.type === 'densite').sort((a, b) => new Date(a.date) - new Date(b.date));
    const temperatures = data.filter(a => a.type === 'temperature').sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculer les limites dynamiques
    const limites = calculerLimitesEchelles(densites, temperatures);

    // Préparer les dates pour l'axe X
    const toutesLesDates = [...densites, ...temperatures].map(a => new Date(a.date));
    const datesTriées = [...toutesLesDates].sort((a, b) => a - b);
    const labels = formaterDatesPourAxeX(datesTriées);
    const ticks = genererTicksTemps(datesTriées);

    const ctx = document.getElementById('fermentationChart');
    if (ctx) {
        // Détruire le graphique existant s'il y en a un
        if (fermentationChart) {
            fermentationChart.destroy();
            fermentationChart = null;
        }

        // Créer un nouveau graphique avec échelle de temps détaillée
        fermentationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gravité (SG)',
                        data: densites.map(d => d.valeur),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1,
                        fill: true,
                        yAxisID: 'y',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Température (°C)',
                        data: temperatures.map(t => t.valeur),
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.1,
                        fill: true,
                        yAxisID: 'y1',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Suivi de fermentation - ${nomBiere}`,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.dataset.label === 'Gravité (SG)' ?
                                        context.parsed.y.toFixed(3) :
                                        context.parsed.y.toFixed(1);
                                }
                                return label;
                            },
                            title: function(tooltipItems) {
                                return new Date(tooltipItems[0].label).toLocaleString();
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
                            color: 'rgb(75, 192, 192)'
                        },
                        min: limites.gravite.min,
                        max: limites.gravite.max,
                        ticks: {
                            stepSize: 0.010,
                            callback: function(value) {
                                return value.toFixed(3);
                            }
                        },
                        grid: {
                            drawOnChartArea: true
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Température (°C)',
                            color: 'rgb(255, 99, 132)'
                        },
                        min: limites.temperature.min,
                        max: limites.temperature.max,
                        ticks: {
                            stepSize: 2,
                            callback: function(value) {
                                return value.toFixed(1) + '°C';
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'HH:mm',
                                day: 'ddd DD MMM',
                                week: 'DD MMM',
                                month: 'MMM YYYY'
                            },
                            tooltipFormat: 'DD MMM YYYY HH:mm'
                        },
                        title: {
                            display: true,
                            text: 'Temps'
                        },
                        ticks: {
                            source: 'data',
                            autoSkip: true,
                            maxTicksLimit: 10,
                            maxRotation: 45,
                            minRotation: 45
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
            id_biere: parseInt(idBiere),
            date: date || new Date().toISOString(),
            type: type,
            valeur: valeur
        };

        await addItem('fermentations', nouvelleAction);

        // Réinitialiser le champ de valeur
        document.getElementById('valeur-action').value = '';

        // Rafraîchir l'affichage
        afficherSuiviFermentation(idBiere);

        alert(`Action de ${type === 'densite' ? 'gravité' : type} enregistrée avec succès.`);
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'action de fermentation:", error);
        alert("Une erreur est survenue lors de l'enregistrement.");
    }
}

// Supprimer une action de fermentation
async function supprimerActionFermentation(id) {
    try {
        const action = await loadItemById('fermentations', id);
        if (!action) return;

        if (confirm(`Voulez-vous vraiment supprimer cette action de ${action.type === 'densite' ? 'gravité' : action.type} ?`)) {
            await deleteItem('fermentations', id);
            afficherSuiviFermentation(action.id_biere);
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de l'action de fermentation:", error);
        alert("Une erreur est survenue lors de la suppression.");
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
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
