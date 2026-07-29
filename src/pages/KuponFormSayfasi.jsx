import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet, apiPost, apiPut } from '../services/api';
import { paraBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';

import './KuponFormSayfasi.css';


/* ==========================================================
   TARİH DÖNÜŞTÜRÜCÜLERİ
   
   Burası kafa karıştırıcı ama kritik. Üç farklı tarih biçimi var:
   
   1) Veritabanı / backend : UTC (evrensel saat)
   2) <input type="datetime-local"> : "2026-08-01T17:30" — YEREL saat,
      saat dilimi bilgisi YOK
   3) Kullanıcının gördüğü : Türkiye saati (UTC+3)
   
   Dönüştürmezsek 3 saatlik kayma olur: admin "01 Ağustos 00:00'da
   başlasın" der, kupon 01 Ağustos 03:00'te başlar.
   ========================================================== */

// datetime-local değeri  →  sunucuya gidecek UTC ISO metni
// "2026-08-01T17:30"  →  "2026-08-01T14:30:00.000Z"
//
// new Date("2026-08-01T17:30") ifadesini JavaScript YEREL saat olarak
// yorumlar (saat dilimi eki olmayan tam tarih-saat için standart budur).
// .toISOString() ise her zaman UTC üretir. Yani dönüşüm bedava geliyor.
function yereldenUtc(inputDegeri) {
  if (!inputDegeri) {
    return null;
  }

  return new Date(inputDegeri).toISOString();
}

// Sunucudan gelen tarih  →  datetime-local'in istediği yerel metin
//
// ⚠️ Savunmacı bir adım var: backend bazen tarihi "Z" eki OLMADAN
//    gönderiyor (EF veritabanından okurken DateTimeKind bilgisi
//    kayboluyor). Eki yoksa biz ekliyoruz, yoksa JavaScript o metni
//    yerel saat sanar ve 3 saat kayar.
function utcdenInput(sunucuTarihi) {
  if (!sunucuTarihi) {
    return '';
  }

  const saatDilimiVarMi =
    sunucuTarihi.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(sunucuTarihi);

  const tamMetin = saatDilimiVarMi ? sunucuTarihi : sunucuTarihi + 'Z';

  const tarih = new Date(tamMetin);

  // toISOString() UTC verir ama input YEREL ister.
  // Saat dilimi farkını (dakika cinsinden) çıkarıp öyle biçimlendiriyoruz.
  // getTimezoneOffset() Türkiye'de -180 döner, o yüzden ÇIKARINCA ekleniyor.
  const yerel = new Date(tarih.getTime() - tarih.getTimezoneOffset() * 60000);

  // "2026-08-01T17:30:00.000Z" → "2026-08-01T17:30"
  return yerel.toISOString().slice(0, 16);
}

// Bugünden N gün sonrası, datetime-local biçiminde.
// Yeni kupon formunun varsayılan tarihleri için.
function gunSonrasi(gun) {
  const tarih = new Date();
  tarih.setDate(tarih.getDate() + gun);
  tarih.setSeconds(0, 0);

  const yerel = new Date(tarih.getTime() - tarih.getTimezoneOffset() * 60000);

  return yerel.toISOString().slice(0, 16);
}


export default function KuponFormSayfasi() {
  const { id } = useParams();
  const navigate = useNavigate();

  // id varsa düzenleme, yoksa oluşturma modundayız.
  // Boolean(undefined) → false, Boolean("5") → true
  const duzenlemeMi = Boolean(id);

  const [kategoriler, setKategoriler] = useState([]);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  // Önizleme kutusundaki deneme sepet tutarı.
  // Form verisinin parçası DEĞİL — sunucuya gitmiyor, sadece
  // adminin "şu tutarda ne olur" diye bakması için.
  const [denemeSepet, setDenemeSepet] = useState('1000');

  // ⚠️ Sayısal alanları bile METİN olarak tutuyoruz.
  //    Sebebi: kullanıcı alanı silince değer '' olur. Number('') = 0
  //    olduğu için sayı tutarsak kutuda "0" belirir ve kullanıcı
  //    onu silmek zorunda kalır. Metin tutup gönderirken çeviriyoruz.
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'yuzde',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startsAt: gunSonrasi(0),
    endsAt: gunSonrasi(30),
    usageLimit: '',
    usageLimitPerUser: '1',
    categoryId: '',
    isActive: true,
  });


  // ================= AÇILIŞ VERİSİ =================

  useEffect(() => {
    async function baslangicVerisi() {
      setYukleniyor(true);
      setHata('');

      try {
        // Kategori listesi her iki modda da lazım
        const kategoriVeri = await apiGet('/categories');
        setKategoriler(kategoriVeri);

        if (duzenlemeMi) {
          const k = await apiGet('/admin/coupons/' + id);

          setForm({
            code: k.code,
            description: k.description,
            discountType: k.discountType,
            discountValue: String(k.discountValue),

            // Sunucudan gelen sayıları metne çeviriyoruz (state metin tutuyor).
            // 0 ise boş bırakıyoruz ki kullanıcı "0" görüp silmek zorunda kalmasın.
            minOrderAmount: k.minOrderAmount > 0 ? String(k.minOrderAmount) : '',

            // != null → hem null hem undefined'ı yakalar
            maxDiscountAmount:
              k.maxDiscountAmount != null ? String(k.maxDiscountAmount) : '',

            startsAt: utcdenInput(k.startsAt),
            endsAt: utcdenInput(k.endsAt),

            usageLimit: k.usageLimit != null ? String(k.usageLimit) : '',
            usageLimitPerUser: String(k.usageLimitPerUser),
            categoryId: k.categoryId != null ? String(k.categoryId) : '',
            isActive: k.isActive,
          });
        }
      } catch (e) {
        setHata(e.message);
      } finally {
        setYukleniyor(false);
      }
    }

    baslangicVerisi();
  }, [id, duzenlemeMi]);


  // Tek bir alanı güncelleyen yardımcı.
  //
  // { ...form, [alan]: deger } — üç nokta mevcut alanları kopyalar,
  // köşeli parantez ise "değişken adını anahtar olarak kullan" demek.
  // Doğrudan form.name = deger yazsaydık React değişikliği fark etmezdi,
  // çünkü nesne referansı aynı kalırdı.
  function alanDegistir(alan, deger) {
    setForm({ ...form, [alan]: deger });
  }


  // ================= CANLI ÖNİZLEME =================
  //
  // ⚠️ Bu hesap KuponServisi.DogrulaAsync'in 8. ve 9. adımlarının
  //    JavaScript kopyasıdır. Bilinçli bir tekrar:
  //
  //    Backend'e sormak mümkün değil — kupon henüz KAYDEDİLMEDİ ve
  //    ortada gerçek bir sepet yok. Her tuşa basışta istek atmak da
  //    hem yavaş hem gereksiz.
  //
  //    Bu kutu bir OTORİTE DEĞİL, bir yardımcı. Gerçek indirim her
  //    zaman sipariş anında sunucuda hesaplanır.
  //
  //    Sadece TUTAR hesabını taklit ediyoruz. Tarih, kullanım limiti
  //    ve kategori kontrolleri burada YOK — onları sunucu yapar.

  const denemeTutar = Number(denemeSepet) || 0;
  const indirimDegeri = Number(form.discountValue) || 0;
  const altSinir = Number(form.minOrderAmount) || 0;

  const tavan =
    form.maxDiscountAmount === '' ? null : Number(form.maxDiscountAmount);

  // Hesap yapılabilir mi? Yapılamıyorsa null bırakıp boş kutu gösteriyoruz.
  let onizleme = null;

  if (denemeTutar > 0 && indirimDegeri > 0) {
    if (altSinir > 0 && denemeTutar < altSinir) {
      // Alt sınırın altında → kupon geçmez
      onizleme = {
        gecerli: false,
        mesaj:
          'Bu sepette kupon geçersiz — en az ' +
          paraBicimle(altSinir) +
          ' gerekiyor.',
      };
    } else {
      let indirim =
        form.discountType === 'yuzde'
          ? (denemeTutar * indirimDegeri) / 100
          : indirimDegeri;

      // Tavan sadece yüzdeli kuponda uygulanır
      let tavanaTakildi = false;

      if (form.discountType === 'yuzde' && tavan != null && indirim > tavan) {
        indirim = tavan;
        tavanaTakildi = true;
      }

      // İndirim sepetten büyük olamaz — yoksa müşteriye para vermiş oluruz.
      // KuponServisi'nde de aynı koruma var.
      let sepetiAsti = false;

      if (indirim > denemeTutar) {
        indirim = denemeTutar;
        sepetiAsti = true;
      }

      // Kuruşa yuvarla
      indirim = Math.round(indirim * 100) / 100;

      onizleme = {
        gecerli: true,
        indirim: indirim,
        yeniToplam: denemeTutar - indirim,
        tavanaTakildi: tavanaTakildi,
        sepetiAsti: sepetiAsti,
      };
    }
  }

  // Önizleme kutusunun rengini belirleyen sınıf — türetilmiş değer
  const onizlemeSinifi =
    onizleme === null
      ? 'kupon-onizleme-bos'
      : onizleme.gecerli
        ? 'kupon-onizleme-gecerli'
        : 'kupon-onizleme-uyari';


  // ================= KAYDET =================

  async function formGonder(e) {
    // Tarayıcının varsayılan davranışı formu gönderip sayfayı
    // yeniden yüklemektir. Tek sayfa uygulamada bunu istemiyoruz.
    e.preventDefault();

    setHata('');
    setBasari('');

    // Tarayıcı "bu tarih şu tarihten sonra olmalı" kontrolünü yapamaz,
    // required/min/max sadece tek alana bakar. İlişkili kontrolü biz yapıyoruz.
    //
    // Not: backend de aynı kontrolü yapıyor. Buradaki kontrol sadece
    // kullanıcıyı gereksiz bir ağ turundan kurtarmak için — güvenlik
    // değil, kolaylık.
    if (new Date(form.endsAt) <= new Date(form.startsAt)) {
      setHata('Bitiş tarihi başlangıç tarihinden sonra olmalı.');
      return;
    }

    setKaydediliyor(true);

    try {
      // Metin state'i sunucunun beklediği tiplere çeviriyoruz.
      const govde = {
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount) || 0,

        // Boş bırakıldıysa veya tutar tipiyse null gönder.
        // Backend de aynı temizliği yapıyor ama doğru veri göndermek
        // istemcinin de sorumluluğu.
        maxDiscountAmount:
          form.discountType === 'yuzde' && form.maxDiscountAmount !== ''
            ? Number(form.maxDiscountAmount)
            : null,

        startsAt: yereldenUtc(form.startsAt),
        endsAt: yereldenUtc(form.endsAt),

        // Boş = sınırsız
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),

        usageLimitPerUser: Number(form.usageLimitPerUser),

        // Boş = tüm ürünlerde geçerli
        categoryId: form.categoryId === '' ? null : Number(form.categoryId),

        isActive: form.isActive,
      };

      if (duzenlemeMi) {
        // ⚠️ 'code' GÖNDERİLMİYOR — CouponUpdateDto'da o alan hiç yok.
        //    Kupon kodu değiştirilemez çünkü geçmiş siparişler
        //    Order.CouponCode alanında o metni dondurmuş durumda.
        await apiPut('/admin/coupons/' + id, govde);
        setBasari('Kupon güncellendi. ✅');
      } else {
        await apiPost('/admin/coupons', {
          ...govde,
          code: form.code.trim().toUpperCase(),
        });

        // Oluşturmada listeye dönüyoruz — admin genelde arka arkaya
        // kupon eklemez, eklediğini listede görmek ister.
        navigate('/kuponlar');
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


  // ================= EKRAN =================

  return (
    <div className="kupon-form-sarmal">
      <h1 className="sayfa-baslik">
        {duzenlemeMi ? 'Kuponu Düzenle' : 'Yeni Kupon'}
      </h1>

      <p className="sayfa-altyazi">
        {duzenlemeMi
          ? form.code + ' kuponunun ayarlarını güncelle'
          : 'İndirim kuralını tanımla, sağdaki önizlemeden kontrol et'}
      </p>

      {basari !== '' && <div className="kupon-form-basari">{basari}</div>}

      <form className="kupon-form-kutu" onSubmit={formGonder}>

        {hata !== '' && (
          <div style={{ marginBottom: 18 }}>
            <HataKutusu mesaj={hata} />
          </div>
        )}


        {/* ============ TEMEL BİLGİLER ============ */}

        <div className="kupon-form-bolum">🎟️ Temel Bilgiler</div>

        <div className="kupon-form-alan">
          <label className="kupon-form-etiket">Kupon Kodu</label>

          <input
            className="kupon-form-input kupon-form-kod"
            type="text"
            value={form.code}
            onChange={(e) => alanDegistir('code', e.target.value)}
            placeholder="YILBASI25"
            required
            minLength={3}
            maxLength={50}
            /* readOnly, disabled DEĞİL. Farkı önemli:
               disabled → alan formla birlikte gönderilmez ve
                          metin seçilip kopyalanamaz
               readOnly → değer görünür, kopyalanabilir, sadece
                          değiştirilemez
               Burada adminin kodu görüp kopyalayabilmesini istiyoruz. */
            readOnly={duzenlemeMi}
          />

          <div className="kupon-form-ipucu">
            {duzenlemeMi
              ? 'Kupon kodu değiştirilemez — geçmiş siparişler bu koda referans veriyor.'
              : 'Müşterinin sepette yazacağı kod. Otomatik BÜYÜK harfe çevrilir.'}
          </div>
        </div>

        <div className="kupon-form-alan">
          <label className="kupon-form-etiket">Açıklama</label>

          <input
            className="kupon-form-input"
            type="text"
            value={form.description}
            onChange={(e) => alanDegistir('description', e.target.value)}
            placeholder="Örn: Yılbaşı kampanyası"
            required
            minLength={2}
            maxLength={200}
          />

          <div className="kupon-form-ipucu">
            Sadece sen görürsün, müşteriye gösterilmez.
          </div>
        </div>


        {/* ============ İNDİRİM KURALI ============ */}

        <div className="kupon-form-bolum">💰 İndirim Kuralı</div>

        <div className="kupon-form-ikili">
          <div className="kupon-form-alan">
            <label className="kupon-form-etiket">İndirim Tipi</label>

            <select
              className="kupon-form-input"
              value={form.discountType}
              onChange={(e) => alanDegistir('discountType', e.target.value)}
            >
              <option value="yuzde">Yüzde (%)</option>
              <option value="tutar">Sabit Tutar (₺)</option>
            </select>
          </div>

          <div className="kupon-form-alan">
            {/* Etiket de türetilmiş — tipe göre değişiyor */}
            <label className="kupon-form-etiket">
              {form.discountType === 'yuzde'
                ? 'İndirim Oranı (%)'
                : 'İndirim Tutarı (₺)'}
            </label>

            <input
              className="kupon-form-input"
              type="number"
              /* ⚠️ step, SIFIRA göre değil MIN'e göre doğrulanır.
                 Geçerli değerler kümesi:  min + (n × step)
                 
                 Eskiden step="1" + min="0.01" yazıyordu. Bu da geçerli
                 değerleri 0.01, 1.01, 2.01 ... 14.01, 15.01 yapıyordu —
                 yani düz "15" REDDEDİLİYOR, ok tuşuna basınca 14.01'e
                 yapışıyordu.
                 
                 step="any" bu kontrolü tamamen kapatır. Ok tuşları yine
                 1'er artırır (tarayıcı varsayılanı), ama elle %12.5 gibi
                 ondalıklı değer de yazılabilir. Üst sınırı max="100"
                 zaten tutuyor, alt sınırı da min="0.01".
                 
                 Tutar tipinde step="0.01" doğru: min de 0.01 olduğu için
                 taban uyumlu ve ok tuşları kuruş kuruş ilerliyor. */
              step={form.discountType === 'yuzde' ? 'any' : '0.01'}
              min="0.01"
              /* Yüzdede tarayıcı da 100'ü aşmayı engellesin.
                 Tutar tipinde üst sınır yok. */
              max={form.discountType === 'yuzde' ? '100' : undefined}
              value={form.discountValue}
              onChange={(e) => alanDegistir('discountValue', e.target.value)}
              placeholder={form.discountType === 'yuzde' ? '20' : '50.00'}
              required
            />
          </div>
        </div>

        {/* ⭐ KOŞULLU ALAN
            Sadece yüzde tipinde görünür. Ayrı bir state tutmuyoruz —
            görünürlük discountType'tan TÜRETİLİYOR. State tutsaydık
            tipi değiştiren her yerde onu da güncellemeyi hatırlamak
            zorunda kalırdık. */}
        {form.discountType === 'yuzde' && (
          <div className="kupon-form-alan">
            <label className="kupon-form-etiket">
              İndirim Tavanı (₺) — isteğe bağlı
            </label>

            <input
              className="kupon-form-input"
              type="number"
              step="0.01"
              min="0.01"
              value={form.maxDiscountAmount}
              onChange={(e) =>
                alanDegistir('maxDiscountAmount', e.target.value)
              }
              placeholder="Boş bırak = sınır yok"
            />

            <div className="kupon-form-ipucu">
              "%20 indirim ama en fazla 200 TL" gibi bir üst sınır koyar.
              Yüksek tutarlı sepetlerde zarar etmeni önler.
            </div>
          </div>
        )}

        <div className="kupon-form-alan">
          <label className="kupon-form-etiket">
            Minimum Sepet Tutarı (₺) — isteğe bağlı
          </label>

          <input
            className="kupon-form-input"
            type="number"
            step="0.01"
            min="0"
            value={form.minOrderAmount}
            onChange={(e) => alanDegistir('minOrderAmount', e.target.value)}
            placeholder="Boş bırak = alt sınır yok"
          />

          <div className="kupon-form-ipucu">
            Sepet bu tutarın altındaysa kupon çalışmaz.
          </div>
        </div>


        {/* ============ CANLI ÖNİZLEME ============ */}

        <div className={'kupon-onizleme ' + onizlemeSinifi}>
          <div className="kupon-onizleme-baslik">
            🔍 Tahmini Hesap
          </div>

          <div className="kupon-onizleme-giris">
            <label>Deneme sepet tutarı:</label>

            <input
              type="number"
              step="0.01"
              min="0"
              value={denemeSepet}
              onChange={(e) => setDenemeSepet(e.target.value)}
            />

            <span style={{ color: 'var(--yaziGri)' }}>₺</span>
          </div>

          {onizleme === null && (
            <div className="kupon-onizleme-bos-yazi">
              İndirim değerini gir, hesap burada görünecek.
            </div>
          )}

          {onizleme !== null && !onizleme.gecerli && (
            <div className="kupon-onizleme-bos-yazi">
              ⚠️ {onizleme.mesaj}
            </div>
          )}

          {onizleme !== null && onizleme.gecerli && (
            <>
              <div className="kupon-onizleme-satir">
                <span className="kupon-onizleme-etiket">Ara toplam</span>
                <span className="kupon-onizleme-deger">
                  {paraBicimle(denemeTutar)}
                </span>
              </div>

              <div className="kupon-onizleme-satir">
                <span className="kupon-onizleme-etiket">İndirim</span>
                <span className="kupon-onizleme-deger kupon-onizleme-indirim">
                  −{paraBicimle(onizleme.indirim)}
                </span>
              </div>

              <div className="kupon-onizleme-satir">
                <span className="kupon-onizleme-etiket">Müşteri öder</span>
                <span className="kupon-onizleme-deger">
                  {paraBicimle(onizleme.yeniToplam)}
                </span>
              </div>

              {onizleme.tavanaTakildi && (
                <div className="kupon-onizleme-not">
                  ℹ️ İndirim tavana takıldı — tavan olmasaydı daha yüksek olacaktı.
                </div>
              )}

              {onizleme.sepetiAsti && (
                <div className="kupon-onizleme-not">
                  ⚠️ İndirim sepet tutarını aşıyordu, sepete eşitlendi.
                  Müşteri hiçbir zaman para almaz.
                </div>
              )}
            </>
          )}

          <div className="kupon-onizleme-not">
            Bu hesap yalnızca tutar kurallarını gösterir. Tarih, kullanım
            limiti ve kategori kontrollerini sunucu yapar.
          </div>
        </div>


        {/* ============ GEÇERLİLİK ============ */}

        <div className="kupon-form-bolum">📅 Geçerlilik</div>

        <div className="kupon-form-ikili">
          <div className="kupon-form-alan">
            <label className="kupon-form-etiket">Başlangıç</label>

            <input
              className="kupon-form-input"
              /* datetime-local: hem tarih hem saat seçtirir.
                 Sadece "date" kullansaydık saat 00:00 olurdu ve
                 "bugün başlasın" diyen admin kuponun geçmişte
                 başladığını görürdü — kafa karıştırıcı. */
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => alanDegistir('startsAt', e.target.value)}
              required
            />
          </div>

          <div className="kupon-form-alan">
            <label className="kupon-form-etiket">Bitiş</label>

            <input
              className="kupon-form-input"
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => alanDegistir('endsAt', e.target.value)}
              required
            />
          </div>
        </div>


        {/* ============ KULLANIM SINIRLARI ============ */}

        <div className="kupon-form-bolum">🔢 Kullanım Sınırları</div>

        <div className="kupon-form-ikili">
          <div className="kupon-form-alan">
            <label className="kupon-form-etiket">
              Toplam Kullanım Limiti
            </label>

            <input
              className="kupon-form-input"
              type="number"
              step="1"
              min="1"
              value={form.usageLimit}
              onChange={(e) => alanDegistir('usageLimit', e.target.value)}
              placeholder="Boş bırak = sınırsız"
            />

            <div className="kupon-form-ipucu">
              Bu sayıya ulaşınca kupon "Tükendi" durumuna geçer.
            </div>
          </div>

          <div className="kupon-form-alan">
            <label className="kupon-form-etiket">
              Kişi Başı Kullanım
            </label>

            <input
              className="kupon-form-input"
              type="number"
              step="1"
              min="1"
              max="100"
              value={form.usageLimitPerUser}
              onChange={(e) =>
                alanDegistir('usageLimitPerUser', e.target.value)
              }
              required
            />

            <div className="kupon-form-ipucu">
              Bir müşteri bu kuponu kaç kez kullanabilir.
            </div>
          </div>
        </div>

        <div className="kupon-form-alan">
          <label className="kupon-form-etiket">Kategori Sınırı</label>

          <select
            className="kupon-form-input"
            value={form.categoryId}
            onChange={(e) => alanDegistir('categoryId', e.target.value)}
          >
            <option value="">Tüm ürünlerde geçerli</option>

            {kategoriler.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>

          <div className="kupon-form-ipucu">
            Kategori seçersen indirim sadece o kategorideki ürünlerin
            toplamına uygulanır. Minimum sepet tutarı yine tüm sepete bakar.
          </div>
        </div>


        {/* ============ DURUM ============ */}

        <div className="kupon-form-bolum">⚙️ Durum</div>

        <div className="kupon-form-alan">
          <label className="kupon-form-onay">
            <input
              type="checkbox"
              checked={form.isActive}
              /* Checkbox'ta e.target.value DEĞİL e.target.checked okunur.
                 value her zaman "on" döner, işe yaramaz. */
              onChange={(e) => alanDegistir('isActive', e.target.checked)}
            />

            <span>
              <b>Kupon aktif</b>

              <div className="kupon-form-ipucu" style={{ marginTop: 3 }}>
                İşareti kaldırırsan kupon taslak olarak kaydedilir; tarih
                aralığı uygun olsa bile müşteri kullanamaz.
              </div>
            </span>
          </label>
        </div>


        {/* ============ BUTONLAR ============ */}

        <div className="kupon-form-butonlar">
          <Buton type="submit" disabled={kaydediliyor}>
            {kaydediliyor
              ? 'Kaydediliyor...'
              : duzenlemeMi
                ? '💾 Değişiklikleri Kaydet'
                : '➕ Kuponu Oluştur'}
          </Buton>

          <Buton
            /* type="button" ŞART. Belirtmezsek tarayıcı varsayılan olarak
               "submit" sayar ve bu butona basınca form gönderilir. */
            type="button"
            tip="ikincil"
            onClick={() => navigate('/kuponlar')}
            disabled={kaydediliyor}
          >
            {duzenlemeMi ? 'Listeye Dön' : 'Vazgeç'}
          </Buton>
        </div>

      </form>
    </div>
  );
}