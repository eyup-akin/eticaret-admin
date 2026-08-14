// ============================================================
//  DENETİM DEĞERİ GÖSTERİMİ — eski → yeni
//
//  ⚠️ İKİ BİÇİMİ BİRDEN ÇİZİYOR.
//
//  Yeni çağrı yerleri JSON yazıyor ({"fiyat":100,"stok":5}), eski beş
//  çağrı yeri ve tüm geçmiş satırlar DÜZ METİN ("customer", "v3").
//  Sütun tipi değişmedi (nvarchar), eski satırlar dönüştürülmedi —
//  serbest metni JSON'a çevirmek tahmin yürütmek olurdu.
//
//  Bu yüzden burada tek kural var: ayrıştırılabiliyorsa alan alan
//  göster, ayrıştırılamıyorsa ham metni bas. Ekran ikisinde de çalışır.
// ============================================================

// JSON ise nesneye çevirir, değilse null döner.
//
// ⚠️ JSON.parse sayı ve metinleri de kabul ediyor ("5" → 5). Bizim
// istediğimiz yalnızca NESNE; aksi hâlde "v3" gibi bir değer sayı
// sanılıp alan listesi olarak çizilmeye çalışılırdı.
function nesneyeCevir(metin) {
  if (!metin) {
    return null;
  }

  try {
    const cozulen = JSON.parse(metin);

    if (cozulen && typeof cozulen === 'object' && !Array.isArray(cozulen)) {
      return cozulen;
    }
  } catch {
    // Düz metin — normal bir durum, hata değil.
  }

  return null;
}

// Değerleri ekranda okunur hale getirir.
//
// ⚠️ null "—" olarak çiziliyor, boş string olarak değil: "veri yok"
// ile "değer boş" farklı şeyler ve bu projede null'ın anlamı
// "bilinmiyor".
function degerYazisi(deger) {
  if (deger === null || deger === undefined) {
    return '—';
  }

  if (typeof deger === 'boolean') {
    return deger ? 'evet' : 'hayır';
  }

  return String(deger);
}

export default function DegerGosterimi({ eski, yeni }) {
  // İkisi de boşsa bu bir "değer değişikliği" değil, bir OLAY
  // (yorum gizleme gibi). Boş hücre bırakmak yerine tire koyuyoruz.
  if (!eski && !yeni) {
    return <span className="denetim-bos">—</span>;
  }

  const eskiNesne = nesneyeCevir(eski);
  const yeniNesne = nesneyeCevir(yeni);

  // İkisinden en az biri JSON ise alan alan çiz.
  if (eskiNesne || yeniNesne) {
    // ⚠️ İKİ TARAFIN ANAHTARLARI BİRLEŞTİRİLİYOR.
    // Yalnızca eskininkileri gezseydik, eklenen bir alan (silmede
    // olmayan, oluşturmada olan) hiç görünmezdi.
    const anahtarlar = [
      ...new Set([
        ...Object.keys(eskiNesne ?? {}),
        ...Object.keys(yeniNesne ?? {}),
      ]),
    ];

    return (
      <div className="deger-alanlar">
        {anahtarlar.map((ad) => (
          <div key={ad} className="deger-satir">
            <span className="deger-ad">{ad}</span>

            <span className="denetim-degisim">
              <span className="denetim-eski">
                {degerYazisi(eskiNesne?.[ad])}
              </span>
              <span className="denetim-ok"> → </span>
              <span className="denetim-yeni">
                {degerYazisi(yeniNesne?.[ad])}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Düz metin — eski kayıtların biçimi.
  return (
    <span className="denetim-degisim">
      <span className="denetim-eski">{eski || '—'}</span>
      <span className="denetim-ok"> → </span>
      <span className="denetim-yeni">{yeni || '—'}</span>
    </span>
  );
}
