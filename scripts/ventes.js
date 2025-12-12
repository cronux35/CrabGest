// Vérifier que jsPDF est chargé
if (!window.jspdf) {
    console.warn("jsPDF n'est pas chargé, la génération de PDF sera désactivée");
}

// Types de contenants (identique à conditionnement.js)
const VENTES_TYPES_CONTENANTS = {
    'canette_33cl': { nom: 'Canette 33cl', volume: 0.33, code: 'C33' },
    'canette_44cl': { nom: 'Canette 44cl', volume: 0.44, code: 'C44' },
    'bouteille_33cl': { nom: 'Bouteille 33cl', volume: 0.33, code: 'B33' },
    'bouteille_50cl': { nom: 'Bouteille 50cl', volume: 0.50, code: 'B50' },
    'bouteille_75cl': { nom: 'Bouteille 75cl', volume: 0.75, code: 'B75' },
    'fut_sodakeg_19l': { nom: 'Fût SodaKeg 19L', volume: 19, code: 'FS19' },
    'fut_20l': { nom: 'Fût 20L', volume: 20, code: 'F20' }
};

// Variables globales spécifiques aux ventes
let ventesAllBieres = [];
let ventesAllVentes = [];
let ventesStocksDisponibles = [];
let ventesCurrentFactureData = null;

// Charger les données initiales
async function ventesChargerDonneesInitiales() {
    try {
        // Charger les données en parallèle
        const [ventes, conditionnements, bieres] = await Promise.all([
            loadData('ventes').catch(() => []),
            loadData('conditionnements').catch(() => []),
            loadData('bieres').catch(() => [])
        ]);

        ventesAllVentes = ventes || [];
        ventesAllBieres = bieres || [];

        // Calculer les stocks disponibles
        ventesCalculerStocksDisponibles(conditionnements || [], bieres || []);

        // Charger les sélecteurs
        ventesChargerSelecteursVentes();

        // Afficher les données
        ventesAfficherStocksDisponibles();
        ventesAfficherHistoriqueVentes();

    } catch (error) {
        console.error("Erreur chargement initial des ventes:", error);
    }
}

// Calculer les stocks disponibles
function ventesCalculerStocksDisponibles(conditionnements, bieres) {
    ventesStocksDisponibles = [];

    // Regrouper les conditionnements par bière et type
    const stocksParBiere = {};

    conditionnements.forEach(cond => {
        const key = `${cond.id_biere}_${cond.type_contenant}`;
        if (!stocksParBiere[key]) {
            stocksParBiere[key] = {
                id_biere: cond.id_biere,
                nom_biere: cond.nom_biere,
                type_contenant: cond.type_contenant,
                quantite: 0,
                volume_total: 0
            };
        }
        stocksParBiere[key].quantite += cond.quantite;
        stocksParBiere[key].volume_total += cond.volume_total || (cond.quantite * (VENTES_TYPES_CONTENANTS[cond.type_contenant]?.volume || 0));
    });

    // Convertir en tableau
    ventesStocksDisponibles = Object.values(stocksParBiere);

    // Ajouter les bières sans conditionnement
    bieres.forEach(biere => {
        const hasStock = ventesStocksDisponibles.some(s => s.id_biere === biere.id);
        if (!hasStock) {
            ventesStocksDisponibles.push({
                id_biere: biere.id,
                nom_biere: biere.nom,
                type_contenant: null,
                quantite: 0,
                volume_total: 0
            });
        }
    });
}

// Charger les sélecteurs
function ventesChargerSelecteursVentes() {
    // Sélecteur des bières
    const selectBiere = document.getElementById('select-biere-vente');
    if (selectBiere) {
        selectBiere.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
        ventesAllBieres.forEach(biere => {
            const option = document.createElement('option');
            option.value = biere.id;
            option.textContent = biere.nom;
            selectBiere.appendChild(option);
        });

        selectBiere.addEventListener('change', function() {
            ventesChargerTypesConditionnement(this.value);
        });
    }
}

// Charger les types de conditionnement pour une bière
function ventesChargerTypesConditionnement(biereId) {
    const selectConditionnement = document.getElementById('select-conditionnement-vente');
    if (!selectConditionnement) return;

    selectConditionnement.innerHTML = '<option value="">-- Sélectionner un type --</option>';

    // Filtrer les stocks pour cette bière
    const stocksBiere = ventesStocksDisponibles.filter(s => s.id_biere == biereId && s.quantite > 0);

    // Ajouter les options disponibles
    stocksBiere.forEach(stock => {
        const contenant = VENTES_TYPES_CONTENANTS[stock.type_contenant];
        if (contenant) {
            const option = document.createElement('option');
            option.value = stock.type_contenant;
            option.textContent = `${contenant.nom} (${stock.quantite} disponibles)`;
            option.dataset.quantite = stock.quantite;
            selectConditionnement.appendChild(option);
        }
    });
}

// Afficher les stocks disponibles
function ventesAfficherStocksDisponibles() {
    const tbody = document.querySelector('#table-stocks-disponibles tbody');
    if (!tbody) return;

    if (ventesStocksDisponibles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px;">
                    Aucun stock disponible
                </td>
            </tr>
        `;
        return;
    }

    // Regrouper par bière
    const stocksParBiere = {};

    ventesStocksDisponibles.forEach(stock => {
        if (stock.type_contenant) { // Ignorer les entrées sans conditionnement
            if (!stocksParBiere[stock.id_biere]) {
                stocksParBiere[stock.id_biere] = {
                    biere: stock.nom_biere,
                    types: [],
                    totalQuantite: 0,
                    totalVolume: 0
                };
            }

            const contenant = VENTES_TYPES_CONTENANTS[stock.type_contenant];
            stocksParBiere[stock.id_biere].types.push({
                type: contenant.nom,
                quantite: stock.quantite,
                volume: stock.volume_total.toFixed(2)
            });

            stocksParBiere[stock.id_biere].totalQuantite += stock.quantite;
            stocksParBiere[stock.id_biere].totalVolume += stock.volume_total;
        }
    });

    tbody.innerHTML = Object.values(stocksParBiere).map(stock => {
        const typesHtml = stock.types.map(t =>
            `<tr>
                <td>${stock.biere}</td>
                <td>${t.type}</td>
                <td>${t.quantite}</td>
                <td>${t.volume}L</td>
            </tr>`
        ).join('');

        return `
            ${typesHtml}
            <tr class="synthese-vente">
                <td colspan="2"><strong>Total ${stock.biere}</strong></td>
                <td><strong>${stock.totalQuantite}</strong></td>
                <td><strong>${stock.totalVolume.toFixed(2)}L</strong></td>
            </tr>
        `;
    }).join('');
}

// Enregistrer une vente
async function ventesEnregistrerVente() {
    const biereId = document.getElementById('select-biere-vente').value;
    const typeConditionnement = document.getElementById('select-conditionnement-vente').value;
    const quantite = parseInt(document.getElementById('quantite-vente').value);
    const prixUnitaire = parseFloat(document.getElementById('prix-unitaire-vente').value);
    const nomClient = document.getElementById('nom-client-vente').value.trim();

    if (!biereId || !typeConditionnement || isNaN(quantite) || quantite <= 0 ||
        isNaN(prixUnitaire) || prixUnitaire <= 0 || !nomClient) {
        alert("Veuillez remplir tous les champs correctement");
        return;
    }

    try {
        // Vérifier le stock disponible
        const stockDispo = ventesStocksDisponibles.find(s =>
            s.id_biere == biereId && s.type_contenant === typeConditionnement);

        if (!stockDispo || stockDispo.quantite < quantite) {
            alert("Stock insuffisant pour cette vente");
            return;
        }

        // Trouver la bière
        const biere = await loadItemById('bieres', parseInt(biereId));
        if (!biere) {
            alert("Bière non trouvée");
            return;
        }

        // Créer la vente
        const vente = {
            id: Date.now(),
            id_biere: biere.id,
            nom_biere: biere.nom,
            type_contenant: typeConditionnement,
            quantite: quantite,
            prix_unitaire: prixUnitaire,
            total: quantite * prixUnitaire,
            client: nomClient,
            date: new Date().toISOString()
        };

        // Enregistrer la vente
        await addItem('ventes', vente);

        // Mettre à jour le stock
        const conditionnements = await loadData('conditionnements').catch(() => []);
        const condAMettreAJour = conditionnements
            .filter(c => c.id_biere == biereId && c.type_contenant === typeConditionnement)
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // FIFO

        let quantiteRestante = quantite;
        for (const cond of condAMettreAJour) {
            if (quantiteRestante <= 0) break;

            const quantiteADebiter = Math.min(cond.quantite, quantiteRestante);
            cond.quantite -= quantiteADebiter;
            cond.volume_total -= quantiteADebiter * (VENTES_TYPES_CONTENANTS[cond.type_contenant]?.volume || 0);

            if (cond.quantite <= 0) {
                await deleteItem('conditionnements', cond.id);
            } else {
                await updateItem('conditionnements', cond);
            }

            quantiteRestante -= quantiteADebiter;
        }

        // Stocker les données pour la facture
        ventesCurrentFactureData = {
            ...vente,
            contenant_nom: VENTES_TYPES_CONTENANTS[typeConditionnement]?.nom || typeConditionnement,
            date: new Date().toLocaleDateString('fr-FR')
        };

        // Recharger les stocks
        const [nouveauxConditionnements, nouvellesBieres] = await Promise.all([
            loadData('conditionnements').catch(() => []),
            loadData('bieres').catch(() => [])
        ]);

        ventesCalculerStocksDisponibles(nouveauxConditionnements, nouvellesBieres);

        // Rafraîchir l'affichage
        ventesAfficherStocksDisponibles();
        ventesAfficherHistoriqueVentes();

        alert(`Vente enregistrée avec succès!`);
    } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue lors de l'enregistrement");
    }
}

// Afficher l'historique des ventes
function ventesAfficherHistoriqueVentes() {
    const tbody = document.querySelector('#table-historique-ventes tbody');
    if (!tbody) return;

    if (ventesAllVentes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">
                    Aucune vente enregistrée
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = ventesAllVentes.map(vente => {
        const contenant = VENTES_TYPES_CONTENANTS[vente.type_contenant];
        return `
            <tr>
                <td>${new Date(vente.date).toLocaleDateString('fr-FR')}</td>
                <td>${vente.client}</td>
                <td>${vente.nom_biere}</td>
                <td>${contenant ? contenant.nom : vente.type_contenant}</td>
                <td>${vente.quantite}</td>
                <td>${vente.prix_unitaire.toFixed(2)}€</td>
                <td>${vente.total.toFixed(2)}€</td>
                <td>
                    <button class="action-btn info-btn" title="Voir détails" onclick="ventesGenererFacturePDF(${vente.id})">
                        <i class="material-icons">picture_as_pdf</i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Générer une facture PDF
function ventesGenererFacturePDF(venteId) {
    // Si un ID est fourni, utiliser cette vente
    let venteData = ventesCurrentFactureData;
    if (venteId) {
        venteData = ventesAllVentes.find(v => v.id == venteId);
        if (!venteData) return;

        const contenant = VENTES_TYPES_CONTENANTS[venteData.type_contenant];
        venteData = {
            ...venteData,
            contenant_nom: contenant?.nom || venteData.type_contenant,
            date: new Date(venteData.date).toLocaleDateString('fr-FR')
        };
    }

    if (!venteData) {
        alert("Aucune donnée de facture disponible");
        return;
    }

    // Vérifier si jsPDF est disponible
    if (!window.jspdf) {
        alert("La génération de PDF n'est pas disponible dans cet environnement. Veuillez utiliser une version locale de l'application.");
        return;
    }

    // Créer un nouveau document PDF
    const doc = new jspdf.jsPDF();

    // Titre
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("FACTURE", 105, 20, { align: 'center' });

    // Informations du client
    doc.setFontSize(12);
    doc.text(`Client: ${venteData.client}`, 20, 40);
    doc.text(`Date: ${venteData.date}`, 20, 50);

    // Détails de la vente
    doc.setFontSize(14);
    doc.text("Détails de la vente:", 20, 70);

    doc.setFontSize(12);
    doc.text(`Bière: ${venteData.nom_biere}`, 20, 80);
    doc.text(`Type: ${venteData.contenant_nom}`, 20, 90);
    doc.text(`Quantité: ${venteData.quantite}`, 20, 100);
    doc.text(`Prix unitaire: ${venteData.prix_unitaire.toFixed(2)}€`, 20, 110);
    doc.text(`Total: ${venteData.total.toFixed(2)}€`, 20, 120);

    // Pied de page
    doc.setFontSize(10);
    doc.text("© 2025 CrabGest - Association CRAB", 105, 280, { align: 'center' });

    // Enregistrer le PDF
    doc.save(`Facture_${venteData.id}_${venteData.client.replace(/\s+/g, '_')}.pdf`);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Charger les données quand l'onglet est affiché
    const ventesTab = document.getElementById('ventes');
    if (ventesTab) {
        const observer = new MutationObserver(function(mutations) {
            if (ventesTab.style.display !== 'none') {
                ventesChargerDonneesInitiales();
                observer.disconnect();
            }
        });

        observer.observe(ventesTab, { attributes: true, attributeFilter: ['style'] });
    }
});
