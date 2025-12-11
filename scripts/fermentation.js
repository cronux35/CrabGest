// fermentation.js - Gestion complète du suivi de fermentation

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
                        <td>${action.type}</td>
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

// Afficher le graphique de fermentation
function afficherGraphiqueFermentation(data, nomBiere) {
    const densites = data.filter(a => a.type === 'densite').sort((a, b) => new Date(a.date) - new Date(b.date));
    const temperatures = data.filter(a => a.type === 'temperature').sort((a, b) => new Date(a.date) - new Date(b.date));

    const ctx = document.getElementById('fermentationChart');
    if (ctx) {
        // Détruire le graphique existant s'il y en a un
        if (ctx.chart) {
            ctx.chart.destroy();
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: densites.map(d => new Date(d.date).toLocaleTimeString()),
                datasets: [
                    {
                        label: 'Densité (SG)',
                        data: densites.map(d => d.valeur),
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Température (°C)',
                        data: temperatures.map(t => t.valeur),
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
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
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
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

    try {
        const nouvelleAction = {
            id_biere: parseInt(idBiere),
            date: date || new Date().toISOString(),
            type: type,
            valeur: valeur
        };

        await addItem('fermentations', nouvelleAction);
        afficherSuiviFermentation(idBiere);
        document.getElementById('valeur-action').value = '';

        alert(`Action de ${type} enregistrée avec succès.`);
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

        if (confirm(`Voulez-vous vraiment supprimer cette action de ${action.type} ?`)) {
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
            }
        });
    }
});

