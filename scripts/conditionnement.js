function ajouterConditionnement() {
    const idBiere = document.getElementById('select-biere-conditionnement').value;
    const volume = parseFloat(document.getElementById('volume-conditionne').value);
    const abv = parseFloat(document.getElementById('abv-final').value);
    const typeContenant = document.getElementById('type-contenant').value;
    const quantite = parseInt(document.getElementById('quantite-contenant').value);

    if (!idBiere || isNaN(volume) || isNaN(abv) || isNaN(quantite)) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const recettes = JSON.parse(localStorage.getItem('recettes'));
    const biere = recettes.find(b => b.id == idBiere);
    const conditionnements = JSON.parse(localStorage.getItem('conditionnements'));
    const id = conditionnements.length > 0 ? Math.max(...conditionnements.map(c => c.id)) + 1 : 1;
    conditionnements.push({
        id,
        id_biere: parseInt(idBiere),
        nom_biere: biere.nom,
        volume_litres: volume,
        abv,
        type_contenant: typeContenant,
        quantite,
        date: new Date().toISOString()
    });
    localStorage.setItem('conditionnements', JSON.stringify(conditionnements));

    afficherConditionnements();
    alert(`Conditionnement enregistré.`);
}

function afficherConditionnements() {
    const conditionnements = JSON.parse(localStorage.getItem('conditionnements'));
    const tbody = document.querySelector('#table-conditionnements tbody');
    if (tbody) {
        tbody.innerHTML = conditionnements.map(cond =>
            `<tr>
                <td>${cond.id}</td>
                <td>${cond.nom_biere}</td>
                <td>${cond.volume_litres}L</td>
                <td>${cond.abv}°</td>
                <td>${cond.type_contenant}</td>
                <td>${cond.quantite}</td>
            </tr>`
        ).join('');
    }
}

document.addEventListener('DOMContentLoaded', afficherConditionnements);
