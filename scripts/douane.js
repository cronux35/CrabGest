function genererDeclarationDouane() {
    const mois = document.getElementById('select-mois-douane').value;
    const conditionnements = JSON.parse(localStorage.getItem('conditionnements'));
    const declarations = JSON.parse(localStorage.getItem('declarations_douanes'));

    // Filtrer les conditionnements du mois
    const conditionnementsMois = conditionnements.filter(c => new Date(c.date).toISOString().startsWith(mois));
    const bièresDeclarees = conditionnementsMois.reduce((acc, c) => {
        if (!acc[c.id_biere]) {
            acc[c.id_biere] = { volume: 0, abv: c.abv };
        }
        acc[c.id_biere].volume += c.volume_litres;
        return acc;
    }, {});

    // Calcul des droits (exemple: 1€/L/°)
    const droits = Object.values(bièresDeclarees).reduce((total, b) => total + b.volume * b.abv, 0);
    declarations.push({
        mois,
        bières: bièresDeclarees,
        montant_total_droits: droits,
        date: new Date().toISOString()
    });
    localStorage.setItem('declarations_douanes', JSON.stringify(declarations));

    alert(`Déclaration pour ${mois} générée. Montant des droits: ${droits} €.`);
}
