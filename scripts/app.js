// Initialisation des données locales si absentes
function initData() {
    const defaultData = {
        stocks: [
            {
                "id": 1,
                "type": "Malt",
                "nom": "Pilsen",
                "lot": "2023-001",
                "quantite": 10000,
                "fournisseur": "Château",
                "specification": "3.5 EBC",
                "annee_recolte": null,
                "pourcentage_aa": null,
                "notes": "Malt de base pour les bières blondes et IPA. Stocké dans un endroit sec.",
                "conditionnement": "Sac de 25 kg"
            },
            {
                "id": 2,
                "type": "Malt",
                "nom": "Munich",
                "lot": "2023-002",
                "quantite": 24400,
                "fournisseur": "Château",
                "specification": "25 EBC",
                "annee_recolte": null,
                "pourcentage_aa": null,
                "notes": "Malt caramelisé pour les bières ambrées. À utiliser avec modération.",
                "conditionnement": "Sac de 25 kg"
            }
            // Ajoute les 40 autres ingrédients ici (voir le JSON complet plus haut)
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

// Gestion du menu burger et chargement initial
document.addEventListener('DOMContentLoaded', () => {
    initData();

    const menuBurger = document.getElementById('menuBurger');
    const mainNav = document.getElementById('mainNav');

    if (menuBurger && mainNav) {
        menuBurger.addEventListener('click', () => {
            menuBurger.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
    }

    // Gestion des onglets
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Charger les données initiales
    if (typeof chargerDonnees === 'function') chargerDonnees();
});
