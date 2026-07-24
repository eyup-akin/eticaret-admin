// ROL HİYERARŞİSİ
//
// Backend ile aynı mantık: superadmin, admin'in yapabildiği her şeyi yapabilir.
// (TokenService süperadmin'e hem "superadmin" hem "admin" claim'i veriyor.)
//
// Sayı vermemizin sebebi: "eşit mi" yerine "yeterli mi" sorabilmek.
// Böylece gerekenRol='admin' olan bir sayfaya superadmin de girebilir.
const ROL_GUCU = {
  customer: 0,
  admin: 1,
  superadmin: 2,
};

// Kullanıcının rolü, istenen seviyeyi karşılıyor mu?
export function rolYeterliMi(kullaniciRol, gerekenRol) {
  // Şart konmamışsa herkes geçer.
  // (Zaten KorumaliRota admin olmayanı panele hiç sokmuyor.)
  if (!gerekenRol) {
    return true;
  }

  // Tanımadığımız bir rol gelirse en düşük güçte say — güvenli taraf.
  const sahipOlunan = ROL_GUCU[kullaniciRol] ?? -1;

  // Tanımadığımız bir şart gelirse kimse geçemesin — yine güvenli taraf.
  const gereken = ROL_GUCU[gerekenRol] ?? 99;

  return sahipOlunan >= gereken;
}