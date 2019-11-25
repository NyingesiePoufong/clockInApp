var x = document.getElementById("demo");
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(showPosition);
} else {
  x.innerHTML = "Geolocation is not supported by this browser.";
}
function showPosition(position) {
  console.log(position.coords)
  document.getElementById('latitude').value = parseInt(position.coords.latitude);
  document.getElementById('longitude').value = parseInt(position.coords.longitude);
  document.getElementById('timelog').value = parseInt(position.timestamp);

  document.getElementById('latitude2').value = parseInt(position.coords.latitude);
  document.getElementById('longitude2').value = parseInt(position.coords.longitude);
  document.getElementById('timelog2').value = parseInt(position.timestamp);
}
