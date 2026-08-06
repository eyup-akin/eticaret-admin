import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet, apiPost, apiPut, apiYukle } from '../services/api'; // ⭐ apiYukle eklendi
import { paraBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import ResimYukleyici from '../components/ResimYukleyici';
import BekleyenResimler from '../components/BekleyenResimler'; // ⭐ YENİ

import StokHareketleri from '../components/StokHareketleri'; // ⭐ YENİ

import './UrunFormSayfasi.css';

export default function UrunFormSayfasi() {
  const { id } = useParams();
  const navigate = useNavigate();

  const duzenlemeMi = Boolean(id);

  const [kategoriler, setKategoriler] = useState([]);
  const [resimler, setResimler] = useState([]);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  // ⭐ YENİ — hangi sekme açık?
  //
  // Varsayılan 'bilgiler': sayfanın asıl işi bu. Yeni ürün
  // modunda sekme şeridi hiç çizilmediği için bu değer zaten
  // hiç değişmez ve sayfa bugünküyle birebir aynı davranır.
  const [aktifSekme, setAktifSekme] = useState('bilgiler');

  // ⭐ YENİ — yeni üründe resimler kaydedilene kadar burada bekler
  const [bekleyenDosyalar, setBekleyenDosyalar] = useState([]);
  const [bekleyenLinkler, setBekleyenLinkler] = useState([]);
  const [yuklemeDurumu, setYuklemeDurumu] = useState('');

  const [form, setForm] = useState({
    name: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    categoryId: '',

    // ⭐ YENİ — ürün satışta mı?
    //
    // Neden diğer alanlar gibi '' (boş string) değil de gerçek boolean?
    // Diğerleri metin girdisi — "Sayısal form alanlarını metin state'te
    // tut" kuralı onlar için geçerli (Number('') = 0 tuzağı). Checkbox
    // ise doğrudan boolean çalışır, e.target.checked zaten boolean döner.
    // Tipi zorlamaya gerek yok.
    //
    // Varsayılan true: yeni ürün formu açıldığında ürün satışa hazır
    // gelsin. Admin isterse kapatır.
    isActive: true,
    // ⭐ YENİ — ürün açıklaması.
    //
    // Boş string ile başlıyor: textarea'nın value'su asla undefined
    // olmamalı, yoksa React kontrolsüz bileşen uyarısı verir ve
    // sonradan yazı girilince "uncontrolled to controlled" hatası
    // fırlatır.
    description: '',

    // ⭐ YENİ — KDV oranı.
    //
    // Neden metin ('20'), neden sayı (20) değil?
    // <select> değerleri her zaman string'dir; sayı tutsaydık
    // value={20} ile option value="20" karşılaştırması tutmaz ve
    // seçili görünmezdi. Gönderirken Number() ile çeviriyoruz —
    // "sayısal form alanlarını metin state'te tut" kuralı.
    //
    // Varsayılan '20': yeni ürün genel orana düşsün.
    vatRate: '20',
  });

  // ---------- ÜRÜNÜ ÇEK (resimler dahil) ----------
  async function urunuYenile() {
    const urun = await apiGet('/products/' + id);

    setForm({
      name: urun.name,
      barcode: urun.barcode || '',
      price: String(urun.price),
      cost: urun.cost != null ? String(urun.cost) : '',
      stock: String(urun.stock),
      categoryId: String(urun.categoryId),

      // ⭐ YENİ — sunucudan gelen durumu forma yansıt.
      //
      // ?? true kullanıyoruz (|| true DEĞİL): eğer bir şekilde alan
      // gelmezse (eski sürüm API, ağ hatası) ürünü kazara pasife
      // düşürmeyelim. || kullansaydık false değeri de true'ya
      // çevrilirdi — pasif ürünü açmaya çalışmış olurduk.
      isActive: urun.isActive ?? true,
      // ⭐ YENİ — açıklama.
      //
      // || '' kullanıyoruz (?? '' değil): backend null gönderiyor
      // ama boş string de gelebilir. İkisi de aynı sonucu vermeli.
      // Burada sıfır gibi "geçerli falsy değer" riski yok, o yüzden
      // || uygun.
      description: urun.description || '',

      // ⭐ YENİ — KDV oranı.
      //
      // ?? 20 kullanıyoruz (|| 20 DEĞİL): alan gelmezse genel orana
      // düşmek doğru davranış. Burada || de aynı sonucu verirdi çünkü
      // 0 geçerli bir oran değil — ama ?? niyeti daha net anlatıyor:
      // "sadece bilgi gelmediyse varsayılana düş".
      vatRate: String(urun.vatRate ?? 20),
    });

    setResimler(urun.images || []);
  }

  // ---------- AÇILIŞ ----------
  useEffect(() => {
    async function baslangicVerisi() {
      setYukleniyor(true);
      setHata('');

      try {
        const kategoriVeri = await apiGet('/categories');
        setKategoriler(kategoriVeri);

        if (duzenlemeMi) {
          await urunuYenile();
        }
      } catch (e) {
        setHata(e.message);
      } finally {
        setYukleniyor(false);
      }
    }

    baslangicVerisi();
  }, [id, duzenlemeMi]);

  function alanDegistir(alan, deger) {
    setForm({ ...form, [alan]: deger });
  }

  // ---------- CANLI KÂR HESABI ----------
  const fiyatSayi = Number(form.price);
  const maliyetSayi = Number(form.cost);

  const karHesaplanabilir =
    form.price !== '' &&
    form.cost !== '' &&
    !Number.isNaN(fiyatSayi) &&
    !Number.isNaN(maliyetSayi) &&
    fiyatSayi > 0;

  const kar = karHesaplanabilir ? fiyatSayi - maliyetSayi : 0;
  const marj = karHesaplanabilir ? (kar / fiyatSayi) * 100 : 0;

  const karDurum =
    kar > 0 ? 'kar-pozitif' : kar < 0 ? 'kar-negatif' : 'kar-sifir';

  // ---------- BEKLEYEN RESİMLERİ YÜKLE ----------
  // Ürün oluştuktan (id geldikten) sonra çağrılır.
  // Bir resim patlarsa ürünü iptal etmeyiz, atlar devam ederiz.
  async function bekleyenleriYukle(yeniId) {
    const toplam = bekleyenDosyalar.length + bekleyenLinkler.length;
    let sayac = 0;

    for (const dosya of bekleyenDosyalar) {
      sayac++;
      setYuklemeDurumu(`Resimler yükleniyor... (${sayac}/${toplam})`);

      try {
        await apiYukle('/products/' + yeniId + '/images', dosya);
      } catch (e) {
        console.error('Resim yüklenemedi:', dosya.name, e.message);
      }
    }

    for (const link of bekleyenLinkler) {
      sayac++;
      setYuklemeDurumu(`Resimler yükleniyor... (${sayac}/${toplam})`);

      try {
        await apiPost('/products/' + yeniId + '/images/url', { url: link });
      } catch (e) {
        console.error('Link yüklenemedi:', link, e.message);
      }
    }

    setYuklemeDurumu('');
  }

  // ---------- KAYDET ----------
  async function formGonder(e) {
    e.preventDefault();

    setHata('');
    setBasari('');
    setKaydediliyor(true);

    try {
      const govde = {
        name: form.name.trim(),
        barcode: form.barcode.trim(),
        price: Number(form.price),
        cost: Number(form.cost),
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
        isActive: form.isActive,      // ⭐ YENİ

        description: form.description.trim(),   // ⭐ YENİ

        // ⭐ YENİ — KDV oranı. State'te metin, gövdede sayı.
        // Sunucu beyaz liste doğrulaması yapıyor (1/10/20); buradaki
        // <select> zaten o üç değeri sunuyor ama asıl kilit sunucuda.
        vatRate: Number(form.vatRate),
      };

      if (duzenlemeMi) {
        await apiPut('/products/' + id, govde);
        setBasari('Ürün güncellendi. ✅');
      } else {
        // 1) Önce ürünü oluştur, id'yi al
        const cevap = await apiPost('/products', govde);
        const yeniId = cevap.id;

        // 2) Bekleyen resimleri (varsa) o id'ye yükle
        if (bekleyenDosyalar.length + bekleyenLinkler.length > 0) {
          await bekleyenleriYukle(yeniId);
        }

        // 3) Düzenleme ekranına geç — artık resimleri buradan yönetebilir
        navigate('/urunler/' + yeniId + '/duzenle', { replace: true });
        return;
      }
    } catch (e) {
      setHata(e.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Form hazırlanıyor..." />;
  }

  return (
    <div>
      <h1 className="sayfa-baslik">
        {duzenlemeMi ? 'Ürünü Düzenle' : 'Yeni Ürün'}
      </h1>

      <p className="sayfa-altyazi">
        {duzenlemeMi
          ? `#${id} numaralı ürünün bilgilerini ve resimlerini yönet`
          : 'Bilgileri doldur, dilersen resimleri de ekle, sonra tek tuşla kaydet'}
      </p>

      {basari !== '' && <div className="basari-kutusu">{basari}</div>}

      {/* Resim yükleme sürüyorsa durumu göster */}
      {yuklemeDurumu !== '' && (
        <div className="basari-kutusu">{yuklemeDurumu}</div>
      )}


      {/* ================= SEKME ŞERİDİ ================= */}
      {/*
        Sadece DÜZENLEME modunda çiziliyor.

        Yeni ürün eklerken ortada henüz bir id yok, dolayısıyla
        hiç stok hareketi de yok. Sekmeyi gösterip pasifleştirmek
        "burada bir şey var ama sana yok" demek olurdu; tek
        sekmelik bir şerit de zaten anlamsız.

        "Menü öğesi, arkasındaki sayfa hazır olduğunda eklenir."
      */}
      {duzenlemeMi && (
        <div className="sekme-serit" style={{ marginBottom: 20 }}>

          {/* ⚠️ type="button" ŞART.
              Belirtilmeyen buton form içinde submit sayılır.
              Bu iki buton form etiketinin DIŞINDA ama alışkanlık
              hâline getirmek gerekiyor — yarın biri bu bloğu
              formun içine taşırsa sekmeye tıklamak ürünü
              kaydederdi. */}
          <button
            type="button"
            className={
              'sekme' + (aktifSekme === 'bilgiler' ? ' sekme-aktif' : '')
            }
            onClick={() => setAktifSekme('bilgiler')}
          >
            <span className="sekme-ikon">📝</span>
            Bilgiler
          </button>

          <button
            type="button"
            className={
              'sekme' + (aktifSekme === 'stok' ? ' sekme-aktif' : '')
            }
            onClick={() => setAktifSekme('stok')}
          >
            <span className="sekme-ikon">📦</span>
            Stok Hareketleri
          </button>

        </div>
      )}


      {/* ⚠️ KOŞULLU RENDER — display:none DEĞİL.
          
          display:none sadece görsel gizler; bileşen ağaçta kalır
          ve useEffect'i çalışmaya devam eder. Koşullu render'da
          bileşen HİÇ mount olmaz, dolayısıyla API isteği de
          atmaz. Sekme değişince unmount olur, state'i temizlenir. */}
      {aktifSekme === 'bilgiler' && (
      <div className="form-izgara">

        {/* ================= SOL: BİLGİ FORMU ================= */}
        <form className="form-kutu" onSubmit={formGonder}>

          {hata !== '' && (
            <div style={{ marginBottom: 18 }}>
              <HataKutusu mesaj={hata} />
            </div>
          )}

          {/* Ürün Adı */}
          <div className="form-alan">
            <label className="form-etiket">Ürün Adı</label>

            <input
              className="form-input"
              type="text"
              value={form.name}
              onChange={(e) => alanDegistir('name', e.target.value)}
              placeholder="Örn: Nike Air Max"
              required
              minLength={2}
              maxLength={200}
            />

            <div className="form-ipucu">2-200 karakter arası olmalı.</div>
          </div>

          {/* Barkod (zorunlu, benzersiz) */}
          <div className="form-alan">
            <label className="form-etiket">Barkod</label>

            <input
              className="form-input"
              type="text"
              value={form.barcode}
              onChange={(e) => alanDegistir('barcode', e.target.value)}
              placeholder="Örn: 8690000000001"
              required
              maxLength={64}
            />

            <div className="form-ipucu">
              Her ürün için benzersiz olmalı. Zorunlu alan.
            </div>
          </div>

          {/* Fiyat | Maliyet */}
          <div className="form-ikili">
            <div className="form-alan">
              <label className="form-etiket">Fiyat (₺)</label>

              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => alanDegistir('price', e.target.value)}
                placeholder="2499.90"
                required
              />
            </div>

            <div className="form-alan">
              <label className="form-etiket">Maliyet (₺)</label>

              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={(e) => alanDegistir('cost', e.target.value)}
                placeholder="1800.00"
                required
              />
            </div>
          </div>

          {/* ⭐ YENİ — KDV ORANI

              Fiyatın hemen altında duruyor çünkü fiyatı AÇIKLIYOR:
              yukarıdaki tutarın içinde ne kadar vergi olduğunu belirler.
              Stok/kategori satırına koysaydık para bilgisiyle envanter
              bilgisi karışırdı.

              ⚠️ Serbest sayı girişi DEĞİL, açılır menü. Türkiye'de
              yalnızca üç oran yürürlükte; %7 veya %13 yazılabilseydi
              o ürünün faturası yanlış kesilirdi. Bu bir hesap hatası
              değil vergi hatası olurdu.

              ⚠️ Asıl kilit yine SUNUCUDA: ProductCreateDto'daki
              [KdvOraniGecerli] beyaz listesi. Buradaki menü kolaylık
              içindir, koruma değil — istek Postman'den de gelebilir. */}
          <div className="form-ikili">
            <div className="form-alan">
              <label className="form-etiket">KDV Oranı</label>

              <select
                className="form-input"
                value={form.vatRate}
                onChange={(e) => alanDegistir('vatRate', e.target.value)}
                required
              >
                <option value="1">%1 — temel gıda</option>
                <option value="10">%10 — indirimli oran</option>
                <option value="20">%20 — genel oran</option>
              </select>

              <div className="form-ipucu">
                Girdiğin fiyat <b>KDV dahildir</b>. Bu oran fiyatın
                üstüne eklenmez, içinden ayrıştırılır.
              </div>
            </div>

            {/* İkinci sütun bilerek boş: KDV tek başına bir satırı
                doldurmuyor ama form-ikili ızgarasını bozmadan hizalı
                kalması için sarmalayıcıyı kullanıyoruz. */}
            <div />
          </div>

          {/* Canlı kâr önizlemesi */}
          <div
            className={`kar-onizleme ${karHesaplanabilir ? karDurum : 'kar-bos'}`}
          >
            {karHesaplanabilir ? (
              <>
                <div className="kar-satir">
                  <span className="kar-etiket">Net Kâr (adet başı)</span>
                  <span className="kar-deger">{paraBicimle(kar)}</span>
                </div>

                <div className="kar-satir">
                  <span className="kar-etiket">Kâr Marjı</span>
                  <span className="kar-deger">%{marj.toFixed(1)}</span>
                </div>
              </>
            ) : (
              <span className="kar-bos-yazi">
                Fiyat ve maliyet girince net kâr burada görünecek.
              </span>
            )}
          </div>

          {/* Stok | Kategori */}
          <div className="form-ikili">
            <div className="form-alan">
              <label className="form-etiket">Stok Adedi</label>

              <input
                className="form-input"
                type="number"
                step="1"
                min="0"
                value={form.stock}
                onChange={(e) => alanDegistir('stock', e.target.value)}
                placeholder="25"
                required
              />
            </div>

            <div className="form-alan">
              <label className="form-etiket">Kategori</label>

              <select
                className="form-input"
                value={form.categoryId}
                onChange={(e) => alanDegistir('categoryId', e.target.value)}
                required
              >
                <option value="">Kategori seçin...</option>

                {kategoriler.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* ⭐ YENİ — satış durumu.
              
              Neden checkbox, neden iki radyo düğmesi değil?
              İki durumu olan, biri "normal" sayılan ayarlarda checkbox
              doğru araçtır. Radyo düğmesi eşit ağırlıklı seçenekler
              içindir (ör. kargo firması seçimi). Burada "satışta" varsayılan
              ve normal durum, "kaldırıldı" istisnai durum. */}
          <div className="form-alan">
            <label className="form-onay-satir">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => alanDegistir('isActive', e.target.checked)}
              />

              <span className="form-etiket" style={{ marginBottom: 0 }}>
                Ürün satışta
              </span>
            </label>

            <div className="form-ipucu">
              {form.isActive
                ? 'Müşteriler bu ürünü görebilir ve sipariş edebilir.'
                : 'Ürün müşterilere görünmez ve sipariş edilemez. Sepetlerde duruyorsa sipariş aşamasında engellenir.'}
            </div>
          </div>


          {/* ⭐ YENİ — ÜRÜN AÇIKLAMASI */}
          <div className="form-alan">
            <div className="form-etiket-satir">
              <label className="form-etiket">Ürün Açıklaması</label>

              {/* ⚠️ TÜRETİLMİŞ DEĞER — ayrı state'te tutulmuyor.
                  
                  "karakterSayisi" diye bir useState açsaydık her
                  tuş vuruşunda iki state güncellemek ve ikisini
                  senkron tutmak gerekirdi. Hesaplanabilen şey
                  saklanmaz. */}
              <span
                className={
                  'form-sayac' +
                  (form.description.length > 1800 ? ' form-sayac-dolu' : '')
                }
              >
                {form.description.length} / 2000
              </span>
            </div>

            <textarea
              className="form-input form-metin-alan"
              value={form.description}
              onChange={(e) => alanDegistir('description', e.target.value)}
              placeholder="Beden, malzeme, garanti, kutu içeriği, kullanım bilgisi..."
              rows={6}

              /* maxLength ÖN YÜZ kolaylığı: kullanıcı 2000'i geçemez,
                 yazarken durur. Gerçek koruma backend'deki
                 [MaxLength(2000)] — bu alan Postman'den de gelebilir. */
              maxLength={2000}
            />

            <div className="form-ipucu">
              İsteğe bağlı. Müşteri ürün detay sayfasında görecek.
            </div>
          </div>

          <div className="form-butonlar">
            <Buton type="submit" disabled={kaydediliyor}>
              {kaydediliyor
                ? 'Kaydediliyor...'
                : duzenlemeMi
                  ? '💾 Bilgileri Güncelle'
                  : '➕ Ürünü Kaydet'}
            </Buton>

            <Buton
              type="button"
              tip="ikincil"
              onClick={() => navigate('/urunler')}
              disabled={kaydediliyor}
            >
              {duzenlemeMi ? 'Listeye Dön' : 'Vazgeç'}
            </Buton>
          </div>
        </form>

        {/* ================= SAĞ: RESİMLER ================= */}
        <div className="form-kutu form-kutu-sag">
          <div className="bolum-baslik-form">🖼️ Ürün Resimleri</div>

          <div className="bolum-altyazi-form">
            {duzenlemeMi
              ? 'İlk yüklenen resim otomatik ana resim olur. Değiştirmek için resmin üstüne gelip ⭐ butonuna bas.'
              : 'Resimleri şimdi ekleyebilirsin; ürünü kaydedince otomatik yüklenecekler.'}
          </div>

          {duzenlemeMi ? (
            <ResimYukleyici
              urunId={Number(id)}
              resimler={resimler}
              yenile={urunuYenile}
            />
          ) : (
            <BekleyenResimler
              dosyalar={bekleyenDosyalar}
              setDosyalar={setBekleyenDosyalar}
              linkler={bekleyenLinkler}
              setLinkler={setBekleyenLinkler}
            />
          )}
        </div>

      </div>
      )}

      {/* ================= STOK HAREKETLERİ SEKMESİ ================= */}
      {/*
        duzenlemeMi kontrolünü BURADA DA yapıyoruz.

        Gereksiz görünüyor (şerit zaten sadece düzenlemede
        çiziliyor, sekme değiştirilemez) ama savunmacı: yarın
        biri varsayılan sekmeyi 'stok' yaparsa yeni ürün modunda
        urunId undefined ile istek atılırdı.
      */}
      {aktifSekme === 'stok' && duzenlemeMi && (
        <StokHareketleri urunId={Number(id)} />
      )}
    </div>
  );
}