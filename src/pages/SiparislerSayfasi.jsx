import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet } from '../services/api';
import { paraBicimle, sayiBicimle, tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import AramaKutusu from '../components/AramaKutusu';
import Sayfalama from '../components/Sayfalama';
import KargoEtiketi from '../components/KargoEtiketi';


import './SiparislerSayfasi.css';

export default function SiparislerSayfasi() {
  const navigate = useNavigate();

  const [siparisler, setSiparisler] = useState([]);
  const [ozet, setOzet] = useState({
    toplam: 0,
    toplamTutar: 0,
    toplamSayfa: 1,
  });


  // Seçili sipariş id'leri. Dizi tutuyoruz çünkü liste küçük (sayfa başına
  // en fazla 50); Set'in hız avantajı bu ölçekte fark etmez, dizi daha okunaklı.
  const [secili, setSecili] = useState([]);

  // Bir siparişi seç / seçimi kaldır
  function secimDegistir(id) {
    if (secili.includes(id)) {
      setSecili(secili.filter((x) => x !== id));
    } else {
      setSecili([...secili, id]);
    }
  }

  // Sayfadaki tüm siparişler seçili mi? (türetilmiş değer — state değil)
  const hepsiSecili =
    siparisler.length > 0 && siparisler.every((s) => secili.includes(s.id));

  // Başlıktaki checkbox: hepsi seçiliyse temizle, değilse hepsini seç
  function tumunuSec() {
    if (hepsiSecili) {
      setSecili([]);
    } else {
      setSecili(siparisler.map((s) => s.id));
    }
  }

  // Etiket yazdırma — veriyi butona basınca çekiyoruz, liste yüklenirken değil
  const [etiketVerisi, setEtiketVerisi] = useState(null);

  // idler: dizi. Tek sipariş için [5], toplu için [5, 7, 12].
  // Backend zaten virgüllü liste kabul ediyor — tek endpoint ikisini de karşılıyor.
  async function etiketYazdir(idler) {
    if (idler.length === 0) {
      return;
    }

    try {
      const veri = await apiGet('/admin/orders/etiket?ids=' + idler.join(','));
      setEtiketVerisi(veri);
    } catch (e) {
      setHata(e.message);
    }
  }

  // Veri gelince yazdır. useEffect şart: setState hemen DOM'a yansımaz,
  // hemen print() çağırsak etiket henüz basılmamış olurdu.
  useEffect(() => {
    if (etiketVerisi) {
      window.print();
      setEtiketVerisi(null);
    }
  }, [etiketVerisi]);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // FİLTRELER — hepsi BACKEND'e gidiyor
  const [arama, setArama] = useState('');
  const [durumFiltre, setDurumFiltre] = useState('');
  const [odemeFiltre, setOdemeFiltre] = useState('');

  // SAYFALAMA
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);

  async function siparisleriGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      // Query string'i güvenli şekilde kur
      const p = new URLSearchParams();

      if (arama.trim() !== '') {
        p.append('search', arama.trim());
      }

      if (durumFiltre !== '') {
        p.append('status', durumFiltre);
      }

      if (odemeFiltre !== '') {
        p.append('paymentStatus', odemeFiltre);
      }

      p.append('page', sayfa);
      p.append('pageSize', sayfaBoyutu);

      const veri = await apiGet('/admin/orders?' + p.toString());

      setSiparisler(veri.siparisler);
      setOzet({
        toplam: veri.toplam,
        toplamTutar: veri.toplamTutar,
        toplamSayfa: veri.toplamSayfa,
      });
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // Filtre veya sayfa değişince yeniden çek (aramada 400ms debounce)
  useEffect(() => {
    const sayac = setTimeout(() => {
      siparisleriGetir();
    }, 400);

    return () => clearTimeout(sayac);
  }, [arama, durumFiltre, odemeFiltre, sayfa, sayfaBoyutu]);

  // Sayfa değişince de seçim sıfırlanır (aynı sebeple)
  useEffect(() => {
    setSecili([]);
  }, [sayfa]);

  // ⚠️ ÖNEMLİ: Filtre değişince 1. sayfaya dön.
  // Yoksa 5. sayfadayken filtre uygularsın, sonuç 2 sayfa çıkar,
  // sen hâlâ 5. sayfadasındır → boş ekran görürsün.
  // Filtre değişince sayfayı başa al VE seçimi temizle.
  //
  // Seçimi neden temizliyoruz? Kullanıcı sayfa 1'de 3 sipariş seçip
  // sayfa 2'ye geçerse, o 3 sipariş ekranda görünmez ama "3 seçildi"
  // yazmaya devam eder. Göremediği bir şeyin etiketini basmak sürpriz olur.
  useEffect(() => {
    setSayfa(1);
    setSecili([]);
  }, [arama, durumFiltre, odemeFiltre, sayfaBoyutu]);

    const sutunlar = [
    {
      // Başlık bir JSX — Tablo bileşeni {sutun.baslik} diye bastığı için çalışıyor
      baslik: (
        <input
          type="checkbox"
          className="secim-kutusu"
          checked={hepsiSecili}
          onChange={tumunuSec}
          title="Tümünü seç"
        />
      ),
      hucre: (s) => (
        <input
          type="checkbox"
          className="secim-kutusu"
          checked={secili.includes(s.id)}
          onChange={() => secimDegistir(s.id)}
        />
      ),
    },
    {
      // Müşteriye gösterilen numara. Id artık sadece URL'de kullanılıyor.
      baslik: 'Sipariş No',
      hucre: (s) => <b className="siparis-no">{s.siparisNo}</b>,
    },
    {
      baslik: 'Müşteri',
      hucre: (s) => (
        <div>
          <div className="musteri-ad">{s.musteriAdi}</div>
          <div className="musteri-mail">{s.musteriEmail}</div>
        </div>
      ),
    },
    {
      baslik: 'Tarih',
      hucre: (s) => tarihBicimle(s.tarih),
    },
    {
      baslik: 'İçerik',
      hucre: (s) => {
        // İlk ürünleri virgülle birleştir. Gösterilmeyen kalan var mı?
        const kalan = s.urunCesidi - s.ilkUrunler.length;

        return (
          <div className="siparis-icerik">
            {/* İlk 1-2 ürünün adı */}
            <div className="icerik-urunler">
              {s.ilkUrunler.join(', ')}
              {kalan > 0 && (
                <span className="icerik-kalan"> +{kalan} ürün daha</span>
              )}
            </div>

            {/* Alt satır: çeşit ve adet özeti */}
            <div className="alt-bilgi">
              {sayiBicimle(s.urunCesidi)} çeşit · {sayiBicimle(s.toplamAdet)} adet

              {/* ⭐ YENİ — müşteri notu var mı?
                  
                  Sadece bir işaret koyuyoruz, metni değil. Kargo hazırlayan
                  kişi "bu siparişte okunacak bir şey var" bilgisini
                  listeden alıp detaya girer.
                  
                  title özniteliği fare üstüne gelince ipucu balonu
                  gösteriyor — ikonun ne anlama geldiğini tahmin etmek
                  zorunda kalmasın. */}
              {s.notVarMi && (
                <span className="not-isareti" title="Müşteri sipariş notu bırakmış">
                  {' · '}📝 not var
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      baslik: 'Kargo',
      hucre: (s) => (
        <div>
          <Rozet durum={s.durum} />

          {/* ⭐ YENİ — takip numarası ve firma, rozetin altında.
              
              Neden ayrı kolon açmadık? Tablo zaten 9 kolonlu. Ama daha
              önemlisi: "Ödeme" kolonu tam olarak bu deseni kullanıyor
              (rozet + altında •••• 4242). Aynı ekranda aynı problemi
              iki farklı şekilde çözmemek gerekir.
              
              Neden koşullu? Sipariş "hazırlanıyor" durumundayken takip
              numarası yok. Boş bir satır bırakmak yerine hiç çizmiyoruz —
              satır kendiliğinden kısalıyor. */}
          {s.takipNo && (
            <div className="takip-no" title="Kargo takip numarası">
              {s.takipNo}
            </div>
          )}

          {s.kargoFirmasi && (
            <div className="alt-bilgi">{s.kargoFirmasi}</div>
          )}
        </div>
      ),
    },
    {
      baslik: 'Ödeme',
      hucre: (s) => (
        <div>
          <Rozet durum={s.odemeDurumu} />

          {s.kartSon4 && (
            <div className="kart-no">•••• {s.kartSon4}</div>
          )}
        </div>
      ),
    },
    {
      baslik: 'Tutar',
      hizala: 'sag',
      hucre: (s) => <b>{paraBicimle(s.tutar)}</b>,
    },
    {
      baslik: '',
      hizala: 'sag',
      hucre: (s) => (
        <div className="islem-butonlari">
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Buton
            tip="ikincil"
            boyut="kucuk"
            onClick={() => etiketYazdir([s.id])}
            title="Kargo etiketi yazdır"
          >
            🏷️
          </Buton>

          <Buton
            tip="ikincil"
            boyut="kucuk"
            onClick={() => navigate('/siparisler/' + s.id)}
          >
            Detay →
          </Buton>
        </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="sayfa-ust">
        <h1 className="sayfa-baslik">Siparişler</h1>
        <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
          Tüm siparişleri görüntüle, detaya gir, kargo durumunu ilerlet
        </p>
      </div>

      {/* ---------- FİLTRELER ---------- */}
      <div className="filtre-cubugu">
        <AramaKutusu
          deger={arama}
          degistir={setArama}
          ipucu="Sipariş no, müşteri adı veya e-posta..."
        />

        <select
          className="filtre-secim"
          value={durumFiltre}
          onChange={(e) => setDurumFiltre(e.target.value)}
        >
          <option value="">Tüm kargo durumları</option>
          <option value="hazirlaniyor">Hazırlanıyor</option>
          <option value="kargoda">Kargoda</option>
          <option value="teslim_edildi">Teslim Edildi</option>
          <option value="iptal">İptal</option>
        </select>

        <select
          className="filtre-secim"
          value={odemeFiltre}
          onChange={(e) => setOdemeFiltre(e.target.value)}
        >
          <option value="">Tüm ödeme durumları</option>
          <option value="odendi">Ödendi</option>
          <option value="beklemede">Beklemede</option>
          <option value="iade_edildi">İade Edildi</option>
        </select>
      </div>

      {/* ---------- ÖZET ---------- */}
      <div className="ozet-cubugu">
        <span>
          Filtreye uyan <b>{sayiBicimle(ozet.toplam)}</b> sipariş
        </span>

        <span>
          Toplam tutar: <b>{paraBicimle(ozet.toplamTutar)}</b>
        </span>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={siparisleriGetir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Siparişler getiriliyor..." />
      ) : (
        <>

                    {/* SEÇİM ÇUBUĞU — sadece seçim varken görünür.
              Boşken hiç yer kaplamasın, ekranı meşgul etmesin. */}
          {secili.length > 0 && (
            <div className="secim-cubugu">
              <span className="secim-yazi">
                <b>{secili.length}</b> sipariş seçildi
              </span>

              <div className="secim-butonlar">
                <Buton
                  boyut="kucuk"
                  onClick={() => etiketYazdir(secili)}
                >
                  🏷️ Seçilenlerin Etiketini Yazdır
                </Buton>

                <Buton
                  tip="ikincil"
                  boyut="kucuk"
                  onClick={() => setSecili([])}
                >
                  Seçimi Temizle
                </Buton>
              </div>
            </div>
          )}

          <Tablo
            sutunlar={sutunlar}
            veriler={siparisler}
            anahtar={(s) => s.id}
            bosMesaj="Bu filtreye uyan sipariş yok."
          />

          <Sayfalama
            sayfa={sayfa}
            toplamSayfa={ozet.toplamSayfa}
            toplam={ozet.toplam}
            sayfaBoyutu={sayfaBoyutu}
            sayfaDegistir={setSayfa}
            boyutDegistir={setSayfaBoyutu}
          />
        </>
      )}


      {/* YAZDIRMA ALANI — ekranda görünmez, yazdırırken basılır */}
      {etiketVerisi && (
        <div className="yazdirma-alani">
          {etiketVerisi.etiketler.map((e) => (
            <KargoEtiketi
              key={e.id}
              etiket={e}
              magaza={etiketVerisi.magaza}
            />
          ))}
        </div>
      )}


    </div>
  );
}