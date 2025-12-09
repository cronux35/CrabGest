function ajouterVente() {
    const idConditionnement = document.getElementById('select-conditionnement')?.value;
    const quantite = parseInt(document.getElementById('quantite-vente')?.value);
    const prix = parseFloat(document.getElementById('prix-vente')?.value);
    const nomClient = document.getElementById('nom-client')?.value;

    if (!idConditionnement || isNaN(quantite) || isNaN(prix) || !nomClient) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const conditionnements = JSON.parse(localStorage.getItem('conditionnements') || '[]');
    const conditionnement = conditionnements.find(c => c.id == idConditionnement);
    const ventes = JSON.parse(localStorage.getItem('ventes') || '[]');
    const id = ventes.length > 0 ? Math.max(...ventes.map(v => v.id)) + 1 : 1;
    ventes.push({
        id,
        id_conditionnement: parseInt(idConditionnement),
        nom_conditionnement: conditionnement?.nom_biere || 'Inconnu',
        quantite,
        prix_unitaire: prix,
        client: { nom: nomClient },
        date: new Date().toISOString()
    });
    localStorage.setItem('ventes', JSON.stringify(ventes));

    // Générer facture
    if (window.jspdf) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`Facture #${id}`, 10, 10);
        doc.text(`Client: ${nomClient}`, 10, 20);
        doc.text(`Produit: ${conditionnement?.nom_biere || 'Inconnu'} (${quantite} x ${prix}€)`, 10, 30);
        doc.text(`Total: ${quantite * prix}€`, 10, 40);
        doc.save(`facture_${id}.pdf`);
    }

    if (typeof afficherVentes === 'function') afficherVentes();
    alert(`Vente enregistrée et facture générée.`);
}

function afficherVentes() {
    const ventes = JSON.parse(localStorage.getItem('ventes') || '[]');
    const tbody = document.querySelector('#table-ventes tbody');
    if (tbody) {
        tbody.innerHTML = ventes.map(vente => `
            <tr>
                <td>${vente.id || ''}</td>
                <td>${vente.nom_conditionnement || ''}</td>
                <td>${vente.quantite || 0}</td>
                <td>${vente.prix_unitaire || 0}€</td>
                <td>${vente.client?.nom || ''}</td>
                <td>
                    <button class="action-btn" onclick="openEditModal('vente', ${vente.id}, '${JSON.stringify(vente).replace(/'/g, "\\'")}')">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="action-btn delete" onclick="openDeleteModal('Voulez-vous vraiment supprimer cette vente ?', () => supprimerVente(${vente.id}))">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function supprimerVente(id) {
    let ventes = JSON.parse(localStorage.getItem('ventes') || '[]');
    ventes = ventes.filter(vente => vente.id != id);
    localStorage.setItem('ventes', JSON.stringify(ventes));
    if (typeof afficherVentes === 'function') afficherVentes();
}

document.addEventListener('DOMContentLoaded', () => {
    const conditionnements = JSON.parse(localStorage.getItem('conditionnements') || '[]');
    const selectConditionnement = document.getElementById('select-conditionnement');
    if (selectConditionnement) {
        selectConditionnement.innerHTML = '<option value="">-- Conditionnement --</option>';
        conditionnements.forEach(cond => {
            const option = document.createElement('option');
            option.value = cond.id;
            option.textContent = `${cond.nom_biere || 'Inconnu'} (${cond.volume_litres || 0}L, ${cond.abv || 0}°)`;
            selectConditionnement.appendChild(option);
        });
    }
    if (typeof afficherVentes === 'function') afficherVentes();
});
