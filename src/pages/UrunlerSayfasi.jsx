import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ⭐ apiPut eklendi — durum aç/kapa endpoint'i için
import { apiGet, apiDelete, apiPut } from '../services/api';
import { paraBicimle, sayiBicimle } from '../utils/bicimlendir';
import { resimUrl } from '../utils/resim';
// ⭐ YENİ — kâr formülü ortak dosyadan.
// "karHesapla" takma adıyla alıyoruz çünkü bu dosyada zaten
// "urunKari" adında bir sarmalayıcı var; aynı ada iki şey
// bağlamak okuyanı yanıltırdı.
import { urunKari as karHesapla, karMarji } from '../utils/kar';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Tablo from '../components/Tablo';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';          // ⭐ YENİ — durum rozeti
import AramaKutusu from '../components/AramaKutusu';
import OnayPenceresi from '../components/OnayPenceresi';

import ExcelIceAktar from '../components/ExcelIceAktar';

// ⭐ YENİ (4.7) — buton emojileri çizgi ikona çevrildi.
// Gerekçe PanelDuzeni'nde uzun uzun yazılı: emoji her işletim
// sisteminde farklı çiziliyor ve rengi tema ile değişmiyor.
// Tek tek import — "import * as Icons" ağaç sallamayı engeller.
import { Archive, ArchiveRestore, Ban, Camera, CheckCircle2, Download, Pencil, Plus, Trash2 } from 'lucide-react';

import './UrunlerSayfasi.css';

export default function UrunlerSayfasi() {
  const navigate = useNavigate();

  const [urunler, setUrunler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [arama, setArama] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [siralama, setSiralama] = useState('ad');
  // ⭐ YENİ — mağaza ayarları (stok eşiği için).
  //
  // Başlangıç değeri null, 5 DEĞİL.
  //
  // Neden? 5 koysaydık ayarlar yüklenene kadar sayfa 5'e göre
  // boyar, sonra ayar gelince renkler değişirdi. Kullanıcı
  // gözünün önünde değişen bir arayüz görürdü — "acaba yanlış mı
  // gördüm?" dedirten türden. null iken vurgulama yapmıyoruz.
  const [stokEsigi, setStokEsigi] = useState(null);
  // ⭐ YENİ — durum filtresi.
  // '' = hepsi, 'true' = sadece satıştakiler, 'false' = sadece kaldırılanlar.
  //
  // Neden boolean değil de STRING tutuyoruz?
  // Bu değer doğrudan bir <select>'in value'su. HTML'de select değerleri
  // her zaman string'tir; boolean tutsaydık her okuma ve yazmada
  // dönüştürme yapmak zorunda kalırdık. Ayrıca üç durumumuz var
  // (hepsi / aktif / pasif) ve boolean bunu karşılamıyor.
  const [durumFiltre, setDurumFiltre] = useState('');

  // ⭐ YENİ (4.8) — arşivli ürünler listeye dahil edilsin mi?
  //
  // Varsayılan false: arşiv "gözümün önünden çek" demek, açılışta
  // görünmemeleri işin özü. Admin arşivden çıkarmak istediğinde
  // bu anahtarı açıyor.
  const [arsivGoster, setArsivGoster] = useState(false);

  const [silinecek, setSilinecek] = useState(null);
  const [siliniyor, setSiliniyor] = useState(false);

  // ⭐ YENİ — şu an durumu değiştirilen ürünün id'si (yoksa null).
  //
  // Neden ayrı bir "yukleniyor" boolean'ı değil?
  // Sayfada 40 ürün var; hangi satırın butonunun kilitleneceğini
  // bilmemiz lazım. Boolean tutsaydık istek atılınca 40 butonun HEPSİ
  // kilitlenirdi. id tutunca sadece ilgili satır etkileniyor.
  const [durumDegisen, setDurumDegisen] = useState(null);

  // Excel içe aktarma modalı açık mı?
  const [iceAktarAcik, setIceAktarAcik] = useState(false);

  // Kategorileri bir kez çek
  useEffect(() => {
    apiGet('/categories')
      .then(setKategoriler)
      .catch(() => setKategoriler([]));
  }, []);

  // ⭐ YENİ — mağaza ayarlarını bir kez çek.
  //
  // Bağımlılık dizisi BOŞ: ayarlar sayfa açıkken değişmez.
  // Her ürün listesi yenilemesinde tekrar çekmenin anlamı yok.
  useEffect(() => {
    let iptal = false;

    async function ayarlariGetir() {
      try {
        const veri = await apiGet('/ayarlar/yonetim');

        if (!iptal) {
          setStokEsigi(veri.stokAzEsigi);
        }
      } catch {
        // ⚠️ SESSİZCE GEÇİYORUZ — bilinçli.
        //
        // Bu bir GÖRSEL VURGU ayarı. Alınamazsa stok sayıları
        // renksiz görünür, o kadar. Sayfanın asıl işi (ürün
        // listesi) etkilenmiyor.
        //
        // Kırmızı bir hata kutusu göstermek, aslında çalışan bir
        // sayfada "bir şeyler bozuk" izlenimi yaratırdı.
      }
    }

    ayarlariGetir();

    return () => {
      iptal = true;
    };
  }, []);

  // Ürünleri çek (arama + kategori + durum filtresi backend'de)
  async function urunleriGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const parametreler = new URLSearchParams();

      if (arama.trim() !== '') {
        parametreler.append('search', arama.trim());
      }

      if (kategoriId !== '') {
        parametreler.append('categoryId', kategoriId);
      }

      // ⭐ YENİ — durum filtresi.
      //
      // Boş bırakırsak parametreyi HİÇ göndermiyoruz. Backend'de
      // "aktif" parametresi bool? (nullable) — gelmezse admin tüm
      // ürünleri görüyor. "aktif=" gibi boş bir değer göndermek
      // model binding hatası üretirdi.
      if (durumFiltre !== '') {
        parametreler.append('aktif', durumFiltre);
      }

      // ⭐ YENİ (4.8) — arşivliler yalnızca istenirse.
      //
      // Kapalıyken parametreyi HİÇ göndermiyoruz; backend'de
      // varsayılan zaten false. Her istekte "arsiv=false" göndermek
      // URL'i uzatmaktan başka bir işe yaramazdı.
      if (arsivGoster) {
        parametreler.append('arsiv', 'true');
      }

      const sorgu = parametreler.toString();
      const yol = sorgu === '' ? '/products' : '/products?' + sorgu;

      const veri = await apiGet(yol);
      setUrunler(veri);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // Debounce: kullanıcı yazmayı bırakalı 400ms geçtiyse iste.
  //
  // ⭐ durumFiltre bağımlılık dizisine eklendi — eklemeseydik filtreyi
  // değiştirince liste yenilenmezdi. React bağımlılık dizisinde olmayan
  // bir değer değişince effect'i tekrar çalıştırmaz.
  useEffect(() => {
    const sayac = setTimeout(() => {
      urunleriGetir();
    }, 400);

    return () => clearTimeout(sayac);
    // ⭐ arsivGoster de bağımlılıkta — eklemeseydik anahtar
    // değişince liste yenilenmezdi.
  }, [arama, kategoriId, durumFiltre, arsivGoster]);

  async function silmeyiOnayla() {
    setSiliniyor(true);

    try {
      await apiDelete('/products/' + silinecek.id);
      setUrunler(urunler.filter((u) => u.id !== silinecek.id));
      setSilinecek(null);
    } catch (e) {
      // ⭐ YENİ (4.8) — sunucu "bu ürünün geçmişi var" diyebilir.
      //
      // Backend artık sipariş kalemi / yorum / stok hareketi olan
      // ürünü silmiyor ve 409 dönüyor. Mesaj kaç kayıt olduğunu ve
      // ne yapılabileceğini söylüyor; olduğu gibi gösteriyoruz.
      //
      // ⚠️ Buton mantığı bunu zaten ÖNLÜYOR (geçmişi olan üründe
      // "Sil" yerine "Arşivle" çıkıyor). Yine de buraya düşebiliriz:
      // liste yüklendikten sonra o ürüne sipariş gelmiş olabilir.
      // Ön yüz doğrulaması bir kolaylık, sunucu doğrulaması ise
      // kural — ikisi de gerekli.
      setHata(e.message);
      setSilinecek(null);
    } finally {
      setSiliniyor(false);
    }
  }

  // ⭐ YENİ (4.8) — ürünü arşivle / arşivden çıkar
  async function arsivDegistir(urun) {
    setDurumDegisen(urun.id);
    setHata('');

    try {
      // durumDegistir'deki desenin aynısı: hedef değeri açıkça
      // gönderiyoruz, "tersine çevir" demiyoruz.
      const cevap = await apiPut('/products/' + urun.id + '/arsiv', {
        isActive: !urun.arsivlendiMi,
      });

      // ⚠️ Arşivlenen ürün LİSTEDEN ÇIKIYOR (arşiv görünümü kapalıysa).
      // Satırı güncellemek yerine çıkarıyoruz çünkü mevcut filtreye
      // artık uymuyor — bırakırsak admin arşivlediği ürünü hâlâ
      // listede görür ve işlemin çalışmadığını sanır.
      if (cevap.arsivlendiMi && !arsivGoster) {
        setUrunler((oncekiler) => oncekiler.filter((u) => u.id !== urun.id));
        return;
      }

      // Değerleri sunucunun cevabından alıyoruz — arşivleme aynı
      // zamanda ürünü satıştan da kaldırıyor, o yüzden isActive de
      // değişmiş olabilir. Kendi hesabımızla tahmin etseydik satır
      // "arşivli ama hâlâ satışta" gibi yanlış görünürdü.
      setUrunler((oncekiler) =>
        oncekiler.map((u) =>
          u.id === urun.id
            ? { ...u, arsivlendiMi: cevap.arsivlendiMi, isActive: cevap.isActive }
            : u
        )
      );
    } catch (e) {
      setHata(e.message);
    } finally {
      setDurumDegisen(null);
    }
  }

  // ⭐ YENİ — ürünü satışa aç / satıştan kaldır
  async function durumDegistir(urun) {
    setDurumDegisen(urun.id);
    setHata('');

    try {
      // Yeni durum = mevcut durumun tersi.
      // Tersini İSTEMCİDE hesaplayıp gönderiyoruz ama sunucuya
      // "tersine çevir" demiyoruz — açıkça true/false gönderiyoruz.
      // Böylece iki admin aynı anda basarsa sonuç belirsiz kalmıyor:
      // ikisi de aynı hedef değeri gönderiyorsa sonuç aynı, farklı
      // gönderiyorsa son yazan kazanıyor. "Tersine çevir" deseydik
      // iki istek üst üste gelince ürün başladığı yere dönerdi.
      const cevap = await apiPut('/products/' + urun.id + '/durum', {
        isActive: !urun.isActive,
      });

      // Listeyi baştan çekmiyoruz — sadece o satırı güncelliyoruz.
      // Tüm listeyi yenilemek 40 ürünü tekrar indirmek ve tablonun
      // gözle görülür şekilde titremesi demek olurdu.
      //
      // Yeni değeri kendi hesabımızdan değil SUNUCUNUN CEVABINDAN
      // alıyoruz (cevap.isActive). Sunucu son sözü söyleyen taraf.
      setUrunler((oncekiler) =>
        oncekiler.map((u) =>
          u.id === urun.id ? { ...u, isActive: cevap.isActive } : u
        )
      );
    } catch (e) {
      setHata(e.message);
    } finally {
      setDurumDegisen(null);
    }
  }

  // ⭐ DEĞİŞTİ — kâr formülü artık burada değil, utils/kar.js'te.
  //
  // ⚠️ ESKİ HALİ "u.price - u.cost" İDİ VE KDV DÜŞMÜYORDU.
  //
  // Fiyat ve maliyetin ikisi de KDV dahil; mağaza fiyatın KDV
  // kısmını devlete ödüyor. Eski formül kârı olduğundan yüksek
  // gösteriyordu (1.200 fiyat / 800 maliyet / %20 → 400 yerine
  // gerçekte 333,33).
  //
  // ⚠️ Aynı formül aşağıdaki sıralamada BİR KEZ DAHA yazılıydı.
  // İki kopya da KDV düzeltmesini kaçırmıştı — ortak dosyaya
  // taşımanın sebebi tam olarak bu.
  function urunKari(u) {
    return karHesapla(u.price, u.cost, u.vatRate);
  }

  // Sıralama tarayıcıda (veri zaten elimizde)
  const siraliUrunler = [...urunler].sort((a, b) => {
    if (siralama === 'ad')          return a.name.localeCompare(b.name, 'tr');
    if (siralama === 'fiyatArtan')  return a.price - b.price;
    if (siralama === 'fiyatAzalan') return b.price - a.price;
    if (siralama === 'stokArtan')   return a.stock - b.stock;

    if (siralama === 'karAzalan') {
      // ⭐ DEĞİŞTİ — formül kopyalanmıyor, urunKari çağrılıyor.
      // Maliyeti olmayan ürünler en dibe insin (-Infinity)
      const ka = urunKari(a) ?? -Infinity;
      const kb = urunKari(b) ?? -Infinity;
      return kb - ka;
    }

    return 0;
  });

  function kategoriAdi(id) {
    const kategori = kategoriler.find((k) => k.id === id);
    return kategori ? kategori.name : '—';
  }

  const sutunlar = [
    {
      baslik: '',
      hucre: (u) =>
        u.mainImageUrl ? (
          <img className="satir-resim" src={resimUrl(u.mainImageUrl)} alt="" />
        ) : (
          <div className="satir-resim-yok"><Camera size={16} /></div>
        ),
    },
    {
      baslik: 'Barkod',
      hucre: (u) => (
        <span style={{ fontFamily: 'monospace', color: 'var(--yaziOrta)' }}>
          {u.barcode || '—'}
        </span>
      ),
    },
    {
      baslik: 'Ürün Adı',
      hucre: (u) => (
        <div>
          <b>{u.name}</b>

          {u.images.length > 1 && (
            <div style={{ fontSize: 12, color: 'var(--yaziGri)', marginTop: 2 }}>
              {u.images.length} resim
            </div>
          )}
        </div>
      ),
    },
    {
      // ⭐ YENİ — satış durumu.
      //
      // Neden ayrı bir kolon? Rengi soluk satırdan da anlaşılıyor ama
      // renk tek başına bilgi taşımamalı: renk körü bir kullanıcı ya da
      // ekranı parlak ışıkta bakan biri farkı göremez. Yazıyla da
      // söylemek erişilebilirliğin temel kuralı.
      baslik: 'Durum',

      // ⭐ DEĞİŞTİ (4.8) — arşiv, aktif/pasif'in ÖNÜNDE gösteriliyor.
      //
      // Arşivli ürün zaten pasif (arşivleme onu satıştan da
      // kaldırıyor). İkisini birden yazsaydık her arşivli satırda
      // "Arşivli · Pasif" görünürdü — ikinci rozet hiçbir yeni bilgi
      // taşımadan yer kaplardı. Arşiv daha üst seviye bir durum,
      // onu söylemek yeterli.
      hucre: (u) =>
        u.arsivlendiMi ? (
          <Rozet durum="arsivli" />
        ) : (
          <Rozet durum={u.isActive ? 'aktif' : 'pasif'} />
        ),
    },
    {
      baslik: 'Kategori',
      hucre: (u) => kategoriAdi(u.categoryId),
    },
    {
      baslik: 'Fiyat',
      hizala: 'sag',
      hucre: (u) => paraBicimle(u.price),
    },
    {
      baslik: 'Kâr',
      hizala: 'sag',
      hucre: (u) => {
        const kar = urunKari(u);

        // Maliyeti girilmemiş eski ürün → çizgi
        if (kar == null) {
          return <span style={{ color: 'var(--yaziGri)' }}>—</span>;
        }

        // ⭐ DEĞİŞTİ — marj da ortak dosyadan.
        // Elle "kar / price" yazsaydık, payda kararı burada bir
        // daha verilmiş olurdu; ortak dosya o kararı tek yerde
        // tutuyor (bkz. karMarji yorumu).
        const marj = karMarji(u.price, u.cost, u.vatRate) ?? 0;

        const renk =
          kar > 0 ? 'var(--basari)' : kar < 0 ? 'var(--hata)' : 'var(--yaziGri)';

        return (
          <div>
            <b style={{ color: renk }}>{paraBicimle(kar)}</b>
            <div style={{ fontSize: 12, color: 'var(--yaziGri)', marginTop: 2 }}>
              %{marj.toFixed(1)}
            </div>
          </div>
        );
      },
    },
    {
      baslik: 'Stok',
      hizala: 'sag',
      hucre: (u) => {
        if (u.stock === 0) {
          return <span className="stok-yok">TÜKENDİ</span>;
        }

        // ⚠️ stokEsigi !== null kontrolü ŞART.
        //
        // Ayarlar henüz gelmediyse (veya hata aldıysa) hiçbir şeyi
        // "az" diye boyamıyoruz. null ile karşılaştırma yapsaydık
        // JavaScript'te "u.stock < null" ifadesi null'ı 0'a
        // çevirirdi ve HİÇBİR ürün az görünmezdi — sessiz hata.
        //
        // Bu, "=== false" kuralının akrabası: eksik veriyi
        // varsayılan bir değermiş gibi davranmıyoruz.
        if (stokEsigi !== null && u.stock < stokEsigi) {
          return (
            <span
              className="stok-az"
              title={'Stok az (eşik: ' + stokEsigi + ')'}
            >
              {sayiBicimle(u.stock)}
            </span>
          );
        }

        return sayiBicimle(u.stock);
      },
    },
    {
      baslik: 'İşlemler',
      hizala: 'sag',
      hucre: (u) => (
        <div className="islem-butonlari">
          {/* ⭐ YENİ — satışa aç / satıştan kaldır */}
          <Buton
            tip="ikincil"
            boyut="kucuk"
            // ⭐ Rol DURUMA göre: satıştaki ürünü kaldırmak olumsuz
            // (turuncu), kaldırılmışı geri açmak olumlu (yeşil).
            // Tek butonun iki anlamı var; rengi de öyle olmalı.
            ikonRengi={u.isActive ? 'uyari' : 'basari'}
            onClick={() => durumDegistir(u)}
            disabled={durumDegisen === u.id}
            title={
              u.isActive
                ? 'Müşteri artık bu ürünü göremez ve sipariş edemez'
                : 'Ürün tekrar satışa açılır'
            }
          >
            {durumDegisen === u.id ? (
              '...'
            ) : u.isActive ? (
              <><Ban size={14} /> Satıştan Kaldır</>
            ) : (
              <><CheckCircle2 size={14} /> Satışa Aç</>
            )}
          </Buton>

          <Buton
            tip="ikincil"
            boyut="kucuk"
            ikonRengi="ana"
            onClick={() => navigate('/urunler/' + u.id + '/duzenle')}
          >
            <Pencil size={14} /> Düzenle
          </Buton>

          {/* ⭐ YENİ (4.8) — ÜÇÜNCÜ SEVİYE: ARŞİV

              Arşivli üründe tek anlamlı eylem geri çıkarmaktır;
              o yüzden buton "Arşivden Çıkar"a dönüşüyor. */}
          {u.arsivlendiMi && (
            <Buton
              tip="ikincil"
              boyut="kucuk"
              ikonRengi="basari"
              onClick={() => arsivDegistir(u)}
              disabled={durumDegisen === u.id}
              title="Ürün tekrar admin listesinde görünür (satışa açılmaz)"
            >
              <ArchiveRestore size={14} /> Arşivden Çıkar
            </Buton>
          )}

          {/* ⭐ DEĞİŞTİ (4.8) — "Sil" ARTIK HER ÜRÜNDE ÇIKMIYOR.

              Ürünün işlem geçmişi varsa (sipariş kalemi, yorum, stok
              hareketi) fiziksel silme sunucuda 409 ile reddediliyor.
              Basılamayacak bir buton göstermek admini yanıltır —
              yerine gerçekten yapabileceği eylemi koyuyoruz.

              ⚠️ Pratikte "Sil" NADİREN görünür: ürün oluşturmak bile
              stok defterine bir hareket yazıyor. Bu bir kusur değil,
              kuralın kendisi — fiziksel silme yalnızca "yanlışlıkla
              oluşturuldu, hiç kullanılmadı" durumu için.

              Arşivli üründe ikisi de çıkmıyor: zaten arşivde. */}
          {!u.arsivlendiMi && (
            u.silinebilirMi ? (
              <Buton tip="tehlike" boyut="kucuk" onClick={() => setSilinecek(u)}>
                <Trash2 size={14} /> Sil
              </Buton>
            ) : (
              <Buton
                tip="ikincil"
                boyut="kucuk"
                ikonRengi="uyari"
                onClick={() => arsivDegistir(u)}
                disabled={durumDegisen === u.id}
                title="Bu ürünün sipariş, yorum veya stok geçmişi var; silinemez. Arşivlemek listeden kaldırır, kaydı korur."
              >
                <Archive size={14} /> Arşivle
              </Buton>
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="sayfa-ust sayfa-ust-yatay">
        <div>
          <h1 className="sayfa-baslik">Ürünler</h1>
          <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
            Ürünleri görüntüle, düzenle veya sil
          </p>
        </div>

        <div className="sayfa-ust-butonlar">
          <Buton tip="ikincil" ikonRengi="ana" onClick={() => setIceAktarAcik(true)}>
            <Download size={15} /> Excel ile İçe Aktar
          </Buton>

          <Buton onClick={() => navigate('/urunler/yeni')}><Plus size={15} /> Yeni Ürün</Buton>
        </div>
      </div>

      <div className="filtre-cubugu">
        <AramaKutusu
          deger={arama}
          degistir={setArama}
          ipucu="Ürün adında ara..."
        />

        <select
          className="filtre-secim"
          value={kategoriId}
          onChange={(e) => setKategoriId(e.target.value)}
        >
          <option value="">Tüm kategoriler</option>

          {kategoriler.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>

        {/* ⭐ YENİ — durum filtresi */}
        <select
          className="filtre-secim"
          value={durumFiltre}
          onChange={(e) => setDurumFiltre(e.target.value)}
        >
          <option value="">Tüm durumlar</option>
          <option value="true">Sadece satıştakiler</option>
          <option value="false">Sadece satıştan kaldırılanlar</option>
        </select>

        <select
          className="filtre-secim"
          value={siralama}
          onChange={(e) => setSiralama(e.target.value)}
        >
          <option value="ad">İsme göre (A-Z)</option>
          <option value="fiyatArtan">Fiyat (artan)</option>
          <option value="fiyatAzalan">Fiyat (azalan)</option>
          <option value="karAzalan">Kâr (çoktan aza)</option>
          <option value="stokArtan">Stok (azdan çoğa)</option>
        </select>

        {/* ⭐ YENİ (4.8) — arşivlileri listeye dahil et.

            ⚠️ Neden select değil onay kutusu?
            Diğer filtreler bir DARALTMA yapıyor ("sadece şunlar").
            Bu ise GENİŞLETME: normalde gizli olanları da ekliyor.
            Aynı görsel dili kullansaydı admin bunun da bir daraltma
            olduğunu sanardı. */}
        <label className="filtre-onay">
          <input
            type="checkbox"
            checked={arsivGoster}
            onChange={(e) => setArsivGoster(e.target.checked)}
          />
          Arşivlileri göster
        </label>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={urunleriGetir} />}

      {yukleniyor ? (
        <Yukleniyor yazi="Ürünler getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={siraliUrunler}
            anahtar={(u) => u.id}
            // ⭐ YENİ — pasif ürünün satırı soluk çizilsin
            satirSinifi={(u) => (u.isActive ? '' : 'satir-pasif')}
            bosMesaj={
              arama !== '' || kategoriId !== '' || durumFiltre !== ''
                ? 'Bu filtreye uyan ürün yok.'
                : 'Henüz ürün eklenmemiş.'
            }
          />

          <p className="sonuc-sayisi">
            Toplam {sayiBicimle(siraliUrunler.length)} ürün listeleniyor.
          </p>
        </>
      )}

      <OnayPenceresi
        acik={silinecek !== null}
        baslik="Ürünü sil"
        mesaj={
          silinecek
            ? `"${silinecek.name}" ürününü ve tüm resimlerini silmek üzeresin. Bu işlem geri alınamaz. Ürünü geçici olarak satıştan kaldırmak istiyorsan "Satıştan Kaldır" butonunu kullan.`
            : ''
        }
        onayla={silmeyiOnayla}
        iptal={() => setSilinecek(null)}
        islemde={siliniyor}
      />

      <ExcelIceAktar
        acik={iceAktarAcik}
        kapat={() => setIceAktarAcik(false)}
        iceAktarimBitti={urunleriGetir}
      />

    </div>
  );
}