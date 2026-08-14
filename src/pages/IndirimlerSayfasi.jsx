import { useEffect, useState } from 'react';

import { apiGet, apiPut, apiDelete, apiPost } from '../services/api';
import { paraBicimle, sayiBicimle } from '../utils/bicimlendir';
import { resimUrl } from '../utils/resim';
import { urunKari } from '../utils/kar';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import AramaKutusu from '../components/AramaKutusu';
import Tablo from '../components/Tablo';
import OnayPenceresi from '../components/OnayPenceresi';

import './IndirimlerSayfasi.css';

import { Camera, Percent, TicketPercent, X, AlertTriangle } from 'lucide-react';

// ============================================================
//  İNDİRİMLER
//
//  ⚠️ İNDİRİM AYRI BİR KAYIT DEĞİL. Ürünün `eskiFiyat` alanı
//  doluysa ve güncel fiyattan büyükse o ürün indirimdedir. Bu sayfa
//  yeni bir varlık yönetmiyor, mevcut iki alanı yönetiyor.
//
//  ⚠️ HESABI SUNUCU YAPIYOR. Panel "%20" gönderiyor, yeni fiyatı
//  `IndirimUygulayici` hesaplayıp kaydediyor. Aşağıdaki önizleme
//  yalnızca ADMİN İÇİN bir tahmin — kaydedilen değer sunucudan
//  dönüyor ve liste onunla tazeleniyor.
// ============================================================

// Önizleme için taban fiyat: ürün zaten indirimliyse indirimsiz hâli.
//
// ⚠️⚠️ BU KURAL SUNUCUDAKİ `IndirimUygulayici.Taban` İLE AYNI OLMAK
// ZORUNDA. Biri değişirse diğeri de değişmeli. Kopya bilinçli: iki
// ayrı dil, paylaşılan kod yok — `utils/kar.js`'te kabul edilen
// kopyayla aynı durum.
//
// Taban güncel fiyat olsaydı, %20 indirimli bir ürüne ikinci kez %20
// yazmak indirimi ÜST ÜSTE bindirirdi.
function tabanFiyat(urun) {
  return urun.eskiFiyat && urun.eskiFiyat > urun.price ? urun.eskiFiyat : urun.price;
}

function indirimdeMi(urun) {
  return Boolean(urun.eskiFiyat) && urun.eskiFiyat > urun.price;
}

// Görüntülenen indirim yüzdesi.
//
// ⚠️ AŞAĞI YUVARLANIYOR — mobildeki `utils/indirim.js` ile aynı.
// Müşteriye gösterilen oranla panelde görünen oran birbirini
// tutmalı; biri 16, diğeri 17 yazarsa hangisinin doğru olduğu
// sorulur.
function indirimYuzdesi(urun) {
  if (!indirimdeMi(urun)) {
    return 0;
  }

  return Math.floor(((urun.eskiFiyat - urun.price) / urun.eskiFiyat) * 100);
}

const BOS_FORM = { tip: 'yuzde', deger: '' };

export default function IndirimlerSayfasi() {
  const [urunler, setUrunler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  const [arama, setArama] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [siralama, setSiralama] = useState('ad');
  const [sadeceIndirimli, setSadeceIndirimli] = useState(false);

  // Seçili ürün id'leri — toplu indirim için.
  const [secili, setSecili] = useState([]);

  // Açık form. null = kapalı.
  //   { urun }  → tek ürün
  //   { toplu } → seçili ürünlerin tamamı
  const [formHedefi, setFormHedefi] = useState(null);
  const [form, setForm] = useState(BOS_FORM);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const [kaldirilacak, setKaldirilacak] = useState(null);

  useEffect(() => {
    let iptal = false;

    apiGet('/categories')
      .then((veri) => { if (!iptal) setKategoriler(veri); })
      .catch(() => { /* kategori filtresi bir kolaylık; gelmezse sayfa yine çalışır */ });

    return () => { iptal = true; };
  }, []);

  async function urunleriGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      const p = new URLSearchParams();

      if (arama.trim() !== '') p.append('search', arama.trim());
      if (kategoriId !== '') p.append('categoryId', kategoriId);

      // ⚠️ Süzgeç SUNUCUDA. Listeyi çekip burada filtrelemek de
      // mümkündü ama "indirimde mi" kuralı o zaman üçüncü kez
      // yazılırdı (sunucu, mobil, panel). Sunucudaki tek kural
      // kazanıyor.
      if (sadeceIndirimli) p.append('sadeceIndirimli', 'true');

      const sorgu = p.toString();
      const veri = await apiGet(sorgu === '' ? '/products' : '/products?' + sorgu);

      setUrunler(veri);

      // ⚠️ Liste değişince seçim TEMİZLENİYOR. Filtre daraldığında
      // ekranda görünmeyen ürünler seçili kalsaydı, admin "3 ürün"
      // sanıp 30 ürüne indirim uygulayabilirdi.
      setSecili([]);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // Yazmayı bırakalı 400ms geçtiyse iste. (Ürünler sayfasıyla aynı desen.)
  useEffect(() => {
    const sayac = setTimeout(urunleriGetir, 400);
    return () => clearTimeout(sayac);
  }, [arama, kategoriId, sadeceIndirimli]);

  function secimDegistir(id) {
    setSecili((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }

  function formuAc(hedef) {
    setFormHedefi(hedef);

    // Ürün zaten indirimliyse mevcut oranı doldur: admin çoğu zaman
    // sıfırdan girmiyor, var olanı değiştiriyor.
    if (hedef.urun && indirimdeMi(hedef.urun)) {
      setForm({ tip: 'yuzde', deger: String(indirimYuzdesi(hedef.urun)) });
    } else {
      setForm(BOS_FORM);
    }

    setHata('');
    setBasari('');
  }

  async function kaydet() {
    setKaydediliyor(true);
    setHata('');

    const govde = { tip: form.tip, deger: Number(form.deger) };

    try {
      let cevap;

      if (formHedefi.toplu) {
        cevap = await apiPost('/admin/indirimler/toplu', { ...govde, urunIdleri: secili });
      } else {
        cevap = await apiPut('/admin/indirimler/' + formHedefi.urun.id, govde);
      }

      setBasari(cevap.mesaj);
      setFormHedefi(null);

      // ⚠️ Liste sunucudan tazeleniyor, satır elle güncellenmiyor.
      // Yeni fiyatı burada hesaplayıp yazsaydık yuvarlama kuralı
      // panelde ikinci kez yaşardı.
      await urunleriGetir();
    } catch (e) {
      setHata(e.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  async function indirimiKaldir(urun) {
    setKaldirilacak(null);
    setHata('');

    try {
      const cevap = await apiDelete('/admin/indirimler/' + urun.id);
      setBasari(cevap.mesaj);
      await urunleriGetir();
    } catch (e) {
      setHata(e.message);
    }
  }

  async function topluKaldir() {
    setHata('');

    try {
      const cevap = await apiPost('/admin/indirimler/toplu-kaldir', secili);
      setBasari(cevap.mesaj);
      await urunleriGetir();
    } catch (e) {
      setHata(e.message);
    }
  }

  // Sıralama tarayıcıda — veri zaten elimizde. (Ürünler sayfasıyla aynı.)
  const siraliUrunler = [...urunler].sort((a, b) => {
    if (siralama === 'ad') return a.name.localeCompare(b.name, 'tr');
    if (siralama === 'fiyatArtan') return a.price - b.price;
    if (siralama === 'fiyatAzalan') return b.price - a.price;
    if (siralama === 'indirimAzalan') return indirimYuzdesi(b) - indirimYuzdesi(a);
    return 0;
  });

  // ---- ÖNİZLEME ----
  //
  // Tek ürün seçiliyken yeni fiyatın ne olacağını kaydetmeden gösterir.
  // Toplu işlemde gösterilmiyor: her ürünün tabanı farklı, tek bir
  // sayı yazmak yanlış olurdu.
  const onizleme = (() => {
    if (!formHedefi?.urun) return null;

    const deger = Number(form.deger);
    if (!deger || deger <= 0) return null;

    const taban = tabanFiyat(formHedefi.urun);
    const yeni = form.tip === 'yuzde' ? taban * (1 - deger / 100) : taban - deger;

    if (yeni <= 0 || yeni >= taban) return null;

    // Sunucudaki gibi aşağı yuvarlanıyor.
    const yuvarli = Math.floor(yeni * 100) / 100;

    return {
      taban,
      yeni: yuvarli,
      yuzde: Math.floor(((taban - yuvarli) / taban) * 100),
      maliyetinAltinda:
        formHedefi.urun.cost != null && yuvarli < formHedefi.urun.cost,
    };
  })();

  const sutunlar = [
    {
      baslik: '',
      hucre: (u) => (
        <input
          type="checkbox"
          className="indirim-secim"
          checked={secili.includes(u.id)}
          onChange={() => secimDegistir(u.id)}
          aria-label={u.name + ' seç'}
        />
      ),
    },
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
      baslik: 'Ürün',
      hucre: (u) => (
        <div>
          <b>{u.name}</b>
          <div className="indirim-kategori">{u.categoryName || '—'}</div>
        </div>
      ),
    },
    {
      baslik: 'Fiyat',
      hizala: 'sag',
      hucre: (u) =>
        indirimdeMi(u) ? (
          <div className="indirim-fiyat">
            <span className="indirim-eski">{paraBicimle(u.eskiFiyat)}</span>
            <b>{paraBicimle(u.price)}</b>
          </div>
        ) : (
          <b>{paraBicimle(u.price)}</b>
        ),
    },
    {
      baslik: 'İndirim',
      hizala: 'orta',
      hucre: (u) =>
        indirimdeMi(u) ? (
          /* ⚠️ Ortak `Rozet` KULLANILMADI: o bileşen durum kodunu
             metne çeviriyor (aktif/pasif/kargoda). Yüzde bir durum
             değil, ölçülen bir değer. Bilinmeyen bir kod verip gri
             kutu elde etmek, bileşenin sözleşmesini istismar
             etmek olurdu. */
          <span className="indirim-hap">-%{indirimYuzdesi(u)}</span>
        ) : (
          <span className="indirim-yok">—</span>
        ),
    },
    {
      baslik: 'Kâr',
      hizala: 'sag',
      hucre: (u) => {
        const kar = urunKari(u.price, u.cost, u.vatRate);

        if (kar == null) {
          // ⚠️ Maliyet yoksa "0 ₺" YAZILMIYOR. Sıfır kâr ile
          // bilinmeyen kâr farklı şeyler; sıfır yazmak zarar
          // etmediğimizi iddia etmek olurdu.
          return <span className="indirim-yok">—</span>;
        }

        return (
          <b className={kar < 0 ? 'indirim-zarar' : ''}>
            {paraBicimle(kar)}
          </b>
        );
      },
    },
    {
      baslik: '',
      hizala: 'sag',
      hucre: (u) => (
        <div className="indirim-eylem">
          <Buton
            tip="ikincil"
            boyut="kucuk"
            ikonRengi="ana"
            onClick={() => formuAc({ urun: u })}
          >
            <Percent size={14} /> {indirimdeMi(u) ? 'Değiştir' : 'İndirim Ver'}
          </Buton>

          {indirimdeMi(u) && (
            <Buton
              tip="ikincil"
              boyut="kucuk"
              ikonRengi="uyari"
              onClick={() => setKaldirilacak(u)}
            >
              Kaldır
            </Buton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="sayfa-ust sayfa-ust-yatay">
        <div>
          <h1 className="sayfa-baslik">İndirimler</h1>
          <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
            Ürüne yüzde ya da tutar indirimi ver. İndirim, müşteri tarafında ürün
            kartının sol üst köşesinde rozet olarak görünür.
          </p>
        </div>
      </div>

      <div className="filtre-cubugu">
        <AramaKutusu deger={arama} degistir={setArama} ipucu="Ürün adında ara..." />

        <select
          className="filtre-secim"
          value={kategoriId}
          onChange={(e) => setKategoriId(e.target.value)}
        >
          <option value="">Tüm kategoriler</option>
          {kategoriler.map((k) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>

        <select
          className="filtre-secim"
          value={siralama}
          onChange={(e) => setSiralama(e.target.value)}
        >
          <option value="ad">İsme göre (A-Z)</option>
          <option value="indirimAzalan">İndirim (çoktan aza)</option>
          <option value="fiyatAzalan">Fiyat (azalan)</option>
          <option value="fiyatArtan">Fiyat (artan)</option>
        </select>

        <label className="filtre-onay">
          <input
            type="checkbox"
            checked={sadeceIndirimli}
            onChange={(e) => setSadeceIndirimli(e.target.checked)}
          />
          Sadece indirimdekiler
        </label>
      </div>

      {hata !== '' && <HataKutusu mesaj={hata} tekrarDene={urunleriGetir} />}
      {basari !== '' && <div className="indirim-basari">{basari}</div>}

      {/* ---------- SEÇİM ŞERİDİ ----------
          Yalnızca seçim varken çiziliyor; boşken duran bir çubuk
          ekranda ölü alan olurdu. */}
      {secili.length > 0 && (
        <div className="indirim-secim-serit">
          <span><b>{secili.length}</b> ürün seçili</span>

          <div className="indirim-secim-eylem">
            <Buton boyut="kucuk" onClick={() => formuAc({ toplu: true })}>
              <TicketPercent size={14} /> Seçilenlere İndirim Uygula
            </Buton>

            <Buton tip="ikincil" boyut="kucuk" ikonRengi="uyari" onClick={topluKaldir}>
              İndirimleri Kaldır
            </Buton>

            <Buton tip="ikincil" boyut="kucuk" onClick={() => setSecili([])}>
              Seçimi Temizle
            </Buton>
          </div>
        </div>
      )}

      {/* ---------- İNDİRİM FORMU ---------- */}
      {formHedefi !== null && (
        <div className="kart indirim-form">
          <div className="indirim-form-ust">
            <b>
              {formHedefi.toplu
                ? `${secili.length} ürüne indirim uygula`
                : formHedefi.urun.name}
            </b>

            <button
              type="button"
              className="indirim-kapat"
              onClick={() => setFormHedefi(null)}
              aria-label="Kapat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="indirim-form-alanlar">
            {/* ⚠️ İki ayrı buton, açılır liste DEĞİL: sadece iki
                seçenek var ve ikisi de tek bakışta görünmeli.
                Select, seçili olmayanı gizleyip fazladan bir tıklama
                isterdi. */}
            <div className="indirim-tip">
              <button
                type="button"
                className={'indirim-tip-buton' + (form.tip === 'yuzde' ? ' indirim-tip-secili' : '')}
                onClick={() => setForm((o) => ({ ...o, tip: 'yuzde' }))}
              >
                Yüzde (%)
              </button>

              <button
                type="button"
                className={'indirim-tip-buton' + (form.tip === 'tutar' ? ' indirim-tip-secili' : '')}
                onClick={() => setForm((o) => ({ ...o, tip: 'tutar' }))}
              >
                Tutar (₺)
              </button>
            </div>

            <label className="indirim-alan">
              <span>{form.tip === 'yuzde' ? 'İndirim oranı' : 'İndirim tutarı'}</span>
              <input
                type="number"
                min="0"
                max={form.tip === 'yuzde' ? 90 : undefined}
                step={form.tip === 'yuzde' ? 1 : 0.01}
                value={form.deger}
                onChange={(e) => setForm((o) => ({ ...o, deger: e.target.value }))}
                placeholder={form.tip === 'yuzde' ? '20' : '150,00'}
                autoFocus
              />
            </label>
          </div>

          {/* ---------- ÖNİZLEME ----------
              ⚠️ Bu bir TAHMİN. Kaydedilen değeri sunucu hesaplıyor ve
              kayıttan sonra liste onunla tazeleniyor. Kombinler
              sayfasındaki "ne satıyorum" önizlemesiyle aynı desen. */}
          {onizleme && (
            <div className="indirim-onizleme">
              <span className="indirim-onizleme-eski">{paraBicimle(onizleme.taban)}</span>
              <span className="indirim-onizleme-ok">→</span>
              <b className="indirim-onizleme-yeni">{paraBicimle(onizleme.yeni)}</b>
              <span className="indirim-hap">-%{onizleme.yuzde}</span>
            </div>
          )}

          {onizleme?.maliyetinAltinda && (
            /* ⚠️ ENGEL DEĞİL, UYARI. Zararına satış bilinçli bir
               kampanya olabilir (stok eritme). Engellemek, panelin
               bilmediği bir iş kararını dayatmak olurdu. */
            <div className="indirim-uyari">
              <AlertTriangle size={15} />
              Bu fiyat ürünün maliyetinin altında. Zararına satış yapmak
              istediğinden emin ol.
            </div>
          )}

          {formHedefi.toplu && (
            <p className="indirim-toplu-not">
              Aynı oran seçili ürünlerin her birine <b>kendi indirimsiz fiyatı
              üzerinden</b> uygulanır. Fiyatı uygun olmayan ürünler atlanır ve
              hangileri olduğu sonuçta yazar.
            </p>
          )}

          <div className="indirim-form-alt">
            <Buton tip="ikincil" onClick={() => setFormHedefi(null)}>Vazgeç</Buton>
            <Buton
              onClick={kaydet}
              disabled={kaydediliyor || !form.deger || Number(form.deger) <= 0}
            >
              {kaydediliyor ? 'Uygulanıyor...' : 'İndirimi Uygula'}
            </Buton>
          </div>
        </div>
      )}

      {yukleniyor ? (
        <Yukleniyor yazi="Ürünler getiriliyor..." />
      ) : (
        <>
          <Tablo
            sutunlar={sutunlar}
            veriler={siraliUrunler}
            anahtar={(u) => u.id}
            satirSinifi={(u) => (indirimdeMi(u) ? 'indirim-satir' : '')}
            bosMesaj={
              sadeceIndirimli
                ? 'Şu an indirimde ürün yok.'
                : 'Bu filtreye uyan ürün yok.'
            }
          />

          <p className="sonuc-sayisi">
            Toplam {sayiBicimle(siraliUrunler.length)} ürün
            {sadeceIndirimli ? ' (hepsi indirimde)' : ''} listeleniyor.
          </p>
        </>
      )}

      <OnayPenceresi
        acik={kaldirilacak !== null}
        baslik="İndirimi kaldır"
        mesaj={
          kaldirilacak
            ? `"${kaldirilacak.name}" ürününün fiyatı ${paraBicimle(kaldirilacak.eskiFiyat)} değerine geri döner ve indirim rozeti kaybolur.`
            : ''
        }
        onayYazi="Evet, Kaldır"
        islemdeYazi="Kaldırılıyor..."
        onayTipi="ana"
        iptal={() => setKaldirilacak(null)}
        onayla={() => indirimiKaldir(kaldirilacak)}
      />
    </div>
  );
}
