import { useEffect, useRef, useState } from 'react';

import { apiGet, apiPost, apiPut, apiDelete, apiYukle } from '../services/api';
import { resimUrl } from '../utils/resim';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import OnayPenceresi from '../components/OnayPenceresi';

import './BannerlarSayfasi.css';

import {
  Images, Plus, Pencil, Trash2, X, ArrowUp, ArrowDown,
  Eye, EyeOff, AlertTriangle, ImageUp,
} from 'lucide-react';

// ⚠️⚠️ AFİŞ KUTUSU 2:1 — MOBİLDEKİ `aspectRatio: 2` İLE AYNI SAYI.
//
// Şerit görseli `resizeMode="cover"` ile çiziyor: oran tutmuyorsa
// resim kırpılıyor, küçülmüyor. 2.36:1 bir görselde soldan ve sağdan
// toplam %15 kayboluyor ve afişin kenarındaki yazı ekrana hiç
// gelmiyor. Bu yüzden oran burada YAZIYOR ve yüklenen dosya
// ölçülüp uyarı veriliyor.
//
// ⚠️ Bu sayı mobildeki stille elle eşleşiyor, türetilmiyor — iki
// ayrı depo. Biri değişirse diğeri de değişmeli.
const ORAN = 2;

// Oran ne kadar sapabilir? %2 tolerans, yuvarlama payı için:
// 1200x600 tam 2.000, 1200x601 ise 1.997 — ikincisi de sorunsuz.
const ORAN_TOLERANSI = 0.02;

const ONERILEN_GENISLIK = 1200;

const BOS_FORM = {
  baslik: '',
  kisaAciklama: '',
  bitisMetni: '',
  aciklama: '',
  gorselUrl: '',
  kuponKodlari: '',
  kosullar: '',
  aktifMi: true,
};

export default function BannerlarSayfasi() {
  const [liste, setListe] = useState([]);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');
  const [tazele, setTazele] = useState(0);

  // null = form kapalı, 0 = yeni, >0 = düzenlenen kampanya
  const [formId, setFormId] = useState(null);
  const [form, setForm] = useState(BOS_FORM);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // ⚠️ SEÇİLEN DOSYA SUNUCUYA HEMEN GİTMİYOR.
  //
  // Yükleme "Kaydet"e ertelendi: form doldurulup vazgeçilirse diskte
  // sahipsiz bir dosya kalmasın. Önizleme için sunucuya ihtiyaç yok,
  // tarayıcı dosyayı zaten elinde tutuyor (object URL).
  const [dosya, setDosya] = useState(null);
  const [onizleme, setOnizleme] = useState('');
  const [olcu, setOlcu] = useState(null);   // { genislik, yukseklik }

  const gizliInput = useRef(null);
  const [surukleniyor, setSurukleniyor] = useState(false);

  const [silinecek, setSilinecek] = useState(null);

  useEffect(() => {
    let iptal = false;

    (async () => {
      setYukleniyor(true);
      setHata('');

      try {
        const veri = await apiGet('/admin/kampanyalar');
        if (!iptal) setListe(veri);
      } catch (e) {
        if (!iptal) setHata(e.message);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();

    return () => { iptal = true; };
  }, [tazele]);

  // ⚠️ Object URL elle serbest bırakılmazsa dosya bellekte kalıyor.
  // Sekme kapanana kadar da kalırdı — birkaç afiş denedikten sonra
  // onlarca MB.
  useEffect(() => {
    return () => {
      if (onizleme.startsWith('blob:')) {
        URL.revokeObjectURL(onizleme);
      }
    };
  }, [onizleme]);

  function formuAc(kampanya) {
    if (kampanya) {
      setFormId(kampanya.id);
      setForm({
        baslik: kampanya.baslik,
        kisaAciklama: kampanya.kisaAciklama,
        bitisMetni: kampanya.bitisMetni,
        aciklama: kampanya.aciklama,
        gorselUrl: kampanya.gorselUrl,
        kuponKodlari: kampanya.kuponKodlari.join('\n'),
        kosullar: kampanya.kosullar.join('\n'),
        aktifMi: kampanya.aktifMi,
      });
      setOnizleme(resimUrl(kampanya.gorselUrl));
    } else {
      setFormId(0);
      setForm(BOS_FORM);
      setOnizleme('');
    }

    setDosya(null);
    setOlcu(null);
    setHata('');
    setBasari('');
  }

  function formuKapat() {
    setFormId(null);
    setDosya(null);
    setOnizleme('');
    setOlcu(null);
  }

  // ---------- GÖRSEL SEÇİMİ ----------
  //
  // ⚠️ Ölçü tarayıcıda okunuyor, sunucuda değil. Sunucu dosyanın
  // gerçekten resim olduğunu doğruluyor (byte kontrolü) ama oranı
  // REDDETMİYOR: 2:1 olmayan bir afiş "yanlış" değil, sadece
  // kenarlarından kırpılacak. Kararı yöneticiye bırakıp uyarıyoruz —
  // bazen kırpılması sorun değildir.
  function dosyaSecildi(secilen) {
    if (!secilen) {
      return;
    }

    if (onizleme.startsWith('blob:')) {
      URL.revokeObjectURL(onizleme);
    }

    const url = URL.createObjectURL(secilen);

    setDosya(secilen);
    setOnizleme(url);
    setOlcu(null);

    const img = new Image();
    img.onload = () => setOlcu({ genislik: img.naturalWidth, yukseklik: img.naturalHeight });
    img.src = url;
  }

  async function kaydet() {
    setKaydediliyor(true);
    setHata('');

    try {
      // ⚠️ SIRA ÖNEMLİ: önce görsel, sonra kayıt. Ters olsaydı
      // görsel yüklemesi patladığında görselsiz bir kampanya kalırdı.
      let gorselUrl = form.gorselUrl;

      if (dosya) {
        const cevap = await apiYukle('/admin/kampanyalar/gorsel', dosya);
        gorselUrl = cevap.url;
      }

      const govde = {
        baslik: form.baslik,
        kisaAciklama: form.kisaAciklama,
        bitisMetni: form.bitisMetni,
        aciklama: form.aciklama,
        gorselUrl,

        // ⚠️ Satırlara burada bölünüyor: sunucu diziyle konuşuyor,
        // panel çok satırlı kutuyla. Ayracı sunucuya taşımak,
        // metin kutusunun biçimini API sözleşmesine sokardı.
        kuponKodlari: form.kuponKodlari.split('\n').map((s) => s.trim()).filter(Boolean),
        kosullar: form.kosullar.split('\n').map((s) => s.trim()).filter(Boolean),

        // ⚠️ Sıra formda YOK. Yeni afiş listenin sonuna gidiyor,
        // yer değiştirme listedeki oklarla yapılıyor — yöneticiye
        // "kaçıncı sırada olsun" diye sayı sordurmak, iki afişe aynı
        // sayıyı yazma ihtimalini de getirirdi.
        sira: formId === 0 ? liste.length : (liste.find((k) => k.id === formId)?.sira ?? 0),

        aktifMi: form.aktifMi,
      };

      const cevap = formId === 0
        ? await apiPost('/admin/kampanyalar', govde)
        : await apiPut('/admin/kampanyalar/' + formId, govde);

      setBasari(cevap.mesaj);
      formuKapat();
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  async function durumDegistir(kampanya) {
    setHata('');

    try {
      const cevap = await apiPut('/admin/kampanyalar/' + kampanya.id + '/durum', {
        isActive: !kampanya.aktifMi,
      });

      setBasari(cevap.mesaj);
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
    }
  }

  // ⚠️ İYİMSER GÜNCELLEME: sıra ekranda hemen değişiyor, istek
  // arkadan gidiyor. Beklemek her okta ekranın donmasına yol açardı
  // ve hata olursa zaten listeyi sunucudan yeniden çekiyoruz.
  async function tasi(index, yon) {
    const hedef = index + yon;

    if (hedef < 0 || hedef >= liste.length) {
      return;
    }

    const yeni = [...liste];
    [yeni[index], yeni[hedef]] = [yeni[hedef], yeni[index]];

    setListe(yeni);
    setHata('');

    try {
      await apiPut('/admin/kampanyalar/sirala', yeni.map((k) => k.id));
    } catch (e) {
      setHata(e.message);
      setTazele((n) => n + 1);   // gerçeği yeniden sor
    }
  }

  async function sil(kampanya) {
    setSilinecek(null);
    setHata('');

    try {
      const cevap = await apiDelete('/admin/kampanyalar/' + kampanya.id);
      setBasari(cevap.mesaj);
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
    }
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Bannerlar getiriliyor..." />;
  }

  const oran = olcu ? olcu.genislik / olcu.yukseklik : null;
  const oranSorunlu = oran !== null && Math.abs(oran - ORAN) > ORAN_TOLERANSI;

  const kaydedilebilir =
    form.baslik.trim().length >= 2 &&
    form.kisaAciklama.trim().length >= 2 &&
    form.bitisMetni.trim().length >= 2 &&
    form.aciklama.trim().length >= 10 &&
    (dosya !== null || form.gorselUrl !== '');

  return (
    <div>
      <div className="sayfa-ust">
        <div>
          <h1 className="sayfa-baslik">Bannerlar</h1>
          <p className="sayfa-altyazi">
            Mobil uygulamanın ana sayfasındaki afiş şeridi. Sıra buradaki sıradır;
            yayından kaldırılan afiş şeritte hiç görünmez.
          </p>
        </div>

        {formId === null && (
          <Buton onClick={() => formuAc(null)}>
            <Plus size={15} /> Yeni Banner
          </Buton>
        )}
      </div>

      {hata && <HataKutusu mesaj={hata} />}
      {basari && <div className="banner-basari">{basari}</div>}

      {/* ---------- ÖLÇÜ BİLGİSİ ----------
          Yöneticinin en sık takılacağı yer bu ve bilgi ancak
          görselin hazırlandığı anda işe yarıyor — bir dokümanda
          değil, tam burada duruyor. */}
      <div className="banner-olcu-kutu">
        <Images size={16} />
        <span>
          Afiş kutusu <b>2:1</b> oranında. Önerilen dosya:{' '}
          <b>{ONERILEN_GENISLIK}&times;{ONERILEN_GENISLIK / ORAN} piksel</b> (JPG/PNG/WEBP, en fazla 5 MB).
          Farklı oranda bir görsel kırpılarak yerleştirilir — yazıları ortada tut,
          alt-ortada nokta göstergesi var.
        </span>
      </div>

      {/* ---------- FORM ---------- */}
      {formId !== null && (
        <div className="kart banner-form">
          <div className="banner-form-ust">
            <b>{formId === 0 ? 'Yeni Banner' : 'Banner’ı Düzenle'}</b>
            <button type="button" className="banner-kapat" onClick={formuKapat}>
              <X size={16} />
            </button>
          </div>

          {/* GÖRSEL */}
          <div
            className={'banner-yukle' + (surukleniyor ? ' banner-yukle-aktif' : '')}
            onClick={() => gizliInput.current.click()}
            onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
            onDragLeave={(e) => { e.preventDefault(); setSurukleniyor(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setSurukleniyor(false);
              dosyaSecildi(e.dataTransfer.files?.[0]);
            }}
          >
            {onizleme ? (
              /* ⚠️ Önizleme KUTUSU 2:1 ve object-fit: cover —
                 mobildekiyle aynı kırpma. "Nasıl görünecek"i burada
                 göstermezsek yönetici ancak telefonu açınca fark
                 eder. */
              <img className="banner-onizleme" src={onizleme} alt="" />
            ) : (
              <div className="banner-yukle-bos">
                <ImageUp size={30} />
                <div>Afiş görselini buraya sürükle veya tıkla</div>
                <div className="banner-yukle-ipucu">
                  {ONERILEN_GENISLIK}&times;{ONERILEN_GENISLIK / ORAN} · JPG, PNG, WEBP · En fazla 5 MB
                </div>
              </div>
            )}
          </div>

          <input
            ref={gizliInput}
            className="banner-gizli-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const secilen = e.target.files?.[0];
              e.target.value = '';   // aynı dosya tekrar seçilebilsin
              dosyaSecildi(secilen);
            }}
          />

          {olcu && (
            <div className={'banner-olcu-sonuc' + (oranSorunlu ? ' banner-olcu-uyari' : '')}>
              {oranSorunlu && <AlertTriangle size={14} />}
              Seçilen görsel {olcu.genislik}&times;{olcu.yukseklik} ({oran.toFixed(2)}:1).
              {oranSorunlu
                ? ' 2:1 değil — kenarlardan kırpılacak.'
                : ' Oran uygun.'}
            </div>
          )}

          <div className="banner-alanlar">
            <label className="banner-alan">
              <span>Başlık</span>
              <input
                type="text"
                value={form.baslik}
                onChange={(e) => setForm((o) => ({ ...o, baslik: e.target.value }))}
                placeholder="Kara Cuma Şenliği"
                maxLength={100}
              />
            </label>

            <label className="banner-alan">
              <span>Kısa açıklama</span>
              <input
                type="text"
                value={form.kisaAciklama}
                onChange={(e) => setForm((o) => ({ ...o, kisaAciklama: e.target.value }))}
                placeholder="Yılın en büyük indirimleri"
                maxLength={200}
              />
            </label>

            <label className="banner-alan banner-alan-dar">
              <span>Süre metni</span>
              <input
                type="text"
                value={form.bitisMetni}
                onChange={(e) => setForm((o) => ({ ...o, bitisMetni: e.target.value }))}
                placeholder="30 Kasım'a kadar"
                maxLength={100}
              />
            </label>

            <label className="banner-onay">
              <input
                type="checkbox"
                checked={form.aktifMi}
                onChange={(e) => setForm((o) => ({ ...o, aktifMi: e.target.checked }))}
              />
              <span>Yayında</span>
            </label>
          </div>

          <label className="banner-alan banner-alan-genis">
            <span>Açıklama (detay ekranında görünür)</span>
            <textarea
              rows={4}
              value={form.aciklama}
              onChange={(e) => setForm((o) => ({ ...o, aciklama: e.target.value }))}
              placeholder="Kampanyanın ne olduğunu anlatan metin..."
              maxLength={2000}
            />
          </label>

          <div className="banner-ikili">
            <label className="banner-alan">
              <span>Kupon kodları — her satıra bir kod</span>
              <textarea
                rows={4}
                value={form.kuponKodlari}
                onChange={(e) => setForm((o) => ({ ...o, kuponKodlari: e.target.value }))}
                placeholder={'KAFAGEL300\nSUPER50'}
              />
              {/* ⚠️ Bu uyarı süs değil: müşteri kodu kopyalayıp
                  sepette kullanıyor ve yanında sunucudan çekilmiş
                  gerçek indirim tutarını görüyor. Olmayan kod
                  kaydedilemiyor — sunucu reddediyor. */}
              <small className="banner-ipucu">
                Kodlar Kuponlar sayfasında tanımlı olmalı; olmayan kod kaydedilmez.
              </small>
            </label>

            <label className="banner-alan">
              <span>Koşullar — her satıra bir madde</span>
              <textarea
                rows={4}
                value={form.kosullar}
                onChange={(e) => setForm((o) => ({ ...o, kosullar: e.target.value }))}
                placeholder={'Kuponlar aynı siparişte birlikte kullanılamaz.\nHer kupon hesap başına bir kez geçerlidir.'}
              />
            </label>
          </div>

          <div className="banner-form-alt">
            <Buton tip="ikincil" onClick={formuKapat}>Vazgeç</Buton>
            <Buton onClick={kaydet} disabled={kaydediliyor || !kaydedilebilir}>
              {kaydediliyor ? 'Kaydediliyor...' : 'Kaydet'}
            </Buton>
          </div>
        </div>
      )}

      {/* ---------- LİSTE ---------- */}
      {liste.length === 0 ? (
        <div className="banner-bos">
          <Images size={20} />
          <span>
            Henüz banner yok. Şerit boşken mobilde afiş bölümü hiç çizilmiyor —
            boş bir kutu görünmüyor.
          </span>
        </div>
      ) : (
        <div className="banner-liste">
          {liste.map((k, i) => (
            <div key={k.id} className={'kart banner-kart' + (k.aktifMi ? '' : ' banner-kart-pasif')}>
              <img className="banner-kucuk" src={resimUrl(k.gorselUrl)} alt="" />

              <div className="banner-bilgi">
                <div className="banner-bilgi-ust">
                  <b className="banner-ad">{k.baslik}</b>
                  {!k.aktifMi && <Rozet durum="pasif" />}
                </div>

                <div className="banner-kisa">{k.kisaAciklama}</div>

                <div className="banner-meta">
                  <span>{k.bitisMetni}</span>
                  {k.kuponKodlari.length > 0 && (
                    <span className="banner-kuponlar">{k.kuponKodlari.join(' · ')}</span>
                  )}
                </div>
              </div>

              <div className="banner-eylem">
                {/* ⚠️ Sıra okları en üstteki için "yukarı", en
                    alttaki için "aşağı" KİLİTLİ — gizli değil.
                    Gizleseydik butonlar satırdan satıra yer
                    değiştirir, tıklanacak yer kayardı. */}
                <div className="banner-oklar">
                  <Buton
                    tip="ikincil"
                    boyut="kucuk"
                    ikonRengi="ana"
                    onClick={() => tasi(i, -1)}
                    disabled={i === 0}
                    title="Yukarı taşı"
                  >
                    <ArrowUp size={14} />
                  </Buton>

                  <Buton
                    tip="ikincil"
                    boyut="kucuk"
                    ikonRengi="ana"
                    onClick={() => tasi(i, 1)}
                    disabled={i === liste.length - 1}
                    title="Aşağı taşı"
                  >
                    <ArrowDown size={14} />
                  </Buton>
                </div>

                <Buton
                  tip="ikincil"
                  boyut="kucuk"
                  ikonRengi={k.aktifMi ? 'uyari' : 'basari'}
                  onClick={() => durumDegistir(k)}
                >
                  {k.aktifMi ? <EyeOff size={14} /> : <Eye size={14} />}
                  {k.aktifMi ? 'Yayından Kaldır' : 'Yayına Al'}
                </Buton>

                <Buton tip="ikincil" boyut="kucuk" ikonRengi="ana" onClick={() => formuAc(k)}>
                  <Pencil size={14} /> Düzenle
                </Buton>

                <Buton tip="tehlike" boyut="kucuk" onClick={() => setSilinecek(k)}>
                  <Trash2 size={14} />
                </Buton>
              </div>
            </div>
          ))}
        </div>
      )}

      <OnayPenceresi
        acik={silinecek !== null}
        baslik="Banner silinsin mi?"
        mesaj={
          silinecek
            ? `"${silinecek.baslik}" ve görseli kalıcı olarak silinecek. Sadece bir süre gizlemek istiyorsan "Yayından Kaldır" yeterli.`
            : ''
        }
        onayYazi="Evet, Sil"
        islemdeYazi="Siliniyor..."
        iptal={() => setSilinecek(null)}
        onayla={() => sil(silinecek)}
      />
    </div>
  );
}
