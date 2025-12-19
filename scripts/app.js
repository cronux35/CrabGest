document.addEventListener('DOMContentLoaded', async function() {
    // =============================================
    // 1. Initialisation de l'application et Auth
    // =============================================
    async function initializeApp() {
        try {
            // Initialiser Firestore et Auth
            const firestoreDb = window.DB.initializeFirestore();
            window.Auth.initialize(firestoreDb);

            // Écouter les changements d'état d'authentification
            window.Auth.onAuthStateChanged(async (authState) => {
                if (authState.loggedIn) {
                    console.log("[App] Utilisateur connecté:", authState.user);
                    await showAppUI(authState.user);
                    await initData(); // Charger les données seulement si authentifié
                } else {
                    console.log("[App] Aucun utilisateur connecté. Affichage du formulaire d'authentification.");
                    showAuthUI();
                }
            });

            // Configurer les événements UI pour l'authentification
            setupAuthEventListeners();
        } catch (error) {
            console.error("[App] Erreur lors de l'initialisation:", error);
            alert("Erreur d'initialisation. Voir la console pour plus de détails.");
        }
    }

    // =============================================
    // 2. Initialisation des données (votre code existant)
    // =============================================
    async function initData() {
        try {
            const stocks = await window.DB.loadData('stocks').catch(() => []);
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
                await window.DB.saveData('stocks', defaultStocks);
            }

            const storesToInit = ['bieres', 'fermentations', 'conditionnements', 'ventes', 'historique_stocks', 'clients', 'declarations_douanes'];
            for (const store of storesToInit) {
                try {
                    const data = await window.DB.loadData(store).catch(() => []);
                    if (data.length === 0) {
                        await window.DB.saveData(store, []);
                    }
                } catch (error) {
                    console.error(`[App] Erreur lors de l'initialisation du store ${store}:`, error);
                }
            }
        } catch (error) {
            console.error("[App] Erreur lors de l'initialisation des données:", error);
            throw error;
        }
    }

    // =============================================
    // 3. Gestion de l'UI d'authentification
    // =============================================
    function showAuthUI() {
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('admin-panel').style.display = 'none';
    }

    async function showAppUI(user) {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';

        // Afficher le panel admin si l'utilisateur est admin
        if (user.role === 'admin') {
            document.getElementById('admin-panel').style.display = 'block';
            await loadUnvalidatedUsers();
        } else {
            document.getElementById('admin-panel').style.display = 'none';
        }

        // Mettre à jour l'UI utilisateur
        document.getElementById('user-display-name').textContent = user.displayName || user.email;
        document.getElementById('user-email').textContent = user.email;

        // Charger les données et afficher l'onglet par défaut
        if (typeof chargerDonnees === 'function') chargerDonnees();
        if (typeof afficherBieres === 'function') afficherBieres();
        if (typeof chargerDonneesRetrait === 'function') chargerDonneesRetrait();
        if (typeof afficherHistoriqueRetraits === 'function') afficherHistoriqueRetraits();
        if (typeof chargerSelecteurBieresFermentation === 'function') chargerSelecteurBieresFermentation();
    }

    // =============================================
    // 4. Événements d'authentification
    // =============================================
    function setupAuthEventListeners() {
        // Basculer entre connexion et inscription
        document.getElementById('show-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('signup-form').style.display = 'block';
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });

        // Connexion avec email/mot de passe
        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.elements.email.value;
            const password = e.target.elements.password.value;
            const result = await window.Auth.signInWithEmail(email, password);
            if (!result.success) {
                alert(result.message);
            }
        });

        // Inscription avec email/mot de passe
        document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const displayName = e.target.elements.displayName.value;
            const email = e.target.elements.email.value;
            const password = e.target.elements.password.value;
            const result = await window.Auth.signUpWithEmail(email, password, displayName);
            alert(result.message);
            if (result.success) {
                document.getElementById('signup-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
                e.target.reset();
            }
        });

        // Connexion avec Google
        document.getElementById('google-login')?.addEventListener('click', async () => {
            const result = await window.Auth.signInWithGoogle();
            if (!result.success) {
                alert(result.message);
            }
        });

        // Déconnexion
        document.getElementById('logout')?.addEventListener('click', async () => {
            await window.Auth.signOut();
        });

        // Validation d'un utilisateur (admin)
        window.validateUser = async function(uid) {
            const result = await window.Auth.validateUser(uid);
            if (result.success) {
                alert("Utilisateur validé avec succès.");
                await loadUnvalidatedUsers(); // Rafraîchir la liste
            } else {
                alert("Erreur lors de la validation: " + result.message);
            }
        };
    }

    // Charger les utilisateurs non validés (admin)
    async function loadUnvalidatedUsers() {
        const result = await window.Auth.getUnvalidatedUsers();
        const container = document.getElementById('unvalidated-users');
        if (result.success) {
            container.innerHTML = result.users.length > 0 ?
                result.users.map(user =>
                    `<div class="pending-user">
                        <span>${user.displayName || user.email}</span>
                        <button onclick="validateUser('${user.uid}')">Valider</button>
                    </div>`
                ).join('') :
                "<p>Aucun utilisateur en attente de validation.</p>";
        } else {
            container.innerHTML = `<p>Erreur: ${result.message}</p>`;
        }
    }

    // =============================================
    // 5. Logique existante (menu burger, onglets)
    // =============================================
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

    // =============================================
    // 6. Lancer l'initialisation
    // =============================================
    initializeApp().catch(error => {
        console.error("[App] Erreur fatale:", error);
        alert("Impossible de démarrer l'application. Veuillez actualiser la page.");
    });
});
