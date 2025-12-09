function genererDeclarationDouane() {
    const mois = document.getElementById('select-mois-douane').value;
    const conditionnements = JSON.parse(localStorage.getItem('conditionnements'));
    const declarations = JSON.parse(localStorage.getItem('declarations_douanes'));

    // Filtrer les conditionnements du mois
    const conditionnementsMois = conditionnements.filter(c => new Date(c.date).toISOString().startsWith(mois));
    const bièresDeclarees = conditionnementsMois.reduce((acc, c) => {
        if (!acc[c.id_biere]) {
            acc[c.id_biere] = { nom: c.nom_biere, volume: 0, abv: c.abv };
        }
        acc[c.id_biere].volume += c.volume_litres;
        return acc;
    }, {});

    // Calcul des droits (exemple: 1€/L/°)
    const droitsParBiere = Object.entries(bièresDeclarees).map(([id, b]) => ({
        id_biere: parseInt(id),
        nom: b.nom,
        volume: b.volume,
        abv: b.abv,
        droits: b.volume * b.abv
    }));

    const totalDroits = droitsParBiere.reduce((total, b) => total + b.droits, 0);
    declarations.push({
        mois,
        bières: droitsParBiere,
        montant_total_droits: totalDroits,
        date: new Date().toISOString()
    });
    localStorage.setItem('declarations_douanes', JSON.stringify(declarations));

    afficherDeclarations();
    alert(`Déclaration pour ${mois} générée. Montant des droits: ${totalDroits}€.`);
}

function afficherDeclarations() {
    const declarations = JSON.parse(localStorage.getItem('declarations_douanes'));
    const tbody = document.querySelector('#table-douane tbody');
    if (tbody) {
        tbody.innerHTML = declarations.flatMap(dec =>
            dec.bières.map(b =>
                `<tr>
                    <td>${dec.mois}</td>
                    <td>${b.nom}</td>
                    <td>${b.volume}L</td>
                    <td>${b.abv}°</td>
                    <td>${b.droits}€</td>
                    <td>
                        <button class="action-btn delete" onclick="openDeleteModal('Voulez-vous vraiment supprimer cette déclaration ?', () => supprimerDeclaration('${dec.mois}', ${b.id_biere}))">
                            <i class="material-icons">delete</i>
                        </button>
                    </td>
                </tr>`
            )
        ).join('');
    }
}

function supprimerDeclaration(mois, idBiere) {
    let declarations = JSON.parse(localStorage.getItem('declarations_douanes'));
    declarations = declarations.filter(dec => !(dec.mois === mois && dec.bières.some(b => b.id_biere === idBiere)));
    localStorage.setItem('declarations_douanes', JSON.stringify(declarations));
    afficherDeclarations();
}

document.addEventListener('DOMContentLoaded', afficherDeclarations);
