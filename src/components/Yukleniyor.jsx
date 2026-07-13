import './Yukleniyor.css';

// Her sayfada kullanacağız: veri gelene kadar bunu göster.
export default function Yukleniyor({ yazi = 'Yükleniyor...' }) {
  return (
    <div className="yukleniyor-kapsayici">
      <div className="yukleniyor-daire"></div>
      <span className="yukleniyor-yazi">{yazi}</span>
    </div>
  );
}