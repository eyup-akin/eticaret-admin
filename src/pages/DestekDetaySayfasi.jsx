import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { apiGet, apiPost, apiPut } from '../services/api';
import { tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Buton from '../components/Buton';
import Rozet from '../components/Rozet';
import OnayPenceresi from '../components/OnayPenceresi';

import './DestekDetaySayfasi.css';

import { CheckCheck, Mail, Package, RotateCcw, Send, User } from 'lucide-react';

const MESAJ_SINIRI = 2000;   // ⚠️ Backend DTO'sundaki sayıyla AYNI olmalı

export default function DestekDetaySayfasi() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [talep, setTalep] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const [cevap, setCevap] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // null = pencere kapalı. Ayrı bir boolean tutmak yerine hedefin
  // kendisini saklıyoruz — tutarsız duruma düşmek imkânsız olsun.
  const [kapatmaOnayi, setKapatmaOnayi] = useState(false);

  // Yazışmanın sonuna kaydırmak için.
  const sonMesajRef = useRef(null);

  /* ⚠️ TAZELEME BİR SAYAÇLA YAPILIYOR, doğrudan `getir()` çağrısıyla
     değil.
     İlk yazımda dışarıda bir `getir()` fonksiyonu vardı ve hem efekt
     hem de cevap/durum işlemleri onu çağırıyordu. İki sorunu vardı:
       1) Efektin içinden senkron `setState` çağırmak (lint uyarısı)
       2) İstek iptal edilemiyordu — hızlı gezinmede eski cevap
          yenisinin üstüne yazabilirdi
     Sayaç deseninde veri çekme TEK yerde (efektin içinde) ve iptal
     bayrağı doğal olarak çalışıyor. */
  const [tazele, setTazele] = useState(0);

  useEffect(() => {
    let iptal = false;

    (async () => {
      setYukleniyor(true);
      setHata('');

      try {
        const veri = await apiGet('/admin/destek/' + id);
        if (!iptal) setTalep(veri);
      } catch (e) {
        if (!iptal) setHata(e.message);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();

    return () => { iptal = true; };
  }, [id, tazele]);

  // ⚠️ Yazışma UZUN olabilir ve en yeni mesaj EN ALTTA. Sayfa
  // açıldığında adminin gördüğü şey ilk mesaj olsaydı, cevaplamak
  // için her seferinde aşağı kaydırması gerekirdi.
  useEffect(() => {
    if (talep) {
      sonMesajRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [talep]);

  async function cevapGonder() {
    const metin = cevap.trim();
    if (!metin) return;

    setGonderiliyor(true);
    setHata('');

    try {
      await apiPost('/admin/destek/' + id + '/cevap', { mesaj: metin });

      // ⚠️ Kutu SUNUCU ONAYLADIKTAN SONRA temizleniyor. Önce
      // temizleseydik istek patladığında admin yazdığı cevabı
      // kaybederdi.
      setCevap('');
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  async function durumDegistir(yeniDurum) {
    setHata('');

    try {
      await apiPut('/admin/destek/' + id + '/durum', { durum: yeniDurum });
      setKapatmaOnayi(false);
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
      setKapatmaOnayi(false);
    }
  }

  if (yukleniyor && talep === null) {
    return <Yukleniyor yazi="Talep getiriliyor..." />;
  }

  if (talep === null) {
    return (
      <div>
        <HataKutusu mesaj={hata} tekrarDene={() => setTazele((n) => n + 1)} />
        <div style={{ marginTop: 16 }}>
          <Buton tip="ikincil" onClick={() => navigate('/destek')}>
            ← Destek Taleplerine Dön
          </Buton>
        </div>
      </div>
    );
  }

  const kapaliMi = talep.durum === 'kapali';

  return (
    <div>
      <div className="sayfa-ust">
        <div>
          <Buton tip="ikincil" boyut="kucuk" onClick={() => navigate('/destek')}>
            ← Talepler
          </Buton>

          <h1 className="sayfa-baslik" style={{ marginTop: 8 }}>{talep.konu}</h1>

          <div className="destek-detay-meta">
            <Rozet durum={talep.durum} />
            <Rozet durum={'destek_' + talep.kategori} />
            <span className="destek-detay-tarih">
              Açılış: {tarihBicimle(talep.createdAt)}
            </span>
          </div>
        </div>

        <div className="destek-detay-eylem">
          {kapaliMi ? (
            /* ⚠️ Kapalı talepte "Yeniden Aç" — kapatma butonunun
               yerine geçiyor, yanına DEĞİL. Kapalı bir talebi tekrar
               kapatmak diye bir iş yok. */
            <Buton tip="ikincil" onClick={() => durumDegistir('acik')}>
              <RotateCcw size={15} /> Yeniden Aç
            </Buton>
          ) : (
            <Buton tip="ikincil" onClick={() => setKapatmaOnayi(true)}>
              <CheckCheck size={15} /> Talebi Kapat
            </Buton>
          )}
        </div>
      </div>

      {hata && <HataKutusu mesaj={hata} />}

      {/* ---------- MÜŞTERİ KARTI ---------- */}
      <div className="kart destek-musteri">
        <div className="destek-musteri-satir">
          <User size={15} />
          <span>{talep.musteriAdi}</span>
        </div>

        <div className="destek-musteri-satir">
          <Mail size={15} />
          {/* ⚠️ mailto: bağlantısı — destek işinin doğası gereği
              adminin müşteriye uygulama dışından ulaşması gerekebilir.
              Kart ve adres bilgisinden farkı bu; onlar panele hiç
              taşınmıyor (karar #11). */}
          <a href={'mailto:' + talep.musteriEposta}>{talep.musteriEposta}</a>
        </div>

        {/* ⚠️ Sipariş satırı YALNIZCA bağlıysa çiziliyor. Boş bir
            "Sipariş: —" satırı, olmayan bir bağlantıyı varmış gibi
            gösterirdi. */}
        {talep.siparisNo && (
          <div className="destek-musteri-satir">
            <Package size={15} />
            <button
              type="button"
              className="destek-siparis-link"
              onClick={() => navigate('/siparisler/' + talep.orderId)}
            >
              {talep.siparisNo}
            </button>
          </div>
        )}
      </div>

      {/* ---------- YAZIŞMA ---------- */}
      <div className="destek-yazisma">
        {talep.mesajlar.map((m, i) => (
          <div
            key={m.id}
            ref={i === talep.mesajlar.length - 1 ? sonMesajRef : null}
            /* ⚠️ Taraf ayrımı KONUMLA da yapılıyor (müşteri solda,
               admin sağda), sadece renkle değil: renk körlüğü olan
               biri için renk tek başına bilgi taşımaz. */
            className={'destek-balon ' + (m.gonderenAdminMi ? 'destek-balon-admin' : 'destek-balon-musteri')}
          >
            <div className="destek-balon-ust">
              <strong>{m.gonderenAdi}</strong>
              <span>{tarihBicimle(m.createdAt)}</span>
            </div>

            {/* ⚠️ Metin JSX içinde basılıyor — React kendisi kaçırıyor,
                yani müşterinin yazdığı `<script>` etiketi HTML olarak
                değil düz metin olarak görünüyor. dangerouslySetInnerHTML
                kullanmak, müşteri girdisini panele enjekte etmek olurdu. */}
            <div className="destek-balon-metin">{m.mesaj}</div>
          </div>
        ))}
      </div>

      {/* ---------- CEVAP KUTUSU ---------- */}
      {kapaliMi ? (
        /* ⚠️ Kapalı talepte cevap kutusu HİÇ ÇİZİLMİYOR (pasif
           gösterilmiyor). Yazılabilir görünen ama çalışmayan bir
           kutu, adminin cevabını yazıp gönderememesi demekti.
           Yol açık: önce "Yeniden Aç". */
        <div className="destek-kapali-not">
          Bu talep kapalı. Cevap yazmak için önce yeniden açman gerekiyor.
        </div>
      ) : (
        <div className="kart destek-cevap">
          <textarea
            className="destek-cevap-alan"
            value={cevap}
            onChange={(e) => setCevap(e.target.value)}
            placeholder="Cevabını yaz..."
            maxLength={MESAJ_SINIRI}
            rows={4}
          />

          <div className="destek-cevap-alt">
            {/* ⚠️ Sayaç yalnızca sınıra YAKLAŞINCA çıkıyor. Her zaman
                görünseydi 2000 karakterin 12'sini yazan admine
                anlamsız bir sayaç gösterirdik. */}
            <span className="destek-sayac">
              {cevap.length > MESAJ_SINIRI - 200
                ? `${cevap.length} / ${MESAJ_SINIRI}`
                : ''}
            </span>

            <Buton
              onClick={cevapGonder}
              /* Boş mesaj gönderilemesin: sunucu da reddediyor ama
                 kullanıcıyı boşuna bir hataya sokmanın anlamı yok. */
              disabled={gonderiliyor || cevap.trim().length === 0}
            >
              <Send size={15} /> {gonderiliyor ? 'Gönderiliyor...' : 'Cevap Gönder'}
            </Buton>
          </div>
        </div>
      )}

      {/* ⚠️ `onayTipi="ana"` — kırmızı DEĞİL. Talebi kapatmak geri
          alınabilir bir işlem (müşteri yazınca yeniden açılıyor);
          kırmızı göstermek gerçekten geri alınamaz işlemlerin uyarı
          gücünü zayıflatırdı. */}
      <OnayPenceresi
        acik={kapatmaOnayi}
        baslik="Talep kapatılsın mı?"
        mesaj="Müşteri gerekirse tekrar yazarak talebi yeniden açabilir."
        onayYazi="Evet, Kapat"
        islemdeYazi="Kapatılıyor..."
        onayTipi="ana"
        iptal={() => setKapatmaOnayi(false)}
        onayla={() => durumDegistir('kapali')}
      />
    </div>
  );
}
