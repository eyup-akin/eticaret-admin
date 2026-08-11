import './AramaKutusu.css';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { Search } from 'lucide-react';

export default function AramaKutusu({ deger, degistir, ipucu = 'Ara...' }) {
  return (
    <div className="arama-kutu">
      <span className="arama-ikon"><Search size={16} /></span>

      <input
        className="arama-input"
        type="text"
        value={deger}
        onChange={(e) => degistir(e.target.value)}
        placeholder={ipucu}
      />
    </div>
  );
}