import { useEffect, useState } from 'react';

import { apiGet } from '../../services/api';
import { tarihBicimle } from '../../utils/bicimlendir';

import AramaKutusu from '../AramaKutusu';
import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import Sayfalama from '../Sayfalama';
import Buton from '../Buton';

import { Code2 } from 'lucide-react';

// ============================================================
//  HATA SEKMESİ — 500 dönen istekler
//
//  ⚠️ Yığın izi (stack trace) LİSTEDE GELMİYOR, yalnızca "Detay"a
//  basınca ayrı bir istekle çekiliyor. Sayfa başına 25 tam yığın izi
//  taşımak, ekranın kendisini yavaşlatan bir cevap üretirdi.
// ============================================================
export default function HataSekmesi({ baslangic, bitis }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [arama, setArama] = useState('');

  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(25);

  // Açık olan detayın id'si ve içeriği.
  //
  // ⚠️ Tek bir detay açık tutuluyor: hepsini birden açık tutmak
  // sayfayı okunmaz hale getirirdi ve her biri ayrı istek demekti.
  const [acikId, setAcikId] = useState(null);
  const [detay, setDetay] = useState(null);

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (arama.trim() !== '') p.append('arama', arama.trim());
      if (baslangic !== '') p.append('baslangic', baslangic);
      if (bitis !== '') p.append('bitis', bitis);

      p.append('page', sayfa);
      p.append('pageSize', sayfaBoyutu);

      setVeri(await apiGet('/admin/loglar/hatalar?' + p.toString()));
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    const sayac = setTimeout(getir, 400);

    return () => clearTimeout(sayac);
  }, [arama, baslangic, bitis, sayfa, sayfaBoyutu]);

  useEffect(() => {
    setSayfa(1);
  }, [arama, baslangic, bitis, sayfaBoyutu]);

  // Sayfa değişince açık detayı kapat: aksi hâlde listede olmayan bir
  // kaydın yığın izi ekranda asılı kalırdı.
  useEffect(() => {
    setAcikId(null);
    setDetay(null);
  }, [sayfa, arama, baslangic, bitis]);

  async function detayAcKapat(id) {
    if (acikId === id) {
      setAcikId(null);
      setDetay(null);
      return;
    }

    setAcikId(id);
    setDetay(null);

    try {
      setDetay(await apiGet('/admin/loglar/hatalar/' + id));
    } catch (e) {
      setHata(e.message);
    }
  }

  const sutunlar = [
    {
      baslik: 'İstek',
      hucre: (k) => (
        <span className="log-yol">
          <b>{k.yontem}</b> {k.yol}
        </span>
      ),
    },
    {
      baslik: 'Hata',
      hucre: (k) => <span className="log-hata-metin">{k.mesaj}</span>,
    },
    {
      baslik: 'Kullanıcı',

      // ⚠️ Yalnızca id gösteriliyor, ad değil: hata anında kullanıcı
      // satırını okumak için her satırda bir JOIN gerekirdi ve o
      // kullanıcı silinmiş de olabilir. Kimliksiz isteklerde "—".
      hucre: (k) =>
        k.kullaniciId ? '#' + k.kullaniciId : <span className="denetim-bos">—</span>,
    },
    {
      baslik: 'IP',
      hucre: (k) => k.ip || <span className="denetim-bos">—</span>,
    },
    { baslik: 'Ne Zaman', hucre: (k) => tarihBicimle(k.tarih) },
    {
      baslik: '',
      hizala: 'sag',
      hucre: (k) =>
        k.yiginIziVar ? (
          <Buton
            tip="ikincil"
            boyut="kucuk"
            ikonRengi="ana"
            onClick={() => detayAcKapat(k.id)}
          >
            <Code2 size={14} /> {acikId === k.id ? 'Gizle' : 'Yığın İzi'}
          </Buton>
        ) : null,
    },
  ];

  return (
    <>
      <div className="filtre-cubugu">
        <div className="filtre-grup" style={{ flex: 1, minWidth: 220 }}>
          <span className="filtre-etiket">Ara</span>

          <AramaKutusu
            deger={arama}
            degistir={setArama}
            ipucu="İstek yolu veya hata mesajı..."
          />
        </div>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={getir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Hata kayıtları getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={veri?.kayitlar ?? []}
            anahtar={(k) => k.id}
            bosMesaj="Bu aralıkta sunucu hatası yok. İyi haber."
          />

          {/* ⚠️ Yığın izi TABLONUN ALTINDA, satır içinde değil.
              Tablo bileşeni açılır satır desteklemiyor ve onu
              eklemek, tek bir ekran için ortak bileşeni
              karmaşıklaştırmak olurdu. */}
          {acikId !== null && (
            <div className="kart" style={{ marginTop: 'var(--bosluk4)' }}>
              {detay === null ? (
                <Yukleniyor yazi="Yığın izi getiriliyor..." />
              ) : (
                <>
                  <div className="log-not" style={{ marginTop: 0 }}>
                    Kayıt #{detay.id} — <b>{detay.yontem}</b> {detay.yol}
                  </div>

                  <pre className="log-yigin">{detay.yiginIzi}</pre>
                </>
              )}
            </div>
          )}

          <Sayfalama
            sayfa={sayfa}
            toplamSayfa={veri?.toplamSayfa ?? 1}
            toplam={veri?.toplam ?? 0}
            sayfaBoyutu={sayfaBoyutu}
            sayfaDegistir={setSayfa}
            boyutDegistir={setSayfaBoyutu}
          />

          {veri?.toplamAsildi && (
            <div className="log-not">
              1000'den fazla kayıt var — tam sayı hesaplanmıyor.
            </div>
          )}
        </>
      )}
    </>
  );
}
