export const mapStyles = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#f5f5f5" }] // Base Land: Soft White/Grey
    },
    {
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "visibility": "off" }] // Hide text
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "administrative.land_parcel",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [{ "color": "#eeeeee" }] // POIs blending in
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#ffffff" }] // Roads: Pure White
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#cce3de" }] // Pastel Minty Blue Water
    },
    {
        "featureType": "landscape.natural",
        "elementType": "geometry",
        "stylers": [{ "color": "#e6efe9" }] // Soft Pastel Green Land
    },
    {
        "featureType": "landscape.man_made",
        "elementType": "geometry",
        "stylers": [{ "color": "#f7f7f7" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#d9e8d7" }] // Gentle Green Parks
    },
    {
        "featureType": "transit",
        "stylers": [{ "visibility": "off" }]
    }
];
