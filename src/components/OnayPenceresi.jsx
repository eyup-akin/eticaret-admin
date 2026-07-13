import Buton from './Buton';
import './OnayPenceresi.css';

// acik    : true/false — pencere görünsün mü
// baslik  : "Ürünü sil"
// mesaj   : "Bu işlem geri alınamaz..."
// onayla  : "Evet, Sil" butonuna basınca çalışacak fonksiyon
// iptal   : "Vazgeç" butonuna basınca çalışacak fonksiyon
// islemde : true ise butonlar kilitlenir
export default function OnayPenceresi({
  acik,
  baslik,
  mesaj,
  onayla,
  iptal,
  islemde = false,
}) {
  // Kapalıysa hiçbir şey çizme
  if (!acik) {
    return null;
  }

  return (
    <div className="onay-perde" onClick={iptal}>
      {/* stopPropagation: kutunun İÇİNE tıklayınca pencere kapanmasın */}
      <div className="onay-kutu" onClick={(e) => e.stopPropagation()}>

        <div className="onay-baslik">{baslik}</div>
        <div className="onay-mesaj">{mesaj}</div>

        <div className="onay-butonlar">
          <Buton tip="ikincil" onClick={iptal} disabled={islemde}>
            Vazgeç
          </Buton>

          <Buton tip="tehlike" onClick={onayla} disabled={islemde}>
            {islemde ? 'Siliniyor...' : 'Evet, Sil'}
          </Buton>
        </div>

      </div>
    </div>
  );
}