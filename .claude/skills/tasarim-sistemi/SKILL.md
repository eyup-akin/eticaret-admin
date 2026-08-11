---
name: tasarim-sistemi
description: Admin panelde herhangi bir görsel değişiklik yaparken kullan — CSS yazarken, yeni sayfa/bileşen eklerken, renk/boşluk/köşe/punto seçerken, grafik renklendirirken. Token adlarını, hazır primitive sınıfları ve "yapma" listesini içerir.
---

# Admin Panel Tasarım Sistemi

Bu panelde **hiçbir görsel değer elle yazılmaz.** Sabit bir sayı ya da renk
yazmak üzereysen, önce burada karşılığı var mı diye bak.

## Token'lar nerede yaşıyor

| Ne | Nerede | Nasıl kullanılır |
|---|---|---|
| Renk, gölge, grafik paleti | `src/theme/tema.js` | `var(--anaRenk)` (CSS) veya `renkler.anaRenk` (JS) |
| Boşluk, köşe, punto, satır yüksekliği | `src/index.css` `:root` | `var(--bosluk4)` |

⚠️ **Ayrım kuralı:** Bir değer açık/koyu temada **değişiyorsa** `tema.js`'e,
**değişmiyorsa** `index.css`'e girer. Ölçekleri temaya koymak, iki nesnede
birden tanımlamak ve birini güncellemeyi unutmak demektir.

⚠️ **`tema.js` DÜZ nesne olmak zorunda.** `TemaContext` her anahtarı CSS
değişkenine düzleştiriyor; iç içe nesne `[object Object]` olur ve sessizce
bozulur.

⚠️ **İki temanın anahtarları birebir aynı olmalı.** `TemaContext` CSS
değişkenlerini yazıyor ama eskileri silmiyor — tek temada tanımlı bir token,
tema değişince eski değeriyle asılı kalır. `tema.js` sonundaki geliştirme
zamanı kontrolü bunu konsola yazar.

## Ölçekler

```
--bosluk1..6      4  8  12  16  24  32
--kose-kucuk      8      (rozet, küçük kutu)
--kose-orta       12     (input, ikincil kutu)
--kose-buyuk      16     (KART — varsayılan)
--kose-dev        20     (öne çıkan panel)
--kose-tam        999    (hap: rozet, chip)
--yazi-mikro..dev 11 12 14 15 18 22 30
--satir-sik/normal/genis  1.3 1.5 1.7
```

Ara değer yok. 10px veya 18px gerekiyorsa genelde yanlış olan ölçek değil,
yerleşimdir.

## Renk rolleri

```
anaRenk anaRenkKoyu anaRenkUstuYazi
arkaPlan kartArka acikKart acikGri
yaziKoyu yaziOrta yaziGri
kenarlik inputKenar
basari uyari hata pasif
yumusakBasari yumusakUyari yumusakHata yumusakVurgu   ← rozet zeminleri
iskeletArka
golgeSm golgeMd golgeLg
grafik1..grafik8                                       ← SADECE grafik serileri
menuArka menuYazi menuAktifArka menuAktifYazi
```

## Hazır primitive'ler (`index.css`)

| Sınıf | Ne zaman |
|---|---|
| `.kart` | Beyaz zeminli içerik kutusu. Kenarlık YOK, gölge var |
| `.kart-etkilesimli` | Sadece kart tıklanabilirse ekle (hover yükselmesi) |
| `.bolum-basligi` + `-yazi` + `-alt` | Başlık solda, eylem sağda |
| `.chip` / `.chip-secili` | **Tıklanabilir** filtre/seçim hapı |
| `.trend-rozet` + `.trend-artis/-dusus/-notr` | "+%10" / "−%12" göstergesi |
| `.sayfa-ust` | Her sayfa başlığı sarmalayıcısı |
| `.sayfa-ust-yatay` | **Sadece** sağda buton varsa ek olarak |
| `.filtre-cubugu` / `.filtre-secim` | Filtre satırı ve açılır menüleri |

Ortak bileşenler: `Buton` `Rozet` `Tablo` `Sayfalama` `Yukleniyor`
`HataKutusu` `OnayPenceresi` `OzetKart` `AramaKutusu` `TarihAraligi`.
**Yenisini yazma, önce bunlara bak.**

## İkonlar ve ikon rengi

Arayüzde **emoji yok** — hepsi `lucide-react` çizgi ikonu. Tek tek
import et (`import { Pencil } from 'lucide-react'`), asla
`import * as Icons`.

⚠️ İkon ayrı bir SVG **öğesi**, emoji gibi satır içi bir karakter
değil. Bir başlığa ya da etikete ikon koyuyorsan o sınıfa
`display: flex; align-items: center; gap: var(--bosluk2)` gerekir —
yoksa ikon kendi satırına düşer. Boyutu **JSX'teki `size` prop'unda**
tut, CSS'e `font-size` yazma (iki yerden boyut = biri eskiyecek).

### `Buton`'da `ikonRengi`

İkincil butonda ikon `currentColor` miras alır ve her eylem aynı griye
düşer. Eylemin ağırlığını göstermek için rol ver:

| `ikonRengi` | Anlam | Örnek |
|---|---|---|
| `"uyari"` | geri alınabilir **olumsuz** değişiklik | Satıştan Kaldır, Arşivle, Duraklat, Gizle |
| `"basari"` | **olumlu** değişiklik | Satışa Aç, Aktifleştir, Onayla, Arşivden Çıkar |
| `"ana"` | **nötr** eylem | Düzenle, Kopyala, İndir, Etiket Yazdır |

Tek butonun iki durumu varsa rol de duruma bağlanır:
`ikonRengi={u.isActive ? 'uyari' : 'basari'}`

⚠️ `tip="ana"` ve `tip="tehlike"` butonlarda **rol verme** — ilkinde
ikon zaten beyaz, ikincisinde zaten kırmızı ve hover'da zemin
kırmızıya döndüğü için sabit renk ikonu görünmez yapar. CSS'te
güvenlik ağı var ama baştan verme.

⚠️ **Yalnızca ikon renklenir, metin değil.** Metni de renklendirmek
butonu durum rozetine benzetir; buton bir EYLEM, rozet bir DURUM.

⚠️ **Metinsiz (yalnız ikon) butonlarda renk ZORUNLU.** Orada renk,
şekilden sonraki tek ayırt edici — `title` yalnızca üzerine gelince
okunur. Örnek: `.resim-mini-buton-vurgu` / `.resim-mini-buton-sil`.

## Grafikler

Renkler `renkler.grafik1..8`'den, **sabit sırayla** alınır — asla
döndürülmez, asla rastgele üretilmez. Aynı seri her grafikte aynı rengi
almalı.

⚠️ **Durum renkleri (`basari`/`uyari`/`hata`) seri rengi olarak
KULLANILMAZ.** Bu panelde yeşil "işlem başarılı" demek; bir seriyi onunla
boyamak o serinin iyi bir şey olduğunu ima eder.

⚠️ Palet **ölçülerek** seçildi (renk körlüğü ayrımı, kroma tabanı, kontrast).
Yeni renk eklemen gerekirse göz kararı yapma — `dataviz` skill'indeki
doğrulayıcıyı çalıştır.

⚠️ Koyu tema renkleri açık temanınkinin çevrilmişi değil, koyu yüzeye göre
ayrıca basamaklanmış hali. Yeni bir seri eklersen iki modu da doğrula.

## Yapma listesi

- ❌ CSS'e sabit renk kodu (`#2563eb`) veya `rgba(...)` yazma → token kullan
- ❌ Sabit `px` yazma → ölçek değişkeni kullan
- ❌ Kartlara 1px kenarlık verme → `box-shadow: var(--golgeSm)`
- ❌ Ortak bileşenin sınıf adını sayfa CSS'inde yeniden tanımlama
- ❌ Sadece tek temada token tanımlama

## ⚠️ CSS'te kapsam YOK

Vite tüm CSS'i tek pakette birleştirir. `SiparisDetaySayfasi.css`'te yazdığın
`.ozet-deger`, `OzetKart` bileşeninin `.ozet-deger`'ini ezer — hata mesajı
çıkmaz, sadece görünüm bozulur. **Bu tam olarak yaşandı.**

Sayfaya özel sınıflara konuya özgü ad ver (`.tutar-deger` gibi), ortak
olanları `index.css`'e taşı.

Yeni bir sınıf adı eklerken kontrol et:

```bash
grep -rn "^\.sinif-adi" src --include=*.css
```
