function ajouterVente() {
    const idConditionnement = document.getElementById('select-conditionnement').value;
    const quantite = parseInt(document.getElementById('quantite-vente').value);
    const prix = parseFloat(document.getElementById('prix-vente').value);
    const nomClient = document.getElementById('nom-client').value;

    if (!idConditionnement || isNaN(quantite) || isNaN(prix) || !nomClient) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const ventes = JSON.parse(localStorage.getItem('ventes'));
    const id = ventes.length > 0 ? Math.max(...ventes.map(v => v.id)) + 1 : 1;
    ventes.push({ id, id_conditionnement: parseInt(idConditionnement), quantite, prix_unitaire: prix, client: { nom: nomClient } });
    localStorage.setItem('ventes', JSON.stringify(ventes));

    // Générer facture
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`Facture #${id}`, 10, 10);
    doc.text(`Client: ${nomClient}`, 10, 20);
    doc.text(`Montant: ${quantite * prix} €`, 10, 30);
    doc.save(`facture_${id}.pdf`);

    alert(`Vente enregistrée et facture générée.`);
}
