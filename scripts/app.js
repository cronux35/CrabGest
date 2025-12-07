document.addEventListener('DOMContentLoaded', () => {
  // Gestion du menu hamburger
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('main-menu').classList.toggle('active');
  });

  // Gestion du menu principal
  const menuButtons = document.querySelectorAll('.menu-btn');
  if (menuButtons) {
    menuButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.app-section').forEach(section => {
          section.classList.remove('active');
        });
        document.querySelectorAll('.menu-btn').forEach(b => {
          b.classList.remove('active');
        });
        const sectionId = btn.id.replace('menu-', 'section-');
        const section = document.getElementById(sectionId);
        if (section) {
          section.classList.add('active');
        }
        btn.classList.add('active');
        // Fermer le menu hamburger après sélection
        document.getElementById('main-menu').classList.remove('active');
      });
    });
  }
});

// Fonction pour fermer les modales
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}
