import faqCopy from './faq-copy.js';
import specialCopy from './special-copy.js';
export function createHomeLocale(root, onLocaleChange) {
  const strings = {};
  // Korean source content also provides a complete no-JavaScript fallback.
  strings.ko = {};
  root.querySelectorAll('[data-i18n]').forEach(el => strings.ko[el.dataset.i18n] = el.innerHTML);
  for (const attr of ['aria-label', 'alt']) {
    root.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => strings.ko[el.getAttribute(`data-i18n-${attr}`)] = el.getAttribute(attr));
  }
  Object.assign(strings.ko, {menuOpen:'메뉴 열기', menuClose:'메뉴 닫기', title:'지도칸 — 당신의 방식으로 완성하는 복싱화', description:'색상부터 소재까지, 당신의 방식으로 완성하는 지도칸 수제 커스텀 복싱화.'});
  strings.en = {
    skip:'Skip to shoe designs',home:'JIDOKAAN home',mainMenu:'Main navigation',mobileMenu:'Mobile navigation',language:'Select language',menuOpen:'Open menu',menuClose:'Close menu',
    navDetail:'Details',navCollection:'Collection',navAtelier:'The process',navOrder:'Your boxing shoes',
    heroKicker:'Handcrafted custom boxing shoes',heroTitle1:'Your fight.',heroTitle2:'Your signature.',heroDescription:'Your taste, in every colour and material.<br>Your pair begins with JIDOKAAN.',heroLink:'Explore the collection',heroBrand:'JIDOKAAN · Made to order',scroll:'Scroll to discover',statement:'Countless combinations.<br><span>One pair, uniquely yours.</span>',
    detailIndex:'01 / Materials & details',detailTitle:'Small details.<br><em>Your identity.</em>',detailDescription:'Leather, mesh and distinctive accents.<br>Each choice brings your design into focus.',leather:'Leather',leatherDetail:'Colour & texture',mesh:'Mesh',meshDetail:'The foundation',accent:'Accents',accentDetail:'The finishing touch',
    focusIndex:'01 / A closer look',focusTitle:'Refined design.<br><em>Exceptional comfort.</em>',focusDescription:'Over 50 last tests across two years.<br>Refined to achieve an optimal fit.',handmade:'JIDOKAAN handcrafted boxing shoes',
    collectionIndex:'02 / Design collection',examplesTitle:'Custom-order examples',collectionTitle:'One silhouette.<br><em>Your own expression.</em>',collectionDescription:'From understated white to bold colours and patterns.<br>Find a combination that speaks to you.',
    look0:'White · Gold',look1:'Navy · White',look2:'Red · Black',look3:'Green · Red',look4:'Floral · Black',enlarge:'View larger ↗',exampleLabel:'Custom-order example',galleryDirection:'Scroll to explore the combinations',
    identityCaption:'The shape of JIDOKAAN’s identity',atelierIndex:'03 / Made to order',atelierTitle:'Your choices.<br><em>Your pair.</em>',process1:'Choose your colours',process1Description:'Explore colour combinations for each part in the custom design simulator.',process2:'Refine your design',process2Description:'Review your combination and adjust the design. For patterns and special materials, see the special-order information.',process3:'Make it yours',process3Description:'Once you have chosen your design, follow the order instructions. Production details are provided during ordering.',
    orderIndex:'04 / Create your boxing shoes',orderTitle:'Bring your style<br><em>into the ring.</em>',orderButton:'Start a custom order',specialButton:'Special orders',orderNote:'Tell us what makes it yours.',backTop:'Back to top',
    companyTitle:'Company information',companyNameLabel:'Company',companyName:'JIDOKAAN',ownerLabel:'Representative',owner:'Choi Taehoon',addressLabel:'Address',address:'2F, main building, 36 Seongsui-ro 18-gil, Seongdong-gu, Seoul 04782, Republic of Korea',phoneLabel:'Phone',businessLabel:'Business registration no.',commerceLabel:'Online sales registration',commerce:'2018-Seoul Seongdong-0927',contactTitle:'Contact',emailLabel:'Email',contactPhoneLabel:'Phone',hoursLabel:'Customer service',hours:'Mon–Fri, 10:00–17:00 (KST)',closedLabel:'Saturdays & public holidays',closed:'Closed',brandDescription:'JIDOKAAN · Handcrafted custom boxing shoes',
    closeImage:'Close <span>×</span>',close:'Close ×',dialogIndex:'JIDOKAAN design collection',exampleProduct:'An example of a custom-order design.',createCombination:'Create your combination <span>↗</span>',specialIndex:'Special orders',specialTitle:'Express yourself in materials.',specialDescription:'Custom designs using patterns and special materials.<br>The special-order simulator is in preparation.',specialContact:'Customer service: 010-3481-5598 ↗',
    introLabel:'JIDOKAAN custom boxing shoes',heroAlt:'White, black and gold JIDOKAAN boxing shoe',detailAlt:'Leather, mesh and stitching of the white and gold boxing shoe',galleryLabel:'Five custom-order shoe examples',previous:'Previous design',next:'Next design',emblemAlt:'JIDOKAAN metal emblem',closeImageLabel:'Close enlarged image',closeLabel:'Close information',title:'JIDOKAAN — Boxing shoes, your way',description:'Handcrafted custom boxing shoes by JIDOKAAN. Express your style through colours and materials.'
  };
  strings.ja = {
    skip:'デザインを見る',home:'JIDOKAAN ホーム',mainMenu:'メインメニュー',mobileMenu:'モバイルメニュー',language:'言語を選択',menuOpen:'メニューを開く',menuClose:'メニューを閉じる',navDetail:'ディテール',navCollection:'コレクション',navAtelier:'製作の流れ',navOrder:'自分だけの一足',
    heroKicker:'ハンドメイドのカスタムボクシングシューズ',heroTitle1:'あなたのボクシングを、',heroTitle2:'あなたらしく。',heroDescription:'色と素材に、自分らしさを。<br>一足のはじまりから、JIDOKAAN。',heroLink:'コレクションを見る',heroBrand:'JIDOKAAN · カスタム製作',scroll:'スクロールして詳しく見る',statement:'数えきれない組み合わせから、<br><span>あなただけの一足を。</span>',
    detailIndex:'01 / 素材とディテール',detailTitle:'小さな違いで、<br><em>あなたらしさを。</em>',detailDescription:'レザーの色、メッシュの質感、アクセント。<br>選ぶたびに、あなたのデザインが鮮明になる。',leather:'レザー',leatherDetail:'色と質感',mesh:'メッシュ',meshDetail:'組み合わせのベース',accent:'アクセント',accentDetail:'デザインの仕上げ',focusIndex:'01 / もっと近くで',focusTitle:'繊細なデザインに、<br><em>快適な履き心地を。</em>',focusDescription:'2年間、50回を超えるラストテストを経て<br>生み出した最適なフィット感。',handmade:'JIDOKAAN ハンドメイドボクシングシューズ',
    collectionIndex:'02 / デザインコレクション',examplesTitle:'カスタムオーダーの製作例',collectionTitle:'同じシルエット。<br><em>あなただけの表現。</em>',collectionDescription:'上品なホワイトから、鮮やかな色や柄まで。<br>好みに合う組み合わせを見つけてください。',look0:'ホワイト · ゴールド',look1:'ネイビー · ホワイト',look2:'レッド · ブラック',look3:'グリーン · レッド',look4:'フラワー · ブラック',enlarge:'拡大する ↗',exampleLabel:'カスタムオーダー製作例',galleryDirection:'スクロールして組み合わせを見る',
    identityCaption:'形に込めた、JIDOKAANのアイデンティティ',atelierIndex:'03 / カスタム製作',atelierTitle:'あなたの選択を、<br><em>一足に。</em>',process1:'カラーを選ぶ',process1Description:'カスタムシミュレーターで、パーツごとの色の組み合わせを確認します。',process2:'デザインを確かめる',process2Description:'選んだ組み合わせを確認し、好みのデザインに調整します。柄や特殊素材については、スペシャルオーダーの案内をご覧ください。',process3:'自分だけの一足へ',process3Description:'デザインを選んだ後、ご注文の案内に沿ってお進みください。製作条件はご注文の過程でご確認いただけます。',
    orderIndex:'04 / 自分だけのシューズを作る',orderTitle:'さあ、リングに<br><em>あなたらしさを。</em>',orderButton:'カスタムオーダーを始める',specialButton:'スペシャルオーダー',orderNote:'あなたの好みをお聞かせください。',backTop:'トップへ',companyTitle:'会社情報',companyNameLabel:'会社名',companyName:'JIDOKAAN',ownerLabel:'代表者',owner:'チェ・テフン',addressLabel:'所在地',address:'〒04782 韓国ソウル特別市城東区聖水二路18ギル36 主棟2階',phoneLabel:'代表電話',businessLabel:'事業者登録番号',commerceLabel:'通信販売業届出番号',commerce:'2018ソウル城東0927号',contactTitle:'お問い合わせ',emailLabel:'メール',contactPhoneLabel:'電話',hoursLabel:'受付時間',hours:'月〜金 10:00〜17:00（韓国時間）',closedLabel:'土曜日・祝日',closed:'受付休止',brandDescription:'JIDOKAAN · ハンドメイドのカスタムボクシングシューズ',
    closeImage:'閉じる <span>×</span>',close:'閉じる ×',dialogIndex:'JIDOKAAN デザインコレクション',exampleProduct:'カスタムオーダーの製作例です。',createCombination:'自分の組み合わせを作る <span>↗</span>',specialIndex:'スペシャルオーダー',specialTitle:'素材で表現する、自分らしさ。',specialDescription:'柄や特殊素材を用いる製作方法です。<br>スペシャルオーダー用シミュレーターは準備中です。',specialContact:'カスタマーセンター 010-3481-5598 ↗',introLabel:'JIDOKAAN カスタムボクシングシューズ',heroAlt:'ホワイト、ブラック、ゴールドのJIDOKAANボクシングシューズ',detailAlt:'ホワイトとゴールドのシューズのレザー、メッシュ、ステッチ',galleryLabel:'5種類のカスタムオーダー製作例',previous:'前のデザイン',next:'次のデザイン',emblemAlt:'JIDOKAANのメタルエンブレム',closeImageLabel:'拡大画像を閉じる',closeLabel:'案内を閉じる',title:'JIDOKAAN — あなたらしいボクシングシューズ',description:'色と素材で個性を表現する、JIDOKAANのハンドメイド・カスタムボクシングシューズ。'
  };
  strings.zh = {
    skip:'跳转至鞋款设计',home:'JIDOKAAN 首页',mainMenu:'主导航',mobileMenu:'移动端导航',language:'选择语言',menuOpen:'打开菜单',menuClose:'关闭菜单',navDetail:'细节',navCollection:'设计系列',navAtelier:'定制流程',navOrder:'我的拳击鞋',
    heroKicker:'手工定制拳击鞋',heroTitle1:'你的拳击，',heroTitle2:'你的风格。',heroDescription:'将个性融入色彩与材质。<br>专属鞋款，从 JIDOKAAN 开始。',heroLink:'探索设计系列',heroBrand:'JIDOKAAN · 专属定制',scroll:'向下滚动，探索更多',statement:'万千组合之中，<br><span>只属于你的那一双。</span>',
    detailIndex:'01 / 材质与细节',detailTitle:'细微之处，<br><em>彰显自我。</em>',detailDescription:'皮革色彩、网布纹理与点缀的组合。<br>每一次选择，都让你的设计更鲜明。',leather:'皮革',leatherDetail:'色彩与质感',mesh:'网布',meshDetail:'组合的基底',accent:'点缀',accentDetail:'设计的收尾',focusIndex:'01 / 近距离欣赏',focusTitle:'精致设计，<br><em>更添舒适脚感。</em>',focusDescription:'历经两年、超过50次鞋楦测试，<br>打造理想的贴合与舒适。',handmade:'JIDOKAAN 手工拳击鞋',
    collectionIndex:'02 / 设计系列',examplesTitle:'定制订单示例鞋款',collectionTitle:'相同轮廓，<br><em>不同的你。</em>',collectionDescription:'从简约白色到鲜明色彩与图案，<br>寻找契合你品味的组合。',look0:'白色 · 金色',look1:'海军蓝 · 白色',look2:'红色 · 黑色',look3:'绿色 · 红色',look4:'花卉 · 黑色',enlarge:'放大查看 ↗',exampleLabel:'定制订单示例鞋款',galleryDirection:'滚动浏览不同组合',identityCaption:'以形态诠释 JIDOKAAN 的品牌个性',
    atelierIndex:'03 / 专属定制',atelierTitle:'你的选择，<br><em>成就你的一双。</em>',process1:'选择颜色',process1Description:'在定制模拟器中，查看各部位的配色组合。',process2:'确认设计',process2Description:'查看所选组合并调整为理想设计。图案及特殊材质请参阅特别定制说明。',process3:'打造专属鞋款',process3Description:'选定设计后，请按照订单说明继续操作。具体制作条件可在下单过程中确认。',
    orderIndex:'04 / 设计我的拳击鞋',orderTitle:'将你的风格，<br><em>带上拳台。</em>',orderButton:'开始定制',specialButton:'特别定制说明',orderNote:'告诉我们你的喜好。',backTop:'返回顶部',companyTitle:'公司信息',companyNameLabel:'公司名称',companyName:'JIDOKAAN',ownerLabel:'代表人',owner:'Choi Taehoon',addressLabel:'营业地址',address:'韩国首尔特别市城东区圣水二路18街36号主楼2层，邮编04782',phoneLabel:'联系电话',businessLabel:'营业执照登记号',commerceLabel:'网络销售备案号',commerce:'2018首尔城东0927号',contactTitle:'咨询',emailLabel:'咨询邮箱',contactPhoneLabel:'咨询电话',hoursLabel:'客服时间',hours:'周一至周五 10:00–17:00（韩国时间）',closedLabel:'周六及公共假日',closed:'暂停咨询',brandDescription:'JIDOKAAN · 手工定制拳击鞋',
    closeImage:'关闭 <span>×</span>',close:'关闭 ×',dialogIndex:'JIDOKAAN 设计系列',exampleProduct:'此鞋款为定制订单示例。',createCombination:'创建我的组合 <span>↗</span>',specialIndex:'特别定制',specialTitle:'以材质表达品味。',specialDescription:'采用图案及特殊材质的定制方式。<br>特别定制模拟器正在筹备中。',specialContact:'客服电话 010-3481-5598 ↗',introLabel:'JIDOKAAN 定制拳击鞋介绍',heroAlt:'白色、黑色和金色搭配的 JIDOKAAN 拳击鞋',detailAlt:'白金配色拳击鞋的皮革、网布与缝线',galleryLabel:'五款定制订单示例鞋款',previous:'上一款设计',next:'下一款设计',emblemAlt:'JIDOKAAN 金属徽标',closeImageLabel:'关闭放大图片',closeLabel:'关闭说明',title:'JIDOKAAN — 专属于你的拳击鞋',description:'从色彩到材质，随心打造 JIDOKAAN 手工定制拳击鞋。'
  };
  strings.es = {
    skip:'Ir a los diseños',home:'Inicio de JIDOKAAN',mainMenu:'Navegación principal',mobileMenu:'Menú móvil',language:'Seleccionar idioma',menuOpen:'Abrir menú',menuClose:'Cerrar menú',navDetail:'Detalles',navCollection:'Colección',navAtelier:'El proceso',navOrder:'Tus botas de boxeo',
    heroKicker:'Botas de boxeo artesanales a medida',heroTitle1:'Tu boxeo.',heroTitle2:'Tu identidad.',heroDescription:'Tu estilo, en cada color y material.<br>Tu par empieza en JIDOKAAN.',heroLink:'Explora la colección',heroBrand:'JIDOKAAN · Por encargo',scroll:'Desliza para descubrir',statement:'Infinitas combinaciones.<br><span>Un par que solo habla de ti.</span>',
    detailIndex:'01 / Materiales y detalles',detailTitle:'Pequeños detalles.<br><em>Tu identidad.</em>',detailDescription:'Cuero, malla y acentos distintivos.<br>Cada elección da forma a tu diseño.',leather:'Cuero',leatherDetail:'Color y textura',mesh:'Malla',meshDetail:'La base del diseño',accent:'Acentos',accentDetail:'El toque final',focusIndex:'01 / Más de cerca',focusTitle:'Diseño cuidado.<br><em>Comodidad superior.</em>',focusDescription:'Más de 50 pruebas de horma durante dos años.<br>Hasta lograr un ajuste óptimo.',handmade:'Botas de boxeo artesanales JIDOKAAN',
    collectionIndex:'02 / Colección de diseños',examplesTitle:'Ejemplos de pedidos personalizados',collectionTitle:'Una silueta.<br><em>Tu propia expresión.</em>',collectionDescription:'Del blanco discreto a colores y estampados intensos.<br>Descubre la combinación que va contigo.',look0:'Blanco · Oro',look1:'Azul marino · Blanco',look2:'Rojo · Negro',look3:'Verde · Rojo',look4:'Floral · Negro',enlarge:'Ampliar ↗',exampleLabel:'Ejemplo de pedido personalizado',galleryDirection:'Desliza para explorar las combinaciones',identityCaption:'La identidad de JIDOKAAN hecha forma',
    atelierIndex:'03 / Hecho para ti',atelierTitle:'Tus elecciones.<br><em>Tu par.</em>',process1:'Elige tus colores',process1Description:'Explora combinaciones de color para cada parte en el simulador de diseño.',process2:'Define tu diseño',process2Description:'Revisa tu combinación y ajusta el diseño. Para estampados y materiales especiales, consulta la información sobre pedidos especiales.',process3:'Hazlo tuyo',process3Description:'Una vez elegido el diseño, sigue las instrucciones del pedido. Las condiciones de fabricación se indican durante el proceso.',
    orderIndex:'04 / Crea tus botas de boxeo',orderTitle:'Lleva tu estilo<br><em>al ring.</em>',orderButton:'Personaliza tu par',specialButton:'Pedidos especiales',orderNote:'Cuéntanos cómo imaginas tu par.',backTop:'Volver arriba',companyTitle:'Información de la empresa',companyNameLabel:'Empresa',companyName:'JIDOKAAN',ownerLabel:'Representante',owner:'Choi Taehoon',addressLabel:'Dirección',address:'2.ª planta, edificio principal, 36 Seongsui-ro 18-gil, Seongdong-gu, Seúl 04782, República de Corea',phoneLabel:'Teléfono',businessLabel:'Registro empresarial',commerceLabel:'Registro de venta en línea',commerce:'2018-Seúl Seongdong-0927',contactTitle:'Contacto',emailLabel:'Correo electrónico',contactPhoneLabel:'Teléfono',hoursLabel:'Atención al cliente',hours:'Lun–vie, 10:00–17:00 (hora de Corea)',closedLabel:'Sábados y festivos',closed:'Cerrado',brandDescription:'JIDOKAAN · Botas de boxeo artesanales a medida',
    closeImage:'Cerrar <span>×</span>',close:'Cerrar ×',dialogIndex:'Colección de diseños JIDOKAAN',exampleProduct:'Ejemplo de un pedido personalizado.',createCombination:'Crea tu combinación <span>↗</span>',specialIndex:'Pedidos especiales',specialTitle:'Exprésate a través del material.',specialDescription:'Diseños con estampados y materiales especiales.<br>El simulador de pedidos especiales está en preparación.',specialContact:'Atención al cliente: 010-3481-5598 ↗',introLabel:'Botas de boxeo personalizadas JIDOKAAN',heroAlt:'Bota de boxeo JIDOKAAN en blanco, negro y oro',detailAlt:'Cuero, malla y costuras de la bota blanca y dorada',galleryLabel:'Cinco ejemplos de pedidos personalizados',previous:'Diseño anterior',next:'Diseño siguiente',emblemAlt:'Emblema metálico JIDOKAAN',closeImageLabel:'Cerrar imagen ampliada',closeLabel:'Cerrar información',title:'JIDOKAAN — Botas de boxeo a tu manera',description:'Botas de boxeo artesanales y personalizadas JIDOKAAN. Expresa tu estilo a través de colores y materiales.'
  };
  for (const [lang,copy] of Object.entries(faqCopy)) Object.assign(strings[lang],copy);
  for (const [lang,copy] of Object.entries(specialCopy)) Object.assign(strings[lang],copy);
  const arrow='<span aria-hidden="true">↗</span>';
  for (const [lang,d] of Object.entries(strings)) {
    if (lang==='ko') continue;
    d.navOrderArrow=d.navOrder+' '+arrow;
    ['Detail','Collection','Atelier'].forEach((key,i)=>d['mobile'+key]=d['nav'+key]+` <span>0${i+1}</span>`);
    d.mobileOrder=d.navOrderArrow;
    d.heroKicker='<span class="fine-line"></span>'+d.heroKicker;
    d.heroLink+=' <span class="circle-arrow" aria-hidden="true">↗</span>';
    d.scroll='<span class="scroll-line" aria-hidden="true"></span>'+d.scroll;
    d.orderButton+=' '+arrow; d.specialButton+=' '+arrow;
    for(let i=0;i<root.querySelectorAll('.look').length;i++) {
      d['look'+i+'Alt']=d['look'+i];
      d['look'+i+'Open']=d.enlarge.replace(' ↗','')+': '+d['look'+i];
    }
  }
  for (const [lang,d] of Object.entries(strings)) {
    for(let i=0;i<root.querySelectorAll('.special-look').length;i++) {
      d[`specialLook${i}Alt`]=`${d[`specialLook${i}`]} — ${d.specialGalleryLabel}`;
      d[`specialLook${i}Open`]=d.enlarge.replace(' ↗','')+': '+d[`specialLook${i}`];
    }
  }

  const serviceCopy = {
    ko:['샵','주문조회','배송 안내','내 계정','브랜드','문의','이용약관','개인정보처리방침','관리자'],
    en:['Shop','Orders','Shipping','Account','Brand','Contact','Terms','Privacy','Admin'],
    ja:['ショップ','注文確認','配送案内','アカウント','ブランド','お問い合わせ','利用規約','プライバシー','管理者'],
    zh:['商店','查询订单','配送说明','我的账户','品牌','联系我们','使用条款','隐私政策','管理'],
    es:['Tienda','Pedidos','Envíos','Mi cuenta','Marca','Contacto','Condiciones','Privacidad','Admin']
  };
  for (const [lang, values] of Object.entries(serviceCopy)) {
    ['shopLink','ordersLink','shippingLink','accountLink','brandLink','contactLink','termsLink','privacyLink','adminLink'].forEach((key,i)=>strings[lang][key]=values[i]);
  }
  let locale='ko';
  const t=key=>strings[locale][key] ?? strings.ko[key] ?? key;
  const select=root.querySelector('#site-language');
  function applyLanguage(next) {
    locale=Object.hasOwn(strings,next)?next:'en';
    root.lang=locale==='zh'?'zh-CN':locale;
    root.querySelectorAll('[data-i18n]').forEach(el=>el.innerHTML=t(el.dataset.i18n));
    for(const attr of ['aria-label','alt']) root.querySelectorAll(`[data-i18n-${attr}]`).forEach(el=>el.setAttribute(attr,t(el.getAttribute(`data-i18n-${attr}`))));
    const toggle=root.querySelector('.menu-toggle');
    toggle.setAttribute('aria-label',t(toggle.getAttribute('aria-expanded')==='true'?'menuClose':'menuOpen'));
    select.value=locale;
    root.dispatchEvent(new CustomEvent('jidokaan:languagechange',{detail:{locale}}));
  }
  const onChange=()=>onLocaleChange(select.value);
  select.addEventListener('change',onChange);
  return {t, applyLanguage, get locale(){return locale;}, destroy(){select.removeEventListener('change',onChange);}};
}
