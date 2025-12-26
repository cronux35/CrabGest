// Cache global pour toute l'application
window.appDataCache = {
    stocks: [],
    bieres: [],
    historique_stocks: [],
    conditionnements: [],
    clients: [],
    ventes: [],
    fermentations: [],
    declarations_douanes: []
};


document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de l'application
    async function initializeApp() {
        try {
            if (!window.DB || !window.DB.initializeFirestore) {
                throw new Error("DB non initialisé. Vérifiez que db.js est chargé avant app.js.");
            }
            if (!window.Auth || !window.Auth.initialize) {
                throw new Error("Auth non disponible. Vérifiez que auth.js est chargé après db.js.");
            }

            window.Auth.initialize();

            window.Auth.onAuthStateChanged(async (authState) => {
                if (authState.loggedIn) {
                    console.log("[App] Utilisateur connecté:", authState.user);
                    await showAppUI(authState.user);
                    await initData();
                } else {
                    console.log("[App] Aucun utilisateur connecté.");
                    showAuthUI();
                }
            });

            setupAuthEventListeners();
        } catch (error) {
            console.error("[App] Erreur d'initialisation:", error);
            alert("Erreur d'initialisation. Voir la console pour plus de détails.");
        }
    }

    // Initialisation des données (une seule fois)
    async function initData() {
        try {
            if (!window.DB) {
                throw new Error("Les méthodes DB ne sont pas disponibles.");
            }

            // Charger toutes les données nécessaires une seule fois
            const collections = ['stocks', 'bieres', 'fermentations', 'conditionnements', 'ventes', 'historique_stocks', 'clients', 'declarations_douanes'];
            await Promise.all(collections.map(collection => window.DB.loadData(collection)));

            console.log("[App] Données initialisées avec succès.");
        } catch (error) {
            console.error("[App] Erreur lors de l'initialisation des données:", error);
            throw error;
        }
    }

    // Gestion de l'UI d'authentification
    function showAuthUI() {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    }

    async function showAppUI(user) {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';

        // Mettre à jour les informations utilisateur
        document.getElementById('user-display-name').textContent = user.displayName || user.email;
        document.getElementById('user-email').textContent = user.email;

        // Gérer l'onglet Admin (visible uniquement pour les admins)
        const adminTab = document.getElementById('admin-tab');
        if (adminTab) {
            adminTab.style.display = (user.role === 'admin') ? 'block' : 'none';
        }

        // Charger les données par défaut (premier onglet actif)
        if (typeof afficherBieres === 'function') afficherBieres();
        if (typeof chargerDonneesRetrait === 'function') chargerDonneesRetrait();
        if (typeof afficherHistoriqueRetraits === 'function') afficherHistoriqueRetraits();
        if (typeof chargerSelecteurBieresFermentation === 'function') chargerSelecteurBieresFermentation();

        // Charger les utilisateurs non validés (uniquement pour les admins)
        if (user.role === 'admin') {
            await loadUnvalidatedUsers();
        }
    }

    // Événements d'authentification
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
            if (!result.success) {
                const errorElement = document.getElementById('login-error');
                if (errorElement) {
                    errorElement.textContent = result.message;
                    errorElement.style.display = 'block';
                } else {
                    alert(result.message);
                }
            }
        });

        // Inscription avec email/mot de passe
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
            const errorElement = document.getElementById('signup-error');
            if (errorElement) {
                errorElement.textContent = result.message;
                errorElement.style.display = 'block';
            } else {
                alert(result.message);
            }
            if (result.success && e.target.reset) {
                document.getElementById('signup-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
                e.target.reset();
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
                console.error("[App] Erreur Google:", error);
                alert("Une erreur est survenue. Veuillez réessayer.");
            }
        });

        // Déconnexion
        document.getElementById('logout')?.addEventListener('click', async () => {
            if (window.Auth?.signOut) {
                await window.Auth.signOut();
            }
        });

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
                const tab = document.getElementById(tabId);
                if (tab) tab.classList.add('active');
            });
        });
    }

    // Charger les utilisateurs non validés
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

    // Validation d'un utilisateur (admin)
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

    // Lancer l'initialisation
    initializeApp();
});
