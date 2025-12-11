document.addEventListener('DOMContentLoaded', async function() {
    // Initialisation des données par défaut si la base est vide
    async function initData() {
        try {
            // Vérifier si des données existent déjà
            const stocks = await loadData('stocks').catch(() => []);
            if (stocks.length === 0) {
                const defaultStocks = [
                    {
                        type: "Malt",
                        nom: "Pilsen",
                        lot: "2023-001",
                        quantite: 10000,
                        fournisseur: "Château",
                        specification: "3.5 EBC",
                        annee_recolte: null,
                        pourcentage_aa: null,
                        notes: "Malt de base pour les bières blondes et IPA.",
                        conditionnement: "Sac de 25 kg"
                    },
                    {
                        type: "Malt",
                        nom: "Munich",
                        lot: "2023-002",
                        quantite: 24400,
                        fournisseur: "Château",
                        specification: "25 EBC",
                        annee_recolte: null,
                        pourcentage_aa: null,
                        notes: "Malt caramelisé pour les bières ambrées.",
                        conditionnement: "Sac de 25 kg"
                    }
                    // Ajoute ici les autres ingrédients par défaut
                ];
                await saveData('stocks', defaultStocks);
            }

            // Initialiser les autres stores si vides
            const storesToInit = ['recettes', 'fermentations', 'conditionnements', 'ventes', 'historique_stocks', 'clients', 'declarations_douanes'];
            for (const store of storesToInit) {
                const data = await loadData(store).catch(() => []);
                if (data.length === 0) {
                    await saveData(store, []);
                }
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation des données:", error);
        }
    }

    // Gestion du menu burger
    const menuBurger = document.getElementById('menuBurger');
    const mainNav = document.getElementById('mainNav');
    if (menuBurger && mainNav) {
        menuBurger.addEventListener('click', function() {
            menuBurger.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
    }

    // Gestion des onglets
    document.querySelectorAll('.tab-button').forEach(function(button) {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(function(b) {
                b.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(function(t) {
                t.classList.remove('active');
            });
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Initialisation
    await initData();
    if (typeof chargerDonnees === 'function') chargerDonnees();
});
