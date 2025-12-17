// Variables globales
let currentClient = null;
let currentCommande = [];

// Charger les clients
async function chargerClients() {
    const selectClient = document.getElementById('select-client');
    selectClient.innerHTML = '<option value="">-- Sélectionner un client --</option>';
    const clients = await loadData('clients').catch(() => []);
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.nom;
        selectClient.appendChild(option);
    });
}

// Charger les bières
async function chargerBieres() {
    const selectBiere = document.getElementById('select-biere-commande');
    selectBiere.innerHTML = '<option value="">-- Sélectionner une bière --</option>';
    const bieres = await loadData('bieres').catch(() => []);
    bieres.forEach(biere => {
        const option = document.createElement('option');
        option.value = biere.nom;
        option.textContent = biere.nom;
        selectBiere.appendChild(option);
    });
}

// Charger les types de contenants
function chargerTypesContenants() {
    const selectTypeContenant = document.getElementById('select-type-contenant-commande');
    selectTypeContenant.innerHTML = '<option value="">-- Sélectionner un contenant --</option>';
    TYPES_CONTENANTS.forEach(contenant => {
        const option = document.createElement('option');
        option.value = contenant.id;
        option.textContent = contenant.nom;
        selectTypeContenant.appendChild(option);
    });
}

// Charger les bières pour le filtre
async function chargerBieresFiltre() {
    const selectBiereFiltre = document.getElementById('select-filtre-biere');
    selectBiereFiltre.innerHTML = '<option value="">-- Filtrer par bière --</option>';

    const bieres = await loadData('bieres').catch(() => []);
    bieres.forEach(biere => {
        const option = document.createElement('option');
        option.value = biere.nom;
        option.textContent = biere.nom;
        selectBiereFiltre.appendChild(option);
    });
}


// Afficher ou masquer la section "Stocks Disponibles"
function toggleTableStocks() {
    const tableContainer = document.getElementById('table-stocks-container');
    const btnToggle = document.getElementById('btn-toggle-table-stocks');

    if (!tableContainer || !btnToggle) {
        console.error("Élément table-stocks-container ou btn-toggle-table-stocks non trouvé.");
        return;
    }

    if (tableContainer.style.display === 'none') {
        tableContainer.style.display = 'block';
        btnToggle.innerHTML = '<i class="material-icons">visibility_off</i> Masquer le tableau';
    } else {
        tableContainer.style.display = 'none';
        btnToggle.innerHTML = '<i class="material-icons">visibility</i> Afficher le tableau';
    }
}

async function afficherStockDisponible() {
    const biereNom = document.getElementById('select-biere-commande').value;
    const typeContenant = document.getElementById('select-type-contenant-commande').value;
    const stockDisponibleElement = document.getElementById('stock-disponible');

    if (!biereNom || !typeContenant) {
        stockDisponibleElement.textContent = '';
        return;
    }

    const conditionnements = await loadData('conditionnements').catch(() => []);
    const lotsDisponibles = conditionnements.filter(c => c.biere === biereNom && c.typeContenant === typeContenant);
    const stockTotal = lotsDisponibles.reduce((total, lot) => total + lot.quantite, 0);

    if (stockTotal > 0) {
        stockDisponibleElement.textContent = `Stock disponible : ${stockTotal}`;
        stockDisponibleElement.style.color = 'green';
    } else {
        stockDisponibleElement.textContent = 'Stock insuffisant';
        stockDisponibleElement.style.color = 'red';
    }
}



// Afficher les stocks disponibles avec filtre par bière
async function afficherStocksDisponibles(biereFiltre = '') {
    const tbody = document.querySelector('#table-stocks-disponibles tbody');
    tbody.innerHTML = '';
    const conditionnements = await loadData('conditionnements').catch(() => []);

    if (conditionnements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Aucun stock disponible</td></tr>';
        return;
    }

    // Regrouper les conditionnements par bière et type de contenant
    const stocksParBiereEtContenant = {};

    conditionnements.forEach(cond => {
        if (biereFiltre && cond.biere !== biereFiltre) {
            return;
        }

        const key = `${cond.biere}-${cond.typeContenant}`;
        if (!stocksParBiereEtContenant[key]) {
            stocksParBiereEtContenant[key] = {
                biere: cond.biere,
                typeContenant: cond.typeContenant,
                lots: []
            };
        }
        stocksParBiereEtContenant[key].lots.push({
            numeroLot: cond.numeroLot,
            quantite: cond.quantite
        });
    });

    // Afficher les stocks
    for (const key in stocksParBiereEtContenant) {
        const stock = stocksParBiereEtContenant[key];
        const contenant = TYPES_CONTENANTS.find(c => c.id === stock.typeContenant);

        const totalQuantite = stock.lots.reduce((total, lot) => total + lot.quantite, 0);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stock.biere}</td>
            <td>${contenant ? contenant.nom : 'Inconnu'}</td>
            <td>
                ${stock.lots.map(lot => `<div>${lot.numeroLot} (${lot.quantite})</div>`).join('')}
            </td>
            <td>${totalQuantite}</td>
        `;
        tbody.appendChild(row);
    }
}




// Afficher les infos d'un client
async function afficherInfosClient(clientId) {
    if (!clientId) {
        document.getElementById('infos-client').style.display = 'none';
        return;
    }
    const clients = await loadData('clients').catch(() => []);
    const client = clients.find(c => c.id == clientId);
    if (client) {
        currentClient = client;
        document.getElementById('client-nom').textContent = client.nom;
        document.getElementById('client-adresse').textContent = client.adresse;
        document.getElementById('client-siret').textContent = client.siret || 'Non renseigné';
        document.getElementById('client-email').textContent = client.email || 'Non renseigné';
        document.getElementById('infos-client').style.display = 'block';
    }
}

// Ouvrir la modale pour ajouter un client
function ouvrirModaleClient() {
    document.getElementById('modale-client').style.display = 'block';
}

// Fermer la modale
function fermerModaleClient() {
    document.getElementById('modale-client').style.display = 'none';
}

// Enregistrer un nouveau client
async function enregistrerClient() {
    const nom = document.getElementById('nom-client').value;
    const adresse = document.getElementById('adresse-client').value;
    const siret = document.getElementById('siret-client').value;
    const email = document.getElementById('email-client').value;

    if (!nom || !adresse) {
        alert("Le nom et l'adresse sont obligatoires.");
        return;
    }

    const client = {
        id: Date.now().toString(),
        nom,
        adresse,
        siret,
        email
    };

    try {
        await addItem('clients', client);
        await chargerClients();
        document.getElementById('select-client').value = client.id;
        await afficherInfosClient(client.id);
        fermerModaleClient();
    } catch (error) {
        console.error("Erreur lors de l'ajout du client :", error);
        alert("Erreur lors de l'ajout");
    }
}

// Ajouter une ligne à la commande
async function ajouterLigneCommande() {
    const biereNomElement = document.getElementById('select-biere-commande');
    const typeContenantElement = document.getElementById('select-type-contenant-commande');
    const quantiteElement = document.getElementById('quantite-commande');
    const prixUnitaireElement = document.getElementById('prix-unitaire-commande');

    if (!biereNomElement || !typeContenantElement || !quantiteElement || !prixUnitaireElement) {
        console.error("Un ou plusieurs éléments requis sont introuvables dans le DOM.");
        return;
    }

    const biereNom = biereNomElement.value;
    const typeContenant = typeContenantElement.value;
    const quantite = parseInt(quantiteElement.value);
    const prixUnitaire = parseFloat(prixUnitaireElement.value);

    if (!currentClient) {
        alert("Veuillez sélectionner un client.");
        return;
    }
    if (!biereNom || !typeContenant || isNaN(quantite) || quantite < 1 || isNaN(prixUnitaire) || prixUnitaire <= 0) {
        alert("Tous les champs sont obligatoires et le prix unitaire doit être supérieur à 0.");
        return;
    }

    // Trouver un lot disponible
    const conditionnements = await loadData('conditionnements').catch(() => []);
    const lotsDisponibles = conditionnements
        .filter(c => c.biere === biereNom && c.typeContenant === typeContenant && c.quantite >= quantite)
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // FIFO

    if (lotsDisponibles.length === 0) {
        alert("Stock insuffisant pour cette bière et ce contenant.");
        return;
    }

    const lot = lotsDisponibles[0];
    const contenant = TYPES_CONTENANTS.find(c => c.id === typeContenant);

    currentCommande.push({
        biere: biereNom,
        typeContenant,
        lot: lot.numeroLot,
        quantite,
        prixUnitaire,
        total: quantite * prixUnitaire
    });

    afficherCommande();
    afficherStockDisponible();
}




// Afficher la commande en cours
function afficherCommande() {
    const tbody = document.querySelector('#table-commande tbody');
    tbody.innerHTML = '';
    let totalCommande = 0;

    currentCommande.forEach((ligne, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ligne.biere}</td>
            <td>${TYPES_CONTENANTS.find(c => c.id === ligne.typeContenant).nom}</td>
            <td>${ligne.lot}</td>
            <td>${ligne.quantite}</td>
            <td>${ligne.prixUnitaire.toFixed(2)}</td>
            <td>${ligne.total.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger" data-index="${index}">
                    <i class="material-icons">delete</i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
        totalCommande += ligne.total;
    });

    // Ajouter une ligne pour le total
    if (currentCommande.length > 0) {
        const rowTotal = document.createElement('tr');
        rowTotal.innerHTML = `
            <td colspan="5" style="text-align: right;"><strong>Total :</strong></td>
            <td>${totalCommande.toFixed(2)}</td>
            <td></td>
        `;
        tbody.appendChild(rowTotal);
    }
}

// Valider la commande
async function validerCommande() {
    if (!currentClient || currentCommande.length === 0) {
        alert("Veuillez sélectionner un client et ajouter des lignes à la commande.");
        return;
    }

    const total = currentCommande.reduce((sum, ligne) => sum + ligne.total, 0);

    const vente = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        clientId: currentClient.id,
        lignes: currentCommande,
        total: total
    };

    try {
        await addItem('ventes', vente);
        alert("Commande validée avec succès !");
        currentCommande = [];
        afficherCommande();
        await afficherVentes();
    } catch (error) {
        console.error("Erreur lors de la validation de la commande :", error);
        alert("Erreur lors de la validation");
    }
}


async function genererFactureDepuisVente(venteId) {
    const ventes = await loadData('ventes').catch(() => []);
    const vente = ventes.find(v => v.id == venteId);

    if (!vente) {
        alert("Vente non trouvée.");
        return;
    }

    const clients = await loadData('clients').catch(() => []);
    const client = clients.find(c => c.id == vente.clientId);

    if (!client) {
        alert("Client non trouvé.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Logo CRAB (à remplacer par une image base64 ou un chemin correct)
    const logoBase64 = 'data:image/png;base64,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'; // Remplacez par votre logo encodé en base64

    // Ajouter le logo
    doc.addImage(logoBase64, 'PNG', 15, 10, 50, 30);

    // Coordonnées du CRAB
    doc.setFontSize(12);
    doc.text("Collectif Rennais des Amateur·rice·s de Bières", 15, 50);
    doc.text("10 rue André Gallais", 15, 57);
    doc.text("35200 RENNES", 15, 64);
    doc.text("06.45.78.11.07", 15, 71);
    doc.text("crab@danthine-navarro.com", 15, 78);
    doc.text("N° SIREN : 900378043", 15, 85);
    doc.text("N° d’entrepositaire : FR100000N3406", 15, 92);

    // Informations de la facture
    doc.setFontSize(14);
    doc.text(`N° DE FACTURE : ${vente.id}`, 120, 50);
    doc.text(`DATE D'EMISSION : ${vente.date}`, 120, 57);
    doc.text(`Commande Réceptionnée le : ${vente.date}`, 120, 64);
    doc.text(`Échéance : ${getEcheanceDate(vente.date)}`, 120, 71);

    // Titre de la facture
    doc.setFontSize(20);
    doc.text("FACTURE", 105, 100, { align: 'center' });

    // Informations du client
    doc.setFontSize(12);
    doc.text(`À`, 15, 115);
    doc.text(`${client.nom}`, 15, 122);
    doc.text(`${client.adresse}`, 15, 129);
    doc.text(`Code Client : ${client.id}`, 15, 136);
    if (client.siret) doc.text(`Siret : ${client.siret}`, 15, 143);

    // Tableau des lignes de commande
    const startY = 160;
    doc.setFontSize(12);
    doc.text("qté", 15, startY);
    doc.text("description", 40, startY);
    doc.text("prix unitaire HT Droits Payés", 120, startY);
    doc.text("total de la ligne", 170, startY);

    let y = startY + 7;
    let totalHT = 0;

    // Lignes du tableau
    for (const ligne of vente.lignes) {
        const montantHT = ligne.quantite * ligne.prixUnitaire;
        totalHT += montantHT;

        // Récupérer les informations de la bière (à adapter selon votre structure de données)
        const biereInfo = await getBiereInfo(ligne.biere); // Vous devez implémenter cette fonction
        const dateConditionnement = await getDateConditionnement(ligne.lot); // Vous devez implémenter cette fonction
        const ddm = new Date(dateConditionnement);
        ddm.setFullYear(ddm.getFullYear() + 3); // DDM = date de conditionnement + 3 ans

        doc.text(ligne.quantite.toString(), 15, y);
        doc.text(`${ligne.biere}, ABV = ${biereInfo.abv}%, ${ligne.lot} (DDM ${ddm.toLocaleDateString()})`, 40, y);
        doc.text(`${ligne.prixUnitaire.toFixed(2)} €`, 140, y, { align: 'right' });
        doc.text(`${montantHT.toFixed(2)} €`, 190, y, { align: 'right' });

        y += 10;
    }

    // Ligne de total
    doc.setFont("helvetica", "bold");
    doc.text("Sous-total", 140, y + 10, { align: 'right' });
    doc.text(`${totalHT.toFixed(2)} €`, 190, y + 10, { align: 'right' });

    doc.text("T.V.A.", 140, y + 20, { align: 'right' });
    doc.text("0 €", 190, y + 20, { align: 'right' });

    doc.text("Total", 140, y + 30, { align: 'right' });
    doc.text(`${totalHT.toFixed(2)} €`, 190, y + 30, { align: 'right' });

    // Note sur la TVA
    doc.setFontSize(10);
    doc.text("1. Association sans but lucratif exonérée de TVA en application des articles 206, 1 bis et 261, 7 du Code général des impôts.", 15, y + 50);

    // Informations bancaires
    doc.text("IBAN : FR76 1360 6000 2946 3182 9631 632", 15, y + 60);
    doc.text("BIC – Swift : AGRIFRPP836", 15, y + 67);

    // Sauvegarder le PDF
    doc.save(`Facture_${client.nom}_${vente.date}.pdf`);
}

// Fonction pour calculer la date d'échéance
function getEcheanceDate(dateFacture) {
    const date = new Date(dateFacture);
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString();
}

// Fonctions à implémenter selon votre structure de données
async function getBiereInfo(biereNom) {
    // Récupérer les informations de la bière (ABV, etc.)
    const bieres = await loadData('bieres').catch(() => []);
    return bieres.find(b => b.nom === biereNom) || { abv: 0 };
}

async function getDateConditionnement(lot) {
    // Récupérer la date de conditionnement du lot
    const conditionnements = await loadData('conditionnements').catch(() => []);
    const conditionnement = conditionnements.find(c => c.numeroLot === lot);
    return conditionnement ? conditionnement.date : new Date();
}



// Générer la facture PDF
async function genererFacture() {
    if (!currentClient || currentCommande.length === 0) {
        alert("Veuillez sélectionner un client et ajouter des lignes à la commande.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Charger le logo (assure-toi que le chemin est correct)
    const logo = new Image();
    logo.src = './assets/images/crab-logo.png';

    // Attendre que le logo soit chargé
    await new Promise((resolve) => {
        logo.onload = resolve;
    });

    // Ajouter le logo en haut à gauche
    doc.addImage(logo, 'PNG', 10, 5, 40, 20);

    // Coordonnées du CRAB
    const crabNom = "Association CRAB";
    const crabAdresse = "Adresse du CRAB";
    const crabTelephone = "Téléphone du CRAB";
    const crabEmail = "Email du CRAB";
    const crabSiret = "SIRET du CRAB";
    const crabTva = "N° de TVA du CRAB";
    const crabEntrepositaire = "N° d'entrepositaire agréé du CRAB";

    // En-tête avec les coordonnées du CRAB
    doc.setFontSize(12);
    doc.setTextColor(50); // Couleur sombre pour le texte
    doc.text(crabNom, 60, 10);
    doc.text(crabAdresse, 60, 17);
    doc.text(`Tel: ${crabTelephone}`, 60, 24);
    doc.text(`Email: ${crabEmail}`, 60, 31);
    doc.text(`SIRET: ${crabSiret}`, 60, 38);
    doc.text(`N° de TVA: ${crabTva}`, 60, 45);
    doc.text(`N° Entrepositaire: ${crabEntrepositaire}`, 60, 52);

    // Informations du client
    doc.setTextColor(50);
    doc.text(`Facture - ${currentClient.nom}`, 150, 10, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 17, { align: 'right' });
    doc.text(`Adresse: ${currentClient.adresse}`, 150, 24, { align: 'right' });
    if (currentClient.siret) doc.text(`SIRET: ${currentClient.siret}`, 150, 31, { align: 'right' });

    // Titre de la facture
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204); // Bleu pour le titre
    doc.text("FACTURE", 105, 60, { align: 'center' });

    // Tableau des lignes de commande
    const startY = 70;
    doc.setFontSize(12);
    doc.setTextColor(50);

    // En-tête du tableau
    doc.setDrawColor(0, 102, 204); // Bleu pour les lignes
    doc.setLineWidth(0.5);
    doc.line(10, startY, 200, startY); // Ligne horizontale

    doc.text("Article", 20, startY + 5);
    doc.text("Libellé court", 50, startY + 5);
    doc.text("Lot", 80, startY + 5);
    doc.text("Quantité", 110, startY + 5);
    doc.text("P.U. HT", 140, startY + 5);
    doc.text("Montant HT", 170, startY + 5);

    let y = startY + 10;
    let totalHT = 0;

    // Lignes du tableau
    currentCommande.forEach(ligne => {
        const contenant = TYPES_CONTENANTS.find(c => c.id === ligne.typeContenant);
        const montantHT = ligne.quantite * ligne.prixUnitaire;
        totalHT += montantHT;

        doc.text(ligne.biere, 20, y);
        doc.text(`${contenant.nom}`, 50, y);
        doc.text(ligne.lot, 80, y);
        doc.text(ligne.quantite.toString(), 110, y);
        doc.text(ligne.prixUnitaire.toFixed(2), 140, y);
        doc.text(montantHT.toFixed(2), 170, y);

        doc.line(10, y + 2, 200, y + 2); // Ligne horizontale sous chaque ligne de tableau
        y += 10;
    });

    // Ligne de total HT
    doc.setFont("helvetica", "bold");
    doc.text("Total HT:", 140, y + 7);
    doc.text(totalHT.toFixed(2), 170, y + 7);
    doc.line(140, y + 8, 200, y + 8); // Ligne horizontale sous le total HT

    // TVA et Total TTC
    const tvaRate = 0.20; // Taux de TVA à 20%
    const tvaAmount = totalHT * tvaRate;
    const totalTTC = totalHT + tvaAmount;

    doc.text("TVA (20%):", 140, y + 14);
    doc.text(tvaAmount.toFixed(2), 170, y + 14);
    doc.text("Total TTC:", 140, y + 21);
    doc.text(totalTTC.toFixed(2), 170, y + 21);
    doc.line(140, y + 22, 200, y + 22); // Ligne horizontale sous le total TTC

    // Pied de page
    doc.setFontSize(10);
    doc.setTextColor(100); // Gris pour le pied de page
    doc.text("Date d'échéance: 30/11/2025", 10, y + 35);
    doc.text("Mode de règlement: Virement bancaire", 10, y + 42);
    doc.text("IBAN: FR76 30001007941234567890144", 10, y + 49);
    doc.text("BIC: CMCIFRPP", 10, y + 56);

    // Sauvegarder le PDF
    doc.save(`facture_${currentClient.nom}_${new Date().toISOString().split('T')[0]}.pdf`);
}


// Afficher l'historique des ventes
async function afficherVentes() {
    const tbody = document.querySelector('#table-ventes tbody');
    tbody.innerHTML = '';
    const ventes = await loadData('ventes').catch(() => []);

    if (ventes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Aucune vente enregistrée</td></tr>';
        return;
    }

    for (const vente of ventes) {
        const clients = await loadData('clients').catch(() => []);
        const client = clients.find(c => c.id == vente.clientId);
        const total = vente.total !== undefined ? vente.total.toFixed(2) : '0.00';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vente.date}</td>
            <td>${client ? client.nom : 'Inconnu'}</td>
            <td>${total}</td>
            <td>
                <button class="btn btn-info" onclick="genererFactureDepuisVente('${vente.id}')">
                    <i class="material-icons">picture_as_pdf</i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    }
}



// Écouteurs d'événements
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, écouteurs attachés"); // Log pour vérifier que le DOM est bien chargé

    // Charger les données
    chargerClients();
    chargerBieres();
    chargerBieresFiltre();
    chargerTypesContenants();
    afficherVentes();
    afficherStocksDisponibles(); // Afficher les stocks dispos

    // Écouteurs d'événements
    const selectClient = document.getElementById('select-client');
    const btnNouveauClient = document.getElementById('btn-nouveau-client');
    const closeModalClient = document.querySelector('#modale-client .close');
    const btnEnregistrerClient = document.getElementById('btn-enregistrer-client');
    const btnAjouterLigne = document.getElementById('btn-ajouter-ligne');
    const btnValiderCommande = document.getElementById('btn-valider-commande');
    const btnGenererFacture = document.getElementById('btn-generer-facture');
    document.getElementById('select-biere-commande').addEventListener('change', afficherStocksDisponibles);
    document.getElementById('select-type-contenant-commande').addEventListener('change', afficherStocksDisponibles);


    // Bouton pour masquer/afficher la section "Stocks Disponibles"
    const btnToggleTableStocks = document.getElementById('btn-toggle-table-stocks');
    const tableStocksContainer = document.getElementById('table-stocks-container');

    if (!btnToggleTableStocks) {
        console.error("Élément btn-toggle-table-stocks non trouvé.");
    }

    if (!tableStocksContainer) {
        console.error("Élément table-stocks-container non trouvé.");
    }

    if (btnToggleTableStocks) {
        btnToggleTableStocks.addEventListener('click', toggleTableStocks);
    }

     // Sélection d'une bière ou d'un contenant
    document.getElementById('select-biere-commande').addEventListener('change', afficherStockDisponible);
    document.getElementById('select-type-contenant-commande').addEventListener('change', afficherStockDisponible);

    // Filtrer les stocks par bière
    document.getElementById('select-filtre-biere').addEventListener('change', function() {
        afficherStocksDisponibles(this.value);
    });

    if (selectClient) {
        selectClient.addEventListener('change', function() {
            console.log("Client sélectionné :", this.value); // Log pour vérifier que l'événement est déclenché
            afficherInfosClient(this.value);
        });
    }

    if (btnNouveauClient) {
        btnNouveauClient.addEventListener('click', function() {
            console.log("Bouton Nouveau Client cliqué"); // Log pour vérifier que l'événement est déclenché
            ouvrirModaleClient();
        });
    }

    if (closeModalClient) {
        closeModalClient.addEventListener('click', function() {
            console.log("Fermer modale client"); // Log pour vérifier que l'événement est déclenché
            fermerModaleClient();
        });
    }

    if (btnEnregistrerClient) {
        btnEnregistrerClient.addEventListener('click', function() {
            console.log("Bouton Enregistrer Client cliqué"); // Log pour vérifier que l'événement est déclenché
            enregistrerClient();
        });
    }

    if (btnAjouterLigne) {
        btnAjouterLigne.addEventListener('click', ajouterLigneCommande);
    } else {
        console.error("Élément btn-ajouter-ligne non trouvé.");
    }

    if (btnValiderCommande) {
        btnValiderCommande.addEventListener('click', function() {
            console.log("Bouton Valider Commande cliqué"); // Log pour vérifier que l'événement est déclenché
            validerCommande();
        });
    }

    if (btnGenererFacture) {
        btnGenererFacture.addEventListener('click', function() {
            console.log("Bouton Générer Facture cliqué"); // Log pour vérifier que l'événement est déclenché
            genererFacture();
        });
    }
});

