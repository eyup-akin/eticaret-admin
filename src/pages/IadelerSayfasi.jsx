import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiGet, apiPut, apiPost } from '../services/api';
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';

import Yukleniyor from '../components/Yukleniyor';
import HataKutusu from '../components/HataKutusu';
import Sayfalama from '../components/Sayfalama';
import Tablo from '../components/Tablo';
import Rozet from '../components/Rozet';
import Buton from '../components/Buton';
import OnayPenceresi from '../components/OnayPenceresi';

import './IadelerSayfasi.css';

import { Ban, Check, Inbox, PackageCheck, Truck, Wallet } from 'lucide-react';

// deger === null → filtre gönderilmiyor, hepsi geliyor.
const SEKMELER = [
  { anahtar: 'talep_edildi', yazi: 'Karar Bekleyen', deger: 'talep_edildi', ikon: <Inbox size={16} /> },
  { anahtar: 'onaylandi', yazi: 'Kargo Bekleyen', deger: 'onaylandi', ikon: <Truck size={16} /> },
  { anahtar: 'teslim_alindi', yazi: 'Teslim Alındı', deger: 'teslim_alindi', ikon: <PackageCheck size={16} /> },
  { anahtar: 'para_iade_edildi', yazi: 'Ödendi', deger: 'para_iade_edildi', ikon: <Wallet size={16} /> },
  { anahtar: 'reddedildi', yazi: 'Reddedilen', deger: 'reddedildi', ikon: <Ban size={16} /> },
];

const SEBEP_YAZI = {
  hatali_urun: 'Hatalı ürün',
  bedene_uymadi: 'Bedene uymadı',
  farkli_urun_geldi: 'Farklı ürün geldi',
  hasarli_geldi: 'Hasarlı geldi',
  vazgectim: 'Vazgeçtim',
  diger: 'Diğer',
};

export default function IadelerSayfasi() {
  const navigate = useNavigate();

  // Varsayılan sekme: yapılacak iş, arşiv değil.
  const [aktifSekme, setAktifSekme] = useState('talep_edildi');

  const [veri, setVeri] = useState(null);
  const [sayfa, setSayfa] = useState(1);
  const [sayfaBoyutu, setSayfaBoyutu] = useState(20);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [tazele, setTazele] = useState(0);

  // Açık pencereler — hedefin kendisi saklanıyor, ayrı boolean yok.
  const [redEdilecek, setRedEdilecek] = useState(null);
  const [redNedeni, setRedNedeni] = useState('');
  const [onaylanacak, setOnaylanacak] = useState(null);
  const [odenecek, setOdenecek] = useState(null);
  const [islemde, setIslemde] = useState(false);

  useEffect(() => {
    let iptal = false;

    (async () => {
      setYukleniyor(true);
      setHata('');

      try {
        const sekme = SEKMELER.find((s) => s.anahtar === aktifSekme);

        const parcalar = ['sayfa=' + sayfa, 'sayfaBoyutu=' + sayfaBoyutu];
        if (sekme?.deger) parcalar.push('durum=' + sekme.deger);

        const cevap = await apiGet('/admin/iadeler?' + parcalar.join('&'));
        if (!iptal) setVeri(cevap);
      } catch (e) {
        if (!iptal) setHata(e.message);
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();

    return () => { iptal = true; };
  }, [aktifSekme, sayfa, sayfaBoyutu, tazele]);

  function sekmeDegistir(yeni) {
    setAktifSekme(yeni);
    setSayfa(1);
  }

  async function karar(talep, onay) {
    setIslemde(true);
    setHata('');

    try {
      await apiPut('/admin/iadeler/' + talep.id + '/karar', {
        onay,
        redNedeni: onay ? null : redNedeni.trim(),
      });

      setOnaylanacak(null);
      setRedEdilecek(null);
      setRedNedeni('');
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
      setOnaylanacak(null);
      setRedEdilecek(null);
    } finally {
      setIslemde(false);
    }
  }

  async function teslimAlindi(talep) {
    setHata('');

    try {
      await apiPut('/admin/iadeler/' + talep.id + '/teslim-alindi', {});
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
    }
  }

  async function paraIadesi(talep) {
    setIslemde(true);
    setHata('');

    try {
      await apiPost('/admin/iadeler/' + talep.id + '/para-iadesi', {});
      setOdenecek(null);
      setTazele((n) => n + 1);
    } catch (e) {
      setHata(e.message);
      setOdenecek(null);
    } finally {
      setIslemde(false);
    }
  }

  // Duruma göre bir sonraki adım. Her satırda yalnızca o adım
  // görünüyor: yapılamayacak eylemi göstermek gürültü.
  function eylemler(t) {
    if (t.durum === 'talep_edildi') {
      return (
        <div className="iade-eylem">
          <Buton tip="ikincil" boyut="kucuk" ikonRengi="basari" onClick={() => setOnaylanacak(t)}>
            <Check size={15} /> Onayla
          </Buton>
          <Buton tip="ikincil" boyut="kucuk" ikonRengi="uyari" onClick={() => { setRedEdilecek(t); setRedNedeni(''); }}>
            <Ban size={15} /> Reddet
          </Buton>
        </div>
      );
    }

    if (t.durum === 'onaylandi') {
      return (
        <Buton tip="ikincil" boyut="kucuk" ikonRengi="ana" onClick={() => teslimAlindi(t)}>
          <PackageCheck size={15} /> Ürün Geldi
        </Buton>
      );
    }

    if (t.durum === 'teslim_alindi') {
      return (
        <Buton boyut="kucuk" onClick={() => setOdenecek(t)}>
          <Wallet size={15} /> Parayı İade Et
        </Buton>
      );
    }

    return <span className="iade-bitti">—</span>;
  }

  const sutunlar = [
    {
      baslik: 'Sipariş',
      hucre: (t) => (
        <div>
          <button
            type="button"
            className="iade-siparis-link"
            onClick={() => navigate('/siparisler/' + t.orderId)}
          >
            {t.siparisNo}
          </button>
          <div className="iade-alt">{t.musteriAdi}</div>
        </div>
      ),
    },
    {
      baslik: 'Kapsam',
      // Tüm sipariş mi tek ürün mü? Tutar bu ayrıma bağlı.
      hucre: (t) => (t.urunAdi ? t.urunAdi : <b>Tüm sipariş</b>),
    },
    {
      baslik: 'Sebep',
      hucre: (t) => (
        <div>
          <div>{SEBEP_YAZI[t.sebep] ?? t.sebep}</div>
          {t.aciklama && <div className="iade-alt">{t.aciklama}</div>}
        </div>
      ),
    },
    {
      baslik: 'Tutar',
      hizala: 'sag',
      // Ödendiyse donmuş tutar, değilse hesaplanan.
      hucre: (t) => paraBicimle(t.iadeTutari ?? t.tutar),
    },
    {
      baslik: 'Durum',
      hucre: (t) => (
        <div>
          <Rozet durum={t.durum} />
          {t.redNedeni && <div className="iade-alt">{t.redNedeni}</div>}
        </div>
      ),
    },
    {
      baslik: 'Talep',
      hizala: 'sag',
      hucre: (t) => tarihBicimle(t.talepTarihi),
    },
    {
      baslik: '',
      hizala: 'sag',
      hucre: eylemler,
    },
  ];

  if (yukleniyor && veri === null) {
    return <Yukleniyor yazi="İade talepleri getiriliyor..." />;
  }

  if (hata && veri === null) {
    return <HataKutusu mesaj={hata} tekrarDene={() => setTazele((n) => n + 1)} />;
  }

  const sayilar = veri?.durumSayilari ?? {};

  return (
    <div>
      <div className="sayfa-ust">
        <div>
          <h1 className="sayfa-baslik">İade Talepleri</h1>
          <p className="sayfa-altyazi">
            Karar bekleyenler en üstte. Para iadesi, ürün elimize ulaştıktan sonra yapılır.
          </p>
        </div>
      </div>

      <div className="sekme-serit" style={{ marginBottom: 16 }}>
        {SEKMELER.map((s) => {
          // Sayaç yalnızca iş bekleyen sekmelerde ve sıfırsa çizilmiyor.
          const sayi = s.anahtar === 'talep_edildi'
            ? (sayilar.talepEdildi ?? 0)
            : s.anahtar === 'teslim_alindi'
              ? (sayilar.teslimAlindi ?? 0)
              : 0;

          return (
            <button
              key={s.anahtar}
              className={'sekme' + (aktifSekme === s.anahtar ? ' sekme-aktif' : '')}
              onClick={() => sekmeDegistir(s.anahtar)}
              type="button"
            >
              <span className="sekme-ikon">{s.ikon}</span>
              {s.yazi}
              {sayi > 0 && <span className="iade-sekme-sayi">{sayi}</span>}
            </button>
          );
        })}
      </div>

      {hata && <HataKutusu mesaj={hata} />}

      <Tablo
        sutunlar={sutunlar}
        veriler={veri?.talepler ?? []}
        anahtar={(t) => t.id}
        bosMesaj={
          aktifSekme === 'talep_edildi'
            ? 'Karar bekleyen iade yok.'
            : 'Bu durumda iade talebi yok.'
        }
      />

      <Sayfalama
        sayfa={veri?.sayfa ?? 1}
        toplamSayfa={veri?.toplamSayfa ?? 1}
        toplam={veri?.toplam ?? 0}
        sayfaBoyutu={sayfaBoyutu}
        sayfaDegistir={setSayfa}
        boyutDegistir={(b) => { setSayfaBoyutu(b); setSayfa(1); }}
      />

      {/* Onay: kırmızı değil — iadeyi onaylamak yıkıcı bir işlem değil. */}
      <OnayPenceresi
        acik={onaylanacak !== null}
        baslik="İade onaylansın mı?"
        mesaj={
          onaylanacak
            ? `${onaylanacak.siparisNo} — müşteriye ürünü göndermesi için bilgi maili gidecek. Para, ürün elimize ulaşınca ödenecek.`
            : ''
        }
        onayYazi="Evet, Onayla"
        islemdeYazi="Onaylanıyor..."
        onayTipi="ana"
        islemde={islemde}
        iptal={() => setOnaylanacak(null)}
        onayla={() => karar(onaylanacak, true)}
      />

      {/* ⭐ DEĞİŞTİ — metin artık gerçeği söylüyor.
          Eskiden iade yalnızca veritabanına yazılıyordu; şimdi para
          gerçekten müşterinin kartına gönderiliyor. Admin'in neyi
          onayladığını bilmesi gerekiyor. */}
      <OnayPenceresi
        acik={odenecek !== null}
        baslik="Para iadesi yapılsın mı?"
        mesaj={
          odenecek
            ? `${paraBicimle(odenecek.tutar)} müşterinin kartına GERÇEKTEN gönderilecek ve ürünler stoğa geri eklenecek. Bu işlem geri alınamaz.`
            : ''
        }
        onayYazi="Evet, İade Et"
        islemdeYazi="İade ediliyor..."
        islemde={islemde}
        iptal={() => setOdenecek(null)}
        onayla={() => paraIadesi(odenecek)}
      />

      {/* Red nedeni metin istiyor; OnayPenceresi yalnızca evet/hayır
          soruyor. Admin başvurularındaki gibi ayrı bir kutu. */}
      {redEdilecek && (
        <div className="iade-red-perde" onClick={() => setRedEdilecek(null)}>
          <div className="iade-red-kutu" onClick={(e) => e.stopPropagation()}>
            <h3 className="iade-red-baslik">İade reddedilsin mi?</h3>
            <p className="iade-red-metin">
              {redEdilecek.siparisNo} — red nedeni müşteriye e-posta ile gidecek.
            </p>

            <textarea
              className="iade-red-alan"
              value={redNedeni}
              onChange={(e) => setRedNedeni(e.target.value)}
              placeholder="Neden reddedildiğini yaz (zorunlu)"
              maxLength={500}
              rows={3}
            />

            <div className="iade-red-butonlar">
              <Buton tip="ikincil" onClick={() => setRedEdilecek(null)}>Vazgeç</Buton>
              <Buton
                tip="tehlike"
                disabled={islemde || redNedeni.trim().length === 0}
                onClick={() => karar(redEdilecek, false)}
              >
                {islemde ? 'Reddediliyor...' : 'Evet, Reddet'}
              </Buton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
