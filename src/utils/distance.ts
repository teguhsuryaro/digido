/**
 * Menghitung jarak antara dua koordinat menggunakan rumus Haversine.
 * Mengembalikan jarak dalam kilometer (km).
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Jarak dalam km
  return distance;
}

/**
 * Memformat jarak numerik (km) menjadi teks yang mudah dibaca.
 * Jika < 1 km, tampilkan dalam meter.
 * Jika >= 1 km, tampilkan dalam kilometer dengan 1 desimal.
 */
export function formatDistance(distanceInKm: number): string {
  if (distanceInKm < 1) {
    // Kurang dari 1 km, ubah ke meter
    const meters = Math.round(distanceInKm * 1000);
    return `${meters} m`;
  }
  // 1 km atau lebih, gunakan desimal
  return `${distanceInKm.toFixed(1)} km`;
}
