const map = L.map('map').setView([-23.55052, -46.633308], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

const searchBox = document.getElementById("search-box");
const searchBtn = document.getElementById("search-button");
const mapActionBtn = document.getElementById("map-action-btn");
const autocompleteList = document.getElementById("autocomplete-list");
let lastMarker = null;

function toggleButtonVisibility(show) {
  mapActionBtn.style.display = show ? 'flex' : 'none';
}

map.on('click', function () {
  toggleButtonVisibility(mapActionBtn.style.display === 'none');
});

// Aciona a busca ao clicar no botão
searchBtn.addEventListener("click", function () {
  const searchText = searchBox.value.trim();
  if (!searchText) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&q=${encodeURIComponent(searchText)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        const place = data[0];
        const lat = place.lat;
        const lon = place.lon;

        if (lastMarker) map.removeLayer(lastMarker);
        lastMarker = L.marker([lat, lon]).addTo(map)
          .bindPopup(`Local encontrado: ${place.display_name}`).openPopup();

        map.setView([lat, lon], 13);
        toggleButtonVisibility(true);
      } else {
        alert("Local não encontrado.");
      }
    });
});

// Autocomplete (só Brasil)
searchBox.addEventListener("input", function () {
  const searchText = this.value.trim();
  autocompleteList.innerHTML = "";

  if (searchText.length < 3) return;

  fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&q=${encodeURIComponent(searchText)}`)
    .then(res => res.json())
    .then(data => {
      autocompleteList.innerHTML = ""; // Limpa antes de popular
      data.slice(0, 5).forEach(item => {
        const div = document.createElement("div");
        div.className = "autocomplete-suggestion";
        div.textContent = item.display_name;
        div.addEventListener("click", () => {
          searchBox.value = item.display_name;
          autocompleteList.innerHTML = "";

          map.setView([item.lat, item.lon], 13);

          if (lastMarker) map.removeLayer(lastMarker);
          lastMarker = L.marker([item.lat, item.lon])
            .addTo(map)
            .bindPopup(`Local encontrado: ${item.display_name}`)
            .openPopup();

          toggleButtonVisibility(true);
        });
        autocompleteList.appendChild(div);
      });
    });
});

// Fecha lista se clicar fora
document.addEventListener("click", (e) => {
  if (!searchBox.contains(e.target) && !autocompleteList.contains(e.target)) {
    autocompleteList.innerHTML = "";
  }
});
