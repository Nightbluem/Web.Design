# Firma Adı BIM web sitesi: "Pafta seti"

Site bir BIM çizim seti gibi tasarlandı: her sayfa bir pafta (A-000 Kapak, A-100 Hizmetler, A-200 Projeler, A-210 Proje detay, A-300 Hakkımızda, A-900 İletişim).
Statik bir site olduğu için derleme gerekmez. Klasörü olduğu gibi Netlify, Cloudflare Pages, GitHub Pages ya da cPanel'e yükleyin.

## Dosyalar
- `*.html`: Sayfalar (TR/EN)
- `assets/style.css`: Tasarım sistemi (açık/koyu tema)
- `assets/model.js`: Kendini kuran izometrik bina modeli (canvas)
- `assets/site.js`: Dil, pafta menüsü, nişangah imleç, sayfa geçişleri
- `assets/logo.svg`, `assets/logo.png`: Logo

## Yayından önce değiştirilecekler
- "Firma Adı" ve `firmaadi.com` alan adı (sayfa başlıkları, canonical, sitemap, robots)
- İletişim bilgileri, rakamlar, projeler, ofisler (örnek olarak işaretli)
- İletişim formu şu an mesaj göndermiyor; Formspree ya da Netlify Forms gibi bir servise bağlanmalı.
