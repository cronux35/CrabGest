// Exemple : Initialiser les graphiques
document.addEventListener('DOMContentLoaded', () => {
  const fermentationData = JSON.parse(localStorage.getItem('fermentation')) || [];

  // Graphique de densité
  new Chart(document.getElementById('densite-chart'), {
    type: 'line',
    data: {
      labels: fermentationData.map(f => f.date),
      datasets: [{
        label: 'Densité',
        data: fermentationData.map(f => f.densite),
        borderColor: '#FFD300',
        tension: 0.1
      }]
    }
  });

  // Graphique de température
  new Chart(document.getElementById('temperature-chart'), {
    type: 'line',
    data: {
      labels: fermentationData.map(f => f.date),
      datasets: [{
        label: 'Température (°C)',
        data: fermentationData.map(f => f.temperature),
        borderColor: '#EF4444',
        tension: 0.1
      }]
    }
  });
});
