import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { rozetYazisi } from '../utils/bicimlendir';
import './BildirimZili.css';

// ⭐ YENİ (4.7) — emoji yerine çizgi ikon. Gerekçe PanelDuzeni'nde.
import { AlertTriangle, Bell, Clock, Package, ShieldCheck, Ticket, Undo2 } from 'lucide-react';

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

// ⭐ DEĞİŞTİ — VERİYİ ARTIK KENDİ ÇEKMİYOR, PROP OLARAK ALIYOR.
//
// ⚠️ Bu bileşen '/admin/dikkat-gerektirenler' ucuna kendi
// zamanlayıcısıyla soruyordu. Yan menüdeki rozetler ikinci tüketici
// olunca aynı uca iki istek gitmesi gerekirdi: iki zamanlayıcı, iki
// ayrı "gerçek". Zil 12 gösterirken menü 11 gösterebilirdi — aynı
// ekranda birbirini tutmayan iki sayı, hiç sayı göstermemekten kötü.
//
// Çekme işi PanelDuzeni'ne taşındı (zaten bu bileşeni o çiziyor ve
// menü rozetlerinin sahibi de o). Burada kalan tek iş: açılır listeyi
// yönetmek.
//
// ⚠️ `uyarilar` varsayılanı boş dizi: prop hiç gelmezse bileşen
// çökmesin, sadece "bekleyen iş yok" desin.
export default function BildirimZili({ uyarilar = [] }) {
  const navigate = useNavigate();

  const [acik, setAcik] = useState(false);

  const sarmalRef = useRef(null);

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
  //
  // 'ogeler.length' DEĞİL 'adet' kullanıyoruz — backend en fazla 8 örnek
  // gönderiyor ama gerçek sayı daha büyük olabilir.
  //
  // ⚠️ Bu cümle uzun süre YANLIŞTI: backend `adet` alanını da kırpılmış
  // listeden sayıyordu, yani 50 bekleyen sipariş varken 8 gönderiyordu.
  // Sayım artık ayrı bir COUNT sorgusundan geliyor ve bu satır nihayet
  // gerçekten doğru.
  const toplam = uyarilar.reduce((t, u) => t + u.adet, 0);

  // Rozet metni: 9'dan büyükse "9+".
  //
  // ⭐ DEĞİŞTİ — kural bicimlendir.js'e taşındı. Yan menüdeki rozetler
  // ikinci tüketici oldu; iki yerde ayrı yazsaydık biri "9+" derken
  // diğeri başka bir eşik kullanabilirdi.
  const rozetYazi = rozetYazisi(toplam);

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