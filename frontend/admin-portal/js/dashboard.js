document.addEventListener('DOMContentLoaded', () => {
  initAvatarMenu();

  // Awaiting your data input to run these rendering functions
  // renderSidebarLinks(yourSidebarData);
  // renderKPIs(yourKPIData);
  // renderAlertsWidget(yourAlertsData);
  // renderTopStoresWidget(yourStoresData);
  // renderPrimaryData(yourMainData);
});

// Avatar Slide-In Logic
function initAvatarMenu() {
  const avatarBtn = document.getElementById('avatar-btn');
  const closeBtn = document.getElementById('close-user-menu');
  const menu = document.getElementById('user-slide-menu');
  const overlay = document.getElementById('user-menu-overlay');

  function openMenu() {
    menu.classList.add('open');
    overlay.classList.add('active');
  }

  function closeMenu() {
    menu.classList.remove('open');
    overlay.classList.remove('active');
  }

  if(avatarBtn) avatarBtn.addEventListener('click', openMenu);
  if(closeBtn) closeBtn.addEventListener('click', closeMenu);
  if(overlay) overlay.addEventListener('click', closeMenu);
}

// ------------------------------------------------------------------
// DATA RENDERING FUNCTIONS (AWAITING YOUR INPUT)
// ------------------------------------------------------------------

function renderUserOptions(userData, optionsList) {
    // How do you want the user profile data structured?
}

function renderSidebarLinks(linksData) {
    // What links should be in the persistent left navigation?
}

function renderKPIs(kpiData) {
    // What exact KPIs do you want displayed in the top row?
}

function renderAlertsWidget(alertsData) {
    // Please provide the JSON structure for the Inventory Alerts block
}

function renderTopStoresWidget(storesData) {
    // Please provide the JSON structure for the Top Stores block
}

function renderPrimaryData(mainData) {
   // Please provide the JSON structure for the heatmap or main tables
}