function ajouterRecette() {
    const nom = document.getElementById('nom-recette').value;
    const style = document.getElementById('style-recette').value;
    const degre = parseFloat(document.getElementById('degre-recette').value);
    const volume = parseFloat(document.getElementById('volume-recette').value);

    if (!nom || !style || isNaN(degre) || isNaN(volume)) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const recettes = JSON.parse(localStorage.getItem('recettes'));
    const id = recettes.length > 0 ? Math.max(...recettes.map(r => r.id)) + 1 : 1;
    recettes.push({ id, nom, style, degre_alcool: degre, volume_litres: volume, cout: 0 });
    localStorage.setItem('recettes', JSON.stringify(recettes));

    alert(`Recette "${nom}" ajoutée.`);
    document.getElementById('nom-recette').value = '';
    document.getElementById('style-recette').value = '';
    document.getElementById('degre-recette').value = '';
    document.getElementById('volume-recette').value = '';
    chargerDonnees();
}

function afficherRecettes() {
    const recettes = JSON.parse(localStorage.getItem('recettes'));
    const tbody = document.querySelector('#table-recettes tbody');
    if (tbody) {
        tbody.innerHTML = recettes.map(recette =>
            `<tr>
                <td>${recette.id}</td>
                <td>${recette.nom}</td>
                <td>${recette.style}</td>
                <td>${recette.degre_alcool}°</td>
                <td>${recette.volume_litres}L</td>
            </tr>`
        ).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    afficherRecettes();
    chargerDonnees();
});
