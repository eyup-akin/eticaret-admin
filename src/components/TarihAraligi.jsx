import Buton from './Buton';
import './TarihAraligi.css';

// ============================================================
//  ORTAK TARİH ARALIĞI SEÇİCİ
//
//  NEDEN AYRI BİLEŞEN?
//  Bu mantık şu an Ödemeler sayfasının içinde yaşıyor. Raporlar
//  sayfasında da aynısı gerekiyor. Kopyalasaydık:
//    • "Bu Hafta" butonu eklemek iki yere dokunmak olurdu
//    • Birinde düzeltilen hata diğerinde kalırdı
//
//  Projedeki kural: "Kural tek yerde kullanılıyorsa orada durur;
//  İKİNCİ tüketici çıktığı an ortak yere taşınır."
//  İşte ikinci tüketici çıktı — taşıma zamanı.
//
//  PROPS:
//    baslangic  : "2026-08-01" veya "" (seçilmemiş)
//    bitis      : "2026-08-31" veya ""
//    degistir   : (yeniBaslangic, yeniBitis) => void
//    temizlenebilir : "Temizle" butonu görünsün mü (varsayılan true)
//
//  NEDEN İKİ AYRI setter DEĞİL DE TEK degistir FONKSİYONU?
//  Hızlı butonlar ikisini BİRLİKTE değiştiriyor ("Son 7 Gün" hem
//  başlangıcı hem bitişi kurar). İki setter geçseydik çağıran her
//  yerde ikisini de çağırmayı hatırlamak gerekirdi ve biri
//  unutulduğunda yarım bir aralık oluşurdu.
//  Tek fonksiyon, "aralık bir bütündür" fikrini koda yazıyor.
// ============================================================

// ---- Tarih yardımcıları ----
//
// HTML <input type="date"> sadece "YYYY-MM-DD" biçimini kabul eder.
// slice(0, 10) ISO metninin gün kısmını alıyor.
//
// ⚠️ toISOString() UTC'ye çevirir! Türkiye'de 3 Ağustos 01:00'da
// çağrılırsa "2026-08-02" döner — bir gün geriye kayar.
// Bu yüzden yerel bileşenlerden elle kuruyoruz.
function yerelGun(tarih) {
  const yil = tarih.getFullYear();

  // getMonth() 0'dan başlar (Ocak = 0), o yüzden +1.
  // padStart: "8" → "08", çünkü input tek haneli ay kabul etmez.
  const ay = String(tarih.getMonth() + 1).padStart(2, '0');
  const gun = String(tarih.getDate()).padStart(2, '0');

  return `${yil}-${ay}-${gun}`;
}

function bugun() {
  return yerelGun(new Date());
}

function gunOnce(gunSayisi) {
  const t = new Date();
  t.setDate(t.getDate() - gunSayisi);
  return yerelGun(t);
}

function ayBasi() {
  const t = new Date();
  return yerelGun(new Date(t.getFullYear(), t.getMonth(), 1));
}

export default function TarihAraligi({
  baslangic,
  bitis,
  degistir,
  temizlenebilir = true,
}) {

  // Hızlı seçim butonlarının tanımı.
  //
  // NEDEN DİZİ, NEDEN 5 AYRI <Buton>?
  // Beş buton elle yazılsaydı her biri aynı yapıyı tekrarlardı ve
  // yeni bir aralık ("Bu Hafta") eklemek 12 satır kopyalamak olurdu.
  // Dizi haline getirince buton listesi VERİ olur, JSX sadece onu
  // çizer. Yeni aralık = bir satır.
  const araliklar = [
    { kod: 'bugun', yazi: 'Bugün',       bas: bugun(),     bit: bugun() },
    { kod: '7gun',  yazi: 'Son 7 Gün',   bas: gunOnce(6),  bit: bugun() },
    { kod: '30gun', yazi: 'Son 30 Gün',  bas: gunOnce(29), bit: bugun() },
    { kod: 'buAy',  yazi: 'Bu Ay',       bas: ayBasi(),    bit: bugun() },
  ];

  // HANGİ BUTON SEÇİLİ?
  //
  // Bu bilgiyi state'te TUTMUYORUZ, baslangic/bitis'ten TÜRETİYORUZ.
  //
  // Sebep: aynı gerçek iki yerde saklanırsa er ya da geç birbirini
  // tutmaz. Kullanıcı tarihi elle değiştirdiğinde ayrı bir state'i
  // temizlemeyi unutsak buton yanlış yerde yanılı kalırdı.
  // Türetince o ihtimal yok — ekran her zaman gerçek veriyi gösterir.
  //
  // find: eşleşen ilk aralığı bulur, yoksa undefined.
  // ?.kod: undefined'da patlamaz, undefined döner.
  // ?? '': hiçbiri eşleşmezse boş metin (hiçbir buton vurgulanmaz).
  const aktif = araliklar.find(
    (a) => a.bas === baslangic && a.bit === bitis
  )?.kod ?? '';

  // Tarih hiç seçilmemiş mi? Temizle butonunu pasif yapmak için.
  const bosMu = baslangic === '' && bitis === '';

  return (
    <div className="tarih-araligi">

      {/* ---- HIZLI BUTONLAR ---- */}
      {/* Seçili olan "ana" tipine geçer (dolu renkli),
          diğerleri "ikincil" kalır (çerçeveli). */}
      {araliklar.map((a) => (
        <Buton
          key={a.kod}
          tip={aktif === a.kod ? 'ana' : 'ikincil'}
          boyut="kucuk"
          onClick={() => degistir(a.bas, a.bit)}
        >
          {a.yazi}
        </Buton>
      ))}

      {/* ---- ÖZEL ARALIK ---- */}
      <div className="tarih-ozel">
        <label className="tarih-etiket">
          Başlangıç

          <input
            className="tarih-girdi"
            type="date"
            value={baslangic}
            onChange={(e) => degistir(e.target.value, bitis)}

            /* max: başlangıç bitişten sonra olamaz.
               Tarayıcı bunu takvimde gri gösterir — kullanıcı
               hatayı YAPMADAN önce görür.
               undefined veriyoruz çünkü boş metin ("") verilirse
               bazı tarayıcılar tüm tarihleri kilitler. */
            max={bitis || undefined}
          />
        </label>

        <span className="tarih-tire">–</span>

        <label className="tarih-etiket">
          Bitiş

          <input
            className="tarih-girdi"
            type="date"
            value={bitis}
            onChange={(e) => degistir(baslangic, e.target.value)}
            min={baslangic || undefined}
          />
        </label>
      </div>

      {/* ---- TEMİZLE ---- */}
      {/* Temizle bir "durum" değil, bir "eylem" — asla vurgulanmaz.
          Silinecek tarih yoksa pasif kalsın ki boşuna tıklanmasın. */}
      {temizlenebilir && (
        <Buton
          tip="ikincil"
          boyut="kucuk"
          disabled={bosMu}
          onClick={() => degistir('', '')}
        >
          ✕ Temizle
        </Buton>
      )}
    </div>
  );
}