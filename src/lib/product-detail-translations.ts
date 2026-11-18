/** Full catalog narratives for languages absent from the original snapshot.
 * Current production estimates and country prices are appended by the caller.
 * Original media and catalog records remain unchanged.
 */
type DetailRow = { high: string; mid: string; boots: string; accessories: [string, string, string, string, string, string] };

const rows: Record<string, DetailRow> = {
  zh: {
    high: "JIDOKAAN DRONE 高帮定制拳击鞋，在韩国首尔圣水逐双手工制作，可用于比赛。",
    mid: "JIDOKAAN DRONE 中帮定制拳击鞋，同样在韩国首尔圣水逐双手工制作。鞋帮比高帮款更低。",
    boots: "在模拟器中选择各部位颜色和尺码，再确认设计。\n\n■ 适合人群\n想亲自搭配鞋身颜色，或希望改善现有拳击鞋穿着体验的拳击爱好者和选手。\n\n■ 特点\n· 各部位颜色可定制\n· 注重舒适的穿着体验\n· 生胶外底提供良好抓地力\n· 手工制作，可在韩国维修（更换外底：KRW 65,000）\n\n■ 尺码指南\n女款 225–245 / 男款 240–300（毫米）。\n女款通常选择平时的尺码。男款据反馈比普通运动鞋略大，通常建议小一码；脚较宽时，平时的尺码可能更合适。",
    accessories: [
      "全粒面真皮转换绑带，可将魔术贴拳套改为系带固定。\n\n共有9种颜色，每份为1套绑带。通常在约2–3天内从首尔发出。",
      "JIDOKAAN 畅销的 Viper 毛巾头巾。\n\n吸汗性好，可像头带一样佩戴，适用于拳击、健身和跑步。本产品已完成外观设计注册。\n\n■ 颜色\n黑色 / 藏蓝色 / 白色 / 红色 / 蓝色\n\n■ 材料与护理\n棉混纺毛巾布。清洗后请阴干。",
      "Viper 防滑头巾有助于减少头盔转动。佩戴在头盔内侧，表面经过硅胶防滑处理。\n\n■ 类型\n· 凉感款（尼龙）：轻盈、速干\n· 毛巾款（棉）：吸收汗水\n\n对练时请佩戴在头盔内。",
      "适合拳击鞋和高帮鞋的加长扁平鞋带。\n\n长220cm、宽8mm。比普通运动鞋带更长，可充分系至拳击鞋鞋帮顶部。\n\n■ 规格\nJDKL B1 / 220cm × 8mm / 聚酯纤维扁平鞋带",
      "适合靴子、登山鞋和高帮鞋的圆形鞋带。\n\n粗5mm、长200cm。圆形设计不易松脱。\n\n■ 规格\nJDKL A1 / 200cm × 5mm / 聚酯纤维圆形鞋带",
      "头盔替换用圆绳，也可用于拳套。\n\n粗6mm、长200cm。比普通鞋带更粗，适用于头盔扣件。\n\n■ 规格\nJDKL A2 / 200cm × 6mm / 聚酯纤维绳"
    ]
  },
  "zh-Hant": {
    high: "JIDOKAAN DRONE 高筒訂製拳擊鞋，在韓國首爾聖水逐雙手工製作，適合比賽使用。",
    mid: "JIDOKAAN DRONE 中筒訂製拳擊鞋，同樣在韓國首爾聖水逐雙手工製作，鞋筒比高筒款低。",
    boots: "在模擬器中選擇各部位的顏色和尺碼，再確認設計。\n\n■ 適合對象\n想自行配搭鞋身顏色，或希望改善現有拳擊鞋穿着體驗的拳擊愛好者和選手。\n\n■ 特點\n· 各部位顏色可訂製\n· 注重舒適的穿着體驗\n· 生膠外底提供良好抓地力\n· 手工製作，可在韓國維修（更換外底：KRW 65,000）\n\n■ 尺碼指南\n女款 225–245 / 男款 240–300（毫米）。\n女款一般可選平時的尺碼。男款據用家反映比一般運動鞋略大，通常建議選小一碼；腳掌較闊時，平時的尺碼可能更合適。",
    accessories: [
      "全粒面真皮轉換綁帶，可將魔術貼拳套改為綁帶固定。\n\n共有9種顏色，每份為1套綁帶。一般約2–3天內從首爾寄出。",
      "JIDOKAAN 暢銷的 Viper 毛巾頭巾。\n\n吸汗力強，可像頭帶一樣佩戴，適用於拳擊、健身和跑步。本產品已完成外觀設計註冊。\n\n■ 顏色\n黑色 / 深藍色 / 白色 / 紅色 / 藍色\n\n■ 材料與護理\n棉混紡毛巾布。清洗後請陰乾。",
      "Viper 防滑頭巾有助減少頭盔轉動。佩戴在頭盔內側，表面經過矽膠防滑處理。\n\n■ 款式\n· 涼感款（尼龍）：輕身、快乾\n· 毛巾款（棉）：吸收汗水\n\n對練時請佩戴在頭盔內。",
      "適合拳擊鞋和高筒鞋的加長扁平鞋帶。\n\n長220cm、闊8mm。比一般運動鞋帶更長，可充分綁至拳擊鞋鞋筒頂部。\n\n■ 規格\nJDKL B1 / 220cm × 8mm / 聚酯纖維扁平鞋帶",
      "適合靴、登山鞋和高筒鞋的圓形鞋帶。\n\n粗5mm、長200cm。圓形設計不易鬆脫。\n\n■ 規格\nJDKL A1 / 200cm × 5mm / 聚酯纖維圓形鞋帶",
      "頭盔替換用圓繩，亦可用於拳套。\n\n粗6mm、長200cm。比一般鞋帶更粗，適合頭盔扣件使用。\n\n■ 規格\nJDKL A2 / 200cm × 6mm / 聚酯纖維繩"
    ]
  },
  es: {
    high: "JIDOKAAN DRONE son botas de boxeo personalizadas de caña alta, aptas para competir y hechas a mano, par a par, en Seongsu, Seúl.",
    mid: "JIDOKAAN DRONE de caña media se fabrica a mano, par a par, en Seongsu, Seúl. Tiene una caña más baja que el modelo alto.",
    boots: "Elige los colores de cada panel y la talla en el simulador y confirma tu diseño.\n\n■ Para quién\nPara quienes quieren combinar sus propios colores o buscan mejorar la comodidad de sus botas de boxeo.\n\n■ Características\n· Colores personalizables por panel\n· Ajuste cómodo\n· Suela de goma natural con buen agarre\n· Fabricación artesanal y servicio de reparación en Corea (cambio de suela: KRW 65,000)\n\n■ Guía de tallas\nMujer: 225–245 / hombre: 240–300 (mm).\nPara mujer, suele funcionar la talla habitual. Los hombres suelen notar un ajuste algo más amplio que en sus zapatillas y se recomienda una talla menos. Si tienes el pie ancho, tu talla habitual puede resultar más adecuada.",
    accessories: [
      "Correas de cuero de plena flor que permiten cerrar con cordones los guantes de velcro.\n\nNueve colores; un juego de correas. Se despachan desde Seúl en unos 2–3 días.",
      "Viper de toalla, uno de los productos más vendidos de JIDOKAAN.\n\nAbsorbe el sudor y se lleva como una cinta para la cabeza en boxeo, gimnasio o running. Diseño registrado.\n\n■ Colores\nNegro / azul marino / blanco / rojo / azul\n\n■ Material y cuidado\nTejido de toalla de mezcla de algodón. Lavar y secar a la sombra.",
      "La bandana antideslizante Viper ayuda a reducir el giro del casco. Se lleva debajo del casco y tiene un acabado de silicona antideslizante.\n\n■ Versiones\n· Refrescante (nailon): ligera y de secado rápido\n· Toalla (algodón): absorbe el sudor\n\nLlévala bajo el casco durante el sparring.",
      "Cordones largos y planos para botas de boxeo y zapatillas de caña alta.\n\nLargo: 220cm; ancho: 8mm. Son más largos que los cordones habituales para poder atar la bota hasta la parte superior.\n\n■ Especificaciones\nJDKL B1 / 220cm × 8mm / poliéster plano",
      "Cordones redondos para botas, calzado de montaña y zapatillas altas.\n\nGrosor: 5mm; largo: 200cm. El formato redondo ayuda a que no se desaten fácilmente.\n\n■ Especificaciones\nJDKL A1 / 200cm × 5mm / poliéster redondo",
      "Cordón redondo de recambio para cascos, también apto para guantes.\n\nGrosor: 6mm; largo: 200cm. Es más grueso que un cordón de calzado normal y se adapta a las hebillas del casco.\n\n■ Especificaciones\nJDKL A2 / 200cm × 6mm / cordón de poliéster"
    ]
  },
  fr: {
    high: "JIDOKAAN DRONE est une chaussure de boxe personnalisée à tige haute, conçue pour la compétition et fabriquée à la main, paire par paire, à Seongsu, Séoul.",
    mid: "La JIDOKAAN DRONE à tige mi-haute est fabriquée à la main, paire par paire, à Seongsu, Séoul. Sa tige est plus basse que celle du modèle haut.",
    boots: "Choisissez les couleurs de chaque panneau et votre pointure dans le simulateur, puis validez votre modèle.\n\n■ Pour qui ?\nPour les boxeurs qui souhaitent créer leurs propres associations de couleurs ou améliorer le confort de leurs chaussures.\n\n■ Caractéristiques\n· Couleurs personnalisables panneau par panneau\n· Chaussant confortable\n· Semelle en gomme naturelle offrant une bonne adhérence\n· Fabrication artisanale et réparation possible en Corée (remplacement de la semelle : KRW 65,000)\n\n■ Guide des pointures\nFemme : 225–245 / homme : 240–300 (mm).\nLes femmes choisissent généralement leur pointure habituelle. Le chaussant homme étant souvent jugé un peu plus grand que celui des baskets courantes, nous conseillons une pointure en dessous. Pour les pieds larges, la pointure habituelle peut mieux convenir.",
    accessories: [
      "Sangles en cuir pleine fleur permettant de fermer des gants à scratch avec des lacets.\n\nNeuf couleurs ; un jeu de sangles. Expédition depuis Séoul sous environ 2 à 3 jours.",
      "Viper en éponge, l’un des best-sellers de JIDOKAAN.\n\nAbsorbe la transpiration et se porte comme un bandeau pour la boxe, la salle de sport ou la course. Modèle déposé.\n\n■ Couleurs\nNoir / bleu marine / blanc / rouge / bleu\n\n■ Matière et entretien\nÉponge de coton mélangé. Laver puis faire sécher à l’ombre.",
      "Le bandeau antidérapant Viper aide à limiter la rotation du casque. Il se porte sous le casque et possède un traitement antidérapant en silicone.\n\n■ Versions\n· Rafraîchissante (nylon) : légère et à séchage rapide\n· Éponge (coton) : absorbe la transpiration\n\nÀ porter sous le casque pendant le sparring.",
      "Longs lacets plats pour chaussures de boxe et chaussures montantes.\n\nLongueur : 220cm ; largeur : 8mm. Plus longs que des lacets de baskets classiques, ils permettent de lacer la chaussure jusqu’en haut de la tige.\n\n■ Caractéristiques\nJDKL B1 / 220cm × 8mm / polyester plat",
      "Lacets ronds pour bottes, chaussures de randonnée et chaussures montantes.\n\nÉpaisseur : 5mm ; longueur : 200cm. Leur forme ronde aide à éviter qu’ils ne se défassent facilement.\n\n■ Caractéristiques\nJDKL A1 / 200cm × 5mm / polyester rond",
      "Cordon rond de remplacement pour casque, également utilisable sur des gants.\n\nÉpaisseur : 6mm ; longueur : 200cm. Plus épais qu’un lacet classique, il convient aux boucles de casque.\n\n■ Caractéristiques\nJDKL A2 / 200cm × 6mm / corde en polyester"
    ]
  },
  de: {
    high: "JIDOKAAN DRONE sind individuell gestaltete, wettkampftaugliche Boxschuhe mit hohem Schaft. Jedes Paar wird in Seongsu, Seoul, von Hand gefertigt.",
    mid: "JIDOKAAN DRONE mit mittelhohem Schaft wird ebenfalls Paar für Paar in Seongsu, Seoul, von Hand gefertigt. Der Schaft ist niedriger als beim hohen Modell.",
    boots: "Wählen Sie im Konfigurator die Farben der einzelnen Bereiche und Ihre Grösse und bestätigen Sie Ihr Design.\n\n■ Für wen?\nFür Boxer, die ihre Farben selbst kombinieren möchten oder sich einen bequemeren Boxschuh wünschen.\n\n■ Eigenschaften\n· Farben für jeden Bereich individuell wählbar\n· Angenehmer Tragekomfort\n· Naturgummisohle mit guter Bodenhaftung\n· Handgefertigt und in Korea reparierbar (Austausch der Laufsohle: KRW 65,000)\n\n■ Grössenberatung\nDamen: 225–245 / Herren: 240–300 (mm).\nDamen wählen meist ihre übliche Grösse. Herren berichten häufig, dass der Schuh etwas grösser ausfällt als normale Sportschuhe; wir empfehlen deshalb meist eine Nummer kleiner. Bei breiten Füssen kann die übliche Grösse besser passen.",
    accessories: [
      "Adapterriemen aus vollnarbigem Leder, mit denen sich Klett-Boxhandschuhe über eine Schnürung schliessen lassen.\n\nNeun Farben; ein Riemenset. Versand aus Seoul innerhalb von etwa 2–3 Tagen.",
      "Das Viper Frottee-Kopftuch gehört zu den Bestsellern von JIDOKAAN.\n\nEs nimmt Schweiss auf und wird beim Boxen, Fitnesstraining oder Laufen wie ein Stirnband getragen. Eingetragenes Design.\n\n■ Farben\nSchwarz / Marineblau / Weiss / Rot / Blau\n\n■ Material und Pflege\nFrottee aus einer Baumwollmischung. Nach dem Waschen im Schatten trocknen.",
      "Das rutschfeste Viper Kopftuch hilft, das Verdrehen des Kopfschutzes zu verringern. Es wird darunter getragen und ist mit rutschhemmendem Silikon versehen.\n\n■ Varianten\n· Kühlend (Nylon): leicht und schnell trocknend\n· Frottee (Baumwolle): saugt Schweiss auf\n\nBeim Sparring unter dem Kopfschutz tragen.",
      "Lange, flache Schnürsenkel für Boxschuhe und Schuhe mit hohem Schaft.\n\nLänge: 220cm; Breite: 8mm. Sie sind länger als normale Sportschuhsenkel und reichen zum Schnüren bis zum oberen Schaftrand.\n\n■ Daten\nJDKL B1 / 220cm × 8mm / flache Polyester-Schnürsenkel",
      "Runde Schnürsenkel für Stiefel, Wanderschuhe und hohe Schuhe.\n\nStärke: 5mm; Länge: 200cm. Die runde Ausführung löst sich nicht so leicht.\n\n■ Daten\nJDKL A1 / 200cm × 5mm / runde Polyester-Schnürsenkel",
      "Runde Ersatzkordel für Kopfschutz, auch für Boxhandschuhe geeignet.\n\nStärke: 6mm; Länge: 200cm. Dicker als normale Schuhsenkel und passend für die Schnallen am Kopfschutz.\n\n■ Daten\nJDKL A2 / 200cm × 6mm / Polyesterkordel"
    ]
  },
  it: {
    high: "JIDOKAAN DRONE è una scarpa da boxe personalizzata a taglio alto, adatta alla competizione e realizzata a mano, un paio alla volta, a Seongsu, Seul.",
    mid: "JIDOKAAN DRONE a taglio medio è realizzata a mano, un paio alla volta, a Seongsu, Seul. Il gambale è più basso rispetto al modello alto.",
    boots: "Scegli il colore di ogni pannello e la taglia nel simulatore, poi conferma il design.\n\n■ Per chi è pensata\nPer chi vuole creare il proprio abbinamento di colori o cerca una calzata più confortevole rispetto alle normali scarpe da boxe.\n\n■ Caratteristiche\n· Colori personalizzabili per ogni pannello\n· Calzata confortevole\n· Suola in gomma naturale con una buona aderenza\n· Lavorazione artigianale e riparazioni disponibili in Corea (sostituzione della suola: KRW 65,000)\n\n■ Guida alle taglie\nDonna: 225–245 / uomo: 240–300 (mm).\nPer le donne, in genere va bene la taglia abituale. Gli uomini spesso trovano la calzata leggermente più ampia rispetto alle normali scarpe sportive: consigliamo quindi una taglia in meno. Per i piedi larghi può essere più adatta la taglia abituale.",
    accessories: [
      "Cinghie in pelle pieno fiore che permettono di chiudere con lacci i guantoni in velcro.\n\nNove colori; un set di cinghie. Spedizione da Seul in circa 2–3 giorni.",
      "Viper in spugna, uno dei prodotti più venduti di JIDOKAAN.\n\nAssorbe il sudore e si indossa come una fascia per boxe, palestra e corsa. Design registrato.\n\n■ Colori\nNero / blu navy / bianco / rosso / blu\n\n■ Materiale e cura\nSpugna di misto cotone. Lavare e lasciare asciugare all’ombra.",
      "La bandana antiscivolo Viper aiuta a ridurre la rotazione del casco. Si indossa sotto il casco ed è dotata di un trattamento antiscivolo in silicone.\n\n■ Versioni\n· Rinfrescante (nylon): leggera e ad asciugatura rapida\n· Spugna (cotone): assorbe il sudore\n\nIndossala sotto il casco durante lo sparring.",
      "Lacci lunghi e piatti per scarpe da boxe e scarpe alte.\n\nLunghezza: 220cm; larghezza: 8mm. Più lunghi dei normali lacci sportivi, permettono di allacciare la scarpa fino alla sommità del gambale.\n\n■ Specifiche\nJDKL B1 / 220cm × 8mm / poliestere piatto",
      "Lacci tondi per stivali, scarpe da trekking e scarpe alte.\n\nSpessore: 5mm; lunghezza: 200cm. Il formato tondo aiuta a evitare che si slaccino facilmente.\n\n■ Specifiche\nJDKL A1 / 200cm × 5mm / poliestere tondo",
      "Corda tonda di ricambio per casco, utilizzabile anche per i guantoni.\n\nSpessore: 6mm; lunghezza: 200cm. Più spessa di un normale laccio, è adatta alle fibbie del casco.\n\n■ Specifiche\nJDKL A2 / 200cm × 6mm / corda in poliestere"
    ]
  },
  pt: {
    high: "JIDOKAAN DRONE é uma bota de boxe personalizada de cano alto, adequada para competição e feita à mão, um par por vez, em Seongsu, Seul.",
    mid: "A JIDOKAAN DRONE de cano médio também é feita à mão, um par por vez, em Seongsu, Seul. Seu cano é mais baixo que o do modelo alto.",
    boots: "Escolha a cor de cada parte e o tamanho no simulador e confirme seu design.\n\n■ Para quem é\nPara quem quer criar suas próprias combinações de cores ou busca mais conforto do que encontra nas botas de boxe convencionais.\n\n■ Características\n· Cores personalizáveis em cada parte\n· Calce confortável\n· Solado de borracha natural com boa aderência\n· Fabricação artesanal e reparos disponíveis na Coreia (troca do solado: KRW 65,000)\n\n■ Guia de tamanhos\nFeminino: 225–245 / masculino: 240–300 (mm).\nPara mulheres, o tamanho habitual costuma servir bem. Os homens frequentemente relatam um calce um pouco maior que o dos tênis comuns; por isso, recomendamos um número menor. Para pés largos, o tamanho habitual pode ser mais adequado.",
    accessories: [
      "Tiras de couro de flor integral que permitem fechar luvas de velcro com cadarços.\n\nNove cores; um conjunto de tiras. Despacho de Seul em cerca de 2–3 dias.",
      "Viper atoalhada, um dos produtos mais vendidos da JIDOKAAN.\n\nAbsorve o suor e pode ser usada como faixa de cabeça para boxe, academia e corrida. Design registrado.\n\n■ Cores\nPreto / azul-marinho / branco / vermelho / azul\n\n■ Material e cuidados\nTecido atoalhado de mistura de algodão. Lave e seque à sombra.",
      "A bandana antiderrapante Viper ajuda a reduzir a rotação do capacete. É usada por baixo dele e conta com tratamento de silicone antiderrapante.\n\n■ Versões\n· Refrescante (nylon): leve e de secagem rápida\n· Atoalhada (algodão): absorve o suor\n\nUse sob o capacete durante o sparring.",
      "Cadarços longos e planos para botas de boxe e calçados de cano alto.\n\nComprimento: 220cm; largura: 8mm. Mais longos que os cadarços de tênis comuns, permitem amarrar a bota até o topo do cano.\n\n■ Especificações\nJDKL B1 / 220cm × 8mm / poliéster plano",
      "Cadarços redondos para botas, calçados de trilha e calçados de cano alto.\n\nEspessura: 5mm; comprimento: 200cm. O formato redondo ajuda a evitar que se desamarrem facilmente.\n\n■ Especificações\nJDKL A1 / 200cm × 5mm / poliéster redondo",
      "Corda redonda de reposição para capacetes, também utilizável em luvas.\n\nEspessura: 6mm; comprimento: 200cm. É mais grossa que um cadarço comum e se adapta às fivelas do capacete.\n\n■ Especificações\nJDKL A2 / 200cm × 6mm / corda de poliéster"
    ]
  },
  ru: {
    high: "JIDOKAAN DRONE — высокие боксёрки на заказ, подходящие для соревнований. Каждая пара вручную изготавливается в районе Сонсу в Сеуле.",
    mid: "JIDOKAAN DRONE средней высоты также изготавливаются вручную в районе Сонсу в Сеуле. Голенище ниже, чем у высокой модели.",
    boots: "Выберите цвета каждой детали и размер в конструкторе, затем подтвердите дизайн.\n\n■ Для кого\nДля тех, кто хочет самостоятельно сочетать цвета или ищет более удобную посадку, чем у обычных боксёрок.\n\n■ Особенности\n· Индивидуальный цвет каждой детали\n· Комфортная посадка\n· Подошва из натуральной резины с хорошим сцеплением\n· Ручная работа и возможность ремонта в Корее (замена подошвы: KRW 65,000)\n\n■ Подбор размера\nЖенские: 225–245 / мужские: 240–300 (мм).\nЖенщинам обычно подходит привычный размер. Мужчины часто отмечают, что боксёрки немного больше обычных кроссовок, поэтому мы рекомендуем брать на размер меньше. Для широкой стопы привычный размер может подойти лучше.",
    accessories: [
      "Ремни из натуральной кожи с сохранённым верхним слоем позволяют затянуть перчатки на липучках с помощью шнуровки.\n\nДевять цветов; один комплект ремней. Отправка из Сеула примерно через 2–3 дня.",
      "Махровая бандана Viper — один из бестселлеров JIDOKAAN.\n\nХорошо впитывает пот и носится как повязка на голову во время бокса, тренировок в зале и бега. Дизайн зарегистрирован.\n\n■ Цвета\nЧёрный / тёмно-синий / белый / красный / синий\n\n■ Материал и уход\nМахровая ткань с добавлением хлопка. После стирки сушить в тени.",
      "Нескользящая бандана Viper помогает уменьшить смещение шлема при вращении. Она надевается под шлем и имеет противоскользящее силиконовое покрытие.\n\n■ Варианты\n· Охлаждающий нейлон: лёгкий и быстро сохнет\n· Махровый хлопок: впитывает пот\n\nВо время спарринга надевайте бандану под шлем.",
      "Длинные плоские шнурки для боксёрок и высокой обуви.\n\nДлина: 220см; ширина: 8мм. Они длиннее обычных шнурков для кроссовок и позволяют зашнуровать боксёрки до верха голенища.\n\n■ Характеристики\nJDKL B1 / 220см × 8мм / плоский полиэстер",
      "Круглые шнурки для ботинок, походной и высокой обуви.\n\nТолщина: 5мм; длина: 200см. Круглая форма помогает предотвратить лёгкое развязывание.\n\n■ Характеристики\nJDKL A1 / 200см × 5мм / круглый полиэстер",
      "Круглый сменный шнур для шлема, который также подходит для перчаток.\n\nТолщина: 6мм; длина: 200см. Толще обычного обувного шнурка и подходит для пряжек шлема.\n\n■ Характеристики\nJDKL A2 / 200см × 6мм / полиэстеровый шнур"
    ]
  },
  tr: {
    high: "JIDOKAAN DRONE, müsabakalarda kullanıma uygun, yüksek bilekli özel tasarım boks ayakkabısıdır. Her çift Seul’ün Seongsu semtinde elde üretilir.",
    mid: "Orta bilekli JIDOKAAN DRONE da Seul’ün Seongsu semtinde çift çift elde üretilir. Bilek kısmı yüksek modelden daha kısadır.",
    boots: "Tasarım aracında her parçanın rengini ve numaranızı seçin, ardından tasarımınızı onaylayın.\n\n■ Kimler için?\nKendi renklerini bir araya getirmek isteyen veya standart boks ayakkabılarından daha rahat bir kalıp arayanlar için.\n\n■ Özellikler\n· Her parça için ayrı renk seçimi\n· Rahat kullanım\n· İyi tutuş sağlayan doğal kauçuk dış taban\n· El yapımı üretim ve Kore’de onarım imkânı (dış taban değişimi: KRW 65,000)\n\n■ Numara rehberi\nKadın: 225–245 / erkek: 240–300 (mm).\nKadınlar için genellikle normal numara uygundur. Erkekler kalıbın normal spor ayakkabılara göre biraz büyük olduğunu belirttiğinden, çoğunlukla bir numara küçük önerilir. Ayağınız genişse normal numaranız daha uygun olabilir.",
    accessories: [
      "Cırt cırtlı eldivenleri bağcıkla kapatmaya imkân veren, sırçalı hakiki deriden dönüştürücü kayışlar.\n\nDokuz renk; bir kayış seti. Yaklaşık 2–3 gün içinde Seul’den kargoya verilir.",
      "JIDOKAAN’ın en çok satan ürünlerinden havlu tipi Viper bandana.\n\nTeri emer; boks, spor salonu ve koşuda saç bandı gibi kullanılır. Tescilli tasarıma sahiptir.\n\n■ Renkler\nSiyah / lacivert / beyaz / kırmızı / mavi\n\n■ Malzeme ve bakım\nPamuk karışımlı havlu kumaş. Yıkadıktan sonra gölgede kurutun.",
      "Kaymaz Viper bandana, başlığın dönmesini azaltmaya yardımcı olur. Başlığın içine takılır ve kaymayı önleyen silikon kaplamaya sahiptir.\n\n■ Seçenekler\n· Serinletici tip (naylon): hafif ve hızlı kuruyan\n· Havlu tipi (pamuk): ter emici\n\nSparring sırasında başlığın altında kullanın.",
      "Boks ayakkabıları ve yüksek bilekli ayakkabılar için uzun, düz bağcıklar.\n\nUzunluk: 220cm; genişlik: 8mm. Normal spor ayakkabı bağcıklarından daha uzundur; ayakkabının üst kısmına kadar bağlamaya yeter.\n\n■ Teknik bilgiler\nJDKL B1 / 220cm × 8mm / düz polyester",
      "Botlar, yürüyüş ayakkabıları ve yüksek bilekli ayakkabılar için yuvarlak bağcıklar.\n\nKalınlık: 5mm; uzunluk: 200cm. Yuvarlak yapısı kolay çözülmeyi azaltır.\n\n■ Teknik bilgiler\nJDKL A1 / 200cm × 5mm / yuvarlak polyester",
      "Başlıklar için yuvarlak yedek ip; eldivenlerde de kullanılabilir.\n\nKalınlık: 6mm; uzunluk: 200cm. Normal ayakkabı bağcığından daha kalındır ve başlık tokalarına uygundur.\n\n■ Teknik bilgiler\nJDKL A2 / 200cm × 6mm / polyester ip"
    ]
  },
  uz: {
    high: "JIDOKAAN DRONE — musobaqalar uchun mos, baland qo‘njli, buyurtma asosida tayyorlanadigan boks oyoq kiyimi. Har bir juft Seulning Seongsu hududida qo‘lda yasaladi.",
    mid: "O‘rta qo‘njli JIDOKAAN DRONE ham Seulning Seongsu hududida har bir jufti alohida qo‘lda yasaladi. Uning qo‘nji baland modelnikidan pastroq.",
    boots: "Konstruktorda har bir qism rangini va o‘lchamingizni tanlang, so‘ng dizaynni tasdiqlang.\n\n■ Kimlar uchun?\nRanglarni o‘zi uyg‘unlashtirishni istagan yoki odatiy boks oyoq kiyimidan qulayroq variant qidirayotganlar uchun.\n\n■ Xususiyatlar\n· Har bir qism rangini alohida tanlash\n· Qulay kiyilish\n· Yerni yaxshi tutadigan tabiiy rezina taglik\n· Qo‘l mehnati; Koreyada ta’mirlash mumkin (taglikni almashtirish: KRW 65,000)\n\n■ O‘lcham bo‘yicha tavsiya\nAyollar: 225–245 / erkaklar: 240–300 (mm).\nAyollarga odatda odatiy o‘lchami mos keladi. Erkaklar bu modelni oddiy sport oyoq kiyimidan biroz kattaroq deb baholashadi, shuning uchun odatda bir o‘lcham kichikrog‘i tavsiya etiladi. Oyoq panjasi keng bo‘lsa, odatiy o‘lcham qulayroq bo‘lishi mumkin.",
    accessories: [
      "Yuqori qatlami saqlangan tabiiy charmdan tayyorlangan moslashtiruvchi tasmalar velkroli qo‘lqopni bog‘ich bilan mahkamlash imkonini beradi.\n\nTo‘qqiz rang; bitta tasma to‘plami. Seuldan taxminan 2–3 kun ichida jo‘natiladi.",
      "Sochiq matoli Viper bandana — JIDOKAAN’ning eng ko‘p sotiladigan mahsulotlaridan biri.\n\nTerni yaxshi shimadi. Boks, sport zalidagi mashqlar va yugurishda boshbog‘ kabi taqiladi. Dizayni ro‘yxatdan o‘tkazilgan.\n\n■ Ranglar\nQora / to‘q ko‘k / oq / qizil / ko‘k\n\n■ Material va parvarish\nPaxta aralash sochiq matosi. Yuvgandan keyin soyada quriting.",
      "Sirpanmaydigan Viper bandana shlemning aylanib ketishini kamaytirishga yordam beradi. U shlem ostidan taqiladi va sirpanishga qarshi silikon qoplamaga ega.\n\n■ Turlari\n· Salqin tutuvchi tur (neylon): yengil va tez quriydi\n· Sochiq matoli tur (paxta): terni shimadi\n\nSparring vaqtida shlem ostidan taqing.",
      "Boks oyoq kiyimi va baland qo‘njli poyabzal uchun uzun yassi bog‘ichlar.\n\nUzunligi: 220cm; eni: 8mm. Oddiy sport oyoq kiyimi bog‘ichidan uzunroq bo‘lib, qo‘njning tepasigacha bog‘lashga yetadi.\n\n■ Tavsif\nJDKL B1 / 220cm × 8mm / yassi poliester",
      "Etiklar, sayr poyabzali va baland qo‘njli oyoq kiyimi uchun dumaloq bog‘ichlar.\n\nQalinligi: 5mm; uzunligi: 200cm. Dumaloq turi oson yechilib ketmaydi.\n\n■ Tavsif\nJDKL A1 / 200cm × 5mm / dumaloq poliester",
      "Shlem uchun almashtirma dumaloq arqoncha; qo‘lqoplarda ham ishlatish mumkin.\n\nQalinligi: 6mm; uzunligi: 200cm. Oddiy oyoq kiyim bog‘ichidan qalinroq va shlem to‘qalariga mos.\n\n■ Tavsif\nJDKL A2 / 200cm × 6mm / poliester arqoncha"
    ]
  },
  th: {
    high: "JIDOKAAN DRONE คือรองเท้ามวยข้อสูงแบบสั่งทำที่เหมาะสำหรับการแข่งขัน ผลิตด้วยมือทีละคู่ในย่านซองซู กรุงโซล",
    mid: "JIDOKAAN DRONE รุ่นข้อกลางผลิตด้วยมือทีละคู่ในย่านซองซู กรุงโซลเช่นกัน โดยมีความสูงของข้อรองเท้าต่ำกว่ารุ่นข้อสูง",
    boots: "เลือกสีของแต่ละส่วนและขนาดในเครื่องมือออกแบบ แล้วกดยืนยันดีไซน์\n\n■ เหมาะกับใคร\nผู้ที่ต้องการจับคู่สีด้วยตัวเอง หรือกำลังมองหารองเท้ามวยที่ใส่สบายกว่าคู่เดิม\n\n■ จุดเด่น\n· เลือกสีแยกตามส่วนได้\n· สวมใส่สบาย\n· พื้นยางธรรมชาติยึดเกาะได้ดี\n· ผลิตด้วยมือและรับซ่อมในเกาหลี (เปลี่ยนพื้นรองเท้า: KRW 65,000)\n\n■ แนะนำขนาด\nผู้หญิง 225–245 / ผู้ชาย 240–300 (มม.)\nผู้หญิงมักเลือกขนาดที่ใส่ตามปกติ ผู้ชายหลายคนรู้สึกว่ารุ่นนี้ใหญ่กว่ารองเท้ากีฬาทั่วไปเล็กน้อย จึงมักแนะนำให้ลดลงหนึ่งไซซ์ หากหน้าเท้ากว้าง ขนาดปกติอาจพอดีกว่า",
    accessories: [
      "สายแปลงที่ทำจากหนังแท้ฟูลเกรน ช่วยให้ใช้นวมแบบตีนตุ๊กแกด้วยการผูกเชือกได้\n\nมี 9 สี สินค้าเป็นสาย 1 ชุด จัดส่งออกจากกรุงโซลภายในประมาณ 2–3 วัน",
      "ผ้าคาดศีรษะ Viper แบบผ้าขนหนู หนึ่งในสินค้าขายดีของ JIDOKAAN\n\nดูดซับเหงื่อได้ดี ใช้คาดศีรษะสำหรับชกมวย ออกกำลังกายในยิม และวิ่ง เป็นสินค้าที่จดทะเบียนการออกแบบแล้ว\n\n■ สี\nดำ / กรมท่า / ขาว / แดง / น้ำเงิน\n\n■ วัสดุและการดูแล\nผ้าขนหนูผสมฝ้าย ซักแล้วตากในที่ร่ม",
      "ผ้าคาดศีรษะ Viper กันลื่นช่วยลดการหมุนของเฮดการ์ด สวมด้านในเฮดการ์ดและเคลือบซิลิโคนกันลื่น\n\n■ ประเภท\n· แบบเย็น (ไนลอน): น้ำหนักเบาและแห้งเร็ว\n· แบบผ้าขนหนู (ฝ้าย): ดูดซับเหงื่อ\n\nสวมใต้เฮดการ์ดขณะซ้อมคู่",
      "เชือกรองเท้าแบบแบนยาวสำหรับรองเท้ามวยและรองเท้าหุ้มข้อ\n\nยาว 220cm กว้าง 8mm ยาวกว่าเชือกรองเท้ากีฬาทั่วไป จึงผูกได้ถึงส่วนบนของข้อรองเท้ามวย\n\n■ ข้อมูลสินค้า\nJDKL B1 / 220cm × 8mm / โพลีเอสเตอร์แบบแบน",
      "เชือกรองเท้าแบบกลมสำหรับรองเท้าบู๊ต รองเท้าเดินป่า และรองเท้าหุ้มข้อ\n\nหนา 5mm ยาว 200cm รูปทรงกลมช่วยให้เชือกไม่คลายง่าย\n\n■ ข้อมูลสินค้า\nJDKL A1 / 200cm × 5mm / โพลีเอสเตอร์แบบกลม",
      "เชือกกลมสำหรับเปลี่ยนเชือกเฮดการ์ด ใช้กับนวมได้เช่นกัน\n\nหนา 6mm ยาว 200cm หนากว่าเชือกรองเท้าทั่วไป เหมาะกับหัวล็อกของเฮดการ์ด\n\n■ ข้อมูลสินค้า\nJDKL A2 / 200cm × 6mm / เชือกโพลีเอสเตอร์"
    ]
  },
  hi: {
    high: "JIDOKAAN DRONE ऊँचे कट वाले कस्टम बॉक्सिंग जूते हैं, जो मुकाबलों में पहनने के लिए उपयुक्त हैं। हर जोड़ी सियोल के सोंगसु इलाके में हाथ से बनाई जाती है।",
    mid: "JIDOKAAN DRONE के मध्यम कट वाले जूते भी सियोल के सोंगसु में एक-एक जोड़ी हाथ से बनाए जाते हैं। इनका ऊपरी हिस्सा हाई-कट मॉडल से कम ऊँचा है।",
    boots: "डिज़ाइन टूल में हर हिस्से का रंग और अपना साइज़ चुनें, फिर डिज़ाइन की पुष्टि करें।\n\n■ किनके लिए\nउन बॉक्सरों के लिए जो अपने रंग खुद मिलाना चाहते हैं या मौजूदा बॉक्सिंग जूतों से अधिक आरामदायक फिट चाहते हैं।\n\n■ खूबियाँ\n· हर हिस्से का रंग अलग चुनें\n· पहनने में आरामदायक\n· अच्छी पकड़ वाला प्राकृतिक रबर का बाहरी सोल\n· हाथ से बने; कोरिया में मरम्मत उपलब्ध (बाहरी सोल बदलना: KRW 65,000)\n\n■ साइज़ गाइड\nमहिला: 225–245 / पुरुष: 240–300 (मिमी)।\nमहिलाओं को आम तौर पर उनका सामान्य साइज़ सही बैठता है। पुरुष अक्सर इनका फिट सामान्य स्पोर्ट्स शूज़ से थोड़ा बड़ा बताते हैं, इसलिए आम तौर पर एक साइज़ छोटा लेने की सलाह है। चौड़े पैरों के लिए सामान्य साइज़ बेहतर हो सकता है।",
    accessories: [
      "फुल-ग्रेन असली चमड़े की कन्वर्टर पट्टियाँ, जिनसे वेल्क्रो ग्लव्स को फीते से बाँधा जा सकता है।\n\nनौ रंग; पट्टियों का एक सेट। लगभग 2–3 दिनों में सियोल से भेजा जाता है।",
      "तौलिया कपड़े वाला Viper हेडबैंड, JIDOKAAN के सबसे अधिक बिकने वाले उत्पादों में से एक।\n\nयह पसीना अच्छी तरह सोखता है और बॉक्सिंग, जिम तथा दौड़ने के लिए हेडबैंड की तरह पहना जाता है। इसका डिज़ाइन पंजीकृत है।\n\n■ रंग\nकाला / नेवी ब्लू / सफेद / लाल / नीला\n\n■ सामग्री और देखभाल\nकॉटन-मिश्रित तौलिया कपड़ा। धोने के बाद छाँव में सुखाएँ।",
      "Viper फिसलन-रोधी हेडबैंड हेडगियर का घूमना कम करने में मदद करता है। इसे हेडगियर के नीचे पहना जाता है और इस पर फिसलन रोकने वाली सिलिकॉन परत होती है।\n\n■ प्रकार\n· ठंडक देने वाला (नायलॉन): हल्का और जल्दी सूखने वाला\n· तौलिया (कॉटन): पसीना सोखने वाला\n\nस्पैरिंग के दौरान इसे हेडगियर के नीचे पहनें।",
      "बॉक्सिंग बूट और ऊँचे जूतों के लिए लंबे, फ्लैट फीते।\n\nलंबाई 220cm और चौड़ाई 8mm। सामान्य स्पोर्ट्स शूज़ के फीतों से लंबे होने के कारण ये बॉक्सिंग बूट के ऊपरी सिरे तक बाँधे जा सकते हैं।\n\n■ विवरण\nJDKL B1 / 220cm × 8mm / फ्लैट पॉलिएस्टर",
      "बूट, हाइकिंग और ऊँचे जूतों के लिए गोल फीते।\n\nमोटाई 5mm और लंबाई 200cm। गोल बनावट के कारण ये आसानी से नहीं खुलते।\n\n■ विवरण\nJDKL A1 / 200cm × 5mm / गोल पॉलिएस्टर",
      "हेडगियर की पुरानी डोरी बदलने के लिए गोल रस्सी, जिसे ग्लव्स में भी इस्तेमाल किया जा सकता है।\n\nमोटाई 6mm और लंबाई 200cm। यह सामान्य जूते के फीते से मोटी है और हेडगियर के बकल के लिए उपयुक्त है।\n\n■ विवरण\nJDKL A2 / 200cm × 6mm / पॉलिएस्टर रस्सी"
    ]
  },
  tl: {
    high: "Ang JIDOKAAN DRONE ay custom na high-cut boxing shoes na angkop sa laban. Bawat pares ay ginagawa nang mano-mano sa Seongsu, Seoul.",
    mid: "Ang mid-cut na JIDOKAAN DRONE ay ginagawa rin nang mano-mano, bawat pares, sa Seongsu, Seoul. Mas mababa ang taas nito kaysa sa high-cut na modelo.",
    boots: "Piliin ang kulay ng bawat bahagi at ang sukat sa design tool, saka kumpirmahin ang disenyo.\n\n■ Para kanino\nPara sa gustong bumuo ng sariling kombinasyon ng kulay o naghahanap ng mas komportableng boxing shoes kaysa sa karaniwang modelo.\n\n■ Mga katangian\n· Puwedeng pumili ng kulay sa bawat bahagi\n· Komportableng suot\n· Natural na gomang outsole na may magandang kapit\n· Gawang-kamay at puwedeng ipaayos sa Korea (pagpapalit ng outsole: KRW 65,000)\n\n■ Gabay sa sukat\nPambabae: 225–245 / panlalaki: 240–300 (mm).\nKaraniwang kasya sa kababaihan ang normal nilang sukat. Madalas sabihin ng mga lalaki na bahagyang mas maluwag ito kaysa sa karaniwang rubber shoes, kaya madalas irekomenda ang isang sukat na mas maliit. Kung malapad ang paa, maaaring mas angkop ang normal na sukat.",
    accessories: [
      "Converter straps na gawa sa full-grain na tunay na balat para maisara gamit ang sintas ang velcro gloves.\n\nSiyam na kulay; isang set ng straps. Ipinapadala mula sa Seoul sa loob ng humigit-kumulang 2–3 araw.",
      "Tuwalyang Viper headband, isa sa pinakamabentang produkto ng JIDOKAAN.\n\nMahusay itong sumipsip ng pawis at isinusuot na parang headband para sa boxing, gym at pagtakbo. Rehistrado ang disenyo nito.\n\n■ Mga kulay\nItim / navy blue / puti / pula / asul\n\n■ Materyal at pag-aalaga\nTuwalyang telang may halong cotton. Labhan at patuyuin sa lilim.",
      "Ang hindi madulas na Viper headband ay tumutulong na mabawasan ang pag-ikot ng headgear. Isinusuot ito sa ilalim ng headgear at may silicone na panlaban sa pagdulas.\n\n■ Mga uri\n· Cooling nylon: magaan at mabilis matuyo\n· Tuwalyang cotton: sumisipsip ng pawis\n\nIsuot sa ilalim ng headgear habang nag-i-sparring.",
      "Mahaba at flat na sintas para sa boxing boots at high-top shoes.\n\nHaba: 220cm; lapad: 8mm. Mas mahaba kaysa sa karaniwang sintas ng rubber shoes para maitali hanggang sa itaas ng boxing boots.\n\n■ Detalye\nJDKL B1 / 220cm × 8mm / flat na polyester",
      "Bilog na sintas para sa boots, hiking shoes at high-top shoes.\n\nKapal: 5mm; haba: 200cm. Hindi madaling makalas ang bilog na uri.\n\n■ Detalye\nJDKL A1 / 200cm × 5mm / bilog na polyester",
      "Bilog na pamalit na tali para sa headgear, na puwede ring gamitin sa gloves.\n\nKapal: 6mm; haba: 200cm. Mas makapal kaysa sa karaniwang sintas at angkop sa mga buckle ng headgear.\n\n■ Detalye\nJDKL A2 / 200cm × 6mm / polyester na tali"
    ]
  }
};

const accessoryIds = ["glove-strap", "viper-band", "viper-band-ns", "lace-b1", "lace-a1", "lace-a2"] as const;
export const productDetailTranslations: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(rows).map(([locale, row]) => [locale, {
    "drone-custom": `${row.high}\n\n${row.boots}`,
    "drone-mid": `${row.mid}\n\n${row.boots}`,
    ...Object.fromEntries(accessoryIds.map((id, index) => [id, row.accessories[index]])),
  }]),
);
