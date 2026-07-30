import OturumListesi from '../components/OturumListesi';

// Aktif oturumlar sayfası.
//
// Neden bu kadar ince bir dosya?
//   Tüm iş OturumListesi bileşeninde — veri çekme, listeleme, iptal.
//   Bu dosyanın tek işi sayfa başlığını koymak ve bileşeni ortalı
//   düzene yerleştirmek.
//
//   Bu ayrım kasıtlı: "sayfa" bir ROTA hedefidir (başlık, düzen,
//   sayfa seviyesindeki bağlam), "bileşen" bir İŞ birimidir.
//   Bileşen bu sayede /hesabim içine de gömülebilir, bir modalda da
//   gösterilebilir — sayfa dosyası buna karışmaz.
export default function OturumlarimSayfasi() {
  return (
    /* orta-sutun: index.css'teki ortak sınıf.
       HesabimSayfasi ile aynı genişlik ve hizalama — iki sayfa
       arasında geçerken göz kaymasın. */
    <div className="orta-sutun">
      <h1 className="sayfa-baslik">Aktif Oturumlar</h1>

      <p className="sayfa-altyazi">
        Hesabına hangi cihazlardan giriş yapıldığını buradan görebilir,
        tanımadığın oturumları kapatabilirsin
      </p>

      <OturumListesi />
    </div>
  );
}