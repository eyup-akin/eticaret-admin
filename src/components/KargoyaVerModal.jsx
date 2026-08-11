import { useState, useEffect } from 'react';
import Buton from './Buton';
import './KargoyaVerModal.css';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { AlertTriangle, Truck } from 'lucide-react';

// Siparişi kargoya verirken firma ve takip numarası toplayan pencere.
//
// acik     : görünsün mü
// firmalar : seçilebilecek kargo firmaları (sunucudan geliyor)
// kapat    : "Vazgeç" veya perdeye tıklayınca çalışır
// kaydet   : (firma, takipNo) => Promise — onay butonuna basınca
// islemde  : istek sürerken true, butonlar kilitlenir
//
// ⚠️ Bu bileşen VERİ İŞİ YAPMIYOR. apiPut çağrısı sayfada duruyor.
// Sebep: modal sadece "bilgi topla ve ver" işini biliyor. İsteği kendi
// atsaydı, hata mesajını nereye yazacağı, sayfayı ne zaman yenileyeceği
// gibi kararları da vermesi gerekirdi — bunlar sayfanın işi.
// Bileşen ne kadar az şey bilirse o kadar çok yerde kullanılır.
export default function KargoyaVerModal({
  acik,
  firmalar = [],
  kapat,
  kaydet,
  islemde = false,
}) {
  const [firma, setFirma] = useState('');
  const [takipNo, setTakipNo] = useState('');

  // ⚠️ HOOK'LAR ERKEN RETURN'DEN ÖNCE OLMALI.
  //
  // Aşağıda "if (!acik) return null" var. useEffect'leri onun ALTINA
  // koysaydık, pencere kapalıyken hook'lar çalışmaz, açılınca çalışırdı.
  // React her render'da AYNI SAYIDA ve AYNI SIRADA hook bekler; sayı
  // değişince "Rendered fewer hooks than expected" hatası verir.
  //
  // Kural: hook'lar bileşenin en üstünde, koşulsuz.

  // Pencere her AÇILDIĞINDA alanları temizle.
  //
  // Neden gerekli? Bileşen kapalıyken DOM'dan siliniyor ama state
  // sıfırlanmıyor — React bileşeni ağaçtan çıkarmıyor, sadece null
  // döndürüyoruz. Temizlemesek admin bir siparişi kargoya verip başka
  // bir siparişin penceresini açtığında ÖNCEKİ takip numarasını
  // görürdü ve yanlışlıkla onu kaydedebilirdi.
  useEffect(() => {
    if (acik) {
      setFirma('');
      setTakipNo('');
    }
  }, [acik]);

  // Esc tuşuyla kapatma.
  //
  // Perdeye tıklamak zaten kapatıyor ama klavye kullanan için yol yok.
  // Modal açan her arayüzde Esc beklenen davranıştır.
  //
  // İşlem sürerken kapanmıyor: istek yolda giderken pencereyi kapatmak
  // admin'e "iptal ettim" hissi verir ama istek sunucuya varmıştır.
  useEffect(() => {
    if (!acik) {
      return;
    }

    function tusDinle(olay) {
      if (olay.key === 'Escape' && !islemde) {
        kapat();
      }
    }

    window.addEventListener('keydown', tusDinle);

    // Temizlik zorunlu: kaldırmasaydık her açılışta bir dinleyici daha
    // eklenir, kapanışta hiçbiri silinmezdi (bellek sızıntısı).
    return () => window.removeEventListener('keydown', tusDinle);
  }, [acik, islemde, kapat]);

  if (!acik) {
    return null;
  }

  // Türetilmiş geçerlilik — ayrı state tutmuyoruz.
  //
  // Neden takip no için en az 3 karakter? Gerçek numaralar 10+ hanelidir
  // ama firma bazında değiştiği için katı bir kural koyamayız. 3, "yanlışlıkla
  // tek harf yazıp Enter'a basma" hatasını yakalayan alt sınır.
  const gecerli = firma !== '' && takipNo.trim().length >= 3;

  return (
    <div className="kargo-perde" onClick={islemde ? undefined : kapat}>
      {/* stopPropagation: kutunun İÇİNE tıklayınca pencere kapanmasın.
          Olay balonlanarak perdeye çıkar ve onun onClick'ini tetiklerdi. */}
      <div className="kargo-kutu" onClick={(e) => e.stopPropagation()}>

        <div className="kargo-modal-baslik"><Truck size={18} /> Siparişi Kargoya Ver</div>

        <div className="kargo-modal-aciklama">
          Kargo firmasını seç ve firmadan aldığın takip numarasını gir.
          Bu bilgiler müşteriye görünecek ve <b>sonradan değiştirilemeyecek</b>.
        </div>

        {/* ---------- FİRMA ---------- */}
        <label className="kargo-etiket" htmlFor="kargo-firma">
          Kargo Firması
        </label>

        <select
          id="kargo-firma"
          className="kargo-secim"
          value={firma}
          onChange={(e) => setFirma(e.target.value)}
          disabled={islemde}
        >
          {/* Boş seçenek bilinçli: listedeki ilk firmayı varsayılan
              yapsaydık, admin menüye hiç bakmadan kaydedip yanlış firma
              yazabilirdi. Boş bırakmak seçimi zorunlu kılıyor. */}
          <option value="">Firma seç...</option>

          {firmalar.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {/* Sunucudan liste gelmezse admin çıkmazda kalmasın, sebebini bilsin */}
        {firmalar.length === 0 && (
          <div className="kargo-uyari">
            <AlertTriangle size={14} /> Kargo firması listesi yüklenemedi. Sunucudaki
            <code> appsettings.json → Kargo:Firmalar </code>
            ayarını kontrol et.
          </div>
        )}

        {/* ---------- TAKİP NUMARASI ---------- */}
        <label className="kargo-etiket" htmlFor="kargo-takip">
          Takip Numarası
        </label>

        <input
          id="kargo-takip"
          className="kargo-girdi"
          type="text"
          value={takipNo}
          onChange={(e) => setTakipNo(e.target.value)}
          placeholder="Örn: YK1234567890"
          maxLength={50}
          disabled={islemde}
          /* Takip numaraları sözlükte olmayan karakter dizileri.
             Tarayıcı/telefon "düzeltmeye" kalkarsa numara bozulur. */
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          /* Pencere açılınca imleç doğrudan buraya gelsin — firma
             menüsü zaten tek tıkla seçiliyor, asıl yazma işi burada.
             Sıralamayı bozmuyoruz: admin Tab ile geri gidebilir. */
          autoFocus
          /* Enter'a basınca kaydet — form etiketi kullanmadığımız için
             bu davranışı elle veriyoruz. */
          onKeyDown={(e) => {
            if (e.key === 'Enter' && gecerli && !islemde) {
              kaydet(firma, takipNo.trim());
            }
          }}
        />

        <div className="kargo-ipucu">
          {takipNo.trim().length} / 50 karakter · en az 3
        </div>

        {/* ---------- BUTONLAR ---------- */}
        <div className="kargo-modal-butonlar">
          <Buton tip="ikincil" onClick={kapat} disabled={islemde}>
            Vazgeç
          </Buton>

          <Buton
            onClick={() => kaydet(firma, takipNo.trim())}
            disabled={!gecerli || islemde}
          >
            {islemde ? 'Kaydediliyor...' : <><Truck size={15} /> Kargoya Ver</>}
          </Buton>
        </div>

      </div>
    </div>
  );
}