import './AramaKutusu.css';

export default function AramaKutusu({ deger, degistir, ipucu = 'Ara...' }) {
  return (
    <div className="arama-kutu">
      <span className="arama-ikon">🔍</span>

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