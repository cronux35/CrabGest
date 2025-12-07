// Exemple : Charger et afficher les stocks
document.addEventListener('DOMContentLoaded', () => {
  const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
  const tbody = document.querySelector('#stocks-table tbody');
  tbody.innerHTML = stocks.map(stock => `
    <tr>
      <td>${stock.Type}</td>
      <td>${stock.Nom}</td>
      <td>${stock['Numéro de lot']}</td>
      <td>${stock['Qté restante (g)']} g</td>
      <td>${stock.Fournisseur}</td>
      <td>${stock.Peremption || '-'}</td>
      <td>
        <button onclick="editStock('${stock.id}')">✏️</button>
        <button onclick="deleteStock('${stock.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');

  // Ajouter un ingrédient
  document.getElementById('form-add-ingredient').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const stock = Object.fromEntries(formData.entries());
    stock.id = `${stock.Type}::${stock.Fournisseur}::${stock.Nom}::${stock['Numéro de lot'] || 'no-lot'}`;
    stock['Qté utilisée (g)'] = 0;
    stock['Qté restante (g)'] = parseFloat(stock['Qté initiale (g)']);

    stocks.push(stock);
    localStorage.setItem('stocks', JSON.stringify(stocks));
    e.target.reset();
    document.getElementById('modal-add-ingredient').style.display = 'none';
    location.reload();
  });
});

// Fonctions editStock et deleteStock à implémenter
function editStock(id) { console.log("Éditer", id); }
function deleteStock(id) { console.log("Supprimer", id); }
