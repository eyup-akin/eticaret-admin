import Buton from './Buton';
import { sayiBicimle } from '../utils/bicimlendir';
import './Sayfalama.css';

// Ödemeler ve Müşteriler sayfalarında da kullanılacak.
export default function Sayfalama({
  sayfa,
  toplamSayfa,
  toplam,
  sayfaBoyutu,
  sayfaDegistir,
  boyutDegistir,
}) {
  // Bu sayfada hangi kayıtlar gösteriliyor? (örn: 11-20 / 47)
  const ilk = toplam === 0 ? 0 : (sayfa - 1) * sayfaBoyutu + 1;
  const son = Math.min(sayfa * sayfaBoyutu, toplam);

  return (
    <div className="sayfalama">
      <div className="sayfalama-bilgi">
        {sayiBicimle(ilk)}–{sayiBicimle(son)} / {sayiBicimle(toplam)} kayıt

        <select
          className="sayfa-boyut"
          style={{ marginLeft: 12 }}
          value={sayfaBoyutu}
          onChange={(e) => boyutDegistir(Number(e.target.value))}
        >
          <option value={10}>10 / sayfa</option>
          <option value={25}>25 / sayfa</option>
          <option value={50}>50 / sayfa</option>
        </select>
      </div>

      <div className="sayfalama-butonlar">
        <Buton
          tip="ikincil"
          boyut="kucuk"
          onClick={() => sayfaDegistir(sayfa - 1)}
          disabled={sayfa <= 1}
        >
          ← Önceki
        </Buton>

        <span className="sayfa-numara">
          {sayfa} / {toplamSayfa === 0 ? 1 : toplamSayfa}
        </span>

        <Buton
          tip="ikincil"
          boyut="kucuk"
          onClick={() => sayfaDegistir(sayfa + 1)}
          disabled={sayfa >= toplamSayfa}
        >
          Sonraki →
        </Buton>
      </div>
    </div>
  );
}