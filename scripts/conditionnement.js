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

    const conditionnements = JSON.parse(localStorage.getItem('conditionnements'));
    const id = conditionnements.length > 0 ? Math.max(...conditionnements.map(c => c.id)) + 1 : 1;
    conditionnements.push({ id, id_biere: parseInt(idBiere), volume_litres: volume, abv, type_contenant: typeContenant, quantite });
    localStorage.setItem('conditionnements', JSON.stringify(conditionnements));

    alert(`Conditionnement enregistré.`);
}
