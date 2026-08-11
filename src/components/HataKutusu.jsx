import './HataKutusu.css';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { AlertTriangle } from 'lucide-react';

// mesaj: gösterilecek hata metni
// tekrarDene: (opsiyonel) "Tekrar Dene" butonuna basınca çalışacak fonksiyon
export default function HataKutusu({ mesaj, tekrarDene }) {
  return (
    <div className="hata-kutusu">
      <span><AlertTriangle size={16} /></span>

      <span className="hata-mesaj">{mesaj}</span>

      {tekrarDene && (
        <button className="hata-tekrar-buton" onClick={tekrarDene}>
          Tekrar Dene
        </button>
      )}
    </div>
  );
}