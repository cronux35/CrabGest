document.addEventListener('DOMContentLoaded', function() {
    // =============================================
    // 1. Initialisation de l'application et Auth
    // =============================================
    async function initializeApp() {
        try {
            // Vérifier que DB est disponible
            if (!window.DB || !window.DB.initializeFirestore) {
                throw new Error("DB non initialisé. Vérifiez que db.js est chargé avant app.js.");
            }

            // Initialiser Auth
            if (!window.Auth || !window.Auth.initialize) {
                throw new Error("Auth non disponible. Vérifiez que auth.js est chargé.");
            }

            window.Auth.initialize();

            // Écouter les changements d'état d'authentification
            window.Auth.onAuthStateChanged(async (authState) => {
                if (authState.loggedIn) {
                    console.log("[App] Utilisateur connecté:", authState.user);
                    await showAppUI(authState.user);
                    await initData();
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
    // 2. Initialisation des données
    // =============================================
    async function initData() {
        try {
            if (!window.DB || !window.DB.loadData || !window.DB.saveData) {
                throw new Error("Les méthodes DB ne sont pas disponibles.");
            }

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
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        if (authContainer && appContainer) {
            appContainer.style.display = 'none';
            authContainer.style.display = 'block';
        }
    }

    async function showAppUI(user) {
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        const adminPanel = document.getElementById('admin-panel');
        const userDisplayName = document.getElementById('user-display-name');
        const userEmail = document.getElementById('user-email');

        if (authContainer && appContainer) {
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
        }

        if (userDisplayName && userEmail) {
            userDisplayName.textContent = user.displayName || user.email;
            userEmail.textContent = user.email;
        }

        if (adminPanel) {
            adminPanel.style.display = (user.role === 'admin') ? 'block' : 'none';
            if (user.role === 'admin') await loadUnvalidatedUsers();
        }

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
        document.getElementById('show-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            if (loginForm && signupForm) {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
            }
        });

        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            if (loginForm && signupForm) {
                signupForm.style.display = 'none';
                loginForm.style.display = 'block';
            }
        });

        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!window.Auth?.signInWithEmail) {
                alert("Fonction de connexion non disponible.");
                return;
            }
            const email = e.target.elements.email?.value;
            const password = e.target.elements.password?.value;
            if (!email || !password) {
                alert("Veuillez remplir tous les champs.");
                return;
            }
            const result = await window.Auth.signInWithEmail(email, password);
            if (!result.success) alert(result.message);
        });

        document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!window.Auth?.signUpWithEmail) {
                alert("Fonction d'inscription non disponible.");
                return;
            }
            const displayName = e.target.elements.displayName?.value;
            const email = e.target.elements.email?.value;
            const password = e.target.elements.password?.value;
            if (!displayName || !email || !password) {
                alert("Veuillez remplir tous les champs.");
                return;
            }
            const result = await window.Auth.signUpWithEmail(email, password, displayName);
            alert(result.message);
            if (result.success && e.target.reset) {
                const loginForm = document.getElementById('login-form');
                const signupForm = document.getElementById('signup-form');
                if (loginForm && signupForm) {
                    signupForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    e.target.reset();
                }
            }
        });

            // Connexion avec Google
            document.getElementById('google-login')?.addEventListener('click', async () => {
                try {
                    const result = await window.Auth.signInWithGoogle();
                    if (!result.success) {
                        const errorElement = document.getElementById('google-error');
                        if (errorElement) {
                            errorElement.textContent = result.message;
                            errorElement.style.display = 'block';
                        } else {
                            alert(result.message);
                        }
                    }
                } catch (error) {
                    console.error("[App] Erreur inattendue avec Google:", error);
                    alert("Une erreur inattendue est survenue. Veuillez réessayer.");
                }
            });


        document.getElementById('logout')?.addEventListener('click', async () => {
            if (window.Auth?.signOut) {
                await window.Auth.signOut();
            }
        });

        window.validateUser = async function(uid) {
            if (!window.Auth?.validateUser) {
                alert("Fonction de validation non disponible.");
                return;
            }
            const result = await window.Auth.validateUser(uid);
            if (result.success) {
                alert("Utilisateur validé avec succès.");
                await loadUnvalidatedUsers();
            } else {
                alert("Erreur lors de la validation: " + result.message);
            }
        };
    }

    // =============================================
    // 5. Charger les utilisateurs non validés
    // =============================================
    async function loadUnvalidatedUsers() {
        if (!window.Auth?.getUnvalidatedUsers) {
            console.error("[App] getUnvalidatedUsers non disponible.");
            return;
        }
        const result = await window.Auth.getUnvalidatedUsers();
        const container = document.getElementById('unvalidated-users');
        if (container) {
            container.innerHTML = result.success && result.users.length > 0 ?
                result.users.map(user =>
                    `<div class="pending-user">
                        <span>${user.displayName || user.email}</span>
                        <button onclick="validateUser('${user.uid}')">Valider</button>
                    </div>`
                ).join('') :
                "<p>Aucun utilisateur en attente de validation.</p>";
        }
    }

    // =============================================
    // 6. Logique existante (menu burger, onglets)
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
            const tab = document.getElementById(tabId);
            if (tab) tab.classList.add('active');
        });
    });

    // =============================================
    // 7. Lancer l'initialisation
    // =============================================
    initializeApp().catch(error => {
        console.error("[App] Erreur fatale:", error);
    });
});
