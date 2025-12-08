// Initialisation des données locales si absentes
function initData() {
    const defaultData = {
        stocks: [
            { id: 1, type: "Malt", nom: "Pilsen", lot: "2023-001", quantite: 10000, fournisseur: "Château", specification: "3.5 EBC" },
            { id: 2, type: "Houblon", nom: "Citra", lot: "2023-002", quantite: 500, fournisseur: "Hops France", specification: "13.4 %AA" }
        ],
        recettes: [],
        fermentations: [],
        conditionnements: [],
        ventes: [],
        clients: [],
        declarations_douanes: [],
        historique_stocks: []
    };

    for (const [key, value] of Object.entries(defaultData)) {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }
}

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', () => {
    initData();
    chargerDonnees();

    // Gestion des onglets
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });
});
