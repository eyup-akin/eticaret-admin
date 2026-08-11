import { useEffect, useState } from 'react';

import { apiPost } from '../services/api';
import { refreshTokenAl } from '../services/tokenStorage';
import { tarihBicimle } from '../utils/bicimlendir';

import Buton from './Buton';
import HataKutusu from './HataKutusu';
import Yukleniyor from './Yukleniyor';
import OnayPenceresi from './OnayPenceresi';

import './OturumListesi.css';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { HelpCircle, Lightbulb, Monitor, Smartphone } from 'lucide-react';


// User-Agent metnini okunabilir hâle çevirir.
//
// Ham UA şuna benziyor:
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
//    (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
//
// Bunu kullanıcıya olduğu gibi göstermek anlamsız. "Chrome · Windows"
// demek yeterli ve anlaşılır.
//
// ⚠️ SIRA ÇOK ÖNEMLİ — tarihsel bir karmaşa yüzünden:
//
//   Edge'in UA'sı "Chrome" DA içeriyor (Chromium tabanlı olduğu için)
//   Chrome'un UA'sı "Safari" DE içeriyor (eski uyumluluk mirası)
//   Opera'nın UA'sı "Chrome" DA içeriyor
//
//   Yani genelden özele bakarsak hepsi "Chrome" çıkar. ÖZELDEN GENELE
//   bakmak zorundayız: Edge → Opera → Firefox → Chrome → Safari.
//
// Bu yüzden UA ayrıştırma güvenilir bir teknik değildir; sadece
// kullanıcıya ipucu vermek için kullanılır, karar vermek için asla.
function cihazOku(ua) {
  if (!ua || ua.trim() === '') {
    return { tarayici: 'Bilinmeyen cihaz', sistem: '', ikon: <HelpCircle size={18} /> };
  }

  let tarayici = 'Bilinmeyen tarayıcı';
  let ikon = <Monitor size={18} />;

  // Mobil uygulama isteklerini önce yakalıyoruz — React Native'in
  // ağ katmanı (Android'de okhttp) tarayıcı imzası taşımıyor.
  if (ua.includes('okhttp') || ua.includes('Expo') || ua.includes('ReactNative')) {
    tarayici = 'Mobil uygulama';
    ikon = <Smartphone size={18} />;
  } else if (ua.includes('Edg/')) {
    tarayici = 'Edge';
  } else if (ua.includes('OPR/') || ua.includes('Opera')) {
    tarayici = 'Opera';
  } else if (ua.includes('Firefox/')) {
    tarayici = 'Firefox';
  } else if (ua.includes('Chrome/')) {
    tarayici = 'Chrome';
  } else if (ua.includes('Safari/')) {
    tarayici = 'Safari';
  }

  let sistem = '';

  if (ua.includes('Android')) {
    sistem = 'Android';
    ikon = <Smartphone size={18} />;
  } else if (ua.includes('iPhone')) {
    sistem = 'iPhone';
    ikon = <Smartphone size={18} />;
  } else if (ua.includes('iPad')) {
    sistem = 'iPad';
    ikon = <Smartphone size={18} />;
  } else if (ua.includes('Windows')) {
    sistem = 'Windows';
  } else if (ua.includes('Mac OS X')) {
    sistem = 'macOS';
  } else if (ua.includes('Linux')) {
    sistem = 'Linux';
  }

  return { tarayici, sistem, ikon };
}


export default function OturumListesi() {
  const [oturumlar, setOturumlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  // Kapatılacak oturum (onay penceresi için). null = kapalı
  const [kapatilacak, setKapatilacak] = useState(null);
  const [islemde, setIslemde] = useState(false);

  // "Diğerlerini kapat" onayı
  const [digerleriOnayi, setDigerleriOnayi] = useState(false);

  async function oturumlariGetir() {
    setYukleniyor(true);
    setHata('');

    try {
      // Kasadaki refresh token'ı gönderiyoruz — sunucu bunun hash'ini
      // hesaplayıp hangi satırın "bu cihaz" olduğunu işaretliyor.
      //
      // ?? '' → kasada yoksa boş gönder. Sunucu bu durumda hiçbir satırı
      // işaretlemiyor ama liste yine geliyor.
      const refresh = refreshTokenAl() ?? '';

      const veri = await apiPost('/auth/oturumlarim', { refreshToken: refresh });

      setOturumlar(veri.oturumlar);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    oturumlariGetir();
  }, []);


  // Tek oturumu kapat
  async function oturumuKapat() {
    setIslemde(true);
    setHata('');

    try {
      await apiPost('/auth/oturum-iptal/' + kapatilacak.id, {});

      setKapatilacak(null);
      setBasari('Oturum kapatıldı.');

      // Listeyi yenile.
      //
      // Yerelde satırı silmek de olurdu ama yeniden çekmek daha güvenli:
      // aradan geçen sürede başka bir oturum açılmış veya süresi dolmuş
      // olabilir. Kaydın sunucudaki gerçek hâlini gösteriyoruz.
      await oturumlariGetir();
    } catch (e) {
      setHata(e.message);
      setKapatilacak(null);
    } finally {
      setIslemde(false);
    }
  }


  // Bu cihaz hariç hepsini kapat
  async function digerleriniKapat() {
    setIslemde(true);
    setHata('');

    try {
      const refresh = refreshTokenAl() ?? '';

      const veri = await apiPost('/auth/diger-oturumlari-kapat', {
        refreshToken: refresh,
      });

      setDigerleriOnayi(false);
      setBasari(veri.mesaj);
      await oturumlariGetir();
    } catch (e) {
      setHata(e.message);
      setDigerleriOnayi(false);
    } finally {
      setIslemde(false);
    }
  }


  // Bu cihaz dışında kaç oturum var? Türetilmiş değer.
  // "Diğerlerini kapat" butonunu göstermek için kullanıyoruz —
  // tek oturum varken o buton anlamsız olurdu.
  const digerSayisi = oturumlar.filter((o) => !o.buCihaz).length;


  return (
    <div className="otr-kart">
      <div className="otr-ust">
        <div>
          {/* Başlık ve açıklama artık SAYFA dosyasında (OturumlarimSayfasi).
              Burada tekrar etmek aynı bilgiyi iki kez göstermek olurdu.
              
              Kartın kendi başlığı olarak sadece sayıyı gösteriyoruz —
              "kaç oturum var" bilgisi listeye bakmadan görünsün. */}
          <div className="otr-baslik">
            {oturumlar.length > 0
              ? `${oturumlar.length} aktif oturum`
              : 'Oturumlar'}
          </div>
          <div className="otr-altyazi">
            Tanımadığın bir cihaz varsa oturumunu kapat ve şifreni değiştir.
          </div>
        </div>

        {/* Buton SADECE başka oturum varsa görünür — türetilmiş koşul.
            Tek oturumla "diğerlerini kapat" demek anlamsız olurdu. */}
        {digerSayisi > 0 && (
          <Buton
            tip="tehlike"
            boyut="kucuk"
            onClick={() => setDigerleriOnayi(true)}
          >
            Diğerlerini Kapat ({digerSayisi})
          </Buton>
        )}
      </div>

      {basari !== '' && <div className="otr-basari">{basari}</div>}

      {hata !== '' && (
        <div style={{ marginBottom: 16 }}>
          <HataKutusu mesaj={hata} tekrarDene={oturumlariGetir} />
        </div>
      )}

      {yukleniyor ? (
        <Yukleniyor yazi="Oturumlar getiriliyor..." />
      ) : oturumlar.length === 0 ? (
        <div className="otr-bos">Aktif oturum bulunamadı.</div>
      ) : (
        oturumlar.map((o) => {
          const cihaz = cihazOku(o.cihazBilgisi);

          return (
            <div className="otr-satir" key={o.id}>
              <div className="otr-ikon">{cihaz.ikon}</div>

              <div className="otr-orta">
                <div className="otr-cihaz">
                  <span>
                    {cihaz.tarayici}
                    {cihaz.sistem !== '' ? ' · ' + cihaz.sistem : ''}
                  </span>

                  {o.buCihaz && (
                    <span className="otr-bu-cihaz">Bu cihaz</span>
                  )}
                </div>

                <div className="otr-detay">
                  Giriş: {tarihBicimle(o.createdAt)}
                  {' · '}
                  Bitiş: {tarihBicimle(o.expiresAt)}
                </div>

                {/* Ham User-Agent — ayrıştırma yanlış çıkarsa kullanıcı
                    gerçeği görebilsin. UA ayrıştırma güvenilir değil,
                    o yüzden asıl veriyi de gösteriyoruz. */}
                <div className="otr-ham" title={o.cihazBilgisi}>
                  {o.cihazBilgisi || '—'}
                </div>
              </div>

              {/* ⭐ BU CİHAZ İÇİN KAPAT BUTONU YOK.
                  
                  Neden? Kendi oturumunu buradan kapatmak kafa karıştırıcı
                  olurdu: buton çalışır, sonra bir sonraki istek 401 yer,
                  sessiz yenileme başarısız olur ve kullanıcı aniden giriş
                  ekranına düşer. "Ne oldu?" der.
                  
                  Bunun adı zaten var ve yerinde duruyor: Çıkış Yap.
                  Aynı işi yapan iki farklı düğme koymuyoruz. */}
              {!o.buCihaz && (
                <Buton
                  tip="ikincil"
                  boyut="kucuk"
                  onClick={() => setKapatilacak(o)}
                >
                  Kapat
                </Buton>
              )}
            </div>
          );
        })
      )}

      <div className="otr-ipucu">
        <span><Lightbulb size={15} /></span>
        <span>
          Her cihaz veya tarayıcı ayrı bir oturum açar. Gizli sekmede
          giriş yaptıysan o da listede görünür. Bir oturumu kapattığında
          o cihaz bir sonraki istekte giriş ekranına düşer.
        </span>
      </div>

      {/* ---- ONAY PENCERELERİ ---- */}

      <OnayPenceresi
        acik={kapatilacak !== null}
        baslik="Oturumu kapat"
        mesaj={
          kapatilacak
            ? `"${cihazOku(kapatilacak.cihazBilgisi).tarayici}" oturumu ` +
              'kapatılacak. O cihaz bir sonraki istekte giriş ekranına düşer.'
            : ''
        }
        onayla={oturumuKapat}
        iptal={() => setKapatilacak(null)}
        islemde={islemde}
      />

      <OnayPenceresi
        acik={digerleriOnayi}
        baslik="Diğer oturumları kapat"
        mesaj={
          `Bu cihaz hariç ${digerSayisi} oturum kapatılacak. ` +
          'Diğer cihazlarda tekrar giriş yapman gerekecek.'
        }
        onayla={digerleriniKapat}
        iptal={() => setDigerleriOnayi(false)}
        islemde={islemde}
      />
    </div>
  );
}