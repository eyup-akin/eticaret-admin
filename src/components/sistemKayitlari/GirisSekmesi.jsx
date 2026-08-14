import { useEffect, useState } from 'react';

import { apiGet } from '../../services/api';
import { tarihBicimle } from '../../utils/bicimlendir';

import AramaKutusu from '../AramaKutusu';
import Yukleniyor from '../Yukleniyor';
import HataKutusu from '../HataKutusu';
import Tablo from '../Tablo';
import Sayfalama from '../Sayfalama';

// ============================================================
//  GİRİŞ SEKMESİ
//
//  "Bu hesaba dün gece 40 kez denendi" sorusunun cevabı.
//  Sayaç (User.YanlisGirisSayisi) başarılı girişte sıfırlandığı
//  için o soruyu cevaplayamıyordu.
//
//  ⚠️ ŞİFRE HİÇBİR SATIRDA YOK — yanlış girilen bile kaydedilmiyor.
//  Yanlış şifre çoğu zaman kullanıcının BAŞKA bir hesaptaki doğru
//  şifresidir.
// ============================================================

// Sonuç kodlarının okunabilir karşılıkları.
//
// ⚠️ Renk BİLGİ taşıyor ve buradaki bilgi "endişelenmeli miyim":
//   basarili      → olağan (yeşil)
//   sifre_yanlis  → tek başına olağan, ÜST ÜSTE gelirse değil (turuncu)
//   kullanici_yok → olmayan bir adrese deneme; tarama işareti (kırmızı)
//   hesap_kilitli → koruma devreye girmiş (kırmızı)
//
// ⚠️ 'dogrulanmamis' ve 'hesap_pasif' NÖTR gri: bunlar bir saldırı
// değil, kullanıcının kendi hesap durumu. Kırmızı yapmak yanlış alarm
// üretirdi — "kırmızıyı gerçek soruna sakla".
const SONUC_BILGI = {
  basarili:      { yazi: 'Başarılı',        renk: '#27ae60' },
  sifre_yanlis:  { yazi: 'Şifre Yanlış',    renk: '#d97706' },
  kullanici_yok: { yazi: 'Hesap Yok',       renk: '#dc2626' },
  hesap_kilitli: { yazi: 'Hesap Kilitli',   renk: '#dc2626' },
  hesap_pasif:   { yazi: 'Hesap Pasif',     renk: '#64748b' },
  dogrulanmamis: { yazi: 'Doğrulanmamış',   renk: '#64748b' },
};

function sonucBilgisi(kod) {
  return SONUC_BILGI[kod] ?? { yazi: kod, renk: '#64748b' };
}

export default function GirisSekmesi({ baslangic, bitis }) {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [arama, setArama] = useState('');
  const [sadeceBasarisiz, setSadeceBasarisiz] = useState(false);
  const [sonuc, setSonuc] = useState('');

  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(25);

  async function getir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (arama.trim() !== '') p.append('arama', arama.trim());
      if (sonuc !== '') p.append('sonuc', sonuc);
      if (sadeceBasarisiz) p.append('sadeceBasarisiz', 'true');
      if (baslangic !== '') p.append('baslangic', baslangic);
      if (bitis !== '') p.append('bitis', bitis);

      p.append('page', sayfa);
      p.append('pageSize', sayfaBoyutu);

      setVeri(await apiGet('/admin/loglar/girisler?' + p.toString()));
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    const sayac = setTimeout(getir, 400);

    return () => clearTimeout(sayac);
  }, [arama, sonuc, sadeceBasarisiz, baslangic, bitis, sayfa, sayfaBoyutu]);

  useEffect(() => {
    setSayfa(1);
  }, [arama, sonuc, sadeceBasarisiz, baslangic, bitis, sayfaBoyutu]);

  const sutunlar = [
    {
      baslik: 'Sonuç',
      hucre: (k) => {
        const bilgi = sonucBilgisi(k.sonuc);

        return (
          <span
            className="denetim-etiket"
            style={{ backgroundColor: bilgi.renk + '22', color: bilgi.renk }}
          >
            {bilgi.yazi}
          </span>
        );
      },
    },
    { baslik: 'E-posta', hucre: (k) => k.email },
    {
      baslik: 'IP',
      hucre: (k) => k.ip || <span className="denetim-bos">—</span>,
    },
    { baslik: 'Ne Zaman', hucre: (k) => tarihBicimle(k.tarih) },
  ];

  return (
    <>
      <div className="filtre-cubugu">
        <div className="filtre-grup" style={{ flex: 1, minWidth: 220 }}>
          <span className="filtre-etiket">Ara</span>

          <AramaKutusu
            deger={arama}
            degistir={setArama}
            ipucu="E-posta veya IP adresi..."
          />
        </div>

        <div className="filtre-grup">
          <span className="filtre-etiket">Sonuç</span>

          <select
            className="filtre-secim"
            value={sonuc}
            onChange={(e) => setSonuc(e.target.value)}
          >
            <option value="">Tümü</option>

            {Object.keys(SONUC_BILGI).map((kod) => (
              <option key={kod} value={kod}>
                {SONUC_BILGI[kod].yazi}
              </option>
            ))}
          </select>
        </div>

        {/* ⚠️ "Yalnızca başarısızlar" ayrı bir kısayol, sonuç
            menüsünün kopyası değil: menü TEK bir sonucu seçtiriyor,
            bu ise başarılı olan HERŞEYİ eliyor. Güvenlik incelemesinde
            en sık istenen görünüm bu. */}
        <div className="filtre-grup">
          <span className="filtre-etiket">Süzgeç</span>

          <button
            type="button"
            className={'chip' + (sadeceBasarisiz ? ' chip-secili' : '')}
            onClick={() => setSadeceBasarisiz(!sadeceBasarisiz)}
          >
            Yalnızca başarısızlar
          </button>
        </div>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={getir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Giriş kayıtları getiriliyor..." />
      ) : (
        <>
          <div className="log-not">
            Girilen şifreler <b>hiçbir koşulda kaydedilmiyor</b> —
            yanlış olanlar bile. Yanlış şifre çoğu zaman kullanıcının
            başka bir hesaptaki doğru şifresidir.
          </div>

          <Tablo
            sutunlar={sutunlar}
            veriler={veri?.kayitlar ?? []}
            anahtar={(k) => k.id}
            bosMesaj="Bu filtreye uyan giriş kaydı yok."
          />

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
