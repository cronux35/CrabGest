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

// Afficher le stock disponible
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
    const biereNom = document.getElementById('select-biere-commande').value;
    const typeContenant = document.getElementById('select-type-contenant-commande').value;
    const quantite = parseInt(document.getElementById('quantite-commande').value);
    const prixUnitaire = parseFloat(document.getElementById('prix-unitaire-commande').value);

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
        total: total // Assurez-vous que le total est bien défini
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



// Générer la facture PDF
async function genererFacture() {
    if (!currentClient || currentCommande.length === 0) {
        alert("Veuillez sélectionner un client et ajouter des lignes à la commande.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

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
    doc.text(crabNom, 10, 10);
    doc.text(crabAdresse, 10, 17);
    doc.text(`Tel: ${crabTelephone}`, 10, 24);
    doc.text(`Email: ${crabEmail}`, 10, 31);
    doc.text(`SIRET: ${crabSiret}`, 10, 38);
    doc.text(`N° de TVA: ${crabTva}`, 10, 45);
    doc.text(`N° Entrepositaire: ${crabEntrepositaire}`, 10, 52);

    // Informations du client
    doc.text(`Facture - ${currentClient.nom}`, 105, 10, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 17, { align: 'right' });
    doc.text(`Adresse: ${currentClient.adresse}`, 105, 24, { align: 'right' });
    if (currentClient.siret) doc.text(`SIRET: ${currentClient.siret}`, 105, 31, { align: 'right' });

    // Titre de la facture
    doc.setFontSize(16);
    doc.text("FACTURE", 105, 60, { align: 'center' });

    // Tableau des lignes de commande
    const startY = 70;
    doc.setFontSize(12);
    doc.text("Article", 10, startY);
    doc.text("Libellé court", 40, startY);
    doc.text("Lot", 70, startY);
    doc.text("Quantité", 90, startY);
    doc.text("P.U. HT", 110, startY);
    doc.text("Montant HT", 150, startY);

    let y = startY + 7;
    let totalHT = 0;

    currentCommande.forEach(ligne => {
        const contenant = TYPES_CONTENANTS.find(c => c.id === ligne.typeContenant);
        const montantHT = ligne.quantite * ligne.prixUnitaire;
        totalHT += montantHT;

        doc.text(ligne.biere, 10, y);
        doc.text(`${contenant.nom}`, 40, y);
        doc.text(ligne.lot, 70, y); // Ajout du numéro de lot
        doc.text(ligne.quantite.toString(), 90, y);
        doc.text(ligne.prixUnitaire.toFixed(2), 110, y);
        doc.text(montantHT.toFixed(2), 150, y);

        y += 7;
    });

    // Ligne de total HT
    doc.setFont("helvetica", "bold");
    doc.text("Total HT:", 110, y + 7);
    doc.text(totalHT.toFixed(2), 150, y + 7);

    // TVA et Total TTC
    const tvaRate = 0.20; // Taux de TVA à 20%
    const tvaAmount = totalHT * tvaRate;
    const totalTTC = totalHT + tvaAmount;

    doc.text("TVA (20%):", 110, y + 14);
    doc.text(tvaAmount.toFixed(2), 150, y + 14);

    doc.text("Total TTC:", 110, y + 21);
    doc.text(totalTTC.toFixed(2), 150, y + 21);

    // Pied de page
    doc.setFontSize(10);
    doc.text("Date d'échéance: 30/11/2025", 10, y + 35);
    doc.text("Mode de règlement: Virement bancaire", 10, y + 42);
    doc.text("IBAN: FR76 3000 1007 9412 3456 7890 144", 10, y + 49);
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
        // Vérifiez que le total est défini, sinon utilisez 0
        const total = vente.total !== undefined ? vente.total.toFixed(2) : '0.00';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vente.date}</td>
            <td>${client ? client.nom : 'Inconnu'}</td>
            <td>${total}</td>
            <td>
                <button class="btn btn-info" data-vente-id="${vente.id}">
                    <i class="material-icons">visibility</i>
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
    chargerTypesContenants();
    afficherVentes();

    // Écouteurs d'événements
    const selectClient = document.getElementById('select-client');
    const btnNouveauClient = document.getElementById('btn-nouveau-client');
    const closeModalClient = document.querySelector('#modale-client .close');
    const btnEnregistrerClient = document.getElementById('btn-enregistrer-client');
    const btnAjouterLigne = document.getElementById('btn-ajouter-ligne');
    const btnValiderCommande = document.getElementById('btn-valider-commande');
    const btnGenererFacture = document.getElementById('btn-generer-facture');
    document.getElementById('select-biere-commande').addEventListener('change', afficherStockDisponible);
    document.getElementById('select-type-contenant-commande').addEventListener('change', afficherStockDisponible);

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
        btnAjouterLigne.addEventListener('click', function() {
            console.log("Bouton Ajouter Ligne cliqué"); // Log pour vérifier que l'événement est déclenché
            ajouterLigneCommande();
        });
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

