import { useEffect, useState } from 'react';

import { apiGet, apiPut } from '../services/api';
import { tarihBicimle } from '../utils/bicimlendir';

import Buton from '../components/Buton';
import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import OnayPenceresi from '../components/OnayPenceresi';

import './SozlesmelerSayfasi.css';

import { AlertTriangle, FileText, Pencil, Scale, History } from 'lucide-react';

const BASLIKLAR = {
  gizlilik: 'Gizlilik Politikası',
  kullanim: 'Kullanım Koşulları',
  mesafeli_satis: 'Mesafeli Satış Sözleşmesi',
  on_bilgilendirme: 'Ön Bilgilendirme Formu',
};

// Sunucunun beklediği onay kelimesi.
//
// ⚠️ ASIL KONTROL SUNUCUDA. Burada olması yalnızca kullanıcıya ne
// yazacağını söylemek ve butonu kilitli tutmak için; bu satırı
// değiştirmek yetkiyi aşmaya yaramaz.
const ONAY_KELIMESI = 'ONAYLIYORUM';

// ============================================================
//  SÖZLEŞME METİNLERİ — SÜPERADMİN
//
//  ⭐ DEĞİŞTİ — sayfa artık salt okunur değil, metin düzenlenebiliyor.
//
//  ⚠️ DÜZENLEME "KAYDET" DEĞİL, "YENİ SÜRÜM YAYINLA".
//  Sunucu mevcut satırı değiştirmiyor; eskisini pasifleştirip yeni
//  sürüm açıyor. Sebebi ekranda da yazıyor: eski metne verilmiş
//  onaylar eski metne bağlı kalmalı, yoksa müşteri hiç görmediği bir
//  sözleşmeyi onaylamış görünür.
//
//  ⚠️ ÜÇ KATMANLI YETKİ. Menü bu sayfayı adminden gizliyor, rota
//  süperadmin dışındakini geri gönderiyor, uç [Authorize(Roles =
//  "superadmin")] + şifre + elle yazılan onay istiyor. Yalnızca
//  sonuncusu gerçek güvenlik.
// ============================================================
export default function SozlesmelerSayfasi() {
  const [liste, setListe] = useState([]);
  const [seciliTip, setSeciliTip] = useState(null);
  const [metin, setMetin] = useState(null);
  const [surumler, setSurumler] = useState([]);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  // Düzenleme durumu
  const [duzenleniyor, setDuzenleniyor] = useState(false);
  const [taslak, setTaslak] = useState('');

  // Onay akışı: null → 'uyari' → 'onay'
  //
  // ⚠️ İKİ AYRI PENCERE, BİLEREK. Birincisi NE OLACAĞINI anlatıyor,
  // ikincisi KİM OLDUĞUNU soruyor. Tek pencerede toplasaydık uzun
  // uyarı metni, şifre kutusunun hemen üstünde okunmadan geçilirdi.
  const [adim, setAdim] = useState(null);
  const [dogrulama, setDogrulama] = useState('');
  const [sifre, setSifre] = useState('');
  const [islemde, setIslemde] = useState(false);

  useEffect(() => {
    let iptal = false;

    (async () => {
      try {
        const veri = await apiGet('/sozlesmeler');
        if (iptal) return;

        setListe(veri);
        if (veri.length > 0) setSeciliTip(veri[0].tip);
      } catch (e) {
        if (!iptal) setHata(e.message);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();

    return () => { iptal = true; };
  }, []);

  // Seçili tipin metni + sürüm geçmişi.
  //
  // ⚠️ İkisi TEK effect'te ve ard arda: geçmiş listesi metnin
  // sürümünü referans alıyor ("yayında" rozeti). Ayrı effect'lerde
  // biri güncellenip diğeri bayat kalabilirdi.
  useEffect(() => {
    if (!seciliTip) return;

    let iptal = false;

    (async () => {
      try {
        const veri = await apiGet('/sozlesmeler/' + seciliTip);
        if (iptal) return;
        setMetin(veri);

        const gecmis = await apiGet('/admin/sozlesmeler/' + seciliTip + '/surumler');
        if (!iptal) setSurumler(gecmis);
      } catch (e) {
        if (!iptal) setHata(e.message);
      }
    })();

    return () => { iptal = true; };
  }, [seciliTip]);

  function duzenlemeyeBasla() {
    setTaslak(metin.icerik);
    setDuzenleniyor(true);
    setHata('');
    setBasari('');
  }

  function duzenlemedenCik() {
    setDuzenleniyor(false);
    setTaslak('');
    setAdim(null);
    setDogrulama('');
    setSifre('');
  }

  async function yayinla() {
    setIslemde(true);
    setHata('');

    try {
      const cevap = await apiPut('/admin/sozlesmeler/' + seciliTip, {
        icerik: taslak,
        sifre: sifre,
        dogrulama: dogrulama,

        // ⚠️ Düzenlemeye başlarken ekranda olan sürüm. Sunucu bunu
        // yayındakiyle karşılaştırıp başkası araya girmişse
        // reddediyor — iki süperadminin birbirinin metnini görmeden
        // üstüne yazmasını engelleyen tek kontrol.
        beklenenSurum: metin.surum,
      });

      duzenlemedenCik();
      setBasari(cevap.mesaj);

      // Metni ve geçmişi tazeliyoruz: sürüm numarası ve tarih değişti.
      const yeniMetin = await apiGet('/sozlesmeler/' + seciliTip);
      setMetin(yeniMetin);
      setSurumler(await apiGet('/admin/sozlesmeler/' + seciliTip + '/surumler'));
      setListe(await apiGet('/sozlesmeler'));
    } catch (e) {
      // ⚠️ Pencere KAPANMIYOR: hata çoğu zaman şifrenin yanlış
      // yazılması ve kullanıcı tek düzeltmeyle devam edebilmeli.
      // Metni de kaybetmiyor.
      setHata(e.message);
      setAdim(null);
    } finally {
      setIslemde(false);
    }
  }

  if (yukleniyor) {
    return <Yukleniyor yazi="Sözleşmeler getiriliyor..." />;
  }

  // Onay formu doldu mu? Butonun kilidi buna bakıyor.
  const onayHazir = dogrulama.trim() === ONAY_KELIMESI && sifre.length > 0;

  return (
    <div>
      <div className="sayfa-ust">
        <div>
          <h1 className="sayfa-baslik">Sözleşmeler</h1>
          <p className="sayfa-altyazi">
            Kayıt ve sipariş sırasında müşteriye gösterilen metinler.
          </p>
        </div>
      </div>

      {hata && <HataKutusu mesaj={hata} />}
      {basari !== '' && <div className="basari-kutusu">{basari}</div>}

      {/* ⚠️ İKİ AYRI UYARI, İKİ AYRI KONU.

          Birincisi HUKUKİ ve düzenleme mümkün olduğu için eklendi:
          buradaki metin mağazanın müşteriye verdiği taahhüt, yanlış
          bir cümle doğrudan sorumluluk doğurur.

          İkincisi metinlerin BUGÜNKÜ durumu hakkında (taslak, mağaza
          bilgileri eksik). Tek kutuda birleştirseydik ikisi de
          "genel uyarı" diye okunup atlanırdı. */}
      <div className="sozlesme-hukuk-uyari">
        <Scale size={18} />
        <div>
          <b>Bu metinleri hukukçu görüşü almadan değiştirmeyin.</b>
          <p>
            Sözleşme metni mağazanın müşteriye verdiği yasal taahhüttür; tek
            bir cümlenin değişmesi bile sorumluluk doğurabilir. Değişikliği
            bir avukat ya da bilirkişi ile birlikte hazırlayın. Kaydettiğiniz
            metin, yayınlandığı andan itibaren tüm müşterilere gösterilir.
          </p>
        </div>
      </div>

      <div className="sozlesme-uyari">
        <AlertTriangle size={16} />
        <span>
          Bu metinler taslaktır. Yayına çıkmadan önce bir hukukçu tarafından
          incelenmeli; mağaza unvanı, adres ve iletişim bilgileri eklenmeli.
        </span>
      </div>

      <div className="sozlesme-duzen">
        <div className="sozlesme-liste">
          {liste.map((s) => (
            <button
              key={s.tip}
              type="button"
              className={'sozlesme-satir' + (seciliTip === s.tip ? ' sozlesme-satir-aktif' : '')}
              onClick={() => setSeciliTip(s.tip)}
              /* ⚠️ Düzenleme sırasında kilitli: tipe basmak taslağı
                 haber vermeden çöpe atardı. Uyarı penceresi açmak
                 yerine kapıyı kapatmak, kullanıcının kaybedecek bir
                 şeyi olmadığı anlamına geliyor. */
              disabled={duzenleniyor}
              title={duzenleniyor ? 'Önce düzenlemeyi bitir' : undefined}
            >
              <FileText size={15} />
              <span className="sozlesme-ad">{BASLIKLAR[s.tip] ?? s.tip}</span>
              <span className="sozlesme-surum">v{s.surum}</span>
            </button>
          ))}

          {/* SÜRÜM GEÇMİŞİ
              ⚠️ Sürümlemenin görünür tek kanıtı bu liste: eski metin
              silinmiyor ve ona verilmiş onaylar duruyor. Olmasaydı
              "yeni sürüm açılıyor" cümlesi ekranda doğrulanamayan bir
              iddia olurdu. */}
          {surumler.length > 0 && (
            <div className="sozlesme-gecmis">
              <div className="sozlesme-gecmis-baslik">
                <History size={14} />
                <span>Sürüm geçmişi</span>
              </div>

              {surumler.map((s) => (
                <div key={s.id} className="sozlesme-gecmis-satir">
                  <span className="sozlesme-gecmis-surum">
                    v{s.surum}
                    {s.aktifMi && <span className="sozlesme-gecmis-aktif">yayında</span>}
                  </span>
                  <span className="sozlesme-gecmis-tarih">
                    {tarihBicimle(s.yayinTarihi)}
                  </span>
                  <span className="sozlesme-gecmis-onay">{s.onaySayisi} onay</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="kart sozlesme-metin-kart">
          {metin ? (
            <>
              <div className="sozlesme-metin-ust">
                <b>{BASLIKLAR[metin.tip] ?? metin.tip}</b>

                <span className="sozlesme-metin-ust-sag">
                  <span>Sürüm {metin.surum} · {tarihBicimle(metin.yayinTarihi)}</span>

                  {!duzenleniyor && (
                    <Buton
                      tip="ikincil"
                      boyut="kucuk"
                      ikonRengi="ana"
                      onClick={duzenlemeyeBasla}
                    >
                      <Pencil size={14} />
                      Düzenle
                    </Buton>
                  )}
                </span>
              </div>

              {duzenleniyor ? (
                <>
                  <textarea
                    className="sozlesme-metin-alan"
                    value={taslak}
                    onChange={(e) => setTaslak(e.target.value)}
                    spellCheck={false}
                  />

                  <div className="sozlesme-duzenle-alt">
                    {/* Sunucudaki alt sınırla aynı sayı; kullanıcı
                        "Yayınla"ya basıp reddedilmeden önce görsün. */}
                    <span className="sozlesme-sayac">
                      {taslak.trim().length} karakter
                      {taslak.trim().length < 50 && ' — en az 50 olmalı'}
                    </span>

                    <span className="sozlesme-duzenle-butonlar">
                      <Buton tip="ikincil" onClick={duzenlemedenCik}>
                        Vazgeç
                      </Buton>

                      <Buton
                        tip="tehlike"
                        onClick={() => setAdim('uyari')}
                        disabled={
                          taslak.trim().length < 50 ||
                          taslak.trim() === metin.icerik.trim()
                        }
                      >
                        Yeni Sürüm Yayınla
                      </Buton>
                    </span>
                  </div>
                </>
              ) : (
                /* pre-wrap: metindeki satır sonları korunuyor. */
                <div className="sozlesme-metin">{metin.icerik}</div>
              )}
            </>
          ) : (
            <div className="sozlesme-bos">Soldan bir sözleşme seç.</div>
          )}
        </div>
      </div>

      {/* ---- ADIM 1: NE OLACAĞINI ANLAT ---- */}
      <OnayPenceresi
        acik={adim === 'uyari'}
        baslik="Yasal metni değiştirmek üzeresin"
        mesaj={
          `"${BASLIKLAR[seciliTip] ?? seciliTip}" metninin yeni bir sürümü ` +
          'yayınlanacak ve bu andan itibaren tüm müşterilere o gösterilecek. ' +
          'Yanında bir hukukçu ya da bilirkişi yoksa devam etme.'
        }
        onayYazi="Anladım, devam et"
        onayTipi="tehlike"
        onayla={() => setAdim('onay')}
        iptal={() => setAdim(null)}
      >
        <ul className="sozlesme-onay-liste">
          <li>Eski sürüm silinmez, arşivde kalır.</li>
          <li>
            Eski metne verilmiş onaylar eski metne bağlı kalır — yeni sürümü
            onaylamış sayılmazlar.
          </li>
          <li>Bu işlem denetim kaydına adınla yazılır.</li>
        </ul>
      </OnayPenceresi>

      {/* ---- ADIM 2: KİM OLDUĞUNU DOĞRULA ---- */}
      <OnayPenceresi
        acik={adim === 'onay'}
        baslik="Son onay"
        mesaj="Devam etmek için onay kelimesini yaz ve şifreni gir."
        onayYazi="Yayınla"
        islemdeYazi="Yayınlanıyor..."
        onayTipi="tehlike"
        islemde={islemde}
        onayKilitli={!onayHazir}
        onayla={yayinla}
        iptal={() => setAdim(null)}
      >
        <div className="sozlesme-onay-alan">
          <label className="sozlesme-onay-etiket" htmlFor="sozlesme-dogrulama">
            Onay için <b>{ONAY_KELIMESI}</b> yaz
          </label>
          <input
            id="sozlesme-dogrulama"
            className="sozlesme-onay-input"
            value={dogrulama}
            onChange={(e) => setDogrulama(e.target.value)}
            autoComplete="off"
            disabled={islemde}
          />
        </div>

        <div className="sozlesme-onay-alan">
          <label className="sozlesme-onay-etiket" htmlFor="sozlesme-sifre">
            Panel şifren
          </label>
          <input
            id="sozlesme-sifre"
            className="sozlesme-onay-input"
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            autoComplete="current-password"
            disabled={islemde}
          />
        </div>
      </OnayPenceresi>
    </div>
  );
}
