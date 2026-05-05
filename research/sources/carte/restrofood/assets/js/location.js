/*---------------------------------------------
Template name :  RestroFood
Version       :  1.0.0
Author        :  ThemeLooks
Author url    :  http://themelooks.com

Google API Callback fun
----------------------------------------------*/


function restrofoodInitMap() {

  const input = document.querySelectorAll(".pac-input");

  input.forEach( function( item, i ) {

  const autocomplete = new google.maps.places.Autocomplete(item);
  // Bind the map's bounds (viewport) property to the autocomplete object,
  // so that the autocomplete requests use the current map bounds for the
  // bounds option in the request.

  // Set the data fields to return when the user selects a place.
  autocomplete.setFields(["address_components", "geometry", "icon", "name"]);

  const infowindow = new google.maps.InfoWindow();

  const infowindowContent = document.getElementById("infowindow-content");
  infowindow.setContent(infowindowContent);
  
  autocomplete.addListener("place_changed", () => {
    infowindow.close();

    const place = autocomplete.getPlace();

    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    let address = "";

    if (place.address_components) {
      address = [
        (place.address_components[0] &&
          place.address_components[0].short_name) ||
          "",
        (place.address_components[1] &&
          place.address_components[1].short_name) ||
          "",
        (place.address_components[2] &&
          place.address_components[2].short_name) ||
          "",
      ].join(" ");
    }
    
    infowindowContent.children["place-icon"].src = place.icon;
    infowindowContent.children["place-name"].textContent = place.name;
    infowindowContent.children["place-address"].textContent = address;

  });

  } )

}
