// Calcul des droits d'accises (taux 2025 : 3.30 €/hl/°)
function calculateDroits(volume, degree) {
  const taux = 3.30;
  return (volume * degree * taux) / 100;
}

// Générer un rapport pour la douane
function generateDouaneReport() {
  const conditionnementData = JSON.parse(localStorage.getItem('conditionnement')) || [];
  let totalVolume = 0;
  let totalDroits = 0;
  const rapport = [];

  conditionnementData.forEach(item => {
    const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
    const recette = recettes.find(r => r.id === item.RecetteId);
    const degree = recette ? recette['Degré alcoolique'] : 5;
    const volume = parseFloat(item.volume_total);
    const droits = calculateDroits(volume, degree);
    rapport.push({ ...item, droits, nom_biere: recette ? recette.Nom : 'Inconnu' });
    totalVolume += volume;
    totalDroits += droits;
  });

  document.getElementById('douane-volume').textContent = `${totalVolume.toFixed(2)} L`;
  document.getElementById('douane-droits').textContent = `${totalDroits.toFixed(2)} €`;

  const tbody = document.querySelector('#douane-table tbody');
  tbody.innerHTML = rapport.map(item => `
    <tr>
      <td>${item.lot}</td>
      <td>${item.nom_biere}</td>
      <td>${item.volume_total} L</td>
      <td>${item.degree || 5}°</td>
      <td>${item.droits.toFixed(2)} €</td>
    </tr>
  `).join('');
}

// Exporter les données pour la douane
function exportDouaneData() {
  const data = JSON.parse(localStorage.getItem('conditionnement')) || [];
  const recettes = JSON.parse(localStorage.getItem('recettes')) || [];
  const csv = [
    ['Lot', 'Bière', 'Volume (L)', 'Degré alcoolique', 'Droits (€)'],
    ...data.map(item => {
      const recette = recettes.find(r => r.id === item.RecetteId);
      const degree = recette ? recette['Degré alcoolique'] : 5;
      return [
        item.lot,
        recette ? recette.Nom : 'Inconnu',
        item.volume_total,
        degree,
        calculateDroits(item.volume_total, degree).toFixed(2)
      ];
    })
  ].map(row => row.join(';')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `declaration-douane-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
