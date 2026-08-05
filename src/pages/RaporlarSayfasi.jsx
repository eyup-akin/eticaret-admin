import { useState } from 'react';

import TarihAraligi from '../components/TarihAraligi';
import SatisRaporu from '../components/raporlar/SatisRaporu';
import KategoriRaporu from '../components/raporlar/KategoriRaporu';

import OluStokRaporu from '../components/raporlar/OluStokRaporu';
import KritikStokRaporu from '../components/raporlar/KritikStokRaporu';
import IptalRaporu from '../components/raporlar/IptalRaporu';


import YorumRaporu from '../components/raporlar/YorumRaporu';
import MusteriRaporu from '../components/raporlar/MusteriRaporu';
import KuponRaporu from '../components/raporlar/KuponRaporu';
import OdemeRaporu from '../components/raporlar/OdemeRaporu';


import './RaporlarSayfasi.css';

// ============================================================
//  RAPORLAR — SEKMELİ KABUK
//
//  BU BİLEŞENİN İŞİ NE?
//  Sadece iki şey:
//    1) Hangi sekme açık (state)
//    2) Hangi tarih aralığı seçili (state)
//
//  Veri çekmiyor, tablo çizmiyor, hesap yapmıyor. Onlar sekme
//  bileşenlerinin işi.
//
//  NEDEN TARİH BURADA, SEKMELERDE DEĞİL?
//  Kullanıcı "Son 7 Gün" seçip Satışlar'a baktı, sonra Kategoriler'e
//  geçti. Aralık KORUNMALI. Her sekme kendi tarihini tutsaydı her
//  geçişte sıfırlanır, kullanıcı aynı filtreyi tekrar tekrar seçerdi.
//
//  Kural: sekmeler arası paylaşılan durum kabukta, sekmeye özel
//  durum yaprakta.
//
//  NEDEN HER SEKME KENDİ VERİSİNİ ÇEKİYOR?
//  Alternatif, sayfanın 9 raporu birden çekip props ile dağıtmasıydı.
//  Kullanıcı tek rapora bakacakken 9 istek atmak israf; üstelik
//  sayfa 9 ayrı state tutardı ve birindeki değişiklik hepsini
//  yeniden çizerdi.
//
//  Koşullu render sayesinde sekme değişince eski bileşen unmount,
//  yenisi mount olur — useEffect'i çalışır, TEK istek gider.
// ============================================================

// Sekme tanımları VERİ olarak duruyor, JSX'e gömülü değil.
// Yeni rapor eklemek = bu diziye bir satır + bir bileşen dosyası.
const SEKMELER = [
  { kod: 'satislar',    yazi: 'Satışlar & Kâr', ikon: '💰' },
  { kod: 'kategoriler', yazi: 'Kategoriler',    ikon: '🗂️' },
  { kod: 'musteriler',  yazi: 'Müşteriler',     ikon: '👥' },
  { kod: 'kuponlar',    yazi: 'Kuponlar',       ikon: '🎟️' },
  { kod: 'oluStok',     yazi: 'Ölü Stok',       ikon: '🧊' },
  { kod: 'kritikStok',  yazi: 'Kritik Stok',    ikon: '🚨' },
  { kod: 'iptaller',    yazi: 'İptaller',       ikon: '❌' },
  { kod: 'yorumlar',    yazi: 'Yorumlar',       ikon: '⭐' },
  { kod: 'odemeler',    yazi: 'Ödemeler',       ikon: '💳' },
];

export default function RaporlarSayfasi() {
  const [aktifSekme, setAktifSekme] = useState('satislar');

  // Boş başlıyorlar: kullanıcı bir şey seçmezse backend
  // varsayılan olarak son 30 günü döndürüyor.
  //
  // ⚠️ Burada "son 30 günü" ön yüzde hesaplayıp göndermiyoruz —
  // varsayılan kuralı SUNUCUDA yaşıyor. İki yerde tanımlasaydık
  // biri değişince diğeri unutulurdu.
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');

  // TarihAraligi tek bir fonksiyon bekliyor, iki setter değil.
  function tarihDegistir(yeniBaslangic, yeniBitis) {
    setBaslangic(yeniBaslangic);
    setBitis(yeniBitis);
  }

  return (
    <div>
      <div className="sayfa-ust">
        <h1 className="sayfa-baslik">Raporlar</h1>

        <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
          Seçtiğin tarih aralığında satış, kâr, stok ve müşteri analizi
        </p>
      </div>


      {/* ================= KONTROL PANELİ ================= */}
      {/*
        Sekmeler ve tarih seçici TEK KARTTA.

        Neden önce sekme, sonra tarih?
        Kullanıcının zihinsel sırası "hangi rapor → hangi dönem".
        Tersine koyarsak filtreyi, filtrelenecek şeyden önce
        sormuş oluruz.

        Neden aynı kartta?
        Sekme şeridi bir GRUP BAŞLIĞIDIR — altındaki içeriğin
        kime ait olduğunu söyler. Araya ayrı bir kart girerse o
        bağ kopar ve sekme boşlukta asılı kalır.
      */}
      <div className="rapor-kontrol">

        <div className="sekme-serit">
          {SEKMELER.map((s) => (
            <button
              key={s.kod}

              /* type="button" ŞART.
                 Belirtilmezse tarayıcı butonu "submit" sayar;
                 bu sayfa ileride bir form içine girerse sekmeye
                 tıklamak formu gönderir. */
              type="button"

              className={
                'sekme' +
                (aktifSekme === s.kod ? ' sekme-aktif' : '')
              }
              onClick={() => setAktifSekme(s.kod)}
            >
              <span className="sekme-ikon">{s.ikon}</span>
              {s.yazi}
            </button>
          ))}
        </div>

        {/* cerceveli={false}: dış kart zaten var, ikinci çerçeve
            çizilmesin. */}
        <TarihAraligi
          baslangic={baslangic}
          bitis={bitis}
          degistir={tarihDegistir}
          cerceveli={false}
        />
      </div>
      


      {/* ================= AKTİF RAPOR ================= */}
      {/* Koşullu render: sadece seçili olan DOM'da var.
          Gizlemek (display:none) yetmezdi — bileşen yine mount
          kalır ve verisini çekmeye devam ederdi. */}
      <div className="rapor-govde">
        {aktifSekme === 'satislar' && (
          <SatisRaporu baslangic={baslangic} bitis={bitis} />
        )}

        {aktifSekme === 'kategoriler' && (
          <KategoriRaporu baslangic={baslangic} bitis={bitis} />
        )}

        {aktifSekme === 'oluStok' && (
          <OluStokRaporu baslangic={baslangic} bitis={bitis} />
        )}

        {/* ⚠️ Bu rapora tarih GEÇMİYORUZ — anlık stok raporu.
            Prop geçseydik bileşen onu kullanmadığı için
            okuyan kişi "acaba unutulmuş mu" diye tereddüt ederdi.
            Geçmemek, niyeti kodda belgeler. */}
        {aktifSekme === 'kritikStok' && <KritikStokRaporu />}

        {aktifSekme === 'iptaller' && (
          <IptalRaporu baslangic={baslangic} bitis={bitis} />
        )}

        {aktifSekme === 'musteriler' && (
          <MusteriRaporu baslangic={baslangic} bitis={bitis} />
        )}

        {aktifSekme === 'kuponlar' && (
          <KuponRaporu baslangic={baslangic} bitis={bitis} />
        )}

        {aktifSekme === 'yorumlar' && (
          <YorumRaporu baslangic={baslangic} bitis={bitis} />
        )}

        {aktifSekme === 'odemeler' && (
          <OdemeRaporu baslangic={baslangic} bitis={bitis} />
        )}



      </div>
    </div>
  );
}