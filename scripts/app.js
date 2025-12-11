document.addEventListener('DOMContentLoaded', async function() {
    async function initData() {
        try {
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
                    }
                ];
                await saveData('stocks', defaultStocks);
            }

            const storesToInit = ['bieres', 'fermentations', 'conditionnements', 'ventes', 'historique_stocks', 'clients', 'declarations_douanes'];
            for (const store of storesToInit) {
                try {
                    const data = await loadData(store).catch(() => []);
                    if (data.length === 0) {
                        await saveData(store, []);
                    }
                } catch (error) {
                    console.error(`Erreur lors de l'initialisation du store ${store}:`, error);
                }
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation des données:", error);
        }
    }

    const menuBurger = document.getElementById('menuBurger');
    const mainNav = document.getElementById('mainNav');
    if (menuBurger && mainNav) {
        menuBurger.addEventListener('click', function() {
            menuBurger.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
    }

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

    try {
        await initData();
        if (typeof chargerDonnees === 'function') chargerDonnees();
        if (typeof afficherBieres === 'function') afficherBieres();
        if (typeof chargerDonneesRetrait === 'function') chargerDonneesRetrait();
    } catch (error) {
        console.error("Erreur lors de l'initialisation de l'application:", error);
        alert("Une erreur est survenue lors du chargement de l'application. Veuillez actualiser la page.");
    }
});
