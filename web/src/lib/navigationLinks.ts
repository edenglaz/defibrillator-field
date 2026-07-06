/** קישורי ניווט — Google Maps + Waze (מקביל לאפליקציה סלולרית) */

export function googleMapsNavUrl(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}&travelmode=bicycling`;
}

export function wazeNavUrl(destLat: number, destLon: number): string {
  return `https://waze.com/ul?ll=${destLat},${destLon}&navigate=yes`;
}

export function openNavigation(destLat: number, destLon: number, originLat?: number, originLon?: number) {
  if (originLat != null && originLon != null) {
    window.open(googleMapsNavUrl(originLat, originLon, destLat, destLon), '_blank');
  }
  window.open(wazeNavUrl(destLat, destLon), '_blank');
}
