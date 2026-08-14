import { useState } from 'react';

import TarihAraligi from '../components/TarihAraligi';

import DenetimSekmesi from '../components/sistemKayitlari/DenetimSekmesi';
import EpostaSekmesi from '../components/sistemKayitlari/EpostaSekmesi';
import GirisSekmesi from '../components/sistemKayitlari/GirisSekmesi';
import HataSekmesi from '../components/sistemKayitlari/HataSekmesi';

import './SistemKayitlariSayfasi.css';

import { ScrollText, Mail, KeyRound, Bug } from 'lucide-react';

// ============================================================
//  SİSTEM KAYITLARI — SEKMELİ KABUK
//
//  ⭐ YENİ — dört log ekranı TEK menüde toplandı.
//
//  ⚠️ NEDEN İKİ AYRI LOG MENÜSÜ OLMASIN?
//  Süperadmin "ne oldu?" diye baktığında tek yere bakmak ister.
//  Denetim ayrı, e-posta ayrı, girişler ayrı bir menü olsaydı sorunun
//  hangi ekranda görüneceğini önceden bilmek gerekirdi — ki bakan
//  kişi tam olarak onu bilmiyor.
//
//  ⚠️ Eski "Denetim Kaydı" sayfası buranın ilk sekmesi oldu ve
//  menüden ayrı girdisi kaldırıldı.
//
//  BU BİLEŞENİN İŞİ NE?
//  Sadece iki şey: hangi sekme açık, hangi tarih aralığı seçili.
//  Veri çekmiyor, tablo çizmiyor. (RaporlarSayfasi ile aynı desen.)
//
//  ⚠️ NEDEN TARİH BURADA, SEKMELERDE DEĞİL?
//  Kullanıcı bir aralık seçip Denetim'e baktı, sonra Hatalar'a geçti.
//  Aralık KORUNMALI — "o gece ne oldu" sorusu zaten sekmeler arası
//  gezinerek cevaplanıyor. Her sekme kendi tarihini tutsaydı her
//  geçişte sıfırlanırdı.
//
//  Kural: sekmeler arası paylaşılan durum kabukta, sekmeye özel durum
//  yaprakta. Arama ve sayfa numarası SEKMEDE kalıyor — onlar sekmeye
//  özel (e-postada adres, hatada yol arıyorsun; aynı metin ikisinde
//  aynı şeyi aramıyor).
// ============================================================

// Sekme tanımları VERİ olarak duruyor, JSX'e gömülü değil.
const SEKMELER = [
  { kod: 'denetim', yazi: 'Denetim',  ikon: <ScrollText size={16} /> },
  { kod: 'eposta',  yazi: 'E-posta',  ikon: <Mail size={16} /> },
  { kod: 'girisler',yazi: 'Girişler', ikon: <KeyRound size={16} /> },
  { kod: 'hatalar', yazi: 'Hatalar',  ikon: <Bug size={16} /> },
];

export default function SistemKayitlariSayfasi() {
  const [aktifSekme, setAktifSekme] = useState('denetim');

  // ⚠️ Boş başlıyorlar: kullanıcı bir şey seçmezse SUNUCU son 7 günü
  // döndürüyor. Varsayılanı burada hesaplayıp göndermiyoruz — kural
  // tek yerde (backend) yaşasın; iki yerde tanımlasaydık biri
  // değişince diğeri unutulurdu.
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');

  function tarihDegistir(yeniBaslangic, yeniBitis) {
    setBaslangic(yeniBaslangic);
    setBitis(yeniBitis);
  }

  return (
    <div>
      <div className="sayfa-ust">
        <h1 className="sayfa-baslik">
          <ScrollText size={20} /> Sistem Kayıtları
        </h1>

        <p className="sayfa-altyazi" style={{ marginBottom: 0 }}>
          Yönetici işlemleri, gönderilen e-postalar, giriş denemeleri ve
          sunucu hatalarının kalıcı kaydı
        </p>
      </div>

      {/* Sekmeler ve tarih seçici TEK KARTTA — sekme şeridi altındaki
          içeriğin grup başlığı; araya ayrı bir kart girerse o bağ
          kopar. (Raporlar sayfasındaki kararın aynısı.) */}
      <div className="log-kontrol">
        <div className="sekme-serit">
          {SEKMELER.map((s) => (
            <button
              key={s.kod}

              /* type="button" ŞART: belirtilmezse tarayıcı butonu
                 "submit" sayar. */
              type="button"

              className={'sekme' + (aktifSekme === s.kod ? ' sekme-aktif' : '')}
              onClick={() => setAktifSekme(s.kod)}
            >
              <span className="sekme-ikon">{s.ikon}</span>
              {s.yazi}
            </button>
          ))}
        </div>

        {/* cerceveli={false}: dış kart zaten var, ikinci çerçeve olmasın. */}
        <TarihAraligi
          baslangic={baslangic}
          bitis={bitis}
          degistir={tarihDegistir}
          cerceveli={false}
        />
      </div>

      {/* Koşullu render: sadece seçili olan DOM'da var.
          Gizlemek (display:none) yetmezdi — bileşen mount kalır ve
          verisini çekmeye devam ederdi. */}
      <div className="log-govde">
        {aktifSekme === 'denetim' && (
          <DenetimSekmesi baslangic={baslangic} bitis={bitis} />
        )}

        {aktifSekme === 'eposta' && (
          <EpostaSekmesi baslangic={baslangic} bitis={bitis} />
        )}

        {aktifSekme === 'girisler' && (
          <GirisSekmesi baslangic={baslangic} bitis={bitis} />
        )}

        {aktifSekme === 'hatalar' && (
          <HataSekmesi baslangic={baslangic} bitis={bitis} />
        )}
      </div>
    </div>
  );
}
