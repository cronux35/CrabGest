function afficherSuiviFermentation(idBiere) {
    const fermentations = JSON.parse(localStorage.getItem('fermentations'));
    const data = fermentations.filter(f => f.id_biere == idBiere);

    // Graphique
    const densites = data.filter(a => a.type === 'densite');
    const temperatures = data.filter(a => a.type === 'temperature');
    const ctx = document.getElementById('fermentationChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: densites.map(d => new Date(d.date).toLocaleTimeString()),
                datasets: [
                    {
                        label: 'Densité (SG)',
                        data: densites.map(d => d.valeur),
                        borderColor: 'rgb(255, 215, 0)',
                        tension: 0.1
                    },
                    {
                        label: 'Température (°C)',
                        data: temperatures.map(t => t.valeur),
                        borderColor: 'rgb(255, 100, 0)',
                        tension: 0.1
                    }
                ]
            }
        });
    }
}

function ajouterActionFermentation() {
    const idBiere = document.getElementById('select-biere-fermentation').value;
    const type = document.getElementById('type-action').value;
    const valeur = parseFloat(document.getElementById('valeur-action').value);
    const date = document.getElementById('date-action').value || new Date().toISOString();

    if (!idBiere || isNaN(valeur)) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const fermentations = JSON.parse(localStorage.getItem('fermentations'));
    fermentations.push({ id_biere: parseInt(idBiere), type, valeur, date });
    localStorage.setItem('fermentations', JSON.stringify(fermentations));

    alert(`Action "${type}" ajoutée.`);
    afficherSuiviFermentation(idBiere);
}
