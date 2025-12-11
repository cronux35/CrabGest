// fermentation.js - Gestion complète du suivi de fermentation avec double échelle
let fermentationChart = null; // Variable globale pour stocker l'instance du graphique

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

// Afficher le graphique de fermentation avec double échelle
function afficherGraphiqueFermentation(data, nomBiere) {
    // Filtrer et trier les données
    const densites = data.filter(a => a.type === 'densite').sort((a, b) => new Date(a.date) - new Date(b.date));
    const temperatures = data.filter(a => a.type === 'temperature').sort((a, b) => new Date(a.date) - new Date(b.date));

    const ctx = document.getElementById('fermentationChart');
    if (ctx) {
        // Détruire le graphique existant s'il y en a un
        if (fermentationChart) {
            fermentationChart.destroy();
            fermentationChart = null;
        }

        // Créer un nouveau graphique avec double échelle
        fermentationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: densites.map(d => new Date(d.date).toLocaleString()),
                datasets: [
                    {
                        label: 'Gravité (SG)',
                        data: densites.map(d => d.valeur),
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1,
                        fill: true,
                        yAxisID: 'y', // Échelle de gauche pour la gravité
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
                        yAxisID: 'y1', // Échelle de droite pour la température
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
                        min: 0.800,
                        max: 1.150,
                        ticks: {
                            stepSize: 0.050,
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
                        min: 0,
                        max: 40,
                        ticks: {
                            stepSize: 5
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date et heure'
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

    // Validation spécifique pour la gravité
    if (type === 'densite' && (valeur < 0.800 || valeur > 1.150)) {
        alert("La gravité doit être comprise entre 0.800 et 1.150.");
        return;
    }

    // Validation spécifique pour la température
    if (type === 'temperature' && (valeur < 0 || valeur > 40)) {
        alert("La température doit être comprise entre 0°C et 40°C.");
        return;
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
        valeurActionInput.step = 'any'; // Permet les valeurs décimales

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
