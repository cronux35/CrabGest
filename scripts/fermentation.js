// fermentation.js - Version simplifiée et corrigée
let fermentationChart = null;

// 1. Charger les bières
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

// 2. Afficher le suivi de fermentation
async function afficherSuiviFermentation(idBiere) {
    try {
        const data = await loadData('fermentations').catch(() => []);
        const biere = await loadItemById('bieres', idBiere).catch(() => null);
        const fermentationData = data.filter(f => f.id_biere == idBiere);

        // Mettre à jour le tableau
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
                                   onclick="supprimerActionFermentation(${action.id})">
                                <i class="material-icons">delete</i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Préparer les données pour le graphique
        const densites = fermentationData
            .filter(a => a.type === 'densite')
            .map(d => ({ x: new Date(d.date), y: d.valeur }));

        const temperatures = fermentationData
            .filter(a => a.type === 'temperature')
            .map(t => ({ x: new Date(t.date), y: t.valeur }));

        afficherGraphiqueFermentation(densites, temperatures, biere ? biere.nom : 'Bière inconnue');
    } catch (error) {
        console.error("Erreur affichage fermentation:", error);
    }
}

// 3. Afficher le graphique (version simplifiée)
function afficherGraphiqueFermentation(densites, temperatures, nomBiere) {
    const ctx = document.getElementById('fermentationChart');
    if (!ctx) {
        console.error("Élément canvas non trouvé");
        return;
    }

    // Détruire l'ancien graphique
    if (fermentationChart) {
        fermentationChart.destroy();
    }

    // Créer le nouveau graphique
    fermentationChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Gravité (SG)',
                    data: densites,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    yAxisID: 'y',
                    pointRadius: 4
                },
                {
                    label: 'Température (°C)',
                    data: temperatures,
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
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Gravité (SG)' },
                    min: 0.800,
                    max: 1.150,
                    ticks: { stepSize: 0.010 }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Température (°C)' },
                    min: 0,
                    max: 40,
                    ticks: { stepSize: 2 },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'ddd DD MMM'
                        }
                    },
                    title: { display: true, text: 'Temps' }
                }
            }
        }
    });
}

// 4. Ajouter une action
async function ajouterActionFermentation() {
    const idBiere = document.getElementById('select-biere-fermentation').value;
    const date = document.getElementById('date-action').value;
    const type = document.getElementById('type-action').value;
    const valeur = parseFloat(document.getElementById('valeur-action').value);

    if (!idBiere || !type || isNaN(valeur)) {
        alert("Veuillez sélectionner une bière, un type et une valeur valide");
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

// 5. Supprimer une action
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

// 6. Initialisation
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
