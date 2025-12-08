function afficherSuiviFermentation(idBiere) {
    const fermentations = JSON.parse(localStorage.getItem('fermentations'));
    const data = fermentations.filter(f => f.id_biere == idBiere);

    // Afficher les actions
    const actionsTable = document.createElement('table');
    actionsTable.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Valeur</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(action => `
                <tr>
                    <td>${new Date(action.date).toLocaleString()}</td>
                    <td>${action.type}</td>
                    <td>${action.valeur}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    document.querySelector('#fermentation .card').appendChild(actionsTable);

    // Graphique
    const densites = data.filter(a => a.type === 'densite');
    const temperatures = data.filter(a => a.type === 'temperature');
    const ctx = document.getElementById('fermentationChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: densites.map(d => new Date(d.date).toLocaleTimeString()),
            datasets: [
                {
                    label: 'Densité (SG)',
                    data: densites.map(d => d.valeur),
                    borderColor: 'rgb(75, 192, 192)',
                },
                {
                    label: 'Température (°C)',
                    data: temperatures.map(t => t.valeur),
                    borderColor: 'rgb(255, 99, 132)',
                }
            ]
        }
    });
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
