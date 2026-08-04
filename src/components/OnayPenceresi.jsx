import Buton from './Buton';
import './OnayPenceresi.css';

// acik    : true/false — pencere görünsün mü
// baslik  : "Ürünü sil"
// mesaj   : "Bu işlem geri alınamaz..."
// onayla  : "Evet, Sil" butonuna basınca çalışacak fonksiyon
// iptal   : "Vazgeç" butonuna basınca çalışacak fonksiyon
// islemde : true ise butonlar kilitlenir
export default function OnayPenceresi({
  acik,
  baslik,
  mesaj,
  onayla,
  iptal,
  islemde = false,

  // ⭐ YENİ — onay butonunun metni ve tipi çağırana bırakıldı.
  //
  // NEDEN GEREKLİ?
  // Bu pencere şimdiye kadar sadece silme için kullanılıyordu ve
  // "Evet, Sil" metni koda gömülüydü. Yorum gizleme gibi
  // silme OLMAYAN işlemler için yanlış metin çıkardı — kullanıcı
  // "sil" yazan bir butona basıp yorumu kaybettiğini sanardı.
  //
  // NEDEN VARSAYILAN DEĞER VAR?
  // Bileşen zaten 4-5 yerde kullanılıyor. Varsayılanı ESKİ
  // davranış yaparsak o çağrıların hiçbirine dokunmamız
  // gerekmiyor. Yeni seçenek ekleyen değişikliklerde altın kural:
  // varsayılan = mevcut davranış.
  onayYazi = 'Evet, Sil',
  islemdeYazi = 'Siliniyor...',

  // 'tehlike' (kırmızı) | 'ana' (mavi)
  //
  // Renk BİLGİ taşımalı: kırmızı "geri alınamaz" der. Yorum
  // gizleme geri alınabilir bir işlem, kırmızı göstermek
  // kullanıcıyı gereksiz korkutur ve gerçekten tehlikeli
  // işlemlerin uyarı gücünü zayıflatır.
  onayTipi = 'tehlike',
}) {
  // Kapalıysa hiçbir şey çizme
  if (!acik) {
    return null;
  }

  return (
    <div className="onay-perde" onClick={iptal}>
      {/* stopPropagation: kutunun İÇİNE tıklayınca pencere kapanmasın */}
      <div className="onay-kutu" onClick={(e) => e.stopPropagation()}>

        <div className="onay-baslik">{baslik}</div>
        <div className="onay-mesaj">{mesaj}</div>

        <div className="onay-butonlar">
          <Buton tip="ikincil" onClick={iptal} disabled={islemde}>
            Vazgeç
          </Buton>

          <Buton tip={onayTipi} onClick={onayla} disabled={islemde}>
            {islemde ? islemdeYazi : onayYazi}
          </Buton>
        </div>

      </div>
    </div>
  );
}