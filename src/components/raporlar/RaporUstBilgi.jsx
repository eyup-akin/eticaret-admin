import Buton from '../Buton';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { Download } from 'lucide-react';

// ============================================================
//  RAPOR ÜST BİLGİSİ — dönem + dışa aktar butonu
//
//  NEDEN AYRI BİLEŞEN?
//  Dokuz raporun hepsinde aynı satır var: solda dönem bilgisi,
//  sağda indirme butonu. Kopyalasaydık buton metnini değiştirmek
//  dokuz dosyaya dokunmak olurdu.
//
//  PROPS:
//    baslangic / bitis : sunucudan gelen dönem
//    ekBilgi           : rapora özel açıklama (opsiyonel)
//    disaAktar         : tıklanınca çalışacak fonksiyon
//                        (verilmezse buton hiç çizilmez)
// ============================================================
export default function RaporUstBilgi({
  baslangic,
  bitis,
  ekBilgi = null,
  disaAktar = null,
}) {
  return (
    <div className="rapor-bilgi">
      {/* Dönem SUNUCUDAN gelen değerle yazılıyor.
          Kullanıcı tarih seçmediyse "son 30 gün" kuralı sunucuda
          yaşıyor — burada tahmin etmek ikinci bir gerçek yaratırdı. */}
      {baslangic && (
        <span>
          Dönem: <b>{baslangic}</b> – <b>{bitis}</b>
        </span>
      )}

      {ekBilgi && <span>{ekBilgi}</span>}

      {/* Buton sağa yapışsın diye araya esneyen boşluk.
          margin-left:auto klasik flex hilesi: bu öğe soldaki tüm
          boşluğu yer, kendisi sağa itilir. */}
      {disaAktar && (
        <div style={{ marginLeft: 'auto' }}>
          <Buton tip="ikincil" boyut="kucuk" ikonRengi="ana" onClick={disaAktar}>
            <Download size={15} /> Excel'e Aktar
          </Buton>
        </div>
      )}
    </div>
  );
}