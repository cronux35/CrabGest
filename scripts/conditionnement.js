// Types de contenants disponibles
const TYPES_CONTENANTS = [
    { id: 'canette_44cl', nom: 'Canette 44cl', volume: 0.44, code: 'C44' },
    { id: 'canette_33cl', nom: 'Canette 33cl', volume: 0.33, code: 'C33' },
    { id: 'bouteille_33cl', nom: 'Bouteille 33cl', volume: 0.33, code: 'B33' },
    { id: 'bouteille_50cl', nom: 'Bouteille 50cl', volume: 0.50, code: 'B50' },
    { id: 'bouteille_75cl', nom: 'Bouteille 75cl', volume: 0.75, code: 'B75' },
    { id: 'fut_sodakeg_19l', nom: 'Fût SodaKeg 19L', volume: 19, code: 'FS19' },
    { id: 'fut_20l', nom: 'Fût 20L', volume: 20, code: 'F20' }
];

// Générer un numéro de lot unique
function genererNumeroLot(biereNom, typeContenant, date) {
    const biereCode = biereNom.substring(0, 2).toUpperCase();
    const contenant = TYPES_CONTENANTS.find(c => c.id === typeContenant);
    const contenantCode = contenant ? contenant.code : 'XX';
    const dateCode = new Date(date).toISOString().substring(2, 10).replace(/-/g, '');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${biereCode}-${contenantCode}-${dateCode}-${randomCode}`;
}

// Charger les bières dans le sélecteur
async function chargerSelecteurBieresConditionnement() {
    const select = document.getElementById('select-biere-conditionnement');
    const listbox = document.getElementById('listbox-bieres');
    const bieres = await loadData('bieres').catch(() => []);
    select.innerHTML = '';
    listbox.innerHTML = '';

    // Ajouter une option vide pour "Toutes les bières"
    const optionToutes = document.createElement('option');
    optionToutes.value = "";
    optionToutes.textContent = "-- Toutes les bières --";
    listbox.appendChild(optionToutes);

    bieres.forEach(biere => {
        const option = document.createElement('option');
        option.value = biere.nom;
        option.textContent = biere.nom;
        select.appendChild(option);
        const optionListbox = document.createElement('option');
        optionListbox.value = biere.nom;
        optionListbox.textContent = biere.nom;
        listbox.appendChild(optionListbox);
    });
}

// Charger les types de contenants dans le sélecteur
function chargerSelecteurContenants() {
    const select = document.getElementById('type-contenant');
    select.innerHTML = '';
    TYPES_CONTENANTS.forEach(contenant => {
        const option = document.createElement('option');
        option.value = contenant.id;
        option.textContent = contenant.nom;
        select.appendChild(option);
    });
}

// Ouvrir la modale d'ajout
function ouvrirModaleAjoutConditionnement() {
    document.getElementById('modale-conditionnement').style.display = 'block';
    // Réattacher les écouteurs si nécessaire
    document.querySelector('#modale-conditionnement .close').onclick = closeConditionnementModal;
}

// Fermer la modale
function fermerModaleConditionnement() {
    closeConditionnementModal();
}

// Ajouter un conditionnement
async function ajouterConditionnement() {
    const biereNom = document.getElementById('select-biere-conditionnement').value;
    const abv = parseFloat(document.getElementById('abv-final').value);
    const typeContenant = document.getElementById('type-contenant').value;
    const quantite = parseInt(document.getElementById('quantite-contenant').value);
    const date = document.getElementById('date-conditionnement').value;

    // Vérifie que tous les champs sont remplis
    if (!biereNom || isNaN(abv) || !typeContenant || isNaN(quantite) || !date) {
        alert("Tous les champs sont obligatoires.");
        return;
    }

    const contenant = TYPES_CONTENANTS.find(c => c.id === typeContenant);
    if (!contenant) {
        alert("Type de contenant invalide.");
        return;
    }

    const volumeTotal = contenant.volume * quantite;
    const numeroLot = genererNumeroLot(biereNom, typeContenant, date);

    const conditionnement = {
        biere: biereNom,
        abv,
        typeContenant,
        quantite,
        volume: volumeTotal,
        date,
        numeroLot
    };

    try {
        await addItem('conditionnements', conditionnement);
        afficherConditionnements();
        closeConditionnementModal();
    } catch (error) {
        console.error("Erreur lors de l'ajout du conditionnement :", error);
        alert("Erreur lors de l'ajout");
    }
}

// Afficher les conditionnements (avec filtre par bière)
async function afficherConditionnements(biereNom = null) {
    const tbody = document.querySelector('#table-conditionnements tbody');
    tbody.innerHTML = '';
    const conditionnements = await loadData('conditionnements').catch(() => []);

    // Filtrer par bière si un nom est fourni
    const conditionnementsFiltres = biereNom
        ? conditionnements.filter(cond => cond.biere === biereNom)
        : conditionnements;

    if (conditionnementsFiltres.length === 0) {
        const message = biereNom
            ? `Aucun conditionnement pour la bière "${biereNom}"`
            : "Aucun conditionnement enregistré";
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">${message}</td></tr>`;
        return;
    }

    conditionnementsFiltres.forEach(cond => {
        if (!cond.biere || !cond.typeContenant) {
            console.error("Conditionnement invalide :", cond);
            return;
        }

        const contenant = TYPES_CONTENANTS.find(c => c.id === cond.typeContenant);
        if (!contenant) {
            console.error(`Type de contenant inconnu : ${cond.typeContenant}`);
            return;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cond.numeroLot || 'N/A'}</td>
            <td>${cond.biere || 'N/A'}</td>
            <td>${cond.abv || 'N/A'}</td>
            <td>${contenant.nom || 'N/A'}</td>
            <td>${cond.quantite || 'N/A'}</td>
            <td>${cond.volume ? cond.volume.toFixed(2) : 'N/A'}</td>
            <td>${cond.date ? new Date(cond.date).toLocaleDateString() : 'N/A'}</td>
            <td>
                <button onclick="supprimerConditionnement('${cond.id}')" class="btn btn-danger">
                    <i class="material-icons">delete</i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Supprimer un conditionnement
async function supprimerConditionnement(id) {
    try {
        await deleteData('conditionnements', id);
        const listbox = document.getElementById('listbox-bieres');
        const biereNom = listbox.value;
        afficherConditionnements(biereNom === "" ? null : biereNom);
    } catch (error) {
        console.error("Erreur suppression conditionnement:", error);
        alert("Erreur lors de la suppression");
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    chargerSelecteurBieresConditionnement();
    chargerSelecteurContenants();
    afficherConditionnements();
    document.getElementById('date-conditionnement').valueAsDate = new Date();

    // Écouteur pour le filtre dynamique
    document.getElementById('listbox-bieres').addEventListener('change', function() {
        const biereNom = this.value;
        afficherConditionnements(biereNom === "" ? null : biereNom);
    });
});
