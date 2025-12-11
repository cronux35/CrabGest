// fermentation.js - Version complète et corrigée
let fermentationChart = null;

// 1. Charger les bières dans le sélecteur
async function chargerSelecteurBieresFermentation() {
    try {
        const bieres = await loadData('bieres').catch(() => []);
        const select = document.getElementById('select-biere-fermentation');
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

// 2. Calculer les limites des échelles
function calculerLimitesEchelles(densites, temperatures) {
    const limites = {
        gravite: { min: 0.800, max: 1.150 },
        temperature: { min: 0, max: 40 }
    };

    if (densites.length > 0) {
        const values = densites.map(d => d.valeur);
        const marge = Math.max(0.010, 0.05 * (Math.max(...values) - Math.min(...values)));
        limites.gravite.min = Math.max(0.800, Math.min(...values) - marge);
        limites.gravite.max = Math.min(1.150, Math.max(...values) + marge);
    }

    if (temperatures.length > 0) {
        const values = temperatures.map(t => t.valeur);
        const marge = Math.max(2, 0.1 * (Math.max(...values) - Math.min(...values)));
        limites.temperature.min = Math.max(0, Math.min(...values) - marge);
        limites.temperature.max = Math.min(40, Math.max(...values) + marge);
    }

    return limites;
}

// 3. Préparer les données pour le graphique
function preparerDonneesGraphique(data) {
    const densites = data.filter(a => a.type === 'densite');
    const temperatures = data.filter(a => a.type === 'temperature');

    // Créer une liste de toutes les dates uniques
    const toutesLesDates = [...new Set([
        ...densites.map(d => new Date(d.date).getTime()),
        ...temperatures.map(t => new Date(t.date).getTime())
    ])].sort((a, b) => a - b);

    return {
        dates: toutesLesDates,
        densites: densites.map(d => ({
            date: new Date(d.date).getTime(),
            valeur: d.valeur
        })),
        temperatures: temperatures.map(t => ({
            date: new Date(t.date).getTime(),
            valeur: t.valeur
        }))
    };
}

// 4. Afficher le graphique (version corrigée)
function afficherGraphiqueFermentation(preparedData, nomBiere) {
    const ctx = document.getElementById('fermentationChart');
    if (!ctx) return;

    // Détruire l'ancien graphique s'il existe
    if (fermentationChart) {
        fermentationChart.destroy();
    }

    // Calculer les limites des échelles
    const limites = calculerLimitesEchelles(
        preparedData.densites,
        preparedData.temperatures
    );

    // Créer le nouveau graphique
    fermentationChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Gravité (SG)',
                    data: preparedData.densites,
                    parsing: {
                        xAxisKey: 'date',
                        yAxisKey: 'valeur'
                    },
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    yAxisID: 'y',
                    pointRadius: 4
                },
                {
                    label: 'Température (°C)',
                    data: preparedData.temperatures,
                    parsing: {
                        xAxisKey: 'date',
                        yAxisKey: 'valeur'
                    },
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                    yAxisID: 'y1',
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Fermentation - ${nomBiere}`,
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(context.dataset.label.includes('Gravité') ? 3 : 1)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Gravité (SG)'
                    },
                    min: limites.gravite.min,
                    max: limites.gravite.max,
                    ticks: {
                        stepSize: 0.010,
                        callback: (value) => value.toFixed(3)
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Température (°C)'
                    },
                    min: limites.temperature.min,
                    max: limites.temperature.max,
                    ticks: {
                        stepSize: 2,
                        callback: (value) => `${value.toFixed(1)}°C`
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
                            week: 'DD MMM'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Temps'
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
}

// 5. Afficher le suivi complet
async function afficherSuiviFermentation(idBiere) {
    try {
        const data = await loadData('fermentations').catch(() => []);
        const biere = await loadItemById('bieres', idBiere).catch(() => null);
        const fermentationData = data.filter(f => f.id_biere == idBiere);

        // Mettre à jour le tableau des actions
        const table = document.getElementById('fermentation-actions-table');
        if (table) {
            const tbody = table.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = fermentationData.map(action => `
                    <tr>
                        <td>${new Date(action.date).toLocaleString()}</td>
                        <td>${action.type === 'densite' ? 'Gravité' : action.type}</td>
                        <td>${action.valeur}</td>
                        <td>
                            <button class="action-btn delete-btn"
                                   onclick="supprimerActionFermentation(${action.id})"
                                   title="Supprimer">
                                <i class="material-icons">delete</i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Préparer et afficher le graphique
        const preparedData = preparerDonneesGraphique(fermentationData);
        afficherGraphiqueFermentation(preparedData, biere ? biere.nom : 'Bière inconnue');
    } catch (error) {
        console.error("Erreur affichage fermentation:", error);
    }
}

// 6. Ajouter une action
async function ajouterActionFermentation() {
    const idBiere = document.getElementById('select-biere-fermentation').value;
    const date = document.getElementById('date-action').value;
    const type = document.getElementById('type-action').value;
    const valeur = parseFloat(document.getElementById('valeur-action').value);

    if (!idBiere || !type || isNaN(valeur)) {
        alert("Veuillez sélectionner une bière, un type et une valeur valide");
        return;
    }

    // Validations
    if (type === 'densite' && (valeur < 0.800 || valeur > 1.150)) {
        alert("La gravité doit être entre 0.800 et 1.150");
        return;
    }
    if (type === 'temperature' && (valeur < 0 || valeur > 40)) {
        alert("La température doit être entre 0°C et 40°C");
        return;
    }

    try {
        await addItem('fermentations', {
            id_biere: parseInt(idBiere),
            date: date || new Date().toISOString(),
            type: type,
            valeur: valeur
        });

        document.getElementById('valeur-action').value = '';
        afficherSuiviFermentation(idBiere);
    } catch (error) {
        console.error("Erreur ajout action:", error);
        alert("Erreur lors de l'enregistrement");
    }
}

// 7. Supprimer une action
async function supprimerActionFermentation(id) {
    try {
        const action = await loadItemById('fermentations', id);
        if (!action) return;

        if (confirm(`Supprimer cette action de ${action.type} ?`)) {
            await deleteItem('fermentations', id);
            afficherSuiviFermentation(action.id_biere);
        }
    } catch (error) {
        console.error("Erreur suppression:", error);
        alert("Erreur lors de la suppression");
    }
}

// 8. Initialisation
document.addEventListener('DOMContentLoaded', function() {
    chargerSelecteurBieresFermentation();

    const select = document.getElementById('select-biere-fermentation');
    if (select) {
        select.addEventListener('change', function() {
            if (this.value) {
                afficherSuiviFermentation(this.value);
            } else if (fermentationChart) {
                fermentationChart.destroy();
                fermentationChart = null;
            }
        });
    }

    // Configuration des inputs
    const valeurInput = document.getElementById('valeur-action');
    if (valeurInput) {
        valeurInput.step = 'any';
        const typeSelect = document.getElementById('type-action');
        if (typeSelect) {
            typeSelect.addEventListener('change', function() {
                const type = this.value;
                if (type === 'densite') {
                    valeurInput.placeholder = 'Ex: 1.050';
                    valeurInput.step = '0.001';
                } else if (type === 'temperature') {
                    valeurInput.placeholder = 'Ex: 20.0';
                    valeurInput.step = '0.1';
                } else {
                    valeurInput.placeholder = 'Valeur';
                    valeurInput.step = 'any';
                }
            });
        }
    }
});
