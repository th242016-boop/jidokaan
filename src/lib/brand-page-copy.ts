import type { Locale } from "./i18n";

type BrandPageCopy = {
  title: string;
  body: string;
  mission: string;
  missionBody: string;
  studio: string;
  address: string;
};

// Preserve the approved Korean/English story; every selectable locale has its own copy.
const copy: Record<Exclude<Locale, "ar">, BrandPageCopy> = {
  ko: {
    title: "15년 수제화 경력에서 시작된 복싱화",
    body: "처음에는 내가 신을 복싱화를 직접 만들며 시작했습니다. 주변의 폭발적인 반응으로 지금까지 이어졌고, 앞으로는 복싱을 넘어 더 많은 스포츠의 커스텀 신발을 만드는 전문화된 기업으로 성장하려 합니다.",
    mission: "우리의 약속",
    missionBody: "지도칸이 말하는 '수제'는 명품 가방 같은 무결점의 화려함이 아닐지도 모릅니다. 하지만 세상에 단 하나뿐인 당신만의 맞춤 디자인, 그리고 한 번 신으면 잊을 수 없는 압도적인 착용감만큼은 그 어떤 브랜드보다 자신 있게 약속합니다.",
    studio: "공방",
    address: "서울특별시 성동구 성수이로18길 36",
  },
  en: {
    title: "Boxing shoes born from 15 years of handmade footwear",
    body: "It started with a pair I made to wear myself. Friends responded so strongly that it became a brand. Next we grow into a specialist that custom-builds shoes for more sports — not only boxing.",
    mission: "Our promise",
    missionBody: "Handmade at JIDOKAAN may not be the flawless shine of a luxury bag. What we do promise — more confidently than any other brand — is a one-of-one design that is yours, and a fit you will not forget once you put them on.",
    studio: "Studio",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Seoul",
  },
  ja: {
    title: "15年の手作り靴づくりの経験から生まれたボクシングシューズ",
    body: "始まりは、自分が履くボクシングシューズを自分で作ったことでした。周囲の大きな反響に支えられて今日まで続いてきました。これからはボクシングにとどまらず、より多くのスポーツのカスタムシューズを作る専門企業へと成長していきたいと考えています。",
    mission: "私たちの約束",
    missionBody: "JIDOKAANの「手作り」は、高級バッグのように一点の曇りもない華やかさではないかもしれません。それでも、世界に一つだけのあなただけのデザインと、一度履いたら忘れられない履き心地は、どのブランドにも負けない自信を持ってお約束します。",
    studio: "工房",
    address: "ソウル特別市 城東区 聖水二路18ギル36",
  },
  es: {
    title: "Botas de boxeo nacidas de 15 años de experiencia en calzado artesanal",
    body: "Todo empezó cuando fabriqué unas botas de boxeo para mí. La gran respuesta de quienes me rodeaban nos ha traído hasta aquí. Ahora queremos crecer como una empresa especializada en calzado personalizado para más deportes, además del boxeo.",
    mission: "Nuestra promesa",
    missionBody: "Lo «hecho a mano» en JIDOKAAN quizá no tenga el brillo impecable de un bolso de lujo. Pero prometemos, con más confianza que cualquier otra marca, un diseño único y hecho para ti, y una comodidad que no olvidarás después de ponértelas.",
    studio: "Taller",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Seúl",
  },
  th: {
    title: "รองเท้ามวยที่เกิดจากประสบการณ์ทำรองเท้าด้วยมือ 15 ปี",
    body: "จุดเริ่มต้นคือการทำรองเท้ามวยไว้ใส่เอง เสียงตอบรับอย่างล้นหลามจากคนรอบข้างทำให้เรามาถึงวันนี้ ต่อไปเราตั้งใจเติบโตเป็นบริษัทผู้เชี่ยวชาญด้านรองเท้าสั่งทำสำหรับกีฬาที่หลากหลายยิ่งขึ้น ไม่จำกัดเฉพาะมวย",
    mission: "คำสัญญาของเรา",
    missionBody: "คำว่า «ทำด้วยมือ» ของ JIDOKAAN อาจไม่ได้หมายถึงความหรูหราไร้ที่ติแบบกระเป๋าแบรนด์เนม แต่สิ่งที่เราสัญญาด้วยความมั่นใจไม่แพ้แบรนด์ใด คือดีไซน์สั่งทำที่เป็นของคุณเพียงคู่เดียวในโลก และความสบายที่คุณจะไม่ลืมเมื่อได้สวมใส่",
    studio: "เวิร์กช็อป",
    address: "36 ซองซูอีโร 18 กิล เขตซองดง กรุงโซล",
  },
  fr: {
    title: "Des chaussures de boxe nées de 15 ans de savoir-faire artisanal",
    body: "Tout a commencé par une paire de chaussures de boxe que j’ai fabriquée pour moi. L’enthousiasme de mon entourage nous a menés jusqu’ici. Nous voulons désormais devenir une entreprise spécialisée dans les chaussures personnalisées pour davantage de sports, au-delà de la boxe.",
    mission: "Notre promesse",
    missionBody: "Le « fait main » de JIDOKAAN n’a peut-être pas l’éclat irréprochable d’un sac de luxe. Mais nous promettons, avec autant de confiance que n’importe quelle marque, un modèle unique créé pour vous et un confort que vous n’oublierez pas après l’avoir porté.",
    studio: "Atelier",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Séoul",
  },
  de: {
    title: "Boxschuhe aus 15 Jahren Erfahrung in der Schuhhandfertigung",
    body: "Am Anfang stand ein Paar Boxschuhe, das ich für mich selbst anfertigte. Die überwältigende Resonanz aus meinem Umfeld hat uns bis hierher getragen. Nun möchten wir zu einem Spezialisten für individuell gefertigte Schuhe für weitere Sportarten über das Boxen hinaus wachsen.",
    mission: "Unser Versprechen",
    missionBody: "„Handgefertigt“ bei JIDOKAAN bedeutet vielleicht nicht den makellosen Glanz einer Luxustasche. Doch ein einzigartiges Design, das nur Ihnen gehört, und ein Tragegefühl, das Sie nach dem ersten Anziehen nicht vergessen, versprechen wir mit mehr Überzeugung als jede andere Marke.",
    studio: "Werkstatt",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Seoul",
  },
  zh: {
    title: "源自15年手工制鞋经验的拳击鞋",
    body: "最初，我只是为自己制作了一双拳击鞋。身边热烈的反响让我们一路走到今天。未来，我们希望成长为一家专业企业，为拳击以外的更多运动制作定制鞋履。",
    mission: "我们的承诺",
    missionBody: "JIDOKAAN所说的“手工”，或许并非奢侈品牌手袋那般毫无瑕疵的华丽。但对于世上独一无二、专属于您的定制设计，以及穿过一次便难以忘怀的舒适脚感，我们比任何品牌都更有信心作出承诺。",
    studio: "工坊",
    address: "首尔特别市城东区圣水二路18街36号",
  },
  "zh-Hant": {
    title: "源自15年手工製鞋經驗的拳擊鞋",
    body: "最初，我只是為自己製作了一雙拳擊鞋。身邊熱烈的反響讓我們一路走到今天。未來，我們希望成長為一家專業企業，為拳擊以外的更多運動製作訂製鞋履。",
    mission: "我們的承諾",
    missionBody: "JIDOKAAN所說的「手工」，或許並非奢侈品牌手袋那般毫無瑕疵的華麗。但對於世上獨一無二、專屬於您的訂製設計，以及穿過一次便難以忘懷的舒適腳感，我們比任何品牌都更有信心作出承諾。",
    studio: "工坊",
    address: "首爾特別市城東區聖水二路18街36號",
  },
  ru: {
    title: "Боксёрки, созданные на основе 15 лет опыта изготовления обуви вручную",
    body: "Всё началось с пары боксёрок, которую я сделал для себя. Восторженные отзывы окружающих помогли нам пройти этот путь. Теперь мы хотим стать компанией, специализирующейся на изготовлении индивидуальной обуви и для других видов спорта, помимо бокса.",
    mission: "Наше обещание",
    missionBody: "Ручная работа JIDOKAAN, возможно, не обладает безупречным блеском роскошной сумки. Но мы увереннее любого другого бренда обещаем уникальный дизайн, созданный только для вас, и комфорт, который вы не забудете, однажды надев нашу обувь.",
    studio: "Мастерская",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Сеул",
  },
  it: {
    title: "Scarpe da boxe nate da 15 anni di esperienza nella calzatura artigianale",
    body: "Tutto è iniziato con un paio di scarpe da boxe che ho realizzato per me. L’entusiasmo delle persone intorno a me ci ha portati fino a qui. Ora vogliamo crescere come azienda specializzata in scarpe personalizzate per altri sport, oltre alla boxe.",
    mission: "La nostra promessa",
    missionBody: "Il «fatto a mano» di JIDOKAAN potrebbe non avere lo splendore impeccabile di una borsa di lusso. Ma promettiamo, con più sicurezza di qualsiasi altro marchio, un design unico creato per te e un comfort che non dimenticherai dopo averle indossate.",
    studio: "Laboratorio",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Seul",
  },
  pt: {
    title: "Calçados de boxe nascidos de 15 anos de experiência em produção artesanal",
    body: "Tudo começou com um par de calçados de boxe que fiz para usar. A resposta entusiasmada das pessoas ao meu redor nos trouxe até aqui. Agora queremos crescer como uma empresa especializada em calçados personalizados para mais esportes, além do boxe.",
    mission: "Nossa promessa",
    missionBody: "O «feito à mão» da JIDOKAAN talvez não tenha o brilho impecável de uma bolsa de luxo. Mas prometemos, com mais confiança do que qualquer outra marca, um design único feito para você e um conforto que você não esquecerá depois de calçá-los.",
    studio: "Oficina",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Seul",
  },
  tr: {
    title: "15 yıllık el yapımı ayakkabı deneyiminden doğan boks ayakkabıları",
    body: "Her şey kendim giymek için yaptığım bir çift boks ayakkabısıyla başladı. Çevremdekilerin büyük ilgisi bizi bugüne taşıdı. Şimdi yalnızca boks için değil, daha fazla spor dalı için kişiye özel ayakkabılar üreten uzman bir şirket olarak büyümek istiyoruz.",
    mission: "Sözümüz",
    missionBody: "JIDOKAAN’ın «el yapımı» anlayışı, lüks bir çantanın kusursuz gösterişi olmayabilir. Ancak dünyada yalnızca size ait olan eşsiz bir tasarımı ve bir kez giydiğinizde unutamayacağınız rahatlığı, her markadan daha büyük bir güvenle vaat ediyoruz.",
    studio: "Atölye",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Seul",
  },
  uz: {
    title: "15 yillik qo‘lda poyabzal tayyorlash tajribasidan yaralgan boks poyabzali",
    body: "Hammasi o‘zim kiyishim uchun tayyorlagan bir juft boks poyabzalidan boshlandi. Atrofimdagilarning katta qiziqishi bizni bugungi kungacha yetakladi. Endi boksdan tashqari boshqa sport turlari uchun ham individual poyabzal tayyorlaydigan ixtisoslashgan kompaniya sifatida o‘sishni maqsad qilganmiz.",
    mission: "Va’damiz",
    missionBody: "JIDOKAAN uchun «qo‘lda tayyorlangan» degani hashamatli sumkadek benuqson jilo bo‘lmasligi mumkin. Ammo dunyoda faqat sizga tegishli bo‘lgan yagona dizaynni va bir marta kiyganingizdan so‘ng unutolmaydigan qulaylikni har qanday brenddan ham katta ishonch bilan va’da qilamiz.",
    studio: "Ustaxona",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Seul",
  },
  hi: {
    title: "हाथ से जूते बनाने के 15 वर्षों के अनुभव से बने बॉक्सिंग जूते",
    body: "शुरुआत तब हुई जब मैंने अपने पहनने के लिए बॉक्सिंग जूतों की एक जोड़ी बनाई। आसपास के लोगों की शानदार प्रतिक्रिया हमें यहाँ तक लाई। अब हमारा लक्ष्य बॉक्सिंग के साथ दूसरे खेलों के लिए भी कस्टम जूते बनाने वाली विशेषज्ञ कंपनी के रूप में आगे बढ़ना है।",
    mission: "हमारा वादा",
    missionBody: "JIDOKAAN में «हाथ से बने» का अर्थ शायद किसी लग्ज़री बैग जैसी बेदाग चमक नहीं है। लेकिन हम किसी भी दूसरे ब्रांड से अधिक विश्वास के साथ वादा करते हैं कि आपका डिज़ाइन दुनिया में अनोखा और सिर्फ़ आपका होगा, और इन जूतों को एक बार पहनने के बाद आप उनका आराम नहीं भूलेंगे।",
    studio: "कार्यशाला",
    address: "36, सोंगसुई-रो 18-गिल, सोंगदोंग-गु, सियोल",
  },
  tl: {
    title: "Sapatos sa boksing na nagmula sa 15 taong karanasan sa paggawa ng sapatos sa kamay",
    body: "Nagsimula ito sa isang pares ng sapatos sa boksing na ginawa ko para sa sarili ko. Ang napakagandang tugon ng mga tao sa paligid ko ang nagdala sa amin hanggang dito. Ngayon, layunin naming maging kumpanyang dalubhasa sa paggawa ng pasadyang sapatos para sa iba pang isports, bukod sa boksing.",
    mission: "Pangako namin",
    missionBody: "Ang «gawang-kamay» ng JIDOKAAN ay maaaring hindi kasingkinis at kasingkintab ng isang mamahaling bag. Pero buong tiwala naming ipinapangako, higit sa alinmang tatak, ang natatanging disenyong para lamang sa iyo at ang ginhawang hindi mo malilimutan kapag naisuot mo na.",
    studio: "Pagawaan",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Seoul",
  },
};

export function brandPageCopy(locale: Locale): BrandPageCopy {
  return locale === "ar" ? copy.en : copy[locale];
}
