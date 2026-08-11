import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet } from '../services/api';
import './BildirimZili.css';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { AlertTriangle, Bell, Clock, Package, ShieldCheck, Ticket, Undo2 } from 'lucide-react';

// Sayaç kaç saniyede bir tazelensin?
//
// Neden route değişiminde değil de zamanlayıcıyla?
// Zil, kullanıcı hiçbir şey yapmadan da güncellenmeli — "yeni
// sipariş geldi" bilgisini görmek için sayfa değiştirmek zorunda
// kalmamalı. Zamanlayıcı bunu sağlıyor.
//
// 60 saniye: bir yönetim panelinde yeterince taze. Daha sık
// sorsaydık sunucuya boşuna yük binerdi; daha seyrek olsaydı
// "bildirim" olmaktan çıkardı.
const TAZELEME_MS = 60000;

// Her uyarı türünün ikonu — dashboard'daki sözlükle AYNI.
//
// ⚠️ Bu bir tekrar ve farkındayım. İki tüketici olduğu için
// utils'e taşınmayı hak ediyor; ama dashboard'daki sözlük orada
// başka bir bileşenin içinde ve taşımak o dosyayı da değiştirmeyi
// gerektiriyor. Aşama 11'deki refactor listesine yazıyoruz.
const UYARI_IKON = {
  bekleyen_siparis: <Clock size={16} />,
  kritik_stok: <Package size={16} />,
  bekleyen_basvuru: <ShieldCheck size={16} />,
  bekleyen_destek: <Ticket size={16} />,
  bekleyen_iade: <Undo2 size={16} />,
};

export default function BildirimZili() {
  const navigate = useNavigate();

  const [acik, setAcik] = useState(false);
  const [uyarilar, setUyarilar] = useState([]);

  const sarmalRef = useRef(null);

  // ---------- VERİYİ ÇEK + PERİYODİK TAZELE ----------
  useEffect(() => {
    let iptal = false;

    async function getir() {
      try {
        const veri = await apiGet('/admin/dikkat-gerektirenler');

        if (!iptal) {
          setUyarilar(veri.uyarilar ?? []);
        }
      } catch {
        // ⚠️ SESSİZCE YUTUYORUZ — bilinçli.
        //
        // Bu bir SAYAÇ. Alınamazsa panel yine çalışmalı.
        // Üst barda kırmızı bir hata kutusu çıkarmak, asıl işini
        // yapmaya çalışan yöneticiyi gereksiz yere rahatsız ederdi.
        //
        // Dashboard'daki aynı uç hata yönetimini zaten yapıyor.
        if (!iptal) {
          setUyarilar([]);
        }
      }
    }

    // İlk yüklemede hemen çek — 60 saniye bekletmiyoruz.
    getir();

    const zamanlayici = setInterval(getir, TAZELEME_MS);

    // ⚠️ TEMİZLİK — ATLANAMAZ.
    //
    // clearInterval yazmasaydık: kullanıcı çıkış yapıp bileşen
    // ekrandan kalktıktan sonra bile zamanlayıcı çalışmaya devam
    // ederdi. Her 60 saniyede bir, artık var olmayan bir bileşenin
    // durumunu güncellemeye çalışan bir istek. Klasik bellek sızıntısı.
    return () => {
      iptal = true;
      clearInterval(zamanlayici);
    };
  }, []);

  // ---------- DIŞARI TIKLAYINCA KAPAT ----------
  //
  // KullaniciMenusu'ndaki desenin aynısı: açılır katmanların
  // olmazsa olmazı.
  useEffect(() => {
    if (!acik) {
      return;
    }

    function disariTiklandi(olay) {
      if (sarmalRef.current && !sarmalRef.current.contains(olay.target)) {
        setAcik(false);
      }
    }

    function esceBasildi(olay) {
      if (olay.key === 'Escape') {
        setAcik(false);
      }
    }

    document.addEventListener('mousedown', disariTiklandi);
    document.addEventListener('keydown', esceBasildi);

    return () => {
      document.removeEventListener('mousedown', disariTiklandi);
      document.removeEventListener('keydown', esceBasildi);
    };
  }, [acik]);

  // ---------- TOPLAM SAYI ----------
  //
  // TÜRETİLMİŞ DEĞER — ayrı state'te tutmuyoruz.
  // uyarilar değiştiğinde bu kendiliğinden doğru olur; ayrı state
  // olsaydı ikisini senkron tutmak gerekirdi ve er ya da geç
  // ayrışırlardı.
  //
  // reduce: her uyarı grubunun 'adet' değerini topluyor.
  // 'ogeler.length' DEĞİL 'adet' kullanıyoruz — backend en fazla
  // 8 öğe gönderiyor ama gerçek sayı daha büyük olabilir.
  const toplam = uyarilar.reduce((t, u) => t + u.adet, 0);

  // Rozet metni: 9'dan büyükse "9+".
  //
  // Neden? İki haneli sayılar rozeti genişletir ve üst barın
  // hizasını bozar. Mobildeki RozetliIkon bileşeninde de aynı
  // kural — iki platformda aynı davranış.
  const rozetYazi = toplam > 9 ? '9+' : String(toplam);

  function uyariyaGit(link) {
    setAcik(false);
    navigate(link);
  }

  return (
    <div className="zil-sarmal" ref={sarmalRef}>

      <button
        className={'zil-buton ' + (acik ? 'zil-buton-acik' : '')}
        onClick={() => setAcik(!acik)}
        aria-haspopup="menu"
        aria-expanded={acik}

        /* Ekran okuyucu için: görsel rozeti göremeyen kullanıcı
           kaç bildirim olduğunu ancak buradan öğrenir. */
        aria-label={
          toplam > 0
            ? toplam + ' bildirim var'
            : 'Bildirim yok'
        }
        title="Bildirimler"
      >
        <span className="zil-ikon"><Bell size={19} /></span>

        {/* ⚠️ SAYAÇ SIFIRSA ROZET HİÇ ÇİZİLMEZ.
        
            "0" yazan bir rozet göstermek dikkat çeker ama hiçbir
            bilgi vermez — üstelik her bakışta "bir şey mi var?"
            diye baktırır. Yokluk, sıfırdan farklı bir şeydir. */}
        {toplam > 0 && (
          <span className="zil-rozet">{rozetYazi}</span>
        )}
      </button>

      {acik && (
        <div className="zil-panel" role="menu">

          <div className="zil-baslik">Dikkat Gerektirenler</div>

          {uyarilar.length === 0 && (
            <div className="zil-bos">
              Şu an bekleyen bir iş yok.
            </div>
          )}

          {uyarilar.map((u) => (
            <button
              key={u.tur}
              type="button"
              className={'zil-satir zil-oncelik-' + u.oncelik}
              role="menuitem"
              onClick={() => uyariyaGit(u.tumunuGorLink)}
            >
              <span className="zil-satir-ikon">
                {UYARI_IKON[u.tur] ?? <AlertTriangle size={16} />}
              </span>

              <span className="zil-satir-metin">
                <span className="zil-satir-baslik">{u.baslik}</span>
                <span className="zil-satir-ozet">{u.ozet}</span>
              </span>

              <span className="zil-satir-sayi">{u.adet}</span>
            </button>
          ))}

          <button
            type="button"
            className="zil-alt"
            onClick={() => uyariyaGit('/')}
          >
            Dashboard'da tümünü gör →
          </button>
        </div>
      )}
    </div>
  );
}