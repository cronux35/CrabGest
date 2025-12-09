function ajouterRecette() {
    const nom = document.getElementById('nom-recette')?.value;
    const style = document.getElementById('style-recette')?.value;
    const degre = parseFloat(document.getElementById('degre-recette')?.value);
    const volume = parseFloat(document.getElementById('volume-recette')?.value);

    if (!nom || !style || isNaN(degre) || isNaN(volume)) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const recettes = JSON.parse(localStorage.getItem('recettes') || '[]');
    const id = recettes.length > 0 ? Math.max(...recettes.map(r => r.id)) + 1 : 1;
    recettes.push({ id, nom, style, degre_alcool: degre, volume_litres: volume, cout: 0 });
    localStorage.setItem('recettes', JSON.stringify(recettes));

    alert(`Recette "${nom}" ajoutée.`);
    document.getElementById('nom-recette').value = '';
    document.getElementById('style-recette').value = '';
    document.getElementById('degre-recette').value = '';
    document.getElementById('volume-recette').value = '';
    if (typeof afficherRecettes === 'function') afficherRecettes();
}

function afficherRecettes() {
    const recettes = JSON.parse(localStorage.getItem('recettes') || '[]');
    const tbody = document.querySelector('#table-recettes tbody');
    if (tbody) {
        tbody.innerHTML = recettes.map(recette => `
            <tr>
                <td>${recette.id || ''}</td>
                <td>${recette.nom || ''}</td>
                <td>${recette.style || ''}</td>
                <td>${recette.degre_alcool || 0}°</td>
                <td>${recette.volume_litres || 0}L</td>
                <td>
                    <button class="action-btn" onclick="openEditModal('recette', ${recette.id}, '${JSON.stringify(recette).replace(/'/g, "\\'")}')">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="action-btn delete" onclick="openDeleteModal('Voulez-vous vraiment supprimer cette recette ?', () => supprimerRecette(${recette.id}))">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function supprimerRecette(id) {
    let recettes = JSON.parse(localStorage.getItem('recettes') || '[]');
    recettes = recettes.filter(recette => recette.id != id);
    localStorage.setItem('recettes', JSON.stringify(recettes));
    if (typeof afficherRecettes === 'function') afficherRecettes();
}

document.addEventListener('DOMContentLoaded', afficherRecettes);
