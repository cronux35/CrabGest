// Ajouter une vente
function ajouterVente(vente) {
  const ventes = JSON.parse(localStorage.getItem('ventes')) || [];
  vente.id = `vente_${Date.now()}`;
  vente.date = new Date().toISOString();
  ventes.push(vente);
  localStorage.setItem('ventes', JSON.stringify(ventes));
  renderVentes();
}
