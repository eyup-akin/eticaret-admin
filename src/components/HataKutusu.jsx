import './HataKutusu.css';

// mesaj: gösterilecek hata metni
// tekrarDene: (opsiyonel) "Tekrar Dene" butonuna basınca çalışacak fonksiyon
export default function HataKutusu({ mesaj, tekrarDene }) {
  return (
    <div className="hata-kutusu">
      <span>⚠️</span>

      <span className="hata-mesaj">{mesaj}</span>

      {tekrarDene && (
        <button className="hata-tekrar-buton" onClick={tekrarDene}>
          Tekrar Dene
        </button>
      )}
    </div>
  );
}