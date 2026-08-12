import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet } from '../services/api';
import { tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Sayfalama from '../components/Sayfalama';
import Tablo from '../components/Tablo';
import Rozet from '../components/Rozet';
import AramaKutusu from '../components/AramaKutusu';
import Buton from '../components/Buton';

import './DestekTalepleriSayfasi.css';

// ⭐ YENİ (4.7 kuralı) — emoji yerine çizgi ikon, tek tek import.
import { CheckCheck, Inbox, MailOpen, MessageSquare } from 'lucide-react';

// Sekmeler. `deger === null` → filtre gönderilmiyor, hepsi geliyor.
//
// ⚠️ Ekran kavramı ile veri kavramı birebir aynı olmak zorunda değil:
// "Tümü" diye bir durum yok, o yüzden değeri null.
const SEKMELER = [
  { anahtar: 'acik', yazi: 'Cevap Bekleyen', deger: 'acik', ikon: <Inbox size={16} /> },
  { anahtar: 'yanitlandi', yazi: 'Yanıtlandı', deger: 'yanitlandi', ikon: <MailOpen size={16} /> },
  { anahtar: 'kapali', yazi: 'Kapalı', deger: 'kapali', ikon: <CheckCheck size={16} /> },
  { anahtar: 'tumu', yazi: 'Tümü', deger: null, ikon: <MessageSquare size={16} /> },
];

const KATEGORILER = [
  { deger: '', yazi: 'Tüm kategoriler' },
  { deger: 'kargo', yazi: 'Kargo' },
  { deger: 'urun', yazi: 'Ürün' },
  { deger: 'odeme', yazi: 'Ödeme' },
  { deger: 'diger', yazi: 'Diğer' },
];

export default function DestekTalepleriSayfasi() {
  const navigate = useNavigate();

  // ⚠️ Varsayılan sekme "Cevap Bekleyen" — panelin açılışta
  // göstermesi gereken şey yapılacak iş, arşiv değil.
  const [aktifSekme, setAktifSekme] = useState('acik');
  const [kategori, setKategori] = useState('');
  const [arama, setArama] = useState('');

  const [veri, setVeri] = useState(null);
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(20);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // ---------- VERİYİ ÇEK ----------
  useEffect(() => {
    let iptal = false;

    async function getir() {
      setYukleniyor(true);
      setHata('');

      try {
        const sekme = SEKMELER.find((s) => s.anahtar === aktifSekme);

        const parcalar = [
          'sayfa=' + sayfa,
          'sayfaBoyutu=' + sayfaBoyutu,
        ];

        if (sekme?.deger) parcalar.push('durum=' + sekme.deger);
        if (kategori) parcalar.push('kategori=' + kategori);
        if (arama) parcalar.push('search=' + encodeURIComponent(arama));

        const cevap = await apiGet('/admin/destek?' + parcalar.join('&'));

        if (!iptal) setVeri(cevap);
      } catch (e) {
        if (!iptal) setHata(e.message);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    }

    getir();

    // ⚠️ İptal bayrağı: filtre hızlı değiştirilirse önceki isteğin
    // geç dönen cevabı yenisinin üstüne yazabilir.
    return () => { iptal = true; };
  }, [aktifSekme, kategori, arama, sayfa, sayfaBoyutu]);

  // ⚠️ Filtre değişince SAYFA 1'E DÖNÜYOR. Dönmeseydi 5. sayfadayken
  // filtre daraltıldığında boş bir sayfa görünür ve kullanıcı
  // "sonuç yok" sanırdı.
  function filtreDegistir(uygula) {
    uygula();
    setSayfa(1);
  }

  const sutunlar = [
    {
      baslik: 'Konu',
      hucre: (t) => (
        <div>
          <div className="destek-konu">{t.konu}</div>
          <div className="destek-alt">
            {t.musteriAdi}
            {t.siparisNo ? ' · ' + t.siparisNo : ''}
          </div>
        </div>
      ),
    },
    {
      baslik: 'Kategori',
      hucre: (t) => <Rozet durum={'destek_' + t.kategori} />,
    },
    {
      baslik: 'Durum',
      hucre: (t) => <Rozet durum={t.durum} />,
    },
    {
      baslik: 'Mesaj',
      hizala: 'orta',
      hucre: (t) => t.mesajSayisi,
    },
    {
      baslik: 'Son hareket',
      hizala: 'sag',
      /* ⚠️ `updatedAt`, `createdAt` DEĞİL. Adminin sorusu "en son ne
         konuşuldu"; açılış tarihi üç hafta önce olabilir ama konuşma
         dün sürmüş olabilir. Sıralama da buna göre. */
      hucre: (t) => tarihBicimle(t.updatedAt),
    },
    {
      baslik: '',
      hizala: 'sag',
      /* ⚠️ Satırın tamamını tıklanabilir yapmak yerine bir buton:
         `Tablo` bileşeninde satır tıklaması yok ve siparişler
         ekranı da aynı deseni kullanıyor ("Detay →"). Ortak
         bileşene sırf bu ekran için prop eklemek, iki ekranı
         birbirinden ayırırdı. */
      hucre: (t) => (
        <Buton tip="ikincil" boyut="kucuk" onClick={() => navigate('/destek/' + t.id)}>
          Detay →
        </Buton>
      ),
    },
  ];

  if (yukleniyor && veri === null) {
    return <Yukleniyor yazi="Destek talepleri getiriliyor..." />;
  }

  if (hata && veri === null) {
    return <HataKutusu mesaj={hata} tekrarDene={() => setSayfa(1)} />;
  }

  const sayilar = veri?.durumSayilari ?? {};

  return (
    <div>
      <div className="sayfa-ust">
        <div>
          <h1 className="sayfa-baslik">Destek Talepleri</h1>
          <p className="sayfa-altyazi">
            Müşteri soruları ve yazışmalar. Cevap bekleyenler en üstte.
          </p>
        </div>
      </div>

      {/* Ortak `.sekme-serit` sınıfları — admin başvuruları ekranıyla
          aynı görünüm. İkinci bir sekme dili üretmenin anlamı yok. */}
      <div className="sekme-serit" style={{ marginBottom: 16 }}>
        {SEKMELER.map((s) => {
          /* ⚠️ Sayaç YALNIZCA "cevap bekleyen" sekmesinde.
             Hepsine koysaydık üç sayı yan yana dururdu ve hiçbiri
             dikkat çekmezdi; oysa buradaki tek acil bilgi kaç
             talebin cevap beklediği. "Sıfırda rozet çizme" kuralı
             da geçerli: iş yoksa kırmızı bir sıfır göstermek
             gereksiz bir alarm olurdu. */
          const sayiGoster = s.anahtar === 'acik' && (sayilar.acik ?? 0) > 0;

          return (
            <button
              key={s.anahtar}
              className={'sekme' + (aktifSekme === s.anahtar ? ' sekme-aktif' : '')}
              onClick={() => filtreDegistir(() => setAktifSekme(s.anahtar))}
              type="button"
            >
              <span className="sekme-ikon">{s.ikon}</span>
              {s.yazi}
              {sayiGoster && <span className="destek-sekme-sayi">{sayilar.acik}</span>}
            </button>
          );
        })}
      </div>

      <div className="filtre-cubugu">
        <AramaKutusu
          deger={arama}
          degistir={(m) => filtreDegistir(() => setArama(m))}
          ipucu="Konuda ara..."
        />

        <select
          className="filtre-secim"
          value={kategori}
          onChange={(e) => filtreDegistir(() => setKategori(e.target.value))}
        >
          {KATEGORILER.map((k) => (
            <option key={k.deger} value={k.deger}>{k.yazi}</option>
          ))}
        </select>
      </div>

      {hata && <HataKutusu mesaj={hata} />}

      {/* ⚠️ Boş mesaj sekmeye göre değişiyor: "cevap bekleyen yok"
          bir BAŞARI bildirimi, "filtreye uyan yok" ise bir arama
          sonucu. İkisini tek cümleyle anlatmak, iyi haberi hata gibi
          göstermek olurdu. */}
      <div className="destek-tablo">
        <Tablo
          sutunlar={sutunlar}
          veriler={veri?.talepler ?? []}
          anahtar={(t) => t.id}
          bosMesaj={
            aktifSekme === 'acik'
              ? 'Cevap bekleyen talep yok. Her şey yanıtlanmış.'
              : 'Bu filtreye uyan talep yok.'
          }
        />
      </div>

      <Sayfalama
        sayfa={veri?.sayfa ?? 1}
        toplamSayfa={veri?.toplamSayfa ?? 1}
        toplam={veri?.toplam ?? 0}
        sayfaBoyutu={sayfaBoyutu}
        sayfaDegistir={setSayfa}
        boyutDegistir={(b) => filtreDegistir(() => setSayfaBoyutu(b))}
      />
    </div>
  );
}
