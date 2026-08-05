import { useEffect, useState } from 'react';

import { apiGet } from '../services/api';
import { tarihBicimle, sayiBicimle } from '../utils/bicimlendir';

import Tablo from './Tablo';
import Rozet from './Rozet';
import Sayfalama from './Sayfalama';
import Yukleniyor from './Yukleniyor';
import HataKutusu from './HataKutusu';

import './StokHareketleri.css';

// ============================================================
//  STOK HAREKET DEFTERİ
//
//  Bir ürünün stoğunun NASIL bugünkü hâline geldiğini gösterir.
//
//  NEDEN AYRI BİR BİLEŞEN, NEDEN SAYFANIN İÇİNDE DEĞİL?
//  "Sekmeler arası paylaşılan durum kabukta, sekmeye özel durum
//  yaprakta." Sayfa numarası, sayfa boyutu, yükleme durumu ve
//  hata — dördü de SADECE bu sekmeyi ilgilendiriyor. Kabukta
//  tutmak UrunFormSayfasi'nı gereksiz yere şişirirdi.
//
//  Bu bileşen ancak sekmeye tıklanınca MOUNT olur. Yani ürün
//  adını düzeltmeye giren admin bu isteği hiç atmaz.
// ============================================================
export default function StokHareketleri({ urunId }) {

  const [veri, setVeri] = useState(null);

  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(10);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  // ---------- VERİYİ ÇEK ----------
  useEffect(() => {
    // ⚠️ İPTAL BAYRAĞI
    //
    // Kullanıcı 1. sayfadayken hızlıca 2. sayfaya geçerse iki
    // istek havada kalır. Cevaplar SIRASIZ dönebilir: 2. sayfanın
    // cevabı önce, 1. sayfanınki sonra gelirse ekranda 1. sayfa
    // görünür ama sayfa numarası 2 yazar.
    //
    // Temizlik fonksiyonunda bayrağı kaldırıyoruz; geç gelen
    // cevap state'e hiç dokunmuyor.
    let iptal = false;

    async function hareketleriGetir() {
      setYukleniyor(true);
      setHata('');

      try {
        const cevap = await apiGet(
          '/products/' + urunId + '/stok-hareketleri' +
          '?page=' + sayfa +
          '&pageSize=' + sayfaBoyutu
        );

        if (!iptal) {
          setVeri(cevap);
        }
      } catch (e) {
        if (!iptal) {
          setHata(e.message);
        }
      } finally {
        if (!iptal) {
          setYukleniyor(false);
        }
      }
    }

    hareketleriGetir();

    return () => {
      iptal = true;
    };

    // ⚠️ Bağımlılık dizisinde İLKEL DEĞERLER var (sayı/sayı/sayı).
    // Nesne koysaydık her render'da yeni referans üretilir ve
    // effect sonsuz döngüye girerdi.
  }, [urunId, sayfa, sayfaBoyutu]);

  // ---------- SAYFA BOYUTU DEĞİŞİNCE BAŞA DÖN ----------
  //
  // 5. sayfadayken boyutu 10'dan 50'ye çıkarırsan 5. sayfa artık
  // var olmayabilir ve boş ekran gelir. Boyut değişimi listeyi
  // baştan kurar, o yüzden sayfayı da 1'e alıyoruz.
  function boyutDegistir(yeniBoyut) {
    setSayfaBoyutu(yeniBoyut);
    setSayfa(1);
  }

  // ---------- TABLO SÜTUNLARI ----------
  const sutunlar = [
    {
      baslik: 'Tarih',
      hucre: (h) => tarihBicimle(h.tarih),
    },

    {
      baslik: 'Hareket',
      // İKİ SATIRLI HÜCRE.
      //
      // Bu deseni panelde zaten kullanıyoruz (siparişlerdeki
      // "Ödeme" ve "Kargo" sütunları). Üstte ana bilgi, altta
      // küçük gri destekleyici bilgi.
      //
      // "Aynı problemi aynı ekranda iki farklı yolla çözme" —
      // yeni bir sütun açmak yerine var olan desene uyuyoruz.
      hucre: (h) => (
        <div className="defter-hareket-hucre">
          <Rozet durum={h.sebep} />

          {/* Referans satırı: sipariş numarası varsa onu göster.
              Teknik anahtar (Id) değil İŞ ANAHTARI (OrderNumber)
              gösteriyoruz — admin "42" değil "SP-260724-4821"
              görmeli. */}
          {h.siparisNo && (
            <span className="defter-referans">{h.siparisNo}</span>
          )}

          {/* Excel işleri için iş numarası */}
          {!h.siparisNo && h.referansTipi === 'ImportJob' && (
            <span className="defter-referans">
              İçe aktarma #{h.referansId}
            </span>
          )}

          {/* Manuel düzeltmelerde admin not bırakmış olabilir */}
          {h.aciklama && (
            <span className="defter-aciklama">{h.aciklama}</span>
          )}
        </div>
      ),
    },

    {
      baslik: 'Değişim',
      hizala: 'sag',
      // İşaretli sayı: artıya + koyuyoruz (eksinin işareti zaten var).
      //
      // Renk BİLGİ TAŞIYOR: yeşil = stoka girdi, kırmızı = çıktı.
      // Burada kırmızı bir "hata" değil "azalma" anlamında —
      // muhasebe ekstrelerindeki evrensel dil.
      hucre: (h) => (
        <span
          className={
            'defter-degisim ' +
            (h.miktar > 0 ? 'defter-artis' : 'defter-azalis')
          }
        >
          {h.miktar > 0 ? '+' : ''}
          {sayiBicimle(h.miktar)}
        </span>
      ),
    },

    {
      baslik: 'Stok',
      hizala: 'sag',
      // "15 → 12" okuması "−3" okumaktan çok daha anlaşılır.
      // Ayrıca ZİNCİR KONTROLÜ buradan gözle yapılabiliyor:
      // bir satırın sol sayısı, bir alttaki satırın sağ sayısına
      // eşit olmalı. Değilse arada kaydedilmemiş değişiklik var.
      hucre: (h) => (
        <span className="defter-stok">
          {sayiBicimle(h.oncekiStok)} → {sayiBicimle(h.sonrakiStok)}
        </span>
      ),
    },

    {
      baslik: 'Yapan',
      // yapan null ise bu bir SİSTEM hareketidir (Hangfire işi).
      //
      // Boş bırakmıyoruz: "Boş hücre 'sıfır mı, yok mu'
      // belirsizliği yaratır." Burada cevabı biliyoruz — sistem
      // yaptı — o yüzden tire yerine açıkça yazıyoruz.
      hucre: (h) =>
        h.yapan
          ? h.yapan
          : <span className="defter-sistem">Sistem</span>,
    },
  ];

  // ---------- ERKEN ÇIKIŞLAR ----------
  //
  // ⚠️ Bu return'ler TÜM hook'lardan SONRA geliyor.
  // Hook'lar koşullu çağrılamaz; yukarıya taşısaydık React
  // "rendered fewer hooks than expected" hatası verirdi.
  if (yukleniyor && veri === null) {
    return <Yukleniyor yazi="Stok hareketleri yükleniyor..." />;
  }

  if (hata !== '') {
    return <HataKutusu mesaj={hata} />;
  }

  if (veri === null) {
    return null;
  }

  const kontrol = veri.kontrol;
  const farkVar = kontrol.fark !== 0;

  return (
    <div className="defter-kutu">

      {/* ================= DEĞİŞMEZ KONTROLÜ ================= */}
      {/*
        Bakiye/defter deseninin bedeli şu eşitlik:
            Product.Stock == SUM(StockMovement.Miktar)

        Bunu elle kontrol etmeyi unuturuz. Ekranda durunca
        bozulduğu gün fark edilir.

        ⚠️ Fark sıfırdan farklıysa SARI kullanıyoruz, kırmızı
        değil. Defter sonradan başladığı için ESKİ ürünlerin
        hepsinde fark var — hepsini kırmızı yapsaydık admin iki
        hafta içinde kırmızıyı görmezden gelmeye başlardı.
        "Kırmızıyı gerçekten geri alınamaz işlemlere sakla."
      */}
      <div
        className={
          'defter-kontrol' + (farkVar ? ' defter-kontrol-uyari' : '')
        }
      >
        <div className="defter-kontrol-sayilar">
          <div className="defter-kontrol-oge">
            <span className="defter-kontrol-etiket">Mevcut stok</span>
            <span className="defter-kontrol-deger">
              {sayiBicimle(kontrol.mevcutStok)}
            </span>
          </div>

          <div className="defter-kontrol-oge">
            <span className="defter-kontrol-etiket">Defter toplamı</span>
            <span className="defter-kontrol-deger">
              {sayiBicimle(kontrol.defterToplami)}
            </span>
          </div>

          <div className="defter-kontrol-oge">
            <span className="defter-kontrol-etiket">Fark</span>
            <span className="defter-kontrol-deger">
              {kontrol.fark > 0 ? '+' : ''}
              {sayiBicimle(kontrol.fark)}
            </span>
          </div>
        </div>

        <p className="defter-kontrol-not">
          {farkVar
            ? 'Defter bu ürün için sonradan başladığı için bir başlangıç farkı var. Önemli olan bu sayının DEĞİŞMEMESİ — değişiyorsa stoğu güncelleyen bir yer deftere kayıt yazmıyor demektir.'
            : 'Bakiye ile defter toplamı birebir tutuyor. Bu ürünün tüm stok hareketleri kayıtlı.'}
        </p>
      </div>

      {/* ================= HAREKET TABLOSU ================= */}
      <Tablo
        sutunlar={sutunlar}
        veriler={veri.hareketler}
        anahtar={(h) => h.id}
        bosMesaj="Bu ürün için henüz stok hareketi kaydedilmemiş."
      />

      {/* Tek sayfaya sığıyorsa sayfalama çubuğu çizilmesin —
          işi olmayan arayüz parçası gösterilmez. */}
      {veri.toplamSayfa > 1 && (
        <Sayfalama
          sayfa={veri.sayfa}
          toplamSayfa={veri.toplamSayfa}
          toplam={veri.toplam}
          sayfaBoyutu={veri.sayfaBoyutu}
          sayfaDegistir={setSayfa}
          boyutDegistir={boyutDegistir}
        />
      )}
    </div>
  );
}