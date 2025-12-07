document.addEventListener('DOMContentLoaded', () => {
  const fermentationData = JSON.parse(localStorage.getItem('fermentation')) || [];

  // Graphique de densité
  const densiteChart = new Chart(document.getElementById('densite-chart'), {
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
  const temperatureChart = new Chart(document.getElementById('temperature-chart'), {
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

function showAddFermentationForm() {
  const formHtml = `
    <div class="modal" id="modal-add-fermentation">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal('modal-add-fermentation')">&times;</span>
        <h3>Ajouter un suivi de fermentation</h3>
        <form id="form-add-fermentation">
          <label>Bière : <input name="nom_biere" required></label>
          <label>Style : <input name="style" required></label>
          <label>Densité : <input type="number" name="densite" step="0.001" required></label>
          <label>Température : <input type="number" name="temperature" step="0.1" required></label>
          <label>pH : <input type="number" name="ph" step="0.1" required></label>
          <label>Purge : <input name="purge"></label>
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', formHtml);
  document.getElementById('modal-add-fermentation').style.display = 'block';

  document.getElementById('form-add-fermentation').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const entry = Object.fromEntries(formData.entries());
    entry.date = new Date().toISOString().split('T')[0];

    const fermentation = JSON.parse(localStorage.getItem('fermentation')) || [];
    fermentation.push(entry);
    localStorage.setItem('fermentation', JSON.stringify(fermentation));
    e.target.reset();
    closeModal('modal-add-fermentation');
    location.reload();
  });
}
