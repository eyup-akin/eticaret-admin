
import { SUNUCU_URL } from '../services/config';

// Backend göreli yol döndürüyor:  "/uploads/urunler/a3f9.jpg"
// Tarayıcının ihtiyacı olan tam adres: "http://localhost:5289/uploads/urunler/a3f9.jpg"
export function resimUrl(yol) {
  if (!yol) {
    return null;
  }

  // Zaten tam adresse dokunma
  if (yol.startsWith('http')) {
    return yol;
  }

  return SUNUCU_URL + yol;
}