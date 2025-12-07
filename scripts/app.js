// Gestion du menu principal
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.app-section').forEach(section => {
      section.classList.remove('active');
    });
    document.querySelectorAll('.menu-btn').forEach(b => {
      b.classList.remove('active');
    });
    const sectionId = btn.id.replace('menu-', 'section-');
    document.getElementById(sectionId).classList.add('active');
    btn.classList.add('active');
  });
});

// Afficher les modales
function showAddIngredientForm() {
  document.getElementById('modal-add-ingredient').style.display = 'block';
}

// Fermer les modales
document.querySelectorAll('.modal-close').forEach(close => {
  close.addEventListener('click', () => {
    close.parentElement.parentElement.style.display = 'none';
  });
});

// Fermer les modales en cliquant à l'extérieur
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});
